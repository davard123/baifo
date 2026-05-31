<script setup>
import { computed } from 'vue'

const props = defineProps({
  buddha: Object,
  offeringItems: { type: Array, default: () => [] },
  figureItems: { type: Array, default: () => [] },
  hasCandles: { type: Boolean, default: false },
  hasIncense: { type: Boolean, default: false },
})

const displayedOfferings = computed(() => {
  const flowers = props.offeringItems.filter((item) => item.src === '/02.gif')
  const others = props.offeringItems.filter((item) => item.src !== '/02.gif')

  if (!flowers.length) return others

  const [firstFlower] = flowers
  return [
    { ...firstFlower, id: `${firstFlower.id}-left` },
    ...others,
    { ...firstFlower, id: `${firstFlower.id}-right` },
  ]
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

const stageImageStyle = computed(() => {
  const scale = stageScaleMap[props.buddha?.slug] || { desktop: 0.92, mobile: 0.9 }
  return {
    '--buddha-scale': String(scale.desktop),
    '--buddha-scale-mobile': String(scale.mobile),
  }
})
</script>

<template>
  <div class="stage">
    <div class="stage-bg"></div>

    <div class="buddha-frame">
      <img :src="buddha.image" :alt="buddha.name" class="buddha-img" :style="stageImageStyle" />
    </div>

    <div class="altar-row">
      <div class="altar-slot" :class="{ visible: hasIncense }">
        <img src="/04.gif" alt="" class="altar-img" />
      </div>

      <div class="altar-slot candle-slot" :class="{ visible: hasCandles }">
        <div class="flame"><span></span></div>
        <div class="wax"></div>
      </div>

      <div class="altar-slot center-lamp" :class="{ visible: hasCandles }">
        <img src="/lz.png" alt="" class="altar-img lamp-img" />
      </div>

      <div class="altar-slot candle-slot" :class="{ visible: hasCandles }">
        <div class="flame"><span></span></div>
        <div class="wax"></div>
      </div>

      <div class="altar-slot" :class="{ visible: hasIncense }">
        <img src="/04.gif" alt="" class="altar-img" />
      </div>
    </div>

    <div class="offering-row">
      <img
        v-for="item in displayedOfferings"
        :key="item.id"
        :src="item.src"
        alt=""
        class="offering-img"
      />
    </div>

    <img v-if="figureItems[0]" :src="figureItems[0].src" alt="" class="figure-left" />
    <img v-if="figureItems[1]" :src="figureItems[1].src" alt="" class="figure-right" />

    <div class="stage-label">{{ buddha.title }}</div>
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

.altar-row {
  position: absolute;
  top: 73%;
  left: 50%;
  transform: translateX(-50%);
  width: min(44%, 420px);
  height: 11%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  z-index: 4;
}

.altar-slot {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.65s ease;
}

.altar-slot.visible {
  opacity: 1;
}

.center-lamp {
  min-width: 17%;
}

.candle-slot {
  min-width: 10%;
}

.flame {
  width: 10px;
  height: 16px;
}

.flame span {
  display: block;
  width: 10px;
  height: 16px;
  background: linear-gradient(to top, #ff7500, #ffd800, #fffacc);
  border-radius: 50% 50% 22% 22%;
  animation: flicker 0.75s ease-in-out infinite alternate;
  transform-origin: bottom center;
  box-shadow: 0 0 6px 3px rgba(255, 148, 0, 0.5);
}

@keyframes flicker {
  0% { transform: scaleX(1) scaleY(1) skewX(0deg); }
  30% { transform: scaleX(.83) scaleY(1.10) skewX(2deg); }
  65% { transform: scaleX(1.12) scaleY(.92) skewX(-1deg); }
  100% { transform: scaleX(.95) scaleY(1.06) skewX(1deg); }
}

.wax {
  width: 8px;
  height: 30px;
  background: linear-gradient(to right, #f0e4a8, #ceb45a, #e6d280);
  border-radius: 3px 3px 1px 1px;
  box-shadow: inset -2px 0 3px rgba(0, 0, 0, 0.22);
}

.altar-img {
  height: 88%;
  width: auto;
  object-fit: contain;
}

.lamp-img {
  height: 100%;
}

.offering-row {
  position: absolute;
  top: 84%;
  left: 50%;
  transform: translateX(-50%);
  width: min(54%, 520px);
  height: 8%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 6;
  flex-wrap: nowrap;
}

.offering-img {
  height: 72%;
  width: auto;
  animation: fadeInUp 0.4s ease;
  border-radius: 3px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
}

.figure-left,
.figure-right {
  position: absolute;
  bottom: 4%;
  height: 16%;
  width: auto;
  animation: fadeInUp 0.5s ease;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55));
  z-index: 7;
  pointer-events: none;
}

.figure-left {
  left: 15%;
}

.figure-right {
  right: 15%;
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
}

@media (max-width: 900px) {
  .buddha-img {
    transform: scale(var(--buddha-scale-mobile, 0.9));
    object-position: center top;
  }

  .altar-row {
    top: 71.5%;
    width: min(58%, 340px);
  }

  .offering-row {
    top: 82.5%;
    width: min(72%, 420px);
    gap: 8px;
  }

  .offering-img {
    height: 66%;
  }

  .figure-left,
  .figure-right {
    bottom: 5%;
    height: 14%;
  }

  .figure-left {
    left: 8%;
  }

  .figure-right {
    right: 8%;
  }
}
</style>
