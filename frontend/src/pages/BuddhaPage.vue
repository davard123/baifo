<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BUDDHAS } from '../data/buddhas.js'
import PrayerStage from '../components/PrayerStage.vue'
import RitualButtons from '../components/RitualButtons.vue'
import WishForm from '../components/WishForm.vue'
import { apiFetch } from '../api.js'

const route = useRoute()
const router = useRouter()

const buddha = computed(() => BUDDHAS.find(b => b.slug === route.params.slug))
if (!buddha.value) router.replace('/')
const relatedBuddhas = computed(() => BUDDHAS.filter(b => b.slug !== route.params.slug).slice(0, 3))

onMounted(() => {
  if (!buddha.value) return
  const b = buddha.value
  document.title = `${b.namo} | 在线礼佛祈愿 - www.fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content', `虔诚礼敬${b.name}，${b.subtitle}。${b.desc} 在线发愿，功德回向一切众生。`
  )
  const qa = [
    { q: `什么是${b.name}？`, a: `${b.name}，${b.subtitle}。${b.desc}` },
    { q: `礼敬${b.name}有什么功德？`, a: `礼敬${b.name}可消业障、增福慧、开智慧。${b.wish}` },
    { q: `${b.name}适合什么人祈愿？`, a: `任何人都可以虔诚礼敬${b.name}，发愿修行，回向众生，功德无量。` }
  ]
  const ld = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": `如何正确礼敬${b.name}？`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `礼敬${b.name}的方法：1. 选择本页面，点相应供养按钮（献花、点灯、上香等）；2. 填写姓名、年龄，发愿内容；3. 点击"礼毕，回向众生"提交祈愿。祈愿内容将记录于数据库，功德回向一切众生。`
      }
    },
    "about": {
      "@type": "Thing",
      "name": b.name,
      "description": b.desc
    }
  }
  let el = document.getElementById('ld-qa')
  if (!el) {
    el = document.createElement('script')
    el.id = 'ld-qa'
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(ld)
})

const offeringItems = ref([])
const figureItems   = ref([])
const hasCandles    = ref(false)
const hasIncense    = ref(false)

function onRitual({ images, isFigure, isCandle, isIncense }) {
  if (isCandle)  { hasCandles.value = true; return }
  if (isIncense) { hasIncense.value = true; return }
  const items = images.map(src => ({ src, id: Date.now() + Math.random() }))
  if (isFigure) {
    figureItems.value = items
  } else {
    offeringItems.value.push(...items)
  }
}

async function onSubmit(payload) {
  const res = await apiFetch('/wishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, buddha: buddha.value?.slug })
  })
  const data = await res.json()
  if (!res.ok || data.status !== 'success') throw new Error(data.message || '提交失败')
  router.push('/')
}
</script>

<template>
  <div v-if="buddha" class="prayer-shell">
    <nav class="prayer-nav">
      <div class="breadcrumb-row">
        <router-link to="/" class="page-link">← 返回首页</router-link>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">{{ buddha.name }}</span>
      </div>
    </nav>

    <div class="prayer-layout">
      <section class="stage-section card">
        <PrayerStage :buddha="buddha" :offering-items="offeringItems" :figure-items="figureItems" :has-candles="hasCandles" :has-incense="hasIncense" />
      </section>

      <section class="panel-section card">
        <h1 class="namo-title">{{ buddha.namo }}</h1>
        <p class="buddha-desc">{{ buddha.desc }}</p>
        <div class="page-tags">
          <span>{{ buddha.subtitle }}</span>
          <span>在线礼佛</span>
          <span>祈愿回向</span>
        </div>
        <section class="meaning-section">
          <h2>礼敬意义</h2>
          <p>{{ buddha.name }}适合围绕{{ buddha.subtitle }}所代表的修行方向来发愿。页面支持供花、点灯、上香与祈愿回向，方便按礼佛步骤依次完成。</p>
        </section>
        <section class="faq-mini">
          <h2>常见问题</h2>
          <article>
            <h3>{{ buddha.name }}适合什么人礼敬？</h3>
            <p>任何希望以虔诚之心修福、积德、回向众生的人，都可以礼敬{{ buddha.name }}并发愿修行。</p>
          </article>
          <article>
            <h3>在这个页面上怎么完成祈愿？</h3>
            <p>先完成供养动作，再填写姓名、年龄和愿望内容，最后提交回向即可。</p>
          </article>
        </section>
        <section class="related-links">
          <h2>相关礼佛页面</h2>
          <div class="related-list">
            <router-link v-for="item in relatedBuddhas" :key="item.slug" :to="'/buddha/' + item.slug">
              {{ item.name }} · {{ item.subtitle }}
            </router-link>
          </div>
        </section>
        <hr class="divider" />
        <RitualButtons @ritual="onRitual" />
        <hr class="divider" />
        <WishForm :default-wish="buddha.wish" @submit="onSubmit" />
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ── 全屏容器 ── */
.prayer-shell {
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.5s ease;
}

.prayer-nav {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--surface);
  border-bottom: 1px solid rgba(212, 168, 67, 0.15);
}

.breadcrumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.crumb-sep,
.crumb-current {
  color: var(--text-muted);
  font-size: 0.86rem;
}

.prayer-layout {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* ── 横屏：图 2/3 | 内容 1/3 ── */
@media (orientation: landscape) {
  .prayer-layout { flex-direction: row; }

  .stage-section {
    flex: 2;
    padding: 0;
    border-radius: 0;
    border: none;
    box-shadow: none;
    overflow: hidden;
    background: #160800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .panel-section {
    flex: 1;
    overflow-y: auto;
    padding: 20px 20px 32px;
    border-radius: 0;
    border-left: 1px solid rgba(212, 168, 67, 0.18);
    box-shadow: none;
  }
}

/* ── 竖屏：图 5/6 | 内容条 1/6 ── */
@media (orientation: portrait) {
  .prayer-layout { flex-direction: column; }

  .stage-section {
    flex: 4;
    min-height: 0;
    padding: 0;
    border-radius: 0;
    border: none;
    box-shadow: none;
    overflow: hidden;
    background: #160800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .panel-section {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 16px 16px;
    border-radius: 0;
    border-top: 1px solid rgba(212, 168, 67, 0.2);
    box-shadow: none;
  }

  .namo-title { font-size: 1rem; margin-bottom: 4px; }
  .buddha-desc { font-size: 0.82rem; line-height: 1.6; margin-bottom: 0; }
  .divider { margin: 8px 0; }
}

/* ── PrayerStage 保持 3:4 比例居中，不强制拉伸 ── */
:deep(.stage) {
  aspect-ratio: 3/4;
  height: 100%;
  max-width: 100%;
  width: auto;
  max-height: 680px;
  border-radius: 0;
}

.namo-title {
  font-size: 1.5rem;
  color: var(--accent);
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: 10px;
  text-shadow: 0 1px 8px rgba(127, 90, 54, 0.2);
}

.buddha-desc {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.8;
  text-align: justify;
}

.page-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 10px;
}

.page-tags span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(212, 168, 67, 0.12);
  color: var(--accent);
  font-size: 0.78rem;
}

.meaning-section,
.faq-mini {
  margin-top: 14px;
}

.meaning-section h2,
.faq-mini h2,
.faq-mini h3 {
  color: var(--accent);
}

.meaning-section h2,
.faq-mini h2 {
  font-size: 1rem;
  margin-bottom: 8px;
}

.meaning-section p,
.faq-mini p {
  color: var(--text-muted);
  line-height: 1.75;
  font-size: 0.88rem;
}

.faq-mini article + article {
  margin-top: 10px;
}

.faq-mini h3 {
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.related-links {
  margin-top: 14px;
}

.related-links h2 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: var(--accent);
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-list a {
  color: var(--accent);
  text-decoration: none;
  font-size: 0.88rem;
}

.divider {
  border: none;
  border-top: 1px solid rgba(212, 168, 67, 0.2);
  margin: 16px 0;
}
</style>
