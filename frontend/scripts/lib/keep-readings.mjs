// 导入脚本共用：重跑导入时不冲掉网站数据里已经手改过的读音。
// 念佛板块的原始 json 不是最新定稿——之后在 src/data/sutras/*.js 里直接改过的拼音（如 2026-11-12 的 437 处纠错、
// 普贤行愿品「辟支佛」pì、2026-11-23 全站「一切」yí qiè）都只在网站数据里。所以：
//  - 新数据里 n 和 text 都跟现有文件同一行对得上、拼音却不同 → 保留现有文件的拼音（视为手改），并在终端列出来；
//  - 文字变了、行是新加的、或现有文件不存在 → 用新数据；
//  - 确实要用原始数据的新读音时，带 --take-source 跑（会全部按新数据写，同样列出差异）。
import { existsSync } from 'node:fs'

const TAKE_SOURCE = process.argv.includes('--take-source')

export async function keepReadings(file, lines) {
  if (!existsSync(file)) return lines
  const cur = (await import(`${new URL(`file:///${file.replace(/\\/g, '/')}`).href}?t=${Date.now()}`)).default
  const byN = new Map((cur.lines || []).map((l) => [l.n, l]))
  const kept = []
  const out = lines.map((l) => {
    const old = byN.get(l.n)
    if (!old || old.text !== l.text || old.pinyin === l.pinyin) return l
    kept.push(`  ${l.n}「${l.text}」\n    现有 ${old.pinyin}\n    新的 ${l.pinyin}`)
    return TAKE_SOURCE ? l : { ...l, pinyin: old.pinyin }
  })
  if (kept.length) {
    console.log(`${file}：${kept.length} 行拼音和现有文件不同，${TAKE_SOURCE ? '按 --take-source 用新数据' : '保留现有（手改过的）读音；要用新数据请加 --take-source'}`)
    console.log(kept.slice(0, 20).join('\n') + (kept.length > 20 ? `\n  ……另 ${kept.length - 20} 行` : ''))
  }
  return out
}
