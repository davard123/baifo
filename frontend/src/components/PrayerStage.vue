<script setup>
defineProps({
  buddha:        Object,
  offeringItems: { type: Array,   default: () => [] },
  figureItems:   { type: Array,   default: () => [] },
  hasCandles:    { type: Boolean, default: false },
  hasIncense:    { type: Boolean, default: false }
})
</script>

<template>
  <div class="stage">
    <div class="stage-bg"></div>

    <!-- ① 佛像（上 62%）-->
    <div class="buddha-frame">
      <img :src="buddha.image" :alt="buddha.name" class="buddha-img" />
    </div>

    <!--
      ② 法器排（60%–72%）：
      [香-左] [烛-左] [灯-中] [烛-右] [香-右]
      每项独立淡入，同行同高
    -->
    <div class="altar-row">
      <!-- 香 左 -->
      <div class="altar-slot" :class="{ visible: hasIncense }">
        <img src="/04.gif" alt="" class="altar-img" />
      </div>
      <!-- 烛 左 -->
      <div class="altar-slot candle-slot" :class="{ visible: hasCandles }">
        <div class="flame"><span></span></div>
        <div class="wax"></div>
      </div>
      <!-- 灯 中 -->
      <div class="altar-slot" :class="{ visible: hasCandles }">
        <img src="/lz.png" alt="" class="altar-img lamp-img" />
      </div>
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

    <!-- ③ 供品排（73%–83%）：花/贡品/水，一排小图 -->
    <div class="offering-row">
      <img
        v-for="item in offeringItems"
        :key="item.id"
        :src="item.src"
        alt=""
        class="offering-img"
      />
    </div>

    <!-- ④ 磕头人物（下 20%）：左男右女 -->
    <img v-if="figureItems[0]" :src="figureItems[0].src" alt="" class="figure-left"  />
    <img v-if="figureItems[1]" :src="figureItems[1].src" alt="" class="figure-right" />

    <div class="stage-label">{{ buddha.title }}</div>
  </div>
</template>

<style scoped>
/* ── Stage shell ── */
.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  max-height: 540px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg,
    #130700 0%,
    #2a1000 22%,
    #471c00 46%,
    #66300a 68%,
    #884818 100%
  );
}
.stage-bg {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse at 50% 28%, rgba(220,170,60,.10) 0%, transparent 52%),
    radial-gradient(ellipse at 50% 92%, rgba(180,80,10,.14) 0%, transparent 42%);
}

/* ── ① 佛像：从顶部撑到法器排上方 5% ── */
.buddha-frame {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 62%;
  z-index: 2;
}
/* 图片边缘淡出，与深色舞台背景自然融合 */
.buddha-img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top center;
  mask-image: radial-gradient(ellipse 90% 96% at 50% 36%,
    black 42%, rgba(0,0,0,.55) 60%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 90% 96% at 50% 36%,
    black 42%, rgba(0,0,0,.55) 60%, transparent 78%);
}


/* ── ② 法器排（67%–77%）── */
.altar-row {
  position: absolute;
  top: 67%; left: 0; right: 0;
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

/* 蜡烛 */
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

/* 法器图片（香/灯）*/
.altar-img { height: 85%; width: auto; object-fit: contain; }
.lamp-img  { height: 95%; }   /* 灯略高于香 */

/* ── ③ 供品排（78%–86%）── */
.offering-row {
  position: absolute;
  top: 78%; left: 0; right: 0;
  height: 8%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 0 16%;
  z-index: 6;
  flex-wrap: nowrap;
}
.offering-img {
  height: 62%; width: auto;
  animation: fadeInUp .4s ease;
  border-radius: 3px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.45));
}

/* ── ④ 磕头人物（下 22%）── */
.figure-left,
.figure-right {
  position: absolute;
  bottom: 0; height: 22%;
  width: auto;
  animation: fadeInUp .5s ease;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,.55));
  z-index: 7;
  pointer-events: none;
}
.figure-left  { left: 2%; }
.figure-right { right: 2%; }

.stage-label {
  position: absolute; bottom: 1.5%; width: 100%;
  text-align: center;
  color: rgba(235,205,120,.8);
  font-size: .78rem; letter-spacing: .12em;
  text-shadow: 0 1px 5px rgba(0,0,0,.7);
  z-index: 8;
}

/* ── 竖屏微调（aspect-ratio 由父容器控制）── */
@media (orientation: portrait) {
  .altar-row    { gap: 3%; padding: 0 4%; }
  .wax          { height: 18px; }
  .offering-img { height: 58%; }
}
</style>
