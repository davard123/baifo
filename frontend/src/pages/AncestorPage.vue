<script setup>
import { computed, nextTick, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ANCESTORS } from '../data/ancestors.js'
import AncestorStage from '../components/AncestorStage.vue'
import RitualPanel from '../components/ritual/RitualPanel.vue'
import { useRitual } from '../composables/useRitual.js'
import AncestorWishForm from '../components/AncestorWishForm.vue'
import DedicationDone from '../components/DedicationDone.vue'
import RitualNav from '../components/RitualNav.vue'
import { apiFetch } from '../api.js'
import { getPhoto, getName, getField, saveField, saveName } from '../utils/localPhoto.js'
import {
  buildInscription,
  hasInscription,
  MEMORIAL_NAME_FIELD,
  matchesTemplateInscription,
  normalizeInscription,
  relationshipLabel,
} from '../utils/memorialInscription.js'
import NotFoundPage from './NotFoundPage.vue'

const route = useRoute()

const ancestor = computed(() => ANCESTORS.find(a => a.slug === route.params.slug))
const nextAncestor = computed(() => {
  const index = ANCESTORS.findIndex((item) => item.slug === route.params.slug)
  return ANCESTORS[(index + 1) % ANCESTORS.length]
})

// 提交成功后停在本页展示回向确认，而不是直接跳回列表
const submitted = ref(null)
// 2026-10-15 改成和礼佛页一样：牌位全屏，供养/导航收进右侧抽屉
const drawerOpen = ref(false)
const drawerId = 'ancestor-offering-panel'
const nameInputId = 'ancestor-person-name'

// The old catalogue stored a complete customName string. Keep that string as
// full-text mode unless our separate raw-name field proves it came from the
// template editor introduced here.
const inscriptionMode = ref('name')
const draftPersonName = ref('')
const draftInscription = ref('')
const savedPersonName = ref(null)
const nameInput = ref(null)
const saveState = ref('idle')
const saveError = ref('')
const storageReadWarning = ref('')

function closeDrawer() {
  drawerOpen.value = false
  hydrateInscriptionEditor()
}

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
  if (!drawerOpen.value) hydrateInscriptionEditor()
}

function openNameEditor() {
  drawerOpen.value = true
  saveState.value = 'idle'
  saveError.value = ''
  nextTick(() => nameInput.value?.focus())
}

function markEditorDirty() {
  saveState.value = 'dirty'
  saveError.value = ''
}

function restoreStoredInscription(slug, inscription, personName) {
  // Best-effort rollback keeps the two local fields aligned when a browser
  // rejects the second write (for example because storage quota is exhausted).
  try { saveName(slug, inscription || '') } catch (error) { /* keep error state */ }
  try { saveField(slug, MEMORIAL_NAME_FIELD, personName) } catch (error) { /* keep error state */ }
}

function saveInscription() {
  if (saveState.value === 'saving' || !ancestor.value?.slug) return

  const slug = ancestor.value.slug
  const previousInscription = customName.value
  const previousPersonName = savedPersonName.value
  const nextPersonName = normalizeInscription(draftPersonName.value)
  const nextFullText = normalizeInscription(draftInscription.value)
  let nextInscription = ''

  saveState.value = 'saving'
  saveError.value = ''

  try {
    if (inscriptionMode.value === 'name') {
      nextInscription = nextPersonName
        ? buildInscription(slug, nextPersonName, ancestor.value.title || ancestor.value.name)
        : ''
      saveName(slug, nextInscription)
      saveField(slug, MEMORIAL_NAME_FIELD, nextPersonName || null)
    } else {
      if (!nextFullText) throw new Error('请填写牌位全文，或切换按姓名生成。')
      nextInscription = nextFullText
      saveName(slug, nextInscription)
      saveField(slug, MEMORIAL_NAME_FIELD, null)
    }

    customName.value = nextInscription || null
    // Full-text mode intentionally clears the template marker. Otherwise a
    // later reopen could treat an old raw name as authoritative and rebuild
    // over the explicitly edited inscription.
    savedPersonName.value = inscriptionMode.value === 'name' ? (nextPersonName || null) : null
    draftInscription.value = nextInscription || defaultInscription.value
    saveState.value = 'saved'
  } catch (error) {
    restoreStoredInscription(slug, previousInscription, previousPersonName)
    saveState.value = 'error'
    saveError.value = error?.message === '请填写牌位全文，或切换按姓名生成。'
      ? error.message
      : '未保存：本设备暂时无法写入牌位设置，请检查浏览器本地存储权限后重试。'
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && drawerOpen.value) closeDrawer()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const customPhoto = ref(null)
const customName = ref(null)
const ritual = useRitual('ancestor')

const displayAncestorName = computed(() => {
  const savedInscription = normalizeInscription(customName.value)
  return savedInscription || buildInscription(
    ancestor.value?.slug,
    '',
    ancestor.value?.title || ancestor.value?.name || '先祖之位',
  )
})
const defaultRelationship = computed(() => {
  return relationshipLabel(ancestor.value?.slug)
})

const defaultInscription = computed(() => buildInscription(
  ancestor.value?.slug,
  '',
  ancestor.value?.title || ancestor.value?.name || '先祖之位',
))

const liveInscription = computed(() => {
  if (inscriptionMode.value === 'full') {
    return normalizeInscription(draftInscription.value) || defaultInscription.value
  }
  return buildInscription(
    ancestor.value?.slug,
    draftPersonName.value,
    ancestor.value?.title || ancestor.value?.name || '先祖之位',
  )
})

const isCustomInscription = computed(() => hasInscription(customName.value))
const editorModeDescription = computed(() => inscriptionMode.value === 'full'
  ? '完整牌位文字模式：原有文字会按原样保留。'
  : '姓名模板模式：只在保存时按当前关系生成牌位文字。')

function readLocal(read, fallback, label) {
  try {
    return read()
  } catch (error) {
    storageReadWarning.value = `${label}暂时无法读取，请检查浏览器的本地存储权限。`
    return fallback
  }
}

function hydrateInscriptionEditor() {
  const savedInscription = normalizeInscription(customName.value)
  const rawCandidate = normalizeInscription(savedPersonName.value)
  const rawName = matchesTemplateInscription(
    ancestor.value?.slug,
    rawCandidate,
    savedInscription,
    ancestor.value?.title || ancestor.value?.name || '先祖之位',
  ) ? rawCandidate : ''
  draftPersonName.value = rawName
  draftInscription.value = savedInscription || defaultInscription.value
  // A matching raw name is our explicit marker. Otherwise the old customName
  // stays in full-text mode, even if it happens to look like a person's name.
  inscriptionMode.value = rawName ? 'name' : savedInscription ? 'full' : 'name'
  saveState.value = 'idle'
  saveError.value = ''
}

function syncAncestorState() {
  if (!ancestor.value) return
  storageReadWarning.value = ''
  customPhoto.value = readLocal(
    () => getPhoto(route.params.slug),
    null,
    '个性化照片',
  )
  customName.value = readLocal(
    () => getName(route.params.slug),
    null,
    '牌位文字',
  )
  savedPersonName.value = readLocal(
    () => getField(route.params.slug, MEMORIAL_NAME_FIELD),
    null,
    '先人姓名',
  )
  hydrateInscriptionEditor()
}

function resetStageState() {
  ritual.reset()
}

function applyPageMeta() {
  if (!ancestor.value) return
  const a = ancestor.value
  document.title = `${a.name} 拜祭 | 在线祭拜先人 - fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    `虔诚祭拜${a.name}，${a.subtitle}。${a.desc} 在线发愿，功德回向先人。`
  )
}

watch(
  () => route.params.slug,
  () => {
    syncAncestorState()
    resetStageState()
    submitted.value = null
    drawerOpen.value = false
    applyPageMeta()
  },
  { immediate: true }
)

async function onSubmit(payload) {
  const res = await apiFetch('/ancestor-wishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, ancestor: ancestor.value?.slug }),
  })
  const data = await res.json()
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || '提交失败')
  }
  submitted.value = payload
  drawerOpen.value = true
}

// 顶部导航与提交后面板共用同一组按钮
const doneActions = computed(() => {
  const next = nextAncestor.value
  return [
    { label: '返回首页', to: '/' },
    ...(next ? [{ label: `进入下一页：${next.name}`, to: `/ancestor/${next.slug}/`, primary: true }] : []),
    { label: '进入祈福', to: { path: '/', hash: '#blessing-pool-title' } },
  ]
})
</script>

<template>
  <div v-if="ancestor" class="prayer-shell">
    <div class="prayer-frame">
    <div class="prayer-layout" :class="{ 'drawer-open': drawerOpen }">
      <section class="stage-section card">
        <AncestorStage
          :ancestor="ancestor"
          :custom-photo="customPhoto"
          :custom-name="customName"
          :ritual="ritual"
          @edit-name="openNameEditor"
        />
      </section>

      <button
        type="button"
        class="panel-toggle"
        :class="{ open: drawerOpen }"
        :aria-expanded="drawerOpen"
        :aria-controls="drawerId"
        :aria-label="drawerOpen ? '收起祭祖供养面板' : '打开祭祖供养面板'"
        @click="toggleDrawer"
      >
        {{ drawerOpen ? '收起供养' : '祭祖供养' }}
      </button>

      <button
        v-if="drawerOpen"
        type="button"
        class="drawer-backdrop"
        aria-label="关闭祭祖供养面板"
        @click="closeDrawer"
      ></button>

      <section
        :id="drawerId"
        class="panel-section card"
        :class="{ open: drawerOpen }"
        :aria-hidden="!drawerOpen"
        :inert="!drawerOpen"
      >
        <div class="panel-header">
          <span class="panel-kicker">祭祖供养</span>
          <button type="button" class="panel-close" aria-label="关闭祭祖供养面板" @click="closeDrawer">关闭</button>
        </div>
        <h1 class="namo-title">{{ displayAncestorName }}</h1>
        <section class="inscription-editor" aria-labelledby="inscription-editor-title">
          <div class="editor-title-row">
            <div>
              <p class="editor-kicker">牌位设置</p>
              <h2 id="inscription-editor-title">填写或修改先人姓名</h2>
            </div>
            <span class="editor-state-label">{{ isCustomInscription ? '已设置' : '使用默认' }}</span>
          </div>
          <p class="editor-note">姓名和牌位文字只保存在当前设备。这里的格式是可编辑的展示模板，不代表唯一的传统写法。</p>
          <div class="editor-mode" role="radiogroup" aria-label="牌位编辑方式">
            <label class="editor-mode-option">
              <input v-model="inscriptionMode" type="radio" value="name" @change="markEditorDirty" />
              <span>按先人姓名生成</span>
            </label>
            <label class="editor-mode-option">
              <input v-model="inscriptionMode" type="radio" value="full" @change="markEditorDirty" />
              <span>直接编辑牌位全文</span>
            </label>
          </div>
          <div class="editor-field">
            <label class="editor-label" :for="nameInputId">先人姓名<span v-if="ancestor.slug === 'ancestors'">（或家族姓氏）</span></label>
            <input
              :id="nameInputId"
              ref="nameInput"
              v-model="draftPersonName"
              type="text"
              class="editor-input"
              :placeholder="ancestor.slug === 'ancestors' ? '可填写家族姓氏；也可留空' : '例如：张某某'"
              maxlength="20"
              autocomplete="off"
              @input="markEditorDirty"
            />
            <p v-if="inscriptionMode === 'full'" class="editor-help">当前按“牌位全文”保存；输入姓名后切换到“按先人姓名生成”才会套用模板。</p>
            <p v-else class="editor-help">当前关系：{{ defaultRelationship }}。姓名留空时保留默认牌位，不会替你虚构姓名。</p>
          </div>
          <div v-if="inscriptionMode === 'full'" class="editor-field">
            <label class="editor-label" for="ancestor-full-inscription">牌位全文</label>
            <textarea
              id="ancestor-full-inscription"
              v-model="draftInscription"
              class="editor-input editor-textarea"
              maxlength="60"
              rows="2"
              placeholder="例如：先父 张某某 大人之位"
              @input="markEditorDirty"
            ></textarea>
          </div>
          <div class="inscription-preview" aria-live="polite">
            <span class="preview-label">实时预览</span>
            <strong>{{ liveInscription }}</strong>
            <small>{{ editorModeDescription }} 点击保存后才会更新主牌位。</small>
          </div>
          <p v-if="storageReadWarning" class="storage-warning" role="status">{{ storageReadWarning }}</p>
          <p v-if="saveState === 'saved'" class="save-status save-status--success" role="status">已保存在本设备，主牌位已更新。</p>
          <p v-else-if="saveState === 'error'" class="save-status save-status--error" role="alert">{{ saveError }}</p>
          <p v-else-if="saveState === 'dirty'" class="save-status" role="status">有未保存的牌位修改。</p>
          <div class="editor-actions">
            <button type="button" class="editor-cancel" @click="closeDrawer">取消</button>
            <button type="button" class="editor-save" :disabled="saveState === 'saving'" @click="saveInscription">
              {{ saveState === 'saving' ? '保存中…' : '保存牌位文字' }}
            </button>
          </div>
        </section>
        <RitualNav v-if="!submitted" :actions="doneActions" label="拜祭页面导航" inline />
        <RitualPanel v-if="!submitted" :ritual="ritual" homage-title="祭奠" />
        <hr v-if="!submitted" class="divider" />
        <p class="ancestor-desc">{{ ancestor.desc }}</p>
        <div class="page-tags">
          <span>{{ ancestor.subtitle }}</span>
          <span>祭祖追思</span>
          <span>功德回向</span>
        </div>
        <section class="entry-summary">
          <h2>本次祭拜对象</h2>
          <div class="summary-chips">
            <span>{{ displayAncestorName }}</span>
            <span>{{ defaultRelationship }}</span>
          </div>
          <p>牌位文字可在上方直接编辑；下面的表单“您的姓名”是本次祈愿人的姓名，与先人姓名分开填写。</p>
          <router-link to="/ancestors" class="reselect-link">更换祭拜对象</router-link>
        </section>
        <section class="privacy-note">
          <p>个性化姓名和照片只保存在当前设备，不会公开给其他人。</p>
        </section>
        <hr class="divider" />
        <DedicationDone
          v-if="submitted"
          kind="ancestor"
          :subject-name="displayAncestorName"
          :name="submitted.username"
          :age="submitted.age"
          :wish="submitted.wish"
          :email="submitted.email || ''"
          :actions="doneActions"
        />

        <template v-else>
          <AncestorWishForm
            :slug="ancestor.slug"
            :default-wish="ancestor.wish"
            :default-ancestor-name="displayAncestorName"
            :default-relationship="defaultRelationship"
            :on-submit="onSubmit"
          />
        </template>
      </section>
    </div>
    </div>
  </div>
  <NotFoundPage
    v-else
    title="祭祖页面未找到"
    message="这个牌位页面当前不存在，可能是历史地址。可以返回祭祖总览重新选择对应的先人页面。"
  />
</template>

<style scoped>
.prayer-shell {
  width: 100%;
  /* 文档比可视区多出一截浏览器工具栏的高度，手机/iPad Safari 上滑时才能收起地址栏 */
  min-height: 100vh;
  min-height: 100lvh;
  animation: fadeIn 0.5s ease;
}

.prayer-frame {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0a0805;
}

.prayer-layout {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.stage-section {
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;
  overflow: hidden;
  background: #0a0805;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 25;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 18px 10px;
  border: 1px solid rgba(212, 168, 67, 0.36);
  border-right: none;
  border-radius: 16px 0 0 16px;
  background: #352012;
  color: #f2ce86;
  font-size: 0.86rem;
  letter-spacing: 0.1em;
  box-shadow: 0 10px 26px rgba(38, 18, 6, 0.18);
  transition: right 0.28s ease, background 0.2s ease;
}

.panel-toggle.open {
  right: min(380px, 88vw);
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  z-index: 18;
  border: none;
  background: rgba(18, 6, 0, 0.28);
}

.panel-section {
  --text: #f7e6c5;
  --text-muted: #dfc9a7;
  --accent: #f2ce86;
  --surface: #2b1a10;
  background: #2b1a10;
  color: var(--text);
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  width: min(380px, 88vw);
  overflow-y: auto;
  padding: 20px 20px 32px;
  border-radius: 0;
  border-left: 1px solid rgba(212, 168, 67, 0.18);
  box-shadow: -10px 0 28px rgba(24, 9, 2, 0.22);
  transform: translateX(100%);
  transition: transform 0.28s ease;
}

.panel-section.open {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-kicker {
  color: var(--accent);
  font-size: 0.82rem;
  letter-spacing: 0.14em;
}

.panel-close {
  min-height: 44px;
  min-width: 44px;
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid rgba(212, 168, 67, 0.34);
  border-radius: 999px;
  background: rgba(255, 248, 233, 0.07);
  color: var(--text-muted);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.panel-close:hover {
  background: rgba(242, 200, 121, 0.16);
  color: var(--text);
}

.inscription-editor {
  margin: 2px 0 18px;
  padding: 14px;
  border: 1px solid rgba(242, 200, 121, 0.22);
  border-radius: 14px;
  background: rgba(255, 248, 233, 0.055);
}

.editor-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.editor-kicker,
.preview-label {
  margin: 0 0 4px;
  color: var(--accent);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
}

.editor-title-row h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.02rem;
  line-height: 1.4;
}

.editor-state-label {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(242, 200, 121, 0.12);
  color: var(--text-muted);
  font-size: 0.7rem;
  white-space: nowrap;
}

.editor-note,
.editor-help {
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.65;
}

.editor-note {
  margin: 8px 0 12px;
}

.editor-help {
  margin: 5px 0 0;
}

.editor-mode {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
}

.editor-mode-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
}

.editor-mode-option input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

.editor-label {
  color: var(--text-muted);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
}

.editor-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 11px;
  border: 1px solid rgba(242, 200, 121, 0.32);
  border-radius: 9px;
  background: rgba(18, 7, 2, 0.5);
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
  outline: none;
}

.editor-input:focus {
  border-color: #f2ce86;
  box-shadow: 0 0 0 3px rgba(242, 200, 121, 0.14);
}

.editor-textarea {
  min-height: 62px;
  resize: vertical;
  line-height: 1.6;
}

.inscription-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 12px 0 10px;
  padding: 10px 11px;
  border-left: 2px solid var(--accent);
  background: rgba(242, 200, 121, 0.08);
}

.inscription-preview strong {
  color: #ffe2a6;
  font-family: 'Noto Serif SC', 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: 1rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.inscription-preview small {
  color: var(--text-muted);
  font-size: 0.72rem;
  line-height: 1.5;
}

.storage-warning,
.save-status {
  margin: 7px 0;
  font-size: 0.78rem;
  line-height: 1.55;
}

.storage-warning,
.save-status--error {
  color: #f2a3a3;
}

.save-status--success {
  color: #b9df9b;
}

.editor-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.editor-cancel,
.editor-save {
  min-height: 42px;
  flex: 1;
  padding: 8px 10px;
  border-radius: 9px;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.editor-cancel {
  border: 1px solid rgba(242, 200, 121, 0.28);
  background: transparent;
  color: var(--text-muted);
}

.editor-save {
  border: 1px solid rgba(242, 200, 121, 0.56);
  background: linear-gradient(135deg, #dcae5f, #f2d18f);
  color: #281607;
  font-weight: 700;
}

.editor-save:disabled {
  cursor: wait;
  opacity: 0.62;
}

.panel-close:focus-visible,
.panel-toggle:focus-visible,
.editor-cancel:focus-visible,
.editor-save:focus-visible {
  outline: 2px solid #f0d091;
  outline-offset: 3px;
}

@media (max-width: 768px) {
  .panel-section {
    width: min(420px, 100vw);
    padding: 14px 16px 18px;
  }

  .panel-toggle {
    top: auto;
    bottom: 18px;
    transform: none;
  }

  .panel-toggle.open {
    right: min(420px, 100vw);
  }

  .namo-title {
    font-size: 1.08rem;
    margin-bottom: 6px;
  }
}

:deep(.stage) {
  aspect-ratio: auto;
  height: 100%;
  width: 100%;
  max-width: none;
  max-height: none;
  border-radius: 0;
}

.namo-title {
  font-size: 1.5rem;
  color: var(--accent);
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: 10px;
  text-shadow: 0 1px 8px rgba(60, 40, 20, 0.2);
}

.ancestor-desc {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.8;
  text-align: justify;
}

.page-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 10px;
}

.page-tags span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(242, 200, 121, 0.1);
  color: var(--text-muted);
  font-size: 0.78rem;
}

.entry-summary,
.privacy-note {
  margin-top: 14px;
}

.entry-summary h2,
.privacy-note p {
  color: var(--text-muted);
}

.entry-summary h2 {
  font-size: 1rem;
  margin-bottom: 8px;
}

.entry-summary p,
.privacy-note p {
  color: var(--text-muted);
  line-height: 1.75;
  font-size: 0.88rem;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.summary-chips span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(242, 200, 121, 0.1);
  color: var(--text-muted);
  font-size: 0.8rem;
}

.reselect-link {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(242, 200, 121, 0.2);
  background: rgba(255, 248, 233, 0.06);
  color: var(--text-muted);
  font-size: 0.84rem;
  text-decoration: none;
}

.divider {
  border: none;
  border-top: 1px solid rgba(242, 200, 121, 0.16);
  margin: 16px 0;
}
</style>
