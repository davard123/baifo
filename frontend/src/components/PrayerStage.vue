<script setup>
import { computed } from 'vue'
import AltarLayer from './ritual/AltarLayer.vue'

const props = defineProps({
  buddha: Object,
  ritual: { type: Object, required: true },
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
  <div class="stage">
    <div class="stage-bg"></div>

    <div class="buddha-frame">
      <img :src="buddha.image" :alt="buddha.name" class="buddha-img" :style="stageImageStyle" />
    </div>

    <AltarLayer :ritual="ritual" mode="buddha" />

    <div class="stage-label" :class="{ faded: ritual.anyDone.value }">{{ buddha.title }}</div>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
