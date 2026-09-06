<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BUDDHAS } from '../data/buddhas.js'
import NotFoundPage from './NotFoundPage.vue'
import { GUIDES } from '../data/guides.js'

const route = useRoute()

const guides = GUIDES

const guide = computed(() => guides[route.params.slug])

onMounted(() => {
  if (!guide.value) return
  document.title = `${guide.value.title} | www.fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute('content', guide.value.description)
})

const quickReference = computed(() => [
  {
    name: '释迦牟尼佛',
    point: '进入本师释迦牟尼佛页面礼敬、发愿。',
  },
  {
    name: '观音菩萨',
    point: '常见于慈悲、平安、消灾、求助与普门应感相关主题。',
  },
  {
    name: '药师佛',
    point: '常见于健康、延寿、消灾与身体安乐相关主题。',
  },
  {
    name: '地藏菩萨',
    point: '常见于超荐、回向、追思先人和亡灵救度相关主题。',
  }
])
</script>

<template>
  <main v-if="guide" class="guide-shell">
    <nav class="top-nav">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span>/</span>
      <span>{{ guide.title }}</span>
    </nav>

    <header class="hero card">
      <div class="hero-copy">
        <p class="eyebrow">使用指南</p>
        <h1>{{ guide.heading }}</h1>
        <p class="hero-text">{{ guide.intro }}</p>

      </div>
    </header>

    <section class="content-grid">
      <article class="main-column card">
        <section v-for="section in guide.sections" :key="section.title" class="copy-section">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>

        <section v-if="route.params.slug === 'worship'" class="copy-section">
          <h2>不同佛菩萨的常见侧重</h2>
          <div class="reference-list">
            <article v-for="item in quickReference" :key="item.name" class="reference-item">
              <h3>{{ item.name }}</h3>
              <p>{{ item.point }}</p>
            </article>
          </div>
        </section>

        <section v-if="guide.faqs.length" class="copy-section">
          <h2>使用时可能遇到的问题</h2>
          <div class="faq-list">
            <article v-for="faq in guide.faqs" :key="faq.q" class="faq-item">
              <h3>{{ faq.q }}</h3>
              <p>{{ faq.a }}</p>
            </article>
          </div>
        </section>
      </article>

      <aside class="side-column card">
        <section class="side-section">
          <h2>相关页面</h2>
          <div class="side-links">
            <router-link v-for="item in guide.related" :key="item.to" :to="item.to">
              {{ item.label }}
            </router-link>
          </div>
        </section>

        <section class="side-section" v-if="route.params.slug === 'worship'">
          <h2>延伸阅读</h2>
          <div class="side-links">
            <router-link v-for="buddha in BUDDHAS.slice(0, 4)" :key="buddha.slug" :to="'/buddha/' + buddha.slug">
              {{ buddha.name }}
            </router-link>
          </div>
        </section>
      </aside>
    </section>
  </main>
  <NotFoundPage
    v-else
    title="指南页面未找到"
    message="这个指南地址不存在，可能是旧链接或拼写不同。可以从使用说明、礼佛指南或祭祖总览继续进入。"
  />
</template>

<style scoped>
.guide-shell {
  max-width: 1140px;
  margin: 0 auto;
  padding: 18px 20px 64px;
}

.top-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.88rem;
  margin-bottom: 18px;
}

.back-link {
  color: var(--accent);
  text-decoration: none;
}

.hero {
  margin-bottom: 20px;
}

.eyebrow {
  color: var(--gold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.78rem;
  margin-bottom: 10px;
}

.hero h1 {
  color: var(--accent);
  font-size: 2rem;
  margin-bottom: 12px;
}

.hero-text {
  color: var(--text-muted);
  line-height: 1.85;
  max-width: 760px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.tag-row span {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(212, 168, 67, 0.12);
  color: var(--accent);
  font-size: 0.8rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 20px;
}

.copy-section + .copy-section {
  margin-top: 24px;
}

.copy-section h2,
.reference-item h3,
.faq-item h3,
.side-section h2 {
  color: var(--accent);
}

.copy-section h2,
.side-section h2 {
  font-size: 1.05rem;
  margin-bottom: 10px;
}

.copy-section p,
.reference-item p,
.faq-item p,
.side-section p {
  color: var(--text-muted);
  line-height: 1.9;
  font-size: 0.94rem;
}

.reference-list,
.faq-list {
  display: grid;
  gap: 14px;
}

.reference-item,
.faq-item {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 248, 233, 0.05);
  border: 1px solid rgba(242, 200, 121, 0.14);
}

.reference-item h3,
.faq-item h3 {
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.side-section + .side-section {
  margin-top: 22px;
}

.side-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-links a {
  color: var(--accent);
  text-decoration: none;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .guide-shell {
    padding: 14px 12px 48px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 1.6rem;
  }
}
.copy-section p, .faq-item p, .side-section p { font-size: 1.0625rem; line-height: 1.95; }
.copy-section p + p { margin-top: 1em; }
.copy-section h2, .side-section h2 { font-size: 1.25rem; line-height: 1.55; }
.side-links a { padding: 10px 0; min-height: 44px; text-decoration: underline; text-underline-offset: 4px; }
@media(max-width: 900px) { .card { padding: 24px 20px; } }
</style>
