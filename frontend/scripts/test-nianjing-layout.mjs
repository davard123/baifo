// 念经页排版检查：段落/偈颂分块、卡拉OK分段、书页分页都不能重字漏字。
import assert from 'node:assert/strict'
import { NIANJING, toUnits } from '../src/data/nianjing.js'
import { buildBlocks, buildSegments, paginate, SEGMENT_MAX } from '../src/utils/nianjingLayout.js'

// 心经：相邻短句合并
{
  const d = (await NIANJING[0].load()).default
  const u = toUnits(d.lines)
  const segs = buildSegments(u.lines)
  assert.equal(segs[0].tokens.map((t) => t.ch).join(''), '观自在菩萨，行深般若波罗蜜多时，')
}

const SIZES = [
  { width: 300, fontPx: 25, rows: 5, topRows: 3 },
  { width: 335, fontPx: 36, rows: 8, topRows: 2.3 },
  { width: 560, fontPx: 25, rows: 10, topRows: 3.2 },
  { width: 900, fontPx: 30, rows: 30, topRows: 3.2 },
  { width: 100, fontPx: 36, rows: 3, topRows: 0 },
]
for (const s of NIANJING) {
  const d = (await s.load()).default
  const u = toUnits(d.lines)
  const blocks = buildBlocks(u.lines)
  // 每行恰好属于一个块
  const seen = blocks.flatMap((b) => b.lines)
  assert.deepEqual(seen, u.lines.map((_, i) => i), `${s.slug} 块没有盖满所有行`)
  const segs = buildSegments(u.lines, blocks)
  // 小段依次覆盖全部字，不重不漏，且每段非空
  let next = 0
  for (const g of segs) {
    assert.equal(g.start, next, `${s.slug} 小段不连续 @${g.start}`)
    assert.ok(g.end > g.start)
    const us = g.tokens.filter((t) => t.u !== undefined)
    assert.equal(us.length, g.end - g.start)
    // 段落小段不超 16 字（偈颂一排两句不受限）
    if (g.gapBefore === undefined) assert.ok(us.length <= SEGMENT_MAX, `${s.slug} 小段超长`)
    // parts 拼回 tokens
    assert.deepEqual(g.parts.flatMap((p) => p.tokens), g.tokens)
    next = g.end
  }
  assert.equal(next, u.chars.length, `${s.slug} 小段没盖满全部字`)
  // 偈颂块只出现在 puxian / pumen
  const hasVerse = blocks.some((b) => b.kind === 'verse')
  assert.equal(hasVerse, s.slug === 'puxian' || s.slug === 'pumen', `${s.slug} 偈颂判断`)
  // 分页：各页小段依次拼起来 = 全部小段
  for (const opt of SIZES) {
    const pages = paginate(segs, opt)
    assert.ok(pages.length >= 1)
    const flat = pages.flatMap((p) => p.groups.flatMap((gr) => gr.segs))
    assert.equal(flat.length, segs.length, `${s.slug} ${JSON.stringify(opt)} 页内小段数不对`)
    flat.forEach((g, i) => assert.equal(g, segs[i], `${s.slug} 第 ${i} 个小段顺序不对`))
    pages.forEach((p, i) => {
      assert.ok(p.groups.length > 0, `${s.slug} 第 ${i} 页是空的`)
      assert.equal(p.start, p.groups[0].segs[0].start)
    })
    // 品名只在每块第一段之前出现一次
    const heads = pages.flatMap((p) => p.groups.filter((gr) => gr.heading))
    assert.equal(heads.length, blocks.filter((b) => b.headStart).length, `${s.slug} 品名数`)
  }
  console.log('ok', s.slug, blocks.length, '块', segs.length, '段')
}

// 普贤行愿品：两句一排
{
  const m = NIANJING.find((x) => x.slug === 'puxian')
  const d = (await m.load()).default
  const u = toUnits(d.lines)
  const b = buildBlocks(u.lines)
  assert.ok(b.every((x) => x.kind === 'verse'))
  assert.ok(b.every((x) => x.rows.every((r) => r.lines.length === 2)))
  const first = buildSegments(u.lines, b)[0]
  assert.equal(first.tokens.map((t) => t.ch).join(''), '所有十方世界中，　三世一切人师子，')
}
console.log('排版测试全部通过')
