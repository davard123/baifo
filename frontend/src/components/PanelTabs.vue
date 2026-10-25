<script setup>
// 供养面板顶部的两页切换：操作（供养、祈愿）和说明分开，操作不再被长说明埋在下面
const model = defineModel({ type: String, default: 'do' })
defineProps({
  doLabel: { type: String, default: '供养 · 祈愿' },
  readLabel: { type: String, default: '说明' },
})
</script>

<template>
  <div class="panel-tabs" role="tablist" aria-label="面板内容">
    <button type="button" role="tab" :aria-selected="model === 'do'" :class="{ on: model === 'do' }" @click="model = 'do'">{{ doLabel }}</button>
    <button type="button" role="tab" :aria-selected="model === 'read'" :class="{ on: model === 'read' }" @click="model = 'read'">{{ readLabel }}</button>
  </div>
</template>

<style scoped>
.panel-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin: 8px 0 14px;
  padding: 6px;
  border-radius: 14px;
  background: rgba(24, 17, 12, 0.94);
}
.panel-tabs button {
  min-height: 44px;
  border: 1px solid rgba(242, 200, 121, 0.25);
  border-radius: 10px;
  background: transparent;
  color: var(--accent, #f3dcae);
  font-size: 0.95rem;
  cursor: pointer;
}
.panel-tabs button.on {
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  color: #2a1c0c;
  font-weight: 700;
  border-color: transparent;
}
</style>
