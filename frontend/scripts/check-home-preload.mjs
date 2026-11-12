import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8')
const heroPreload = /<link rel="preload" as="image" href="\/qiucai\/caishen-hero\.webp\?v=2" fetchpriority="high" \/>/g
for (const page of ['index.html', 'zh-hant/index.html']) {
  assert.equal([...read(page).matchAll(heroPreload)].length, 1, `${page}: exactly one hero preload`)
}
for (const page of ['qiucai/index.html', 'guide/overview/index.html', '404.html']) {
  assert.equal([...read(page).matchAll(heroPreload)].length, 0, `${page}: no unrelated homepage download`)
}
console.log('Homepage-only hero preload: PASS (simplified, traditional, other pages, 404)')
