import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  RESEND_API_KEY: string
  RESEND_FROM?: string
}

const ADMIN_EMAIL = 'lodaviddai@gmail.com'
const SITE_NAME = '礼佛祈愿'
const SITE_URL = 'https://www.fopusha.com'
const GOLD = '#c8a96e'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['*'],
}))

// ---- Supabase PostgREST helpers ---------------------------------------------

function sb(env: Bindings, path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers })
}

// ---- Resend email helper -----------------------------------------------------

async function sendEmail(env: Bindings, opts: {
  to: string | string[]
  subject: string
  html: string
}): Promise<void> {
  const from = env.RESEND_FROM ?? 'onboarding@resend.dev'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  })
}

// ---- Email templates ---------------------------------------------------------

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
      <!-- Header -->
      <tr>
        <td style="background:#1a1a1a;padding:28px 40px;text-align:center;">
          <p style="margin:0;color:${GOLD};font-size:13px;letter-spacing:.3em;text-transform:uppercase;font-weight:500;">
            ${SITE_NAME}
          </p>
          <p style="margin:4px 0 0;color:#888;font-size:11px;letter-spacing:.15em;">
            fopusha.com
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          ${content}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#faf8f5;padding:20px 40px;text-align:center;border-top:1px solid #ede8e0;">
          <p style="margin:0;color:#999;font-size:11px;line-height:1.6;">
            此邮件由 <a href="${SITE_URL}" style="color:${GOLD};text-decoration:none;">${SITE_URL}</a> 自动发送，请勿直接回复。
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #ede8e0;margin:24px 0;" />`
}

function badge(text: string): string {
  return `<span style="display:inline-block;background:#faf8f5;border:1px solid #ede8e0;color:#666;font-size:11px;letter-spacing:.12em;padding:3px 10px;border-radius:2px;text-transform:uppercase;">${text}</span>`
}

function blockquote(text: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;">
    <tr>
      <td style="width:3px;background:${GOLD};border-radius:2px;">&nbsp;</td>
      <td style="padding:12px 16px;color:#555;font-size:15px;line-height:1.7;">${text}</td>
    </tr>
  </table>`
}

// ── 用户收到的祈愿确认 ────────────────────────────────────────────────────────
function wishConfirmationHtml(username: string, buddha: string, wish: string): string {
  return emailWrapper(`
    <p style="margin:0 0 4px;color:#999;font-size:12px;letter-spacing:.2em;text-transform:uppercase;">祈愿确认</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1a1a1a;letter-spacing:.05em;">您的祈愿已提交</h1>
    <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.8;">
      ${username} 您好，
    </p>
    <p style="margin:0 0 8px;color:#666;font-size:14px;">您向 ${badge(buddha || '诸佛菩萨')} 的祈愿已成功记录：</p>
    ${blockquote(wish)}
    ${divider()}
    <p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.8;">
      诚心祈愿，功德回向。愿您所求蒙佛菩萨加持，心想事成，平安吉祥。
    </p>
    <p style="margin:24px 0 0;text-align:center;">
      <a href="${SITE_URL}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.2em;padding:12px 32px;text-transform:uppercase;">
        返回礼佛祈愿
      </a>
    </p>
  `)
}

// ── 用户收到的祭祖确认 ────────────────────────────────────────────────────────
function ancestorConfirmationHtml(username: string, ancestorName: string, relationship: string, wish: string): string {
  return emailWrapper(`
    <p style="margin:0 0 4px;color:#999;font-size:12px;letter-spacing:.2em;text-transform:uppercase;">祭祖确认</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1a1a1a;letter-spacing:.05em;">您的祭祖祈愿已提交</h1>
    <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.8;">
      ${username} 您好，
    </p>
    <p style="margin:0 0 8px;color:#666;font-size:14px;">
      您为 ${badge(ancestorName || '先人')}（${relationship}）的追思已成功记录：
    </p>
    ${blockquote(wish)}
    ${divider()}
    <p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.8;">
      慎终追远，思亲之情长存。愿先人在极乐世界安享清净，福泽庇护后代子孙。
    </p>
    <p style="margin:24px 0 0;text-align:center;">
      <a href="${SITE_URL}/ancestors" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.2em;padding:12px 32px;text-transform:uppercase;">
        返回拜祭先人
      </a>
    </p>
  `)
}

// ── 管理员收到的联系留言通知 ──────────────────────────────────────────────────
function adminContactHtml(name: string, email: string, message: string): string {
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'America/Los_Angeles', hour12: false })
  return emailWrapper(`
    <p style="margin:0 0 4px;color:#999;font-size:12px;letter-spacing:.2em;text-transform:uppercase;">新留言</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1a1a1a;">来自 ${name} 的留言</h1>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#faf8f5;border:1px solid #ede8e0;border-radius:3px;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 20px;border-bottom:1px solid #ede8e0;">
          <span style="color:#999;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-right:12px;">姓名</span>
          <span style="color:#333;font-size:14px;">${name}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 20px;border-bottom:1px solid #ede8e0;">
          <span style="color:#999;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-right:12px;">邮箱</span>
          <a href="mailto:${email}" style="color:${GOLD};font-size:14px;text-decoration:none;">${email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 20px;">
          <span style="color:#999;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-right:12px;">时间</span>
          <span style="color:#333;font-size:14px;">${now}（LA）</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#666;font-size:13px;letter-spacing:.1em;text-transform:uppercase;">留言内容</p>
    ${blockquote(message)}
    <p style="margin:24px 0 0;text-align:center;">
      <a href="mailto:${email}?subject=Re: 您好 ${name}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.2em;padding:12px 32px;text-transform:uppercase;">
        回复 ${name}
      </a>
    </p>
  `)
}

// ── 用户收到的留言自动回复 ────────────────────────────────────────────────────
function contactAutoReplyHtml(name: string, message: string): string {
  return emailWrapper(`
    <p style="margin:0 0 4px;color:#999;font-size:12px;letter-spacing:.2em;text-transform:uppercase;">已收到您的留言</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1a1a1a;">感谢您联系我们</h1>
    <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.8;">${name} 您好，</p>
    <p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.8;">
      我们已收到您的留言，通常会在 1–2 个工作日内回复。您的留言如下：
    </p>
    ${blockquote(message)}
    ${divider()}
    <p style="margin:0;color:#666;font-size:14px;line-height:1.8;">
      如有紧急事项，可直接发邮件至
      <a href="mailto:${ADMIN_EMAIL}" style="color:${GOLD};text-decoration:none;">${ADMIN_EMAIL}</a>。
    </p>
    <p style="margin:24px 0 0;text-align:center;">
      <a href="${SITE_URL}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.2em;padding:12px 32px;text-transform:uppercase;">
        访问礼佛祈愿
      </a>
    </p>
  `)
}

// ---- Validation helpers ------------------------------------------------------

function parseLimit(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10)
  if (Number.isNaN(n)) return 15
  return Math.min(50, Math.max(1, n))
}

function requireNonEmpty(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('不能为空')
  return value.trim()
}

function asInt(value: unknown, fallback = 30): number {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isNaN(n) ? fallback : n
}

function asStr(value: unknown): string {
  return value == null ? '' : String(value)
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// ---- Routes -----------------------------------------------------------------

app.get('/', (c) => c.json({ status: 'ok' }))

app.get('/wishes', async (c) => {
  const limit = parseLimit(c.req.query('limit'))
  const username = c.req.query('username')
  let path = `users?select=id,username,age,wish,buddha,blessing,target,created_at&order=id.desc&limit=${limit}`
  if (username?.trim()) path += `&username=eq.${encodeURIComponent(username.trim())}`
  const res = await sb(c.env, path)
  if (!res.ok) return c.json({ detail: await res.text() }, 500)
  return c.json(await res.json())
})

app.post('/wishes', async (c) => {
  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { return c.json({ detail: '无效的请求体' }, 422) }
  let payload
  try {
    payload = {
      username: requireNonEmpty(body.username),
      age: asInt(body.age),
      wish: requireNonEmpty(body.wish),
      buddha: asStr(body.buddha),
      blessing: asStr(body.blessing),
      target: asStr(body.target),
    }
  } catch (e) { return c.json({ detail: (e as Error).message }, 422) }

  const res = await sb(c.env, 'users', { method: 'POST', body: JSON.stringify(payload) })
  if (!res.ok) return c.json({ detail: await res.text() }, 500)

  const email = asStr(body.email)
  if (email && isValidEmail(email)) {
    sendEmail(c.env, {
      to: email,
      subject: `您的祈愿已提交 | ${SITE_NAME}`,
      html: wishConfirmationHtml(payload.username, payload.buddha, payload.wish),
    })
  }
  return c.json({ status: 'success' })
})

app.get('/ancestor-wishes', async (c) => {
  const limit = parseLimit(c.req.query('limit'))
  const username = c.req.query('username')
  let path = `ancestor_wishes?select=id,username,age,ancestor,ancestor_name,relationship,wish,created_at&order=id.desc&limit=${limit}`
  if (username?.trim()) path += `&username=eq.${encodeURIComponent(username.trim())}`
  const res = await sb(c.env, path)
  if (!res.ok) return c.json({ detail: await res.text() }, 500)
  return c.json(await res.json())
})

app.post('/ancestor-wishes', async (c) => {
  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { return c.json({ detail: '无效的请求体' }, 422) }
  let payload
  try {
    payload = {
      username: requireNonEmpty(body.username),
      age: asInt(body.age),
      ancestor: asStr(body.ancestor),
      ancestor_name: asStr(body.ancestor_name),
      relationship: asStr(body.relationship),
      wish: requireNonEmpty(body.wish),
    }
  } catch (e) { return c.json({ detail: (e as Error).message }, 422) }

  const res = await sb(c.env, 'ancestor_wishes', { method: 'POST', body: JSON.stringify(payload) })
  if (!res.ok) return c.json({ detail: await res.text() }, 500)

  const email = asStr(body.email)
  if (email && isValidEmail(email)) {
    sendEmail(c.env, {
      to: email,
      subject: `您的祭祖祈愿已提交 | ${SITE_NAME}`,
      html: ancestorConfirmationHtml(
        payload.username,
        payload.ancestor_name || payload.ancestor,
        payload.relationship,
        payload.wish,
      ),
    })
  }
  return c.json({ status: 'success' })
})

// ---- Contact form -----------------------------------------------------------

app.post('/contact', async (c) => {
  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { return c.json({ detail: '无效的请求体' }, 422) }

  const name = asStr(body.name).trim()
  const email = asStr(body.email).trim()
  const message = asStr(body.message).trim()

  if (!name || !email || !message) return c.json({ detail: '请填写姓名、邮箱和留言' }, 422)
  if (!isValidEmail(email)) return c.json({ detail: '邮箱格式不正确' }, 422)

  await sendEmail(c.env, {
    to: ADMIN_EMAIL,
    subject: `${SITE_NAME} - 新留言：${name}`,
    html: adminContactHtml(name, email, message),
  })

  sendEmail(c.env, {
    to: email,
    subject: `已收到您的留言 | ${SITE_NAME}`,
    html: contactAutoReplyHtml(name, message),
  })

  return c.json({ status: 'success' })
})

export default app
