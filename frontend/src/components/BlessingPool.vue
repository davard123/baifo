<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BLESSINGS } from '../data/blessings.js'
import { apiFetch } from '../api.js'

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
  form.value.name = localStorage.getItem('bless_name') || ''
  form.value.age  = localStorage.getItem('bless_age')  || ''
})

function open(b) {
  active.value = b
  stage.value  = 'form'
  resultWish.value = ''
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
  localStorage.setItem('bless_name', form.value.name.trim())
  localStorage.setItem('bless_age',  form.value.age)
  try {
    await apiFetch('/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.value.name.trim(),
        age: Number(form.value.age) || null,
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
  setTimeout(() => { close(); router.push('/') }, 2500)
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
        <div class="modal-scene" :style="{ backgroundImage: `url(${active.bg})` }">
          <div class="scene-overlay">
            <!-- 礼佛动作（仅 form 阶段显示） -->
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
              <p class="result-user">—— {{ form.name }} 敬上</p>
              <button class="back-home-btn" @click="close(); router.push('/')">返回首页</button>
            </div>

            <!-- 表单（form 阶段） -->
            <div v-if="stage === 'form'" class="scene-form">
              <p class="form-wish-hint">{{ active.wish }}</p>
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
  aspect-ratio: 3/4;
  max-height: 90vh;
  border-radius: 16px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}

.scene-overlay {
  padding: 24px 20px;
  background: linear-gradient(to top, rgba(0,0,0,.72) 0%, transparent 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.scene-rituals {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
}
.ritual-btn {
  padding: 10px 22px;
  border-radius: 22px;
  border: 2px solid #fff8ee;
  background: rgba(0,0,0,.55);
  color: #fff8ee;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: .08em;
  text-shadow: 0 1px 4px rgba(0,0,0,.7);
  backdrop-filter: blur(4px);
  transition: background .2s, transform .15s;
}
.ritual-btn:hover:not(:disabled) {
  background: rgba(212,168,67,.7);
  border-color: #f0d080;
  transform: translateY(-2px);
}
.ritual-btn.done { opacity: .5; background: rgba(100,80,30,.5); }

.scene-result { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.result-wish { font-size: 1.1rem; color: #fff8ee; line-height: 1.9; text-shadow: 0 2px 6px rgba(0,0,0,.8); }
.result-user { font-size: .9rem; color: rgba(255,248,238,.7); }
.back-home-btn {
  margin-top: 8px;
  padding: 10px 28px;
  border-radius: 22px;
  border: 2px solid #fff8ee;
  background: rgba(0,0,0,.5);
  color: #fff8ee;
  font-size: .95rem;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background .2s;
}
.back-home-btn:hover { background: rgba(212,168,67,.5); }

.scene-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.form-wish-hint { font-size: .9rem; color: #fff8ee; text-align: center; text-shadow: 0 1px 4px rgba(0,0,0,.7); line-height: 1.7; }

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