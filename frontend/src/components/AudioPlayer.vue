<script setup>
import { ref, onMounted } from 'vue'

const muted   = ref(false)
const visible = ref(false)
let audio     = null

onMounted(() => {
  audio = new Audio('/music/bgm.mp3')
  audio.loop  = true
  audio.volume = 0.35

  // 一旦元数据加载完成（即文件有效）就显示按钮
  audio.addEventListener('loadedmetadata', () => {
    visible.value = true
  })

  // 即使加载失败也不报错，静默处理
  audio.addEventListener('error', () => {
    visible.value = false
  })
})

function toggle() {
  if (!audio) return
  muted.value = !muted.value
  audio.muted = muted.value
  if (!muted.value) {
    audio.play().catch(() => { muted.value = true })
  }
}
</script>

<template>
  <button
    v-if="visible"
    class="audio-btn"
    :title="muted ? '开启音乐' : '关闭音乐'"
    @click="toggle"
  >
    {{ muted ? '🔇' : '🔔' }}
  </button>
</template>

<style scoped>
.audio-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(212, 168, 67, 0.4);
  background: rgba(255, 250, 240, 0.92);
  backdrop-filter: blur(8px);
  font-size: 1.1rem;
  box-shadow: 0 4px 16px rgba(68, 43, 17, 0.18);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.audio-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(68, 43, 17, 0.25);
}
</style>