<script setup>
// 每日财神方位 /caishen-fangwei/ 与 /caishen-fangwei/YYYY-MM-DD/。
// 不带日期时按访客手机上的日期显示「今天」；方位与求财页顶上那行用同一套算法（qiucai.js 的 caishenDirection）。
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ALMANAC_END, ALMANAC_START, DIRECTION_DEGREES, FANGWEI_ARTICLE, FANGWEI_FAQS, FANGWEI_PATH,
  CAI_RHYME, dateKey, dayLabel, getFangweiDay, inAlmanacRange, keyDays, shiftDateKey,
} from '../data/fangwei.js'
import { track } from '../utils/analytics.js'

const route = useRoute()
const router = useRouter()

// 预渲染时没有「今天」，挂载后再取访客本地日期，避免和预渲染的 HTML 对不上
const today = ref('')
onMounted(() => { today.value = dateKey() })

const paramDate = computed(() => String(route.params.date || ''))
const isTodayPage = computed(() => !paramDate.value)
const currentKey = computed(() => paramDate.value || today.value)
const day = computed(() => (currentKey.value ? getFangweiDay(currentKey.value) : null))
const outOfRange = computed(() => !!paramDate.value && !inAlmanacRange(paramDate.value))
const isToday = computed(() => !!today.value && currentKey.value === today.value)
const label = computed(() => (day.value ? dayLabel(day.value) : ''))

const heading = computed(() => {
  if (isTodayPage.value) return '今日财神方位'
  if (!day.value) return '财神方位'
  return `${day.value.solar}${label.value ? label.value : ''}财神方位`.replace('迎财神财神', '迎财神 · 财神')
})

const whenText = computed(() => {
  if (!day.value) return ''
  const prefix = isToday.value ? '今天' : day.value.solar
  const extra = label.value.replace(day.value.lunarShort, '')
  return `${prefix}（${isToday.value ? day.value.shortSolar + ' · ' : ''}${day.value.lunarShort}${extra ? ' · ' + extra : ''} · ${day.value.ganzhi}）`
})

const prevKey = computed(() => (day.value ? shiftDateKey(day.value.key, -1) : ''))
const nextKey = computed(() => (day.value ? shiftDateKey(day.value.key, 1) : ''))
const dayPath = (key) => `${FANGWEI_PATH}/${key}/`
const upcoming = computed(() => keyDays(today.value || ALMANAC_START, 8))
const nextTen = computed(() => {
  if (!day.value) return []
  return Array.from({ length: 10 }, (_, i) => getFangweiDay(shiftDateKey(day.value.key, i))).filter(Boolean)
})

const COMPASS = ['正北', '东北', '正东', '东南', '正南', '西南', '正西', '西北']
const pickDate = ref('')
watch(currentKey, (key) => { pickDate.value = key }, { immediate: true })
function jump() {
  if (inAlmanacRange(pickDate.value)) router.push(dayPath(pickDate.value))
}

function goWorship() {
  track('fangwei_to_qiucai', { date: day.value?.key || '', direction: day.value?.cai || '' })
}
</script>

<template>
  <main class="sub-shell fw">
    <nav class="sub-crumb">
      <router-link to="/">← 返回首页</router-link>
      <span> · </span>
      <router-link to="/qiucai/">求财祈福</router-link>
    </nav>

    <header class="sub-head">
      <p class="sub-kicker">黄历 · 每日财神方位</p>
      <h1>{{ heading }}</h1>
    </header>

    <section v-if="outOfRange" class="fw-card">
      <p class="fw-answer">这个日期暂时查不到。目前可以查 {{ ALMANAC_START }} 到 {{ ALMANAC_END }}。</p>
      <router-link class="fw-btn" :to="FANGWEI_PATH + '/'">看今天的财神方位 →</router-link>
    </section>

    <section v-else-if="day" class="fw-card">
      <div class="fw-main">
        <div>
          <p class="fw-when">{{ whenText }}</p>
          <p class="fw-answer">财神在 <strong>{{ day.cai }}</strong></p>
          <p class="fw-sub">喜神在 <strong>{{ day.xi }}</strong></p>
          <p v-if="day.marks.length" class="fw-marks">
            <span v-for="m in day.marks" :key="m">{{ m }}</span>
          </p>
          <p class="fw-lunar">{{ day.lunar }} · {{ day.week }}</p>
        </div>

        <svg class="fw-compass" viewBox="-110 -110 220 220" role="img" :aria-label="`罗盘：财神在${day.cai}，喜神在${day.xi}，上方为正北`">
          <circle r="100" class="fw-ring" />
          <circle r="72" class="fw-ring fw-ring--in" />
          <g v-for="d in COMPASS" :key="d" :transform="`rotate(${DIRECTION_DEGREES[d]})`">
            <line y1="-72" y2="-100" class="fw-tick" />
          </g>
          <text
            v-for="d in COMPASS"
            :key="'t' + d"
            :x="Math.sin(DIRECTION_DEGREES[d] * Math.PI / 180) * 86"
            :y="-Math.cos(DIRECTION_DEGREES[d] * Math.PI / 180) * 86 + 5"
            class="fw-dir"
            :class="{ 'fw-dir--cai': d === day.cai, 'fw-dir--xi': d === day.xi && d !== day.cai }"
            text-anchor="middle"
          >{{ d.length === 2 && d[0] === '正' ? d[1] : d }}</text>
          <g :transform="`rotate(${DIRECTION_DEGREES[day.cai]})`">
            <path d="M0,-66 L9,-8 L0,0 L-9,-8 Z" class="fw-needle" />
          </g>
          <g :transform="`rotate(${DIRECTION_DEGREES[day.xi]})`">
            <path d="M0,-50 L5,-6 L0,0 L-5,-6 Z" class="fw-needle fw-needle--xi" />
          </g>
          <circle r="7" class="fw-hub" />
        </svg>
      </div>

      <p class="fw-legend"><span class="fw-dot" /> 财神　<span class="fw-dot fw-dot--xi" /> 喜神　· 上方为正北，用手机指南针对一下方向</p>

      <router-link class="fw-btn" to="/qiucai/" @click="goWorship">朝{{ day.cai }}拜一拜财神 →</router-link>

      <div class="fw-nav">
        <router-link v-if="inAlmanacRange(prevKey)" :to="dayPath(prevKey)">← 前一天</router-link>
        <router-link v-if="!isTodayPage" :to="FANGWEI_PATH + '/'">今天</router-link>
        <router-link v-if="inAlmanacRange(nextKey)" :to="dayPath(nextKey)">后一天 →</router-link>
        <form class="fw-pick" @submit.prevent="jump">
          <input v-model="pickDate" type="date" :min="ALMANAC_START" :max="ALMANAC_END" aria-label="选择日期" />
          <button type="submit">查这一天</button>
        </form>
      </div>
    </section>

    <section v-else class="fw-card">
      <p class="fw-answer">正在按你手机上的日期计算……</p>
      <p class="fw-sub">{{ CAI_RHYME }}。</p>
    </section>

    <section v-if="nextTen.length" class="fw-block">
      <h2>接下来十天</h2>
      <ul class="fw-table">
        <li v-for="d in nextTen" :key="d.key">
          <router-link :to="dayPath(d.key)">
            <span>{{ d.shortSolar }} {{ d.week.replace('星期', '周') }}</span>
            <span class="fw-muted">{{ d.lunarShort }}</span>
            <span>财神 <strong>{{ d.cai }}</strong></span>
            <span class="fw-muted">喜神 {{ d.xi }}</span>
          </router-link>
        </li>
      </ul>
    </section>

    <section v-if="upcoming.length" class="fw-block">
      <h2>节日的财神方位</h2>
      <ul class="fw-table">
        <li v-for="d in upcoming" :key="d.key">
          <router-link :to="dayPath(d.key)">
            <span>{{ dayLabel(d) }}</span>
            <span class="fw-muted">{{ d.solar }}</span>
            <span>财神 <strong>{{ d.cai }}</strong></span>
            <span class="fw-muted">喜神 {{ d.xi }}</span>
          </router-link>
        </li>
      </ul>
    </section>

    <section v-for="block in FANGWEI_ARTICLE" :key="block.title" class="fw-block copy-section">
      <h2>{{ block.title }}</h2>
      <p v-for="p in block.paragraphs" :key="p">{{ p }}</p>
    </section>

    <section class="fw-block">
      <h2>常见问题</h2>
      <article v-for="f in FANGWEI_FAQS" :key="f.q" class="faq-item">
        <h3>{{ f.q }}</h3>
        <p>{{ f.a }}</p>
      </article>
    </section>

    <div class="sub-links">
      <router-link to="/topic/ying-caishen/">正月初五迎财神怎么做 →</router-link>
      <router-link to="/qiucai/">在线拜财神 →</router-link>
      <router-link to="/ruzhai-jiri/">入宅、搬家、开业吉日 →</router-link>
    </div>
  </main>
</template>

<style scoped>
.sub-shell {
  min-height: 100vh;
  padding: 16px max(20px, calc((100% - 860px) / 2)) 72px;
  background: #f7f0e6;
  color: #392b24;
}
.sub-crumb a { color: #756558; text-decoration: none; }
.sub-crumb span { color: #b8a898; }
.sub-head { margin: 18px 0 18px; }
.sub-kicker { margin: 0; color: #855408; letter-spacing: 0.2em; font-size: 0.82rem; }
.sub-head h1 { margin: 6px 0 0; font-size: clamp(1.6rem, 5vw, 2.3rem); color: #7a2a1c; }

.fw-card {
  padding: 22px clamp(16px, 4vw, 30px);
  border-radius: 18px;
  background: linear-gradient(180deg, #2a1c14, #1d140e);
  color: #fff1d8;
  border: 1px solid rgba(242, 200, 121, 0.3);
}
.fw-main { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; }
.fw-when { margin: 0 0 6px; color: rgba(244, 230, 204, 0.75); }
.fw-answer { margin: 0; font-size: clamp(1.5rem, 6vw, 2.2rem); letter-spacing: 0.04em; }
.fw-answer strong { color: #f2c879; font-size: 1.25em; }
.fw-sub { margin: 6px 0 0; font-size: 1.15rem; }
.fw-sub strong { color: #f0a27a; }
.fw-marks { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; }
.fw-marks span { padding: 2px 10px; border-radius: 999px; background: #a33a22; color: #fff1d8; font-size: 0.85rem; }
.fw-lunar { margin: 10px 0 0; color: rgba(244, 230, 204, 0.65); font-size: 0.9rem; }
.fw-compass { width: clamp(150px, 34vw, 210px); height: auto; }
.fw-ring { fill: none; stroke: rgba(242, 200, 121, 0.45); stroke-width: 2; }
.fw-ring--in { stroke-dasharray: 3 4; }
.fw-tick { stroke: rgba(242, 200, 121, 0.45); stroke-width: 2; }
.fw-dir { fill: rgba(244, 230, 204, 0.7); font-size: 14px; }
.fw-dir--cai { fill: #f2c879; font-weight: 700; font-size: 16px; }
.fw-dir--xi { fill: #f0a27a; font-weight: 700; }
.fw-needle { fill: #f2c879; }
.fw-needle--xi { fill: #f0a27a; opacity: 0.85; }
.fw-hub { fill: #7a2a1c; stroke: #f2c879; stroke-width: 2; }
.fw-legend { margin: 10px 0 16px; font-size: 0.85rem; color: rgba(244, 230, 204, 0.7); }
.fw-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #f2c879; vertical-align: -1px; }
.fw-dot--xi { background: #f0a27a; }
.fw-btn {
  display: inline-block;
  padding: 12px 22px;
  border-radius: 999px;
  background: linear-gradient(180deg, #f6d48d, #d9a441);
  color: #3b2410;
  font-weight: 700;
  text-decoration: none;
}
.fw-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; margin-top: 18px; }
.fw-nav a { color: #f2c879; }
.fw-pick { display: flex; gap: 6px; margin-left: auto; }
.fw-pick input { padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(242, 200, 121, 0.4); background: #fff8ec; color: #392b24; }
.fw-pick button { padding: 6px 12px; border-radius: 8px; border: 0; background: #7a2a1c; color: #fff1d8; cursor: pointer; }

.fw-block { margin-top: 26px; }
.fw-block h2 { margin: 0 0 10px; font-size: 1.2rem; color: #7a2a1c; }
.fw-block h3 { margin: 14px 0 4px; font-size: 1rem; }
.fw-block p { margin: 0 0 8px; line-height: 1.85; color: #4d3d33; }
.fw-table { list-style: none; margin: 0; padding: 0; border-radius: 14px; overflow: hidden; border: 1px solid #e6d6c0; background: #fffaf2; }
.fw-table li + li { border-top: 1px solid #efe2cf; }
.fw-table a { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 8px; padding: 10px 14px; color: #392b24; text-decoration: none; }
.fw-table a:hover { background: #f8eedf; }
.fw-table strong { color: #a33a22; }
.fw-muted { color: #8a7a6c; }
.sub-links { display: flex; flex-wrap: wrap; gap: 10px 20px; margin-top: 26px; }
.sub-links a { color: #8a4a1c; }

@media (max-width: 560px) {
  .fw-main { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .fw-marks { justify-content: center; }
  .fw-pick { margin-left: 0; }
  .fw-table a { grid-template-columns: 1fr 1fr; }
}
</style>
