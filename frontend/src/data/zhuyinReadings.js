// 繁体念经页的注音：由经文已校对的拼音机械转成注音，再按下面的规则改成台湾通行读法。
// 拼音里的明显错误已在经文数据里改正（2026-11-12 两批）；咒语梵音和有出处的佛门读法没动。
//
// 读音依据（2026-11 核对）：
// 1. 教育部《重编国语辞典修订本》（萌典 moedict.tw 收录的同一份资料）：逐字、逐词比对；
//    台湾标准读音和大陆不同的（识 ㄕˋ、微 ㄨㄟˊ、究 ㄐㄧㄡˋ……）按台湾读音。
// 2. 佛教专名按辞典词条：南无 ㄋㄚˊ ㄇㄛˊ、供养 ㄍㄨㄥˋ ㄧㄤˋ、优婆塞 ㄧㄡ ㄆㄛˊ ㄙㄜˋ、大乘 ㄉㄚˋ ㄕㄥˋ、
//    释迦牟尼 ㄇㄡˊ、辟支佛 ㄆㄧˋ、目犍连 ㄐㄧㄢ……
// 3. 咒语（大悲咒、往生咒、药师灌顶真言、六字大明咒、十小咒、楞严咒、心经咒语）按淨律寺《佛门必备课诵本》
//    （佛陀教育基金会《楞严咒、大悲咒、十小咒、金刚经合刊》2011 重排版）逐字改过经文拼音（2026-11-12），
//    注音由拼音直接转，不再在这里另立规则；这里的规则不能和课诵本读法冲突。
// 4. 注音本按本调标：「一」一律 ㄧ，「不」一律 ㄅㄨˋ；轻声字在经文里按本调念（善男子 ㄗˇ）。

import { syllableToZhuyin } from '../utils/zhuyin.js'

const HAN = /\p{Script=Han}/u

// 单字：拼音是左边这个时，注音改成右边。（「字|拼音」）
const CHAR_RULES = {
  // 台湾标准读音（辞典只收这个读音，或大陆读音在辞典里只是「又音」）
  '识|shí': 'ㄕˋ',
  '微|wēi': 'ㄨㄟˊ',
  '巍|wēi': 'ㄨㄟˊ',
  '危|wēi': 'ㄨㄟˊ',
  '伪|wěi': 'ㄨㄟˋ',
  '惜|xī': 'ㄒㄧˊ',
  '昔|xī': 'ㄒㄧˊ',
  '息|xī': 'ㄒㄧˊ',
  '寂|jì': 'ㄐㄧˊ',
  '究|jiū': 'ㄐㄧㄡˋ',
  '辱|rǔ': 'ㄖㄨˋ',
  '储|chǔ': 'ㄔㄨˊ',
  '期|qī': 'ㄑㄧˊ',
  '夹|jiā': 'ㄐㄧㄚˊ',
  '拥|yōng': 'ㄩㄥˇ',
  '诤|zhèng': 'ㄓㄥ',
  '缚|fù': 'ㄈㄨˊ',
  '崖|yá': 'ㄧㄞˊ',
  '企|qǐ': 'ㄑㄧˋ',
  '挛|luán': 'ㄌㄩㄢˊ',
  '咄|duō': 'ㄉㄨㄛˋ',
  '讽|fěng': 'ㄈㄥˋ',
  '播|bō': 'ㄅㄛˋ',
  '度|duó': 'ㄉㄨㄛˋ', // 测度
  '发|fà': 'ㄈㄚˇ', // 毛髮
  '憙|xī': 'ㄒㄧˇ', // 好憙＝好喜
}

// 词：在一行经文里找到这个词（简体），对应位置改注音；null 表示这个字不动。
const WORD_RULES = [
  // 经文拼音是 nā mó 的才改；咒语按《佛门必备课诵本》标过的（大悲咒 ná mó、十小咒 nā mō）照拼音走
  ['南无', ['ㄋㄚˊ', 'ㄇㄛˊ'], ['nā', 'mó']],
  ['南谟', ['ㄋㄚˊ', 'ㄇㄛˊ'], ['nā', 'mó']],
  ['供养', [null, 'ㄧㄤˋ']],
  ['优婆塞', [null, null, 'ㄙㄜˋ']],
  ['大乘', [null, 'ㄕㄥˋ']],
  ['名闻', [null, 'ㄨㄣˋ']],
  ['牟尼', ['ㄇㄡˊ', null]],
  ['目犍连', [null, 'ㄐㄧㄢ', null]],
  ['转轮圣王', ['ㄓㄨㄢˇ', null, null, null]],
  ['陂池', ['ㄆㄧˊ', null]],
]

function baseZhuyin(ch, py) {
  if (!py) return ''
  if (ch === '一') return 'ㄧ'
  if (ch === '不' && py === 'bú') return 'ㄅㄨˋ'
  const rule = CHAR_RULES[`${ch}|${py}`]
  return rule || syllableToZhuyin(py)
}

/**
 * 一行经文的注音：chars 是这一行的汉字单位 [{ ch（简体）, py }]，返回同样长度的注音数组。
 * 没拼音的字（读音待核实）注音也留空。
 */
export function zhuyinForChars(chars) {
  const out = chars.map((c) => baseZhuyin(c.ch, c.py))
  const text = chars.map((c) => c.ch).join('')
  for (const [w, zs, need] of WORD_RULES) {
    let i = text.indexOf(w)
    while (i >= 0) {
      if (need && !need.every((p, k) => chars[i + k]?.py === p)) {
        i = text.indexOf(w, i + 1)
        continue
      }
      zs.forEach((z, k) => {
        if (z && chars[i + k]?.py) out[i + k] = z
      })
      i = text.indexOf(w, i + 1)
    }
  }
  return out
}

/** 一段文字（经题、译者）配一串拼音 → 每个汉字的注音。 */
export function zhuyinForText(text, py) {
  const pys = String(py || '').trim().split(/\s+/).filter(Boolean)
  const chars = []
  let k = 0
  for (const ch of String(text || '')) {
    if (!HAN.test(ch)) continue
    chars.push({ ch, py: pys[k] || '' })
    k += 1
  }
  return zhuyinForChars(chars)
}

export const _rules = { CHAR_RULES, WORD_RULES }
