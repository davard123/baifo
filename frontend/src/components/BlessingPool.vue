<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BLESSINGS } from '../data/blessings.js'
import { apiFetch } from '../api.js'
import { getViewerProfile, saveViewerProfile } from '../utils/viewerProfile.js'

const emit = defineEmits(['wish-submitted'])
const router = useRouter()

const active = ref(null)
const toast = ref('')
const stage = ref('select')
const loading = ref(false)
const resultWish = ref('')
const modalCloseButton = ref(null)
const previousOverflow = ref('')

const form = ref({
  name: '',
  age: '',
  target: '',
})

const RITUALS = [
  { name: '上香', icon: '🪔', toast: '心香一瓣，供养十方。' },
  { name: '点灯', icon: '🕯️', toast: '慧灯常明，照破无明。' },
  { name: '叩拜', icon: '🙏', toast: '三叩首，礼敬祈福。' },
]

const doneRituals = ref(new Set())
const popRitual = ref('')
const floats = ref([])

const nextBlessing = computed(() => {
  if (!active.value) return null
  const currentIndex = BLESSINGS.findIndex((item) => item.key === active.value.key)
  return currentIndex >= 0 && currentIndex < BLESSINGS.length - 1 ? BLESSINGS[currentIndex + 1] : null
})

function hydrateProfile() {
  const viewer = getViewerProfile()
  form.value.name = viewer.username || ''
  form.value.age = viewer.age ? String(viewer.age) : '30'
  form.value.target = ''
}

function resetTransientState() {
  resultWish.value = ''
  stage.value = 'select'
  doneRituals.value = new Set()
  popRitual.value = ''
  floats.value = []
  loading.value = false
}

function open(blessing) {
  active.value = blessing
  stage.value = 'form'
  resultWish.value = ''
  doneRituals.value = new Set()
  popRitual.value = ''
  floats.value = []
  hydrateProfile()
}

function close() {
  active.value = null
  resetTransientState()
  hydrateProfile()
}

function clearToastSoon() {
  setTimeout(() => {
    toast.value = ''
  }, 2500)
}

async function submit() {
  if (loading.value) return

  if (!form.value.name.trim()) {
    toast.value = '请填写祈福者姓名。'
    clearToastSoon()
    return
  }

  loading.value = true
  saveViewerProfile(form.value.name.trim(), form.value.age)

  try {
    await apiFetch('/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.value.name.trim(),
        age: Number(form.value.age) || 30,
        wish: active.value.wish,
        buddha: '',
        blessing: active.value.label,
        target: form.value.target.trim(),
      }),
    })
  } catch {
    toast.value = '提交失败，请稍后重试。'
    clearToastSoon()
    loading.value = false
    return
  }

  loading.value = false
  resultWish.value = active.value.wish
  stage.value = 'done'
  emit('wish-submitted')
}

function doRitual(ritual) {
  if (doneRituals.value.has(ritual.name)) return

  doneRituals.value = new Set([...doneRituals.value, ritual.name])
  toast.value = ritual.toast
  clearToastSoon()

  popRitual.value = ritual.name
  setTimeout(() => {
    popRitual.value = ''
  }, 400)

  for (let index = 0; index < 3; index += 1) {
    const id = Date.now() + index
    const left = 28 + Math.random() * 44
    const delay = index * 180
    setTimeout(() => {
      floats.value.push({ id, icon: ritual.icon, left })
      setTimeout(() => {
        floats.value = floats.value.filter((item) => item.id !== id)
      }, 1500)
    }, delay)
  }
}

function lockBodyScroll() {
  previousOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  document.body.style.overflow = previousOverflow.value
}

watch(active, async (value) => {
  if (value) {
    lockBodyScroll()
    await nextTick()
    modalCloseButton.value?.focus()
    return
  }
  unlockBodyScroll()
})

onMounted(() => {
  hydrateProfile()
})

onBeforeUnmount(() => {
  unlockBodyScroll()
})
</script>

<template>
  <section class="blessing-section card" aria-labelledby="blessing-pool-title">
    <div class="section-head">
      <p class="section-kicker">祈愿场景</p>
      <h2 id="blessing-pool-title" class="section-title">祈福池</h2>
      <p class="section-sub">先选择一项愿望主题，再进入仪式页面留下心愿。每一个入口都尽量保持简单、可亲近，也保留应有的敬意。</p>
    </div>

    <div class="blessing-grid">
      <button
        v-for="blessing in BLESSINGS"
        :key="blessing.key"
        class="blessing-item"
        type="button"
        :aria-label="`进入${blessing.label}祈福池`"
        @click="open(blessing)"
      >
        <img
          class="blessing-icon"
          :src="blessing.icon"
          :alt="blessing.label"
          loading="lazy"
          decoding="async"
        />
        <span class="blessing-label">{{ blessing.label }}</span>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="active" class="blessing-modal" @click.self="close" @keydown.esc="close">
        <div
          class="modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blessing-dialog-title"
          aria-describedby="blessing-dialog-desc"
        >
          <div class="modal-scene">
            <div class="scene-img-wrap">
              <img :src="active.bg" :alt="`${active.label}场景图`" class="scene-img" />
            </div>
          </div>

          <div class="scene-overlay">
            <div class="overlay-head">
              <p class="overlay-kicker">祈福主题</p>
              <h3 id="blessing-dialog-title" class="overlay-title">{{ active.label }}</h3>
              <p id="blessing-dialog-desc" class="form-wish-hint">
                <template v-if="stage === 'form'">{{ active.wish }}</template>
                <template v-else>{{ resultWish }}</template>
              </p>
            </div>

            <div v-if="stage === 'form'" class="scene-rituals" aria-label="可选礼仪动作">
              <TransitionGroup name="float-group">
                <span
                  v-for="item in floats"
                  :key="item.id"
                  class="float-emoji"
                  :style="{ left: `${item.left}%` }"
                  aria-hidden="true"
                >{{ item.icon }}</span>
              </TransitionGroup>

              <button
                v-for="ritual in RITUALS"
                :key="ritual.name"
                class="ritual-btn"
                type="button"
                :class="{ done: doneRituals.has(ritual.name), pop: popRitual === ritual.name }"
                :disabled="doneRituals.has(ritual.name)"
                :aria-pressed="doneRituals.has(ritual.name)"
                @click="doRitual(ritual)"
              >
                <span class="ritual-icon" aria-hidden="true">{{ ritual.icon }}</span>
                <span class="ritual-name">
                  {{ ritual.name }}{{ doneRituals.has(ritual.name) ? ' 已完成' : '' }}
                </span>
              </button>
            </div>

            <div v-if="stage === 'done'" class="scene-result">
              <p class="result-user">
                {{ form.age }} 岁的 {{ form.name }} {{ form.target ? `，为 ${form.target}` : '' }} 留下了这份祈愿。
              </p>
              <div class="result-btns">
                <button
                  v-if="nextBlessing"
                  class="back-home-btn next-btn"
                  type="button"
                  @click="open(nextBlessing)"
                >
                  进入下一个祈福池
                </button>
                <button class="back-home-btn" type="button" @click="close(); router.push('/')">
                  返回首页
                </button>
              </div>
            </div>

            <form v-if="stage === 'form'" class="scene-form" @submit.prevent="submit">
              <div class="form-row">
                <div class="field-block">
                  <label class="field-label" for="blessing-name">祈福者姓名</label>
                  <input
                    id="blessing-name"
                    v-model="form.name"
                    type="text"
                    class="field"
                    maxlength="20"
                    autocomplete="name"
                    placeholder="请输入姓名"
                  />
                </div>

                <div class="field-block field-block--age">
                  <label class="field-label" for="blessing-age">年龄</label>
                  <input
                    id="blessing-age"
                    v-model="form.age"
                    type="number"
                    class="field age-field"
                    min="1"
                    max="150"
                    inputmode="numeric"
                    placeholder="年龄"
                  />
                </div>
              </div>

              <div class="field-block">
                <label class="field-label" for="blessing-target">为谁祈福</label>
                <input
                  id="blessing-target"
                  v-model="form.target"
                  type="text"
                  class="field target-field"
                  maxlength="50"
                  placeholder="可选，例如：父亲健康、家人平安"
                />
              </div>

              <button class="submit-btn" type="submit" :disabled="loading">
                <span v-if="loading">祈福中...</span>
                <span v-else>提交祈福</span>
              </button>
            </form>
          </div>
        </div>

        <button
          ref="modalCloseButton"
          class="modal-close"
          type="button"
          aria-label="关闭祈福池弹窗"
          @click="close"
        >
          ✕
        </button>

        <transition name="toast-fade">
          <div v-if="toast" class="modal-toast" aria-live="polite">{{ toast }}</div>
        </transition>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.blessing-section {
  position: relative;
  animation: fadeInUp 0.7s 0.12s ease both;
  overflow: hidden;
}

.blessing-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(240, 208, 128, 0.14), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 18%);
  pointer-events: none;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.section-kicker {
  color: var(--accent-light);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.section-title {
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.03em;
}

.section-sub {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.72;
  max-width: 760px;
}

.blessing-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.blessing-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 16px 10px 12px;
  background:
    linear-gradient(180deg, rgba(255, 250, 239, 0.96), rgba(244, 232, 208, 0.82));
  border: 1px solid rgba(180, 140, 80, 0.2);
  border-radius: 16px;
  cursor: pointer;
  box-shadow:
    0 12px 24px rgba(96, 64, 24, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.blessing-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(100, 60, 20, 0.16);
  border-color: var(--gold);
  background:
    linear-gradient(180deg, rgba(255, 251, 242, 1), rgba(245, 234, 212, 0.9));
}

.blessing-item:focus-visible,
.ritual-btn:focus-visible,
.submit-btn:focus-visible,
.back-home-btn:focus-visible,
.modal-close:focus-visible,
.field:focus-visible {
  outline: 3px solid rgba(212, 168, 67, 0.55);
  outline-offset: 3px;
}

.blessing-icon {
  width: 92px;
  height: 124px;
  object-fit: cover;
  object-position: top center;
  border-radius: 14px;
  border: 2px solid rgba(212, 168, 67, 0.25);
  box-shadow: 0 10px 22px rgba(96, 64, 24, 0.14);
}

.blessing-label {
  text-align: center;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
  line-height: 1.32;
  overflow-wrap: anywhere;
}

.blessing-modal {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at center, rgba(151, 108, 56, 0.18), transparent 30%),
    rgba(20, 8, 0, 0.88);
  backdrop-filter: blur(10px);
}

.modal-shell {
  width: min(1120px, 92vw);
  min-height: min(760px, 86vh);
  max-height: 86vh;
  border-radius: 28px;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(420px, 1.15fr) minmax(320px, 0.85fr);
  background: linear-gradient(135deg, rgba(255, 249, 238, 0.96), rgba(246, 234, 212, 0.94));
  border: 1px solid rgba(212, 168, 67, 0.22);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.45);
}

.modal-scene {
  position: relative;
  min-height: 0;
  background:
    radial-gradient(circle at center, rgba(255, 220, 150, 0.26), transparent 46%),
    linear-gradient(180deg, #f5ead3 0%, #ecd8b5 100%);
}

.modal-scene::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(127, 90, 54, 0.06));
  pointer-events: none;
}

.scene-img-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.scene-img {
  width: 108%;
  height: 108%;
  max-width: none;
  max-height: none;
  display: block;
  object-fit: cover;
  object-position: center 68%;
  filter: drop-shadow(0 24px 36px rgba(96, 62, 24, 0.18));
}

.scene-overlay {
  min-height: 0;
  overflow-y: auto;
  padding: 28px 28px 30px;
  background: linear-gradient(180deg, rgba(255, 251, 245, 0.92), rgba(246, 235, 216, 0.98));
  border-left: 1px solid rgba(212, 168, 67, 0.22);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.overlay-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(212, 168, 67, 0.18);
}

.overlay-kicker {
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(127, 90, 54, 0.58);
}

.overlay-title {
  font-size: clamp(1.7rem, 3vw, 2rem);
  line-height: 1.1;
  color: var(--accent);
  letter-spacing: 0.08em;
}

.form-wish-hint {
  font-size: 0.96rem;
  color: rgba(127, 90, 54, 0.86);
  text-align: center;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.scene-rituals {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.float-emoji {
  position: absolute;
  bottom: 100%;
  font-size: 2rem;
  pointer-events: none;
  animation: floatUp 1.4s ease-out forwards;
  transform: translateX(-50%);
  z-index: 10;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }

  50% {
    opacity: 0.9;
    transform: translateX(-50%) translateY(-50px) scale(1.3);
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-110px) scale(0.7);
  }
}

.float-group-leave-active {
  transition: opacity 0.2s ease;
}

.float-group-leave-to {
  opacity: 0;
}

.ritual-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 104px;
  padding: 16px 12px;
  border-radius: 18px;
  border: 1px solid rgba(127, 90, 54, 0.24);
  background: linear-gradient(180deg, rgba(255, 250, 241, 0.96), rgba(244, 232, 212, 0.9));
  color: var(--accent);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
}

.ritual-btn:hover:not(:disabled) {
  background: rgba(212, 168, 67, 0.2);
  border-color: var(--gold);
  transform: translateY(-2px);
}

.ritual-btn.done {
  opacity: 0.55;
  background: rgba(212, 168, 67, 0.12);
}

.ritual-btn.pop {
  animation: ritualPop 0.38s ease;
}

.ritual-icon {
  font-size: 1.6rem;
  line-height: 1;
}

.ritual-name {
  font-size: 0.88rem;
  line-height: 1.4;
  text-align: center;
}

@keyframes ritualPop {
  0% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.12) translateY(-4px);
  }

  70% {
    transform: scale(0.98);
  }

  100% {
    transform: scale(1);
  }
}

.scene-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 12px;
}

.field-block {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-block--age {
  width: 100%;
}

.field-label {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.field {
  width: 100%;
  min-width: 0;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid rgba(212, 168, 67, 0.4);
  background: rgba(255, 252, 245, 0.92);
  color: var(--text);
  font-family: inherit;
  font-size: 0.92rem;
  outline: none;
}

.field:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.12);
}

.submit-btn {
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #7f5a36, #a07040);
  color: #fff8ee;
  font-size: 1rem;
  letter-spacing: 0.08em;
  box-shadow: 0 4px 16px rgba(127, 90, 54, 0.3);
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.scene-result {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.result-user {
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.8;
}

.result-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.back-home-btn {
  width: min(100%, 320px);
  min-height: 48px;
  padding: 10px 24px;
  border-radius: 22px;
  border: 2px solid rgba(127, 90, 54, 0.4);
  background: rgba(127, 90, 54, 0.08);
  color: var(--accent);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.back-home-btn:hover {
  background: rgba(212, 168, 67, 0.2);
  border-color: var(--gold);
}

.next-btn {
  background: rgba(212, 168, 67, 0.25);
  border-color: #f0d080;
}

.modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 250, 240, 0.15);
  border: 1px solid rgba(255, 250, 240, 0.3);
  color: #fff8ee;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 250, 240, 0.28);
  transform: scale(1.04);
}

.modal-toast {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  max-width: min(90vw, 460px);
  background: rgba(50, 30, 10, 0.92);
  color: #f0d080;
  padding: 10px 18px;
  border-radius: 24px;
  font-size: 0.9rem;
  line-height: 1.6;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

@media (max-width: 980px) and (orientation: portrait) {
  .blessing-modal {
    display: block;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: max(16px, env(safe-area-inset-top)) 12px max(20px, env(safe-area-inset-bottom));
  }

  .modal-shell {
    width: min(92vw, 520px);
    min-height: auto;
    max-height: none;
    grid-template-columns: 1fr;
    margin: 0 auto;
  }

  .scene-overlay {
    border-left: none;
    border-top: 1px solid rgba(212, 168, 67, 0.22);
    padding: 20px 18px 22px;
    overflow: visible;
  }

  .scene-img {
    width: 100%;
    height: 100%;
    object-position: center 62%;
  }

  .overlay-title {
    font-size: 1.7rem;
  }

  .modal-close {
    position: fixed;
    top: max(12px, env(safe-area-inset-top));
    right: 12px;
    z-index: 2;
  }
}

@media (max-width: 760px) {
  .blessing-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .blessing-icon {
    width: 74px;
    height: 100px;
  }

  .form-row,
  .scene-rituals {
    grid-template-columns: 1fr;
  }

  .ritual-btn {
    min-height: 76px;
    flex-direction: row;
    justify-content: center;
  }
}

@media (max-width: 980px) and (orientation: landscape) {
  .blessing-modal {
    align-items: flex-start;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: max(10px, env(safe-area-inset-top)) 12px max(14px, env(safe-area-inset-bottom));
  }

  .modal-shell {
    width: min(96vw, 920px);
    min-height: auto;
    max-height: none;
    grid-template-columns: minmax(240px, 0.95fr) minmax(300px, 1.05fr);
    margin: 0 auto;
  }

  .modal-scene {
    min-height: 320px;
  }

  .scene-img {
    width: 106%;
    height: 106%;
    object-position: center 58%;
  }

  .scene-overlay {
    overflow: visible;
    padding: 18px 18px 20px;
  }

  .ritual-btn {
    min-height: 82px;
    padding: 12px 10px;
  }

  .modal-close {
    position: fixed;
    top: max(8px, env(safe-area-inset-top));
    right: 10px;
    z-index: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .blessing-section,
  .blessing-item,
  .ritual-btn,
  .submit-btn,
  .back-home-btn,
  .modal-close,
  .float-emoji {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>
