<script setup>
// 祈福池页 /qifu/：首页导航「祈福池」直接进这里（2026-11-09 David：导航要进具体页面）。
import BlessingPool from '../components/BlessingPool.vue'
</script>

<template>
  <main class="sub-shell">
    <nav class="sub-crumb"><router-link to="/">← 返回首页</router-link></nav>
    <BlessingPool />
    <div class="sub-links">
      <router-link to="/qiucai/">在线拜财神 →</router-link>
      <router-link to="/lifo/">礼佛祈愿 →</router-link>
      <router-link to="/ancestors/">祭祀先人 →</router-link>
    </div>
  </main>
</template>

<style scoped>
.sub-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px 20px 72px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.sub-crumb a { color: var(--ink-soft, #756558); text-decoration: none; }
.sub-links { display: flex; flex-wrap: wrap; gap: 10px 20px; }
.sub-links a { color: var(--accent-light, #8a4a1c); }
</style>
