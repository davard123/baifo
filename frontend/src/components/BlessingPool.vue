<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BLESSINGS } from '../data/blessings.js'
import { apiFetch } from '../api.js'
import { getViewerProfile, saveViewerProfile } from '../utils/viewerProfile.js'

const emit = defineEmits(['wish-submitted'])
const router = useRouter()

const active = ref(null)    // 当前选中的祈福项
const toast  = ref('')
const stage  = ref('select')  // 'select' | 'form' | 'done'

// 表单
const form = ref({ name: '', age: '', target: '' })
const loading = ref(false)
const resultWish = ref('')

// localStorage 恢复上次记录
onMounted(() => {
  const viewer = getViewerProfile()
  form.value.name = viewer.username || ''
  form.value.age = viewer.age ? String(viewer.age) : '30'
})

const nextBlessing = computed(() => {
  if (!active.value) return null
  const i = BLESSINGS.findIndex(b => b.key === active.value.key)
  return i >= 0 && i < BLESSINGS.length - 1 ? BLESSINGS[i + 1] : null
})

function open(b) {
  active.value = b
  stage.value  = 'form'
  resultWish.value = ''
  form.value.target = ''
  doneRituals.value = new Set()
}

function close() {
  active.value = null
  stage.value  = 'select'
  form.value   = { name: '', age: '', target: '' }
}

async function submit() {
  if (loading.value) return

  if (!form.value.name.trim()) {
    toast.value = '请填写祈福者姓名'
    setTimeout(() => toast.value = '', 2500)
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
        target: form.value.target
      })
    })
  } catch {
    toast.value = '提交失败，请稍后重试。'
    setTimeout(() => toast.value = '', 2500)
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
  { name: '磕头', icon: '🙏', toast: '三叩首，礼敬祈福。' },
]
const doneRituals = ref(new Set())
const popRitual  = ref('')
const floats     = ref([])   // [{id, icon, left}] 浮起粒子列表

function doRitual(r) {
  if (doneRituals.value.has(r.name)) return
  doneRituals.value = new Set([...doneRituals.value, r.name])
  toast.value = r.toast
  setTimeout(() => toast.value = '', 2500)
  // 按钮弹跳
  popRitual.value = r.name
  setTimeout(() => popRitual.value = '', 400)
  // 发射浮起粒子（3个，随机左右偏移）
  const count = 3
  for (let i = 0; i < count; i++) {
    const id   = Date.now() + i
    const left = 30 + Math.random() * 40   // 30%~70%
    const delay = i * 180                   // 错开发射
    setTimeout(() => {
      floats.value.push({ id, icon: r.icon, left })
      setTimeout(() => {
        floats.value = floats.value.filter(f => f.id !== id)
      }, 1500)
    }, delay)
  }
}
</script>

<template>
  <section class="blessing-section card">
    <h2 class="section-title">祈福池</h2>
    <p class="section-sub">心诚则灵，选择一项，虔诚发愿，功德回向。</p>

    <!-- 12 项祈福网格 -->
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

    <!-- 祈福弹窗 -->
    <Teleport to="body">
      <div v-if="active" class="blessing-modal" @click.self="close">
        <!-- 背景场景 -->
        <div class="modal-scene">
          <div class="scene-img-wrap">
            <img :src="active.bg" alt="" class="scene-img" />
          </div>
          <div class="scene-overlay">
            <!-- 祈福语（form 阶段，放在按钮上方） -->
            <p v-if="stage === 'form'" class="form-wish-hint">{{ active.wish }}</p>

            <!-- 礼佛动作（form 阶段） -->
            <div v-if="stage === 'form'" class="scene-rituals">
              <!-- 浮起 emoji 粒子 -->
              <TransitionGroup name="float-group">
                <span
                  v-for="f in floats"
                  :key="f.id"
                  class="float-emoji"
                  :style="{ left: f.left + '%' }"
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
                <span class="ritual-name">{{ r.name }}{{ doneRituals.has(r.name) ? ' ✓' : '' }}</span>
              </button>
            </div>

            <!-- 祝福语结果 -->
            <div v-if="stage === 'done'" class="scene-result">
              <p class="result-wish">{{ resultWish }}</p>
              <p class="result-user">—— {{ form.age }}岁的{{ form.name }}敬上{{ form.target ? `祝${form.target}` : '' }}</p>
              <div class="result-btns">
                <button v-if="nextBlessing" class="back-home-btn next-btn" @click="open(nextBlessing)">进入下一个祈福池</button>
                <button class="back-home-btn" @click="close(); router.push('/')">返回首页</button>
              </div>
            </div>

            <!-- 表单输入（form 阶段） -->
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
                  min="1" max="150"
                />
              </div>
              <input
                v-model="form.target"
                type="text"
                placeholder="为谁祈福？（可填，如：父亲健康）"
                class="field target-field"
                maxlength="50"
              />
              <button class="submit-btn" :disabled="loading" @click="submit">
                <span v-if="loading">祈福中…</span>
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
/* ── 祈福池网格 ── */
.blessing-section { animation: fadeInUp .7s .15s ease both; }

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
  background: rgba(252,246,230,0.82);
  border: 1px solid rgba(180,140,80,.18);
  border-radius: 12px;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.blessing-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(100,60,20,.14);
  border-color: var(--gold);
}

.blessing-icon {
  width: 88px;
  height: 118px;
  object-fit: cover;
  object-position: top center;
  border-radius: 14px;
  border: 2px solid rgba(212,168,67,0.25);
  box-shadow: 0 8px 18px rgba(96, 64, 24, 0.12);
}
.blessing-label { font-size: .82rem; color: var(--accent); opacity: 0.85; line-height: 1.2; }

/* ── 弹窗 ── */
.blessing-modal {
  position: fixed; inset: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20,8,0,.88);
  backdrop-filter: blur(6px);
}

.modal-scene {
  width: 88vw; max-width: 480px;
  max-height: 90vh;
  border-radius: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}

.scene-img-wrap {
  flex-shrink: 0;
  overflow: hidden;
  line-height: 0;
}
.scene-img {
  width: 100%;
  height: auto;
  display: block;
  margin-top: -48px;  /* 裁掉顶部空白，内容上移 */
}

.scene-overlay {
  padding: 18px 20px 24px;
  background: rgba(251, 243, 226, 1);
  border-top: 1px solid rgba(212, 168, 67, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.scene-rituals {
  position: relative;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── 浮起粒子 ── */
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
  0%   { opacity: 1;   transform: translateX(-50%) translateY(0)     scale(1); }
  50%  { opacity: 0.9; transform: translateX(-50%) translateY(-50px)  scale(1.3); }
  100% { opacity: 0;   transform: translateX(-50%) translateY(-110px) scale(0.7); }
}
/* TransitionGroup 淡出（粒子消失时不跳动） */
.float-group-leave-active { transition: opacity 0.2s; }
.float-group-leave-to     { opacity: 0; }
.ritual-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  border-radius: 22px;
  border: 2px solid rgba(127, 90, 54, 0.5);
  background: rgba(127, 90, 54, 0.08);
  color: var(--accent);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: .08em;
  transition: background .2s, transform .15s, border-color .2s;
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
  opacity: .55;
  background: rgba(212, 168, 67, 0.12);
}
.ritual-btn.pop {
  animation: ritualPop 0.38s ease;
}
@keyframes ritualPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.22) translateY(-4px); }
  70%  { transform: scale(0.96); }
  100% { transform: scale(1); }
}

.scene-result { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.result-wish { font-size: 1.1rem; color: var(--accent); line-height: 1.9; }
.result-user { font-size: .9rem; color: var(--text-muted); }
.back-home-btn {
  margin-top: 4px;
  padding: 10px 28px;
  border-radius: 22px;
  border: 2px solid rgba(127, 90, 54, 0.4);
  background: rgba(127, 90, 54, 0.08);
  color: var(--accent);
  font-size: .95rem;
  cursor: pointer;
  transition: background .2s, border-color .2s;
}
.back-home-btn:hover { background: rgba(212,168,67,.2); border-color: var(--gold); }
.result-btns { display: flex; flex-direction: column; gap: 10px; width: 100%; align-items: center; }
.next-btn { background: rgba(212,168,67,.25); border-color: #f0d080; }

.scene-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.form-wish-hint { font-size: .9rem; color: var(--accent); text-align: center; line-height: 1.7; font-style: italic; }

.form-row { display: grid; grid-template-columns: 1fr 90px; gap: 10px; }
.field {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(212,168,67,.4);
  background: rgba(255,252,245,.92);
  color: var(--text);
  font-family: inherit;
  font-size: .9rem;
  outline: none;
}
.field:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(212,168,67,.12); }
.age-field, .target-field { width: 100%; }
.target-field { grid-column: 1 / -1; }

.submit-btn {
  width: 100%; padding: 12px;
  border: none; border-radius: 12px;
  background: linear-gradient(135deg, #7f5a36, #a07040);
  color: #fff8ee;
  font-size: 1rem; letter-spacing: .08em;
  box-shadow: 0 4px 16px rgba(127,90,54,.3);
  transition: opacity .2s, transform .15s;
}
.submit-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
.submit-btn:disabled { opacity: .55; cursor: not-allowed; }

.modal-close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255,250,240,.15);
  border: 1px solid rgba(255,250,240,.3);
  color: #fff8ee; font-size: 1.1rem;
  cursor: pointer;
  transition: background .2s;
}
.modal-close:hover { background: rgba(255,250,240,.28); }

.modal-toast {
  position: absolute; bottom: 32px;
  left: 50%; transform: translateX(-50%);
  background: rgba(50,30,10,.88);
  color: #f0d080;
  padding: 10px 22px; border-radius: 24px;
  font-size: .9rem; letter-spacing: .05em;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,.3);
}
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .35s, transform .35s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }

@media (max-width: 600px) {
  .blessing-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .blessing-icon { width: 70px; height: 94px; }
}
</style>
