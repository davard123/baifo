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

console.log('aligner 全部通过')
