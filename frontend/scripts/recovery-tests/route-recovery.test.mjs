import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecovery, safeRetryURL, recoverableLoader, observeHistory, installRecovery } from '../../src/recovery/route-recovery.mjs';

const origin = 'https://www.fopusha.com';
const route = path => ({ path, fullPath: `${path}?private=secret#anchor` });
async function loadError(reason = new TypeError('Failed fetch: https://secret.invalid/?token=secret')) {
  try { await recoverableLoader(() => Promise.reject(reason))(); }
  catch (error) { return error; }
  throw new Error('Expected rejection');
}
function fixture(navigate) {
  const visits = [];
  return { visits, recovery: createRecovery({ origin, navigate: navigate || (url => visits.push(url)) }) };
}
function routerFixture() {
  const hooks = { before: [], after: [], error: [] }, calls = [];
  const register = key => fn => {
    hooks[key].push(fn);
    return () => { hooks[key].splice(hooks[key].indexOf(fn), 1); };
  };
  const router = {
    push(target) { calls.push(['push', target, this]); return Promise.resolve(); },
    replace(target) { calls.push(['replace', target, this]); return Promise.resolve(); },
    beforeEach: register('before'), afterEach: register('after'), onError: register('error'),
  };
  return { router, hooks, calls };
}

for (const path of ['/nianfo', '/nianfo/', '/zh-hant/nianfo', '/zh-hant/nianfo/']) {
  test(`initial loader failure and explicit retry for ${path}`, async () => {
    const { recovery, visits } = fixture();
    const to = route(path);
    recovery.before(to); // initial app.use navigation has no public push call
    recovery.error(await loadError(), to);
    assert.equal(recovery.getState().status, 'failed');
    assert.deepEqual(visits, []);
    assert.equal(recovery.retry(), true);
    assert.deepEqual(visits, [origin + path.replace(/\/?$/, '/')]);
    assert.equal(recovery.getState().status, 'retrying');
    assert.equal(recovery.retry(), false);
    assert.equal(visits.length, 1);
    assert.ok(!JSON.stringify(recovery.getState()).includes('secret'));
  });
}

test('unsafe targets are rejected, including credentials, query/hash and encoded paths', () => {
  for (const path of ['//evil.test/nianfo/', 'https://evil.test/nianfo/', '/nianfo/?secret=x', '/nianfo/#x', '/nianfo/../', '/%6eianfo/', '/nianfo//', '/Nianfo/', '/nianfo\\', '/zh-hant/', '/', null, {}]) {
    assert.equal(safeRetryURL(origin, path), null);
  }
  for (const unsafe of ['javascript:alert(1)', 'file:///tmp', origin + '/', origin + '/path', 'https://user:pass@www.fopusha.com', origin + '?x=1', 'https://www.fopusha.com:443']) {
    assert.equal(safeRetryURL(unsafe, '/nianfo'), null);
    assert.throws(() => createRecovery({ origin: unsafe, navigate() {} }), TypeError);
  }
  assert.equal(safeRetryURL('http://localhost:8080', '/nianfo'), 'http://localhost:8080/nianfo/');
});

test('later failed route is used rather than previous successful route', async () => {
  const { recovery, visits } = fixture();
  const previous = route('/guide/'), failed = route('/zh-hant/nianfo');
  recovery.before(previous); recovery.after(previous);
  recovery.intent(); recovery.before(failed); recovery.error(await loadError(), failed);
  recovery.retry();
  assert.deepEqual(visits, [origin + '/zh-hant/nianfo/']);
});

test('generic errors and string-message lookalikes never show module recovery', async () => {
  for (const error of [new TypeError('Failed to fetch dynamically imported module'), new Error('Unable to preload CSS for x'), 'Failed to fetch', null, undefined, { message: 'ChunkLoadError' }]) {
    const { recovery } = fixture(); const to = route('/nianfo');
    recovery.before(to); recovery.error(error, to);
    assert.equal(recovery.getState().status, 'idle');
  }
});

test('tagged failure outside allowlist does not display or retry', async () => {
  const { recovery, visits } = fixture(); const to = route('/guide/');
  recovery.before(to); recovery.error(await loadError(), to);
  assert.equal(recovery.getState().status, 'idle'); assert.equal(recovery.retry(), false);
  assert.deepEqual(visits, []);
});

test('loader keeps successful module identity and does not retry itself', async () => {
  const module = { default: {} }; let calls = 0;
  assert.equal(await recoverableLoader(() => { calls++; return module; })(), module);
  assert.equal(calls, 1);
});

test('loader converts synchronous throw and primitive rejection without retaining raw data', async () => {
  for (const loader of [() => { throw new Error('sensitive detail'); }, () => Promise.reject('sensitive detail')]) {
    const { recovery } = fixture(); const to = route('/nianfo'); let caught;
    try { await recoverableLoader(loader)(); } catch (error) { caught = error; }
    assert.equal(caught.message, 'Route module unavailable');
    assert.equal(caught.cause, undefined);
    recovery.before(to); recovery.error(caught, to);
    assert.equal(recovery.getState().status, 'failed');
  }
});

test('new intent invalidates pending failure before newer first guard runs', async () => {
  const { recovery } = fixture(); const old = route('/nianfo');
  recovery.before(old);
  recovery.intent(); // newer navigation blocked temporarily in leave guard
  recovery.error(await loadError(), old);
  assert.equal(recovery.getState().status, 'idle');
});

test('late failure and completion cannot overwrite newer failed route', async () => {
  const { recovery } = fixture(); const old = route('/nianfo'), current = route('/zh-hant/nianfo');
  recovery.before(old); recovery.intent(); recovery.before(current);
  recovery.error(await loadError(), current);
  recovery.error(await loadError(), old); recovery.after(old);
  assert.deepEqual(recovery.getState(), { status: 'failed', path: '/zh-hant/nianfo/' });
});

test('same path repeated attempts distinguished by route object, not URL', async () => {
  const { recovery } = fixture(); const a = route('/nianfo'), b = route('/nianfo');
  recovery.before(a); recovery.error(await loadError(), a); recovery.dismiss();
  recovery.intent(); recovery.before(b); recovery.error(await loadError(), a);
  assert.equal(recovery.getState().status, 'idle');
  recovery.error(await loadError(), b);
  assert.equal(recovery.getState().status, 'failed');
});

test('dismissed attempt cannot resurrect itself; new attempt can fail again', async () => {
  const { recovery } = fixture(); const a = route('/nianfo'); const error = await loadError();
  recovery.before(a); recovery.error(error, a); recovery.dismiss(); recovery.error(error, a);
  assert.equal(recovery.getState().status, 'idle');
  const b = route('/nianfo'); recovery.intent(); recovery.before(b); recovery.error(error, b);
  assert.equal(recovery.getState().status, 'failed');
});

test('successful, aborted, cancelled, duplicate after hooks do not show error', async () => {
  for (const failure of [undefined, { type: 4 }, { type: 8 }, { type: 16 }]) {
    const { recovery } = fixture(); const to = route('/nianfo');
    recovery.before(to); recovery.after(to, failure); recovery.error(await loadError(), to);
    assert.equal(recovery.getState().status, 'idle');
  }
});

test('new navigation and success clear visible previous panel', async () => {
  const { recovery } = fixture(); const to = route('/nianfo');
  recovery.before(to); recovery.error(await loadError(), to);
  recovery.intent(); assert.equal(recovery.getState().status, 'idle');
  const next = route('/'); recovery.before(next); recovery.after(next);
  assert.equal(recovery.getState().status, 'idle');
});

test('synchronous navigation refusal leaves user able to retry without raw error', async () => {
  let count = 0; const { recovery } = fixture(() => { count++; throw new Error('sensitive URL'); });
  const to = route('/nianfo'); recovery.before(to); recovery.error(await loadError(), to);
  assert.equal(recovery.retry(), false); assert.equal(count, 1);
  assert.equal(recovery.getState().status, 'failed');
  assert.equal(recovery.retry(), false); assert.equal(count, 2);
});

test('subscriptions are immediate, immutable, removable, and disposal ignores late work', async () => {
  const { recovery, visits } = fixture(); const observed = [];
  const off = recovery.subscribe(state => observed.push(state));
  assert.equal(observed.length, 1); assert.ok(Object.isFrozen(observed[0]));
  recovery.intent(); assert.equal(observed.length, 2);
  off(); off(); recovery.intent(); assert.equal(observed.length, 2);
  const to = route('/nianfo'); recovery.before(to); recovery.dispose(); recovery.dispose();
  recovery.before(to); recovery.error(await loadError(), to); recovery.intent(); recovery.dismiss();
  recovery.subscribe(() => assert.fail('disposed listener called'))();
  assert.equal(recovery.retry(), false); assert.deepEqual(visits, []);
  assert.equal(recovery.getState().status, 'idle');
});

test('injected router hook adapter observes push/replace immediately and cleans up', async () => {
  const { recovery } = fixture(); const { router, hooks, calls } = routerFixture();
  const originals = [router.push, router.replace]; const dispose = installRecovery(router, recovery);
  assert.deepEqual(Object.values(hooks).map(list => list.length), [1, 1, 1]);
  const old = route('/nianfo'); hooks.before[0](old); hooks.error[0](await loadError(), old);
  assert.equal(recovery.getState().status, 'failed');
  await router.push('/'); assert.equal(recovery.getState().status, 'idle');
  hooks.error[0](await loadError(), old); assert.equal(recovery.getState().status, 'idle');
  await router.replace('/nianfo');
  assert.equal(calls.length, 2); assert.equal(calls[0][2], router);
  dispose(); dispose();
  assert.deepEqual(Object.values(hooks).map(list => list.length), [0, 0, 0]);
  assert.equal(router.push, originals[0]); assert.equal(router.replace, originals[1]);
});

test('cleanup does not overwrite a later method wrapper', () => {
  const { recovery } = fixture(); const { router } = routerFixture();
  const dispose = installRecovery(router, recovery); const replacement = () => {};
  router.push = replacement; dispose(); assert.equal(router.push, replacement);
});

test('history pop invalidates old failure before its router callback; unsubscribe forwarded', async () => {
  const { recovery } = fixture(); let callback, unlistened = false;
  const history = { location: '/', listen(fn) { callback = fn; return () => { unlistened = true; }; }, createHref(path) { assert.equal(this, history); return path; } };
  const wrapped = observeHistory(history, recovery); let args;
  const off = wrapped.listen((...values) => { args = values; assert.equal(recovery.getState().status, 'idle'); });
  const to = route('/nianfo'); recovery.before(to); recovery.error(await loadError(), to);
  callback('/other', '/nianfo', { delta: -1 });
  recovery.error(await loadError(), to); assert.equal(recovery.getState().status, 'idle');
  assert.equal(args[0], '/other'); assert.equal(wrapped.location, '/');
  assert.equal(wrapped.createHref('/nianfo'), '/nianfo'); off(); assert.equal(unlistened, true);
});

test('swallowed Vite preload rejection resolving undefined is still a tagged load failure', async () => {
  for (const missing of [undefined, null]) {
    const { recovery } = fixture(); const to = route('/nianfo'); let caught;
    try { await recoverableLoader(() => missing)(); } catch (error) { caught = error; }
    assert.ok(caught instanceof Error);
    recovery.before(to); recovery.error(caught, to);
    assert.equal(recovery.getState().status, 'failed');
  }
});

test('route redirect first guard replaces active target within the same navigation intent', async () => {
  const { recovery, visits } = fixture(); const source = route('/nianfo'), target = route('/zh-hant/nianfo');
  recovery.before(source); recovery.before(target);
  recovery.error(await loadError(), source); assert.equal(recovery.getState().status, 'idle');
  recovery.error(await loadError(), target); recovery.retry();
  assert.deepEqual(visits, [origin + '/zh-hant/nianfo/']);
});

test('real entry installs and removes sanitized diagnostic before mounting', async () => {
 const {readFile}=await import('node:fs/promises');
 const router=await readFile(new URL('../../src/router/index.js',import.meta.url),'utf8');
 const main=await readFile(new URL('../../src/main.js',import.meta.url),'utf8');
 const app=await readFile(new URL('../../src/App.vue',import.meta.url),'utf8');
 assert.match(router, /console.error\('\[route-navigation\] Navigation failed.'\)/);
 assert.match(router, /disposeRecovery\(\)/); assert.match(router, /disposeDiagnostic\(\)/);
 assert.ok(router.indexOf('installRecovery(router') < router.indexOf('router.beforeEach((to, from)'));
 assert.ok(main.indexOf("app.provide('routeRecovery'") < main.indexOf('app.use(router)'));
 assert.ok(main.indexOf('app.use(router)') < main.indexOf("app.mount('#app')"));
 assert.match(main, /app.unmount\(\)/); assert.match(main, /disposeRouterRecovery\(\)/);
 assert.match(app, /<RecoveryShell><router-view \/><\/RecoveryShell>/);
});
