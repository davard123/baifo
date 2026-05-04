<script setup>
import { ref } from 'vue'

const RITUALS = [
  { key: 'flower',  label: '🌸 献花',   images: ['/02.gif',   '/02.gif'],   once: true,  isFigure: false, isCandle: false, isIncense: false },
  { key: 'gift',    label: '🍑 献贡品', images: ['/04-1.png', '/04-2.png'], once: true,  isFigure: false, isCandle: false, isIncense: false },
  { key: 'light',   label: '🕯️ 点灯',   images: [],                         once: true,  isFigure: false, isCandle: true,  isIncense: false },
  { key: 'incense', label: '🪔 上香',   images: [],                         once: true,  isFigure: false, isCandle: false, isIncense: true  },
  { key: 'fruit',   label: '🍓 供果',   images: ['/01-1.gif', '/01-2.gif'], once: true,  isFigure: false, isCandle: false, isIncense: false },
  { key: 'bow',     label: '🙏 磕头',   images: ['/05-1.gif', '/05-2.gif'], once: false, isFigure: true,  isCandle: false, isIncense: false },
  { key: 'circle',  label: '🚶 绕佛',   images: [],                         once: false, isFigure: false, isCandle: false, isIncense: false },
]

const emit = defineEmits(['ritual'])
const done = ref(new Set())
const toast = ref('')
let toastTimer = null

function showToast(msg) {
  clearTimeout(toastTimer)
  toast.value = msg
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

function act(ritual) {
  if (ritual.once && done.value.has(ritual.key)) return
  if (ritual.once) done.value = new Set([...done.value, ritual.key])
  emit('ritual', { images: ritual.images, isFigure: ritual.isFigure, isCandle: ritual.isCandle, isIncense: ritual.isIncense })
  const msgs = {
    flower:  '鲜花已供奉于佛前，功德回向。',
    gift:    '贡品已供奉，愿佛菩萨欢喜纳受。',
    light:   '灯烛已点燃，愿慧灯常明。',
    incense: '香已上，心香馥郁，供养十方。',
    fruit:   '鲜果已供奉，愿福慧双增。',
    bow:     '一拜三叩首，礼敬十方诸佛。',
    circle:  '绕佛三匝，消业增福。',
  }
  showToast(msgs[ritual.key] || '已完成。')
}
</script>

<template>
  <div class="ritual-wrap">
    <p class="ritual-hint">礼佛供养</p>
    <div class="ritual-grid">
      <button
        v-for="r in RITUALS"
        :key="r.key"
        class="ritual-btn"
        :class="{ done: r.once && done.has(r.key) }"
        :disabled="r.once && done.has(r.key)"
        @click="act(r)"
      >
        {{ r.label }}
      </button>
    </div>

    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
.ritual-wrap { position: relative; }

.ritual-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: 0.06em;
}

.ritual-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.ritual-btn {
  padding: 10px 6px;
  font-size: 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--accent-light);
  background: rgba(255, 250, 240, 0.8);
  color: var(--text);
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  white-space: nowrap;
}
.ritual-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff8ee;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(127, 90, 54, 0.25);
}
.ritual-btn.done {
  background: rgba(212, 168, 67, 0.12);
  color: var(--gold);
  border-color: var(--gold);
  cursor: default;
}

/* Toast */
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(50, 30, 10, 0.88);
  color: #f0d080;
  padding: 10px 22px;
  border-radius: 24px;
  font-size: 0.92rem;
  letter-spacing: 0.05em;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.35s, transform 0.35s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }

@media (max-width: 480px) {
  .ritual-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
