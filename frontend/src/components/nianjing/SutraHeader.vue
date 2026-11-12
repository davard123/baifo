<script setup>
// 经题块：经题、品名（可选）、译者，都标拼音；不可点、不随念诵变色，不参与语音跟读。
import { computed } from 'vue'
import { labelTokens } from '../../data/nianjing.js'

const props = defineProps({
  header: { type: Object, required: true },
})
const rows = computed(() => {
  const h = props.header
  return [
    { cls: 'sh-title', tokens: labelTokens(h.title, h.titlePy) },
    h.sub ? { cls: 'sh-sub', tokens: labelTokens(h.sub, h.subPy) } : null,
    { cls: 'sh-tr', tokens: labelTokens(h.translator, h.translatorPy) },
  ].filter(Boolean)
})
</script>

<template>
  <div class="sh">
    <p v-for="r in rows" :key="r.cls" :class="r.cls">
      <template v-for="(t, i) in r.tokens" :key="i"><ruby v-if="t.py">{{ t.ch }}<rt>{{ t.py }}</rt></ruby><span v-else-if="t.gap" class="sh-gap"></span><template v-else>{{ t.ch }}</template></template>
    </p>
  </div>
</template>

<style scoped>
.sh {
  text-align: center;
  margin: 0 auto 0.5em;
  padding: 0.3em 0 0.2em;
  user-select: none;
}
.sh p { margin: 0; }
.sh ruby { ruby-position: over; }
.sh rt {
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 0.45em;
  font-weight: 400;
  letter-spacing: 0;
  color: inherit;
  opacity: 0.8;
}
.sh-title {
  font-size: 1.15em;
  font-weight: 700;
  color: #7a2a1c;
  line-height: 2.1;
}
.sh-sub {
  font-size: 0.95em;
  font-weight: 600;
  color: #7a2a1c;
  line-height: 2.1;
}
.sh-tr {
  font-size: 0.7em;
  color: #756558;
  line-height: 2.3;
}
.sh-gap { display: inline-block; width: 0.5em; }
</style>
