// 把念佛板块里已校对的 5 部经（/jing/ 还没有的）导入成 src/data/sutras/*.js，给念经板块用。
// 用法：node scripts/import-nianjing-texts.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'D:/document/念佛板块/text'
const FILES = {
  wangsheng: 'wangshengzhou',
  liuzi: 'liuzi',
  shixiaozhou: 'shixiaozhou',
  'yaoshi-zhenyan': 'yaoshi-zhenyan',
  yaoshi: 'yaoshijing',
}

for (const [slug, file] of Object.entries(FILES)) {
  const d = JSON.parse(readFileSync(`${SRC}/${file}.json`, 'utf8'))
  const lines = d.lines.map((l) => {
    const out = { n: l.n, text: l.text, pinyin: l.pinyin }
    if (l.section) out.section = l.section
    return out
  })
  const data = {
    slug,
    title: d.title,
    fullTitle: d.fullTitle,
    translator: d.translator,
    source: d.source,
    license: d.license,
    charCount: d.charCount,
    lines,
  }
  writeFileSync(
    `src/data/sutras/${slug}.js`,
    `// 由 D:/document/念佛板块/text/${file}.json 生成（scripts/import-nianjing-texts.mjs），不要手改\nexport default ${JSON.stringify(data, null, 1)}\n`,
  )
  console.log(slug, lines.length)
}
