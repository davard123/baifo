<script setup>
import { SOUND_HELP } from '../data/soundHelp.js'
</script>
<template>
  <section id="sound-help" class="explain card sound-help" aria-labelledby="sound-help-title">
    <h2 id="sound-help-title">{{ SOUND_HELP.title }}</h2>
    <p>{{ SOUND_HELP.intro }}</p>
    <section v-for="item in SOUND_HELP.faqs" :key="item.q">
      <h3>{{ item.q }}</h3><p>{{ item.a }}</p>
    </section>
    <p>{{ SOUND_HELP.disclaimer }}</p>
    <router-link to="/jing/">查看经文与诵读目录</router-link>
  </section>
</template>
<style scoped>
.sound-help { padding: 22px; line-height: 1.9; overflow-wrap: anywhere; }
h2,h3 { color: var(--accent); margin: 0 0 10px; }
h2 { font-size: 1.25rem; } h3 { font-size: 1.05rem; }
p { margin: 0 0 16px; color: var(--text-muted); }
a { display: inline-block; min-height: 44px; text-decoration: underline; }
</style>