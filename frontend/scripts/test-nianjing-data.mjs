// 念经板块数据检查：每部经都能加载；每行汉字数 = 拼音音节数（否则拼音会错位）。
import assert from 'node:assert/strict'
import { NIANJING, toUnits, hanCount, buddhaImages, labelTokens, sourceNote, UNVERIFIED_CHARS } from '../src/data/nianjing.js'

assert.equal(NIANJING.length, 14)
// 拼音里改正过的明显错误：[字, 错拼音, 只在含这个词时算错]；咒语不查
const MANTRA = new Set(['dabeizhou', 'liuzi', 'wangsheng', 'yaoshi-zhenyan', 'shixiaozhou'])
const WRONG_READINGS = [
  ['佛', 'fú'], ['藏', 'cáng', '地藏'], ['子', 'zi'], ['得', 'de'], ['了', 'le'], ['生', 'sheng'], ['卜', 'bo'],
  ['尽', 'jǐn', '尽形'], ['著', 'zhù', '著地'], ['彊', 'jiàng', '刚彊'], ['那', 'nuǒ', '兰那'], ['伽', 'gā'],
  ['辟', 'bì', '辟支'], ['舍', 'shě', '舍卫'], ['舍', 'shě', '舍宅'],
  ['尽', 'jǐn'], ['彊', 'jiàng'], ['刹', 'shā', '刹利'], ['刹', 'shā', '刹帝'], ['没', 'méi', '处没'], ['薄', 'báo', '薄蚀'],
  ['相', 'xiāng', '毫相'], ['相', 'xiāng', '相好'], ['相', 'xiāng', '丈夫相'], ['横', 'héng', '病横病'],
]

for (const s of NIANJING) {
  const mod = await s.load()
  const d = mod.default
  assert.ok(d.lines?.length > 0, `${s.slug} 没有经文`)
  for (const l of d.lines) {
    const syl = String(l.pinyin).trim().split(/\s+/).filter(Boolean).length
    assert.equal(hanCount(l.text), syl, `${s.slug} 第 ${l.n} 行汉字 ${hanCount(l.text)} 个、拼音 ${syl} 个：${l.text}`)
  }
  // 2026-11-12 改正过的明显读音错误不能再出现（从念佛板块原始数据重新导入时会带回来）
  if (!MANTRA.has(s.slug)) {
    for (const l of d.lines) {
      const pys = String(l.pinyin).trim().split(/\s+/).filter(Boolean)
      const hs = [...l.text].filter((c) => /\p{Script=Han}/u.test(c))
      hs.forEach((c, i) => {
        const near = hs.slice(Math.max(0, i - 2), i + 2).join('')
        const bad = WRONG_READINGS.find(([ch, py, w]) => ch === c && py === pys[i] && (!w || near.includes(w)))
        assert.ok(!bad, `${s.slug} 第 ${l.n} 行「${c}」标成 ${pys[i]}：${l.text}`)
      })
    }
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
