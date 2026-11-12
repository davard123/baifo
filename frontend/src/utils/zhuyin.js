// 带声调的汉语拼音音节 → 注音符号（ㄅㄆㄇ）。纯机械对照，不查字典；读音取舍在 data/zhuyinReadings.js。
// 例：bō → ㄅㄛ，rě → ㄖㄜˇ，lǜ → ㄌㄩˋ，zhī → ㄓ，de（轻声）→ ˙ㄉㄜ

const TONE_MARKS = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['ü', 1], ǘ: ['ü', 2], ǚ: ['ü', 3], ǜ: ['ü', 4],
  ń: ['n', 2], ň: ['n', 3], ǹ: ['n', 4], ḿ: ['m', 2],
}

/** 'bō' → { base: 'bo', tone: 1 }；没有声调符号的算轻声（tone 5），带数字的（bo1）也认。 */
export function splitTone(syl) {
  let s = String(syl || '').trim().toLowerCase().normalize('NFC')
  let tone = 0
  const num = s.match(/[1-5]$/)
  if (num) {
    tone = +num[0]
    s = s.slice(0, -1)
  }
  let base = ''
  for (const ch of s) {
    const m = TONE_MARKS[ch]
    if (m) {
      base += m[0]
      tone = m[1]
    } else base += ch
  }
  base = base.replace(/v/g, 'ü').replace(/u:/g, 'ü')
  return { base, tone: tone || 5 }
}

const INITIALS = [
  ['zh', 'ㄓ'], ['ch', 'ㄔ'], ['sh', 'ㄕ'],
  ['b', 'ㄅ'], ['p', 'ㄆ'], ['m', 'ㄇ'], ['f', 'ㄈ'],
  ['d', 'ㄉ'], ['t', 'ㄊ'], ['n', 'ㄋ'], ['l', 'ㄌ'],
  ['g', 'ㄍ'], ['k', 'ㄎ'], ['h', 'ㄏ'],
  ['j', 'ㄐ'], ['q', 'ㄑ'], ['x', 'ㄒ'],
  ['r', 'ㄖ'], ['z', 'ㄗ'], ['c', 'ㄘ'], ['s', 'ㄙ'],
]

// 韵母（已去掉声母、已把 y/w 开头的写法还原）
const FINALS = {
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ê: 'ㄝ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', ong: 'ㄨㄥ', er: 'ㄦ',
  i: 'ㄧ', ia: 'ㄧㄚ', io: 'ㄧㄛ', ie: 'ㄧㄝ', iai: 'ㄧㄞ', iao: 'ㄧㄠ', iu: 'ㄧㄡ', iou: 'ㄧㄡ',
  ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ', iong: 'ㄩㄥ',
  u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uei: 'ㄨㄟ',
  uan: 'ㄨㄢ', un: 'ㄨㄣ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ',
  ü: 'ㄩ', üe: 'ㄩㄝ', üan: 'ㄩㄢ', ün: 'ㄩㄣ',
}

const TONE_SIGNS = { 1: '', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' }

function zeroInitial(b) {
  // y / w 开头：还原成 i / u / ü 韵母
  if (b.startsWith('yu')) return 'ü' + b.slice(2)
  if (b === 'yi' || b === 'yin' || b === 'ying') return b.slice(1)
  if (b.startsWith('y')) return 'i' + b.slice(1)
  if (b === 'wu') return 'u'
  if (b.startsWith('w')) return 'u' + b.slice(1)
  return b
}

/** 一个拼音音节 → 注音；认不出来返回空字符串。 */
export function syllableToZhuyin(syl) {
  const { base, tone } = splitTone(syl)
  if (!base) return ''
  if (base === 'm' || base === 'n' || base === 'ng' || base === 'hm' || base === 'hng') {
    const sp = { m: 'ㄇ', n: 'ㄋ', ng: 'ㄫ', hm: 'ㄏㄇ', hng: 'ㄏㄫ' }[base]
    return tone === 5 ? `˙${sp}` : sp + TONE_SIGNS[tone]
  }
  let ini = ''
  let fin = base
  for (const [p, z] of INITIALS) {
    if (base.startsWith(p)) {
      ini = z
      fin = base.slice(p.length)
      break
    }
  }
  if (!ini) fin = zeroInitial(base)
  let fz
  if (ini && fin === 'i' && /^[ㄓㄔㄕㄖㄗㄘㄙ]$/.test(ini)) fz = '' // zhi chi shi ri zi ci si：只写声母
  else {
    // j q x 后面的 u 其实是 ü
    if (/^[ㄐㄑㄒ]$/.test(ini) && fin.startsWith('u')) fin = 'ü' + fin.slice(1)
    fz = FINALS[fin]
    if (fz === undefined) return ''
  }
  const body = ini + fz
  return tone === 5 ? `˙${body}` : body + TONE_SIGNS[tone]
}

/** 'bō rě' → ['ㄅㄛ', 'ㄖㄜˇ'] */
export function pinyinToZhuyin(py) {
  return String(py || '').trim().split(/\s+/).filter(Boolean).map(syllableToZhuyin)
}
