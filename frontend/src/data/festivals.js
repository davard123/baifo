// 首页节日祝福数据。日期均为公历 YYYY-MM-DD，按访客本地日期比较。
// 各节日日期见 festival-dates.json（lunar-javascript 计算，2026–2035，生成脚本 scripts/generate-festival-dates.cjs）。
//
// 显示区间：节日前 2 天至节日后 2 天（春节为除夕前 2 天至正月初七）。
// 多个节日同时在显示期内时：当天正是某个节日的，显示那个节日；否则显示日期最晚的（新节日顶掉旧节日）。
//
// tone: 'celebrate' 团圆吉祥类 | 'remember' 追思类（不写"快乐"）| 'devotion' 佛菩萨圣诞
// 背景图由 ChatGPT 生成：主体在左、右侧留深色空白放文字。

import DATES from './festival-dates.json'

const BLESSING = { path: '/', hash: '#blessing-pool-title' }
const ANCESTORS = '/ancestors/'

const img = (key) => ({
  large: `/festivals/${key}-2026-1200.webp`,
  small: `/festivals/${key}-2026-720.webp`,
})

const DEFS = [
  // ── 中国传统节日 ──
  {
    key: 'spring', name: '春节', title: '春节 · 新春纳福', tone: 'celebrate', image: img('spring'),
    lines: ['爆竹声中一岁除，春风送暖入屠苏。', '正月初一也是弥勒佛圣诞，愿新的一年欢喜自在、家宅平安。'],
    cta: { label: '礼敬弥勒佛', to: '/buddha/maitreya/' },
    // 除夕前 2 天至正月初七
    before: 3, after: 6,
  },
  {
    key: 'lantern', name: '元宵', title: '元宵 · 月圆灯明', tone: 'celebrate', image: img('lantern'),
    lines: ['东风夜放花千树，一年明月打头圆。', '点一盏心灯，愿家人团圆、前路光明。'],
    cta: { label: '为家人祈福', to: BLESSING },
  },
  {
    key: 'qingming', name: '清明', title: '清明 · 慎终追远', tone: 'remember', image: img('qingming'),
    lines: ['清明时节，追思先人。', '不能回乡扫墓，也可以在这里为先人献一束花、点一炷心香。'],
    cta: { label: '为先人祭拜', to: ANCESTORS },
  },
  {
    key: 'duanwu', name: '端午', title: '端午 · 安康', tone: 'celebrate', image: img('duanwu'),
    lines: ['五月初五，艾草悬门，粽香满屋。', '愿你与家人身体安康，远离病苦。'],
    cta: { label: '为家人祈福', to: BLESSING },
  },
  {
    key: 'qixi', name: '七夕', title: '七夕 · 良缘', tone: 'celebrate', image: img('qixi'),
    lines: ['金风玉露一相逢，便胜却人间无数。', '愿有情人彼此珍惜，家庭和睦。'],
    cta: { label: '祈愿良缘', to: BLESSING },
  },
  {
    key: 'zhongyuan', name: '中元', title: '中元 · 盂兰盆节', tone: 'remember', image: img('zhongyuan'),
    lines: ['七月十五，佛门称盂兰盆节，是孝亲报恩的日子。', '为历代先人与一切亡灵回向，愿离苦得乐。'],
    cta: { label: '为先人回向', to: ANCESTORS },
  },
  {
    key: 'mid-autumn', name: '中秋', title: '中秋 · 月圆人团圆', tone: 'celebrate', image: img('mid-autumn'),
    lines: ['海上生明月，天涯共此时。', '愿你与家人平安团圆，也为远方的亲人点一盏心灯。'],
    cta: { label: '为家人祈福', to: BLESSING },
  },
  {
    key: 'chongyang', name: '重阳', title: '重阳 · 敬老思亲', tone: 'remember', image: img('chongyang'),
    lines: ['独在异乡为异客，每逢佳节倍思亲。', '愿家中长辈健康长寿，也为已故的长辈寄一份思念。'],
    cta: { label: '为先人祭拜', to: ANCESTORS },
  },
  {
    key: 'hanyi', name: '寒衣节', title: '寒衣节 · 送暖思亲', tone: 'remember', image: img('hanyi'),
    lines: ['十月初一，天气转凉，古人在这一天为先人送寒衣。', '天冷了，也为远去的亲人寄一份温暖。'],
    cta: { label: '为先人祭拜', to: ANCESTORS },
  },
  {
    key: 'dongzhi', name: '冬至', title: '冬至 · 冬至大如年', tone: 'remember', image: img('dongzhi'),
    lines: ['冬至阳生，是一年中白天最短的一天。', '许多家庭在这天祭祖团聚，愿先人安息，家人安康。'],
    cta: { label: '为先人祭拜', to: ANCESTORS },
  },
  {
    key: 'laba', name: '腊八', title: '腊八 · 释迦牟尼佛成道日', tone: 'devotion', image: img('laba'),
    lines: ['腊月初八，佛陀于菩提树下证悟成道。', '喝一碗腊八粥，礼敬本师，愿众生开启智慧。'],
    cta: { label: '礼敬释迦牟尼佛', to: '/buddha/shakyamuni/' },
  },

  // ── 佛菩萨圣诞日 ──
  {
    key: 'guanyin-birth', name: '观音菩萨圣诞', title: '观音菩萨圣诞', tone: 'devotion', image: img('guanyin'),
    lines: ['千处祈求千处应，苦海常作渡人舟。', '二月十九，礼敬大悲观世音菩萨，愿你与家人平安吉祥。'],
    cta: { label: '礼敬观音菩萨', to: '/buddha/guanyin/' },
  },
  {
    key: 'guanyin-enlight', name: '观音菩萨成道日', title: '观音菩萨成道日', tone: 'devotion', image: img('guanyin'),
    lines: ['千处祈求千处应，苦海常作渡人舟。', '六月十九，礼敬大悲观世音菩萨，愿众生离苦得乐。'],
    cta: { label: '礼敬观音菩萨', to: '/buddha/guanyin/' },
  },
  {
    key: 'guanyin-renounce', name: '观音菩萨出家日', title: '观音菩萨出家日', tone: 'devotion', image: img('guanyin'),
    lines: ['千处祈求千处应，苦海常作渡人舟。', '九月十九，礼敬大悲观世音菩萨，愿以慈悲心待人。'],
    cta: { label: '礼敬观音菩萨', to: '/buddha/guanyin/' },
  },
  {
    key: 'puxian', name: '普贤菩萨圣诞', title: '普贤菩萨圣诞', tone: 'devotion', image: img('puxian'),
    lines: ['二月廿一，礼敬大行普贤菩萨。', '十大愿王导归极乐，愿你把善愿落实在每天的言行里。'],
    cta: { label: '礼敬普贤菩萨', to: '/buddha/samantabhadra/' },
  },
  {
    key: 'wenshu', name: '文殊菩萨圣诞', title: '文殊菩萨圣诞', tone: 'devotion', image: img('wenshu'),
    lines: ['四月初四，礼敬大智文殊菩萨。', '愿学业与工作开启智慧、明辨是非。'],
    cta: { label: '礼敬文殊菩萨', to: '/buddha/manjushri/' },
  },
  {
    key: 'fodan', name: '佛诞', title: '佛诞 · 浴佛节', tone: 'devotion', image: img('fodan'),
    lines: ['四月初八，本师释迦牟尼佛降生。', '以香汤浴佛，洗涤身心，愿世间和平、众生安乐。'],
    cta: { label: '礼敬释迦牟尼佛', to: '/buddha/shakyamuni/' },
  },
  {
    key: 'dizang', name: '地藏菩萨圣诞', title: '地藏菩萨圣诞', tone: 'devotion', image: img('dizang'),
    lines: ['地狱不空，誓不成佛；众生度尽，方证菩提。', '礼敬大愿地藏菩萨，为先人与一切众生回向。'],
    cta: { label: '礼敬地藏菩萨', to: '/buddha/ksitigarbha/' },
  },
  {
    key: 'yaoshi', name: '药师佛圣诞', title: '药师佛圣诞', tone: 'devotion', image: img('yaoshi'),
    lines: ['药师琉璃光如来，发十二大愿，消灾延寿。', '为病中的家人祈愿，愿身心安康。'],
    cta: { label: '礼敬药师佛', to: '/buddha/medicine/' },
  },
  {
    key: 'amituo', name: '阿弥陀佛圣诞', title: '阿弥陀佛圣诞', tone: 'devotion', image: img('amituo'),
    lines: ['十一月十七，礼敬西方极乐世界阿弥陀佛。', '今天念一声佛号，为自己和家人种下善因。'],
    cta: { label: '礼敬阿弥陀佛', to: '/buddha/amitabha/' },
  },

  // ── 美国节日（精选） ──
  {
    key: 'newyear', name: '元旦', title: '元旦 · 新年安康', tone: 'celebrate', image: img('newyear'),
    lines: ['新的一年开始了。', '愿你与家人平安健康，所愿皆成。'],
    cta: { label: '许下新年心愿', to: BLESSING },
  },
  {
    key: 'mothers', name: '母亲节', title: '母亲节 · 感恩慈母', tone: 'celebrate', image: img('mothers'),
    lines: ['谁言寸草心，报得三春晖。', '为母亲祈福；若母亲已经远行，也可以为她点一炷心香。'],
    cta: { label: '为母亲祈福', to: BLESSING },
  },
  {
    key: 'fathers', name: '父亲节', title: '父亲节 · 感恩父爱', tone: 'celebrate', image: img('fathers'),
    lines: ['父爱如山，沉默而厚重。', '为父亲祈福；若父亲已经远行，也可以为他寄一份思念。'],
    cta: { label: '为父亲祈福', to: BLESSING },
  },
  {
    key: 'thanksgiving', name: '感恩节', title: '感恩节 · 知恩报恩', tone: 'celebrate', image: img('thanksgiving'),
    lines: ['佛法讲上报四重恩：父母、众生、国土、三宝。', '在这一天，感谢身边的每一个人。'],
    cta: { label: '写下感恩心愿', to: BLESSING },
  },
]

function shiftDate(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

export const FESTIVALS = DEFS.flatMap(({ before = 2, after = 2, ...def }) =>
  (DATES[def.key] || []).map((date) => ({
    ...def,
    date,
    start: shiftDate(date, -before),
    end: shiftDate(date, after),
  }))
)

export function localYmd(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function findActiveFestival(ymd) {
  const active = FESTIVALS.filter((item) => item.start <= ymd && ymd <= item.end)
  // 当天正好是某个节日：显示它；否则显示日期最晚的（新节日顶掉旧节日）
  return (
    active.find((item) => item.date === ymd) ||
    active.sort((a, b) => (a.date < b.date ? 1 : -1))[0] ||
    null
  )
}
