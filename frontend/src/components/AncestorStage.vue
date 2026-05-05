<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { renderTablet } from '../utils/tabletCanvas.js'

const props = defineProps({
  ancestor:      Object,
  customPhoto:   { type: String,  default: null },
  customName:    { type: String,  default: null },
  offeringItems: { type: Array,   default: () => [] },
  figureItems:   { type: Array,   default: () => [] },
  hasCandles:    { type: Boolean, default: false },
  hasIncense:    { type: Boolean, default: false },
  hasWine:       { type: Boolean, default: false },
  hasPaper:      { type: Boolean, default: false }
})

const tabletSrc = ref('')
const isPlainStage = computed(() =>
  !props.hasCandles &&
  !props.hasIncense &&
  !props.hasWine &&
  !props.hasPaper &&
  props.offeringItems.length === 0 &&
  props.figureItems.length === 0
)

async function buildTablet() {
  if (props.customPhoto) { tabletSrc.value = props.customPhoto; return }
  tabletSrc.value = await renderTablet(
    props.ancestor.image,
    props.customName || props.ancestor.title
  )
}

onMounted(buildTablet)
watch(() => [props.customPhoto, props.customName, props.ancestor?.image], buildTablet)
</script>

<template>
  <div class="stage" :class="{ 'is-plain-stage': isPlainStage }">
    <div class="stage-bg"></div>

    <!-- ① 先人牌位（上 62%）-->
    <div class="ancestor-frame">
      <img
        v-if="tabletSrc"
        :src="tabletSrc"
        :alt="ancestor.name"
        :class="['ancestor-img', { 'has-custom': !!customPhoto }]"
      />
    </div>

    <!-- ② 法器排（67%–77%）：香-烛-牌位-烛-香 -->
    <div class="altar-row" :class="{ hidden: isPlainStage }">
      <!-- 香 左 -->
      <div class="altar-slot" :class="{ visible: hasIncense }">
        <img src="/04.gif" alt="" class="altar-img" />
      </div>
      <!-- 烛 左 -->
      <div class="altar-slot candle-slot" :class="{ visible: hasCandles }">
        <div class="flame"><span></span></div>
        <div class="wax"></div>
      </div>
      <!-- 牌位占位（空槽保持间距）-->
      <div class="altar-slot tablet-slot"></div>
      <!-- 烛 右 -->
      <div class="altar-slot candle-slot" :class="{ visible: hasCandles }">
        <div class="flame"><span></span></div>
        <div class="wax"></div>
      </div>
      <!-- 香 右 -->
      <div class="altar-slot" :class="{ visible: hasIncense }">
        <img src="/04.gif" alt="" class="altar-img" />
      </div>
    </div>

    <!-- ③ 供品排（78%–86%）：奠酒/祭品 -->
    <div class="offering-row" :class="{ hidden: isPlainStage }">
      <img
        v-for="item in offeringItems"
        :key="item.id"
        :src="item.src"
        alt=""
        class="offering-img"
      />
      <!-- 奠酒杯 -->
      <div v-if="hasWine" class="wine-cup"></div>
      <!-- 纸钱 -->
      <div v-if="hasPaper" class="paper-burn"></div>
    </div>

    <!-- ④ 叩拜人物（下 22%）-->
    <img v-if="figureItems[0]" :src="figureItems[0].src" alt="" class="figure-left" />

    <div class="stage-label">{{ ancestor.subtitle }}</div>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  max-height: 540px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg,
    #0a0805 0%,
    #1a1208 22%,
    #2a1f10 46%,
    #3a2a18 68%,
    #4a3520 100%
  );
}
.stage-bg {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse at 50% 28%, rgba(180,160,120,.08) 0%, transparent 52%),
    radial-gradient(ellipse at 50% 92%, rgba(100,60,20,.10) 0%, transparent 42%);
}

/* ① 先人牌位 */
.ancestor-frame {
  position: absolute;
  top: 4%;
  left: 0;
  right: 0;
  height: 72%;
  z-index: 2;
  overflow: hidden;
}
.ancestor-img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top center;
}
/* 上传了自定义照片时加柔边遮罩 */
.ancestor-img.has-custom {
  mask-image: radial-gradient(ellipse 90% 96% at 50% 36%,
    black 42%, rgba(0,0,0,.55) 60%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 90% 96% at 50% 36%,
    black 42%, rgba(0,0,0,.55) 60%, transparent 78%);
}

/* ② 法器排 */
.altar-row {
  position: absolute;
  top: 75%;
  left: 0;
  right: 0;
  height: 10%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3.5%;
  padding: 0 6%;
  z-index: 3;
}
.altar-slot {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.65s ease;
  flex-shrink: 0;
}
.altar-slot.visible { opacity: 1; }
.candle-slot { width: auto; }
.flame { width: 9px; height: 15px; }
.flame span {
  display: block; width: 9px; height: 15px;
  background: linear-gradient(to top, #ff7500, #ffd800, #fffacc);
  border-radius: 50% 50% 22% 22%;
  animation: flicker .75s ease-in-out infinite alternate;
  transform-origin: bottom center;
  box-shadow: 0 0 6px 3px rgba(255,148,0,.5);
}
@keyframes flicker {
  0%   { transform: scaleX(1)    scaleY(1)    skewX(0deg); }
  30%  { transform: scaleX(.83)  scaleY(1.10) skewX(2deg); }
  65%  { transform: scaleX(1.12) scaleY(.92)  skewX(-1deg); }
  100% { transform: scaleX(.95)  scaleY(1.06) skewX(1deg); }
}
.wax {
  width: 7px; height: 28px;
  background: linear-gradient(to right, #f0e4a8, #ceb45a, #e6d280);
  border-radius: 3px 3px 1px 1px;
  box-shadow: inset -2px 0 3px rgba(0,0,0,.22);
}
.altar-img { height: 85%; width: auto; object-fit: contain; }

/* 牌位槽（占位用） */
.tablet-slot { opacity: 0; width: 40px; }

/* ③ 供品排 */
.offering-row {
  position: absolute;
  top: 86%;
  left: 0;
  right: 0;
  height: 8%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 0 16%;
  z-index: 6;
}
.offering-img {
  height: 62%; width: auto;
  animation: fadeInUp .4s ease;
  border-radius: 3px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.45));
}
.wine-cup {
  width: 18px; height: 24px;
  background: linear-gradient(to right, #d0c8b0, #a09070, #d0c8b0);
  border-radius: 2px 2px 6px 6px;
  box-shadow: inset -2px 0 4px rgba(0,0,0,.25);
  border: 1px solid rgba(160,144,112,.5);
}
.paper-burn {
  width: 22px; height: 28px;
  background: linear-gradient(to top, #c83000, #ff6010, #ffd020);
  border-radius: 4px 4px 2px 2px;
  animation: paperBurn 1.2s ease-in-out infinite alternate;
}
@keyframes paperBurn {
  0%   { transform: scaleX(1)    scaleY(1);    opacity: 1; }
  50%  { transform: scaleX(.9)  scaleY(1.08); opacity: .85; }
  100% { transform: scaleX(1.05) scaleY(.95); opacity: .95; }
}

/* ④ 叩拜人物 */
.figure-left {
  position: absolute;
  bottom: 0; height: 22%;
  width: auto;
  animation: fadeInUp .5s ease;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,.55));
  z-index: 7;
}
.figure-right { right: 2%; }

.stage-label {
  position: absolute; bottom: 1.5%; width: 100%;
  text-align: center;
  color: rgba(200,190,170,.8);
  font-size: .78rem; letter-spacing: .12em;
  text-shadow: 0 1px 5px rgba(0,0,0,.7);
  z-index: 8;
}

.hidden {
  opacity: 0;
  pointer-events: none;
}

.stage.is-plain-stage .ancestor-frame {
  top: 2%;
  height: 88%;
}

.stage.is-plain-stage .ancestor-img {
  object-fit: contain;
  object-position: center top;
}

.stage.is-plain-stage .stage-label {
  bottom: 3.5%;
}

/* 竖屏微调 */
@media (orientation: portrait) {
  .altar-row    { gap: 3%; padding: 0 4%; }
  .wax          { height: 18px; }
  .offering-img { height: 58%; }
}
</style>
