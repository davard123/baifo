// 念经板块：自己看拼音出声念，页面听声音跟上位置（和 /jing/ 的音频跟读无关）。
// 经文只取已两源对照校订的数据；每部按需加载，不进主包。
import { BUDDHAS } from './buddhas.js'

export const NIANJING = [
  { slug: 'xinjing', title: '心经', buddha: 'guanyin', jingSlug: 'xinjing', note: '二百六十字，几分钟念完', header: { title: '般若波罗蜜多心经', titlePy: 'bō rě bō luó mì duō xīn jīng', translator: '唐 三藏法师玄奘 译', translatorPy: 'táng sān zàng fǎ shī xuán zàng yì' }, load: () => import('./sutras/xinjing.js') },
  { slug: 'dabeizhou', title: '大悲咒', buddha: 'guanyin', jingSlug: 'dabeizhou', note: '八十四句，早课必诵', header: { title: '千手千眼无碍大悲心陀罗尼', titlePy: 'qiān shǒu qiān yǎn wú ài dà bēi xīn tuó luó ní', translator: '唐 伽梵达摩 译', translatorPy: 'táng qié fàn dá mó yì' }, load: () => import('./sutras/dabeizhou.js') },
  { slug: 'liuzi', title: '六字大明咒', buddha: 'guanyin', note: '唵嘛呢叭咪吽', header: { title: '观世音菩萨六字大明陀罗尼', titlePy: 'guān shì yīn pú sà liù zì dà míng tuó luó ní', translator: '宋 中印度惹烂驮啰国密丰寺三藏赐紫沙门天息灾 奉诏译', translatorPy: 'sòng zhōng yìn dù rě làn tuó luó guó mì fēng sì sān zàng cì zǐ shā mén tiān xī zāi fèng zhào yì' }, load: () => import('./sutras/liuzi.js') },
  { slug: 'wangsheng', title: '往生咒', buddha: 'amitabha', note: '为亲人回向常念', header: { title: '拔一切业障根本得生净土陀罗尼', titlePy: 'bá yí qiè yè zhàng gēn běn dé shēng jìng tǔ tuó luó ní', translator: '刘宋 天竺三藏求那跋陀罗 奉诏重译', translatorPy: 'liú sòng tiān zhú sān zàng qiú nà bá tuó luó fèng zhào chóng yì' }, load: () => import('./sutras/wangsheng.js') },
  { slug: 'yaoshi-zhenyan', title: '药师灌顶真言', buddha: 'medicine', note: '祈求身体康健', header: { title: '药师琉璃光如来灌顶真言', titlePy: 'yào shī liú lí guāng rú lái guàn dǐng zhēn yán', translator: '唐 三藏法师玄奘 奉诏译', translatorPy: 'táng sān zàng fǎ shī xuán zàng fèng zhào yì' }, load: () => import('./sutras/yaoshi-zhenyan.js') },
  { slug: 'shixiaozhou', title: '十小咒', buddha: 'shakyamuni', note: '早课十小咒全文', header: { title: '十小咒', titlePy: 'shí xiǎo zhòu', sub: '早课课诵', subPy: 'zǎo kè kè sòng', translator: '历代三藏法师 译 / 寺院课诵集辑', translatorPy: '' }, load: () => import('./sutras/shixiaozhou.js') },
  { slug: 'pumen', title: '普门品', buddha: 'guanyin', jingSlug: 'pumen', note: '观世音菩萨普门品', header: { title: '妙法莲华经', titlePy: 'miào fǎ lián huá jīng', sub: '观世音菩萨普门品第二十五', subPy: 'guān shì yīn pú sà pǔ mén pǐn dì èr shí wǔ', translator: '后秦 龟兹三藏法师鸠摩罗什 译', translatorPy: 'hòu qín qiū cí sān zàng fǎ shī jiū mó luó shí yì' }, load: () => import('./sutras/pumen.js') },
  { slug: 'amituo', title: '阿弥陀经', buddha: 'amitabha', jingSlug: 'amituo', note: '净土宗日课', header: { title: '佛说阿弥陀经', titlePy: 'fó shuō ā mí tuó jīng', translator: '后秦 龟兹三藏法师鸠摩罗什 译', translatorPy: 'hòu qín qiū cí sān zàng fǎ shī jiū mó luó shí yì' }, load: () => import('./sutras/amituo.js') },
  { slug: 'badaren', title: '八大人觉经', buddha: 'shakyamuni', note: '八种觉悟，三百多字', header: { title: '佛说八大人觉经', titlePy: 'fó shuō bā dà rén jué jīng', translator: '后汉 安息国三藏安世高 译', translatorPy: 'hòu hàn ān xī guó sān zàng ān shì gāo yì' }, load: () => import('./sutras/badaren.js') },
  { slug: 'puxian', title: '普贤行愿品', buddha: 'samantabhadra', jingSlug: 'puxian', note: '十大愿王，长行与偈颂全文', header: { title: '大方广佛华严经 卷第四十', titlePy: 'dà fāng guǎng fó huá yán jīng juàn dì sì shí', sub: '入不思议解脱境界普贤行愿品', subPy: 'rù bù sī yì jiě tuō jìng jiè pǔ xián xíng yuàn pǐn', translator: '唐 罽宾国三藏般若 奉诏译', translatorPy: 'táng jì bīn guó sān zàng bō rě fèng zhào yì' }, load: () => import('./sutras/puxian.js') },
  { slug: 'jingang', title: '金刚经', buddha: 'shakyamuni', jingSlug: 'jingang', note: '三十二分全文', header: { title: '金刚般若波罗蜜经', titlePy: 'jīn gāng bō rě bō luó mì jīng', translator: '姚秦 三藏法师鸠摩罗什 译', translatorPy: 'yáo qín sān zàng fǎ shī jiū mó luó shí yì' }, load: () => import('./sutras/jingang.js') },
  { slug: 'yaoshi', title: '药师经', buddha: 'medicine', note: '药师琉璃光如来本愿功德经', header: { title: '药师琉璃光如来本愿功德经', titlePy: 'yào shī liú lí guāng rú lái běn yuàn gōng dé jīng', translator: '唐 三藏法师玄奘 奉诏译', translatorPy: 'táng sān zàng fǎ shī xuán zàng fèng zhào yì' }, load: () => import('./sutras/yaoshi.js') },
  { slug: 'dizang', title: '地藏经', buddha: 'ksitigarbha', jingSlug: 'dizang', note: '十三品全文', header: { title: '地藏菩萨本愿经', titlePy: 'dì zàng pú sà běn yuàn jīng', translator: '唐 于阗国三藏沙门实叉难陀 译', translatorPy: 'táng yú tián guó sān zàng shā mén shí chā nán tuó yì' }, load: () => import('./sutras/dizang.js') },
  { slug: 'renwang', title: '仁王护国经', buddha: 'shakyamuni', note: '护国般若，八品全文', header: { title: '仁王护国般若波罗蜜多经', titlePy: 'rén wáng hù guó bō rě bō luó mì duō jīng', translator: '唐 大广智不空 奉诏译', translatorPy: 'táng dà guǎng zhì bù kōng fèng zhào yì' }, load: () => import('./sutras/renwang.js') },
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
  let carried = '' // 品名/分名/咒名只标在第一行的经（地藏经）也要一路带下去
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
    carried = l.heading || l.fenName || l.section || carried
    lines.push({
      text: l.text,
      heading: carried,
      stanza: l.stanza,
      part: l.part,
      start,
      end: chars.length,
      tokens,
    })
  })
  return { chars, lines }
}

/**
 * 经题块里一行文字（经题/译者）的显示片段：汉字配拼音，空格变成留白，其他符号原样。
 * py 为空时不标拼音。返回 [{ ch, py } | { gap: true } | { ch }]
 */
export function labelTokens(text, py = '') {
  const pys = String(py || '').trim().split(/\s+/).filter(Boolean)
  const out = []
  let k = 0
  for (const ch of String(text || '')) {
    if (HAN.test(ch)) {
      out.push({ ch, py: pys[k] || '' })
      k += 1
    } else if (/\s/.test(ch)) out.push({ gap: true })
    else out.push({ ch })
  }
  return out
}

/** 经题块最下面一行小字：校对来源。id 是多个出处（含「/」）时写成各咒原经。 */
export function sourceNote(id) {
  const t = String(id || '').trim()
  if (!t) return ''
  return t.includes('/') ? '经文依 CBETA 电子佛典各咒原经校对注音' : `经文依 CBETA 电子佛典（${t}）校对注音`
}

/** 一行里应有拼音的汉字数（不含读音待核实的字）。 */
export function hanCount(text) {
  let n = 0
  for (const ch of text) if (HAN.test(ch) && !UNVERIFIED_CHARS.has(ch)) n += 1
  return n
}
