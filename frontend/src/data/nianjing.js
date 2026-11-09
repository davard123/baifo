// 念经板块：自己看拼音出声念，页面听声音跟上位置（和 /jing/ 的音频跟读无关）。
// 经文只取已两源对照校订的数据；每部按需加载，不进主包。
import { BUDDHAS } from './buddhas.js'

export const NIANJING = [
  { slug: 'xinjing', title: '心经', buddha: 'guanyin', jingSlug: 'xinjing', note: '二百六十字，几分钟念完', load: () => import('./sutras/xinjing.js') },
  { slug: 'dabeizhou', title: '大悲咒', buddha: 'guanyin', jingSlug: 'dabeizhou', note: '八十四句，早课必诵', load: () => import('./sutras/dabeizhou.js') },
  { slug: 'liuzi', title: '六字大明咒', buddha: 'guanyin', note: '唵嘛呢叭咪吽', load: () => import('./sutras/liuzi.js') },
  { slug: 'wangsheng', title: '往生咒', buddha: 'amitabha', note: '为亲人回向常念', load: () => import('./sutras/wangsheng.js') },
  { slug: 'yaoshi-zhenyan', title: '药师灌顶真言', buddha: 'medicine', note: '祈求身体康健', load: () => import('./sutras/yaoshi-zhenyan.js') },
  { slug: 'shixiaozhou', title: '十小咒', buddha: 'shakyamuni', note: '早课十小咒全文', load: () => import('./sutras/shixiaozhou.js') },
  { slug: 'pumen', title: '普门品', buddha: 'guanyin', jingSlug: 'pumen', note: '观世音菩萨普门品', load: () => import('./sutras/pumen.js') },
  { slug: 'amituo', title: '阿弥陀经', buddha: 'amitabha', jingSlug: 'amituo', note: '净土宗日课', load: () => import('./sutras/amituo.js') },
  { slug: 'puxian', title: '普贤行愿品偈颂', buddha: 'samantabhadra', jingSlug: 'puxian', note: '十大愿王偈颂', load: () => import('./sutras/puxian.js') },
  { slug: 'jingang', title: '金刚经', buddha: 'shakyamuni', jingSlug: 'jingang', note: '三十二分全文', load: () => import('./sutras/jingang.js') },
  { slug: 'yaoshi', title: '药师经', buddha: 'medicine', note: '药师琉璃光如来本愿功德经', load: () => import('./sutras/yaoshi.js') },
  { slug: 'dizang', title: '地藏经', buddha: 'ksitigarbha', jingSlug: 'dizang', note: '十三品全文', load: () => import('./sutras/dizang.js') },
]

export const NIANJING_BY_SLUG = Object.fromEntries(NIANJING.map((s) => [s.slug, s]))

const HAN = /\p{Script=Han}/u

// 读音还没核实的生僻字：不标拼音、对齐时当通配（宁缺毋错）。
// 目前没有。（地藏经「纯飞𨪏鏫」即「纯飞蒺藜」（铁蒺藜），𨪏 读 jí，2026-11-09 David 确认后已补）
export const UNVERIFIED_CHARS = new Set([])

/** 一尊佛菩萨的所有造型图，念经页随机挑一张。 */
export function buddhaImages(buddhaSlug) {
  const b = BUDDHAS.find((x) => x.slug === buddhaSlug)
  if (!b) return []
  return [b.image, ...(b.variants || []).map((v) => v.image)].filter(Boolean)
}

/**
 * 把经文行拆成「字单位」：每个汉字一个，带它的校对拼音；标点不算单位，挂在前一个字后面显示。
 * 返回 { chars: [{ ch, py, line, idx }], lines: [{ text, heading, start, end, tokens }] }
 * tokens 是这一行的显示片段：汉字 { ch, py, u（字单位序号）}，标点 { ch }。
 */
export function toUnits(rawLines) {
  const chars = []
  const lines = []
  rawLines.forEach((l, line) => {
    const pys = String(l.pinyin || '').trim().split(/\s+/).filter(Boolean)
    const start = chars.length
    const tokens = []
    let k = 0
    for (const ch of l.text) {
      if (UNVERIFIED_CHARS.has(ch)) {
        const u = chars.length
        chars.push({ ch, py: '', line, idx: -1 })
        tokens.push({ ch, py: '', u })
      } else if (HAN.test(ch)) {
        const u = chars.length
        chars.push({ ch, py: pys[k] || '', line, idx: k })
        tokens.push({ ch, py: pys[k] || '', u })
        k += 1
      } else if (!/\s/.test(ch)) {
        tokens.push({ ch })
      }
    }
    lines.push({
      text: l.text,
      heading: l.heading || l.fenName || l.section || '',
      start,
      end: chars.length,
      tokens,
    })
  })
  return { chars, lines }
}

/** 一行里应有拼音的汉字数（不含读音待核实的字）。 */
export function hanCount(text) {
  let n = 0
  for (const ch of text) if (HAN.test(ch) && !UNVERIFIED_CHARS.has(ch)) n += 1
  return n
}
