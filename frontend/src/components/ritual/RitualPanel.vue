<script setup>
// 两步仪式按钮：① 供养（上香 / 点灯 / 献花 / 供果）② 礼敬（按场景不同）。
// 第二排不锁：没供养完也能点，只是供养完成后才高亮提示。
import { OFFERINGS } from '../../composables/useRitual.js'

const props = defineProps({
  ritual: { type: Object, required: true },
  homageTitle: { type: String, default: '礼敬' },
})

function isDone(key) {
  return Boolean(props.ritual.state.done[key])
}
</script>

<template>
  <div class="ritual-panel">
    <section class="step" :class="{ complete: ritual.offeringsDone.value }">
      <p class="step-title"><span class="step-no">①</span> 供养</p>
      <div class="step-grid step-grid--4">
        <button
          v-for="item in OFFERINGS"
          :key="item.key"
          type="button"
          class="r-btn"
          :class="{ done: isDone(item.key) }"
          :disabled="isDone(item.key)"
          :aria-pressed="isDone(item.key)"
          @click="ritual.act(item.key)"
        >
          <span class="r-icon" aria-hidden="true">{{ isDone(item.key) ? '✓' : item.icon }}</span>
          <span class="r-label">{{ item.label }}</span>
        </button>
      </div>
    </section>

    <section class="step step--homage" :class="{ ready: ritual.offeringsDone.value }">
      <p class="step-title">
        <span class="step-no">②</span> {{ homageTitle }}
        <span v-if="ritual.offeringsDone.value" class="step-hint">供养已毕，请{{ homageTitle }}</span>
      </p>
      <div class="step-grid" :style="{ '--cols': ritual.homage.length }">
        <button
          v-for="item in ritual.homage"
          :key="item.key"
          type="button"
          class="r-btn"
          :class="{ done: !item.repeat && isDone(item.key) }"
          :disabled="!item.repeat && isDone(item.key)"
          @click="ritual.act(item.key)"
        >
          <span class="r-icon" aria-hidden="true">{{ !item.repeat && isDone(item.key) ? '✓' : item.icon }}</span>
          <span class="r-label">{{ item.label }}</span>
        </button>
      </div>
    </section>

    <transition name="r-toast">
      <div v-if="ritual.state.toast" class="r-toast" role="status">{{ ritual.state.toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
.ritual-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.step-no {
  font-size: 1rem;
}

.step-hint {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(240, 208, 145, 0.18);
  color: #f0d091;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  animation: hint-in 0.6s ease both;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
  gap: 8px;
}

.step-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.r-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 58px;
  padding: 8px 4px;
  border: 1px solid rgba(212, 168, 67, 0.4);
  border-radius: 12px;
  background: rgba(255, 248, 233, 0.06);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s, border-color 0.2s;
}

.r-btn:hover:not(:disabled) {
  background: rgba(240, 208, 145, 0.2);
  border-color: #f0d091;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(127, 90, 54, 0.25);
}

.r-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
}

.r-btn:focus-visible {
  outline: 2px solid #f0d091;
  outline-offset: 2px;
}

.r-btn.done {
  background: rgba(212, 168, 67, 0.14);
  border-color: rgba(212, 168, 67, 0.7);
  color: #e9c77e;
  cursor: default;
}

.r-icon {
  font-size: 1.25rem;
  line-height: 1.2;
}

.r-label {
  font-size: 0.86rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.step--homage .r-btn {
  opacity: 0.8;
}

.step--homage.ready .r-btn:not(.done) {
  opacity: 1;
  border-color: #f0d091;
  background: linear-gradient(135deg, rgba(224, 183, 110, 0.28), rgba(240, 208, 145, 0.14));
  animation: ready-glow 2.4s ease-in-out infinite;
}

.r-toast {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 64px);
  left: 50%;
  z-index: 1000;
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  padding: 10px 22px;
  border-radius: 999px;
  background: rgba(40, 24, 8, 0.9);
  color: #f0d080;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  text-align: center;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.r-toast-enter-active,
.r-toast-leave-active {
  transition: opacity 0.35s, transform 0.35s;
}

.r-toast-enter-from,
.r-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

@keyframes ready-glow {
  0%, 100% { box-shadow: 0 0 0 rgba(240, 208, 145, 0); }
  50% { box-shadow: 0 0 16px rgba(240, 208, 145, 0.45); }
}

@keyframes hint-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .step--homage.ready .r-btn:not(.done),
  .step-hint {
    animation: none;
  }
}
</style>
