// 祭祖页「叫家人一起来」与「提醒我」共用的小工具。
// 不上传任何内容：邀请链接只带 ?invite=1，不带先人姓名；日历文件在浏览器里生成后直接下载。

// 分享给家人时用口语称呼，比牌位上的「先父」更自然
const SPOKEN = {
  father: '爸爸',
  mother: '妈妈',
  // 祖父母可能是爷爷奶奶，也可能是外公外婆，不替用户猜
  grandfather: '祖父',
  grandmother: '祖母',
  ancestors: '列祖列宗',
  spouse: '故去的爱人',
  child: '故去的孩子',
  general: '故人',
}

export function spokenName(slug) {
  return SPOKEN[slug] || '先人'
}

// 固定用正式网址，避免在测试环境或别的域名打开时把临时地址分享出去
export const SITE_ORIGIN = 'https://fopusha.com'

export function pageUrl() {
  return `${SITE_ORIGIN}${location.pathname}`
}

export function inviteUrl() {
  return `${pageUrl()}?invite=1`
}

// kind: 'ancestor' | 'buddha' | 'qiucai'；subject 是佛菩萨或财神的名字（祭祖用 slug 换成口语称呼）
export function inviteText(kind, slug, subject = '') {
  const url = inviteUrl()
  if (kind === 'buddha') return `我刚在网上给${subject}上了香，为家里人祈福。你也点开拜一拜吧，免费，不用注册：${url}`
  if (kind === 'qiucai') return `我刚在网上拜了${subject || '财神'}，求个好财运。你也来拜一拜，沾沾财气，免费，不用注册：${url}`
  const who = spokenName(slug)
  return `我刚在网上给${who}上了香、敬了酒。你要是也想${who}了，点开就能一起拜一拜，免费，不用注册：${url}`
}

// 邀请图：标题 + 二维码，微信里长按图片就能保存、转发，家人长按二维码直接打开
export async function inviteCard(kind, slug, subject = '') {
  const { toCanvas } = await import('qrcode')
  const W = 720, H = 960
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#3a2414')
  bg.addColorStop(1, '#170e08')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(242, 200, 121, 0.55)'
  ctx.lineWidth = 3
  ctx.strokeRect(24, 24, W - 48, H - 48)

  const serif = '"Noto Serif SC", "Songti SC", "SimSun", serif'
  const title = kind === 'ancestor' ? `一起来祭拜${spokenName(slug)}`
    : kind === 'qiucai' ? `一起来拜${subject || '财神'}` : `一起来拜${subject}`
  const sub = kind === 'ancestor' ? '回不了家，也能上一炷香、敬一杯酒'
    : kind === 'qiucai' ? '上香、献元宝，全家都沾沾财气' : '上一炷香，为家里人祈一份平安'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f5d9a0'
  ctx.font = `bold 56px ${serif}`
  ctx.fillText(title, W / 2, 150, W - 100)
  ctx.fillStyle = '#e8cfa6'
  ctx.font = `30px ${serif}`
  ctx.fillText(sub, W / 2, 215, W - 100)

  const qr = document.createElement('canvas')
  await toCanvas(qr, inviteUrl(), { width: 400, margin: 2, errorCorrectionLevel: 'M' })
  ctx.fillStyle = '#fff'
  ctx.fillRect(W / 2 - 220, 280, 440, 440)
  ctx.drawImage(qr, W / 2 - 200, 300, 400, 400)

  ctx.fillStyle = '#f5d9a0'
  ctx.font = `34px ${serif}`
  ctx.fillText('长按识别二维码，一起来拜', W / 2, 800)
  ctx.fillStyle = '#b9a07a'
  ctx.font = `24px ${serif}`
  ctx.fillText('fopusha.com · 免费 · 不用注册', W / 2, 870)
  return canvas.toDataURL('image/png')
}

// 邀请链接点开后，页面顶部的一句说明
export function inviteBanner(kind, slug, subject = '') {
  if (kind === 'buddha') return `家人邀请你一起礼拜${subject}。上一炷香、写一句祈愿，为家里人添一份福。`
  if (kind === 'qiucai') return `家人邀请你一起拜财神。上香、献元宝，给自己也添一份财气。`
  return `家人邀请你一起祭拜${spokenName(slug)}。点「祭祖供养」，上一炷香、敬一杯酒，心意就到了。`
}

export function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent)
}

// 节气按交节时刻换算成访客当地日期（冬至在美国是 21 日，在国内是 22 日）；农历节日按国内日历日期
// 每年要补一次新日期；拜佛页暂不提供提醒
const FESTIVALS = {
  ancestor: [
    { key: 'dongzhi', label: '冬至', instant: '2026-12-21T20:50:00Z' },
    { key: 'chuxi', label: '除夕', date: '2027-02-05' },
    { key: 'qingming', label: '清明', date: '2027-04-05' },
  ],
  qiucai: [
    { key: 'chunjie', label: '春节', date: '2027-02-06' },
    { key: 'yingcaishen', label: '正月初五迎财神', date: '2027-02-10' },
  ],
}

function localDate(instant) {
  const d = new Date(instant)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function upcomingFestivals(kind = 'ancestor', now = new Date()) {
  const today = localDate(now)
  return (FESTIVALS[kind] || [])
    .map((f) => ({ key: f.key, label: f.label, date: f.date || localDate(f.instant) }))
    .filter((f) => f.date >= today)
}

// 忌日按公历每年重复；今年已过就从明年开始
export function nextYearly(monthDay, now = new Date()) {
  const year = now.getFullYear()
  const thisYear = `${year}-${monthDay}`
  return thisYear >= localDate(now) ? thisYear : `${year + 1}-${monthDay}`
}

const compact = (date) => date.replaceAll('-', '')

function addDay(date) {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + 1)
  return localDate(d)
}

function escapeText(text) {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

// events: [{ date: 'YYYY-MM-DD', title, yearly }]
export function buildIcs(events, pageUrl) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//fopusha.com//family-care//ZH', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${compact(e.date)}-${Math.random().toString(36).slice(2)}@fopusha.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(addDay(e.date))}`,
      ...(e.yearly ? ['RRULE:FREQ=YEARLY'] : []),
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(`打开 ${pageUrl} 上一炷香、敬一杯酒。`)}`,
      `URL:${pageUrl}`,
      // 前一天上午 9 点提醒
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(e.title)}`, 'TRIGGER:-PT15H', 'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(content, filename = 'fopusha-祭祖提醒.ics') {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
