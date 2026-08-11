<script setup>
const props = defineProps({
  title: { type: String, default: '页面未找到' },
  message: {
    type: String,
    default: '这个地址当前没有对应内容。你可以返回首页，或改从站内已有的礼佛、祭祖与指南页面继续浏览。',
  },
})
</script>

<template>
  <main class="not-found-shell">
    <section class="not-found-card card">
      <p class="eyebrow">404</p>
      <h1>{{ title }}</h1>
      <p class="message">{{ message }}</p>
      <div class="actions">
        <router-link to="/" class="action-link">返回首页</router-link>
        <router-link to="/guide/overview" class="action-link secondary">查看使用说明</router-link>
      </div>
    </section>
  </main>
</template>

<style scoped>
.not-found-shell {
  min-height: 70vh;
  display: grid;
  place-items: center;
  padding: 24px 16px 64px;
}

.not-found-card {
  width: min(680px, 100%);
  text-align: center;
  padding: 32px 24px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--gold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

h1 {
  margin: 0 0 12px;
  color: var(--accent);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.message {
  margin: 0 auto;
  max-width: 42rem;
  color: var(--text-muted);
  line-height: 1.8;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
}

.action-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 132px;
  padding: 11px 16px;
  border-radius: 999px;
  text-decoration: none;
  background: var(--accent);
  color: #2a1c0c;
}

.action-link.secondary {
  background: rgba(212, 168, 67, 0.12);
  color: var(--accent);
}
</style>
