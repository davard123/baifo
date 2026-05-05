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
  } catch {}
  loading.value = false
  resultWish.value = active.value.wish
  stage.value = 'done'
  emit('wish-submitted')
}

const RITUALS = ['上香', '点灯', '磕头']
const doneRituals = ref(new Set())
function doRitual(r) {
  if (doneRituals.value.has(r)) return
  doneRituals.value = new Set([...doneRituals.value, r])
  toast.value = r === '上香' ? '心香一瓣，供养十方。' :
               r === '点灯' ? '慧灯常明，照破无明。' :
               '三叩首，礼敬祈福。'
  setTimeout(() => toast.value = '', 2500)
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
        <div
          class="blessing-icon"
          :style="{ backgroundImage: `url(${b.bg})` }"
        ></div>
        <span class="blessing-label">{{ b.label }}</span>
      </button>
    </div>

    <!-- 祈福弹窗 -->
    <Teleport to="body">
      <div v-if="active" class="blessing-modal" @click.self="close">
        <!-- 背景场景 -->
        <div class="modal-scene">
          <img :src="active.bg" alt="" class="scene-img" />
          <div class="scene-overlay">
            <!-- 祈福语（form 阶段，放在按钮上方） -->
            <p v-if="stage === 'form'" class="form-wish-hint">{{ active.wish }}</p>

            <!-- 礼佛动作（form 阶段） -->
            <div v-if="stage === 'form'" class="scene-rituals">
              <button
                v-for="r in RITUALS"
                :key="r"
                class="ritual-btn"
                :class="{ done: doneRituals.has(r) }"
                :disabled="doneRituals.has(r)"
                @click="doRitual(r)"
              >
                {{ r }}{{ doneRituals.has(r) ? ' ✓' : '' }}
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
  gap: 8px;
  padding: 14px 8px;
  background: rgba(255,250,240,.7);
  border: 1px solid rgba(212,168,67,.18);
  border-radius: 12px;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.blessing-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(68,43,17,.14);
  border-color: var(--gold);
}

.blessing-icon {
  width: 64px; height: 64px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
}
.blessing-label { font-size: .88rem; color: var(--accent); }

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
  width: 90vw; max-width: 560px;
  max-height: 90vh;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}

.scene-img {
  width: 100%;
  height: 50vh;
  object-fit: cover;
  object-position: top center;
  display: block;
  flex-shrink: 0;
}

.scene-overlay {
  padding: 18px 20px 20px;
  background: rgba(251, 243, 226, 1);
  border-top: 1px solid rgba(212, 168, 67, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.scene-rituals {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
}
.ritual-btn {
  padding: 10px 22px;
  border-radius: 22px;
  border: 2px solid rgba(127, 90, 54, 0.5);
  background: rgba(127, 90, 54, 0.08);
  color: var(--accent);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: .08em;
  transition: background .2s, transform .15s, border-color .2s;
}
.ritual-btn:hover:not(:disabled) {
  background: rgba(212, 168, 67, 0.2);
  border-color: var(--gold);
  transform: translateY(-2px);
}
.ritual-btn.done { opacity: .5; background: rgba(212, 168, 67, 0.12); }

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
  .blessing-icon { width: 52px; height: 52px; }
}
</style>
