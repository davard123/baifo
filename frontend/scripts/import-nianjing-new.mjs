// 2026-11 新增：普贤行愿品补全文（长行 + 偈颂 + 流通分）、八大人觉经、仁王护国经（鸠摩罗什译本）。
// 数据来自 D:/document/念佛板块/text/{puxian-changhang,badaren}/lines.noquote.json（逐处核对过的拼音，站内一律不带引号）。
// 用法：node scripts/import-nianjing-new.mjs（重跑时保留网站数据里手改过的读音；要用原始数据的新读音加 --take-source）
//  - puxian.js：偈颂 248 行原样保留（文字、拼音、n、stanza 一个字不动，只补 part:'偈颂'）；
//    长行 n 从 1001 起、流通分 n 从 2001 起，避开 /jing/puxian 录音时间轴用的 1–248。
//  - badaren.js：新建。
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { keepReadings } from './lib/keep-readings.mjs'

const SRC = 'D:/document/念佛板块/text'
const OUT = 'src/data/sutras'
const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
// 重跑不冲掉网站数据里手改过的读音（见 lib/keep-readings.mjs；要用原始数据的新读音加 --take-source）
const write = async (slug, from, data) => {
  data.lines = await keepReadings(resolve(`${OUT}/${slug}.js`), data.lines)
  writeFileSync(`${OUT}/${slug}.js`, `// 由 ${from} 生成（scripts/import-nianjing-new.mjs），不要手改\nexport default ${JSON.stringify(data, null, 1)}\n`)
}

// ── 普贤行愿品 ──
const cur = (await import(new URL(`../${OUT}/puxian.js?t=${Date.now()}`, import.meta.url))).default
const verse = cur.lines.filter((l) => l.stanza !== undefined || l.part === '偈颂').map(({ n, stanza, text, pinyin }) => ({ n, stanza, text, pinyin, part: '偈颂' }))
if (verse.length !== 248) throw new Error(`偈颂应为 248 行，实际 ${verse.length}`)
const full = read(`${SRC}/puxian-changhang/lines.noquote.json`)
const head = full.filter((l) => l.n <= 199).map((l, i) => ({ n: 1001 + i, text: l.text, pinyin: l.pinyin, part: '长行' }))
const tail = full.filter((l) => l.n > 199).map((l, i) => ({ n: 2001 + i, text: l.text, pinyin: l.pinyin, part: '长行' }))
const HAN = /\p{Script=Han}/u
const han = (ls) => ls.reduce((a, l) => a + [...l.text].filter((c) => HAN.test(c)).length, 0)
await write('puxian', 'D:/document/念佛板块/text/puxian-jisong.json 与 puxian-changhang/lines.noquote.json', {
  slug: 'puxian',
  title: '普贤行愿品',
  fullTitle: '大方广佛华严经入不思议解脱境界普贤行愿品',
  translator: cur.translator,
  source: { name: 'CBETA 线上阅读', id: 'T10n0293', url: 'https://cbetaonline.dila.edu.tw/zh/T10n0293_p0844b' },
  license: cur.license,
  charCount: han(head) + han(verse) + han(tail),
  lines: [...head, ...verse, ...tail],
})
console.log('puxian', head.length, verse.length, tail.length, han(head) + han(verse) + han(tail))

// ── 八大人觉经 ──
const b = read(`${SRC}/badaren/lines.noquote.json`).map((l) => ({ n: l.n, text: l.text, pinyin: l.pinyin }))
await write('badaren', 'D:/document/念佛板块/text/badaren/lines.noquote.json', {
  slug: 'badaren',
  title: '八大人觉经',
  fullTitle: '佛说八大人觉经',
  translator: '后汉 安息国三藏安世高 译',
  source: { name: 'CBETA 线上阅读', id: 'T17n0779', url: 'https://cbetaonline.dila.edu.tw/zh/T17n0779_p0715b' },
  license: 'CBETA 电子佛典，CC BY-NC-SA 3.0 TW',
  charCount: han(b),
  lines: b,
})
console.log('badaren', b.length, han(b))

// ── 仁王经（2026-11 改用姚秦 鸠摩罗什译 T08n0245《佛说仁王般若波罗蜜经》，上下两卷八品；heading 是品名，没有陀罗尼）──
// 页面名仍叫「仁王护国经」；不空译本的数据与校对材料留在 念佛板块/text/renwang/，不再导入。
const r = read(`${SRC}/renwang-kumarajiva/lines.noquote.json`).map((l) => ({ n: l.n, text: l.text, pinyin: l.pinyin, part: l.part, heading: l.heading }))
await write('renwang', 'D:/document/念佛板块/text/renwang-kumarajiva/lines.noquote.json', {
  slug: 'renwang',
  title: '仁王护国经',
  fullTitle: '佛说仁王般若波罗蜜经',
  translator: '姚秦 三藏鸠摩罗什 译',
  source: { name: 'CBETA 线上阅读', id: 'T08n0245', url: 'https://cbetaonline.dila.edu.tw/zh/T08n0245_p0825a' },
  license: 'CBETA 电子佛典，CC BY-NC-SA 3.0 TW',
  charCount: han(r),
  lines: r,
})
console.log('renwang', r.length, han(r))
