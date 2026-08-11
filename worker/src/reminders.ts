// 忌日 / 清明 年度提醒
//
// ⚠️ 默认不启用。启用前需要三步（见 worker/README-reminders.md）：
//    1. 在 Supabase 跑 migrations/001_reminders.sql
//    2. 在 wrangler.toml 打开 [triggers] crons
//    3. 确认隐私说明已经写明「邮箱会被保存用于年度提醒」
//
// 为什么单独成文件：这是唯一一处会「主动」给用户发信的逻辑（其余都是用户操作后的
// 即时回执）。主动发信的合规要求不同 —— 必须可退订、必须防重发、必须能一键停。

export type ReminderBindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  RESEND_API_KEY: string
  RESEND_FROM?: string
}

const SITE_NAME = '礼佛祈愿'
const SITE_URL = 'https://www.fopusha.com'

export type Subscription = {
  id: number
  email: string
  username: string
  ancestor_name: string
  relationship: string
  death_month: number | null
  death_day: number | null
  unsub_token: string
  last_sent_on: string | null
}

function sb(env: ReminderBindings, path: string, init?: RequestInit) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

// 清明固定按 4 月 4 日算。真实清明是 4/4–4/6 浮动，
// 但提前或当天到都合适，不值得为此引入天文历算依赖。
const QINGMING = { month: 4, day: 4 }

/** 用北京时间取「今天」——用户在国内或按国内节气过节。 */
export function todayInBeijing(now = new Date()): { y: number; m: number; d: number; iso: string } {
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const y = bj.getUTCFullYear()
  const m = bj.getUTCMonth() + 1
  const d = bj.getUTCDate()
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return { y, m, d, iso }
}

export function reminderEmailHtml(sub: Subscription, kind: 'anniversary' | 'qingming'): string {
  const who = sub.ancestor_name || sub.relationship || '先人'
  const occasion = kind === 'qingming' ? '清明将至' : `今天是${who}的忌日`
  const lead =
    kind === 'qingming'
      ? `清明将至，若不便回乡祭扫，也可以在线为${who}上一炷香、献一束花，留下一段追思。`
      : `今天是${who}的忌日。若此刻方便，可以静一静，为${who}上香、回向。`

  const unsubUrl = `${SITE_URL}/api/reminders/unsubscribe?token=${encodeURIComponent(sub.unsub_token)}`

  return `<!doctype html><html lang="zh-CN"><body style="margin:0;padding:0;background:#14101b;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#14101b;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1d1727;border:1px solid rgba(242,200,121,.22);border-radius:16px;padding:32px 28px;font-family:'Noto Serif SC',Songti SC,serif;color:#f2ece0;">
  <tr><td style="font-size:12px;letter-spacing:.22em;color:#d9a94f;text-transform:uppercase;padding-bottom:14px;">${SITE_NAME}</td></tr>
  <tr><td style="font-size:22px;font-weight:700;color:#fdecc1;padding-bottom:14px;">${occasion}</td></tr>
  <tr><td style="font-size:15px;line-height:1.9;color:#b6abc0;padding-bottom:22px;">${lead}</td></tr>
  <tr><td style="padding-bottom:26px;">
    <a href="${SITE_URL}/ancestors/" style="display:inline-block;padding:12px 24px;border-radius:999px;background:linear-gradient(135deg,#e0b76e,#f0d091);color:#2a1c0c;text-decoration:none;font-size:15px;font-weight:600;">进入祭拜</a>
  </td></tr>
  <tr><td style="border-top:1px solid rgba(242,200,121,.16);padding-top:16px;font-size:12px;line-height:1.8;color:#877d94;">
    这封信因为你在 ${SITE_NAME} 订阅了${who}的年度追思提醒而发送，每年最多两封。<br>
    <a href="${unsubUrl}" style="color:#d9a94f;">不再接收提醒</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

async function sendEmail(env: ReminderBindings, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM ?? `${SITE_NAME} <noreply@fopusha.com>`,
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`)
}

/**
 * 每日定时任务：找出今天该提醒的订阅并发信。
 * 幂等：last_sent_on 等于今天的直接跳过，重复触发不会重复发信。
 */
export async function runDailyReminders(env: ReminderBindings, now = new Date()) {
  const { m, d, iso } = todayInBeijing(now)
  const isQingming = m === QINGMING.month && d === QINGMING.day

  // 今天是某人的忌日 →（可选）今天是清明 → 两类订阅一起取
  const filters = [`and(death_month.eq.${m},death_day.eq.${d},notify_anniversary.eq.true)`]
  if (isQingming) filters.push('notify_qingming.eq.true')

  const query = `reminder_subscriptions?or=(${filters.join(',')})&select=*`
  const res = await sb(env, query)
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`)

  const subs = (await res.json()) as Subscription[]
  const results = { considered: subs.length, sent: 0, skipped: 0, failed: 0 }

  for (const sub of subs) {
    if (sub.last_sent_on === iso) { results.skipped += 1; continue }

    const isAnniversary = sub.death_month === m && sub.death_day === d
    const kind = isAnniversary ? 'anniversary' : 'qingming'
    const who = sub.ancestor_name || sub.relationship || '先人'
    const subject = kind === 'qingming' ? `清明将至 | ${SITE_NAME}` : `今天是${who}的忌日 | ${SITE_NAME}`

    try {
      await sendEmail(env, sub.email, subject, reminderEmailHtml(sub, kind))
      await sb(env, `reminder_subscriptions?id=eq.${sub.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ last_sent_on: iso }),
      })
      results.sent += 1
    } catch {
      // 单封失败不该拖垮整批
      results.failed += 1
    }
  }

  return results
}

/** 退订：令牌命中即删除订阅。返回一个可直接展示的 HTML 页面。 */
export async function handleUnsubscribe(env: ReminderBindings, token: string): Promise<Response> {
  const page = (title: string, body: string, status = 200) =>
    new Response(
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | ${SITE_NAME}</title></head>
<body style="margin:0;background:#14101b;color:#f2ece0;font-family:'Noto Serif SC',Songti SC,serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;">
<div style="max-width:420px;text-align:center;line-height:1.9;">
<h1 style="font-size:20px;color:#fdecc1;margin:0 0 12px;">${title}</h1>
<p style="color:#b6abc0;font-size:15px;margin:0 0 22px;">${body}</p>
<a href="${SITE_URL}/" style="color:#d9a94f;font-size:14px;">返回 ${SITE_NAME}</a>
</div></body></html>`,
      { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )

  if (!token) return page('链接不完整', '这个退订链接缺少令牌，请直接使用邮件里的完整链接。', 400)

  const res = await sb(env, `reminder_subscriptions?unsub_token=eq.${encodeURIComponent(token)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  })
  if (!res.ok) return page('退订失败', '服务器出了点问题，请稍后再试一次。', 500)

  const removed = (await res.json()) as unknown[]
  if (!removed.length) return page('已经退订过了', '这个提醒此前已经取消，你不会再收到它。')

  return page('已取消提醒', '你不会再收到这条年度追思提醒。随时可以回到站内重新订阅。')
}
