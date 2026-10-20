<script setup>
import { computed } from 'vue'
import AltarLayer from './ritual/AltarLayer.vue'
import SanctuaryBackdrop from './ritual/SanctuaryBackdrop.vue'
import { buildInscription, hasInscription } from '../utils/memorialInscription.js'

const props = defineProps({
  ancestor: { type: Object, required: true },
  customPhoto: { type: String, default: null },
  customName: { type: String, default: null },
  ritual: { type: Object, required: true },
})
const emit = defineEmits(['edit-name'])

// Keep an old full inscription exactly as entered. Only the new template mode
// uses buildInscription; this prevents a legacy value from receiving a second
// relationship prefix.
const tabletName = computed(() => {
  const savedInscription = String(props.customName || '').trim()
  return savedInscription || buildInscription(
    props.ancestor?.slug,
    '',
    props.ancestor?.title || props.ancestor?.name || '先祖之位',
  )
})

const tabletLabel = computed(() => `牌位：${tabletName.value}`)
const tabletNameLength = computed(() => Array.from(tabletName.value).length)
const hasCustomInscription = computed(() => hasInscription(props.customName))
const tabletTextStyle = computed(() => ({
  '--tablet-font-scale': tabletNameLength.value >= 20
    ? '0.52'
    : tabletNameLength.value >= 14
      ? '0.68'
      : tabletNameLength.value >= 9
        ? '0.84'
        : '1',
  // The panel has roughly 48% of the tablet height available for vertical
  // glyphs. This second bound keeps long, explicitly entered full text inside
  // the carved panel instead of clipping at the bottom.
  '--tablet-fit-ratio': (45 / Math.max(1, tabletNameLength.value)).toFixed(2),
}))
</script>

<template>
  <div class="stage" :class="{ 'has-custom-photo': !!customPhoto }">
    <SanctuaryBackdrop variant="ancestor" />
    <div class="stage-vignette" aria-hidden="true"></div>

    <div class="stage-scene">
      <div class="tablet-spotlight" aria-hidden="true"></div>

      <button
        type="button"
        class="stage-name-editor"
        :aria-label="hasCustomInscription ? '修改牌位姓名' : '填写先人姓名'"
        @click="emit('edit-name')"
      >
        <span aria-hidden="true">✎</span>
        {{ hasCustomInscription ? '修改牌位姓名' : '填写先人姓名' }}
      </button>

      <article class="ancestor-tablet" :aria-label="tabletLabel">
        <img
          class="tablet-art"
          src="/sanctuary/tablet-20261019.webp"
          alt=""
          aria-hidden="true"
        />
        <div
          class="tablet-panel-content"
          :class="{ 'has-photo': !!customPhoto }"
          :style="tabletTextStyle"
        >
          <div v-if="customPhoto" class="tablet-photo-frame">
            <img :src="customPhoto" :alt="`${tabletName}的纪念照片`" class="tablet-photo" />
          </div>
          <div class="tablet-inscription" :class="{ 'tablet-inscription--photo': !!customPhoto }">
            {{ tabletName }}
          </div>
        </div>
      </article>

      <img
        class="altar-art"
        src="/sanctuary/altar-20261019.webp"
        alt=""
        aria-hidden="true"
      />

      <div class="stage-caption" :class="{ faded: ritual.anyDone.value }">
        <span>{{ ancestor.name }}</span>
        <span class="caption-divider" aria-hidden="true">·</span>
        <span>{{ ancestor.subtitle }}</span>
      </div>
    </div>

    <AltarLayer :ritual="ritual" mode="ancestor" />
  </div>
</template>

<style scoped>
.stage {
  --gold: #e5bd6a;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  overflow: hidden;
  isolation: isolate;
  container-type: size;
  background: #160804;
}

.stage-vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 38%, transparent 0 35%, rgba(17, 5, 1, 0.18) 72%, rgba(8, 2, 0, 0.58) 100%),
    linear-gradient(180deg, rgba(12, 3, 0, 0.15), transparent 34%, rgba(16, 4, 0, 0.28));
}

.stage-scene {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.stage-name-editor {
  position: absolute;
  top: 5%;
  right: clamp(14px, 3.5cqw, 38px);
  z-index: 8;
  pointer-events: auto;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid rgba(246, 207, 121, 0.52);
  border-radius: 999px;
  background: rgba(35, 12, 3, 0.76);
  color: #f6d58e;
  font: inherit;
  font-size: clamp(0.78rem, 1.45cqw, 0.95rem);
  letter-spacing: 0.08em;
  text-shadow: 0 1px 4px rgba(15, 2, 0, 0.86);
  box-shadow: 0 8px 22px rgba(11, 2, 0, 0.28);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}

.stage-name-editor:hover {
  border-color: rgba(255, 224, 155, 0.86);
  background: rgba(83, 35, 8, 0.86);
  transform: translateY(-1px);
}

.stage-name-editor:focus-visible {
  outline: 2px solid #ffe09b;
  outline-offset: 3px;
}

.tablet-spotlight {
  position: absolute;
  left: 50%;
  top: 2%;
  width: min(72cqw, 760px);
  height: 82%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, rgba(255, 205, 115, 0.2), rgba(181, 95, 26, 0.08) 46%, transparent 72%);
  filter: blur(2px);
}

/* The transparent canvas carries the carved wood depth. The live inscription
   is pinned to the artwork's measured inner panel (x 36.5–63.5%, y 19–71%). */
.ancestor-tablet {
  position: absolute;
  left: 50%;
  top: 3%;
  height: min(73cqh, 150cqw);
  aspect-ratio: 2 / 3;
  /* Let plaque text size itself against the actual width-limited tablet on
     narrow screens, rather than against the taller stage viewport. */
  container-type: size;
  transform: translateX(-50%);
  z-index: 2;
  filter: drop-shadow(0 18px 21px rgba(16, 3, 0, 0.52));
}

.tablet-art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* The source's tabletop occupies 29–41% of a 3:1 canvas. Keep its front
   edge at 92% stage height independently of the viewport aspect ratio. */
.altar-art {
  position: absolute;
  left: 0;
  bottom: calc(8cqh - 19.67cqw);
  z-index: 3;
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
}

:deep(.altar-layer .altar) { bottom: 8%; }
:deep(.altar-layer .vase),
:deep(.altar-layer .candle),
:deep(.altar-layer .burner) { --b: calc(var(--u) * 6); }

/* The ancestor altar image has a real tabletop front edge. The shared altar
   defaults keep wine and the paper basin deliberately small, which leaves
   them behind that edge on a phone. Scale the two ancestor-only actions to a
   clearly readable physical size and keep their bases on the tabletop. */
:deep(.altar-layer--ancestor .wine),
:deep(.altar-layer--ancestor .basin) {
  --h: clamp(56px, calc(var(--u) * 15), 96px);
  --b: clamp(2px, calc(var(--u) * 2), 8px);
  z-index: 6;
}

.tablet-panel-content {
  position: absolute;
  left: 36.5%;
  top: 19%;
  width: 27%;
  height: 52%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  overflow: hidden;
  padding: 3% 5px 1%;
  color: var(--gold);
  --tablet-font-scale: 1;
}

.tablet-inscription {
  max-width: 100%;
  max-height: 100%;
  color: var(--gold);
  font-family: 'Noto Serif SC', 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: clamp(
    0.58rem,
    min(calc(4.8cqh * var(--tablet-font-scale)), calc(var(--tablet-fit-ratio) * 1cqh)),
    1.78rem
  );
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.06;
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  text-shadow: 0 1px 1px rgba(35, 9, 2, 0.9), 0 0 8px rgba(235, 180, 81, 0.26);
}

.tablet-inscription--photo {
  max-width: 100%;
  max-height: 36%;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: break-all;
  font-size: clamp(0.72rem, 2.2cqh, 1.125rem);
  line-height: 1.22;
  letter-spacing: 0.05em;
  text-align: center;
  writing-mode: horizontal-tb;
}

.tablet-photo-frame {
  position: relative;
  width: 84%;
  height: 56%;
  min-height: 34px;
  margin: 0 auto 4%;
  overflow: hidden;
  padding: 3px;
  border: 2px solid #d9a754;
  border-radius: 3px;
  background: #6e3817;
  box-shadow:
    0 4px 0 rgba(14, 2, 0, 0.7),
    inset 0 0 0 2px #3f1708,
    0 0 14px rgba(236, 181, 89, 0.2);
}

.tablet-photo-frame::before,
.tablet-photo-frame::after {
  content: '';
  position: absolute;
  width: 9px;
  height: 9px;
  border: 1px solid rgba(246, 207, 121, 0.86);
}

.tablet-photo-frame::before {
  left: -4px;
  top: -4px;
  border-right: 0;
  border-bottom: 0;
}

.tablet-photo-frame::after {
  right: -4px;
  bottom: -4px;
  border-left: 0;
  border-top: 0;
}

.tablet-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  background: #241006;
}

.stage-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2.8%;
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
  color: rgba(247, 213, 139, 0.82);
  font-size: clamp(0.68rem, 1.6cqw, 0.88rem);
  letter-spacing: 0.12em;
  text-shadow: 0 1px 5px rgba(19, 3, 0, 0.82);
  transition: opacity 0.8s ease;
}

.stage-caption.faded { opacity: 0.18; }
.caption-divider { color: rgba(221, 160, 68, 0.54); }

@media (max-width: 420px) {
  .tablet-panel-content { padding-inline: 4px; }
  .tablet-photo-frame { width: 88%; }
  .stage-caption { letter-spacing: 0.08em; }
}

@media (prefers-reduced-motion: reduce) {
  .stage *,
  .stage *::before,
  .stage *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
