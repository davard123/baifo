// 入宅吉日（/ruzhai-jiri/）：按月列出黄历上宜入宅、宜搬家（移徙）、宜开业（开市）的日子。
// 数据来自 almanac-days.js（lunar-javascript 的每日宜忌，scripts/generate-almanac.cjs 预先算好）。
import ALMANAC from './almanac-days.js'

export const RUZHAI_PATH = '/ruzhai-jiri'
const WEEK = '日一二三四五六'
const pad = (n) => String(n).padStart(2, '0')

export const RUZHAI_KINDS = [
  { code: 'R', key: 'ruzhai', label: '入宅', note: '新房第一次正式住进去' },
  { code: 'M', key: 'banjia', label: '搬家', note: '黄历上叫「移徙」' },
  { code: 'K', key: 'kaiye', label: '开业', note: '黄历上叫「开市」' },
]

export function monthKeys() {
  const months = new Set(Object.keys(ALMANAC.days).map((key) => key.slice(0, 7)))
  return [...months]
}

export function isMonthKey(value) {
  return /^\d{4}-\d{2}$/.test(value || '') && monthKeys().includes(value)
}

export function monthLabel(month) {
  const [y, m] = month.split('-').map(Number)
  return `${y}年${m}月`
}

export function currentMonthKey(date = new Date()) {
  const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
  const months = monthKeys()
  if (months.includes(key)) return key
  return key < months[0] ? months[0] : months.at(-1)
}

// 某月每天的宜忌；kind 为 R/M/K 时只返回宜该事的日子
export function monthDays(month, kind = '') {
  return Object.entries(ALMANAC.days)
    .filter(([key]) => key.startsWith(month))
    .map(([key, [lunar, , marks, good, chong]]) => {
      const [y, m, d] = key.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      return {
        key,
        day: d,
        solar: `${m}月${d}日`,
        week: `星期${WEEK[date.getDay()]}`,
        weekend: date.getDay() === 0 || date.getDay() === 6,
        lunar: lunar.replace(/^.{3}/, ''),
        marks: marks ? marks.split('、') : [],
        good: RUZHAI_KINDS.filter((item) => good.includes(item.code)).map((item) => item.label),
        chong,
      }
    })
    .filter((day) => !kind || day.good.includes(RUZHAI_KINDS.find((item) => item.code === kind)?.label))
}

export function monthSummary(month) {
  const days = monthDays(month)
  const count = (label) => days.filter((day) => day.good.includes(label)).length
  return { ruzhai: count('入宅'), banjia: count('搬家'), kaiye: count('开业'), total: days.length }
}

export const RUZHAI_STEPS = [
  {
    title: '先挑日子',
    text: '在黄历上宜入宅（或宜移徙）的日子里，挑一个家里人都方便的。再看当天「冲」哪个生肖，家里有人属这个生肖的，习惯上会换一天。在美国上班族多，周末的吉日最抢手，可以早点定。',
  },
  {
    title: '入宅前一两天打扫',
    text: '把新房里外打扫干净，开窗通风。民间讲究旧家的东西不要空手进门，可以先搬米、水、新扫帚和一盆绿植。',
  },
  {
    title: '入宅当天：开灯、开火、煮一锅甜的',
    text: '进门后把屋里的灯全打开，取「光明兴旺」的意思；第一件事在厨房开火，煮一锅汤圆或甜汤，寓意日子甜、人丁圆满。公寓、Condo 不方便放鞭炮，开灯开火就够了。',
  },
  {
    title: '敬一炷香、请家人吃一顿',
    text: '家里供佛或供祖先的，可以在客厅安好位，敬一炷香；不方便点香的，用电子香烛或鲜花代替。晚上请家人朋友来吃一顿饭，叫「暖屋」。',
  },
  {
    title: '在美国要注意的',
    text: '很多 HOA 和公寓不允许放鞭炮、烧纸，先看一下管理规定；室内烟雾报警器比较灵敏，点香时记得开窗。',
  },
]

export const RUZHAI_FAQS = [
  { q: '入宅和搬家有什么区别？', a: '黄历上「入宅」指新房第一次正式住进去，「移徙」指搬家、迁移。买了新房第一次入住，看「宜入宅」；租房换住处，看「宜移徙」。很多人两样都看。' },
  { q: '日子上写「冲虎」是什么意思？', a: '每天都会「冲」一个生肖，家里有人属这个生肖的，习惯上会避开这一天入宅或办大事。这是民间习俗，不必过分在意。' },
  { q: '在美国入宅要按北京时间的日子吗？', a: '一般按房子所在地的日期来看，不需要换算成北京时间。' },
  { q: '挑不到吉日能不能搬？', a: '可以。吉日是讨个好彩头，过户、交屋、请搬家公司的时间更实际。也可以先把东西搬进去，在吉日那天再正式「入宅」：开灯、开火、请家人吃饭。' },
]
