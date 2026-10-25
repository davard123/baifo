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

export function inviteUrl() {
  return `${location.origin}${location.pathname}?invite=1`
}

export function inviteText(slug) {
  const who = spokenName(slug)
  return `我刚在网上给${who}上了香、敬了酒。你要是也想${who}了，点开就能一起拜一拜，免费，不用注册：${inviteUrl()}`
}

export function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent)
}

// 节气按交节时刻换算成访客当地日期（冬至在美国是 21 日，在国内是 22 日）；农历节日按国内日历日期
const FESTIVALS = [
  { key: 'dongzhi', label: '冬至', instant: '2026-12-21T20:50:00Z' },
  { key: 'chuxi', label: '除夕', date: '2027-02-05' },
  { key: 'qingming', label: '清明', date: '2027-04-05' },
]

function localDate(instant) {
  const d = new Date(instant)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function upcomingFestivals(now = new Date()) {
  const today = localDate(now)
  return FESTIVALS
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
