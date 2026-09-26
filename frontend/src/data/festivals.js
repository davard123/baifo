// 首页节日祝福数据。日期均为公历 YYYY-MM-DD，按访客本地日期比较。
// 农历节日日期由 lunar-javascript 计算后写入（2026–2035）。
// start ~ end 为显示区间：一般为节日前 2 天至节日当天。
//
// tone: 'celebrate' 团圆吉祥类 | 'remember' 追思类（不写"快乐"）| 'devotion' 佛菩萨圣诞
// anim: 'moon' | 'lantern' | 'lotus' | 'candle' | 'glow'

const MID_AUTUMN_DATES = [
  '2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12',
  '2031-10-01', '2032-09-19', '2033-09-08', '2034-09-27', '2035-09-16',
]

function shiftDate(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

const MID_AUTUMN = {
  key: 'mid-autumn',
  name: '中秋',
  title: '中秋 · 月圆人团圆',
  lines: [
    '海上生明月，天涯共此时。',
    '愿你与家人平安团圆，也为远方的亲人点一盏心灯。',
  ],
  tone: 'celebrate',
  anim: 'moon',
  // 背景图由 ChatGPT 生成：月亮在左、右侧留白放文字
  image: {
    large: '/festivals/mid-autumn-2026-1200.webp',
    small: '/festivals/mid-autumn-2026-720.webp',
  },
  cta: { label: '为家人祈福', to: { path: '/', hash: '#blessing-pool-title' } },
}

export const FESTIVALS = MID_AUTUMN_DATES.map((date) => ({
  ...MID_AUTUMN,
  date,
  start: shiftDate(date, -2),
  end: date,
}))

export function localYmd(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function findActiveFestival(ymd) {
  return FESTIVALS.find((item) => item.start <= ymd && ymd <= item.end) || null
}
