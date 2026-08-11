<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import WoodenFish from './WoodenFish.vue'
import { useNianfo } from '../composables/useNianfo.js'

// 念佛是唯一每天都会用的功能，此前却只是首页最后一张卡片。
// 做成全站常驻抽屉，任何页面都能随手念一声。
const route = useRoute()
const {
  CHANTS, floats, pressed,
  chant, today, streak, goal, progress, reached,
  state, tap, pickChant, toggleSound,
} = useNianfo()

const open = ref(false)
const panel = ref(null)
const trigger = ref(null)
let previousOverflow = ''

// /nianfo/ 整页本身就是这个工具，再浮一个入口是重复的
const hidden = computed(() => route.path.replace(/\/+$/, '') === '/nianfo')

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape' && open.value) {
    close()
    trigger.value?.focus()
  }
}

watch(open, async (value) => {
  if (value) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    panel.value?.querySelector('.fish')?.focus()
    return
  }
  document.body.style.overflow = previousOverflow
})

// 换页时收起，避免抽屉盖着新页面
watch(() => route.path, close)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <div v-if="!hidden">
    <button
      ref="trigger"
      type="button"
      class="nianfo-trigger"
      :class="{ active: open }"
      :aria-expanded="open"
      aria-controls="nianfo-drawer"
      :aria-label="`念佛计数，今日 ${today} 声`"
      @click="toggle"
    >
      <span class="trigger-icon" aria-hidden="true">🪷</span>
      <span v-if="today > 0" class="trigger-count" aria-hidden="true">{{ today > 999 ? '999+' : today }}</span>
    </button>

    <Teleport to="body">
      <transition name="fade">
        <div v-if="open" class="nianfo-backdrop" @click="close"></div>
      </transition>

      <transition name="slide">
        <aside
          v-if="open"
          id="nianfo-drawer"
          ref="panel"
          class="nianfo-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="念佛计数"
        >
          <header class="drawer-head">
            <div>
              <p class="drawer-kicker">每日功课</p>
              <h2 class="drawer-title">念佛计数</h2>
            </div>
            <button type="button" class="drawer-close" aria-label="收起念佛计数" @click="close">✕</button>
          </header>

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

          <div class="drawer-foot">
            <button
              type="button"
              class="chip"
              :class="{ active: state.sound }"
              :aria-pressed="state.sound"
              @click="toggleSound"
            >木鱼声 {{ state.sound ? '开' : '关' }}</button>
            <router-link to="/nianfo/" class="chip full-link" @click="close">完整记录与设置 →</router-link>
          </div>
        </aside>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.nianfo-trigger {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 998;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(242, 200, 121, 0.42);
  background: linear-gradient(145deg, rgba(52, 34, 68, 0.96), rgba(26, 18, 36, 0.98));
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.42);
  display: grid;
  place-items: center;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.nianfo-trigger:hover { transform: scale(1.06); border-color: var(--gold); }
.nianfo-trigger.active { border-color: var(--gold); }
.nianfo-trigger:focus-visible { outline: 3px solid rgba(242, 200, 121, 0.6); outline-offset: 3px; }
/* emoji 自带颜色，这里的 color 只是给继承一个合理默认值 */
.trigger-icon { font-size: 1.5rem; line-height: 1; color: var(--text); }
.trigger-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  color: #2a1c0c;
  font-size: 0.68rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  font-variant-numeric: tabular-nums;
}

.nianfo-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(8, 5, 13, 0.62);
  backdrop-filter: blur(3px);
}

.nianfo-drawer {
  position: fixed;
  z-index: 1001;
  top: 0;
  right: 0;
  height: 100dvh;
  width: min(380px, 92vw);
  overflow-y: auto;
  padding: 22px 22px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(180deg, rgba(30, 21, 42, 0.99), rgba(17, 12, 24, 0.99));
  border-left: 1px solid rgba(242, 200, 121, 0.2);
  box-shadow: -18px 0 50px rgba(0, 0, 0, 0.45);
}

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.drawer-kicker {
  color: var(--accent);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.drawer-title {
  font-size: 1.25rem;
  color: var(--gold-light);
  letter-spacing: 0.1em;
}
.drawer-close {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(242, 200, 121, 0.24);
  background: rgba(255, 248, 233, 0.06);
  color: var(--text);
  font-size: 0.95rem;
}
.drawer-close:hover { background: rgba(242, 200, 121, 0.16); }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; }
.stat { display: flex; flex-direction: column; gap: 3px; }
.stat-label { font-size: 0.7rem; letter-spacing: 0.14em; color: var(--text-muted); }
.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-unit { font-size: 0.78rem; margin-left: 2px; color: var(--text-muted); font-weight: 400; }

.progress { height: 5px; border-radius: 999px; background: rgba(255, 248, 233, 0.09); overflow: hidden; }
.progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #c99a4e, #f0d091);
  transition: width 0.3s ease;
}
.progress-note { font-size: 0.76rem; color: var(--text-muted); text-align: center; }

.fish-area { position: relative; display: flex; justify-content: center; padding-top: 6px; }
.fish-wrap { width: min(200px, 58vw); }

.float-chant {
  position: absolute;
  top: 2px;
  transform: translateX(-50%);
  color: var(--gold-light);
  font-size: 0.88rem;
  letter-spacing: 0.08em;
  pointer-events: none;
  white-space: nowrap;
  animation: floatUp 1.1s ease-out forwards;
  z-index: 1;
}
@keyframes floatUp {
  from { opacity: 0; transform: translate(-50%, 10px); }
  25%  { opacity: 1; }
  to   { opacity: 0; transform: translate(-50%, -54px); }
}

.chant-text { text-align: center; color: var(--accent); font-size: 0.96rem; letter-spacing: 0.12em; }

.chip-row { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; }
.chip {
  min-height: 40px;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid rgba(242, 200, 121, 0.24);
  background: rgba(255, 248, 233, 0.05);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-family: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.chip:hover { border-color: rgba(242, 200, 121, 0.45); color: var(--text); }
.chip.active {
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  border-color: transparent;
  color: #2a1c0c;
  font-weight: 600;
}

.drawer-foot {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  border-top: 1px solid rgba(242, 200, 121, 0.14);
}
.full-link { color: var(--accent); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.24s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.28s ease, opacity 0.28s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(24px); opacity: 0; }

/* 手机上从底部升起更顺手，拇指够得到 */
@media (max-width: 640px) {
  .nianfo-trigger { right: 16px; bottom: 16px; }
  .nianfo-drawer {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    max-height: 88dvh;
    border-left: none;
    border-top: 1px solid rgba(242, 200, 121, 0.2);
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -18px 50px rgba(0, 0, 0, 0.45);
  }
  .slide-enter-from, .slide-leave-to { transform: translateY(28px); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active, .fade-leave-active,
  .slide-enter-active, .slide-leave-active { transition: none; }
  .float-chant { animation-duration: 0.01ms; }
  .nianfo-trigger { transition: none; }
}
</style>
