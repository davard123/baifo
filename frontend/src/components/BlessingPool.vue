<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BLESSINGS } from '../data/blessings.js'
import { apiFetch } from '../api.js'
import { getViewerProfile, saveViewerProfile } from '../utils/viewerProfile.js'
import AltarLayer from './ritual/AltarLayer.vue'
import RitualPanel from './ritual/RitualPanel.vue'
import SanctuaryBackdrop from './ritual/SanctuaryBackdrop.vue'
import { useRitual } from '../composables/useRitual.js'

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

const form = ref({
  name: '',
  age: '',
  target: '',
  email: '',
})

// 供养按钮、供台动画与拜佛 / 祭祀页共用
const ritual = useRitual('blessing')
const drawerOpen = ref(false)

// The old blessing posters are opaque editorial cards. Keep each scene's
// meaning, but stage a transparent devotional figure or a small symbolic
// emblem instead of stretching that card across the sanctuary.
const blessingSubjects = {
  caishen: { src: '/qiucai/zhaogongming.webp', alt: '赵公明财神' },
  jikang: { src: '/a3-20260906.webp?v=release1', alt: '药师佛' },
  pingan: { src: '/a7-20260906.webp?v=release1', alt: '观音菩萨' },
  xueye: { src: '/a5-20260906.webp?v=release1', alt: '文殊菩萨' },
  shou: { src: '/qiucai/shouxing.webp', alt: '寿星' },
  yinyuan: { src: '/sanctuary/mandarin-ducks-20261019.webp', alt: '金色鸳鸯合璧雕塑' },
  siling: { src: '/a4-20260906.webp?v=release1', alt: '弥勒佛' },
  xiaozai: { src: '/a7-20260906.webp?v=release1', alt: '观音菩萨' },
  gongming: { src: '/qiucai/wencaishen.webp', alt: '文财神' },
  fulu: {
    alt: '福星与禄星',
    srcs: [
      { src: '/qiucai/fuxing.webp', alt: '福星' },
      { src: '/qiucai/luxing.webp', alt: '禄星' },
    ],
  },
  heping: { src: '/sanctuary/harmony-tree-20261019.webp', alt: '和平长青树与白鸽雕塑' },
  jiaqin: { src: '/sanctuary/harmony-tree-20261019.webp', alt: '家宅团圆长青树雕塑' },
}

const activeSubject = computed(() => (active.value ? blessingSubjects[active.value.key] || null : null))

const nextBlessing = computed(() => {
  if (!active.value) return null
  const currentIndex = BLESSINGS.findIndex((item) => item.key === active.value.key)
  return currentIndex >= 0 ? BLESSINGS[(currentIndex + 1) % BLESSINGS.length] : BLESSINGS[0]
})

function hydrateProfile() {
  const viewer = getViewerProfile()
  form.value.name = viewer.username || ''
  form.value.age = viewer.age ? String(viewer.age) : ''
  form.value.target = ''
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
  if (blessing.key === 'caishen') {
    router.push('/qiucai/')
    return
  }
  if (!active.value) modalOrigin.value = document.activeElement
  active.value = blessing
  stage.value = 'form'
  resultWish.value = ''
  ritual.reset()
  drawerOpen.value = false
  hydrateProfile()
}

function close() {
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

  if (!Number(form.value.age) || Number(form.value.age) <= 0) {
    toast.value = '请填写正确的年龄。'
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
        age: Number(form.value.age),
        wish: active.value.wish,
        buddha: '',
        blessing: active.value.label,
        target: form.value.target.trim(),
        ...(form.value.email.trim() ? { email: form.value.email.trim() } : {}),
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
  resultEmail.value = form.value.email.trim()
  stage.value = 'done'
  drawerOpen.value = true
  emit('wish-submitted')
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

watch(active, async (value) => {
  if (value) {
    lockBodyScroll()
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
            <div class="bm-subject-wrap" :class="`bm-subject-wrap--${active.key}`">
              <template v-if="activeSubject?.srcs">
                <div class="bm-subject-pair" role="img" :aria-label="activeSubject.alt">
                  <img
                    v-for="figure in activeSubject.srcs"
                    :key="figure.src"
                    :src="figure.src"
                    :alt="figure.alt"
                    class="bm-subject-pair__img"
                    decoding="async"
                  />
                </div>
              </template>
              <img v-else-if="activeSubject?.src" :src="activeSubject.src" :alt="activeSubject.alt" class="bm-subject" decoding="async" />
              <div
                v-else-if="activeSubject?.symbol"
                class="bm-subject bm-subject--symbol"
                role="img"
                :aria-label="activeSubject.label"
              >
                <span>{{ activeSubject.symbol }}</span>
                <small>{{ activeSubject.label }}</small>
              </div>
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
            {{ drawerOpen ? '收起' : '祈福供养' }}
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
            <button type="button" class="bm-drawer-close" @click="closeDrawer">收起祈福面板</button>
            <p class="overlay-kicker">祈福主题</p>
            <h3 ref="drawerHeading" class="overlay-title" tabindex="-1">{{ active.label }}</h3>
            <p class="form-wish-hint">
              <template v-if="stage === 'form'">{{ active.wish }}</template>
              <template v-else>{{ resultWish }}</template>
            </p>

            <template v-if="stage === 'form'">
              <RitualPanel :ritual="ritual" homage-title="礼敬" />
              <hr class="bm-divider" />
            </template>

            <div v-if="stage === 'done'" class="scene-result">
              <p class="result-user">
                {{ form.age }} 岁的 {{ form.name }} {{ form.target ? `，为 ${form.target}` : '' }} 留下了这份祈愿。
              </p>
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
  width: min(94cqw, 760px);
  height: 100%;
  max-width: 94cqw;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 16px 24px rgba(36, 12, 2, 0.6));
}

/* The original alpha Buddha canvases are deliberately wide: their visible
   figure occupies the centre band. Use the PrayerStage fit measurements so
   mobile keeps the figure legible without letting the transparent canvas
   dictate the layout width. */
.bm-subject-wrap--jikang .bm-subject { width: auto; max-width: none; height: min(100%, 141.5cqw); }
.bm-subject-wrap--pingan .bm-subject { width: auto; max-width: none; height: min(100%, 151.5cqw); }
.bm-subject-wrap--xueye .bm-subject { width: auto; max-width: none; height: min(100%, 132.7cqw); }
.bm-subject-wrap--siling .bm-subject { width: auto; max-width: none; height: min(100%, 75.3cqw); }

/* Symbolic wide canvases are sized by width on phones; otherwise their
   transparent margins make the subject overflow and crop at both edges. */
.bm-subject-wrap--yinyuan .bm-subject {
  width: auto;
  max-width: 90cqw;
  height: auto;
  max-height: 60cqh;
}

@media (orientation: portrait) {
  .bm-subject-wrap--yinyuan { bottom: 29%; }
}

.bm-subject-wrap--heping .bm-subject,
.bm-subject-wrap--jiaqin .bm-subject {
  width: auto;
  max-width: 85cqw;
  height: auto;
  max-height: 68cqh;
}

.bm-subject-pair {
  width: min(92cqw, 660px);
  height: auto;
  max-height: 72cqh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: min(2cqw, 16px);
}

.bm-subject-pair__img {
  width: calc(50% - 1cqw);
  height: auto;
  max-width: calc(50% - 1cqw);
  max-height: 72cqh;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 16px 24px rgba(36, 12, 2, 0.6));
}

.bm-subject-wrap--fulu .bm-subject-pair {
  width: min(94cqw, 660px);
}

.bm-subject--symbol {
  width: min(44cqw, 330px);
  height: min(44cqw, 330px);
  max-width: 72%;
  max-height: 84%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px solid rgba(245, 205, 127, 0.48);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 40%, rgba(255, 215, 132, 0.28), transparent 56%),
    rgba(66, 29, 8, 0.64);
  box-shadow:
    0 0 60px rgba(228, 160, 55, 0.2),
    inset 0 0 0 10px rgba(107, 55, 15, 0.38),
    0 20px 30px rgba(24, 7, 1, 0.45);
  color: #f3c875;
}

.bm-subject--symbol span {
  font-family: 'Noto Serif SC', 'Source Han Serif CN', STSong, SimSun, serif;
  font-size: clamp(4rem, 14cqw, 8rem);
  line-height: 1;
  text-shadow: 0 5px 18px rgba(0, 0, 0, 0.45);
}

.bm-subject--symbol small {
  font-size: clamp(0.76rem, 1.7cqw, 1rem);
  letter-spacing: 0.18em;
  color: rgba(255, 231, 175, 0.82);
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
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  width: min(400px, 88vw);
  overflow-y: auto;
  padding: 20px 20px 32px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
  background: rgba(37, 18, 8, 0.98);
  border-left: 1px solid rgba(235, 188, 97, 0.24);
  box-shadow: -10px 0 28px rgba(24, 9, 2, 0.22);
  transform: translateX(100%);
  visibility: hidden;
  transition: transform 0.28s ease;
}

.bm-drawer-close {
  align-self: flex-start;
  min-height: 44px;
  margin: 0 0 14px;
  padding: 8px 14px;
  border: 1px solid rgba(235, 188, 97, 0.42);
  border-radius: 10px;
  background: rgba(95, 49, 15, 0.3);
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
    top: auto;
    bottom: 18px;
    transform: none;
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
    height: 100px;
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
    transform: none !important;
  }
}
</style>
