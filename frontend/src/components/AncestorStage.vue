<script setup>
import { computed, ref, watch } from 'vue'
import { renderTablet } from '../utils/tabletCanvas.js'

const props = defineProps({
  ancestor: { type: Object, required: true },
  customPhoto: { type: String, default: null },
  customName: { type: String, default: null },
  offeringItems: { type: Array, default: () => [] },
  figureItems: { type: Array, default: () => [] },
  hasCandles: { type: Boolean, default: false },
  hasIncense: { type: Boolean, default: false },
  hasWine: { type: Boolean, default: false },
  hasPaper: { type: Boolean, default: false },
})

const tabletSrc = ref('')
const leftFigure = computed(() => props.figureItems[0] || null)
const rightFigure = computed(() => props.figureItems[1] || null)

const isPlainStage = computed(
  () =>
    !props.hasCandles &&
    !props.hasIncense &&
    !props.hasWine &&
    !props.hasPaper &&
    props.offeringItems.length === 0 &&
    props.figureItems.length === 0
)

async function buildTablet() {
  if (props.customPhoto) {
    tabletSrc.value = props.customPhoto
    return
  }

  tabletSrc.value = await renderTablet(props.ancestor.image, props.customName, { blank: true })
}

watch(
  () => [props.customPhoto, props.customName, props.ancestor?.image],
  buildTablet,
  { immediate: true }
)
</script>

<template>
  <div class="stage" :class="{ 'plain-stage': isPlainStage }">
    <div class="sky-layer"></div>
    <div class="altar-floor"></div>

    <div class="ancestor-frame" :class="{ 'plain-mode': isPlainStage }">
      <img
        v-if="tabletSrc"
        :src="tabletSrc"
        :alt="ancestor.name"
        :class="['ancestor-img', { 'has-custom': !!customPhoto, 'plain-fill': isPlainStage && !customPhoto }]"
      />
    </div>

    <div class="altar-row" :class="{ hidden: isPlainStage }">
      <div class="altar-slot incense-slot" :class="{ visible: hasIncense }">
        <img src="/04.gif" alt="" class="altar-img" />
      </div>
      <div class="altar-slot candle-slot" :class="{ visible: hasCandles }">
        <div class="flame"><span></span></div>
        <div class="wax"></div>
      </div>
      <div class="altar-slot tablet-slot"></div>
      <div class="altar-slot candle-slot" :class="{ visible: hasCandles }">
        <div class="flame"><span></span></div>
        <div class="wax"></div>
      </div>
      <div class="altar-slot incense-slot" :class="{ visible: hasIncense }">
        <img src="/04.gif" alt="" class="altar-img" />
      </div>
    </div>

    <div class="offering-row" :class="{ hidden: isPlainStage }">
      <img
        v-for="item in offeringItems"
        :key="item.id"
        :src="item.src"
        alt=""
        class="offering-img"
      />
      <img v-if="hasWine" src="/ancestor-wine-v2.png" alt="" class="offering-img offering-img-wine" />
      <img v-if="hasPaper" src="/ancestor-paper-v2.png" alt="" class="offering-img offering-img-paper" />
    </div>

    <img v-if="leftFigure" :src="leftFigure.src" alt="" class="figure figure-left" />
    <img v-if="rightFigure" :src="rightFigure.src" alt="" class="figure figure-right" />
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  max-height: 620px;
  overflow: hidden;
  background: linear-gradient(180deg, #fbf5e9 0%, #f7efdf 56%, #ead7bb 100%);
}

.sky-layer {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 32%, rgba(214, 182, 128, 0.14), transparent 14%),
    radial-gradient(circle at 82% 28%, rgba(214, 182, 128, 0.08), transparent 16%);
  z-index: 0;
}

.altar-floor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34%;
  background:
    linear-gradient(180deg, rgba(122, 87, 51, 0.18), rgba(146, 104, 60, 0.24)),
    linear-gradient(180deg, #cba57a 0%, #b88d62 100%);
  z-index: 1;
}

.ancestor-frame {
  position: absolute;
  top: 2%;
  left: 0;
  right: 0;
  height: 72%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3;
}

.ancestor-frame.plain-mode {
  inset: 0;
  height: auto;
}

.ancestor-img {
  height: 94%;
  width: auto;
  max-width: 84%;
  object-fit: contain;
  object-position: center center;
  filter: drop-shadow(0 18px 26px rgba(72, 43, 18, 0.12));
}

.ancestor-img.has-custom {
  filter: drop-shadow(0 18px 26px rgba(72, 43, 18, 0.16));
}

.ancestor-img.plain-fill {
  width: auto;
  height: 100%;
  max-width: 100%;
  object-fit: contain;
  object-position: center center;
  transform: scale(1.045);
  filter: none;
}

.altar-row {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 21%;
  height: 14%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3.4%;
  padding: 0 7%;
  z-index: 4;
}

.altar-slot {
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.45s ease;
  flex-shrink: 0;
}

.altar-slot.visible {
  opacity: 1;
}

.incense-slot {
  width: 28px;
}

.candle-slot {
  width: 18px;
}

.tablet-slot {
  width: 120px;
  opacity: 0;
}

.altar-img {
  height: 88%;
  width: auto;
  object-fit: contain;
}

.flame {
  width: 10px;
  height: 16px;
}

.flame span {
  display: block;
  width: 10px;
  height: 16px;
  background: linear-gradient(to top, #ff7a00, #ffd54a, #fff7cb);
  border-radius: 50% 50% 22% 22%;
  animation: flicker 0.75s ease-in-out infinite alternate;
  transform-origin: bottom center;
  box-shadow: 0 0 6px 3px rgba(255, 148, 0, 0.4);
}

.wax {
  width: 8px;
  height: 28px;
  background: linear-gradient(to right, #f6edd0, #d8c374, #f0e1aa);
  border-radius: 3px 3px 1px 1px;
  box-shadow: inset -2px 0 3px rgba(0, 0, 0, 0.18);
}

.offering-row {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12%;
  height: 10%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 0 16%;
  z-index: 5;
}

.offering-img {
  height: 70%;
  width: auto;
  animation: fadeInUp 0.4s ease;
  border-radius: 3px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.18));
}

.offering-img-wine {
  height: 72%;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(124, 85, 30, 0.2));
}

.offering-img-paper {
  height: 78%;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(124, 85, 30, 0.22));
}

.figure {
  position: absolute;
  bottom: 0.5%;
  height: 19%;
  width: auto;
  animation: fadeInUp 0.45s ease;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.18));
  z-index: 6;
}

.figure-left {
  left: 18%;
}

.figure-right {
  right: 18%;
}

.hidden {
  opacity: 0;
  pointer-events: none;
}

.stage.plain-stage .altar-floor {
  display: none;
}

.stage.plain-stage .sky-layer {
  display: none;
}

.stage.plain-stage {
  background: #0f0905;
}

@keyframes flicker {
  0% {
    transform: scaleX(1) scaleY(1) skewX(0deg);
  }
  30% {
    transform: scaleX(0.83) scaleY(1.1) skewX(2deg);
  }
  65% {
    transform: scaleX(1.12) scaleY(0.92) skewX(-1deg);
  }
  100% {
    transform: scaleX(0.95) scaleY(1.06) skewX(1deg);
  }
}

@media (orientation: portrait) {
  .ancestor-frame.plain-mode {
    inset: 0;
    height: auto;
  }

  .altar-row {
    bottom: 22%;
    gap: 3%;
    padding: 0 5%;
  }

  .offering-row {
    bottom: 12.5%;
  }

  .figure-left {
    left: 14%;
  }

  .figure-right {
    right: 14%;
  }
}
</style>
