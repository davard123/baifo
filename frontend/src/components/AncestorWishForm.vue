<script setup>
import { ref, onMounted } from 'vue'
import { saveField, getField, saveGlobal, getGlobal } from '../utils/localPhoto.js'

const props = defineProps({
  slug:                 { type: String, required: true },
  defaultWish:          { type: String, default: '' },
  defaultAncestorName:  { type: String, default: '' },
  defaultRelationship:  { type: String, default: '' }
})
const emit = defineEmits(['submit'])

const username     = ref('')
const age          = ref(50)
const ancestorName = ref('')
const relationship = ref('')
const wish         = ref('')
const loading      = ref(false)
const error        = ref('')

const RELATIONSHIPS = ['父亲', '母亲', '祖父', '祖母', '配偶', '子女', '先祖', '其他']

onMounted(() => {
  // 全局字段（跨所有先祖页面共用）
  username.value = getGlobal('username') || ''
  const savedAge = getGlobal('age')
  if (savedAge) age.value = Number(savedAge)

  // per-slug 字段（每位先祖独立保存）
  ancestorName.value = getField(props.slug, 'ancestorName') || props.defaultAncestorName || ''
  relationship.value = getField(props.slug, 'relationship') || props.defaultRelationship || ''
  wish.value         = getField(props.slug, 'wish')         || props.defaultWish         || ''
})

// 每次字段变化都实时保存
function onUsernameChange()     { saveGlobal('username', username.value) }
function onAgeChange()          { saveGlobal('age', age.value) }
function onAncestorNameChange() { saveField(props.slug, 'ancestorName', ancestorName.value) }
function onRelationshipChange() { saveField(props.slug, 'relationship', relationship.value) }
function onWishChange()         { saveField(props.slug, 'wish', wish.value) }

async function handleSubmit() {
  error.value = ''
  if (!username.value.trim())      { error.value = '请填写您的姓名。'; return }
  if (!age.value || age.value <= 0){ error.value = '请填写正确的年龄。'; return }
  if (!ancestorName.value.trim())  { error.value = '请填写先人姓名。'; return }
  if (!relationship.value)         { error.value = '请选择与先人的关系。'; return }
  if (!wish.value.trim())          { error.value = '请填写祈祷内容。'; return }

  loading.value = true
  try {
    await emit('submit', {
      username:      username.value.trim(),
      age:           Number(age.value),
      ancestor_name: ancestorName.value.trim(),
      relationship:  relationship.value,
      wish:          wish.value.trim()
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
    <p class="form-hint">祈祷回向</p>
    <form @submit.prevent="handleSubmit">
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

      <div class="row-two">
        <input
          v-model="ancestorName"
          type="text"
          placeholder="先人姓名（必填）"
          maxlength="20"
          class="field"
          @input="onAncestorNameChange"
        />
        <select v-model="relationship" class="field rel-field" @change="onRelationshipChange">
          <option value="">关系</option>
          <option v-for="r in RELATIONSHIPS" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>

      <textarea
        v-model="wish"
        placeholder="祈祷文（可修改）"
        maxlength="300"
        class="field wish-field"
        @input="onWishChange"
      ></textarea>

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

.row-two {
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: 10px;
  margin-bottom: 10px;
}
.rel-field { appearance: auto; }

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
  margin-bottom: 14px;
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
</style>
