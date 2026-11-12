import fs from 'node:fs';
import assert from 'node:assert/strict';
import { canonicalUrl } from './seo.config.js';
import { getStaticPages } from './seo.jing.js';
import { buildTodayKey } from './seo.fangwei.js';

let count = 0;
for (const page of getStaticPages()) {
  const file = `dist${page.path === '/' ? '/index.html' : page.path.replace(/\/$/, '') + '/index.html'}`;
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('<nav aria-label="相关内容">'), file);
  assert.ok(html.includes(page.heading), file);
  assert.ok(!html.includes('const baseUrl ='), `Legacy schema overwrite in ${file}`);
  assert.ok(/<\/ul><\/section>\s*<\/nav>\s*<\/div><\/div>/.test(html), `Fallback closing tags in ${file}`);
  assert.ok(html.includes(`rel="canonical" href="${canonicalUrl(page.path)}"`), file);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(schemas.length, 1, `Expected one schema block in ${file}`);
  for (const schema of schemas) JSON.parse(schema[1]);
  count++;
}
// 「今日财神」总页（简繁）源码里的「今天」是台湾时间的构建当天
assert.equal(buildTodayKey(new Date('2026-11-12T16:30:00Z')), '2026-11-13', 'Build date must follow Asia/Taipei');
for (const file of ['dist/caishen-fangwei/index.html', 'dist/zh-hant/caishen-fangwei/index.html']) {
  assert.ok(fs.readFileSync(file, 'utf8').includes(`/caishen-fangwei/${buildTodayKey()}/`), `Today's (Asia/Taipei) fangwei link missing in ${file}`);
}
console.log(`PASS: ${count} generated pages: content, navigation, canonical, closing tags and JSON-LD.`);
