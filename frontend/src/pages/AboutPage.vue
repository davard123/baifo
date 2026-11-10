<script setup>
// 关于本站 /about/：网站介绍、常见问题、指南与专题入口。
// 2026-11-09 从首页搬过来——首页只留能直接用的入口，说明性的文字集中放在这里。
import { HOME_ABOUT, HOME_FAQS } from '../data/homeContent.js'

const guides = [
  { label: '使用说明', to: '/guide/overview/' },
  { label: '在线礼佛指南', to: '/guide/worship/' },
  { label: '网上拜佛怎么拜', to: '/guide/online-worship/' },
  { label: '海外华人怎么拜佛', to: '/guide/overseas-worship/' },
  { label: '在家拜佛怎么拜', to: '/guide/home-worship/' },
  { label: '在线祭祖指南', to: '/guide/ancestors/' },
  { label: '冬至祭祖指南', to: '/guide/dongzhi-2026/' },
  { label: '清明祭祖指南', to: '/guide/qingming-2027/' },
]
const topics = [
  { label: '功德回向怎么做', to: '/topic/merit-dedication/' },
  { label: '上香的意义', to: '/topic/offering-incense/' },
  { label: '点灯供佛', to: '/topic/offering-light/' },
  { label: '为家人祈求健康', to: '/topic/health/' },
  { label: '海外华人礼佛祭祖', to: '/topic/overseas-chinese/' },
  { label: '清明网上扫墓与祭祖', to: '/topic/qingming/' },
]
</script>

<template>
  <main class="sub-shell">
    <nav class="sub-crumb"><router-link to="/">← 返回首页</router-link></nav>
    <header class="sub-head">
      <p class="sub-kicker">关于本站</p>
      <h1>关于求财祈福拜佛网</h1>
    </header>

    <section class="ab-block">
      <p v-for="line in HOME_ABOUT" :key="line" class="about-text">{{ line }}</p>
    </section>

    <section class="ab-block">
      <h2>常见问题</h2>
      <details v-for="faq in HOME_FAQS" :key="faq.q" class="ab-faq">
        <summary>{{ faq.q }}</summary>
        <p>{{ faq.a }}</p>
      </details>
    </section>

    <section class="ab-block">
      <h2>指南</h2>
      <div class="ab-links">
        <router-link v-for="g in guides" :key="g.to" :to="g.to">{{ g.label }}</router-link>
      </div>
      <h2>专题</h2>
      <div class="ab-links">
        <router-link v-for="t in topics" :key="t.to" :to="t.to">{{ t.label }}</router-link>
      </div>
    </section>

    <section class="ab-block">
      <h2>联系</h2>
      <p>意见反馈与联系：<a href="mailto:fopushacom@gmail.com">fopushacom@gmail.com</a></p>
    </section>
  </main>
</template>

<style scoped>
.sub-shell {
  min-height: 100vh;
  padding: 16px max(20px, calc((100% - 760px) / 2)) 72px;
  background: #f7f0e6;
  color: #392b24;
}
.sub-crumb a { color: #756558; text-decoration: none; }
.sub-head { margin: 18px 0 8px; }
.sub-kicker { margin: 0; color: #855408; letter-spacing: 0.2em; font-size: 0.82rem; }
.sub-head h1 { margin: 6px 0 0; font-size: clamp(1.6rem, 5vw, 2.2rem); color: #7a2a1c; }
.ab-block { margin-top: 26px; }
.ab-block h2 { margin: 18px 0 10px; font-size: 1.2rem; color: #7a2a1c; }
.ab-block p { margin: 0 0 12px; line-height: 1.9; color: #4d3d33; }
.ab-block a { color: #8a4a1c; }
.ab-faq { border-bottom: 1px solid #e6d6c0; padding: 12px 0; }
.ab-faq summary { cursor: pointer; font-weight: 600; color: #392b24; }
.ab-faq p { margin: 10px 0 0; }
.ab-links { display: flex; flex-wrap: wrap; gap: 8px 10px; }
.ab-links a {
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid #d8c3a3;
  background: #fffaf2;
  text-decoration: none;
  font-size: 0.95rem;
}
</style>
