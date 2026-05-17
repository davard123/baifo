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
    hour12: false
  }).format(date)
}

function isAncestorWish(wish) {
  return wish?.record_type === 'ancestor' || !!wish?.ancestor_name || !!wish?.ancestor
}

defineProps({
  wishes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: '暂时还没有祈愿记录，成为第一位礼佛发愿的人吧。🪷' }
})
</script>

<template>
  <div class="wish-list">
    <div v-if="loading" class="state-msg">加载中…</div>
    <div v-else-if="!wishes.length" class="state-msg empty">{{ emptyMessage }}</div>
    <div v-else class="wish-items">
      <div v-for="w in wishes" :key="w.record_key || `${isAncestorWish(w) ? 'ancestor' : 'wish'}-${w.id}`" class="wish-item" :class="{ ancestor: isAncestorWish(w) }">
        <div class="wish-meta">
          <span class="wish-user">
            <span v-if="w.age">{{ w.age }}岁的</span>
            {{ w.username }}
            <span v-if="w.ancestor">为先{{ w.relationship }}{{ w.ancestor_name }}祭拜</span>
            <span v-else-if="w.target">祝{{ w.target }}</span>
          </span>
          <span v-if="w.created_at" class="wish-time">{{ formatWishTime(w.created_at) }}</span>
          <span v-if="w.ancestor" class="wish-buddha ancestor-tag">{{ w.ancestor_name }}</span>
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
  padding: 32px 0;
  font-size: 0.95rem;
}

.wish-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wish-item {
  background: rgba(255, 250, 240, 0.6);
  border: 1px solid rgba(212, 168, 67, 0.15);
  border-radius: 10px;
  padding: 14px 18px;
  transition: box-shadow 0.2s;
}
.wish-item:hover { box-shadow: 0 4px 16px rgba(68, 43, 17, 0.08); }
.wish-item.ancestor {
  background: rgba(50, 40, 35, 0.05);
  border-color: rgba(120, 100, 80, 0.2);
  border-left: 3px solid rgba(120, 100, 80, 0.4);
}
.wish-item.ancestor .wish-user { color: #5a4a3a; }
.ancestor-tag { background: rgba(120, 100, 80, 0.12) !important; color: #5a4a3a !important; }

.wish-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}
.wish-user { font-weight: 600; color: var(--accent); }
.wish-user span { font-weight: normal; color: var(--text-muted); }
.wish-time {
  color: var(--text-muted);
  font-size: 0.78rem;
}
.wish-buddha {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--gold);
  background: rgba(212, 168, 67, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.wish-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.75;
}
</style>
