<script setup>
defineProps({
  variant: { type: String, default: 'ancestor' },
})
</script>

<template>
  <div class="sanctuary" :class="`sanctuary--${variant}`" aria-hidden="true">
    <img class="sanctuary__hall" src="/sanctuary/hall-20261019.webp" alt="" fetchpriority="high" />
    <div class="sanctuary__shade"></div>
    <div class="sanctuary__light"></div>
    <div class="sanctuary__motes">
      <i v-for="n in 6" :key="n" :style="{ '--n': n }"></i>
    </div>
  </div>
</template>

<style scoped>
.sanctuary {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #392012;
}
.sanctuary__hall {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.sanctuary__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(25 10 2 / 12%), transparent 28%, rgb(24 10 2 / 12%) 68%, rgb(24 10 2 / 48%));
}
.sanctuary__light {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 40%, rgb(255 213 137 / 14%), transparent 46%);
  animation: sanctuary-light 12s ease-in-out infinite alternate;
}
.sanctuary--ancestor .sanctuary__hall { filter: saturate(.8); }
.sanctuary--wealth .sanctuary__light {
  background: radial-gradient(ellipse at 50% 36%, rgb(255 208 106 / 20%), transparent 48%);
}
.sanctuary__motes { position: absolute; inset: 0; }
.sanctuary__motes i {
  position: absolute;
  left: calc(12% + var(--n) * 12%);
  top: calc(22% + var(--n) * 7%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #ffe2ad;
  opacity: .2;
  animation: sanctuary-drift calc(11s + var(--n) * 2s) ease-in-out infinite alternate;
  animation-delay: calc(var(--n) * -3s);
}
@keyframes sanctuary-light { from { opacity: .5; } to { opacity: 1; } }
@keyframes sanctuary-drift {
  from { transform: translate3d(-5px, 16px, 0); opacity: .08; }
  to { transform: translate3d(7px, -20px, 0); opacity: .3; }
}
@media (orientation: portrait) {
  .sanctuary__hall { object-position: 50% 48%; }
}
@media (prefers-reduced-motion: reduce) {
  .sanctuary__light, .sanctuary__motes i { animation: none; }
  .sanctuary__motes { display: none; }
}
</style>
