<script setup>
// 首页节日祝福卡片：节日前后按访客本地日期出现，平时不渲染。
// 预览其他日期：在网址后加 ?festival-date=2026-09-25
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { findActiveFestival, localYmd } from '../data/festivals.js'

const router = useRouter()
const today = ref('')

onMounted(() => {
  const preview = new URLSearchParams(window.location.search).get('festival-date')
  today.value = /^\d{4}-\d{2}-\d{2}$/.test(preview || '') ? preview : localYmd()
})

const festival = computed(() => (today.value ? findActiveFestival(today.value) : null))
const isToday = computed(() => festival.value && festival.value.date === today.value)

function go(target) {
  const resolved = router.resolve(target)
  if (resolved.path === router.currentRoute.value.path && resolved.hash) {
    document.querySelector(resolved.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  router.push(target)
}
</script>

<template>
  <aside
    v-if="festival"
    class="festival-card"
    :class="[`festival-card--${festival.anim}`, `festival-card--${festival.tone}`, { 'festival-card--image': festival.image }]"
    :aria-label="`${festival.name}祝福`"
  >
    <template v-if="festival.image">
      <img
        class="festival-bg"
        :src="festival.image.large"
        :srcset="`${festival.image.small} 720w, ${festival.image.large} 1200w`"
        sizes="(max-width: 700px) 100vw, 640px"
        alt=""
        decoding="async"
      />
      <div class="festival-shade" aria-hidden="true"></div>
    </template>
    <div v-else class="festival-art" aria-hidden="true">
      <svg v-if="festival.anim === 'moon'" viewBox="0 0 96 96" class="moon-svg">
        <defs>
          <radialGradient id="fg-moon" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stop-color="#fff7dc" />
            <stop offset="70%" stop-color="#f6d98f" />
            <stop offset="100%" stop-color="#e7b85c" />
          </radialGradient>
          <radialGradient id="fg-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(255,228,160,.55)" />
            <stop offset="100%" stop-color="rgba(255,228,160,0)" />
          </radialGradient>
        </defs>
        <g class="moon-rise">
          <circle cx="48" cy="44" r="40" fill="url(#fg-halo)" class="moon-halo" />
          <circle cx="48" cy="44" r="22" fill="url(#fg-moon)" />
          <circle cx="41" cy="38" r="3.2" fill="rgba(214,168,82,.35)" />
          <circle cx="55" cy="50" r="4.2" fill="rgba(214,168,82,.28)" />
          <circle cx="52" cy="35" r="2" fill="rgba(214,168,82,.3)" />
        </g>
        <path class="cloud cloud-a" d="M6 70 q8-8 16-2 q6-7 14 0 q6 1 6 6 H6 z" fill="rgba(255,255,255,.18)" />
        <path class="cloud cloud-b" d="M54 78 q7-6 14-1 q5-6 12 0 q5 1 5 5 H54 z" fill="rgba(255,255,255,.14)" />
      </svg>
    </div>

    <div class="festival-copy">
      <p class="festival-kicker">{{ isToday ? `今日${festival.name}` : `${festival.name}将至` }}</p>
      <h2 class="festival-title">{{ festival.title }}</h2>
      <p v-for="line in festival.lines" :key="line" class="festival-line">{{ line }}</p>
      <a
        v-if="festival.cta"
        :href="router.resolve(festival.cta.to).href"
        class="festival-cta"
        @click.prevent="go(festival.cta.to)"
      >
        {{ festival.cta.label }} →
      </a>
    </div>
  </aside>
</template>

<style scoped>
.festival-card {
  position: relative;
  align-self: stretch;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  border-radius: 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 30%, rgba(255, 220, 150, 0.16), transparent 40%),
    linear-gradient(135deg, #1d1a3a 0%, #2b2350 55%, #3a2a4f 100%);
  border: 1px solid rgba(242, 200, 121, 0.35);
  box-shadow: 0 14px 30px rgba(29, 20, 50, 0.28);
  color: #f6e7c4;
  animation: festival-in 0.8s ease both;
}

.festival-art {
  width: 88px;
  height: 88px;
}

.moon-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.moon-rise {
  animation: moon-rise 2.4s cubic-bezier(0.22, 0.8, 0.3, 1) both;
}

.moon-halo {
  transform-origin: 48px 44px;
  animation: halo 4s ease-in-out 2.4s infinite;
}

.cloud-a {
  animation: drift 9s ease-in-out infinite alternate;
}

.cloud-b {
  animation: drift 11s ease-in-out infinite alternate-reverse;
}

.festival-copy {
  min-width: 0;
}

.festival-kicker {
  margin: 0 0 2px;
  color: #e9c77e;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
}

.festival-title {
  margin: 0 0 6px;
  color: #fff3d6;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.festival-line {
  margin: 0;
  color: rgba(246, 231, 196, 0.88);
  font-size: 0.92rem;
  line-height: 1.7;
}

.festival-cta {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  margin-top: 10px;
  padding: 6px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  color: #2a1c0c;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
}

.festival-cta:focus-visible {
  outline: 3px solid rgba(242, 200, 121, 0.7);
  outline-offset: 3px;
}

/* 有背景图时：图铺满卡片，月亮在左，文字在右侧深色区域 */
.festival-card--image {
  display: block;
  min-height: 210px;
  padding: 24px 24px 24px 44%;
  background: #1b1a3d;
}

.festival-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 20% 22%;
  animation: bg-drift 24s ease-in-out infinite alternate;
}

.festival-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(20, 18, 52, 0) 28%, rgba(20, 18, 52, 0.55) 46%, rgba(20, 18, 52, 0.82) 100%);
}

.festival-card--image .festival-copy {
  position: relative;
  z-index: 1;
  animation: festival-in 1s ease 0.3s both;
}

@keyframes bg-drift {
  from { transform: scale(1.02) translateX(0); }
  to { transform: scale(1.1) translateX(-2%); }
}

@keyframes festival-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

@keyframes moon-rise {
  from { transform: translateY(34px); opacity: 0; }
  to { transform: none; opacity: 1; }
}

@keyframes halo {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.12); opacity: 1; }
}

@keyframes drift {
  from { transform: translateX(-4px); }
  to { transform: translateX(6px); }
}

@media (max-width: 700px) {
  .festival-card {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 12px;
    padding: 14px;
  }

  .festival-art {
    width: 64px;
    height: 64px;
  }

  .festival-title {
    font-size: 1.05rem;
  }

  .festival-line {
    font-size: 0.86rem;
  }

  .festival-card--image {
    padding: 150px 16px 18px;
  }

  .festival-bg {
    object-position: 15% 20%;
  }

  .festival-shade {
    background: linear-gradient(180deg, rgba(20, 18, 52, 0) 30%, rgba(20, 18, 52, 0.7) 52%, rgba(20, 18, 52, 0.9) 100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .festival-card,
  .moon-rise,
  .moon-halo,
  .cloud-a,
  .cloud-b,
  .festival-bg,
  .festival-card--image .festival-copy {
    animation: none;
  }
}
</style>
