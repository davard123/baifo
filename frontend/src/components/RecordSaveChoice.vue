<script setup>
const choice = defineModel({ type: String, default: '' })
defineProps({ disabled: Boolean })
</script>

<template>
  <fieldset class="record-save-choice" :disabled="disabled">
    <legend>这份祈愿给谁看</legend>
    <label><input v-model="choice" type="radio" value="public" required /> 公开到心愿墙，让大家一起见证</label>
    <label><input v-model="choice" type="radio" value="local" required /> 只有我自己能看</label>
    <p v-if="choice === 'public'" class="public-note">确认后，这条内容将公开给所有访客查看。名字只显示第一个字（例如“王**”），不显示年龄和邮箱。请不要写电话、地址等隐私。</p>
    <p v-else>只存在这台手机或电脑上，换一台设备就看不到了。</p>
  </fieldset>
</template>

<style scoped>
.record-save-choice { margin: 12px 0; padding: 12px; border: 1px solid var(--accent, #c8a96e); border-radius: 10px; min-width: 0; }
legend { font-size: .85rem; }
label { display: flex; gap: 8px; align-items: flex-start; padding: 8px 0; font-size: .9rem; }
input { width: auto; flex-shrink: 0; margin-top: 4px; }
p { font-size: .78rem; line-height: 1.6; margin: 5px 0; color: var(--text-muted); }
.public-note { color: var(--accent, #c8a96e); }
</style>
