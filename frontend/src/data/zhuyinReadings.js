// 繁体念经页的注音：由经文已校对的拼音机械转成注音，再按下面的规则改成台湾通行读法。
// 简体页的拼音不受影响（拼音里发现的问题另列清单，等人定）。
//
// 读音依据（2026-11 核对）：
// 1. 教育部《重编国语辞典修订本》（萌典 moedict.tw 收录的同一份资料）：逐字、逐词比对；
//    台湾标准读音和大陆不同的（识 ㄕˋ、微 ㄨㄟˊ、究 ㄐㄧㄡˋ……）按台湾读音。
// 2. 佛教专名按辞典词条：南无 ㄋㄚˊ ㄇㄛˊ、供养 ㄍㄨㄥˋ ㄧㄤˋ、优婆塞 ㄧㄡ ㄆㄛˊ ㄙㄜˋ、大乘 ㄉㄚˋ ㄕㄥˋ、
//    释迦牟尼 ㄇㄡˊ、辟支佛 ㄆㄧˋ、目犍连 ㄐㄧㄢ……
// 3. 咒语的梵音字沿用经文拼音（喝 ㄏㄜ、啰 ㄌㄚˋ、萨埵 ㄙㄚˋ ㄉㄨㄛˇ、婆 ㄆㄛˊ……），
//    与淨律寺《佛门必备课诵本》（佛陀教育基金会《楞严咒、大悲咒、十小咒、金刚经合刊》2011 重排版）对照过，
//    两边不同的地方列在交付报告里，没有擅改。
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
  '伐|fá': 'ㄈㄚ',
  '诤|zhèng': 'ㄓㄥ',
  '缚|fù': 'ㄈㄨˊ',
  '崖|yá': 'ㄧㄞˊ',
  '企|qǐ': 'ㄑㄧˋ',
  '挛|luán': 'ㄌㄩㄢˊ',
  '咄|duō': 'ㄉㄨㄛˋ',
  '讽|fěng': 'ㄈㄥˋ',
  '儜|níng': 'ㄋㄥˊ',
  '播|bō': 'ㄅㄛˋ',
  '度|duó': 'ㄉㄨㄛˋ', // 测度
  '发|fà': 'ㄈㄚˇ', // 毛髮
  '憙|xī': 'ㄒㄧˇ', // 好憙＝好喜
  // 经文拼音明显不对的（另列在报告里）
  '佛|fú': 'ㄈㄛˊ',
  '了|le': 'ㄌㄧㄠˇ', // 了达、明了
  '得|de': 'ㄉㄜˊ', // 所得、如来得……
  '子|zi': 'ㄗˇ', // 善男子
  '生|sheng': 'ㄕㄥ', // 畜生
  '卜|bo': 'ㄅㄨˇ', // 卜问
  '尽|jǐn': 'ㄐㄧㄣˋ', // 尽形
  '著|zhù': 'ㄓㄨㄛˊ', // 著地、著新净衣
  '彊|jiàng': 'ㄑㄧㄤˊ', // 刚彊
  '那|nuǒ': 'ㄋㄨㄛˊ', // 阿兰那
  '伽|gā': 'ㄑㄧㄝˊ', // 殑伽、薄伽
  '刹|shā': 'ㄔㄚˋ', // 无刹不现身、刹帝利
  '没|méi': 'ㄇㄛˋ', // 波浪不能没、隐没
}

// 词：在一行经文里找到这个词（简体），对应位置改注音；null 表示这个字不动。
const WORD_RULES = [
  ['南无', ['ㄋㄚˊ', 'ㄇㄛˊ']],
  ['南谟', ['ㄋㄚˊ', 'ㄇㄛˊ']],
  ['供养', [null, 'ㄧㄤˋ']],
  ['优婆塞', [null, null, 'ㄙㄜˋ']],
  ['大乘', [null, 'ㄕㄥˋ']],
  ['名闻', [null, 'ㄨㄣˋ']],
  ['宝相', [null, 'ㄒㄧㄤˋ']],
  ['牟尼', ['ㄇㄡˊ', null]],
  ['目犍连', [null, 'ㄐㄧㄢ', null]],
  ['辟支', ['ㄆㄧˋ', null]],
  ['转轮圣王', ['ㄓㄨㄢˇ', null, null, null]],
  ['陂池', ['ㄆㄧˊ', null]],
  ['地藏', [null, 'ㄗㄤˋ']],
  ['薄伽', ['ㄅㄛˊ', 'ㄑㄧㄝˊ']],
  ['舍卫', ['ㄕㄜˋ', null]],
  ['舍宅', ['ㄕㄜˋ', null]],
  ['返舍', [null, 'ㄕㄜˋ']],
  ['归其舍', [null, null, 'ㄕㄜˋ']],
  ['鹦鹉舍利', [null, null, 'ㄕㄜˋ', null]],
  ['妙相', [null, 'ㄒㄧㄤˋ']], // 世尊妙相具、具足妙相尊
  ['有相之女', [null, 'ㄒㄧㄤˋ', null, null]],
  ['商主将诸', [null, null, 'ㄐㄧㄤ', null]],
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
  for (const [w, zs] of WORD_RULES) {
    let i = text.indexOf(w)
    while (i >= 0) {
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
