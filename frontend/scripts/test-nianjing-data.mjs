// 念经板块数据检查：每部经都能加载；每行汉字数 = 拼音音节数（否则拼音会错位）。
import assert from 'node:assert/strict'
import { NIANJING, toUnits, hanCount, buddhaImages, labelTokens, sourceNote, UNVERIFIED_CHARS } from '../src/data/nianjing.js'

assert.equal(NIANJING.length, 14)
for (const s of NIANJING) {
  const mod = await s.load()
  const d = mod.default
  assert.ok(d.lines?.length > 0, `${s.slug} 没有经文`)
  for (const l of d.lines) {
    const syl = String(l.pinyin).trim().split(/\s+/).filter(Boolean).length
    assert.equal(hanCount(l.text), syl, `${s.slug} 第 ${l.n} 行汉字 ${hanCount(l.text)} 个、拼音 ${syl} 个：${l.text}`)
  }
  const u = toUnits(d.lines)
  const unverified = u.chars.filter((c) => UNVERIFIED_CHARS.has(c.ch)).length
  assert.equal(u.chars.length, d.lines.reduce((a, l) => a + hanCount(l.text), 0) + unverified)
  assert.equal(u.lines.length, d.lines.length)
  assert.ok(u.chars.every((c) => c.py || UNVERIFIED_CHARS.has(c.ch)), `${s.slug} 有字没拼音`)
  assert.ok(buddhaImages(s.buddha).length > 0, `${s.slug} 找不到佛像 ${s.buddha}`)
  // 经题块：汉字数 = 拼音音节数（译者拼音可留空，表示这行不标拼音）
  const h = s.header
  assert.ok(h?.title && h.titlePy && h.translator, `${s.slug} 缺 header`)
  assert.equal(!!h.sub, !!h.subPy, `${s.slug} sub 与 subPy 要同有同无`)
  for (const [k, py] of [['title', 'titlePy'], ['sub', 'subPy'], ['translator', 'translatorPy']]) {
    if (!h[k] || !h[py]) continue
    const syl = h[py].trim().split(/\s+/).length
    assert.equal(hanCount(h[k]), syl, `${s.slug} header.${k} 汉字 ${hanCount(h[k])} 个、拼音 ${syl} 个：${h[k]}`)
    assert.equal(labelTokens(h[k], h[py]).filter((t) => t.py).length, syl)
  }
  console.log('ok', s.slug, u.chars.length, '字')
}
const x = toUnits([{ text: '观自在菩萨，', pinyin: 'guān zì zài pú sà' }])
assert.deepEqual(x.lines[0].tokens.at(-1), { ch: '，' })
assert.equal(x.chars[4].py, 'sà')
const y = toUnits([{ text: '甲，', pinyin: 'jiǎ', heading: '乙' }, { text: '丙。', pinyin: 'bǐng' }])
assert.equal(y.lines[1].heading, '乙', '品名要一路带下去')
assert.equal(sourceNote('T08n0251'), '经文依 CBETA 电子佛典（T08n0251）校对注音')
assert.equal(sourceNote('T19/T20 各咒出处原经'), '经文依 CBETA 电子佛典各咒原经校对注音')
console.log('全部通过')
