<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ANCESTORS } from '../data/ancestors.js'
import AncestorStage from '../components/AncestorStage.vue'
import AncestorRituals from '../components/AncestorRituals.vue'
import AncestorWishForm from '../components/AncestorWishForm.vue'
import { apiFetch } from '../api.js'
import { getPhoto, getName } from '../utils/localPhoto.js'

const route = useRoute()
const router = useRouter()

const ancestor = computed(() => ANCESTORS.find(a => a.slug === route.params.slug))
const relatedAncestors = computed(() => ANCESTORS.filter(a => a.slug !== route.params.slug).slice(0, 4))

const customPhoto = ref(null)
const customName = ref(null)
const offeringItems = ref([])
const figureItems = ref([])
const hasCandles = ref(false)
const hasIncense = ref(false)
const hasWine = ref(false)
const hasPaper = ref(false)

const displayAncestorName = computed(() => customName.value || ancestor.value?.title || '')
const defaultRelationship = computed(() => {
  const map = {
    father: '父亲',
    mother: '母亲',
    grandfather: '祖父',
    grandmother: '祖母',
    spouse: '配偶',
    child: '子女',
    ancestors: '先祖',
    general: '其他',
  }
  return map[ancestor.value?.slug] || '其他'
})

function syncAncestorState() {
  if (!ancestor.value) {
    router.replace('/')
    return
  }
  customPhoto.value = getPhoto(route.params.slug)
  customName.value = getName(route.params.slug)
}

function resetStageState() {
  offeringItems.value = []
  figureItems.value = []
  hasCandles.value = false
  hasIncense.value = false
  hasWine.value = false
  hasPaper.value = false
}

function applyPageMeta() {
  if (!ancestor.value) return
  const a = ancestor.value
  document.title = `${a.name} 拜祭 | 在线祭拜先人 - www.fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    `虔诚祭拜${a.name}，${a.subtitle}。${a.desc} 在线发愿，功德回向先人。`
  )

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${a.name}页面适合什么祭拜主题？`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${a.desc} 适合用于追思、祭祖、超荐与回向。`,
        },
      },
      {
        '@type': 'Question',
        name: '个性化照片会上传到服务器吗？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '不会。照片和姓名设置仅保存在本地设备，用于当前设备显示。',
        },
      },
    ],
  }

  let el = document.getElementById('ld-ancestor-qa')
  if (!el) {
    el = document.createElement('script')
    el.id = 'ld-ancestor-qa'
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(ld)
}

watch(
  () => route.params.slug,
  () => {
    syncAncestorState()
    resetStageState()
    applyPageMeta()
  },
  { immediate: true }
)

function onRitual({ images, isFigure, isCandle, isIncense, isWine, isPaper }) {
  if (isCandle) {
    hasCandles.value = true
    return
  }
  if (isIncense) {
    hasIncense.value = true
    return
  }
  if (isWine) {
    hasWine.value = true
    return
  }
  if (isPaper) {
    hasPaper.value = true
    return
  }

  const items = images.map(src => ({ src, id: Date.now() + Math.random() }))
  if (isFigure) {
    figureItems.value = items
  } else {
    offeringItems.value.push(...items)
  }
}

async function onSubmit(payload) {
  const res = await apiFetch('/ancestor-wishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, ancestor: ancestor.value?.slug }),
  })
  const data = await res.json()
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || '提交失败')
  }
  router.push('/')
}
</script>

<template>
  <div v-if="ancestor" class="prayer-shell">
    <nav class="prayer-nav">
      <div class="breadcrumb-row">
        <router-link to="/" class="page-link">← 返回首页</router-link>
        <span class="crumb-sep">/</span>
        <router-link to="/ancestors" class="page-link small-link">拜祭先人</router-link>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">{{ ancestor.name }}</span>
      </div>
    </nav>

    <div class="prayer-layout">
      <section class="stage-section card">
        <AncestorStage
          :ancestor="ancestor"
          :custom-photo="customPhoto"
          :custom-name="customName"
          :offering-items="offeringItems"
          :figure-items="figureItems"
          :has-candles="hasCandles"
          :has-incense="hasIncense"
          :has-wine="hasWine"
          :has-paper="hasPaper"
        />
      </section>

      <section class="panel-section card">
        <h1 class="namo-title">{{ ancestor.namo }}</h1>
        <p class="ancestor-desc">{{ ancestor.desc }}</p>
        <div class="page-tags">
          <span>{{ ancestor.subtitle }}</span>
          <span>祭祖追思</span>
          <span>功德回向</span>
        </div>
        <section class="meaning-section">
          <h2>页面说明</h2>
          <p>{{ ancestor.name }}页面适合围绕追思先人、超荐亡灵与家族祈愿进行祭拜。你可以先完成供奉动作，再填写祈愿内容，以此表达纪念与回向之意。</p>
        </section>
        <section class="entry-summary">
          <h2>本次祭拜对象</h2>
          <div class="summary-chips">
            <span>{{ displayAncestorName }}</span>
            <span>{{ defaultRelationship }}</span>
          </div>
          <p>如果要换牌位或重新选择对象，可以返回上一页重新选择；当前页面会自动带入你刚才选择的牌位信息。</p>
          <router-link to="/ancestors" class="reselect-link">重新选择牌位</router-link>
        </section>
        <section class="faq-mini">
          <h2>常见问题</h2>
          <article>
            <h3>这个页面会公开个人照片吗？</h3>
            <p>不会。个性化牌位照片和姓名设置只保存在当前设备中，不会进入服务器。</p>
          </article>
          <article>
            <h3>适合哪些追思场景？</h3>
            <p>适合祭祖、追思长辈、超荐亡灵，以及围绕家族平安和后代庇荫进行回向。</p>
          </article>
        </section>
        <section class="related-links">
          <h2>相关祭拜页面</h2>
          <div class="related-list">
            <router-link v-for="item in relatedAncestors" :key="item.slug" :to="'/ancestor/' + item.slug">
              {{ item.name }} · {{ item.subtitle }}
            </router-link>
          </div>
        </section>
        <hr class="divider" />
        <AncestorRituals @ritual="onRitual" />
        <hr class="divider" />
        <AncestorWishForm
          :slug="ancestor.slug"
          :default-wish="ancestor.wish"
          :default-ancestor-name="displayAncestorName"
          :default-relationship="defaultRelationship"
          @submit="onSubmit"
        />
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
  border-bottom: 1px solid rgba(120, 100, 80, 0.15);
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

.small-link {
  font-size: 0.86rem;
}

.prayer-layout {
  flex: 1;
  min-height: 0;
  display: flex;
}

@media (orientation: landscape) {
  .prayer-layout {
    flex-direction: row;
  }

  .stage-section {
    flex: 2;
    padding: 0;
    border-radius: 0;
    border: none;
    box-shadow: none;
    overflow: hidden;
    background: #0a0805;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .panel-section {
    flex: 1;
    overflow-y: auto;
    padding: 20px 20px 32px;
    border-radius: 0;
    border-left: 1px solid rgba(120, 100, 80, 0.18);
    box-shadow: none;
  }
}

@media (orientation: portrait) {
  .prayer-layout {
    flex-direction: column;
  }

  .stage-section {
    flex: 4;
    min-height: 0;
    padding: 0;
    border-radius: 0;
    border: none;
    box-shadow: none;
    overflow: hidden;
    background: #0a0805;
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
    border-top: 1px solid rgba(120, 100, 80, 0.2);
    box-shadow: none;
  }

  .namo-title {
    font-size: 1rem;
    margin-bottom: 4px;
  }

  .ancestor-desc {
    font-size: 0.82rem;
    line-height: 1.6;
    margin-bottom: 0;
  }

  .divider {
    margin: 8px 0;
  }
}

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
  text-shadow: 0 1px 8px rgba(60, 40, 20, 0.2);
}

.ancestor-desc {
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
  background: rgba(120, 100, 80, 0.12);
  color: #8a7a6a;
  font-size: 0.78rem;
}

.meaning-section,
.faq-mini,
.entry-summary {
  margin-top: 14px;
}

.meaning-section h2,
.entry-summary h2,
.faq-mini h2,
.faq-mini h3 {
  color: #8a7a6a;
}

.meaning-section h2,
.entry-summary h2,
.faq-mini h2 {
  font-size: 1rem;
  margin-bottom: 8px;
}

.meaning-section p,
.entry-summary p,
.faq-mini p {
  color: var(--text-muted);
  line-height: 1.75;
  font-size: 0.88rem;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.summary-chips span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(120, 100, 80, 0.12);
  color: #8a7a6a;
  font-size: 0.8rem;
}

.reselect-link {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(120, 100, 80, 0.18);
  background: rgba(255, 252, 245, 0.78);
  color: #7a6a5a;
  font-size: 0.84rem;
  text-decoration: none;
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
  color: #8a7a6a;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-list a {
  color: #8a7a6a;
  text-decoration: none;
  font-size: 0.88rem;
}

.divider {
  border: none;
  border-top: 1px solid rgba(120, 100, 80, 0.2);
  margin: 16px 0;
}
</style>
