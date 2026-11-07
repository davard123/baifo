<script setup>
// Eager recovery panel; kept outside RouterView so initial failures remain actionable.
// Keep baseline vue-integration.example.txt entry/router wiring and assumptions.
// Single instance. Host must provide its existing page h1; this uses an h2.
import { computed, inject, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { copyForLocale, createDismissFocus, liveText, localeForPath } from './recovery-accessibility.mjs';
const props = defineProps({
  controller: Object,
  initialLocale: { type: String, default: 'zh-Hans' },
  // Optional function returning a persistent, useful shell focus target.
  safeFocusTarget: Function,
});
const recovery = props.controller || inject('routeRecovery');
const state = shallowRef(recovery.getState());
const locale = ref(localeForPath(state.value.path, props.initialLocale));
const panel = ref(null), home = ref(null);
const showEscape = ref(state.value.status !== 'idle');
let dismissing = false;
const copy = computed(() => copyForLocale(locale.value));
const announcement = computed(() => liveText(state.value, locale.value));
const visible = computed(() => state.value.status !== 'idle');
// Conservative filter: host can supply a tabindex=-1 shell heading, not an
// arbitrary nonfocusable element. Browser focus behavior still needs testing.
function useful(element) {
  return Boolean(element && element.isConnected && typeof element.focus === 'function'
    && element.matches('a[href],button,input,select,textarea,[tabindex]')
    && !element.matches(':disabled,[aria-disabled="true"],input[type="hidden"]')
    && !element.closest('[hidden],[inert],[aria-hidden="true"]')
    && element.getClientRects().length && getComputedStyle(element).visibility === 'visible');
}
const focus = createDismissFocus({
  getActive: () => typeof document === 'undefined' ? null : document.activeElement,
  isWithinPanel: element => Boolean(element && panel.value?.contains(element)),
  isUseful: useful,
  isNeutral: element => !element || element === document.body || element === document.documentElement,
  getFallback: () => {
    const safe = props.safeFocusTarget?.();
    return useful(safe) ? safe : home.value;
  },
  afterRender: callback => { nextTick(callback); },
});
// Trusted synchronous, nonthrowing subscription, as required by baseline.
const unsubscribe = recovery.subscribe(value => {
  focus.observe(value);
  if (value.status !== 'idle') showEscape.value = true;
  else if (!dismissing) showEscape.value = false;
  locale.value = localeForPath(value.path, locale.value);
  state.value = value;
});
function dismiss() {
  dismissing = true;
  try { focus.dismiss(recovery); } finally { dismissing = false; }
}
const onFocus = () => focus.noteFocus();
onMounted(() => document.addEventListener('focusin', onFocus, true));
onUnmounted(() => {
  focus.dispose(); unsubscribe();
  document.removeEventListener('focusin', onFocus, true);
});
</script>

<template>
  <div class="recovery-shell">
    <div class="recovery-ui" :class="{ active: showEscape }" :lang="locale" data-keep-script>
    <!-- Persistent empty containers: never v-if, keyed, or interactive. -->
    <div role="alert" aria-atomic="true"><p v-if="announcement.failure">{{ announcement.failure }}</p></div>
    <div role="status" aria-live="polite" aria-atomic="true"><p v-if="announcement.progress">{{ announcement.progress }}</p></div>
    <!-- Revealed by failure, retained on explicit dismissal, cleared on next
         controller navigation publication. Never shown on healthy startup. -->
    <p v-if="showEscape" id="recovery-warning">{{ copy.warning }}</p>
    <a v-if="showEscape" ref="home" :href="copy.home" aria-describedby="recovery-warning">{{ copy.homeLabel }}</a>
    <section v-if="visible" ref="panel" aria-labelledby="recovery-title" aria-describedby="recovery-warning">
      <h2 id="recovery-title">{{ copy.title }}</h2>
      <div class="recovery-actions">
        <button type="button" :disabled="state.status === 'retrying'" aria-describedby="recovery-warning" @click="recovery.retry()">{{ copy.retry }}</button>
        <button type="button" @click="dismiss()">{{ copy.dismiss }}</button>
      </div>
    </section>
    </div>
    <!-- Existing page keeps its own language, conversion and layout context. -->
    <slot />
  </div>
</template>

<style scoped>
.recovery-ui.active { position: relative; z-index: 1100; margin: 16px auto; padding: 20px; max-width: 720px; background: #211a29; border: 1px solid #f2c879; border-radius: 14px; color: #fff8e9; }
.recovery-ui p { margin: 0 0 12px; }
.recovery-ui h2 { margin: 12px 0; font-size: 1.25rem; }
.recovery-ui { min-inline-size: 0; max-inline-size: 100%; overflow-wrap: anywhere; }
.recovery-ui .recovery-actions { display: flex; flex-wrap: wrap; gap: .75rem; }
.recovery-ui button, .recovery-ui a { font: inherit; max-inline-size: 100%; }
.recovery-ui button { white-space: normal; min-block-size: 2.75rem; padding: .5rem .75rem; }
.recovery-ui a { display: inline-block; padding-block: .5rem; }
/* Two-color candidate: each ring is 3px. Verify clipping, backgrounds and
   forced-colors behavior in the host browser; this is not a contrast audit. */
.recovery-ui button:focus-visible, .recovery-ui a:focus-visible { outline: 3px solid #fff; outline-offset: 0; box-shadow: 0 0 0 6px #000; }
@media (forced-colors: active) { .recovery-ui button:focus-visible, .recovery-ui a:focus-visible { outline: 3px solid Highlight; outline-offset: 3px; box-shadow: none; } }
</style>
