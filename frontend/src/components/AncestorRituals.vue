<script setup>
import { ref } from 'vue'

const RITUALS = [
  {
    key: 'incense',
    label: '🪔 上香',
    images: ['/04.gif'],
    once: true,
    isFigure: false,
    isCandle: false,
    isIncense: true,
    isWine: false,
    isPaper: false,
  },
  {
    key: 'flower',
    label: '🌸 献花',
    images: ['/02.gif'],
    once: true,
    isFigure: false,
    isCandle: false,
    isIncense: false,
    isWine: false,
    isPaper: false,
  },
  {
    key: 'bow',
    label: '🙏 叩拜',
    images: ['/05-1.gif', '/05-2.gif'],
    once: false,
    isFigure: true,
    isCandle: false,
    isIncense: false,
    isWine: false,
    isPaper: false,
  },
  {
    key: 'wine',
    label: '🍶 奠酒',
    images: [],
    once: true,
    isFigure: false,
    isCandle: false,
    isIncense: false,
    isWine: true,
    isPaper: false,
  },
  {
    key: 'paper',
    label: '🧧 烧纸',
    images: ['/04-1.png'],
    once: true,
    isFigure: false,
    isCandle: false,
    isIncense: false,
    isWine: false,
    isPaper: true,
  },
]

const emit = defineEmits(['ritual'])
const done = ref(new Set())
const toast = ref('')
let toastTimer = null

function showToast(message) {
  clearTimeout(toastTimer)
  toast.value = message
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2200)
}

function act(ritual) {
  if (ritual.once && done.value.has(ritual.key)) return
  if (ritual.once) {
    done.value = new Set([...done.value, ritual.key])
  }

  emit('ritual', {
    images: ritual.images,
    isFigure: ritual.isFigure,
    isCandle: ritual.isCandle,
    isIncense: ritual.isIncense,
    isWine: ritual.isWine,
    isPaper: ritual.isPaper,
  })

  const messages = {
    incense: '清香已上，敬告先人。',
    flower: '鲜花已献，聊表追思。',
    bow: '双人叩拜，礼敬先人。',
    wine: '奠酒已献，愿先人安享。',
    paper: '纸钱已焚，愿心意达于先人。',
  }
  showToast(messages[ritual.key] || '已完成。')
}
</script>

<template>
  <div class="ritual-wrap">
    <p class="ritual-hint">祭拜先人</p>
    <div class="ritual-grid">
      <button
        v-for="ritual in RITUALS"
        :key="ritual.key"
        class="ritual-btn"
        :class="{ done: ritual.once && done.has(ritual.key) }"
        :disabled="ritual.once && done.has(ritual.key)"
        @click="act(ritual)"
      >
        {{ ritual.label }}
      </button>
    </div>

    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
.ritual-wrap {
  position: relative;
}

.ritual-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: 0.06em;
}

.ritual-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.ritual-btn {
  padding: 10px 4px;
  font-size: 0.8rem;
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
  background: rgba(200, 190, 170, 0.12);
  color: #8a7a6a;
  border-color: #8a7a6a;
  cursor: default;
}

.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 20, 10, 0.88);
  color: #d0c8b0;
  padding: 10px 22px;
  border-radius: 24px;
  font-size: 0.92rem;
  letter-spacing: 0.05em;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.35s, transform 0.35s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

@media (max-width: 480px) {
  .ritual-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
