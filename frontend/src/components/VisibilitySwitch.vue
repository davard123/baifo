<script setup>
// 「这份祈愿给谁看」：一行二选一，默认「只有我自己看」。祭祖页、求财页共用（礼佛页的 WishForm 里有同样的一份）。
const choice = defineModel({ type: String, default: 'local' })
defineProps({ disabled: Boolean })
</script>

<template>
  <div class="vis-switch" role="radiogroup" aria-label="这份祈愿给谁看">
    <button type="button" role="radio" :aria-checked="choice === 'local'" :class="{ on: choice === 'local' }" :disabled="disabled" @click="choice = 'local'">只有我自己看</button>
    <button type="button" role="radio" :aria-checked="choice === 'public'" :class="{ on: choice === 'public' }" :disabled="disabled" @click="choice = 'public'">公开到心愿墙</button>
  </div>
  <p v-if="choice === 'public'" class="vis-note public-note">确认后，这条内容将公开给所有访客查看。名字只显示第一个字（例如“王**”），不显示年龄和邮箱。请不要写电话、地址等隐私。</p>
</template>

<style scoped>
.vis-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin: 4px 0 6px;
}
.vis-switch button {
  min-height: 40px;
  border: 1px solid rgba(242, 200, 121, 0.3);
  border-radius: 10px;
  background: transparent;
  color: var(--accent, #f3dcae);
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
}
.vis-switch button.on {
  background: rgba(224, 183, 110, 0.2);
  border-color: var(--gold, #d4a843);
  font-weight: 700;
}
.vis-switch button:disabled { opacity: 0.6; cursor: not-allowed; }
.vis-note {
  font-size: 0.74rem;
  line-height: 1.6;
  margin: 0 0 8px;
  color: var(--text-muted);
}
.public-note { color: var(--accent, #c8a96e); }
</style>
