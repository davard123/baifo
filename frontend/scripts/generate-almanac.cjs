// 生成 src/data/almanac-days.js：每天的农历日期、喜神方位、节日节气、宜入宅/搬家/开业、当日冲的生肖。
// 输出成 JS 模块而不是 JSON，因为构建脚本（预渲染、sitemap）在 Node 里也要读它。
// 财神方位不在这里，统一用 src/data/qiucai.js 的 caishenDirection()，两边已核对一致（2026-11 ～ 2027-12 共 426 天）。
// 用法：npm i --no-save lunar-javascript && node scripts/generate-almanac.cjs > src/data/almanac-days.js
// 范围到期前（2027 年底）把 END 往后延一年重新生成即可。
const { Solar } = require('lunar-javascript')

const START = [2026, 11, 1]
const END = [2027, 12, 31]
const pad = (n) => String(n).padStart(2, '0')

// 只保留华人常用、和拜财神祭祖相关的节日，避免页面堆一串冷门节日
const KEEP = new Set(['除夕', '春节', '元宵节', '龙头节', '端午节', '七夕节', '中元节', '中秋节', '重阳节', '腊八节', '小年'])

const days = {}
const start = Date.UTC(START[0], START[1] - 1, START[2])
const end = Date.UTC(END[0], END[1] - 1, END[2])
for (let t = start; t <= end; t += 86400000) {
  const d = new Date(t)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const lunar = Solar.fromYmd(y, m, day).getLunar()
  const marks = [...lunar.getFestivals(), ...lunar.getOtherFestivals()].filter((name) => KEEP.has(name))
  if (lunar.getMonth() === 1 && lunar.getDay() === 5) marks.push('迎财神')
  if (lunar.getMonth() === 10 && lunar.getDay() === 1) marks.push('寒衣节')
  const jieqi = lunar.getJieQi()
  if (jieqi) marks.push(jieqi)
  // 宜：R 入宅、M 移徙（搬家）、K 开市（开业）
  const yi = lunar.getDayYi()
  const good = [['入宅', 'R'], ['移徙', 'M'], ['开市', 'K']].filter(([name]) => yi.includes(name)).map(([, c]) => c).join('')
  days[`${y}-${pad(m)}-${pad(day)}`] = [
    `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    lunar.getDayPositionXiDesc(),
    marks.join('、'),
    good,
    lunar.getDayChongShengXiao(),
  ]
}

const payload = JSON.stringify({ start: Object.keys(days)[0], end: Object.keys(days).at(-1), days })
process.stdout.write(`// 自动生成，勿手改。见 scripts/generate-almanac.cjs
export default ${payload}
`)
