<script setup>
// 书页的一页：经题块（第 1 页）+ 若干组小段（段落或偈颂）。页面真正显示和「量高度」都用它，保证两边排版一样。
import SutraLine from './SutraLine.vue'
import SutraHeader from './SutraHeader.vue'

const props = defineProps({
  header: { type: Object, default: null },
  note: { type: String, default: '' },
  showHeader: { type: Boolean, default: false },
  groups: { type: Array, required: true },
  lineIndex: { type: Number, default: -1 },
  cursor: { type: Number, default: -1 },
})
defineEmits(['pick'])

function cursorFor(seg) {
  if (props.cursor >= seg.end) return Infinity
  if (props.cursor < seg.start) return -1
  return props.cursor
}
</script>

<template>
  <div class="sp">
    <SutraHeader v-if="showHeader && header" :header="header" :note="note" data-sp-header />
    <template v-for="g in groups" :key="g.segs[0].start">
      <p v-if="g.heading" class="nj-hd" :data-hd-for="g.segs[0].idx">{{ g.heading }}</p>
      <p v-if="g.kind === 'para'" class="nj-para"><template v-for="sg in g.segs" :key="sg.start"><span class="nj-sg" :data-sg="sg.idx"><span
        v-for="pt in sg.parts"
        :key="pt.line + '-' + pt.tokens[0].u"
        :data-line="pt.line"
        class="nj-ln"
        :class="{ now: pt.line === lineIndex }"
      ><SutraLine :tokens="pt.tokens" :cursor="cursorFor(sg)" @pick="$emit('pick', $event)" /></span></span></template></p>
      <div v-else class="nj-verse">
        <p v-for="sg in g.segs" :key="sg.start" class="nj-vrow" :class="{ gap: sg.gapBefore }" :data-sg="sg.idx"><template v-for="(pt, k) in sg.parts" :key="pt.line"><template v-if="k">　</template><span
          :data-line="pt.line"
          class="nj-ln"
          :class="{ now: pt.line === lineIndex }"
        ><SutraLine :tokens="pt.tokens.filter((t) => !t.sep)" :cursor="cursorFor(sg)" @pick="$emit('pick', $event)" /></span></template></p>
      </div>
    </template>
  </div>
</template>

<style>
/* 提词器和书页共用（不加 scoped） */
.nj-para { margin: 0 0 0.5em; line-height: 2.25; }
.nj-ln {
  border-radius: 6px;
  padding: 0 2px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background 0.3s;
}
.nj-ln.now { background: rgba(230, 184, 102, 0.34); }
.nj-hd {
  margin: 1.3em 0 0.4em;
  text-align: center;
  font-size: 0.8em;
  font-weight: 700;
  color: #7a2a1c;
  line-height: 1.8;
}
.nj-verse { margin: 0 0 0.6em; }
.nj-vrow { margin: 0; text-align: center; line-height: 2.25; }
.nj-vrow.gap { margin-top: 0.7em; }
.nj-vrow .nj-ln { display: inline-block; }
</style>
