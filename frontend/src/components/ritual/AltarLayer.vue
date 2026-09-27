<script setup>
// 供台动画层：盖在礼佛 / 祭祀 / 祈福舞台上，根据仪式状态摆出器物并播放动画。
// 器物素材由 ChatGPT 生成（透明背景工笔画），火苗、青烟、火星、光环都由 CSS 实时生成。
// 尺寸单位 --u 取舞台高、宽中较紧的一边，手机竖屏和电脑横屏都能保持比例。
import { computed } from 'vue'

const props = defineProps({
  ritual: { type: Object, required: true },
  mode: { type: String, default: 'buddha' },
})

const A = (name) => `/ritual/${name}.webp`

const done = (key) => Boolean(props.ritual.state.done[key])

// ── 叩拜：点过一次后，两人循环叩首不停（动画由 CSS 控制） ──
const figuresShown = computed(() => props.ritual.state.bowRun > 0)
</script>

<template>
  <div class="altar-layer" :class="`altar-layer--${mode}`" aria-hidden="true">
    <!-- 点灯后整个供台被暖光照亮 -->
    <div class="altar-glow" :class="{ on: done('light') }"></div>

    <!-- 绕佛：金色光环环绕三圈 -->
    <div v-if="ritual.state.circleRun" :key="`circle-${ritual.state.circleRun}`" class="halo-orbit">
      <span class="halo-ring"></span>
      <span class="halo-dot"></span>
    </div>

    <div class="altar">
      <!-- 后排：花瓶 / 烛台 / 香炉 / 烛台 / 花瓶 -->
      <div class="item vase vase--l" :class="{ shown: done('flower') }">
        <img :src="A('vase')" alt="" />
      </div>
      <div class="item candle candle--l" :class="{ shown: done('light') }">
        <img :src="A('candle')" alt="" />
        <span class="flame"><i></i></span>
      </div>
      <div class="item burner" :class="{ shown: done('incense') }">
        <span class="smoke">
          <i v-for="n in 3" :key="n" :style="{ '--i': n }"></i>
        </span>
        <span class="embers"><i></i><i></i><i></i></span>
        <img :src="A('incense')" alt="" />
      </div>
      <div class="item candle candle--r" :class="{ shown: done('light') }">
        <img :src="A('candle')" alt="" />
        <span class="flame"><i></i></span>
      </div>
      <div class="item vase vase--r" :class="{ shown: done('flower') }">
        <img :src="A('vase')" alt="" />
      </div>

      <!-- 前排：果盘 / 莲花灯 / 果盘；祭祀另有酒爵和火盆 -->
      <div class="item fruit fruit--l" :class="{ shown: done('fruit') }">
        <img :src="A('fruit')" alt="" />
      </div>
      <div class="item lamp" :class="{ shown: done('light') }">
        <img :src="A('lamp')" alt="" />
        <span class="flame flame--lamp"><i></i></span>
      </div>
      <div class="item fruit fruit--r" :class="{ shown: done('fruit') }">
        <img :src="A('fruit')" alt="" />
      </div>

      <template v-if="mode === 'ancestor'">
        <div class="item wine" :class="{ shown: done('wine') }">
          <img :src="A('wine')" alt="" />
          <span v-if="done('wine')" class="pour"><i v-for="n in 6" :key="n" :style="{ '--i': n }"></i></span>
          <span v-if="done('wine')" class="puddle"></span>
        </div>
        <div class="item basin" :class="{ shown: done('paper') }">
          <img class="paper" :src="A('paper')" alt="" />
          <img class="basin-img" :src="A('basin')" alt="" />
          <span v-if="done('paper')" class="fire">
            <i v-for="n in 5" :key="n" :style="{ '--i': n }"></i>
          </span>
          <span v-if="done('paper')" class="sparks">
            <i v-for="n in 10" :key="n" :style="{ '--i': n }"></i>
          </span>
        </div>
      </template>
    </div>

    <!-- 两侧跪拜的人（背影，面朝佛像） -->
    <div class="worshipper worshipper--l" :class="{ shown: figuresShown }">
      <img class="pose kneel" :src="A('man-kneel')" alt="" />
      <img class="pose bow" :src="A('man-bow')" alt="" />
    </div>
    <div class="worshipper worshipper--r" :class="{ shown: figuresShown }">
      <img class="pose kneel" :src="A('woman-kneel')" alt="" />
      <img class="pose bow" :src="A('woman-bow')" alt="" />
    </div>
  </div>
</template>

<style scoped>
.altar-layer {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  container-type: size;
  --u: min(1cqh, 0.76cqw);
}

/* ── 暖光 ── */
.altar-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 55% 34% at 50% 86%, rgba(255, 176, 72, 0.34), transparent 70%);
  opacity: 0;
  transition: opacity 1.6s ease;
}
.altar-glow.on {
  opacity: 1;
  animation: glow-breathe 3.2s ease-in-out 1.6s infinite;
}

/* ── 供台坐标：以舞台底部中点为原点 ── */
.altar {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 0;
}

.item {
  position: absolute;
  bottom: var(--b, 0);
  left: var(--x, 0);
  width: max-content;
  height: var(--h);
  transform: translateX(-50%) translateY(calc(var(--u) * 4));
  opacity: 0;
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.item img {
  display: block;
  height: var(--h);
  width: auto;
  filter: drop-shadow(0 calc(var(--u) * 0.6) calc(var(--u) * 0.8) rgba(20, 8, 0, 0.45));
}
.item.shown {
  opacity: 1;
  transform: translateX(-50%);
}
.item.shown::after {
  /* 落位时闪一下光 */
  content: '';
  position: absolute;
  left: 50%;
  bottom: 20%;
  width: 140%;
  aspect-ratio: 1;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255, 226, 150, 0.55), transparent 62%);
  opacity: 0;
  animation: settle-flash 1.2s ease 0.4s;
  pointer-events: none;
}

.vase { --h: calc(var(--u) * 19); --b: calc(var(--u) * 11); }
.vase--l { --x: calc(var(--u) * -40); }
.vase--r { --x: calc(var(--u) * 40); }
.vase--r img { transform: scaleX(-1); }

.candle { --h: calc(var(--u) * 17); --b: calc(var(--u) * 11); }
.candle--l { --x: calc(var(--u) * -23); }
.candle--r { --x: calc(var(--u) * 23); }

.burner { --h: calc(var(--u) * 15); --b: calc(var(--u) * 11); --x: 0px; }

.fruit { --h: calc(var(--u) * 10.5); --b: calc(var(--u) * 2); }
.fruit--l { --x: calc(var(--u) * -15); }
.fruit--r { --x: calc(var(--u) * 15); }

.lamp { --h: calc(var(--u) * 10); --b: calc(var(--u) * 1.5); --x: 0px; }

.wine { --h: calc(var(--u) * 9); --b: calc(var(--u) * 2); --x: calc(var(--u) * -26); }
.basin { --h: calc(var(--u) * 10.5); --b: calc(var(--u) * 1); --x: calc(var(--u) * 26); }

/* 后排在前排后面 */
.vase, .candle, .burner { z-index: 1; }
.fruit, .lamp, .wine, .basin { z-index: 2; }

/* ── 火苗 ── */
.flame {
  position: absolute;
  left: 50%;
  top: 0;
  width: calc(var(--u) * 1.4);
  height: calc(var(--u) * 3);
  transform: translate(-50%, -88%);
  opacity: 0;
  transition: opacity 0.8s ease 0.7s;
}
.shown .flame { opacity: 1; }
.flame::before {
  /* 光晕 */
  content: '';
  position: absolute;
  left: 50%;
  top: 55%;
  width: calc(var(--u) * 9);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 190, 90, 0.5), rgba(255, 150, 40, 0.12) 45%, transparent 70%);
  animation: halo-flicker 2.2s ease-in-out infinite;
}
.flame i {
  position: absolute;
  inset: 0;
  border-radius: 50% 50% 45% 45% / 62% 62% 38% 38%;
  background: radial-gradient(ellipse at 50% 78%, #fffbe6 0%, #ffe38a 28%, #ffab2e 58%, rgba(255, 90, 0, 0.85) 80%, transparent 100%);
  transform-origin: 50% 90%;
  animation: flame-dance 1.1s ease-in-out infinite alternate;
  filter: blur(0.3px);
}
.flame--lamp {
  top: 38%;
  width: calc(var(--u) * 1.3);
  height: calc(var(--u) * 2.6);
}
.candle--r .flame i { animation-delay: -0.45s; }
.flame--lamp i { animation-delay: -0.2s; }

/* ── 青烟 ── */
.smoke {
  position: absolute;
  left: 50%;
  top: 0;
  width: calc(var(--u) * 10);
  height: calc(var(--u) * 26);
  transform: translate(-50%, -96%);
  opacity: 0;
  transition: opacity 1.5s ease 1s;
}
.shown .smoke { opacity: 1; }
.smoke i {
  position: absolute;
  left: calc(35% + (var(--i) - 2) * 14%);
  bottom: 0;
  width: calc(var(--u) * 2.2);
  height: calc(var(--u) * 2.2);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(235, 228, 218, 0.55), rgba(235, 228, 218, 0) 70%);
  filter: blur(calc(var(--u) * 0.35));
  animation: smoke-rise 5.5s ease-out infinite;
  animation-delay: calc(var(--i) * -1.8s);
}
.embers {
  position: absolute;
  left: 50%;
  top: 2%;
  width: 28%;
  height: calc(var(--u) * 1);
  transform: translateX(-50%);
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 1s ease 0.8s;
}
.shown .embers { opacity: 1; }
.embers i {
  width: calc(var(--u) * 0.55);
  height: calc(var(--u) * 0.55);
  border-radius: 50%;
  background: #ff5a1f;
  box-shadow: 0 0 calc(var(--u) * 0.8) #ff8a3d;
  animation: ember-glow 1.6s ease-in-out infinite alternate;
}
.embers i:nth-child(2) { animation-delay: -0.6s; }
.embers i:nth-child(3) { animation-delay: -1.1s; }

/* ── 奠酒 ── */
.wine.shown img {
  transform-origin: 70% 85%;
  animation: wine-tilt 2.6s ease-in-out 0.9s;
}
.pour {
  position: absolute;
  left: 20%;
  top: 20%;
  width: calc(var(--u) * 4);
  height: calc(var(--u) * 8);
}
.pour i {
  position: absolute;
  left: 0;
  top: 0;
  width: calc(var(--u) * 0.55);
  height: calc(var(--u) * 0.9);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: linear-gradient(#fff4d6, #e8b85a);
  opacity: 0;
  animation: pour-drop 0.9s ease-in 1.4s;
  animation-delay: calc(1.3s + var(--i) * 0.14s);
}
.puddle {
  position: absolute;
  left: -30%;
  bottom: -4%;
  width: calc(var(--u) * 6);
  height: calc(var(--u) * 1.1);
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255, 226, 150, 0.5), transparent 70%);
  opacity: 0;
  animation: puddle-in 1.2s ease 2.2s forwards;
}

/* ── 烧纸 ── */
.basin .paper {
  position: absolute;
  left: 50%;
  bottom: 55%;
  height: 70%;
  transform: translateX(-50%);
  z-index: 0;
}
.basin .basin-img {
  position: relative;
  z-index: 1;
}
.basin.shown .paper {
  animation: paper-burn 4.5s ease-in 0.6s forwards;
}
.fire {
  position: absolute;
  left: 50%;
  bottom: 62%;
  width: 70%;
  height: calc(var(--u) * 9);
  transform: translateX(-50%);
  z-index: 2;
}
.fire i {
  position: absolute;
  bottom: 0;
  left: calc(10% + (var(--i) - 1) * 18%);
  width: calc(var(--u) * 2.4);
  height: calc(var(--u) * 5.5);
  border-radius: 50% 50% 45% 45% / 62% 62% 38% 38%;
  background: radial-gradient(ellipse at 50% 80%, #fff3c4, #ffb432 35%, #ff5a10 70%, transparent 100%);
  transform-origin: 50% 100%;
  mix-blend-mode: screen;
  animation:
    fire-rise 2.6s ease-out 1s both,
    flame-dance 0.6s ease-in-out infinite alternate;
  animation-delay: 1s, calc(var(--i) * -0.13s);
}
.fire i:nth-child(odd) { height: calc(var(--u) * 4.2); }
.sparks {
  position: absolute;
  left: 50%;
  bottom: 70%;
  width: calc(var(--u) * 10);
  height: calc(var(--u) * 22);
  transform: translateX(-50%);
  z-index: 3;
}
.sparks i {
  position: absolute;
  bottom: 0;
  left: calc(20% + (var(--i) * 7%) - 7%);
  width: calc(var(--u) * 0.45);
  height: calc(var(--u) * 0.45);
  border-radius: 50%;
  background: #ffcf6b;
  box-shadow: 0 0 calc(var(--u) * 0.7) #ff8a3d;
  opacity: 0;
  animation: spark-fly 2.4s ease-out infinite;
  animation-delay: calc(1.2s + var(--i) * 0.37s);
}

/* ── 绕佛光环 ── */
.halo-orbit {
  position: absolute;
  left: 50%;
  top: 40%;
  width: min(62cqw, 70cqh);
  aspect-ratio: 1.15;
  transform: translate(-50%, -50%);
  animation: orbit-fade 7.8s ease forwards;
}
.halo-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: calc(var(--u) * 0.25) solid rgba(255, 214, 130, 0.45);
  box-shadow: 0 0 calc(var(--u) * 3) rgba(255, 200, 100, 0.35), inset 0 0 calc(var(--u) * 3) rgba(255, 200, 100, 0.25);
}
.halo-dot {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: orbit-spin 2.4s linear 3;
}
.halo-dot::before {
  content: '';
  position: absolute;
  left: 50%;
  top: calc(var(--u) * -1.2);
  width: calc(var(--u) * 2.4);
  height: calc(var(--u) * 2.4);
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, #fff7d6, #ffc95a 45%, transparent 72%);
  box-shadow: 0 0 calc(var(--u) * 3) #ffcf6b;
}

/* ── 跪拜的人 ── */
.worshipper {
  position: absolute;
  bottom: calc(var(--u) * 0.5);
  height: calc(var(--u) * 36);
  aspect-ratio: 0.75;
  opacity: 0;
  transform: translateY(calc(var(--u) * 3));
  transition: opacity 0.8s ease, transform 0.8s ease;
  z-index: 5;
}
.worshipper--l { left: max(1cqw, calc(50cqw - var(--u) * 64)); }
.worshipper--r { right: max(1cqw, calc(50cqw - var(--u) * 64)); }
.worshipper.shown {
  opacity: 1;
  transform: none;
}
.pose {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom center;
  transition: opacity 0.45s ease;
  filter: drop-shadow(0 calc(var(--u) * 0.6) calc(var(--u) * 1) rgba(10, 4, 0, 0.5));
}
.pose.bow { opacity: 0; }
/* 出场 0.6s 后开始循环：跪直 → 俯身叩首 → 起身，每次 2.6s */
.worshipper.shown .pose.kneel { animation: pose-kneel 2.6s ease-in-out 0.6s infinite; }
.worshipper.shown .pose.bow { animation: pose-bow 2.6s ease-in-out 0.6s infinite; }

/* ── keyframes ── */
@keyframes glow-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.78; }
}
@keyframes settle-flash {
  0% { opacity: 0; }
  35% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes flame-dance {
  0% { transform: scale(1, 1) skewX(0deg); }
  30% { transform: scale(0.88, 1.08) skewX(2deg); }
  60% { transform: scale(1.06, 0.94) skewX(-2deg); }
  100% { transform: scale(0.94, 1.05) skewX(1deg); }
}
@keyframes halo-flicker {
  0%, 100% { opacity: 0.9; }
  45% { opacity: 0.7; }
  70% { opacity: 1; }
}
@keyframes smoke-rise {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  12% { opacity: 0.8; }
  50% { transform: translate(calc(var(--u) * 1.2), calc(var(--u) * -12)) scale(1.6); opacity: 0.45; }
  100% { transform: translate(calc(var(--u) * -1.5), calc(var(--u) * -24)) scale(3); opacity: 0; }
}
@keyframes ember-glow {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
@keyframes wine-tilt {
  0% { transform: rotate(0); }
  30%, 65% { transform: rotate(-42deg) translateX(calc(var(--u) * -0.6)); }
  100% { transform: rotate(0); }
}
@keyframes pour-drop {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(calc(var(--u) * -1.5), calc(var(--u) * 7)); opacity: 0; }
}
@keyframes puddle-in {
  to { opacity: 1; }
}
@keyframes paper-burn {
  0% { transform: translateX(-50%) translateY(calc(var(--u) * -8)); opacity: 0; filter: none; }
  15% { transform: translateX(-50%) translateY(0); opacity: 1; }
  45% { filter: brightness(1.3) sepia(0.6); }
  100% { transform: translateX(-50%) translateY(20%) scale(0.6); opacity: 0; filter: brightness(0.2); }
}
@keyframes fire-rise {
  0% { opacity: 0; transform: scaleY(0.2); }
  40% { opacity: 1; transform: scaleY(1.25); }
  100% { opacity: 0.55; transform: scaleY(0.55); }
}
@keyframes spark-fly {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(calc((var(--i) - 5) * var(--u) * 0.8), calc(var(--u) * -20)); opacity: 0; }
}
@keyframes pose-kneel {
  0%, 30% { opacity: 1; }
  42%, 72% { opacity: 0; }
  84%, 100% { opacity: 1; }
}
@keyframes pose-bow {
  0%, 30% { opacity: 0; }
  42%, 72% { opacity: 1; }
  84%, 100% { opacity: 0; }
}
@keyframes orbit-spin {
  to { transform: rotate(360deg); }
}
@keyframes orbit-fade {
  0% { opacity: 0; }
  8%, 88% { opacity: 1; }
  100% { opacity: 0; }
}

/* 手机竖屏：横向空间紧，整体放大，人物跪在最前面可以挡住部分后排花瓶 */
@container (max-aspect-ratio: 4 / 5) {
  .altar,
  .worshipper,
  .halo-orbit,
  .altar-glow {
    --u: min(1cqh, 1cqw);
  }
  .worshipper--l { left: 1cqw; }
  .worshipper--r { right: 1cqw; }
}

@media (prefers-reduced-motion: reduce) {
  .altar-layer *,
  .altar-layer *::before,
  .altar-layer *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
  .shown .flame,
  .shown .smoke,
  .shown .embers {
    opacity: 1;
  }
}
</style>
