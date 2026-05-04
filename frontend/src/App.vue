<script setup>
import AudioPlayer from './components/AudioPlayer.vue'
</script>

<template>
  <img src="/music/7-25-100%20(1).jpg" aria-hidden="true" class="hidden-figure" />
  <router-view />
  <AudioPlayer />
</template>

<style>
#app { min-height: 100vh; }
.hidden-figure {
  position: fixed;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
</style>
