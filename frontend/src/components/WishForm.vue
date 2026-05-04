<script setup>
import { ref } from 'vue'

const props = defineProps({
  defaultWish: { type: String, default: '' }
})
const emit = defineEmits(['submit'])

const username = ref('')
const age = ref(50)
const wish = ref(props.defaultWish)
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  if (!username.value.trim()) { error.value = '请填写用户名。'; return }
  if (!age.value || age.value <= 0) { error.value = '请填写正确的年龄。'; return }
  if (!wish.value.trim()) { error.value = '请填写祈愿内容。'; return }

  loading.value = true
  try {
    await emit('submit', {
      username: username.value.trim(),
      age: Number(age.value),
      wish: wish.value.trim()
    })
  } catch (e) {
    error.value = e.message || '提交失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="wish-form">
    <p class="form-hint">发愿回向</p>
    <form @submit.prevent="handleSubmit">
      <div class="row-two">
        <input
          v-model="username"
          type="text"
          placeholder="您的法名/姓名"
          maxlength="20"
          class="field"
        />
        <input
          v-model="age"
          type="number"
          min="1"
          max="150"
          placeholder="年龄"
          class="field age-field"
        />
      </div>
      <textarea
        v-model="wish"
        placeholder="愿文（可修改）"
        maxlength="300"
        class="field wish-field"
      ></textarea>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button type="submit" class="submit-btn" :disabled="loading">
        <span v-if="loading">提交中…</span>
        <span v-else>🙏 礼毕，回向众生</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.form-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: 0.06em;
}

.row-two {
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: 10px;
  margin-bottom: 10px;
}

.field {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(196, 154, 108, 0.4);
  border-radius: 10px;
  background: rgba(255, 250, 240, 0.7);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.field:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.12);
}
.age-field { text-align: center; }

.wish-field {
  height: 110px;
  resize: vertical;
  line-height: 1.7;
  margin-bottom: 14px;
}

.error-msg {
  color: #c0392b;
  font-size: 0.85rem;
  margin-bottom: 10px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #7f5a36, #a07040);
  color: #fff8ee;
  font-size: 1rem;
  letter-spacing: 0.08em;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(127, 90, 54, 0.3);
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(127, 90, 54, 0.35);
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
