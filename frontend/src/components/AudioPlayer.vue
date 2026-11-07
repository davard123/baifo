<script setup>
import { useBackgroundMusic } from '../composables/useBackgroundMusic.js'
defineProps({ inline: Boolean })
const { muted, toggle } = useBackgroundMusic()
</script>
<template>
  <button type="button" :class="inline ? 'audio-inline' : 'audio-btn'" @click="toggle">
    {{ muted ? '开启背景音乐' : '关闭背景音乐' }}
  </button>
</template>
<style scoped>
.audio-btn,.audio-inline {
  min-height: 44px; padding: 8px 12px; border-radius: 14px;
  border: 1px solid rgba(212,168,67,.6); background: #211a29;
  color: var(--text); font: inherit; font-size: .85rem; cursor: pointer;
}
.audio-btn { position: fixed; bottom: 92px; right: 24px; z-index: 998; }
.audio-btn:focus-visible,.audio-inline:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
@media(max-width:640px){ .audio-btn { right: 16px; bottom: 84px; } }
</style>
<style>
html.ritual-route .audio-btn { top: auto; bottom: 16px; left: 16px; right: auto; }
body:has([aria-modal="true"]) #app > .audio-btn { visibility: hidden; }
</style>
