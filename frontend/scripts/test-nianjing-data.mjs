// 念经板块数据检查：每部经都能加载；每行汉字数 = 拼音音节数（否则拼音会错位）。
import assert from 'node:assert/strict'
import { NIANJING, toUnits, hanCount, buddhaImages, UNVERIFIED_CHARS } from '../src/data/nianjing.js'

assert.equal(NIANJING.length, 12)
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
  console.log('ok', s.slug, u.chars.length, '字')
}
const x = toUnits([{ text: '观自在菩萨，', pinyin: 'guān zì zài pú sà' }])
assert.deepEqual(x.lines[0].tokens.at(-1), { ch: '，' })
assert.equal(x.chars[4].py, 'sà')
console.log('全部通过')
