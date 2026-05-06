<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TOPICS, getTopicKey } from '../data/topics.js'

const route = useRoute()
const router = useRouter()

const topicKey = computed(() => getTopicKey(route.path, route.params.slug))
const topic = computed(() => TOPICS[topicKey.value])
if (!topic.value) router.replace('/')

onMounted(() => {
  if (!topic.value) return
  document.title = `${topic.value.title} | www.fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute('content', topic.value.description)
})
</script>

<template>
  <main v-if="topic" class="topic-shell">
    <nav class="top-nav">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span>/</span>
      <span>{{ topic.title }}</span>
    </nav>

    <header class="hero card">
      <p class="eyebrow">专题指南</p>
      <h1>{{ topic.heading }}</h1>
      <p class="hero-text">{{ topic.intro }}</p>
      <div class="tag-row">
        <span v-for="tag in topic.tags" :key="tag">{{ tag }}</span>
      </div>
    </header>

    <section class="content-grid">
      <article class="main-column card">
        <section v-for="section in topic.sections" :key="section.title" class="copy-section">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>

        <section class="copy-section">
          <h2>常见问题</h2>
          <div class="faq-list">
            <article v-for="faq in topic.faqs" :key="faq.q" class="faq-item">
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
            <router-link v-for="item in topic.related" :key="item.to" :to="item.to">
              {{ item.label }}
            </router-link>
          </div>
        </section>

        <section class="side-section">
          <h2>阅读建议</h2>
          <p>如果你想先弄清楚不同主题之间的区别，再决定进入哪个页面，可以先看这一栏内容。</p>
        </section>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.topic-shell {
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
.faq-item p,
.side-section p {
  color: var(--text-muted);
  line-height: 1.9;
  font-size: 0.94rem;
}

.faq-list {
  display: grid;
  gap: 14px;
}

.faq-item {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 251, 242, 0.75);
  border: 1px solid rgba(212, 168, 67, 0.14);
}

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
  .topic-shell {
    padding: 14px 12px 48px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 1.6rem;
  }
}
</style>
