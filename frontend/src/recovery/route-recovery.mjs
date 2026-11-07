/** Route-load recovery controller. No network or record-storage access. */
const paths = new Map([
  ['/nianfo', '/nianfo/'], ['/nianfo/', '/nianfo/'],
  ['/zh-hant/nianfo', '/zh-hant/nianfo/'], ['/zh-hant/nianfo/', '/zh-hant/nianfo/'],
]);
const loadFailures = new WeakSet();

// Wrap the complete Vite preload + import expression, not only import().
// A rejection here can be download, CSS preload, parsing or evaluation failure.
// Do not claim to distinguish those causes. Never retain the underlying error.
export function recoverableLoader(loader) {
  return async function () {
    try {
      const module = await loader();
      // A globally prevented Vite preload error may resolve to undefined.
      // Do not let that become an unclassified router error or blank route.
      if (module == null) throw new Error('Missing route module');
      return module;
    }
    catch {
      const error = new Error('Route module unavailable');
      loadFailures.add(error);
      throw error;
    }
  };
}

export function safeRetryURL(origin, path) {
  // Route.path only. Deliberately reject rather than parse query/hash input.
  const canonical = paths.get(path);
  if (!canonical) return null;
  try {
    const base = new URL(origin);
    if (!['https:', 'http:'].includes(base.protocol) || base.origin !== origin) return null;
    return new URL(canonical, base).href;
  } catch { return null; }
}

export function createRecovery({ origin, navigate }) {
  if (!safeRetryURL(origin, '/nianfo')) throw new TypeError('A trusted HTTP(S) origin is required');
  let revision = 0, active = null, disposed = false;
  let state = Object.freeze({ status: 'idle', path: null });
  const attempts = new WeakMap(), subscribers = new Set();
  const publish = (status, path = null) => {
    state = Object.freeze({ status, path });
    for (const subscriber of [...subscribers]) subscriber(state);
  };
  function intent() {
    if (disposed) return;
    revision += 1;
    active = null;
    publish('idle');
  }
  return {
    getState: () => state,
    // Trusted synchronous, nonthrowing app callbacks only; exceptions are not isolated.
    subscribe(listener) {
      if (disposed) return () => {};
      subscribers.add(listener);
      listener(state);
      return () => subscribers.delete(listener);
    },
    intent,
    before(to) {
      if (disposed) return;
      // This must be the FIRST global guard. The router checks cancellation
      // before this guard queue; newer push/pop intent invalidates old attempts.
      active = to;
      attempts.set(to, revision);
      publish('idle');
    },
    after(to, failure) {
      if (disposed || active !== to || attempts.get(to) !== revision) return;
      // Aborted/cancelled/duplicated navigation is not a module-load failure.
      active = null;
      publish('idle');
    },
    error(error, to) {
      if (disposed || active !== to || attempts.get(to) !== revision) return;
      if (!loadFailures.has(error) || !safeRetryURL(origin, to.path)) {
        active = null;
        publish('idle');
        return;
      }
      publish('failed', paths.get(to.path));
    },
    dismiss() {
      if (!disposed) { active = null; publish('idle'); }
    },
    retry() {
      if (disposed || state.status !== 'failed') return false;
      const path = state.path, url = safeRetryURL(origin, path);
      if (!url) return false;
      // Only a user event should call retry. No timers, counters or auto reloads.
      publish('retrying', path);
      try { navigate(url); }
      catch { if (!disposed && state.status === 'retrying') publish('failed', path); return false; }
      return true;
    },
    dispose() {
      disposed = true;
      revision += 1;
      active = null;
      subscribers.clear();
      state = Object.freeze({ status: 'idle', path: null });
    },
  };
}

// Install this history wrapper BEFORE createRouter; RouterHistory has other
// methods/properties, which are forwarded to the original object by the Proxy.
export function observeHistory(history, recovery) {
  return new Proxy(history, {
    get(target, key) {
      if (key === 'listen') return callback => target.listen((...args) => {
        recovery.intent();
        return callback(...args);
      });
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

// Install immediately after createRouter, before other guards and app.use().
export function installRecovery(router, recovery) {
  const push = router.push, replace = router.replace;
  const wrappedPush = function (...args) { recovery.intent(); return push.apply(this, args); };
  const wrappedReplace = function (...args) { recovery.intent(); return replace.apply(this, args); };
  router.push = wrappedPush;
  router.replace = wrappedReplace;
  const off = [
    router.beforeEach(to => { recovery.before(to); }),
    router.afterEach((to, from, failure) => recovery.after(to, failure)),
    router.onError((error, to) => recovery.error(error, to)),
  ];
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    for (const unsubscribe of off) unsubscribe();
    if (router.push === wrappedPush) router.push = push;
    if (router.replace === wrappedReplace) router.replace = replace;
    recovery.dispose();
  };
}
