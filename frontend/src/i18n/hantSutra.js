// 念经页经文转繁体：整行交给 OpenCC（按词转，「云何」不会变成「雲何」），再修正 OpenCC 在佛经里转错的字。
// 只改转换结果，不动简体经文数据。转换前后字数必须一样（每个字的拼音、注音按位置对应），不一样就退回逐字转。
// 运行时（NianjingPage）和预渲染（scripts/prerender.js）共用。

// OpenCC 整行转换后，这些写法在佛经里是错的（2026-11 逐部比对十四部经找出来的）
const FIXES = [
  [/佈/g, '布'], // 布施、流布、分布
  [/唸/g, '念'], // 诵念、发心念经典
  [/曏者/g, '向者'],
  [/況複/g, '況復'],
  [/製法/g, '制法'],
  [/鹹/g, '咸'], // 咸即起慈心、咸清净
  [/兇衰/g, '凶衰'],
  [/佔相/g, '占相'],
  [/闢除/g, '辟除'],
  [/不事余天/g, '不事餘天'],
  [/幹消/g, '乾消'],
  [/屍羅/g, '尸羅'], // 尸罗（持戒），不是尸体
  [/屍波羅蜜/g, '尸波羅蜜'],
  [/若瞭如是/g, '若了如是'],
  [/檢系/g, '檢繫'], // 检系其身（普门品）
  [/註音/g, '注音'], // 页面说明文字：注音符号写「注音」
]

/** 念经页的繁体标题、说明转完后再修两处：「唸」统一写「念」（和「听我念」一致），「註音」写「注音」。 */
export function tidyHantCopy(text) {
  return String(text ?? '').replace(/唸/g, '念').replace(/註音/g, '注音')
}

// 简体一个字对应几个繁体字、OpenCC 又按词猜错的：按这个字的拼音定
const BY_PINYIN = {
  '发|fā': '發',
  '发|fà': '髮',
}

const HAN = /\p{Script=Han}/u

/**
 * text：一行简体经文；convert：OpenCC 转换函数；pinyin：这一行的拼音（可省略）。
 * 返回和 text 一样长（按码位）的繁体字符串。
 */
export function hantSutraText(text, convert, pinyin = '') {
  const src = String(text || '')
  if (!convert || !src) return src
  let out = convert(src)
  for (const [re, to] of FIXES) out = out.replace(re, to)
  const a = [...src]
  let b = [...out]
  if (b.length !== a.length) b = a.map((ch) => convert(ch))
  const pys = String(pinyin || '').trim().split(/\s+/).filter(Boolean)
  let k = 0
  for (let i = 0; i < a.length; i += 1) {
    if (!HAN.test(a[i])) continue
    const fix = BY_PINYIN[`${a[i]}|${pys[k] || ''}`]
    if (fix) b[i] = fix
    k += 1
  }
  return b.join('')
}
