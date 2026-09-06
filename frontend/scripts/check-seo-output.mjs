import fs from 'node:fs';
import assert from 'node:assert/strict';
import { getStaticPages, canonicalUrl } from './seo.config.js';

let count = 0;
for (const page of getStaticPages()) {
  const file = `dist${page.path === '/' ? '/index.html' : page.path.replace(/\/$/, '') + '/index.html'}`;
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('使用说明与主要入口'), file);
  assert.ok(html.includes(page.heading), file);
  assert.ok(!html.includes('const baseUrl ='), `Legacy schema overwrite in ${file}`);
  assert.ok(html.includes('</ul></nav>\n</div></div>'), `Fallback closing tags in ${file}`);
  assert.ok(html.includes(`rel="canonical" href="${canonicalUrl(page.path)}"`), file);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(schemas.length, 1, `Expected one schema block in ${file}`);
  for (const schema of schemas) JSON.parse(schema[1]);
  count++;
}
console.log(`PASS: ${count} generated pages: content, navigation, canonical, closing tags and JSON-LD.`);
