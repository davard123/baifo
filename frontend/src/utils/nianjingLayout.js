// 念经页的排版：把一行一行的经文连排成段落/偈颂，切成卡拉OK小段，再排进书页。
// 全是纯函数，不碰经文和拼音本身（只搬运 toUnits 给的 tokens），方便单独测试。

// 卡拉OK一屏显示的一段：按标点切，再拼成不超过这么多字
export const SEGMENT_MAX = 16

// 行尾是这些，下一行另起一段
const PARA_END = /[。！？；」』]$/
// 偈颂里，上一排以这些收尾，下一排前留小间距（一偈完了）
const VERSE_END = /[。！？：]$/

const isVerseLine = (l) => l.stanza !== undefined || l.part === '偈颂'

/**
 * 把经文行排成块：
 *  - { kind: 'para', lines: [行号…] }       连排的段落
 *  - { kind: 'verse', rows: [{ lines: [行号], gapBefore }] }   偈颂，一排一块
 * heading 变化处（headStart）一定另起一块。
 */
export function buildBlocks(lines) {
  const blocks = []
  let cur = null
  let prevHeading = ''
  lines.forEach((l, i) => {
    const heading = l.heading || ''
    const headStart = !!heading && heading !== prevHeading
    prevHeading = heading
    const verse = isVerseLine(l)
    const kind = verse ? 'verse' : 'para'
    if (!cur || headStart || cur.kind !== kind || cur.closed) {
      cur = { kind, heading, headStart, lines: [], rows: [], closed: false }
      blocks.push(cur)
    }
    cur.lines.push(i)
    if (verse) {
      const last = cur.rows.at(-1)
      // 带 stanza 的经（普贤行愿品）两句一排；普门品偈颂本来每行就是两句
      if (l.stanza !== undefined && last && last.lines.length === 1 && lines[last.lines[0]].stanza === l.stanza) {
        last.lines.push(i)
      } else {
        const prev = cur.rows.at(-1)
        const prevEnd = prev ? lines[prev.lines.at(-1)].text : ''
        cur.rows.push({ lines: [i], gapBefore: !!prev && VERSE_END.test(prevEnd) })
      }
    } else if (PARA_END.test(l.text)) {
      cur.closed = true
    }
  })
  return blocks.map((b) => {
    const { closed, ...rest } = b
    if (rest.kind === 'para') delete rest.rows
    return rest
  })
}

function makeSeg(pieces, lines) {
  // 同一行连着的片段并成一个 part
  const parts = []
  for (const p of pieces) {
    const last = parts.at(-1)
    if (last && last.line === p.line) last.tokens = last.tokens.concat(p.tokens)
    else parts.push({ line: p.line, tokens: p.tokens.slice() })
  }
  const tokens = parts.flatMap((p) => p.tokens)
  const us = tokens.filter((t) => t.u !== undefined)
  const first = lines[parts[0].line]
  return {
    line: parts[0].line,
    parts,
    tokens,
    start: us.length ? us[0].u : first.start,
    end: us.length ? us.at(-1).u + 1 : first.start,
  }
}

/** 切成卡拉OK小段：段落里相邻短句合并到不超过 SEGMENT_MAX 字；偈颂一排两句一段。 */
export function buildSegments(lines, blocks = buildBlocks(lines)) {
  const segs = []
  blocks.forEach((b, bi) => {
    const begin = segs.length
    if (b.kind === 'verse') {
      for (const row of b.rows) {
        const pieces = []
        row.lines.forEach((li, k) => {
          if (k) pieces.push({ line: li, tokens: [{ ch: '　', sep: true }] })
          pieces.push({ line: li, tokens: lines[li].tokens })
        })
        const s = makeSeg(pieces, lines)
        s.gapBefore = row.gapBefore
        s.block = bi
        segs.push(s)
      }
    } else {
      let cur = []
      let n = 0
      const flush = () => {
        if (cur.length) {
          const s = makeSeg(cur, lines)
          s.block = bi
          segs.push(s)
        }
        cur = []
        n = 0
      }
      for (const li of b.lines) {
        // 先按标点拆成短语
        const phrases = []
        let ph = []
        for (const t of lines[li].tokens) {
          ph.push(t)
          if (t.u === undefined) {
            phrases.push(ph)
            ph = []
          }
        }
        if (ph.length) phrases.push(ph)
        for (const p of phrases) {
          const len = p.filter((t) => t.u !== undefined).length
          if (n && n + len > SEGMENT_MAX) flush()
          if (len > SEGMENT_MAX) {
            // 一个短语就超长（咒语常见）：硬切
            let piece = []
            for (const t of p) {
              piece.push(t)
              if (t.u !== undefined) n += 1
              if (n >= SEGMENT_MAX) {
                cur.push({ line: li, tokens: piece })
                piece = []
                flush()
              }
            }
            if (piece.length) cur.push({ line: li, tokens: piece })
          } else {
            cur.push({ line: li, tokens: p })
            n += len
          }
        }
      }
      flush()
    }
    // 块里第一段带上「品名要显示」「段首」的记号
    for (let k = begin; k < segs.length; k += 1) {
      if (segs[k].end <= segs[k].start) continue
      segs[begin].paraStart = true
      if (b.headStart) segs[begin].heading = b.heading
      break
    }
  })
  const out = segs.filter((s) => s.end > s.start)
  out.forEach((s, i) => {
    s.idx = i
  })
  return out
}

// 品名小标题占的行数、偈颂一偈之间的小间距、段落之间的间距（按「行」算）
export const HEADING_ROWS = 1.7
export const VERSE_GAP_ROWS = 0.35
export const PARA_GAP_ROWS = 0.3

/**
 * 一个字单位在页面上占多宽（px）：汉字一个字号宽；拼音比字宽时 ruby 会被拼音撑开。
 * 拼音字号 0.45em，拉丁字母平均约 0.55em 宽，粗估宁大勿小。
 */
export function tokenWidth(t, fontPx) {
  if (t.u === undefined) return fontPx
  return Math.max(fontPx, (t.py || '').length * fontPx * 0.45 * 0.62)
}

const segWidth = (s, fontPx) => s.tokens.reduce((a, t) => a + (t.sep ? fontPx : tokenWidth(t, fontPx)), 0) + s.parts.length * 4

/**
 * 把小段排进书页。width 一行可用宽度（px）、fontPx 字号、rows 一页行数（行高 2.25 倍字号）、
 * topRows 第一页顶上经题块占的行数。
 * 返回 [{ start, groups: [{ block, kind, heading, segs }] }]，各页 segs 依次拼起来 = 全部 segs。
 * 一个段落可以跨页，只在小段边界断开。
 */
export function paginate(segments, { width, fontPx, rows, topRows = 0 }) {
  const pages = []
  if (!segments.length) return pages
  const avail = Math.max(fontPx * 4, width - fontPx * 0.8) // 换行总会浪费半个字左右
  const verseRows = (sg) => {
    const w = segWidth(sg, fontPx)
    if (w <= avail) return 1
    return sg.parts.reduce((a, p) => a + Math.max(1, Math.ceil(p.tokens.filter((t) => !t.sep).reduce((x, t) => x + tokenWidth(t, fontPx), 0) / avail)), 0)
  }
  const groupRows = (g) =>
    g.kind === 'verse'
      ? g.segs.reduce((a, sg) => a + verseRows(sg) + (sg.gapBefore ? VERSE_GAP_ROWS : 0), 0) + PARA_GAP_ROWS
      : Math.ceil(g.segs.reduce((a, sg) => a + segWidth(sg, fontPx), 0) / avail) + PARA_GAP_ROWS
  const startPage = () => ({ start: 0, groups: [], used: pages.length ? 0 : topRows })
  let page = startPage()
  for (const sg of segments) {
    const kind = sg.gapBefore !== undefined ? 'verse' : 'para'
    const g = page.groups.at(-1)
    const sameGroup = g && g.block === sg.block && !sg.paraStart
    const cost = sameGroup
      ? groupRows({ kind: g.kind, segs: g.segs.concat(sg) }) - groupRows(g)
      : (sg.heading ? HEADING_ROWS : 0) + groupRows({ kind, segs: [sg] })
    if (page.groups.length && page.used + cost > rows) {
      pages.push(page)
      page = startPage()
      page.groups.push({ block: sg.block, kind, heading: sg.heading || '', segs: [sg] })
      page.start = sg.start
      page.used += (sg.heading ? HEADING_ROWS : 0) + groupRows({ kind, segs: [sg] })
      continue
    }
    if (!page.groups.length) page.start = sg.start
    if (sameGroup) g.segs.push(sg)
    else page.groups.push({ block: sg.block, kind, heading: sg.heading || '', segs: [sg] })
    page.used += cost
  }
  pages.push(page)
  return pages.map(({ start, groups }) => ({ start, groups }))
}

/** 一页的小段排成组：同一块（段落/偈颂）里连着的小段一组；块的第一段带品名时组上带 heading。 */
export function groupSegments(segs) {
  const groups = []
  for (const sg of segs) {
    const g = groups.at(-1)
    if (g && g.block === sg.block && !sg.paraStart) g.segs.push(sg)
    else groups.push({ block: sg.block, kind: sg.gapBefore !== undefined ? 'verse' : 'para', heading: sg.heading || '', segs: [sg] })
  }
  return groups
}

/**
 * 实测分页：tops[i]/bottoms[i] 是第 i 个小段在「整篇连续排下来」里的上沿（含它前面的品名、第一个小段含经题块）和下沿。
 * 一页从小段 s 起，尽量多放，直到 bottoms[e] - tops[s] 超过 pageH；至少放一个。
 * 返回 [{ s, e }]（左闭右开），依次首尾相接盖满 0…n。
 */
export function paginateByHeights(tops, bottoms, pageH) {
  const n = tops.length
  const ranges = []
  let s = 0
  while (s < n) {
    let e = s + 1
    while (e < n && bottoms[e] - tops[s] <= pageH) e += 1
    ranges.push({ s, e })
    s = e
  }
  return ranges
}

/** 把 [{ s, e }] 变成书页：[{ start, groups }]。 */
export function pagesFromRanges(segments, ranges) {
  return ranges.map(({ s, e }) => ({ start: segments[s].start, groups: groupSegments(segments.slice(s, e)) }))
}
