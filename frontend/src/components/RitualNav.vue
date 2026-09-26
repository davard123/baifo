<script setup>
// 礼佛页 / 拜祭页顶部导航。传入的 actions 与提交后 DedicationDone 用的是同一组，
// 保证顶部按钮和右侧面板里的按钮永远一致。
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  // [{ label, to, primary? }]
  actions: { type: Array, default: () => [] },
  label: { type: String, default: '页面导航' },
})

// 全屏：iPad Safari、安卓支持；iPhone Safari 不支持网页全屏，按钮自动隐藏
const canFullscreen = ref(false)
const isFullscreen = ref(false)

function currentFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null
}

function syncFullscreen() {
  isFullscreen.value = Boolean(currentFullscreenElement())
}

function toggleFullscreen() {
  if (currentFullscreenElement()) {
    ;(document.exitFullscreen || document.webkitExitFullscreen)?.call(document)
    return
  }
  const el = document.documentElement
  ;(el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)
}

onMounted(() => {
  canFullscreen.value = Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled)
  document.addEventListener('fullscreenchange', syncFullscreen)
  document.addEventListener('webkitfullscreenchange', syncFullscreen)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreen)
  document.removeEventListener('webkitfullscreenchange', syncFullscreen)
})
</script>

<template>
  <nav class="ritual-nav" :aria-label="label">
    <router-link
      v-for="action in actions"
      :key="action.label"
      :to="action.to"
      class="nav-btn"
      :class="{ 'nav-btn--primary': action.primary }"
    >
      {{ action.label }}
    </router-link>
    <button
      v-if="canFullscreen"
      type="button"
      class="nav-btn nav-btn--fs"
      :aria-label="isFullscreen ? '退出全屏' : '全屏'"
      :title="isFullscreen ? '退出全屏' : '全屏'"
      @click="toggleFullscreen"
    >
      {{ isFullscreen ? '✕' : '⛶' }}
    </button>
  </nav>
</template>

<style scoped>
.ritual-nav {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  background: var(--surface);
  border-bottom: 1px solid rgba(212, 168, 67, 0.15);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 6px 14px;
  border: 1px solid rgba(212, 168, 67, 0.35);
  border-radius: 10px;
  background: transparent;
  color: var(--accent);
  font-size: 0.86rem;
  text-decoration: none;
  white-space: nowrap;
}

.nav-btn--primary {
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  border-color: transparent;
  color: #2a1c0c;
  font-weight: 600;
}

.nav-btn--fs {
  margin-left: auto;
  min-width: 40px;
  padding-inline: 8px;
  font-size: 1.05rem;
}

.nav-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

@media (max-width: 480px) {
  .ritual-nav {
    gap: 6px;
    padding-inline: 8px;
  }

  .nav-btn {
    min-height: 36px;
    padding: 4px 10px;
    font-size: 0.8rem;
  }

  .nav-btn--fs {
    min-width: 34px;
    padding-inline: 6px;
  }
}
</style>
