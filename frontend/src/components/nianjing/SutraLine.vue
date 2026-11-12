<script setup>
// 一段经文：每个字上标拼音。cursor 之前的字已念（金色），cursor 所在的字是正在念的。
// 非当前行把 cursor 传 -1（全未念）或 Infinity（全已念），这样只有当前行会跟着重绘。
defineProps({
  tokens: { type: Array, required: true },
  cursor: { type: Number, default: -1 },
})
defineEmits(['pick'])
</script>

<template>
  <span class="sl"><template v-for="(t, i) in tokens" :key="i"><ruby
        v-if="t.u !== undefined"
        class="sl-ch"
        :class="{ done: t.u < cursor, cur: t.u === cursor }"
        @click="$emit('pick', t.u)"
      >{{ t.ch }}<rt>{{ t.py }}</rt></ruby><span v-else class="sl-p">{{ t.ch }}</span></template></span>
</template>

<style scoped>
.sl-ch {
  ruby-position: over;
  cursor: pointer;
  transition: color 0.25s;
}
.sl-ch rt {
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 0.45em;
  color: var(--nj-py, #9a8a7a);
  letter-spacing: 0;
  font-weight: 400;
}
.sl-ch.done {
  color: var(--nj-done, #b5832f);
}
.sl-ch.done rt {
  color: var(--nj-done-py, #c9a466);
}
.sl-ch.cur {
  color: var(--nj-cur, #a3261c);
}
.sl-p {
  color: var(--nj-punct, #9a8a7a);
}
</style>
