<script setup>
import { ref, onMounted } from 'vue'

/* Put a Buddhist chanting mp3 at /music/bgm.mp3 to enable audio.
   The player silently stays hidden until a file is found.             */
const AUDIO_SRC = '/music/bgm.mp3'

const muted = ref(false)
const visible = ref(false)
let audio = null

onMounted(() => {
  audio = new Audio(AUDIO_SRC)
  audio.loop = true
  audio.volume = 0.35

  audio.addEventListener('canplay', () => {
    visible.value = true
    audio.play().catch(() => {})
  }, { once: true })

  audio.addEventListener('error', () => {
    visible.value = false
  })
})

function toggle() {
  if (!audio) return
  muted.value = !muted.value
  audio.muted = muted.value
}
</script>

<template>
  <button
    v-if="visible"
    class="audio-btn"
    :title="muted ? '开启音乐' : '关闭音乐'"
    @click="toggle"
    :aria-label="muted ? '开启背景音乐' : '关闭背景音乐'"
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
