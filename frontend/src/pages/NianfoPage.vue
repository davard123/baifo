<script setup>
import { computed, onMounted } from 'vue'
import WoodenFish from '../components/WoodenFish.vue'
import { useNianfo } from '../composables/useNianfo.js'

// 站内其余功能都是低频的（礼佛、祭祖一年来几次）。
// 这一页是每日功课的完整视图；顺手念一声用全站抽屉（NianfoDrawer）。
const {
  CHANTS, GOALS, state, floats, pressed,
  chant, today, streak, goal, progress, reached, days,
  tap, pickChant, pickGoal, toggleSound,
} = useNianfo()

const peak = computed(() => Math.max(1, ...days.value.map((d) => d.count)))

onMounted(() => {
  document.title = '念佛计数器 | 在线木鱼与每日功课 - www.fopusha.com'
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    '在线念佛计数器与电子木鱼，支持南无阿弥陀佛、观世音菩萨等佛号，记录每日念诵数量、连续天数与每日目标。计数只保存在本机。',
  )
})
</script>

<template>
  <main class="nianfo-shell">
    <nav class="top-nav">
      <div class="breadcrumb-row">
        <router-link to="/" class="page-link">← 返回首页</router-link>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">念佛计数</span>
      </div>
    </nav>

    <header class="nianfo-head">
      <p class="section-kicker">每日功课</p>
      <h1>念佛计数</h1>
      <p class="lead">
        轻触木鱼，计一声佛号。计数只保存在这台设备上，不需要注册，也不会上传。
      </p>
    </header>

    <section class="counter-card card">
      <div class="stats">
        <div class="stat">
          <span class="stat-label">今日</span>
          <strong class="stat-value">{{ today }}</strong>
        </div>
        <div class="stat">
          <span class="stat-label">累计</span>
          <strong class="stat-value">{{ state.total }}</strong>
        </div>
        <div class="stat">
          <span class="stat-label">连续</span>
          <strong class="stat-value">{{ streak }}<span class="stat-unit">天</span></strong>
        </div>
      </div>

      <div class="progress" role="progressbar" :aria-valuenow="today" aria-valuemin="0" :aria-valuemax="goal">
        <div class="progress-bar" :style="{ width: `${progress * 100}%` }"></div>
      </div>
      <p class="progress-note">
        <template v-if="reached">今日已满 {{ goal }} 声，随喜功德。</template>
        <template v-else>今日目标 {{ goal }} 声，还差 {{ goal - today }} 声。</template>
      </p>

      <div class="fish-area">
        <span
          v-for="f in floats"
          :key="f.id"
          class="float-chant"
          :style="{ left: `${f.left}%` }"
          aria-hidden="true"
        >{{ chant.text }}</span>

        <div class="fish-wrap">
          <WoodenFish :pressed="pressed" :label="`念一声${chant.text}，当前今日 ${today} 声`" @tap="tap" />
        </div>
      </div>

      <p class="chant-text">{{ chant.text }}</p>
    </section>

    <section class="settings card">
      <div class="setting">
        <h2 class="setting-title">佛号</h2>
        <div class="chip-row">
          <button
            v-for="c in CHANTS"
            :key="c.key"
            type="button"
            class="chip"
            :class="{ active: c.key === state.chant }"
            :aria-pressed="c.key === state.chant"
            @click="pickChant(c.key)"
          >{{ c.short }}</button>
        </div>
      </div>

      <div class="setting">
        <h2 class="setting-title">每日目标</h2>
        <div class="chip-row">
          <button
            v-for="g in GOALS"
            :key="g"
            type="button"
            class="chip"
            :class="{ active: g === state.goal }"
            :aria-pressed="g === state.goal"
            @click="pickGoal(g)"
          >{{ g }}</button>
        </div>
      </div>

      <div class="setting">
        <h2 class="setting-title">木鱼声</h2>
        <button
          type="button"
          class="chip"
          :class="{ active: state.sound }"
          :aria-pressed="state.sound"
          @click="toggleSound"
        >{{ state.sound ? '已开启' : '已关闭' }}</button>
      </div>
    </section>

    <section class="history card">
      <h2 class="section-title">最近十四天</h2>
      <div class="bars">
        <div v-for="d in days" :key="d.date" class="bar-col" :title="`${d.date}：${d.count} 声`">
          <div class="bar" :style="{ height: `${Math.max(2, (d.count / peak) * 100)}%` }" :class="{ empty: !d.count }"></div>
          <span class="bar-day">{{ Number(d.date.slice(-2)) }}</span>
        </div>
      </div>
      <p class="history-note">仅显示本机记录。换设备或清除浏览器数据后会重新开始。</p>
    </section>

    <section class="explain card">
      <h2 class="section-title">关于念佛计数</h2>
      <p>
        念佛计数用于记录每日称念佛号的数量，是常见的日常功课形式。
        传统上以念珠计数，一串一百零八颗，因此这里把 108 作为默认的每日目标。
      </p>
      <p>
        木鱼原本用于寺院中提示节奏、摄心专注。这一页只是把这件事搬到手边，
        方便在通勤、等待、睡前这些零碎时间里静一静。念多念少不必计较，贵在相续。
      </p>
      <div class="explain-links">
        <router-link to="/" class="page-link">进入礼佛入口</router-link>
        <router-link to="/ancestors/" class="page-link">为先人回向</router-link>
        <router-link to="/guide/overview/" class="page-link">查看使用说明</router-link>
      </div>
    </section>
  </main>
</template>

<style scoped>
.nianfo-shell {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 72px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.top-nav { padding: 12px 0 0; }
.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.88rem;
}
.crumb-sep, .crumb-current { color: var(--text-muted); font-size: 0.88rem; }

.nianfo-head {
  padding: 22px 0 0;
  text-align: center;
  animation: fadeInUp 0.6s ease both;
}
.section-kicker {
  color: var(--accent);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.nianfo-head h1 {
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  color: var(--gold-light);
  letter-spacing: 0.14em;
  margin-bottom: 10px;
}
.lead {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.85;
  max-width: 30em;
  margin: 0 auto;
}

.counter-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 26px 22px 30px;
  animation: fadeInUp 0.6s 0.06s ease both;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  gap: 10px;
  text-align: center;
}
.stat { display: flex; flex-direction: column; gap: 4px; }
.stat-label {
  font-size: 0.74rem;
  letter-spacing: 0.16em;
  color: var(--text-muted);
}
.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-unit { font-size: 0.86rem; margin-left: 2px; color: var(--text-muted); font-weight: 400; }

.progress {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 248, 233, 0.09);
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #c99a4e, #f0d091);
  transition: width 0.3s ease;
}
.progress-note {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.fish-area {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.fish-wrap { width: min(210px, 58vw); }

.float-chant {
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  color: var(--gold-light);
  font-size: 0.94rem;
  letter-spacing: 0.08em;
  pointer-events: none;
  white-space: nowrap;
  animation: floatUp 1.1s ease-out forwards;
}
@keyframes floatUp {
  from { opacity: 0; transform: translate(-50%, 10px); }
  25%  { opacity: 1; }
  to   { opacity: 0; transform: translate(-50%, -60px); }
}

.chant-text {
  color: var(--accent);
  font-size: 1.02rem;
  letter-spacing: 0.14em;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  animation: fadeInUp 0.6s 0.12s ease both;
}
.setting-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  margin-bottom: 9px;
}
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  /* 44px 是触摸目标的下限，设置项在移动端也要好按 */
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(242, 200, 121, 0.24);
  background: rgba(255, 248, 233, 0.05);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: inherit;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.chip:hover { border-color: rgba(242, 200, 121, 0.45); color: var(--text); }
.chip.active {
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  border-color: transparent;
  color: #2a1c0c;
  font-weight: 600;
}

.history { padding: 22px; animation: fadeInUp 0.6s 0.18s ease both; }
.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gold-light);
  letter-spacing: 0.06em;
  margin-bottom: 14px;
}
.bars {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  align-items: end;
  gap: 4px;
  height: 96px;
}
.bar-col { display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; }
.bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, #f0d091, #b8813c);
  min-height: 2px;
}
.bar.empty { background: rgba(255, 248, 233, 0.12); }
.bar-day { font-size: 0.62rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.history-note { margin-top: 12px; font-size: 0.76rem; color: var(--text-muted); line-height: 1.6; }

.explain { padding: 22px; animation: fadeInUp 0.6s 0.24s ease both; }
.explain p {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.9;
  margin-bottom: 12px;
}
.explain-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }

@media (max-width: 560px) {
  .bars { height: 76px; gap: 3px; }
  .bar-day { font-size: 0.56rem; }
  .settings, .history, .explain { padding: 18px 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .nianfo-head, .counter-card, .settings, .history, .explain { animation: none; }
  .float-chant { animation-duration: 0.01ms; }
}
</style>
