<script setup>
import { ref } from 'vue'

const TRACKS = [
  '/music/Mah%C4%81k%C4%81ru%E1%B9%87ik%C4%81ya.mp3',
  '/music/The_River_Within_Stone.mp3',
  '/music/The_Temple_at_the_Headwaters.mp3',
  '/music/%E8%8E%B2%E5%BF%83%E6%B6%9F%E6%BC%AA.mp3',
  '/music/%E8%AA%93%E7%BA%A6%E5%BD%92%E7%9C%9F.mp3',
]

const muted = ref(true)
let audio = null
let currentIdx = -1
let playCount = 0

function nextIdx() {
  if (TRACKS.length === 1) return 0
  let n
  do { n = Math.floor(Math.random() * TRACKS.length) } while (n === currentIdx)
  return n
}

function playTrack(idx) {
  currentIdx = idx
  playCount = 1
  audio.src = TRACKS[idx]
  audio.currentTime = 0
  audio.play().catch(() => {})
}

function onEnded() {
  if (playCount < 4) {
    playCount++
    audio.currentTime = 0
    audio.play().catch(() => {})
  } else {
    playTrack(nextIdx())
  }
}

function toggle() {
  if (!audio) {
    audio = new Audio()
    audio.volume = 0.35
    audio.muted = true
    audio.addEventListener('ended', onEnded)
    playTrack(nextIdx())
  }
  muted.value = !muted.value
  audio.muted = muted.value
  if (!muted.value) {
    if (audio.paused) audio.play().catch(() => { muted.value = true; audio.muted = true })
  } else {
    audio.pause()
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
