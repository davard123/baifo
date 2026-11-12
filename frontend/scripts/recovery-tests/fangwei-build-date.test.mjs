import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTodayKey, getFangweiPages } from '../seo.fangwei.js';

// 构建时的「今天」按台湾时间：UTC 11-12 16:30 已是台湾 11-13 00:30
test('build date uses Asia/Taipei by default', () => {
  const now = new Date('2026-11-12T16:30:00Z');
  assert.equal(buildTodayKey(now), '2026-11-13');
  assert.equal(buildTodayKey(new Date('2026-11-12T15:59:00Z')), '2026-11-12');
});

test('time zone can be overridden', () => {
  const now = new Date('2026-11-12T16:30:00Z');
  assert.equal(buildTodayKey(now, 'UTC'), '2026-11-12');
  const saved = process.env.FANGWEI_TZ;
  process.env.FANGWEI_TZ = 'America/Los_Angeles';
  try { assert.equal(buildTodayKey(now), '2026-11-12'); }
  finally { if (saved === undefined) delete process.env.FANGWEI_TZ; else process.env.FANGWEI_TZ = saved; }
});

test('fangwei index page is written for the Taipei date', () => {
  const pages = getFangweiPages('2026-11-13');
  const index = pages.find((page) => page.path === '/caishen-fangwei');
  assert.ok(index.leadLink.path.endsWith('/2026-11-13'));
});
