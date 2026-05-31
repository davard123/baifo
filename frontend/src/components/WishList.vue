<script setup>
function formatWishTime(value) {
  if (!value) return ''
  const date = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function isAncestorWish(wish) {
  return wish?.record_type === 'ancestor' || !!wish?.ancestor_name || !!wish?.ancestor
}

defineProps({
  wishes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: {
    type: String,
    default: '暂时还没有祈愿记录，成为第一位留下礼佛心愿的人吧。',
  },
})
</script>

<template>
  <div class="wish-list">
    <p v-if="loading" class="state-msg" aria-live="polite">加载中...</p>
    <p v-else-if="!wishes.length" class="state-msg empty">{{ emptyMessage }}</p>
    <ul v-else class="wish-items" role="list">
      <li
        v-for="wish in wishes"
        :key="wish.record_key || `${isAncestorWish(wish) ? 'ancestor' : 'wish'}-${wish.id}`"
        class="wish-item"
        :class="{ ancestor: isAncestorWish(wish) }"
      >
        <div class="wish-meta">
          <p class="wish-user">
            <span v-if="wish.age">{{ wish.age }} 岁的 </span>
            {{ wish.username }}
            <span v-if="wish.ancestor"> 为先 {{ wish.relationship }}{{ wish.ancestor_name }} 祭拜</span>
            <span v-else-if="wish.target"> 为 {{ wish.target }} 祈福</span>
          </p>

          <div class="wish-meta__aux">
            <time v-if="wish.created_at" class="wish-time">{{ formatWishTime(wish.created_at) }}</time>
            <span v-if="wish.ancestor" class="wish-tag ancestor-tag">{{ wish.ancestor_name }}</span>
            <span v-else-if="wish.blessing" class="wish-tag">{{ wish.blessing }}</span>
            <span v-else-if="wish.buddha" class="wish-tag">{{ wish.buddha }}</span>
          </div>
        </div>
        <p class="wish-text">{{ wish.wish }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.state-msg {
  text-align: center;
  color: var(--text-muted);
  padding: 32px 0;
  font-size: 0.95rem;
  line-height: 1.7;
}

.wish-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
  list-style: none;
}

.wish-item {
  background: rgba(255, 250, 240, 0.6);
  border: 1px solid rgba(212, 168, 67, 0.15);
  border-radius: 12px;
  padding: 14px 18px;
  transition: box-shadow 0.2s ease;
}

.wish-item:hover {
  box-shadow: 0 4px 16px rgba(68, 43, 17, 0.08);
}

.wish-item.ancestor {
  background: rgba(50, 40, 35, 0.05);
  border-color: rgba(120, 100, 80, 0.2);
  border-left: 3px solid rgba(120, 100, 80, 0.4);
}

.wish-item.ancestor .wish-user {
  color: #5a4a3a;
}

.wish-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.wish-user {
  min-width: 0;
  font-weight: 600;
  color: var(--accent);
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.wish-user span {
  font-weight: 400;
  color: var(--text-muted);
}

.wish-meta__aux {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.wish-time {
  color: var(--text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

.wish-tag {
  font-size: 0.78rem;
  color: var(--gold);
  background: rgba(212, 168, 67, 0.1);
  padding: 3px 8px;
  border-radius: 999px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.ancestor-tag {
  background: rgba(120, 100, 80, 0.12);
  color: #5a4a3a;
}

.wish-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.85;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .wish-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .wish-meta__aux {
    justify-content: flex-start;
  }
}
</style>
