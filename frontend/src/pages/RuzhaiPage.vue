<script setup>
// 入宅吉日 /ruzhai-jiri/ 与 /ruzhai-jiri/YYYY-MM/。
// 网址加 ?card=1 是给 David 交屋时打印的「入宅礼卡」：当月吉日 + 入伙步骤 + Zillow 评价二维码。这个入口不在站内公开链接。
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  RUZHAI_FAQS, RUZHAI_KINDS, RUZHAI_PATH, RUZHAI_STEPS,
  currentMonthKey, isMonthKey, monthDays, monthKeys, monthLabel, monthSummary,
} from '../data/ruzhai.js'
import { track } from '../utils/analytics.js'

const ZILLOW_REVIEW_URL = 'https://www.zillow.com/profile/wuxishanecnc'

const route = useRoute()
const thisMonth = ref('')
onMounted(() => { thisMonth.value = currentMonthKey(new Date()) })

const paramMonth = computed(() => String(route.params.month || ''))
const month = computed(() => paramMonth.value || thisMonth.value)
const valid = computed(() => !!month.value && isMonthKey(month.value))
const months = monthKeys()
const monthIndex = computed(() => months.indexOf(month.value))
const prevMonth = computed(() => months[monthIndex.value - 1] || '')
const nextMonth = computed(() => months[monthIndex.value + 1] || '')
const monthPath = (key) => `${RUZHAI_PATH}/${key}/`
// 前后月份的链接在手机上要短：同一年只写「11月」
const shortMonth = (key) => (key.slice(0, 4) === month.value.slice(0, 4) ? `${Number(key.slice(5))}月` : monthLabel(key))

const kind = ref('R')
const kindLabel = computed(() => RUZHAI_KINDS.find((item) => item.code === kind.value)?.label || '')
const days = computed(() => (valid.value ? monthDays(month.value, kind.value) : []))
const summary = computed(() => (valid.value ? monthSummary(month.value) : null))
watch(kind, (value) => track('ruzhai_filter', { kind: value }))

// 打印礼卡
const isCard = computed(() => route.query.card === '1')
const qrCanvas = ref(null)
watch([isCard, qrCanvas], async ([card, canvas]) => {
  if (!card || !canvas) return
  await nextTick()
  const { toCanvas } = await import('qrcode')
  toCanvas(canvas, ZILLOW_REVIEW_URL, { width: 132, margin: 1, color: { dark: '#3b2410', light: '#fffaf2' } })
}, { immediate: true })
const cardDays = computed(() => (valid.value ? monthDays(month.value, 'R') : []))
function printCard() { window.print() }
</script>

<template>
  <!-- 打印用入宅礼卡 -->
  <main v-if="isCard" class="rz-card-page">
    <div class="rz-card-tools no-print">
      <span>入宅礼卡 · 用浏览器打印（建议 A5 或信纸横放），换月份改网址里的年月。</span>
      <button type="button" @click="printCard">打印</button>
    </div>
    <article class="rz-card">
      <header>
        <p class="rz-card-kicker">恭贺乔迁之喜</p>
        <h1>{{ valid ? monthLabel(month) : '' }}入宅吉日</h1>
      </header>
      <ul class="rz-card-days">
        <li v-for="d in cardDays" :key="d.key">
          <strong>{{ d.solar }}</strong> {{ d.week.replace('星期', '周') }} · {{ d.lunar }} · 冲{{ d.chong }}
        </li>
      </ul>
      <ol class="rz-card-steps">
        <li v-for="s in RUZHAI_STEPS.slice(1, 4)" :key="s.title"><strong>{{ s.title }}</strong>　{{ s.text }}</li>
      </ol>
      <footer>
        <div>
          <p>祝新居平安、阖家兴旺。</p>
          <p class="rz-card-sign">David Dai · DRE# 02202763 · NMLS# 2454756</p>
          <p class="rz-card-small">Universal Elite Realty 环球地产 · DRE# 02121645<br />NDF Lending（新梦想）· NMLS# 1952245</p>
          <p class="rz-card-small">更多吉日：fopusha.com/ruzhai-jiri</p>
        </div>
        <figure>
          <canvas ref="qrCanvas" width="132" height="132" />
          <figcaption>如果这次买房顺利，<br />扫码在 Zillow 写一句评价</figcaption>
        </figure>
      </footer>
    </article>
  </main>

  <main v-else class="sub-shell rz">
    <nav class="sub-crumb"><router-link to="/">← 返回首页</router-link></nav>
    <header class="sub-head">
      <p class="sub-kicker">黄历 · 新居入伙</p>
      <h1>{{ paramMonth && valid ? monthLabel(month) + '入宅吉日' : '入宅吉日' }}</h1>
      <p class="rz-lead">新房入宅、搬家、开业挑日子：按黄历列出每个月宜入宅、宜搬家、宜开业的日子，标出星期几和当天冲的生肖。</p>
    </header>

    <section v-if="paramMonth && !valid" class="rz-panel">
      <p>这个月份暂时查不到。目前可以查 {{ months[0] }} 到 {{ months.at(-1) }}。</p>
      <router-link :to="RUZHAI_PATH + '/'">看本月 →</router-link>
    </section>

    <section v-else-if="valid" class="rz-panel">
      <div class="rz-month">
        <router-link v-if="prevMonth" :to="monthPath(prevMonth)">← {{ shortMonth(prevMonth) }}</router-link>
        <strong>{{ monthLabel(month) }}</strong>
        <router-link v-if="nextMonth" :to="monthPath(nextMonth)">{{ shortMonth(nextMonth) }} →</router-link>
      </div>
      <p v-if="summary" class="rz-summary">
        本月宜入宅 <b>{{ summary.ruzhai }}</b> 天 · 宜搬家 <b>{{ summary.banjia }}</b> 天 · 宜开业 <b>{{ summary.kaiye }}</b> 天
      </p>
      <div class="rz-tabs" role="tablist" aria-label="按事项筛选">
        <button
          v-for="k in RUZHAI_KINDS"
          :key="k.code"
          type="button"
          role="tab"
          :aria-selected="kind === k.code"
          :class="{ active: kind === k.code }"
          @click="kind = k.code"
        >宜{{ k.label }}</button>
      </div>
      <p class="rz-note">{{ RUZHAI_KINDS.find((k) => k.code === kind)?.note }}</p>
      <ul v-if="days.length" class="rz-list">
        <li v-for="d in days" :key="d.key" :class="{ weekend: d.weekend }">
          <span class="rz-date">{{ d.solar }}<small>{{ d.week }}</small></span>
          <span class="rz-lunar">{{ d.lunar }}<small v-if="d.marks.length"> · {{ d.marks.join('、') }}</small></span>
          <span class="rz-good">宜{{ d.good.join('、') }}</span>
          <span class="rz-chong">冲{{ d.chong }}</span>
        </li>
      </ul>
      <p v-else class="rz-note">本月没有宜{{ kindLabel }}的日子，可以看看前后一个月。</p>
      <p class="rz-note">周末的日子用金色标出。「冲某」指当天冲这个生肖，家里有人属它的，习惯上会换一天。</p>
    </section>

    <section class="rz-block copy-section">
      <h2>在美国新居入伙怎么做</h2>
      <ol class="rz-steps">
        <li v-for="s in RUZHAI_STEPS" :key="s.title">
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <section class="rz-block">
      <h2>常见问题</h2>
      <article v-for="f in RUZHAI_FAQS" :key="f.q" class="faq-item">
        <h3>{{ f.q }}</h3>
        <p>{{ f.a }}</p>
      </article>
    </section>

    <section class="rz-block rz-cross">
      <h2>正在南加州买房、搬家？</h2>
      <p>本站作者 David Dai 在尔湾做房贷和房产经纪。买房前想算能贷多少，可以看 <a href="https://www.loaninca.com/?utm_source=fopusha&amp;utm_medium=referral&amp;utm_campaign=ruzhai" target="_blank" rel="noopener">LoanInCA</a>；房子要出租，可以看 <a href="https://rentalinca.com/?utm_source=fopusha&amp;utm_medium=referral&amp;utm_campaign=ruzhai" target="_blank" rel="noopener">RentalInCA</a>。</p>
    </section>

    <div class="sub-links">
      <router-link to="/caishen-fangwei/">今日财神方位 →</router-link>
      <router-link to="/qiucai/">在线拜财神 →</router-link>
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
.sub-head { margin: 18px 0 18px; }
.sub-kicker { margin: 0; color: #b5832f; letter-spacing: 0.2em; font-size: 0.82rem; }
.sub-head h1 { margin: 6px 0 10px; font-size: clamp(1.6rem, 5vw, 2.3rem); color: #7a2a1c; }
.rz-lead { margin: 0; color: #756558; line-height: 1.8; max-width: 40em; }

.rz-panel { padding: 18px clamp(14px, 4vw, 26px); border-radius: 18px; background: #fffaf2; border: 1px solid #e6d6c0; }
.rz-month { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.rz-month a { color: #8a4a1c; white-space: nowrap; }
.rz-month strong { white-space: nowrap; }
.rz-month strong { font-size: 1.25rem; color: #7a2a1c; }
.rz-summary { margin: 10px 0 12px; color: #5a4a3e; }
.rz-summary b { color: #a33a22; }
.rz-tabs { display: flex; gap: 8px; }
.rz-tabs button { padding: 7px 16px; border-radius: 999px; border: 1px solid #d8c3a3; background: #fff; color: #5a4a3e; cursor: pointer; font-size: 0.95rem; }
.rz-tabs button.active { background: #7a2a1c; color: #fff1d8; border-color: #7a2a1c; }
.rz-note { margin: 8px 0; font-size: 0.85rem; color: #8a7a6c; }
.rz-list { list-style: none; margin: 10px 0; padding: 0; }
.rz-list li { display: grid; grid-template-columns: 1.2fr 1.5fr 1.3fr auto; gap: 8px; align-items: center; padding: 10px 6px; border-bottom: 1px solid #efe2cf; }
.rz-list li.weekend { background: linear-gradient(90deg, rgba(242, 200, 121, 0.25), transparent); }
.rz-date { font-weight: 700; color: #392b24; }
.rz-date small, .rz-lunar small { display: block; font-weight: 400; color: #8a7a6c; font-size: 0.8rem; }
.rz-lunar { color: #5a4a3e; }
.rz-good { color: #a33a22; font-size: 0.92rem; }
.rz-chong { color: #8a7a6c; font-size: 0.9rem; }

.rz-block { margin-top: 26px; }
.rz-block h2 { margin: 0 0 10px; font-size: 1.2rem; color: #7a2a1c; }
.rz-block h3 { margin: 12px 0 4px; font-size: 1rem; }
.rz-block p { margin: 0 0 8px; line-height: 1.85; color: #4d3d33; }
.rz-steps { margin: 0; padding-left: 1.3em; }
.rz-cross a { color: #8a4a1c; }
.sub-links { display: flex; flex-wrap: wrap; gap: 10px 20px; margin-top: 26px; }
.sub-links a { color: #8a4a1c; }

@media (max-width: 560px) {
  .rz-list li { grid-template-columns: 1fr 1fr; }
}

/* 打印礼卡 */
.rz-card-page { min-height: 100vh; padding: 20px; background: #efe6d8; }
.rz-card-tools { display: flex; justify-content: space-between; align-items: center; gap: 12px; max-width: 720px; margin: 0 auto 14px; color: #5a4a3e; font-size: 0.9rem; }
.rz-card-tools button { padding: 8px 18px; border-radius: 8px; border: 0; background: #7a2a1c; color: #fff1d8; cursor: pointer; }
.rz-card { max-width: 720px; margin: 0 auto; padding: 32px 38px; background: #fffaf2; border: 2px solid #b5832f; outline: 6px double rgba(181, 131, 47, 0.35); outline-offset: -14px; color: #392b24; }
.rz-card header { text-align: center; }
.rz-card-kicker { margin: 0; color: #a33a22; letter-spacing: 0.4em; }
.rz-card h1 { margin: 6px 0 16px; color: #7a2a1c; font-size: 1.8rem; }
.rz-card-days { columns: 2; margin: 0 0 16px; padding-left: 1.2em; line-height: 1.9; }
.rz-card-steps { margin: 0 0 16px; padding-left: 1.2em; line-height: 1.7; font-size: 0.92rem; }
.rz-card footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; border-top: 1px solid #e6d6c0; padding-top: 14px; }
.rz-card footer p { margin: 0 0 4px; }
.rz-card-sign { color: #7a2a1c; font-weight: 700; }
.rz-card-small { font-size: 0.8rem; color: #8a7a6c; }
.rz-card figure { margin: 0; text-align: center; font-size: 0.75rem; color: #5a4a3e; }
@media print {
  .no-print { display: none !important; }
  .rz-card-page { padding: 0; background: #fff; }
  .rz-card { max-width: none; }
}
</style>
