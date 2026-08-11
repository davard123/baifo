<script setup>
// 提交祈愿/祭拜成功后的回向收尾。
// 此前佛菩萨页和先人页提交成功即 router.push 跳走，用户没有任何确认，
// 而祈福池却有完整的 done 状态 —— 这个组件把两边拉齐。
defineProps({
  // 'buddha' | 'ancestor'
  kind: { type: String, default: 'buddha' },
  // 观音菩萨 / 先父
  subjectName: { type: String, default: '' },
  name: { type: String, default: '' },
  age: { type: [String, Number], default: '' },
  wish: { type: String, default: '' },
  email: { type: String, default: '' },
  // [{ label, to }]
  actions: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="dedication-done" role="status" aria-live="polite">
    <p class="done-mark" aria-hidden="true">🙏</p>

    <h2 class="done-title">
      {{ kind === 'ancestor' ? '回向已完成' : '祈愿已送达' }}
    </h2>

    <p class="done-who">
      <template v-if="age">{{ age }} 岁的 </template>{{ name }}
      <template v-if="kind === 'ancestor'">向 {{ subjectName }} 敬献了这份追思</template>
      <template v-else>向 {{ subjectName }} 留下了这份祈愿</template>
    </p>

    <blockquote class="done-wish">{{ wish }}</blockquote>

    <p v-if="email" class="done-email">
      确认邮件将发送至 {{ email }}
    </p>

    <div class="done-actions">
      <router-link
        v-for="action in actions"
        :key="action.to"
        :to="action.to"
        class="done-btn"
        :class="{ 'done-btn--primary': action.primary }"
      >
        {{ action.label }}
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.dedication-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  padding: 30px 22px 26px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(44, 30, 58, 0.94), rgba(24, 17, 34, 0.96));
  border: 1px solid rgba(242, 200, 121, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 240, 214, 0.06);
  animation: doneIn 0.5s ease both;
}

@keyframes doneIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.done-mark {
  font-size: 2rem;
  line-height: 1;
}

.done-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--gold-light);
  letter-spacing: 0.08em;
}

.done-who {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.7;
}

.done-wish {
  margin: 4px 0;
  padding: 14px 18px;
  border-left: 3px solid var(--gold);
  background: rgba(255, 248, 233, 0.05);
  border-radius: 0 12px 12px 0;
  color: var(--text);
  font-size: 0.98rem;
  line-height: 1.9;
  text-align: left;
  max-width: 34em;
  overflow-wrap: anywhere;
}

.done-email {
  font-size: 0.8rem;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.done-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 6px;
}

.done-btn {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid rgba(242, 200, 121, 0.3);
  background: rgba(255, 248, 233, 0.06);
  color: var(--accent);
  font-size: 0.88rem;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.done-btn:hover {
  background: rgba(242, 200, 121, 0.14);
  border-color: var(--gold);
}

.done-btn--primary {
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  border-color: transparent;
  color: #2a1c0c;
  font-weight: 600;
}

.done-btn--primary:hover {
  background: linear-gradient(135deg, #e8c47e, #f5daa2);
}

@media (prefers-reduced-motion: reduce) {
  .dedication-done { animation: none; }
}
</style>
