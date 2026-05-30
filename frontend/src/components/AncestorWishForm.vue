<script setup>
import { ref, onMounted } from 'vue'
import { saveField, getField, saveGlobal, getGlobal } from '../utils/localPhoto.js'
import { getViewerProfile, saveViewerProfile } from '../utils/viewerProfile.js'

const props = defineProps({
  slug:                 { type: String, required: true },
  defaultWish:          { type: String, default: '' },
  defaultAncestorName:  { type: String, default: '' },
  defaultRelationship:  { type: String, default: '' },
  onSubmit:             { type: Function, default: null }
})
const emit = defineEmits(['submit'])

const username     = ref('')
const age          = ref(50)
const wish         = ref('')
const email        = ref('')
const loading      = ref(false)
const error        = ref('')

onMounted(() => {
  const viewer = getViewerProfile()
  username.value = viewer.username || getGlobal('username') || ''
  if (viewer.age) age.value = viewer.age
  else {
    const savedAge = getGlobal('age')
    if (savedAge) age.value = Number(savedAge)
  }

  // per-slug 字段（每位先祖独立保存）
  wish.value = getField(props.slug, 'wish') || props.defaultWish || ''
})

// 每次字段变化都实时保存
function onUsernameChange()     { saveGlobal('username', username.value) }
function onAgeChange()          { saveGlobal('age', age.value) }
function onWishChange()         { saveField(props.slug, 'wish', wish.value) }

async function handleSubmit() {
  if (loading.value) return

  error.value = ''
  if (!username.value.trim())      { error.value = '请填写您的姓名。'; return }
  if (!age.value || age.value <= 0){ error.value = '请填写正确的年龄。'; return }
  if (!wish.value.trim())          { error.value = '请填写祈祷内容。'; return }

  loading.value = true
  try {
    saveViewerProfile(username.value.trim(), age.value)
    const payload = {
      username:      username.value.trim(),
      age:           Number(age.value),
      ancestor_name: props.defaultAncestorName.trim(),
      relationship:  props.defaultRelationship,
      wish:          wish.value.trim(),
      ...(email.value.trim() ? { email: email.value.trim() } : {})
    }

    if (props.onSubmit) {
      await props.onSubmit(payload)
    } else {
      emit('submit', payload)
    }
  } catch (e) {
    error.value = e.message || '提交失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="wish-form">
    <p class="form-hint">祈祷回向</p>
    <form @submit.prevent="handleSubmit">
      <div class="selection-summary">
        <div class="summary-item">
          <span class="summary-label">已选牌位</span>
          <strong>{{ defaultAncestorName }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">祭拜关系</span>
          <strong>{{ defaultRelationship || '其他' }}</strong>
        </div>
      </div>

      <div class="row-two">
        <input
          v-model="username"
          type="text"
          placeholder="您的姓名"
          maxlength="20"
          class="field"
          autocomplete="nickname"
          @input="onUsernameChange"
        />
        <input
          v-model="age"
          type="number"
          min="1"
          max="150"
          placeholder="年龄"
          class="field age-field"
          autocomplete="off"
          @change="onAgeChange"
        />
      </div>

      <textarea
        v-model="wish"
        placeholder="祈祷文（可修改）"
        maxlength="300"
        class="field wish-field"
        @input="onWishChange"
      ></textarea>

      <input
        v-model="email"
        type="email"
        placeholder="邮箱（选填）— 填写后可收到祭祖确认邮件"
        class="field email-field"
        autocomplete="email"
      />

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button type="submit" class="submit-btn" :disabled="loading">
        <span v-if="loading">提交中…</span>
        <span v-else>🙏 祭毕，回向先人</span>
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

.selection-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.summary-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(120, 100, 80, 0.08);
  border: 1px solid rgba(120, 100, 80, 0.15);
}

.summary-label {
  display: block;
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.summary-item strong {
  color: var(--text);
  font-size: 0.92rem;
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
  border: 1px solid rgba(120, 100, 80, 0.4);
  border-radius: 10px;
  background: rgba(240, 235, 225, 0.7);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.field:focus {
  border-color: #8a7a6a;
  box-shadow: 0 0 0 3px rgba(120, 100, 80, 0.12);
}
.age-field { text-align: center; }

.wish-field {
  height: 100px;
  resize: vertical;
  line-height: 1.7;
  margin-bottom: 10px;
}

.email-field {
  margin-bottom: 14px;
  font-size: 0.85rem;
}

.error-msg {
  color: #8b2020;
  font-size: 0.85rem;
  margin-bottom: 10px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #5a4030, #7a5840);
  color: #f0ece4;
  font-size: 1rem;
  letter-spacing: 0.08em;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(60, 40, 20, 0.3);
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(60, 40, 20, 0.35);
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 560px) {
  .selection-summary {
    grid-template-columns: 1fr;
  }
}
</style>
