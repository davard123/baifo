<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BUDDHAS } from '../data/buddhas.js'
import PrayerStage from '../components/PrayerStage.vue'
import RitualButtons from '../components/RitualButtons.vue'
import WishForm from '../components/WishForm.vue'
import { apiFetch } from '../api.js'

const route = useRoute()
const router = useRouter()

const buddha = computed(() => BUDDHAS.find((item) => item.slug === route.params.slug))
const relatedBuddhas = computed(() => BUDDHAS.filter((item) => item.slug !== route.params.slug).slice(0, 3))

const offeringItems = ref([])
const figureItems = ref([])
const hasCandles = ref(false)
const hasIncense = ref(false)
const drawerOpen = ref(false)

function updatePageMeta() {
  if (!buddha.value) return

  const current = buddha.value
  document.title = `${current.namo} | 在线礼佛祈愿 - www.fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    `礼敬${current.name}，围绕${current.subtitle}发愿修行。页面支持献花、点灯、上香、礼拜与回向，帮助按顺序完成在线礼佛。`
  )

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: `如何礼敬${current.name}？`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `进入${current.name}页面后，可依次完成献花、点灯、上香等供养动作，再填写姓名、年龄与发愿内容，最后提交回向。`,
      },
    },
    about: {
      '@type': 'Thing',
      name: current.name,
      description: current.desc,
    },
  }

  let script = document.getElementById('ld-qa')
  if (!script) {
    script = document.createElement('script')
    script.id = 'ld-qa'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(ld)
}

watch(
  buddha,
  (current) => {
    if (!current) {
      router.replace('/')
      return
    }

    offeringItems.value = []
    figureItems.value = []
    hasCandles.value = false
    hasIncense.value = false
    drawerOpen.value = false
    updatePageMeta()
  },
  { immediate: true }
)

onMounted(() => {
  updatePageMeta()
})

function onRitual({ images, isFigure, isCandle, isIncense }) {
  if (isCandle) {
    hasCandles.value = true
    return
  }

  if (isIncense) {
    hasIncense.value = true
    return
  }

  const items = images.map((src) => ({ src, id: Date.now() + Math.random() }))
  if (isFigure) {
    figureItems.value = items
  } else {
    offeringItems.value.push(...items)
  }
}

async function onSubmit(payload) {
  const response = await apiFetch('/wishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, buddha: buddha.value?.slug }),
  })
  const data = await response.json()

  if (!response.ok || data.status !== 'success') {
    throw new Error(data.message || '提交失败')
  }

  router.push('/')
}
</script>

<template>
  <div v-if="buddha" class="prayer-shell">
    <nav class="prayer-nav">
      <div class="breadcrumb-row">
        <router-link to="/" class="page-link">返回首页</router-link>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">{{ buddha.name }}</span>
      </div>
    </nav>

    <div class="prayer-layout" :class="{ 'drawer-open': drawerOpen }">
      <section class="stage-section card">
        <PrayerStage
          :buddha="buddha"
          :offering-items="offeringItems"
          :figure-items="figureItems"
          :has-candles="hasCandles"
          :has-incense="hasIncense"
        />
      </section>

      <button
        type="button"
        class="panel-toggle"
        :class="{ open: drawerOpen }"
        @click="drawerOpen = !drawerOpen"
      >
        {{ drawerOpen ? '收起供养' : '礼佛供养' }}
      </button>

      <button
        v-if="drawerOpen"
        type="button"
        class="drawer-backdrop"
        aria-label="关闭说明"
        @click="drawerOpen = false"
      ></button>

      <section class="panel-section card" :class="{ open: drawerOpen }">
        <h1 class="namo-title">{{ buddha.namo }}</h1>

        <hr class="divider" />
        <RitualButtons @ritual="onRitual" />
        <hr class="divider" />
        <WishForm :default-wish="buddha.wish" @submit="onSubmit" />
        <hr class="divider" />

        <p class="buddha-desc">{{ buddha.desc }}</p>

        <div class="page-tags">
          <span>{{ buddha.subtitle }}</span>
          <span>在线礼佛</span>
          <span>祈愿回向</span>
        </div>

        <section class="meaning-section">
          <h2>礼佛说明</h2>
          <p>
            {{ buddha.name }}适合围绕{{ buddha.subtitle }}所代表的修行方向来发愿。
            你可以先完成供花、点灯、上香与礼拜，再填写祈愿内容，按顺序完成这一页的礼佛过程。
          </p>
        </section>

        <section class="faq-mini">
          <h2>常见问题</h2>
          <article>
            <h3>{{ buddha.name }}适合什么人礼敬？</h3>
            <p>凡希望以恭敬心修福、积德、回向众生的人，都可以来此礼敬 {{ buddha.name }} 并发愿修行。</p>
          </article>
          <article>
            <h3>在这个页面上怎么完成祈愿？</h3>
            <p>先完成供养动作，再填写姓名、年龄和愿望内容，最后提交回向即可。</p>
          </article>
        </section>

        <section class="related-links">
          <h2>相关礼佛页面</h2>
          <div class="related-list">
            <router-link v-for="item in relatedBuddhas" :key="item.slug" :to="`/buddha/${item.slug}`">
              {{ item.name }} · {{ item.subtitle }}
            </router-link>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>

<style scoped>
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

.page-link,
.crumb-sep,
.crumb-current {
  color: var(--text-muted);
  font-size: 0.86rem;
  text-decoration: none;
}

.prayer-layout {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.stage-section {
  width: 100%;
  height: 100%;
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

:deep(.stage) {
  width: min(100%, 1180px);
  max-width: 100%;
  max-height: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 0;
}

.panel-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 25;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 18px 10px;
  border: 1px solid rgba(212, 168, 67, 0.36);
  border-right: none;
  border-radius: 16px 0 0 16px;
  background: rgba(255, 248, 235, 0.96);
  color: var(--accent);
  font-size: 0.86rem;
  letter-spacing: 0.1em;
  box-shadow: 0 10px 26px rgba(38, 18, 6, 0.18);
  transition: right 0.28s ease, background 0.2s ease;
}

.panel-toggle.open {
  right: min(380px, 88vw);
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  z-index: 18;
  border: none;
  background: rgba(18, 6, 0, 0.28);
}

.panel-section {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  width: min(380px, 88vw);
  overflow-y: auto;
  padding: 20px 20px 32px;
  border-radius: 0;
  border-left: 1px solid rgba(212, 168, 67, 0.18);
  box-shadow: -10px 0 28px rgba(24, 9, 2, 0.22);
  transform: translateX(100%);
  transition: transform 0.28s ease;
}

.panel-section.open {
  transform: translateX(0);
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
.faq-mini,
.related-links {
  margin-top: 14px;
}

.meaning-section h2,
.faq-mini h2,
.faq-mini h3,
.related-links h2 {
  color: var(--accent);
}

.meaning-section h2,
.faq-mini h2,
.related-links h2 {
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

@media (max-width: 768px) {
  :deep(.stage) {
    width: 100%;
    height: 100%;
    max-width: none;
    aspect-ratio: auto;
  }

  .panel-section {
    width: min(420px, 100vw);
    padding: 14px 16px 18px;
  }

  .panel-toggle {
    top: auto;
    bottom: 18px;
    transform: none;
  }

  .panel-toggle.open {
    right: min(420px, 100vw);
  }

  .namo-title {
    font-size: 1.08rem;
    margin-bottom: 6px;
  }

  .buddha-desc {
    font-size: 0.82rem;
    line-height: 1.65;
  }
}
</style>
