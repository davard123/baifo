<script setup>
import { ref } from 'vue'

const muted  = ref(true)
let audio    = null

function initAudio() {
  if (!audio) {
    audio = new Audio('/music/bgm.mp3')
    audio.loop   = true
    audio.volume = 0.35
    audio.muted  = true
    audio.play().catch(() => {})
  }
}

function toggle() {
  initAudio()
  muted.value = !muted.value
  audio.muted = muted.value
  if (!muted.value) {
    audio.play().catch(() => { muted.value = true })
  }
}
</script>

<template>
  <button class="audio-btn" @click="toggle" :title="muted ? '开启音乐' : '关闭音乐'">
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