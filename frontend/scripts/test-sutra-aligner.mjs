import assert from 'node:assert/strict'
import { fuzzy, SutraAligner } from '../src/utils/sutraAligner.js'

assert.equal(fuzzy('zhào'), 'zao')
assert.equal(fuzzy('nā'), 'la')
assert.equal(fuzzy('kōng'), 'kon')
assert.equal(fuzzy('lǜ'), 'lu')

const PY = 'guān zì zài pú sà xíng shēn bō rě bō luó mì duō shí zhào jiàn wǔ yùn jiē kōng dù yí qiè kǔ è shè lì zǐ sè bù yì kōng kōng bù yì sè'.split(' ')
const script = () => PY.map((p) => [fuzzy(p)])
const say = (s) => s.split(' ').map((p) => [fuzzy(p)])

// advances on exact reading
let a = new SutraAligner(script())
assert.equal(a.feed(say('guān zì zài pú sà')), 5)
assert.equal(a.feed(say('guān zì zài pú sà xíng shēn bō rě')), 9)

// tolerates 2 wrong chars in 10
a = new SutraAligner(script())
a.seek(5)
assert.equal(a.feed(say('xíng shēn bō rě bō mā mì duō shí zhòu')), 14) // 末字念错就停在最后对上的字

// ignores unrelated speech
a = new SutraAligner(script())
a.seek(5)
assert.equal(a.feed(say('jīn tiān tiān qì zhēn hǎo wǒ men qù chī fàn')), -1)
assert.equal(a.pos, 5)

// handles re-reading
a = new SutraAligner(script())
a.seek(20)
assert.equal(a.feed(say('zhào jiàn wǔ yùn jiē kōng')), 20)
a.seek(25)
assert.equal(a.feed(say('zhào jiàn wǔ yùn jiē kōng')), 20)

// polyphone accepted：经文「般」可读 bo / ban，识别出 ban 也对上
const s2 = script()
s2[7] = [fuzzy('bō'), fuzzy('bān')]
s2[8] = [fuzzy('rě'), fuzzy('ruò')]
a = new SutraAligner(s2)
a.seek(5)
assert.equal(a.feed(say('xíng shēn bān ruò bō luó')), 11)

// 读音待核实的字（空集合）不会卡住
const s3 = script()
s3[2] = []
a = new SutraAligner(s3)
assert.equal(a.feed(say('guān zì pú sà')), 5)

// recovers after running far ahead：念快了超前 60 字以上，连续几次对不上后放大范围追回来
{
  const long = []
  for (let r = 0; r < 6; r++) long.push(...PY)
  const sl = long.map((p) => [fuzzy(p)])
  // 让第 4 遍的「照见五蕴皆空度一切苦厄」是唯一的：改掉其他几遍里的同一段
  for (let r = 0; r < 6; r++) if (r !== 3) for (let k = 14; k < 25; k++) sl[r * PY.length + k] = ['x' + r + k]
  const al = new SutraAligner(sl)
  al.seek(0)
  const far = say('zhào jiàn wǔ yùn jiē kōng dù yí qiè kǔ è')
  let got = -1
  for (let i = 0; i < 30 && got < 0; i++) got = al.feed(far)
  assert.ok(got > 3 * PY.length + 14, `追到第 4 遍：${got}`)
  assert.equal(al.feed(far), 3 * PY.length + 25) // 范围放大时可能先停在边上，下一次就对齐
}

// 经文有重复的句子：近处那句里有个字认错了，也不能跳到后面一模一样的那句去
{
  const long = [...PY, ...PY, ...PY].map((p) => [fuzzy(p)])
  long[PY.length + 10] = [fuzzy('mā')] // 第二遍里恰好有个字和认错的字同音
  const al = new SutraAligner(long)
  al.seek(5)
  assert.equal(al.feed(say('xíng shēn bō rě bō mā mì duō')), 13)
}

// 一点杂音、零碎的结果不会让查找范围放大
{
  const al = new SutraAligner(script())
  al.seek(5)
  for (let i = 0; i < 20; i++) al.feed(say('jīn tiān'))
  assert.equal(al.misses, 0)
}

console.log('aligner 全部通过')
