/** Presentational/focus helpers only. The original controller remains authoritative. */
export function localeForPath(path, fallback = 'zh-Hans') {
  if (path === '/zh-hant/nianfo/') return 'zh-Hant';
  if (path === '/nianfo/') return 'zh-Hans';
  return fallback === 'zh-Hant' ? 'zh-Hant' : 'zh-Hans';
}
const messages = {
  'zh-Hans': Object.freeze({ home: '/', homeLabel: '返回首页', title: '念佛页面恢复选项', failure: '念佛页面暂时无法载入。可稍后重试。', retrying: '正在重新打开念佛页面。', warning: '重新打开或返回首页可能使当前页面尚未保存的内容丢失。', retry: '重新打开', dismiss: '关闭提示' }),
  'zh-Hant': Object.freeze({ home: '/zh-hant/', homeLabel: '返回首頁', title: '念佛頁面復原選項', failure: '念佛頁面暫時無法載入。可稍後重試。', retrying: '正在重新開啟念佛頁面。', warning: '重新開啟或返回首頁可能使目前頁面尚未儲存的內容遺失。', retry: '重新開啟', dismiss: '關閉提示' }),
};
export function copyForLocale(locale) { return messages[locale === 'zh-Hant' ? 'zh-Hant' : 'zh-Hans']; }
export function liveText(state, locale) {
  const copy = copyForLocale(locale);
  return { failure: state.status === 'failed' ? copy.failure : '', progress: state.status === 'retrying' ? copy.retrying : '' };
}

/** Inject DOM access and a post-render scheduler. Tests use doubles, not a browser.
 * observe MUST run synchronously on every controller publication, including idle.
 * Call noteFocus on document focusin and dispose before removing that listener.
 */
export function createDismissFocus({ getActive, isWithinPanel, isUseful, getFallback, isNeutral, afterRender }) {
  let current = { status: 'idle' }, generation = 0, focusEpoch = 0;
  let prior = null, disposed = false, pending = false;
  return {
    observe(state) {
      if (disposed) return;
      generation++;
      if (current.status === 'idle' && state.status !== 'idle') {
        const active = getActive();
        prior = !isWithinPanel(active) && isUseful(active) ? active : null;
      }
      current = state;
    },
    noteFocus() { focusEpoch++; },
    dismiss(controller) {
      if (disposed || pending || current.status === 'idle') return false;
      const trigger = getActive();
      const shouldRestore = isWithinPanel(trigger);
      const epoch = focusEpoch;
      pending = true;
      const revision = generation + 1; // exactly one synchronous idle publication
      controller.dismiss(); // synchronous publication; no controller logic duplicated
      afterRender(() => {
        pending = false;
        if (disposed || !shouldRestore || current.status !== 'idle' || generation !== revision || focusEpoch !== epoch) return;
        const active = getActive();
        if (active !== trigger && !isNeutral(active)) return;
        const target = isUseful(prior) && !isWithinPanel(prior) ? prior : getFallback();
        if (isUseful(target)) target.focus();
      });
      return true;
    },
    dispose() { disposed = true; generation++; prior = null; },
  };
}
