// 繁体念经页注音检查：拼音转注音对不对；佛经特殊读音有没有用上；每部经每个字都有注音；繁体转换不改字数。
// 用法：node scripts/test-zhuyin.mjs
import assert from 'node:assert/strict'
import OpenCC from 'opencc-js/cn2t'
import { NIANJING, toUnits, decorateUnits } from '../src/data/nianjing.js'
import { syllableToZhuyin, pinyinToZhuyin } from '../src/utils/zhuyin.js'
import { zhuyinForText } from '../src/data/zhuyinReadings.js'
import { hantSutraText } from '../src/i18n/hantSutra.js'

const cases = {
  bō: 'ㄅㄛ', rě: 'ㄖㄜˇ', zhī: 'ㄓ', shí: 'ㄕˊ', zì: 'ㄗˋ', ér: 'ㄦˊ', lǜ: 'ㄌㄩˋ', nǚ: 'ㄋㄩˇ',
  lüè: 'ㄌㄩㄝˋ', jué: 'ㄐㄩㄝˊ', qù: 'ㄑㄩˋ', xuān: 'ㄒㄩㄢ', yún: 'ㄩㄣˊ', yuè: 'ㄩㄝˋ', yǒu: 'ㄧㄡˇ',
  yīn: 'ㄧㄣ', yíng: 'ㄧㄥˊ', yōng: 'ㄩㄥ', wǒ: 'ㄨㄛˇ', wèi: 'ㄨㄟˋ', wén: 'ㄨㄣˊ', wēng: 'ㄨㄥ',
  guī: 'ㄍㄨㄟ', liù: 'ㄌㄧㄡˋ', lún: 'ㄌㄨㄣˊ', jūn: 'ㄐㄩㄣ', xióng: 'ㄒㄩㄥˊ', zhuàng: 'ㄓㄨㄤˋ',
  ōng: 'ㄨㄥ', hōng: 'ㄏㄨㄥ', ē: 'ㄜ', de: '˙ㄉㄜ', ya: '˙ㄧㄚ', ài: 'ㄞˋ', ōu: 'ㄡ', ēn: 'ㄣ',
}
for (const [py, zy] of Object.entries(cases)) assert.equal(syllableToZhuyin(py), zy, py)
assert.deepEqual(pinyinToZhuyin('jiē dì jiē dì'), ['ㄐㄧㄝ', 'ㄉㄧˋ', 'ㄐㄧㄝ', 'ㄉㄧˋ'])

// 佛经常见读音（简体原文 + 经文拼音 → 注音）
const z = (t, py) => zhuyinForText(t, py).join(' ')
assert.equal(z('般若波罗蜜多', 'bō rě bō luó mì duō'), 'ㄅㄛ ㄖㄜˇ ㄅㄛ ㄌㄨㄛˊ ㄇㄧˋ ㄉㄨㄛ')
assert.equal(z('南无阿弥陀佛', 'nā mó ā mí tuó fó'), 'ㄋㄚˊ ㄇㄛˊ ㄚ ㄇㄧˊ ㄊㄨㄛˊ ㄈㄛˊ')
assert.equal(z('菩提萨婆诃', 'pú tí sà pó hē'), 'ㄆㄨˊ ㄊㄧˊ ㄙㄚˋ ㄆㄛˊ ㄏㄜ')
assert.equal(z('度一切苦厄', 'dù yí qiè kǔ è'), 'ㄉㄨˋ ㄧ ㄑㄧㄝˋ ㄎㄨˇ ㄜˋ')
assert.equal(z('不生不灭', 'bù shēng bú miè'), 'ㄅㄨˋ ㄕㄥ ㄅㄨˋ ㄇㄧㄝˋ')
assert.equal(z('受想行识', 'shòu xiǎng xíng shí'), 'ㄕㄡˋ ㄒㄧㄤˇ ㄒㄧㄥˊ ㄕˋ')
assert.equal(z('究竟涅槃', 'jiū jìng niè pán'), 'ㄐㄧㄡˋ ㄐㄧㄥˋ ㄋㄧㄝˋ ㄆㄢˊ')
assert.equal(z('礼拜供养', 'lǐ bài gòng yǎng'), 'ㄌㄧˇ ㄅㄞˋ ㄍㄨㄥˋ ㄧㄤˋ')
assert.equal(z('善男子', 'shàn nán zǐ'), 'ㄕㄢˋ ㄋㄢˊ ㄗˇ')
assert.equal(z('地藏菩萨', 'dì zàng pú sà'), 'ㄉㄧˋ ㄗㄤˋ ㄆㄨˊ ㄙㄚˋ')

const cv = OpenCC.Converter({ from: 'cn', to: 'tw' })
assert.equal(hantSutraText('于汝意云何？', cv), '於汝意云何？')
assert.equal(hantSutraText('菩萨布施，', cv), '菩薩布施，')
assert.equal(hantSutraText('众生发菩提心', cv, 'zhòng shēng fā pú tí xīn'), '眾生發菩提心')

for (const s of NIANJING) {
  const d = (await s.load()).default
  const hantLines = d.lines.map((l) => hantSutraText(l.text, cv, l.pinyin))
  hantLines.forEach((h, i) => assert.equal([...h].length, [...d.lines[i].text].length, `${s.slug} 第 ${i + 1} 行繁体字数变了`))
  const u = decorateUnits(toUnits(d.lines), hantLines)
  const bad = u.chars.filter((c) => c.py && !/^˙?[ㄅ-ㄩㄫ]+[ˊˇˋ]?$/u.test(c.zy || ''))
  assert.equal(bad.length, 0, `${s.slug} 有字没注音：${bad.slice(0, 5).map((c) => c.ch + c.py).join(' ')}`)
  const noDch = u.lines.flatMap((l) => l.tokens).filter((t) => !t.dch)
  assert.equal(noDch.length, 0, `${s.slug} 有字没换成繁体`)
  console.log('ok', s.slug, u.chars.length, '字')
}
console.log('注音检查全部通过')
