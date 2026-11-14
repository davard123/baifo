import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// 2026-11：首页第一屏改为礼佛，求财横幅图改懒加载，不再预加载财神大图
const read = path => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8')
const heroPreload = /<link rel="preload" as="image" href="\/qiucai\/caishen-hero\.webp/g
for (const page of ['index.html', 'zh-hant/index.html', 'qiucai/index.html', 'guide/overview/index.html', '404.html']) {
  assert.equal([...read(page).matchAll(heroPreload)].length, 0, `${page}: no hero preload`)
}
console.log('No homepage hero preload: PASS')
