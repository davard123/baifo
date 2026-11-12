<script setup>
// 一段经文：每个字上标注音或拼音（念经页 provide 的 njRuby 决定：zhuyin | pinyin | none）。
// cursor 之前的字已念（金色），cursor 所在的字是正在念的。
// 非当前行把 cursor 传 -1（全未念）或 Infinity（全已念），这样只有当前行会跟着重绘。
// 繁体页的字已经整行转好（t.dch），加 data-keep-script 免得全站转换再逐字转一遍。
import { computed, inject, ref } from 'vue'

const props = defineProps({
  tokens: { type: Array, required: true },
  cursor: { type: Number, default: -1 },
})
defineEmits(['pick'])
const ruby = inject('njRuby', ref('pinyin'))
const keep = computed(() => props.tokens.some((t) => t.dch))
</script>

<template>
  <span class="sl" :class="`sl-${ruby}`" :data-keep-script="keep ? '' : null"><template v-for="(t, i) in tokens" :key="i"><span
        v-if="t.u !== undefined && ruby === 'none'"
        class="sl-ch"
        :class="{ done: t.u < cursor, cur: t.u === cursor }"
        @click="$emit('pick', t.u)"
      >{{ t.dch || t.ch }}</span><ruby
        v-else-if="t.u !== undefined"
        class="sl-ch"
        :class="{ done: t.u < cursor, cur: t.u === cursor }"
        @click="$emit('pick', t.u)"
      >{{ t.dch || t.ch }}<rt v-if="ruby === 'zhuyin'" class="sl-zy">{{ t.zy }}</rt><rt v-else-if="ruby === 'pinyin'">{{ t.py }}</rt></ruby><span v-else class="sl-p">{{ t.dch || t.ch }}</span></template></span>
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
/* 注音：符号是全角宽，字号略小一点，邻字的注音不挤在一起 */
.sl-ch rt.sl-zy {
  font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif;
  font-size: 0.44em;
  letter-spacing: -0.06em;
}
.sl-zhuyin .sl-ch { margin: 0 0.04em; }
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
