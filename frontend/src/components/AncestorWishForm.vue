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

// 年度追思提醒。默认关闭：后端订阅表和定时任务上线前，
// 不能先在界面上给用户一个兑现不了的承诺。
// 启用方式：构建时设置 VITE_REMINDERS=on
const remindersEnabled = import.meta.env.VITE_REMINDERS === 'on'
const remind      = ref(false)
const deathMonth  = ref('')
const deathDay    = ref('')

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
      ...(email.value.trim() ? { email: email.value.trim() } : {}),
      ...(remindersEnabled && remind.value && deathMonth.value && deathDay.value
        ? { remind: true, death_month: Number(deathMonth.value), death_day: Number(deathDay.value) }
        : {})
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
        <div class="field-block">
          <label class="field-label" for="ancestor-name">您的姓名</label>
          <input
            id="ancestor-name"
            v-model="username"
            type="text"
            placeholder="如：张明"
            maxlength="20"
            class="field"
            autocomplete="nickname"
            required
            @input="onUsernameChange"
          />
        </div>
        <div class="field-block">
          <label class="field-label" for="ancestor-age">年龄</label>
          <input
            id="ancestor-age"
            v-model="age"
            type="number"
            min="1"
            max="150"
            inputmode="numeric"
            placeholder="年龄"
            class="field age-field"
            autocomplete="off"
            required
            @change="onAgeChange"
          />
        </div>
      </div>

      <div class="field-block">
        <label class="field-label" for="ancestor-wish">祈祷文（可修改）</label>
        <textarea
          id="ancestor-wish"
          v-model="wish"
          placeholder="写下想对先人说的话"
          maxlength="300"
          class="field wish-field"
          @input="onWishChange"
        ></textarea>
      </div>

      <div class="field-block">
        <label class="field-label" for="ancestor-email">邮箱（选填）</label>
        <input
          id="ancestor-email"
          v-model="email"
          type="email"
          placeholder="填写后可收到祭祖确认邮件"
          class="field email-field"
          autocomplete="email"
        />
      </div>

      <div v-if="remindersEnabled" class="remind-block">
        <label class="remind-check">
          <input v-model="remind" type="checkbox" />
          <span>每年忌日与清明提醒我回来祭拜</span>
        </label>
        <div v-if="remind" class="remind-date">
          <label class="field-label" for="death-month">忌日</label>
          <div class="remind-date-row">
            <select id="death-month" v-model="deathMonth" class="field">
              <option value="">月</option>
              <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
            </select>
            <select id="death-day" v-model="deathDay" class="field" aria-label="忌日（日）">
              <option value="">日</option>
              <option v-for="d in 31" :key="d" :value="d">{{ d }} 日</option>
            </select>
          </div>
          <p class="remind-note">需要填写上面的邮箱。每年最多两封，随时可在邮件里一键退订。</p>
        </div>
      </div>

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
  align-items: end;
}

/* 之前四个输入框只有 placeholder：一开始输入提示就消失了，
   年龄那格填完只剩一个数字，回头也看不出是什么；屏幕阅读器同样拿不到字段名。 */
.field-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  margin-bottom: 10px;
}

.row-two .field-block {
  margin-bottom: 0;
}

.field-label {
  font-size: 0.74rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

.remind-block {
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(242, 200, 121, 0.16);
  border-radius: 12px;
  background: rgba(255, 248, 233, 0.04);
}

.remind-check {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.84rem;
  color: var(--text);
  cursor: pointer;
}

.remind-check input {
  width: 16px;
  height: 16px;
  accent-color: var(--gold);
  flex-shrink: 0;
}

.remind-date {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.remind-date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.remind-note {
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.field {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(120, 100, 80, 0.4);
  border-radius: 10px;
  background: rgba(255, 248, 233, 0.07);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.field:focus {
  border-color: var(--text-muted);
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
  color: #f2a3a3;
  font-size: 0.85rem;
  margin-bottom: 10px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #e0b76e, #f0d091);
  color: #2a1c0c;
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
