<script setup>
// 书页的一页：经题块（第 1 页）+ 若干组小段（段落或偈颂）。页面真正显示和「量高度」都用它，保证两边排版一样。
import SutraLine from './SutraLine.vue'
import SutraHeader from './SutraHeader.vue'

const props = defineProps({
  header: { type: Object, default: null },
  note: { type: String, default: '' },
  intro: { type: String, default: '' },
  showHeader: { type: Boolean, default: false },
  // 经题块不在最前时（地藏经卷首仪文之后），放在这个小段（idx）所在组的前面；0 = 照常放在第 1 页顶上
  headerSeg: { type: Number, default: 0 },
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
    <SutraHeader v-if="showHeader && header && !headerSeg" :header="header" :note="note" :intro="intro" data-sp-header />
    <template v-for="g in groups" :key="g.segs[0].start">
      <SutraHeader v-if="header && headerSeg && g.segs[0].idx === headerSeg" :header="header" :note="note" :intro="intro" :data-hd-for="headerSeg" data-sp-header />
      <p v-if="g.heading" class="nj-hd" :data-hd-for="g.segs[0].idx">{{ g.heading }}<span v-if="g.times" class="nj-times">（{{ g.times }}）</span></p>
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
.nj-para { margin: 0 0 0.25em; line-height: var(--nj-lh, 2); }
.nj-ln {
  border-radius: 6px;
  padding: 0 2px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background 0.3s;
}
.nj-ln.now { background: rgba(230, 184, 102, 0.34); }
.nj-hd {
  margin: 0.8em 0 0.2em;
  text-align: center;
  font-size: 0.8em;
  font-weight: 700;
  color: #7a2a1c;
  line-height: 1.8;
}
/* 篇名后的「（三遍）」：小号灰字，只是提示 */
.nj-times { margin-left: 0.2em; font-size: 0.62em; font-weight: 400; color: #9a8f84; }
.nj-verse { margin: 0 0 0.3em; }
.nj-vrow { margin: 0; text-align: center; line-height: var(--nj-lh, 2); }
.nj-vrow.gap { margin-top: 0.35em; }
.nj-vrow .nj-ln { display: inline-block; }
</style>
