<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BLESSINGS } from '../data/blessings.js'
import { saveLocalRequest as apiFetch } from '../utils/localRecords.js'
import { getViewerProfile, saveViewerProfile } from '../utils/viewerProfile.js'
import { getBlessingSuggestions, getBlessingTarget, saveBlessingTarget } from '../utils/blessingDrafts.js'
import AltarLayer from './ritual/AltarLayer.vue'
import RitualPanel from './ritual/RitualPanel.vue'
import SanctuaryBackdrop from './ritual/SanctuaryBackdrop.vue'
import { useRitual } from '../composables/useRitual.js'

import RecordSaveChoice from './RecordSaveChoice.vue'
const storageChoice = ref('')
const resultPublished = ref(false)

const emit = defineEmits(['wish-submitted'])
const router = useRouter()

const active = ref(null)
const toast = ref('')
const stage = ref('select')
const loading = ref(false)
const resultWish = ref('')
const resultEmail = ref('')
const modalCloseButton = ref(null)
const previousOverflow = ref('')
const modalToggleButton = ref(null)
const drawerHeading = ref(null)
const modalOrigin = ref(null)
let requestController = null
let toastTimer = null

function cancelSubmission() {
  requestController?.abort()
  requestController = null
  loading.value = false
  clearTimeout(toastTimer)
  toast.value = ''
}

const form = ref({
  name: '',
  age: '',
  target: '',
  email: '',
})

// 供养按钮、供台动画与拜佛 / 祭祀页共用
const ritual = useRitual('blessing')
const drawerOpen = ref(false)

// Each blessing uses its own generated, transparent 2:3 guardian figure in
// both the selection card and the immersive sanctuary stage.
const blessingSubjects = {
  caishen: { src: '/sanctuary/blessing-caishen-20261019-v2.webp', alt: '财神' },
  jikang: { src: '/sanctuary/blessing-jikang-20261019-v2.webp', alt: '健康守护神' },
  pingan: { src: '/sanctuary/blessing-pingan-20261019-v2.webp', alt: '平安守护神' },
  xueye: { src: '/sanctuary/blessing-xueye-20261019-v2.webp', alt: '文昌帝君艺术像' },
  shou: { src: '/sanctuary/blessing-shou-20261019-v2.webp', alt: '寿星' },
  yinyuan: { src: '/sanctuary/blessing-yinyuan-20261019-v2.webp', alt: '月老' },
  siling: { src: '/sanctuary/blessing-siling-20261019-v2.webp', alt: '送子娘娘艺术像' },
  xiaozai: { src: '/sanctuary/blessing-xiaozai-20261019-v2.webp', alt: '消灾守护神' },
  gongming: { src: '/sanctuary/blessing-gongming-20261019-v2.webp', alt: '禄星' },
  fulu: { src: '/sanctuary/blessing-fulu-20261019-v2.webp', alt: '福神' },
  heping: { src: '/sanctuary/blessing-heping-20261019-v2.webp', alt: '和平守护神' },
  jiaqin: { src: '/sanctuary/blessing-jiaqin-20261019-v2.webp', alt: '家宅守护神' },
}

const activeSubject = computed(() => (active.value ? blessingSubjects[active.value.key] || null : null))
const targetSuggestions = computed(() => getBlessingSuggestions(active.value?.key))

function rememberTarget() {
  if (active.value) saveBlessingTarget(active.value.key, form.value.target)
}

function selectTarget(text) {
  form.value.target = text
  rememberTarget()
}

const nextBlessing = computed(() => {
  if (!active.value) return null
  const currentIndex = BLESSINGS.findIndex((item) => item.key === active.value.key)
  return currentIndex >= 0 ? BLESSINGS[(currentIndex + 1) % BLESSINGS.length] : BLESSINGS[0]
})

function hydrateProfile() {
  const viewer = getViewerProfile()
  form.value.name = viewer.username || ''
  form.value.age = viewer.age ? String(viewer.age) : ''
  form.value.target = active.value ? getBlessingTarget(active.value.key) : ''
  form.value.email = ''
}

function resetTransientState() {
  resultWish.value = ''
  resultEmail.value = ''
  stage.value = 'select'
  ritual.reset()
  drawerOpen.value = false
  loading.value = false
}

function open(blessing) {
  storageChoice.value = ''
  cancelSubmission()
  if (!active.value) modalOrigin.value = document.activeElement
  active.value = blessing
  stage.value = 'form'
  resultWish.value = ''
  ritual.reset()
  drawerOpen.value = false
  hydrateProfile()
}

function close() {
  cancelSubmission()
  const restoreTarget = modalOrigin.value
  active.value = null
  resetTransientState()
  hydrateProfile()
  modalOrigin.value = null
  nextTick(() => {
    if (restoreTarget && document.contains(restoreTarget) && typeof restoreTarget.focus === 'function') {
      restoreTarget.focus()
    }
  })
}

function clearToastSoon() {
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2500)
}

async function submit() {
  if (loading.value || stage.value !== 'form' || !active.value) return

  if (!form.value.name.trim()) {
    toast.value = '请填写祈福者姓名。'
    clearToastSoon()
    return
  }

  if (!Number(form.value.age) || Number(form.value.age) <= 0) {
    toast.value = '请填写正确的年龄。'
    clearToastSoon()
    return
  }

  if (storageChoice.value !== 'local' && storageChoice.value !== 'public') {
    toast.value = '请为本次记录选择保存方式。'
    clearToastSoon()
    return
  }
  loading.value = true
  const controller = new AbortController()
  requestController = controller
  const wish = active.value.wish
  const email = form.value.email.trim()

  try {
    saveViewerProfile(form.value.name.trim(), form.value.age)
    const response = await apiFetch('/wishes', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storageChoice: storageChoice.value,
        username: form.value.name.trim(),
        age: Number(form.value.age),
        wish: active.value.wish,
        buddha: '',
        blessing: active.value.label,
        target: form.value.target.trim(),
        ...(form.value.email.trim() ? { email: form.value.email.trim() } : {}),
      }),
    })
    const data = await response.json()
    if (controller.signal.aborted || requestController !== controller) return
    if (!response.ok || data.status !== 'success') throw new Error('Submission failed')
    resultWish.value = wish
    resultEmail.value = email
    stage.value = 'done'
    storageChoice.value = ''
    closeDrawer()
    toast.value = data.published ? '祈愿已公开到心愿墙，本机也保存了一份。回向完成。' : '祈愿已保存在本机，未上传。回向完成。'
    resultPublished.value = !!data.published
    clearToastSoon()
    emit('wish-submitted')
  } catch (error) {
    if (controller.signal.aborted || requestController !== controller) return
    toast.value = error.message || '本机保存失败，请稍后重试。'
    clearToastSoon()
  } finally {
    if (requestController === controller) {
      requestController = null
      loading.value = false
    }
  }
}

function lockBodyScroll() {
  previousOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  document.body.style.overflow = previousOverflow.value
}

function handleModalKeydown(event) {
  if (!active.value || event.key !== 'Escape') return
  if (drawerOpen.value) {
    closeDrawer()
    return
  }
  close()
}

function closeDrawer() {
  if (!drawerOpen.value) return
  drawerOpen.value = false
  nextTick(() => modalToggleButton.value?.focus())
}

watch(() => ritual.state.bowRun, (value, previous) => {
  if (value > previous) closeDrawer()
})

watch(active, async (value, previous) => {
  if (value) {
    if (!previous) lockBodyScroll()
    await nextTick()
    modalCloseButton.value?.focus()
    return
  }
  unlockBodyScroll()
})

watch(drawerOpen, async (value) => {
  if (!value) return
  await nextTick()
  drawerHeading.value?.focus()
})

onMounted(() => {
  hydrateProfile()
  window.addEventListener('keydown', handleModalKeydown)
})

onBeforeUnmount(() => {
  cancelSubmission()
  window.removeEventListener('keydown', handleModalKeydown)
  unlockBodyScroll()
})
</script>

<template>
  <section class="blessing-section card" aria-labelledby="blessing-pool-title">
    <div class="section-head">
      <p class="section-kicker">祈愿场景</p>
      <h2 id="blessing-pool-title" class="section-title">祈福池</h2>
      <p class="section-sub">选择一项心愿，按页面提示写下祝愿。祈愿不能代替实际行动或专业帮助。</p>
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
      <div
        v-if="active"
        class="blessing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blessing-dialog-title"
      >
        <div class="bm-top">
          <button ref="modalCloseButton" class="bm-back" type="button" @click="close">← 返回祈福池</button>
          <p id="blessing-dialog-title" class="bm-top-title">{{ active.label }} · 祈福</p>
        </div>

        <div class="bm-body" :class="{ 'drawer-open': drawerOpen }">
          <div class="bm-stage">
            <SanctuaryBackdrop variant="blessing" />
            <div class="bm-subject-wrap">
              <img v-if="activeSubject?.src" :src="activeSubject.src" :alt="activeSubject.alt" class="bm-subject" decoding="async" />
            </div>
            <div class="bm-altar" aria-hidden="true">
              <img class="bm-altar__img" src="/sanctuary/altar-20261019.webp" alt="" decoding="async" />
            </div>
            <AltarLayer :ritual="ritual" mode="blessing" />
          </div>

          <button
            ref="modalToggleButton"
            type="button"
            class="bm-toggle"
            :class="{ open: drawerOpen }"
            aria-controls="blessing-drawer"
            :aria-expanded="drawerOpen"
            @click="drawerOpen = !drawerOpen"
          >
            {{ drawerOpen ? '收起' : stage === 'done' ? '查看回向' : '祈福供养' }}
          </button>

          <button
            v-if="drawerOpen"
            type="button"
            class="bm-backdrop"
            aria-label="收起祈福面板"
            @click="closeDrawer"
          ></button>

          <section
            id="blessing-drawer"
            class="bm-drawer"
            :class="{ open: drawerOpen }"
            :inert="!drawerOpen"
          >
            <div class="bm-drawer-content">
            <button type="button" class="bm-drawer-close" @click="closeDrawer">收起祈福面板</button>
            <p class="overlay-kicker">祈福主题</p>
            <h3 ref="drawerHeading" class="overlay-title" tabindex="-1">{{ active.label }}</h3>

            <template v-if="stage === 'form'">
              <RitualPanel :ritual="ritual" homage-title="礼敬" />
              <hr class="bm-divider" />
            </template>

            <div v-if="stage === 'done'" class="scene-result">
              <p class="result-user">
                {{ form.age }} 岁的 {{ form.name }} {{ resultPublished ? '已将这份祈愿公开到心愿墙。' : '已将这份祈愿保存在本机，未上传。' }}
              </p>
              <p v-if="form.target" class="result-user">{{ form.target }}</p>
              <div class="result-btns">
                <button class="back-home-btn" type="button" @click="close(); router.push('/')">
                  返回首页
                </button>
                <button
                  v-if="nextBlessing"
                  class="back-home-btn next-btn"
                  type="button"
                  @click="open(nextBlessing)"
                >
                  进入下一页
                </button>
                <button class="back-home-btn" type="button" @click="close(); router.push('/buddha/shakyamuni/')">
                  进入拜佛
                </button>
              </div>
            </div>

            <form v-if="stage === 'form'" id="blessing-form" class="scene-form" @submit.prevent="submit">
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
                  @input="rememberTarget"
                  type="text"
                  class="field target-field"
                  maxlength="50"
                  aria-describedby="blessing-target-help"
                  placeholder="可修改推荐词，或写下自己的祝愿"
                />
                <p id="blessing-target-help" class="target-help">可直接修改；本主题上次填写的内容仅在本机保留。</p>
                <div class="target-suggestions" role="group" aria-label="推荐祈福词">
                  <button
                    v-for="suggestion in targetSuggestions"
                    :key="suggestion"
                    type="button"
                    class="target-suggestion"
                    :aria-pressed="form.target === suggestion"
                    @click="selectTarget(suggestion)"
                  >{{ suggestion }}</button>
                </div>
              </div>

              <RecordSaveChoice v-model="storageChoice" :disabled="loading" />
            </form>
            <p class="form-wish-hint">{{ stage === 'form' ? active.wish : resultWish }}</p>
            </div>
            <div v-if="stage === 'form'" class="bm-completion">
              <button class="submit-btn" type="submit" form="blessing-form" :disabled="loading">
                <span v-if="loading">{{ storageChoice === 'public' ? '正在公开…' : '正在保存…' }}</span>
                <span v-else>{{ storageChoice === 'public' ? '公开到心愿墙 · 回向' : '仅保存到本机 · 回向' }}</span>
              </button>
            </div>
          </section>
        </div>

        <transition name="toast-fade">
          <div v-if="toast" class="modal-toast" aria-live="polite">{{ toast }}</div>
        </transition>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.target-help {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.6;
}

.target-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.target-suggestion {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid rgba(235, 188, 97, 0.35);
  border-radius: 8px;
  background: #38220f;
  color: #f7d796;
  font: inherit;
  font-size: 0.85rem;
  line-height: 1.6;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.target-suggestion[aria-pressed="true"] {
  border-color: #efc46d;
  background: #624119;
}

.target-suggestion:focus-visible {
  outline: 3px solid #efc46d;
  outline-offset: 2px;
}

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
    linear-gradient(180deg, rgba(33, 22, 44, 0.92), rgba(21, 15, 31, 0.96));
  border: 1px solid rgba(242, 200, 121, 0.14);
  border-radius: 16px;
  cursor: pointer;
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 240, 214, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.blessing-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.36);
  border-color: var(--gold);
  background:
    linear-gradient(180deg, rgba(45, 30, 59, 0.96), rgba(28, 20, 40, 0.98));
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
  height: 138px;
  aspect-ratio: 2 / 3;
  object-fit: contain;
  object-position: center bottom;
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

/* ── 祈福：全屏舞台 + 右侧弹出面板（与拜佛页一致） ── */
.blessing-modal {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  background: #160a04;
  color: #f7e6c5;
}

.bm-top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  background: linear-gradient(180deg, rgba(43, 20, 8, 0.98), rgba(28, 12, 4, 0.96));
  border-bottom: 1px solid rgba(240, 194, 109, 0.24);
}

.bm-back {
  min-height: 40px;
  padding: 6px 14px;
  border: 1px solid rgba(212, 168, 67, 0.35);
  border-radius: 10px;
  background: rgba(95, 49, 15, 0.28);
  color: #f2ce86;
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
}

.bm-top-title {
  margin: 0;
  color: #f2ce86;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.bm-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
}

.bm-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: size;
  isolation: isolate;
  background: #2b1207;
}

.bm-altar {
  position: absolute;
  left: 50%;
  bottom: calc(8cqh - 19.67cqw);
  width: 100%;
  aspect-ratio: 3 / 1;
  transform: translateX(-50%);
  z-index: 3;
  pointer-events: none;
}

.bm-altar__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 14px 20px rgba(24, 6, 1, 0.5));
}

.bm-subject-wrap {
  position: absolute;
  inset: 3% 0 14%;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-inline: 4%;
  pointer-events: none;
  transition: padding 0.3s ease;
}

/* Keep AltarLayer's semantic objects on the real table surface while
   worshippers remain grounded at the stage bottom. The altar art is 3:1,
   so its 60%-from-bottom table-top anchor scales with the viewport width. */
.bm-stage :deep(.altar-layer .altar) {
  bottom: 8%;
}

.bm-stage :deep(.altar-layer .vase),
.bm-stage :deep(.altar-layer .candle),
.bm-stage :deep(.altar-layer .burner) {
  --b: calc(var(--u) * 6);
}

.bm-subject {
  display: block;
  width: auto;
  height: 100%;
  max-width: 94cqw;
  max-height: 100%;
  aspect-ratio: 2 / 3;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 16px 24px rgba(36, 12, 2, 0.6));
}

@media (min-width: 700px) {
  .bm-body.drawer-open .bm-subject-wrap {
    padding-right: min(32vw, 400px);
  }
}

.bm-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 25;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  padding: 18px 10px;
  border: 1px solid rgba(212, 168, 67, 0.36);
  border-right: none;
  border-radius: 16px 0 0 16px;
  background: rgba(59, 29, 9, 0.96);
  color: #f2ce86;
  font: inherit;
  font-size: 0.86rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: right 0.28s ease;
}

.bm-toggle.open {
  right: min(400px, 88vw);
}

.bm-backdrop {
  position: absolute;
  inset: 0;
  z-index: 18;
  border: none;
  background: rgba(15, 5, 1, 0.48);
}

.bm-drawer {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  width: min(400px, 88vw);
  overflow: hidden;
  padding: 20px 20px 32px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
  background: rgba(37, 18, 8, 0.98);
  border-left: 1px solid rgba(235, 188, 97, 0.24);
  box-shadow: -10px 0 28px rgba(24, 9, 2, 0.22);
  transform: translateX(100%);
  visibility: hidden;
  transition: transform 0.28s ease;
}

.bm-drawer-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.bm-completion {
  flex-shrink: 0;
  padding-top: 10px;
  background: var(--surface);
}

.bm-drawer-close {
  position: sticky;
  top: 0;
  z-index: 3;
  align-self: flex-start;
  min-height: 44px;
  margin: 0 0 14px;
  padding: 8px 14px;
  border: 1px solid rgba(235, 188, 97, 0.42);
  border-radius: 10px;
  background: #5f310f;
  color: #f7d796;
  font: inherit;
  cursor: pointer;
}

.bm-drawer-close:focus-visible,
.bm-toggle:focus-visible {
  outline: 3px solid rgba(246, 205, 125, 0.68);
  outline-offset: 3px;
}

.bm-drawer.open {
  transform: translateX(0);
  visibility: visible;
}

.bm-divider {
  border: none;
  border-top: 1px solid rgba(212, 168, 67, 0.2);
  margin: 16px 0;
}

.overlay-kicker {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
}

.overlay-title {
  margin: 4px 0 6px;
  color: var(--accent);
  font-size: 1.6rem;
  letter-spacing: 0.1em;
}

.form-wish-hint {
  margin: 0 0 14px;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

.modal-toast {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 64px);
  left: 50%;
  z-index: 3100;
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  padding: 10px 22px;
  border-radius: 999px;
  background: rgba(40, 24, 8, 0.92);
  color: #f0d080;
  font-size: 0.95rem;
  text-align: center;
  pointer-events: none;
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

@media (max-width: 768px) {
  .bm-toggle {
    top: 16%;
    bottom: auto;
    transform: translateY(-50%);
  }

  .bm-drawer {
    width: min(420px, 100vw);
    padding: 14px 16px 18px;
  }

  .bm-toggle.open {
    right: min(420px, 100vw);
  }

  .overlay-title {
    font-size: 1.3rem;
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
  background: rgba(24, 16, 33, 0.94);
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
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  color: #2a1c0c;
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

.result-email {
  margin: -4px 0 0;
  color: var(--accent-light);
  font-size: 0.84rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.result-btns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.back-home-btn {
  width: 100%;
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

@media (max-width: 760px) {
  .blessing-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .blessing-icon {
    width: 74px;
    height: 111px;
  }

  .form-row {
    grid-template-columns: minmax(0, 1fr) 96px;
  }
}

@media (max-width: 520px) {
  .result-btns {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .blessing-section,
  .blessing-item,
  .submit-btn,
  .back-home-btn,
  .bm-drawer,
  .bm-toggle {
    animation: none !important;
    transition: none !important;
  }
}
</style>
