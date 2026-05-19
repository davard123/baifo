<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BLESSINGS } from '../data/blessings.js'
import { apiFetch } from '../api.js'
import { getViewerProfile, saveViewerProfile } from '../utils/viewerProfile.js'

const emit = defineEmits(['wish-submitted'])
const router = useRouter()

const active = ref(null)
const toast = ref('')
const stage = ref('select')

const form = ref({ name: '', age: '', target: '' })
const loading = ref(false)
const resultWish = ref('')

onMounted(() => {
  const viewer = getViewerProfile()
  form.value.name = viewer.username || ''
  form.value.age = viewer.age ? String(viewer.age) : '30'
})

const nextBlessing = computed(() => {
  if (!active.value) return null
  const i = BLESSINGS.findIndex((b) => b.key === active.value.key)
  return i >= 0 && i < BLESSINGS.length - 1 ? BLESSINGS[i + 1] : null
})

function open(b) {
  active.value = b
  stage.value = 'form'
  resultWish.value = ''
  form.value.target = ''
  doneRituals.value = new Set()
}

function close() {
  active.value = null
  stage.value = 'select'
  form.value = { name: '', age: '', target: '' }
}

async function submit() {
  if (loading.value) return

  if (!form.value.name.trim()) {
    toast.value = '请填写祈福者姓名'
    setTimeout(() => {
      toast.value = ''
    }, 2500)
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
        target: form.value.target,
      }),
    })
  } catch {
    toast.value = '提交失败，请稍后重试。'
    setTimeout(() => {
      toast.value = ''
    }, 2500)
    loading.value = false
    return
  }

  loading.value = false
  resultWish.value = active.value.wish
  stage.value = 'done'
  emit('wish-submitted')
}

const RITUALS = [
  { name: '上香', icon: '🪔', toast: '心香一瓣，供养十方。' },
  { name: '点灯', icon: '🕯️', toast: '慧灯常明，照破无明。' },
  { name: '叩拜', icon: '🙏', toast: '三叩首，礼敬祈福。' },
]

const doneRituals = ref(new Set())
const popRitual = ref('')
const floats = ref([])

function doRitual(r) {
  if (doneRituals.value.has(r.name)) return

  doneRituals.value = new Set([...doneRituals.value, r.name])
  toast.value = r.toast
  setTimeout(() => {
    toast.value = ''
  }, 2500)

  popRitual.value = r.name
  setTimeout(() => {
    popRitual.value = ''
  }, 400)

  const count = 3
  for (let i = 0; i < count; i += 1) {
    const id = Date.now() + i
    const left = 30 + Math.random() * 40
    const delay = i * 180
    setTimeout(() => {
      floats.value.push({ id, icon: r.icon, left })
      setTimeout(() => {
        floats.value = floats.value.filter((f) => f.id !== id)
      }, 1500)
    }, delay)
  }
}
</script>

<template>
  <section class="blessing-section card">
    <h2 class="section-title">祈福池</h2>
    <p class="section-sub">心诚则灵，选择一项，虔诚发愿，功德回向。</p>

    <div class="blessing-grid">
      <button
        v-for="b in BLESSINGS"
        :key="b.key"
        class="blessing-item"
        @click="open(b)"
      >
        <img
          class="blessing-icon"
          :src="b.icon"
          :alt="b.label"
          loading="lazy"
          decoding="async"
        />
        <span class="blessing-label">{{ b.label }}</span>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="active" class="blessing-modal" @click.self="close">
        <div class="modal-shell">
          <div class="modal-scene">
            <div class="scene-img-wrap">
              <img :src="active.bg" :alt="active.label" class="scene-img" />
            </div>
          </div>

          <div class="scene-overlay">
            <div class="overlay-head">
              <p class="overlay-kicker">祈福主题</p>
              <h3 class="overlay-title">{{ active.label }}</h3>
              <p v-if="stage === 'form'" class="form-wish-hint">{{ active.wish }}</p>
              <p v-if="stage === 'done'" class="result-wish">{{ resultWish }}</p>
            </div>

            <div v-if="stage === 'form'" class="scene-rituals">
              <TransitionGroup name="float-group">
                <span
                  v-for="f in floats"
                  :key="f.id"
                  class="float-emoji"
                  :style="{ left: `${f.left}%` }"
                >{{ f.icon }}</span>
              </TransitionGroup>

              <button
                v-for="r in RITUALS"
                :key="r.name"
                class="ritual-btn"
                :class="{ done: doneRituals.has(r.name), pop: popRitual === r.name }"
                :disabled="doneRituals.has(r.name)"
                @click="doRitual(r)"
              >
                <span class="ritual-icon">{{ r.icon }}</span>
                <span class="ritual-name">
                  {{ r.name }}{{ doneRituals.has(r.name) ? ' ✓' : '' }}
                </span>
              </button>
            </div>

            <div v-if="stage === 'done'" class="scene-result">
              <p class="result-user">
                {{ form.age }}岁的{{ form.name }}敬上{{ form.target ? `，祈愿${form.target}` : '' }}
              </p>
              <div class="result-btns">
                <button
                  v-if="nextBlessing"
                  class="back-home-btn next-btn"
                  @click="open(nextBlessing)"
                >
                  进入下一个祈福池
                </button>
                <button class="back-home-btn" @click="close(); router.push('/')">
                  返回首页
                </button>
              </div>
            </div>

            <div v-if="stage === 'form'" class="scene-form">
              <div class="form-row">
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="祈福者姓名（必填）"
                  class="field"
                  maxlength="20"
                />
                <input
                  v-model="form.age"
                  type="number"
                  placeholder="年龄"
                  class="field age-field"
                  min="1"
                  max="150"
                />
              </div>

              <input
                v-model="form.target"
                type="text"
                placeholder="为谁祈福（可选，如：父亲健康）"
                class="field target-field"
                maxlength="50"
              />

              <button class="submit-btn" :disabled="loading" @click="submit">
                <span v-if="loading">祈福中...</span>
                <span v-else>🙏 递交祈福</span>
              </button>
            </div>
          </div>
        </div>

        <button class="modal-close" @click="close">✕</button>

        <transition name="toast-fade">
          <div v-if="toast" class="modal-toast">{{ toast }}</div>
        </transition>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.blessing-section {
  animation: fadeInUp 0.7s 0.15s ease both;
}

.blessing-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.blessing-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 10px 12px;
  background: rgba(252, 246, 230, 0.82);
  border: 1px solid rgba(180, 140, 80, 0.18);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.blessing-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(100, 60, 20, 0.14);
  border-color: var(--gold);
}

.blessing-icon {
  width: 88px;
  height: 118px;
  object-fit: cover;
  object-position: top center;
  border-radius: 14px;
  border: 2px solid rgba(212, 168, 67, 0.25);
  box-shadow: 0 8px 18px rgba(96, 64, 24, 0.12);
}

.blessing-label {
  font-size: 0.82rem;
  color: var(--accent);
  opacity: 0.85;
  line-height: 1.2;
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
  padding: 0;
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
  align-items: stretch;
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
  font-size: 2rem;
  line-height: 1.1;
  color: var(--accent);
  letter-spacing: 0.08em;
}

.form-wish-hint {
  font-size: 0.96rem;
  color: rgba(127, 90, 54, 0.86);
  text-align: center;
  line-height: 1.8;
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
  transition: opacity 0.2s;
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
  transition: background 0.2s, transform 0.15s, border-color 0.2s;
}

.ritual-icon {
  font-size: 1.6rem;
  line-height: 1;
  display: block;
}

.ritual-name {
  font-size: 0.88rem;
  display: block;
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

@keyframes ritualPop {
  0% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.22) translateY(-4px);
  }

  70% {
    transform: scale(0.96);
  }

  100% {
    transform: scale(1);
  }
}

.scene-result {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.result-wish {
  font-size: 1.12rem;
  color: var(--accent);
  line-height: 1.9;
}

.result-user {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.result-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.back-home-btn {
  margin-top: 4px;
  padding: 10px 28px;
  border-radius: 22px;
  border: 2px solid rgba(127, 90, 54, 0.4);
  background: rgba(127, 90, 54, 0.08);
  color: var(--accent);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.back-home-btn:hover {
  background: rgba(212, 168, 67, 0.2);
  border-color: var(--gold);
}

.next-btn {
  background: rgba(212, 168, 67, 0.25);
  border-color: #f0d080;
}

.scene-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: 10px;
}

.field {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(212, 168, 67, 0.4);
  background: rgba(255, 252, 245, 0.92);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.field:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.12);
}

.age-field,
.target-field {
  width: 100%;
}

.target-field {
  grid-column: 1 / -1;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #7f5a36, #a07040);
  color: #fff8ee;
  font-size: 1rem;
  letter-spacing: 0.08em;
  box-shadow: 0 4px 16px rgba(127, 90, 54, 0.3);
  transition: opacity 0.2s, transform 0.15s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 250, 240, 0.15);
  border: 1px solid rgba(255, 250, 240, 0.3);
  color: #fff8ee;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(255, 250, 240, 0.28);
}

.modal-toast {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(50, 30, 10, 0.88);
  color: #f0d080;
  padding: 10px 22px;
  border-radius: 24px;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.35s, transform 0.35s;
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

  .modal-scene {
    min-height: 0;
    max-height: none;
  }

  .scene-img-wrap {
    padding: 0;
  }

  .scene-img {
    width: 100%;
    height: 100%;
    max-height: none;
    object-position: center 62%;
  }

  .scene-overlay {
    border-left: none;
    border-top: 1px solid rgba(212, 168, 67, 0.22);
    padding: 20px 18px 22px;
    overflow: visible;
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

@media (max-width: 640px) {
  .blessing-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .blessing-icon {
    width: 70px;
    height: 94px;
  }

  .blessing-modal {
    padding-left: 10px;
    padding-right: 10px;
  }

  .scene-rituals {
    grid-template-columns: 1fr;
  }

  .ritual-btn {
    min-height: 74px;
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
    max-height: none;
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

  .scene-rituals {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
</style>
