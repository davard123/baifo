<script setup>
defineProps({
  wishes: { type: Array, default: () => [] }
})
</script>

<template>
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
</template>

<style scoped>
.wish-item.ancestor {
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
