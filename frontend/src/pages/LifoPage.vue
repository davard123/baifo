<script setup>
// 礼佛入口页 /lifo/：首页导航「礼佛」直接进这里（2026-11-09 David：导航要进具体页面，不在首页上下滚）。
import { BUDDHAS } from '../data/buddhas.js'
import { warmApi } from '../api.js'
</script>

<template>
  <main class="sub-shell">
    <nav class="sub-crumb"><router-link to="/">← 返回首页</router-link></nav>
    <header class="sub-head">
      <p class="sub-kicker">在线礼佛 · 诸佛菩萨</p>
      <h1>礼佛祈愿</h1>
      <p class="sub-lead">八位佛菩萨，各具大愿。选一位与你此刻心意相应的，供花、点灯、上香，再写下祈愿与回向。免费，不用注册。</p>
    </header>
    <div class="lifo-grid">
      <router-link
        v-for="b in BUDDHAS"
        :key="b.slug"
        :to="'/buddha/' + b.slug + '/'"
        class="lifo-card"
        :aria-label="`进入${b.name}礼佛页面`"
        @mouseenter="warmApi"
        @touchstart.passive="warmApi"
      >
        <span class="lifo-img"><img :src="b.thumb || b.image" :alt="b.name" decoding="async" /></span>
        <span class="lifo-name">{{ b.name }}</span>
        <span class="lifo-sub">{{ b.subtitle }}</span>
      </router-link>
    </div>
    <div class="sub-links">
      <router-link to="/nianjing/">自己念经（带拼音）→</router-link>
      <router-link to="/nianfo/">念佛计数 →</router-link>
      <router-link to="/guide/worship/">在线礼佛指南 →</router-link>
    </div>
  </main>
</template>

<style scoped>
.sub-shell {
  min-height: 100vh;
  padding: 16px max(20px, calc((100% - 1040px) / 2)) 72px;
  background: #f7f0e6;
  color: #392b24;
}
.sub-crumb a { color: #756558; text-decoration: none; }
.sub-head { margin: 18px 0 24px; }
.sub-kicker { margin: 0; color: #855408; letter-spacing: 0.2em; font-size: 0.82rem; }
.sub-head h1 { margin: 6px 0 10px; font-size: clamp(1.6rem, 5vw, 2.3rem); color: #7a2a1c; }
.sub-lead { margin: 0; color: #756558; max-width: 40em; line-height: 1.8; }
.lifo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}
.lifo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #2a1c36, #1a1224);
  border: 1px solid rgba(242, 200, 121, 0.22);
  text-decoration: none;
  color: #fff1d8;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.lifo-card:hover { transform: translateY(-4px); border-color: rgba(242, 200, 121, 0.5); }
.lifo-img {
  width: 82%;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(242, 200, 121, 0.35);
  background: #3a2550;
}
.lifo-img img { width: 100%; height: 100%; object-fit: cover; }
.lifo-name { margin-top: 10px; font-size: 1.08rem; font-weight: 700; letter-spacing: 0.05em; }
.lifo-sub { font-size: 0.8rem; color: rgba(244, 230, 204, 0.7); text-align: center; }
.sub-links { display: flex; flex-wrap: wrap; gap: 10px 20px; margin-top: 22px; }
.sub-links a { color: #8a4a1c; }
</style>
