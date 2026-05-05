<script setup>
import { computed, ref, onMounted } from 'vue'
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
if (!ancestor.value) router.replace('/')

const customPhoto = ref(getPhoto(route.params.slug))
const customName  = ref(getName(route.params.slug))

onMounted(() => {
  if (!ancestor.value) return
  const a = ancestor.value
  document.title = `${a.name} 拜祭 | 在线祭拜先人 - baifo.rentalinca.com`
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content', `虔诚祭拜${a.name}，${a.subtitle}。${a.desc} 在线发愿，功德回向先人。`
  )
})

const offeringItems = ref([])
const figureItems   = ref([])
const hasCandles    = ref(false)
const hasIncense    = ref(false)
const hasWine       = ref(false)
const hasPaper      = ref(false)

function onRitual({ images, isFigure, isCandle, isIncense, isWine, isPaper }) {
  if (isCandle)  { hasCandles.value = true; return }
  if (isIncense) { hasIncense.value = true; return }
  if (isWine)    { hasWine.value = true;   return }
  if (isPaper)   { hasPaper.value = true;  return }
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
    body: JSON.stringify({ ...payload, ancestor: ancestor.value?.slug })
  })
  const data = await res.json()
  if (!res.ok || data.status !== 'success') throw new Error(data.message || '提交失败')
  router.push('/')
}
</script>

<template>
  <div v-if="ancestor" class="prayer-shell">
    <nav class="prayer-nav">
      <router-link to="/" class="page-link">← 返回首页</router-link>
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
        <hr class="divider" />
        <AncestorRituals @ritual="onRitual" />
        <hr class="divider" />
        <AncestorWishForm
          :slug="ancestor.slug"
          :default-wish="ancestor.wish"
          :default-ancestor-name="ancestor.title"
          :default-relationship="ancestor.slug === 'father' ? '父亲' : ancestor.slug === 'mother' ? '母亲' : ancestor.slug === 'grandfather' ? '祖父' : ancestor.slug === 'grandmother' ? '祖母' : ''"
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

.prayer-layout {
  flex: 1;
  min-height: 0;
  display: flex;
}

@media (orientation: landscape) {
  .prayer-layout { flex-direction: row; }

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
  .prayer-layout { flex-direction: column; }

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

  .namo-title { font-size: 1rem; margin-bottom: 4px; }
  .ancestor-desc { font-size: 0.82rem; line-height: 1.6; margin-bottom: 0; }
  .divider { margin: 8px 0; }
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

.divider {
  border: none;
  border-top: 1px solid rgba(120, 100, 80, 0.2);
  margin: 16px 0;
}
</style>
