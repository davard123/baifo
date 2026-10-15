<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ANCESTORS } from '../data/ancestors.js'
import AncestorStage from '../components/AncestorStage.vue'
import RitualPanel from '../components/ritual/RitualPanel.vue'
import { useRitual } from '../composables/useRitual.js'
import AncestorWishForm from '../components/AncestorWishForm.vue'
import DedicationDone from '../components/DedicationDone.vue'
import RitualNav from '../components/RitualNav.vue'
import { apiFetch } from '../api.js'
import { getPhoto, getName } from '../utils/localPhoto.js'
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

const customPhoto = ref(null)
const customName = ref(null)
const ritual = useRitual('ancestor')

const displayAncestorName = computed(() => customName.value || ancestor.value?.title || '')
const defaultRelationship = computed(() => {
  const map = {
    father: '父亲',
    mother: '母亲',
    grandfather: '祖父',
    grandmother: '祖母',
    spouse: '配偶',
    child: '子女',
    ancestors: '先祖',
    general: '其他',
  }
  return map[ancestor.value?.slug] || '其他'
})

function syncAncestorState() {
  if (!ancestor.value) return
  customPhoto.value = getPhoto(route.params.slug)
  customName.value = getName(route.params.slug)
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
        />
      </section>

      <button
        type="button"
        class="panel-toggle"
        :class="{ open: drawerOpen }"
        @click="drawerOpen = !drawerOpen"
      >
        {{ drawerOpen ? '收起供养' : '祭祖供养' }}
      </button>

      <button
        v-if="drawerOpen"
        type="button"
        class="drawer-backdrop"
        aria-label="关闭说明"
        @click="drawerOpen = false"
      ></button>

      <section class="panel-section card" :class="{ open: drawerOpen }">
        <RitualNav v-if="!submitted" :actions="doneActions" label="拜祭页面导航" inline />
        <h1 class="namo-title">{{ ancestor.namo }}</h1>
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
          <p>如果要换牌位或重新输入姓名，可以返回上一页重新选择；当前页面会自动带入你刚才确认的牌位信息。</p>
          <router-link to="/ancestors" class="reselect-link">重新选择牌位</router-link>
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
  background: rgba(30, 20, 42, 0.96);
  color: var(--accent);
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
