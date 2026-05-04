<script setup>
import { computed, ref } from 'vue'
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
      <router-link to="/" class="page-link">← 返回首页</router-link>
    </nav>

    <div class="prayer-layout">
      <section class="stage-section card">
        <PrayerStage :buddha="buddha" :offering-items="offeringItems" :figure-items="figureItems" :has-candles="hasCandles" :has-incense="hasIncense" />
      </section>

      <section class="panel-section card">
        <div class="namo-title">{{ buddha.namo }}</div>
        <p class="buddha-desc">{{ buddha.desc }}</p>
        <hr class="divider" />
        <RitualButtons @ritual="onRitual" />
        <hr class="divider" />
        <WishForm :default-wish="buddha.wish" @submit="onSubmit" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.prayer-shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 20px 60px;
  animation: fadeIn 0.5s ease;
}

.prayer-nav { margin-bottom: 20px; }

.prayer-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.namo-title {
  font-size: 1.6rem;
  color: var(--accent);
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: 12px;
  text-shadow: 0 1px 8px rgba(127, 90, 54, 0.2);
}

.buddha-desc {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.8;
  text-align: justify;
}

.divider {
  border: none;
  border-top: 1px solid rgba(212, 168, 67, 0.2);
  margin: 20px 0;
}

/* ── 竖屏：上下布局 ── */
@media (orientation: portrait) {
  .prayer-shell { padding: 12px 12px 48px; }
  .prayer-layout { grid-template-columns: 1fr; gap: 16px; }
  .stage-section { padding: 0; }
  .panel-section { padding: 20px 16px; }
  .namo-title { font-size: 1.3rem; }
  .prayer-nav { margin-bottom: 12px; }
}

/* ── 横屏：左右布局（默认即是，明确写出以防覆盖）── */
@media (orientation: landscape) {
  .prayer-layout { grid-template-columns: 1fr 1fr; }
}
</style>
