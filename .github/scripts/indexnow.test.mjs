// node --test .github/scripts/indexnow.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeHtml, hashHtml, diffTables, parseSitemap } from './indexnow.mjs'

const page = (assetHash, cfId, body = '<h1>心经全文</h1>') => `<!doctype html><html><head>
<title>心经</title>
<script type="module" crossorigin src="/assets/index-${assetHash}.js"></script>
<link rel="modulepreload" crossorigin href="/assets/guides-${assetHash}.js">
<link rel="stylesheet" crossorigin href="/assets/index-${assetHash}.css">
</head><body><a href="https://fopusha.com/cdn-cgi/content?id=${cfId}" aria-hidden="true" rel="nofollow noopener" style="display: none !important">x</a>
<div id="app">${body}</div>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${cfId}"}'></script>
</body></html>`

test('构建哈希和 Cloudflare 每次请求的标记不算内容变化', () => {
  assert.equal(hashHtml(page('Cgw7ccDo', 'aaa')), hashHtml(page('Zz91kQ_x', 'bbb')))
  assert.ok(!normalizeHtml(page('A', 'B')).includes('cdn-cgi'))
})

test('正文变了能检出', () => {
  assert.notEqual(hashHtml(page('A', 'x')), hashHtml(page('A', 'x', '<h1>心经全文（带拼音）</h1>')))
})

test('比对：变了、新增、删除都提交，抓取失败的不算变且沿用旧哈希', () => {
  const old = { a: '1', b: '2', c: '3', gone: '9' }
  const d = diffTables(old, ['a', 'b', 'c', 'new', 'new'], { a: '1', b: 'X', new: '5' }, new Set(['c']))
  assert.deepEqual(d.changed, ['b'])
  assert.ok(d.added.includes('new'))
  assert.deepEqual(d.removed, ['gone'])
  assert.deepEqual(d.submit, ['b', 'new', 'gone']) // 同一网址只提交一次
  assert.equal(d.table.c, '3')
  assert.ok(!('gone' in d.table))
})

test('解析站点地图', () => {
  assert.deepEqual(parseSitemap('<url><loc> https://fopusha.com/a/?x=1&amp;y=2 </loc></url><url><loc>https://fopusha.com/</loc></url>'),
    ['https://fopusha.com/a/?x=1&y=2', 'https://fopusha.com/'])
})
