<script setup>
// 家人从邀请链接（?invite=1）点进来时，页面顶部的一句说明
import { computed } from 'vue'
import { inviteBanner } from '../utils/familyCare.js'

const props = defineProps({
  kind: { type: String, default: 'ancestor' },
  slug: { type: String, default: '' },
  subject: { type: String, default: '' },
  actionLabel: { type: String, default: '开始' },
})
const emit = defineEmits(['start', 'close'])
const message = computed(() => inviteBanner(props.kind, props.slug, props.subject))
</script>

<template>
  <div class="invite-banner" role="status">
    <p>{{ message }}</p>
    <div class="invite-banner__actions">
      <button type="button" class="invite-banner__go" @click="emit('start')">{{ actionLabel }}</button>
      <button type="button" class="invite-banner__close" aria-label="关闭提示" @click="emit('close')">×</button>
    </div>
  </div>
</template>

<style scoped>
.invite-banner {
  position: absolute;
  top: calc(124px + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: min(460px, calc(100% - 32px));
  z-index: 6;
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(242, 200, 121, 0.35);
  background: rgba(24, 17, 12, 0.9);
  color: var(--gold-light);
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: center;
}
.invite-banner__actions { display: flex; justify-content: center; gap: 10px; }
.invite-banner__go {
  min-height: 40px;
  padding: 6px 22px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  color: #2a1c0c;
  font-weight: 600;
  cursor: pointer;
}
.invite-banner__close { width: 40px; border: none; background: none; color: var(--text-muted); font-size: 1.3rem; cursor: pointer; }
</style>
