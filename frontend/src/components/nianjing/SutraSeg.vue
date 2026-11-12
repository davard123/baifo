<script setup>
// 卡拉OK里的一段：普通段落直接排；偈颂一排两句，每句整块不拆开，放不下就整句折到下一行。
import SutraLine from './SutraLine.vue'

defineProps({
  seg: { type: Object, required: true },
  cursor: { type: Number, default: -1 },
})
defineEmits(['pick'])
</script>

<template>
  <SutraLine v-if="seg.gapBefore === undefined" :tokens="seg.tokens" :cursor="cursor" @pick="$emit('pick', $event)" />
  <span v-else class="sg-verse"><template v-for="(pt, k) in seg.parts" :key="k"><template v-if="k">&#x3000;</template><span class="sg-half"><SutraLine :tokens="pt.tokens.filter((t) => !t.sep)" :cursor="cursor" @pick="$emit('pick', $event)" /></span></template></span>
</template>

<style scoped>
.sg-half { display: inline-block; }
</style>
