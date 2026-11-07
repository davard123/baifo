import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRecovery, recoverableLoader } from '../../src/recovery/route-recovery.mjs';
import { createDismissFocus, localeForPath, copyForLocale, liveText } from '../../src/recovery/recovery-accessibility.mjs';

function setup(initial = false) {
  const queue = [], nodes = {};
  let active, focused = [];
  for (const name of ['body', 'prior', 'dismiss', 'home', 'other']) nodes[name] = {
    isConnected: true, useful: name !== 'body', focus() { active = this; focused.push(name); },
  };
  active = initial ? nodes.body : nodes.prior;
  const recovery = createRecovery({ origin: 'https://example.test', navigate() {} });
  const focus = createDismissFocus({ getActive: () => active,
    isWithinPanel: n => n === nodes.dismiss,
    isUseful: n => Boolean(n?.isConnected && n.useful),
    getFallback: () => nodes.home, isNeutral: n => n === nodes.body,
    afterRender: cb => queue.push(cb),
  });
  recovery.subscribe(s => focus.observe(s));
  return { nodes, recovery, focus, focused,
    setActive(n, event = false) { active = nodes[n]; if (event) focus.noteFocus(); },
    flush() { for (const cb of queue.splice(0)) cb(); },
    async fail(path = '/nianfo/') {
      const target = { path }; recovery.intent(); recovery.before(target);
      let error; try { await recoverableLoader(() => Promise.reject(new Error('secret')))(); } catch (e) { error = e; }
      recovery.error(error, target);
    },
  };
}
test('later error does not focus; explicit dismissal restores useful prior target', async () => {
  const h = setup(); await h.fail(); assert.deepEqual(h.focused, []);
  h.setActive('dismiss', true); assert.equal(h.focus.dismiss(h.recovery), true);
  h.setActive('body'); h.flush(); assert.deepEqual(h.focused, ['prior']);
});
test('initial failure dismissal uses persistent home fallback', async () => {
  const h = setup(true); await h.fail('/zh-hant/nianfo/'); h.setActive('dismiss');
  h.focus.dismiss(h.recovery); h.setActive('body'); h.flush(); assert.deepEqual(h.focused, ['home']);
});
test('removed prior target uses fallback', async () => {
  const h = setup(); await h.fail(); h.nodes.prior.isConnected = false;
  h.setActive('dismiss'); h.focus.dismiss(h.recovery); h.setActive('body'); h.flush();
  assert.deepEqual(h.focused, ['home']);
});
test('double dismissal schedules only one restoration', async () => {
  const h = setup(); await h.fail(); h.setActive('dismiss');
  assert.equal(h.focus.dismiss(h.recovery), true); assert.equal(h.focus.dismiss(h.recovery), false);
  h.flush(); assert.deepEqual(h.focused, ['prior']);
});
test('new idle navigation invalidates stale render tick', async () => {
  const h = setup(); await h.fail(); h.setActive('dismiss'); h.focus.dismiss(h.recovery);
  h.recovery.intent(); h.setActive('body'); h.flush(); assert.deepEqual(h.focused, []);
});
test('new error invalidates stale render tick', async () => {
  const h = setup(); await h.fail(); h.setActive('dismiss'); h.focus.dismiss(h.recovery);
  await h.fail('/zh-hant/nianfo/'); h.setActive('body'); h.flush(); assert.deepEqual(h.focused, []);
});
test('synchronous newer navigation during dismissal also invalidates tick', async () => {
  const h = setup(); await h.fail(); h.setActive('dismiss');
  h.focus.dismiss({ dismiss() { h.recovery.dismiss(); h.recovery.intent(); } });
  h.flush(); assert.deepEqual(h.focused, []);
});
test('user moved before or after dismissal: no focus steal', async () => {
  for (const before of [true, false]) {
    const h = setup(); await h.fail(); h.setActive(before ? 'other' : 'dismiss', true);
    h.focus.dismiss(h.recovery); if (!before) h.setActive('other', true);
    h.flush(); assert.deepEqual(h.focused, []);
  }
});
test('focus moved away then neutral still cancels; teardown cancels', async () => {
  for (const dispose of [false, true]) {
    const h = setup(); await h.fail(); h.setActive('dismiss'); h.focus.dismiss(h.recovery);
    if (dispose) h.focus.dispose(); else { h.setActive('other', true); h.setActive('body'); }
    h.flush(); assert.deepEqual(h.focused, []);
  }
});
test('fixed locales and mutually exclusive failure/polite text', () => {
  for (const locale of ['zh-Hans', 'zh-Hant']) {
    const c = copyForLocale(locale);
    assert.equal(localeForPath(null, locale), locale);
    assert.match(c.warning, locale === 'zh-Hant' ? /尚未儲存/ : /尚未保存/);
    assert.deepEqual(liveText({ status: 'idle' }, locale), { failure: '', progress: '' });
    assert.equal(liveText({ status: 'retrying' }, locale).failure, '');
    assert.equal(liveText({ status: 'failed' }, locale).progress, '');
  }
  assert.equal(localeForPath('/zh-hant/nianfo/'), 'zh-Hant');
  assert.equal(localeForPath('/nianfo/'), 'zh-Hans');
  assert.equal(copyForLocale('https://evil.test').home, '/');
  assert.equal(copyForLocale('zh-Hant').home, '/zh-hant/');
});
test('SOURCE ONLY: live-region containers persist, controls are native and separate', async () => {
  const s = await readFile(new URL('../../src/recovery/RecoveryShell.vue', import.meta.url), 'utf8');
  const regions = [...s.matchAll(/<div (role="(?:alert|status)"[^>]*)>(.*?)<\/div>/gs)];
  assert.equal(regions.length, 2);
  for (const [, attrs, content] of regions) {
    assert.doesNotMatch(attrs, /v-if|:key|v-show/);
    assert.doesNotMatch(content, /<button|<a\s/);
  }
  assert.match(s, /<a v-if="showEscape" ref="home" :href="copy.home"/);
  assert.match(s, /<h2 id="recovery-title"/);
  assert.equal((s.match(/<button type="button"/g) || []).length, 2);
  assert.doesNotMatch(s, /role="button"|v-html|autofocus|localStorage|sessionStorage|fetch\(|location\.|route\.query/);
  assert.match(s, /:focus-visible/); assert.match(s, /flex-wrap: wrap/);
  assert.match(s, /recovery\.retry\(\)/); assert.match(s, /recovery\.subscribe/);
});

test('SOURCE ONLY: escape appears on failure, survives dismissal, clears on new idle publication', async () => {
  const s = await readFile(new URL('../../src/recovery/RecoveryShell.vue', import.meta.url), 'utf8');
  assert.match(s, /const showEscape = ref\(state.value.status !== 'idle'\)/);
  assert.match(s, /if \(value.status !== 'idle'\) showEscape.value = true/);
  assert.match(s, /else if \(!dismissing\) showEscape.value = false/);
  assert.match(s, /try \{ focus.dismiss\(recovery\); \} finally \{ dismissing = false; \}/);
});

test('SOURCE ONLY: recovery language, conversion and styles cannot wrap the existing page slot', async () => {
  const s = await readFile(new URL('../../src/recovery/RecoveryShell.vue', import.meta.url), 'utf8');
  const template = s.match(/<template>([\s\S]*?)<\/template>/)[1].replace(/<!--[\s\S]*?-->/g, '');
  const ancestors = [];
  let foundSlot = false;
  for (const match of template.matchAll(/<(\/?)([a-z][a-z0-9-]*)([^>]*?)>/g)) {
    const [, closing, tag, attrs] = match;
    if (closing) { assert.equal(ancestors.pop()?.tag, tag); continue; }
    if (tag === 'slot') {
      foundSlot = true;
      assert.equal(ancestors.length, 1);
      assert.equal(ancestors[0].attrs.trim(), 'class="recovery-shell"');
      assert.ok(ancestors.every(a => !/:lang|data-keep-script|recovery-ui/.test(a.attrs)));
    }
    if (!attrs.endsWith('/')) ancestors.push({ tag, attrs });
  }
  assert.ok(foundSlot);
  assert.match(template, /<div class="recovery-ui"[^>]* :lang="locale" data-keep-script>/);
  const css = s.match(/<style scoped>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /\.recovery-shell|:slotted|:deep|:global/);
  for (const match of css.matchAll(/([^{}]+)\{/g)) {
    const selector = match[1].trim();
    if (selector.startsWith('@media')) continue;
    for (const part of selector.split(',')) assert.match(part.trim(), /^\.recovery-ui(?:\.active)?(?:\s|$)/);
  }
});

test('fallback may mount after dismissal but before the post-render callback', async () => {
  const h = setup(true); await h.fail();
  h.nodes.home.isConnected = false;
  h.setActive('dismiss'); h.focus.dismiss(h.recovery);
  h.nodes.home.isConnected = true;
  h.setActive('body'); h.flush();
  assert.deepEqual(h.focused, ['home']);
});
test('fallback removed before callback is not focused', async () => {
  const h = setup(true); await h.fail();
  h.setActive('dismiss'); h.focus.dismiss(h.recovery);
  h.nodes.home.isConnected = false;
  h.setActive('body'); h.flush();
  assert.deepEqual(h.focused, []);
});
test('SOURCE/ARITHMETIC ONLY: two-color focus candidate has 3px white and black rings', async () => {
  const s = await readFile(new URL('../../src/recovery/RecoveryShell.vue', import.meta.url), 'utf8');
  assert.match(s, /outline: 3px solid #fff; outline-offset: 0; box-shadow: 0 0 0 6px #000;/);
  assert.match(s, /@media \(forced-colors: active\)[^}]+outline: 3px solid Highlight; outline-offset: 3px; box-shadow: none;/);
  // Relative luminance of ideal opaque white=1, black=0. This says nothing
  // about host background, clipping, actual painting, or WCAG conformance.
  assert.equal((1 + .05) / (0 + .05), 21);
  assert.ok(3 >= 2 && (6 - 3) >= 2);
});
