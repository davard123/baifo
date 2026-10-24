<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import FopushaDedication from '../vendor/dedication-v10/runtime.js'
import { createDedicationSound } from '../utils/dedicationSound.js'
import AltarLayer from './ritual/AltarLayer.vue'

const props = defineProps({
  buddha: Object,
  blessingId: { type: Number, default: 0 },
  ritual: { type: Object, required: true },
})

const emit = defineEmits(['blessing-end'])
const canvasElement = ref(null)
const imageElement = ref(null)
const sceneElement = ref(null)
const blessingActive = ref(false)
const effectError = ref(false)
const sound = createDedicationSound()
const soundMuted = ref(sound.muted)
function unlockSound() { sound.unlock() }
function toggleSound() {
  soundMuted.value = !soundMuted.value
  sound.setMuted(soundMuted.value)
  if (!soundMuted.value) sound.unlock()
}
defineExpose({ unlockSound })
const assetIds = { shakyamuni: 'a1', amitabha: 'a2', medicine: 'a3', maitreya: 'a4', manjushri: 'a5', samantabhadra: 'a6', guanyin: 'a7', ksitigarbha: 'a8' }
// 同一尊佛可以有几种造型（原图 + variants），每次进入页面随机选一张
function pickLook(buddha) {
  const looks = [{ image: buddha?.image, anchorShift: null }, ...(buddha?.variants || [])]
  return looks[Math.floor(Math.random() * looks.length)]
}
const look = ref(pickLook(props.buddha))
let player = null
let generation = 0
let watchdog = null
let motionQuery = null
function restoreScene() {
  if (sceneElement.value) sceneElement.value.style.transform = ''
}
function clearBlessing() {
  generation++
  clearTimeout(watchdog)
  watchdog = null
  player?.stop()
  sound.stop()
  blessingActive.value = false
  restoreScene()
}
function finishBlessing(token, error = false) {
  if (token !== generation) return
  clearBlessing()
  effectError.value = error
  emit('blessing-end')
}
function onMotionChange(event) {
  if (event.matches && blessingActive.value) finishBlessing(generation)
}
function ensurePlayer() {
  if (player) return player
  player = new FopushaDedication({
    canvas: canvasElement.value,
    originalImage: imageElement.value,
    id: assetIds[props.buddha.slug],
    assetBase: '/dedication-v10/',
    assetSources: {
      ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => ['a' + (i + 1), '/a' + (i + 1) + '-20260906.webp?v=release1'])),
      // 回向时特效会把佛像重画到画布上，必须用当前显示的这张造型
      [assetIds[props.buddha.slug]]: look.value.image,
    },
    anchorShift: look.value.anchorShift,
    // Canvas shakes itself once; mirror only its camera movement onto the DOM
    // background, altar and label. Reset before measuring the hidden image.
    onFrame: (time, camera) => {
      sound.onFrame(time)
      if (!sceneElement.value) return
      const dx = camera.dx * canvasElement.value.width / 960
      sceneElement.value.style.transform = camera.dx
        ? 'translateX(' + dx + 'px) scaleX(' + camera.overscan + ')'
        : ''
    },
  })
  player.ready.catch(() => {})
  return player
}
async function playBlessing() {
  clearBlessing()
  const token = generation
  effectError.value = false
  if (motionQuery?.matches) { emit('blessing-end'); return }
  blessingActive.value = true
  sound.begin()
  // Bound stalled asset loads / background tabs. The renderer owns the exact
  // 3-second playback; this is only a recovery timeout, never a loop.
  watchdog = setTimeout(() => finishBlessing(token, true), 10000)
  try {
    const result = await ensurePlayer().playAfterSuccess()
    if (token === generation && result.status === 'completed') finishBlessing(token)
  } catch {
    finishBlessing(token, true)
  }
}
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionQuery.addEventListener('change', onMotionChange)
  if (!motionQuery.matches) {
    try { ensurePlayer() } catch { /* static image remains usable */ }
  }
})
watch(() => props.buddha?.slug, () => {
  look.value = pickLook(props.buddha)
  clearBlessing()
  player?.destroy()
  player = null
  effectError.value = false
})
watch(() => props.blessingId, (id, previous) => {
  if (id && id !== previous) playBlessing()
})
onBeforeUnmount(() => {
  clearBlessing()
  player?.destroy()
  player = null
  motionQuery?.removeEventListener('change', onMotionChange)
  sound.destroy()
})

const stageScaleMap = {
  shakyamuni: { desktop: 0.94, mobile: 0.92 },
  amitabha: { desktop: 1.04, mobile: 1.01 },
  medicine: { desktop: 1.05, mobile: 1.02 },
  maitreya: { desktop: 0.88, mobile: 0.87 },
  manjushri: { desktop: 0.97, mobile: 0.95 },
  samantabhadra: { desktop: 1.06, mobile: 1.03 },
  guanyin: { desktop: 1.08, mobile: 1.05 },
  ksitigarbha: { desktop: 1.12, mobile: 1.08 },
}

// Intrinsic alpha-bound widths measured from the unchanged original artwork.
// On narrow screens fit the figure, rather than its wide transparent canvas.
const mobileFigureFit = { shakyamuni: 87.3, amitabha: 130.7, medicine: 141.5, maitreya: 75.3, manjushri: 132.7, samantabhadra: 157.7, guanyin: 151.5, ksitigarbha: 146.1 }
const stageImageStyle = computed(() => {
  const scale = stageScaleMap[props.buddha?.slug] || { desktop: 0.92, mobile: 0.9 }
  return {
    '--buddha-scale': String(scale.desktop),
    '--buddha-scale-mobile': String(scale.mobile),
    '--buddha-mobile-fit': `${mobileFigureFit[props.buddha?.slug] || 86}vw`,
  }
})
</script>

<template>
  <div class="stage" :class="{ 'blessing-active': blessingActive }">
    <div ref="sceneElement" class="stage-scene">
    <div class="stage-bg"></div>

    <div class="buddha-frame">
      <img ref="imageElement" :src="look.image" :alt="buddha.name" class="buddha-img" :style="stageImageStyle" />
    </div>

    <AltarLayer :ritual="ritual" mode="buddha" />

    <div class="stage-label" :class="{ faded: ritual.anyDone.value }">{{ buddha.title }}</div>
    </div>
    <canvas ref="canvasElement" class="dedication-canvas" aria-hidden="true"></canvas>
    <button type="button" class="sound-toggle" :aria-pressed="!soundMuted" :aria-label="soundMuted ? '开启回向音效' : '静音回向音效'" @click="toggleSound">
      {{ soundMuted ? '音效：关' : '音效：开' }}
    </button>
    <span class="sr-only" role="status">{{ effectError ? '回向成功，动画暂不可用' : blessingActive ? '回向成功' : '' }}</span>
  </div>
</template>

<style scoped>
.stage-scene { position: absolute; inset: 0; }
.stage-scene::before {
  content: '';
  position: absolute;
  inset: 0 -4px;
  background: inherit;
}
.dedication-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 9; pointer-events: none; }
.sound-toggle { position: absolute; top: 12px; left: 12px; z-index: 12; padding: 8px 12px; color: #f7dfaa; background: rgba(30, 15, 5, .82); border: 1px solid #98763b; border-radius: 8px; font: inherit; font-size: .8rem; }
.sound-toggle:focus-visible { outline: 2px solid #ffe29a; outline-offset: 3px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

.stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.stage, .stage-scene {
  background:
    radial-gradient(circle at 50% 18%, rgba(158, 90, 28, 0.32), transparent 26%),
    linear-gradient(180deg, #180700 0%, #341100 28%, #592107 62%, #7c3f10 100%);
}

.stage-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 26%, rgba(241, 193, 88, 0.16), transparent 34%),
    radial-gradient(circle at 50% 92%, rgba(251, 189, 96, 0.14), transparent 28%);
}

.buddha-frame {
  position: absolute;
  inset: 1.5% 0 22% 0;
  z-index: 2;
}

.buddha-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center top;
  transform: scale(var(--buddha-scale, 0.92));
  filter: drop-shadow(0 10px 18px rgba(66, 26, 2, 0.28));
}

.stage-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1.4%;
  text-align: center;
  color: rgba(235, 205, 120, 0.84);
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.7);
  z-index: 8;
  transition: opacity 0.8s ease;
}

/* 开始供养后佛名淡出，避免压住前排供品 */
.stage-label.faded {
  opacity: 0;
}

@media (max-width: 900px) {
  .buddha-img {
    position: absolute;
    width: auto;
    max-width: none;
    height: min(100%, var(--buddha-mobile-fit, 86vw));
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    object-position: center;
  }
}
</style>
