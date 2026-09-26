// 生成 src/data/festival-dates.json（2026–2035 各节日公历日期）
// 用法：npm i --no-save lunar-javascript && node scripts/generate-festival-dates.cjs > src/data/festival-dates.json
const { Lunar, Solar } = require('lunar-javascript')

const YEARS = []
for (let y = 2026; y <= 2035; y++) YEARS.push(y)

const pad = (n) => String(n).padStart(2, '0')
const fmt = (s) => `${s.getYear()}-${pad(s.getMonth())}-${pad(s.getDay())}`

// 农历某月某日；day=30 而当月只有 29 天时取廿九
function lunarDay(y, m, d) {
  try {
    return fmt(Lunar.fromYmd(y, m, d).getSolar())
  } catch (e) {
    if (d === 30) return fmt(Lunar.fromYmd(y, m, 29).getSolar())
    throw e
  }
}

// 节气（清明 / 冬至）：在该月逐日查找
function jieqi(y, name) {
  const month = name === '清明' ? 4 : 12
  for (let d = 1; d <= 31; d++) {
    const solar = Solar.fromYmd(y, month, d)
    if (solar.getLunar().getJieQi() === name) return fmt(solar)
  }
  throw new Error(`${name} ${y}`)
}

// 某月第 n 个星期 w（0=周日）
function nthWeekday(y, month, w, n) {
  const d = new Date(Date.UTC(y, month - 1, 1))
  const offset = (w - d.getUTCDay() + 7) % 7
  return `${y}-${pad(month)}-${pad(1 + offset + (n - 1) * 7)}`
}

const out = {
  // 春节以正月初一为准；除夕 = 初一前一天
  spring: YEARS.map((y) => lunarDay(y, 1, 1)),
  lantern: YEARS.map((y) => lunarDay(y, 1, 15)),
  qingming: YEARS.map((y) => jieqi(y, '清明')),
  duanwu: YEARS.map((y) => lunarDay(y, 5, 5)),
  qixi: YEARS.map((y) => lunarDay(y, 7, 7)),
  zhongyuan: YEARS.map((y) => lunarDay(y, 7, 15)),
  'mid-autumn': YEARS.map((y) => lunarDay(y, 8, 15)),
  chongyang: YEARS.map((y) => lunarDay(y, 9, 9)),
  hanyi: YEARS.map((y) => lunarDay(y, 10, 1)),
  dongzhi: YEARS.map((y) => jieqi(y, '冬至')),
  // 腊八在农历上一年腊月，可能落在公历次年 1 月；按公历年份收集
  laba: YEARS.map((y) => lunarDay(y - 1, 12, 8)).concat([lunarDay(2035, 12, 8)]).filter((d) => d >= '2026-01-01'),
  'guanyin-birth': YEARS.map((y) => lunarDay(y, 2, 19)),
  'guanyin-enlight': YEARS.map((y) => lunarDay(y, 6, 19)),
  'guanyin-renounce': YEARS.map((y) => lunarDay(y, 9, 19)),
  puxian: YEARS.map((y) => lunarDay(y, 2, 21)),
  wenshu: YEARS.map((y) => lunarDay(y, 4, 4)),
  fodan: YEARS.map((y) => lunarDay(y, 4, 8)),
  dizang: YEARS.map((y) => lunarDay(y, 7, 30)),
  yaoshi: YEARS.map((y) => lunarDay(y, 9, 30)),
  amituo: YEARS.map((y) => lunarDay(y, 11, 17)),
  newyear: YEARS.map((y) => `${y}-01-01`),
  mothers: YEARS.map((y) => nthWeekday(y, 5, 0, 2)),
  fathers: YEARS.map((y) => nthWeekday(y, 6, 0, 3)),
  july4: YEARS.map((y) => `${y}-07-04`),
  thanksgiving: YEARS.map((y) => nthWeekday(y, 11, 4, 4)),
}

console.log(JSON.stringify(out, null, 1))
