// 地藏经念经页补上流通本的卷首、卷尾仪文和卷上末、卷中末的「赞」（弘化社校本，David 2026-11 审定）。
// 数据来自 D:/document/念佛板块/text/dizang-yiwen/lines.json（逐字核对过的拼音，part: 卷首/卷尾/卷上末/卷中末）。
// 用法：node scripts/import-dizang-yiwen.mjs（可重复跑：先去掉上次加的仪文行（带 part 的），只留正文再合并）
//  - 正文 1–1064 行一个字不动（/jing/dizang 的录音时间轴按这些行号走）；
//  - 正文行号到 1064，所以仪文不能用 1001/2001：卷首 n 从 10001 起、卷尾从 20001 起、卷末赞从 30001 起，
//    放在正文前、正文后、品第四和品第九之后；仪文行都带 part，正文没有 part（/jing/dizang 按这个过滤）；
//  - 篇名只标在每篇第一行（地藏经正文的 heading 也是这样，toUnits 会一路带下去）；
//  - times（三遍、合掌三称……）只是提示，不是念诵文字：篇第一行的 times 显示在篇名后，其余行的 times 显示在该行末尾；
//  - 偈（每行两句）带 verse:true，念经页按偈颂一排一排排。
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { keepReadings } from './lib/keep-readings.mjs'

const FILE = 'src/data/sutras/dizang.js'
const SRC = 'D:/document/念佛板块/text/dizang-yiwen/lines.json'

const cur = (await import(new URL(`../${FILE}?t=${Date.now()}`, import.meta.url))).default
const body = cur.lines.filter((l) => !l.part)
if (body.length !== 1064 || body.at(-1).n !== 1064) throw new Error(`地藏经正文应为 1–1064 行，实际 ${body.length}`)

const src = JSON.parse(readFileSync(SRC, 'utf8'))
const verseLine = (l) => !!l.verse
const pick = (part, base) => {
  let prev = ''
  return src.filter((l) => l.part === part).map((l, i) => {
    const o = { n: base + i, text: l.text, pinyin: l.pinyin, part }
    if (l.heading !== prev) o.heading = l.heading
    prev = l.heading
    if (l.times) o.times = l.times
    if (verseLine(l)) o.verse = true
    return o
  })
}
const head = pick('卷首', 10001)
const tail = pick('卷尾', 20001)
const zan1 = pick('卷上末', 30001)
const zan2 = pick('卷中末', 30001 + zan1.length)
if (head.length !== 47 || tail.length !== 29 || zan1.length !== 3 || zan2.length !== 3) throw new Error('仪文行数不对')

const at = (heading) => body.findIndex((l) => l.heading === heading)
const i5 = at('地狱名号品第五')
const i10 = at('校量布施功德缘品第十')
if (i5 < 0 || i10 < 0) throw new Error('找不到品第五/品第十')
const lines0 = [...head, ...body.slice(0, i5), ...zan1, ...body.slice(i5, i10), ...zan2, ...body.slice(i10), ...tail]

const lines = await keepReadings(resolve(FILE), lines0) // 仪文行手改过的读音也保留
const { lines: _old, ...meta } = cur
writeFileSync(
  FILE,
  `// 由 D:/document/念佛板块/text/dizangjing-01~13.json 定稿数据生成（页面显示去掉引号），不要手改\n// 卷首/卷尾仪文与卷末赞由 scripts/import-dizang-yiwen.mjs 合并（n 10001+/20001+/30001+，都带 part；/jing/dizang 只用不带 part 的正文）\nexport default ${JSON.stringify({ ...meta, lines }, null, 1)}\n`,
)
console.log('dizang', body.length, '+ 卷首', head.length, '卷尾', tail.length, '卷末赞', zan1.length + zan2.length, '=', lines.length)
