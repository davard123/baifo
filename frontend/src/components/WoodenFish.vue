<script>
// 渐变 id 必须每个实例唯一：抽屉和整页可能同时挂载，
// 共用一个 id 时先卸载的那个会把 <defs> 一起带走，另一个的填充就没了。
let seq = 0
</script>

<script setup>
// 木鱼本体。整页（/nianfo/）和全站抽屉共用，避免两处各画一份 SVG。
defineProps({
  pressed: { type: Boolean, default: false },
  label: { type: String, default: '念一声佛号' },
})
defineEmits(['tap'])

seq += 1
const gradId = `fishBody-${seq}`
</script>

<template>
  <button
    type="button"
    class="fish"
    :class="{ pressed }"
    :aria-label="label"
    @click="$emit('tap')"
  >
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient :id="gradId" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stop-color="#8a5f34" />
          <stop offset="55%" stop-color="#5d3d21" />
          <stop offset="100%" stop-color="#33200f" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="62" r="46" :fill="`url(#${gradId})`" />
      <path
        d="M28 46c10-14 26-20 42-18"
        fill="none" stroke="rgba(255,236,200,.34)" stroke-width="5" stroke-linecap="round"
      />
      <path
        d="M42 84c14 8 32 6 44-6"
        fill="none" stroke="rgba(0,0,0,.34)" stroke-width="7" stroke-linecap="round"
      />
      <ellipse cx="60" cy="40" rx="20" ry="7" fill="rgba(0,0,0,.32)" />
    </svg>
  </button>
</template>

<style scoped>
.fish {
  width: 100%;
  aspect-ratio: 1;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.45));
  transition: transform 0.11s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.fish svg { width: 100%; height: 100%; display: block; }
.fish.pressed { transform: scale(0.94); }
.fish:focus-visible {
  outline: 3px solid rgba(242, 200, 121, 0.6);
  outline-offset: 6px;
  border-radius: 50%;
}

@media (prefers-reduced-motion: reduce) {
  .fish { transition: none; }
}
</style>
