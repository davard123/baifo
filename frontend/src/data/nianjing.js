// 念经板块：自己看拼音出声念，页面听声音跟上位置（和 /jing/ 的音频跟读无关）。jingSlug：同一部经在 /jing/ 的诵读、唱诵页，两页互相链接。
// 经文只取已两源对照校订的数据；每部按需加载，不进主包。
import { BUDDHAS } from './buddhas.js'
import { zhuyinForChars, zhuyinForText } from './zhuyinReadings.js'
import { HEADING_PINYIN } from './headingPinyin.js'

export const NIANJING = [
  { slug: 'xinjing', title: '心经', buddha: 'guanyin', jingSlug: 'xinjing', note: '二百六十字，几分钟念完', header: { title: '般若波罗蜜多心经', titlePy: 'bō rě bō luó mì duō xīn jīng', translator: '唐 三藏法师玄奘 译', translatorPy: 'táng sān zàng fǎ shī xuán zàng yì' }, load: () => import('./sutras/xinjing.js') },
  { slug: 'dabeizhou', title: '大悲咒', buddha: 'guanyin', jingSlug: 'dabeizhou', note: '八十四句，早课必诵', header: { title: '千手千眼无碍大悲心陀罗尼', titlePy: 'qiān shǒu qiān yǎn wú ài dà bēi xīn tuó luó ní', translator: '唐 伽梵达摩 译', translatorPy: 'táng qié fàn dá mó yì' }, load: () => import('./sutras/dabeizhou.js') },
  { slug: 'liuzi', title: '六字大明咒', buddha: 'guanyin', note: '唵嘛呢叭咪吽', header: { title: '观世音菩萨六字大明陀罗尼', titlePy: 'guān shì yīn pú sà liù zì dà míng tuó luó ní', translator: '宋 中印度惹烂驮啰国密丰寺三藏赐紫沙门天息灾 奉诏译', translatorPy: 'sòng zhōng yìn dù rě làn tuó luó guó mì fēng sì sān zàng cì zǐ shā mén tiān xī zāi fèng zhào yì' }, load: () => import('./sutras/liuzi.js') },
  { slug: 'wangsheng', title: '往生咒', buddha: 'amitabha', jingSlug: 'wangsheng', note: '为亲人回向常念', header: { title: '拔一切业障根本得生净土陀罗尼', titlePy: 'bá yí qiè yè zhàng gēn běn dé shēng jìng tǔ tuó luó ní', translator: '刘宋 天竺三藏求那跋陀罗 奉诏重译', translatorPy: 'liú sòng tiān zhú sān zàng qiú nà bá tuó luó fèng zhào chóng yì' }, load: () => import('./sutras/wangsheng.js') },
  { slug: 'yaoshi-zhenyan', title: '药师灌顶真言', buddha: 'medicine', note: '祈求身体康健', header: { title: '药师琉璃光如来灌顶真言', titlePy: 'yào shī liú lí guāng rú lái guàn dǐng zhēn yán', translator: '唐 三藏法师玄奘 奉诏译', translatorPy: 'táng sān zàng fǎ shī xuán zàng fèng zhào yì' }, load: () => import('./sutras/yaoshi-zhenyan.js') },
  { slug: 'shixiaozhou', title: '十小咒', buddha: 'shakyamuni', jingSlug: 'shixiaozhou', note: '早课十小咒全文', header: { title: '十小咒', titlePy: 'shí xiǎo zhòu', sub: '早课课诵', subPy: 'zǎo kè kè sòng', translator: '历代三藏法师 译 / 寺院课诵集辑', translatorPy: '' }, load: () => import('./sutras/shixiaozhou.js') },
  { slug: 'lengyan', title: '楞严咒', buddha: 'shakyamuni', jingSlug: 'lengyan', note: '五会全文，早课必诵', header: { title: '大佛顶首楞严神咒', titlePy: 'dà fó dǐng shǒu léng yán shén zhòu', translator: '唐 般剌蜜帝 译', translatorPy: '' }, load: () => import('./sutras/lengyan.js') },
  { slug: 'pumen', title: '普门品', buddha: 'guanyin', jingSlug: 'pumen', note: '观世音菩萨普门品', header: { title: '妙法莲华经', titlePy: 'miào fǎ lián huá jīng', sub: '观世音菩萨普门品第二十五', subPy: 'guān shì yīn pú sà pǔ mén pǐn dì èr shí wǔ', translator: '后秦 龟兹三藏法师鸠摩罗什 译', translatorPy: 'hòu qín qiū cí sān zàng fǎ shī jiū mó luó shí yì' }, load: () => import('./sutras/pumen.js') },
  { slug: 'amituo', title: '阿弥陀经', buddha: 'amitabha', jingSlug: 'amituo', note: '净土宗日课', header: { title: '佛说阿弥陀经', titlePy: 'fó shuō ā mí tuó jīng', translator: '后秦 龟兹三藏法师鸠摩罗什 译', translatorPy: 'hòu qín qiū cí sān zàng fǎ shī jiū mó luó shí yì' }, load: () => import('./sutras/amituo.js') },
  { slug: 'badaren', title: '八大人觉经', buddha: 'shakyamuni', note: '八种觉悟，三百多字', header: { title: '佛说八大人觉经', titlePy: 'fó shuō bā dà rén jué jīng', translator: '后汉 安息国三藏安世高 译', translatorPy: 'hòu hàn ān xī guó sān zàng ān shì gāo yì' }, load: () => import('./sutras/badaren.js') },
  { slug: 'puxian', title: '普贤行愿品', buddha: 'samantabhadra', jingSlug: 'puxian', note: '十大愿王，长行与偈颂全文', header: { title: '大方广佛华严经 卷第四十', titlePy: 'dà fāng guǎng fó huá yán jīng juàn dì sì shí', sub: '入不思议解脱境界普贤行愿品', subPy: 'rù bù sī yì jiě tuō jìng jiè pǔ xián xíng yuàn pǐn', translator: '唐 罽宾国三藏般若 奉诏译', translatorPy: 'táng jì bīn guó sān zàng bō rě fèng zhào yì' }, load: () => import('./sutras/puxian.js') },
  { slug: 'jingang', title: '金刚经', buddha: 'shakyamuni', jingSlug: 'jingang', note: '三十二分全文', header: { title: '金刚般若波罗蜜经', titlePy: 'jīn gāng bō rě bō luó mì jīng', translator: '姚秦 三藏法师鸠摩罗什 译', translatorPy: 'yáo qín sān zàng fǎ shī jiū mó luó shí yì' }, load: () => import('./sutras/jingang.js') },
  { slug: 'yaoshi', title: '药师经', buddha: 'medicine', note: '药师琉璃光如来本愿功德经', header: { title: '药师琉璃光如来本愿功德经', titlePy: 'yào shī liú lí guāng rú lái běn yuàn gōng dé jīng', translator: '唐 三藏法师玄奘 奉诏译', translatorPy: 'táng sān zàng fǎ shī xuán zàng fèng zhào yì' }, load: () => import('./sutras/yaoshi.js') },
  { slug: 'dizang', title: '地藏经', buddha: 'ksitigarbha', jingSlug: 'dizang', note: '十三品全文', header: { title: '地藏菩萨本愿经', titlePy: 'dì zàng pú sà běn yuàn jīng', translator: '唐 于阗国三藏沙门实叉难陀 译', translatorPy: 'táng yú tián guó sān zàng shā mén shí chā nán tuó yì' }, load: () => import('./sutras/dizang.js') },
  { slug: 'renwang', title: '仁王护国经', buddha: 'shakyamuni', note: '护国般若，八品全文', header: { title: '佛说仁王般若波罗蜜经', titlePy: 'fó shuō rén wáng bō rě bō luó mì jīng', translator: '姚秦 三藏鸠摩罗什 译', translatorPy: 'yáo qín sān zàng jiū mó luó shí yì' }, load: () => import('./sutras/renwang.js') },
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
/**
 * 念经页：品名/分名/篇名也要念出来、跟着高亮。在每个标题第一次出现的那行前面插一行标题本身
 * （带拼音，isHeading:true），之后排版把它当标题显示。HEADING_PINYIN 里没有的标题照旧只显示。
 * 只看 heading（品名、篇名）和 fenName（金刚经分名）；section（十小咒咒名、楞严咒「第一会」）是分段标记，持诵时不念。
 * 标题和下一行文字一样时（「南无本师释迦牟尼佛」这种只有一句的篇）不插，免得念两遍。
 */
export function withHeadingLines(rawLines) {
  const out = []
  let prev = ''
  for (const l of rawLines) {
    const h = l.heading || l.fenName || l.section || ''
    if (h && h !== prev) {
      const py = l.heading || l.fenName ? HEADING_PINYIN[h] : ''
      const same = String(l.text).replace(/[^\p{Script=Han}]/gu, '') === h.replace(/[^\p{Script=Han}]/gu, '')
      if (py && !same) {
        const head = { text: h, pinyin: py, isHeading: true, part: l.part }
        for (const k of ['heading', 'fenName', 'section', 'times']) if (l[k]) head[k] = l[k]
        out.push(head)
      }
      prev = h
    }
    out.push(l)
  }
  return out
}

export function toUnits(rawLines) {
  const chars = []
  const lines = []
  let carried = '' // 品名/分名/咒名只标在第一行的经（地藏经）也要一路带下去
  let carriedTimes = '' // 仪文篇名后的「（三遍）」之类：标在篇第一行，跟着篇名带下去
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
    // 不是篇第一行的 times（「南无……（合掌三称）」）是这一行的提示：挂在行末，不是字单位，不参与跟读
    if (l.times && !l.heading) tokens.push({ ch: `（${l.times}）`, note: true })
    if (l.heading || l.fenName || l.section) carriedTimes = l.heading ? l.times || '' : ''
    carried = l.heading || l.fenName || l.section || carried
    lines.push({
      text: l.text,
      heading: carried,
      times: carriedTimes,
      isHeading: !!l.isHeading,
      lineTimes: l.times && !l.heading ? l.times : '', // 这一行自己的遍数（「南无……（合掌三称）」）
      stanza: l.stanza,
      verse: l.verse,
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
export function labelTokens(text, py = '', zys = null) {
  const pys = String(py || '').trim().split(/\s+/).filter(Boolean)
  const out = []
  let k = 0
  for (const ch of String(text || '')) {
    if (HAN.test(ch)) {
      const t = { ch, py: pys[k] || '' }
      if (zys) t.zy = t.py ? zys[k] || '' : ''
      out.push(t)
      k += 1
    } else if (/\s/.test(ch)) out.push({ gap: true })
    else out.push({ ch })
  }
  return out
}

/** 经题块一行的注音（按简体原文和拼音算，繁体显示时字数不变，按位置对应）。 */
export function labelZhuyin(text, py = '') {
  return zhuyinForText(text, py)
}

/**
 * 给 toUnits 的结果补上注音（每个字 zy），繁体页再补上显示用的繁体字（dch）。
 * hantLines：和 rawLines 一一对应、字数相同的繁体经文；简体页不传。就地修改并返回 units。
 */
export function decorateUnits(units, hantLines = null) {
  units.lines.forEach((ln, i) => {
    const cs = units.chars.slice(ln.start, ln.end)
    const zy = zhuyinForChars(cs)
    cs.forEach((c, k) => {
      c.zy = zy[k] || ''
    })
    let disp = hantLines ? [...String(hantLines[i] || '')].filter((ch) => !/\s/.test(ch)) : null
    const toks = ln.tokens.filter((t) => !t.note) // 行末提示（合掌三称）不在经文里
    if (disp && disp.length !== toks.length) disp = null // 对不上就不换字
    toks.forEach((t, k) => {
      if (t.u !== undefined) t.zy = units.chars[t.u].zy
      if (disp) t.dch = disp[k]
    })
    if (disp) ln.tokens.forEach((t) => {
      if (t.note) t.dch = t.ch.replace(/称/g, '稱').replace(/数/g, '數').replace(/声/g, '聲')
    })
    if (disp) ln.dtext = hantLines[i]
  })
  return units
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
