// 把念佛板块里已校对的经文（/jing/ 还没有的）导入成 src/data/sutras/*.js，给诵经板块用。
// 用法：node scripts/import-nianjing-texts.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { clearCustomDict, customPinyin, pinyin } from 'pinyin-pro'

const SRC = 'D:/document/念佛板块/text'
const FILES = {
  lengyan: 'lengyan',
  wangsheng: 'wangshengzhou',
  liuzi: 'liuzi',
  shixiaozhou: 'shixiaozhou',
  'yaoshi-zhenyan': 'yaoshi-zhenyan',
  yaoshi: 'yaoshijing',
}

for (const [slug, file] of Object.entries(FILES)) {
  const d = JSON.parse(readFileSync(`${SRC}/${file}.json`, 'utf8'))
  // 楞严咒定稿保留 TTS 专用 hints，不把读音辅助字段写进源文本；
  // 导入时用同一份 hints 为网站逐句拼音生成显示数据。
  if (!d.lines.some((line) => line.pinyin) && d.ttsHints) customPinyin(d.ttsHints)
  const lines = d.lines.map((l) => {
    const out = { n: l.n, text: l.text, pinyin: l.pinyin || pinyin(l.text, { toneSandhi: false }) }
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
  clearCustomDict('pinyin')
  console.log(slug, lines.length)
}
