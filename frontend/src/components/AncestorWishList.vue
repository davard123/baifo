<script setup>
defineProps({
  wishes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: '暂时还没有祭拜记录。' }
})
</script>

<template>
  <div class="wish-list">
    <div v-if="loading" class="state-msg">加载中…</div>
    <div v-else-if="!wishes.length" class="state-msg empty">{{ emptyMessage }}</div>
    <div v-else class="wish-items">
      <div v-for="w in wishes" :key="w.id" class="wish-item ancestor" :class="{ 'has-ancestor': !!w.ancestor }">
        <div class="wish-meta">
          <span class="wish-user">
            <span v-if="w.age">{{ w.age }}岁的</span>
            {{ w.username }}
            <span v-if="w.ancestor">为先{{ w.relationship }}{{ w.ancestor_name }}祭拜</span>
            <span v-else-if="w.target">祝{{ w.target }}</span>
          </span>
          <span v-if="w.ancestor" class="wish-buddha">{{ w.ancestor_name }}</span>
          <span v-else-if="w.blessing" class="wish-buddha">{{ w.blessing }}</span>
          <span v-else-if="w.buddha" class="wish-buddha">{{ w.buddha }}</span>
        </div>
        <p class="wish-text">{{ w.wish }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.state-msg {
  text-align: center;
  color: var(--text-muted);
  padding: 24px 0;
  font-size: 0.92rem;
}

.wish-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wish-item.ancestor {
  padding: 14px 18px;
  border-radius: 10px;
  background: rgba(50, 40, 35, 0.06);
  border-left: 3px solid rgba(120, 100, 80, 0.4);
}

.wish-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.wish-user {
  color: var(--text);
  font-weight: 600;
}
.wish-buddha {
  color: var(--accent);
  font-size: 0.8rem;
  background: rgba(120, 100, 80, 0.1);
  padding: 1px 8px;
  border-radius: 10px;
}
.wish-text {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-muted);
}
</style>
