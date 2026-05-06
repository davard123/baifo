<script setup>
import AudioPlayer from './components/AudioPlayer.vue'
</script>

<template>
  <img src="/music/7-25-100%20(1).jpg" aria-hidden="true" class="hidden-figure" />
  <router-view />
  <section class="site-disclaimer" aria-label="网站说明">
    <p>
      本站提供在线礼佛、祈愿、供养、回向与祭祖追思内容，旨在帮助用户静心、发愿、纪念与了解相关佛教文化。
      祈愿不构成对现实结果的保证，也不能替代医疗、心理、法律、财务或紧急专业帮助。
    </p>
  </section>
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
.site-disclaimer {
  max-width: 980px;
  margin: 0 auto 96px;
  padding: 0 20px;
  color: rgba(103, 83, 60, 0.78);
  font-size: 0.82rem;
  line-height: 1.8;
  text-align: center;
}
.site-disclaimer p {
  padding: 16px 18px;
  border: 1px solid rgba(212, 168, 67, 0.16);
  border-radius: 14px;
  background: rgba(255, 251, 242, 0.62);
}
@media (max-width: 600px) {
  .site-disclaimer {
    margin-bottom: 88px;
    padding: 0 12px;
    font-size: 0.78rem;
  }
}
</style>
