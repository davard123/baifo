<script setup>
import { computed, ref, watch } from 'vue'
import { renderTablet } from '../utils/tabletCanvas.js'
import AltarLayer from './ritual/AltarLayer.vue'

const props = defineProps({
  ancestor: { type: Object, required: true },
  customPhoto: { type: String, default: null },
  customName: { type: String, default: null },
  ritual: { type: Object, required: true },
})

const tabletSrc = ref('')
// 还没开始祭拜时整幅显示牌位，开始供奉后露出供台
const isPlainStage = computed(() => !props.ritual.anyDone.value)

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

    <AltarLayer :ritual="ritual" mode="ancestor" />
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

.stage.plain-stage .altar-floor {
  display: none;
}

.stage.plain-stage .sky-layer {
  display: none;
}

.stage.plain-stage {
  background: #0f0905;
}

@media (orientation: portrait) {
  .ancestor-frame.plain-mode {
    inset: 0;
    height: auto;
  }
}
</style>
