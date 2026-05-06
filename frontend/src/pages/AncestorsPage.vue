<script setup>
import { ref, computed, onMounted } from 'vue'
import { ANCESTORS } from '../data/ancestors.js'
import AncestorWishList from '../components/AncestorWishList.vue'
import { apiFetch } from '../api.js'
import { useRouter } from 'vue-router'
import { getPhoto, savePhoto, clearPhoto, getName, saveName } from '../utils/localPhoto.js'
import { renderTablet } from '../utils/tabletCanvas.js'
import { getViewerProfile } from '../utils/viewerProfile.js'

const router = useRouter()

const publicWishes = ref([])
const myWishes = ref([])
const loading = ref(true)
const viewerName = ref('')
const latestWishes = computed(() => publicWishes.value.slice(0, 15))
const myLatestWishes = computed(() => myWishes.value.slice(0, 5))
const featuredAncestor = 'father'
const ancestorFaqs = [
  {
    q: '拜祭先人页面适合哪些情况？',
    a: '适合追思先父先母、祖父祖母、列祖列宗，也适合为亡偶、亡子女或一切亡灵进行超荐与回向。',
  },
  {
    q: '照片和姓名会上传吗？',
    a: '不会。页面里个性化照片和姓名设置只保存在本地设备，用于本机显示，不进入服务器数据库。',
  },
]

// 本地照片 & 姓名映射
const localPhotos  = ref(Object.fromEntries(ANCESTORS.map(a => [a.slug, getPhoto(a.slug)])))
const localNames   = ref(Object.fromEntries(ANCESTORS.map(a => [a.slug, getName(a.slug)])))
// 网格卡片合成图（canvas 生成）
const tabletImages = ref(Object.fromEntries(ANCESTORS.map(a => [a.slug, ''])))

async function buildCard(slug) {
  const photo = localPhotos.value[slug]
  const name = localNames.value[slug]
  if (photo) { tabletImages.value[slug] = photo; return }
  const a = ANCESTORS.find(x => x.slug === slug)
  tabletImages.value[slug] = name ? await renderTablet(a.image, name) : a.image
}

onMounted(() => { ANCESTORS.forEach(a => buildCard(a.slug)) })

// 个性化设置弹窗
const showSetup = ref(false)

async function onUpload(slug, e) {
  const file = e.target.files?.[0]
  if (!file) return
  const dataUrl = await savePhoto(slug, file)
  localPhotos.value[slug] = dataUrl
  tabletImages.value[slug] = dataUrl
  e.target.value = ''
}

function onClear(slug) {
  clearPhoto(slug)
  localPhotos.value[slug] = null
  buildCard(slug)
}

function onNameInput(slug, e) {
  const name = e.target.value
  saveName(slug, name)
  localNames.value[slug] = name || null
  if (!localPhotos.value[slug]) buildCard(slug)
}

function openAncestor(slug) {
  router.push(`/ancestor/${slug}`)
}

function entryStatus(ancestor) {
  return localNames.value[ancestor.slug] ? '使用当前自定义牌位文字' : '使用推荐牌位文字进入祭拜页'
}

async function loadWishes() {
  loading.value = true
  viewerName.value = getViewerProfile().username
  try {
    const requests = [apiFetch('/ancestor-wishes?limit=15')]
    if (viewerName.value) {
      requests.push(apiFetch(`/ancestor-wishes?limit=5&username=${encodeURIComponent(viewerName.value)}`))
    }

    const results = await Promise.all(requests)
    publicWishes.value = await results[0].json()
    myWishes.value = viewerName.value && results[1] ? await results[1].json() : []
  } catch {}
  loading.value = false
}

onMounted(() => {
  document.title = '拜祭先人 | 在线祭拜先人 - www.fopusha.com'
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content', '追思先人，超荐亡灵，虔诚祭拜，庇荫后代。选择一位先人，以虔诚之心祭拜发愿。'
  )
  loadWishes()
})
</script>

<template>
  <main class="ancestors-shell">
    <nav class="top-nav">
      <div class="breadcrumb-row">
        <router-link to="/" class="back-link">← 返回首页</router-link>
        <span>/</span>
        <span>拜祭先人</span>
      </div>
    </nav>
    <header class="site-header">
      <div class="header-inner">
        <div class="header-icon">🪔</div>
        <h1>拜祭先人</h1>
        <p>追思先人，超荐亡灵，虔诚祭拜，庇荫后代。</p>
      </div>
    </header>

    <section class="catalog-section card">
      <div class="section-header">
        <div>
          <h2 class="section-title">先人牌位</h2>
          <p class="section-sub">选择一位先人，虔诚祭拜，祈愿庇荫。</p>
        </div>
        <button class="setup-btn" @click="showSetup = true" title="个性化设置">⚙</button>
      </div>
      <div class="selection-guide">
        <div class="guide-pill">先选对象，再进入正式祭拜页</div>
        <p>这里就是过渡选择页。你可以先确认牌位对象、修改牌位显示文字，再进入正式祭拜页面；后面如果想换对象，随时返回这里重新选择，不会被锁定。</p>
        <div class="guide-steps">
          <span>1. 选牌位</span>
          <span>2. 改文字</span>
          <span>3. 进入祭拜</span>
        </div>
      </div>
      <div class="catalog-grid">
        <article
          v-for="(a, index) in ANCESTORS"
          :key="a.slug"
          class="buddha-card ancestor-card"
        >
          <div class="card-topline">
            <span class="card-index">{{ index + 1 }}</span>
            <span v-if="a.slug === featuredAncestor" class="card-badge">推荐</span>
          </div>
          <div class="buddha-img-wrap ancestor-img-wrap">
            <img
              :src="tabletImages[a.slug] || a.image"
              :alt="a.name"
              :style="localPhotos[a.slug] ? 'filter:none' : ''"
            />
          </div>
          <div class="buddha-info">
            <h3>{{ a.name }}</h3>
            <span>{{ a.subtitle }}</span>
          </div>
          <div class="ancestor-entry">
            <div class="entry-status">
              <span>实时预览</span>
              <span class="entry-status-dot"></span>
            </div>
            <label class="entry-label">牌位显示文字</label>
            <div class="entry-row">
              <input
                type="text"
                class="entry-input"
                :placeholder="a.title"
                :value="localNames[a.slug] || a.title"
                @input="onNameInput(a.slug, $event)"
                maxlength="10"
              />
              <button class="entry-btn" @click="openAncestor(a.slug)">进入祭拜</button>
            </div>
            <p class="entry-hint">{{ entryStatus(a) }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- 个性化设置弹窗 -->
    <Teleport to="body">
      <div v-if="showSetup" class="setup-modal" @click.self="showSetup = false">
        <div class="setup-dialog">
          <div class="setup-header">
            <h2>个性化照片设置</h2>
            <button class="setup-close" @click="showSetup = false">✕</button>
          </div>
          <p class="setup-note">📱 照片仅保存在您的设备本地，不会上传到服务器，其他人无法看到。</p>
          <div class="setup-grid">
            <div v-for="a in ANCESTORS" :key="a.slug" class="setup-item">
              <div class="setup-preview">
                <img :src="localPhotos[a.slug] || a.image" :alt="a.name"
                     :class="{ 'custom': localPhotos[a.slug] }" />
                <span v-if="localPhotos[a.slug]" class="custom-badge">已自定义</span>
              </div>
              <p class="setup-name">{{ a.name }}</p>
              <input
                type="text"
                class="name-input"
                :placeholder="a.name"
                :value="localNames[a.slug] || ''"
                @input="onNameInput(a.slug, $event)"
                maxlength="6"
              />
              <div class="setup-actions">
                <label class="upload-btn">
                  上传照片
                  <input type="file" accept="image/*" @change="onUpload(a.slug, $event)" hidden />
                </label>
                <button v-if="localPhotos[a.slug]" class="clear-btn" @click="onClear(a.slug)">清除照片</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <section class="wishes-section card">
      <h2 class="section-title">祭拜记录</h2>
      <div class="record-grid">
        <section class="record-panel">
          <h3 class="record-title">最新祭拜记录</h3>
          <p class="section-sub">显示所有人最近 15 条祭祖与回向记录。</p>
          <AncestorWishList
            :wishes="latestWishes"
            :loading="loading"
            empty-message="暂时还没有公开祭拜记录。"
          />
        </section>
        <section class="record-panel">
          <h3 class="record-title">我的祭拜记录</h3>
          <p class="section-sub">显示当前设备识别到的最近 5 条个人祭拜记录。</p>
          <AncestorWishList
            :wishes="myLatestWishes"
            :loading="loading"
            :empty-message="viewerName ? '你最近还没有祭拜记录。' : '先提交一次祭拜，之后这里会显示你的最近 5 条记录。'"
          />
        </section>
      </div>
    </section>

    <section class="guide-section card">
      <h2 class="section-title">祭祖与追思说明</h2>
      <p class="section-sub">如果你想进一步了解适合的祭拜场景、隐私说明或牌位设置方式，可以在这里查看。</p>
      <div class="guide-copy">
        <p>拜祭先人页面适合用于追思祖先、家族祈愿、超荐亡灵与回向功德。不同牌位覆盖先父、先母、祖父、祖母、列祖列宗，以及亡偶、亡子女与一切亡灵等主题。</p>
        <p>如果你希望做更个性化的追思展示，可以在本地设备中设置牌位照片和称呼。这样既保留纪念意义，也不会把私密图片上传到服务器。</p>
      </div>
      <div class="faq-list">
        <article v-for="faq in ancestorFaqs" :key="faq.q" class="faq-item">
          <h3>{{ faq.q }}</h3>
          <p>{{ faq.a }}</p>
        </article>
      </div>
    </section>

    <footer class="site-footer">
      <p>愿以此功德，庄严佛净土，上报四重恩，下济三途苦。</p>
    </footer>
  </main>
</template>

<style scoped>
.top-nav { padding: 12px 20px 0; }
.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a7a6a;
  font-size: 0.88rem;
}
.back-link {
  font-size: 0.9rem; color: #7a6a5a; text-decoration: none;
  padding: 6px 14px; border-radius: 8px;
  border: 1px solid rgba(120,100,80,0.25);
  background: rgba(240,235,225,0.7); transition: background 0.2s;
}
.back-link:hover { background: rgba(200,185,165,0.5); }

.ancestors-shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.site-header {
  text-align: center;
  padding: 60px 20px 40px;
  animation: fadeInUp 0.7s ease both;
}
.header-icon { font-size: 3rem; margin-bottom: 16px; }
.site-header h1 {
  font-size: 2.6rem;
  color: #8a7a6a;
  letter-spacing: 0.12em;
  margin-bottom: 12px;
  text-shadow: 0 2px 12px rgba(30, 20, 10, 0.15);
}
.site-header p { color: #6a5a4a; font-size: 1.05rem; }

.section-title {
  font-size: 1.4rem;
  color: #7a6a5a;
  margin-bottom: 6px;
  letter-spacing: 0.05em;
}
.section-sub {
  color: #8a7a6a;
  font-size: 0.9rem;
  margin-bottom: 28px;
}

.catalog-section { animation: fadeInUp 0.7s 0.1s ease both; }

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0;
}
.setup-btn {
  flex-shrink: 0;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(120, 100, 80, 0.3);
  background: rgba(240, 235, 225, 0.8);
  color: #7a6a5a;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.setup-btn:hover { background: rgba(200, 185, 165, 0.6); transform: rotate(30deg); }

.selection-guide {
  margin: 18px 0 24px;
  padding: 18px 20px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(92, 62, 34, 0.95), rgba(62, 40, 22, 0.92)),
    radial-gradient(circle at top left, rgba(215, 180, 105, 0.22), transparent 36%);
  color: rgba(245, 237, 225, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 240, 220, 0.08);
}

.selection-guide p {
  margin: 10px 0 0;
  line-height: 1.8;
  font-size: 0.92rem;
}

.guide-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(232, 196, 122, 0.16);
  border: 1px solid rgba(232, 196, 122, 0.28);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
}

.guide-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.guide-steps span {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.08);
  border: 1px solid rgba(255, 248, 236, 0.12);
  font-size: 0.8rem;
}

/* ── 弹窗 ── */
.setup-modal {
  position: fixed; inset: 0;
  z-index: 950;
  background: rgba(10, 8, 5, 0.75);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
}
.setup-dialog {
  background: #faf6f0;
  border-radius: 16px;
  width: 92vw; max-width: 680px;
  max-height: 88vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
}
.setup-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.setup-header h2 { font-size: 1.2rem; color: #5a4a3a; }
.setup-close {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid rgba(120,100,80,0.3);
  background: transparent; color: #7a6a5a;
  font-size: 1rem; cursor: pointer;
}
.setup-note {
  font-size: 0.82rem; color: #8a7a6a;
  background: rgba(180,165,140,0.12);
  border-radius: 8px; padding: 8px 12px;
  margin-bottom: 18px;
}
.setup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.setup-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 12px 8px;
  background: rgba(240,235,225,0.6);
  border: 1px solid rgba(120,100,80,0.15);
  border-radius: 12px;
}
.setup-preview {
  position: relative;
  width: 80px; height: 80px;
  border-radius: 8px; overflow: hidden;
  background: linear-gradient(135deg, #d8d0c4, #c8c0b4);
}
.setup-preview img {
  width: 100%; height: 100%; object-fit: cover;
  filter: grayscale(0.15) sepia(0.2);
}
.setup-preview img.custom { filter: none; }
.custom-badge {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(80,120,80,0.85);
  color: #fff; font-size: 0.65rem;
  text-align: center; padding: 2px 0;
}
.setup-name { font-size: 0.85rem; color: #5a4a3a; font-weight: 600; }
.setup-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.upload-btn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(120,100,80,0.4);
  background: rgba(180,165,140,0.15);
  color: #5a4a3a; font-size: 0.78rem;
  cursor: pointer; transition: background 0.2s;
}
.upload-btn:hover { background: rgba(180,165,140,0.35); }
.clear-btn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(180,80,80,0.3);
  background: rgba(180,80,80,0.08);
  color: #a05050; font-size: 0.78rem;
  cursor: pointer; transition: background 0.2s;
}
.clear-btn:hover { background: rgba(180,80,80,0.2); }

/* 姓名输入框 */
.name-input {
  width: 100%;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(120,100,80,0.35);
  background: rgba(255,252,245,0.9);
  font-size: 0.82rem;
  color: #5a4a3a;
  text-align: center;
  outline: none;
}
.name-input:focus { border-color: #8a7a6a; }

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 20px;
}

.buddha-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 14px;
  background: rgba(240, 235, 225, 0.7);
  border: 1px solid rgba(120, 100, 80, 0.15);
  overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  text-decoration: none;
  color: inherit;
}
.buddha-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 36px rgba(30, 20, 15, 0.16);
  border-color: #8a7a6a;
}

.card-topline {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.card-index,
.card-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  backdrop-filter: blur(6px);
}

.card-index {
  background: rgba(255, 248, 236, 0.86);
  color: #8a6d42;
  font-weight: 700;
}

.card-badge {
  background: rgba(162, 112, 46, 0.92);
  color: #fff5e7;
  font-size: 0.76rem;
  letter-spacing: 0.06em;
}

.buddha-img-wrap {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: linear-gradient(135deg, #d8d0c4, #c8c0b4);
}
.buddha-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
  filter: grayscale(0.15) sepia(0.2);
}
.buddha-card:hover .buddha-img-wrap img { transform: scale(1.05); }

.buddha-info {
  padding: 14px 12px;
  text-align: center;
  width: 100%;
}
.buddha-info h3 { font-size: 1rem; margin-bottom: 4px; color: #5a4a3a; }
.buddha-info span { font-size: 0.8rem; color: #8a7a6a; }

.ancestor-entry {
  width: 100%;
  padding: 0 12px 14px;
}

.entry-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #b29a7c;
  font-size: 0.76rem;
  margin-bottom: 10px;
}

.entry-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8daf74;
  box-shadow: 0 0 0 4px rgba(141, 175, 116, 0.12);
}

.entry-label {
  display: block;
  color: #8a7a6a;
  font-size: 0.78rem;
  margin-bottom: 8px;
}

.entry-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.entry-input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(120, 100, 80, 0.22);
  background: rgba(255, 252, 245, 0.9);
  color: #5a4a3a;
  font-size: 0.86rem;
  outline: none;
}

.entry-input:focus {
  border-color: #8a7a6a;
  box-shadow: 0 0 0 3px rgba(120, 100, 80, 0.1);
}

.entry-btn {
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(120, 100, 80, 0.28);
  background: linear-gradient(135deg, #b88e4b, #c9a262);
  color: #fff9ee;
  font-size: 0.84rem;
  cursor: pointer;
  white-space: nowrap;
}

.entry-hint {
  margin-top: 8px;
  color: #9a8771;
  font-size: 0.76rem;
  line-height: 1.5;
}

.wishes-section { animation: fadeInUp 0.7s 0.2s ease both; }

.record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.record-panel {
  min-width: 0;
}

.record-title {
  color: #5a4a3a;
  font-size: 1rem;
  margin-bottom: 6px;
}

.guide-section {
  animation: fadeInUp 0.7s 0.16s ease both;
}

.guide-copy {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
}

.guide-copy p,
.faq-item p {
  color: #8a7a6a;
  line-height: 1.8;
  font-size: 0.92rem;
}

.faq-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.faq-item {
  padding: 16px;
  border-radius: 12px;
  background: rgba(240, 235, 225, 0.72);
  border: 1px solid rgba(120, 100, 80, 0.14);
}

.faq-item h3 {
  color: #5a4a3a;
  margin-bottom: 8px;
  font-size: 0.98rem;
}

.site-footer {
  text-align: center;
  padding: 24px;
  color: #8a7a6a;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

@media (max-width: 900px) {
  .ancestors-shell { padding: 0 12px 48px; gap: 20px; }
  .card { padding: 20px 16px; }
  .site-header { padding: 36px 12px 24px; }
  .record-grid { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .site-header h1 { font-size: 1.9rem; }
  .catalog-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .selection-guide {
    padding: 16px;
  }
  .entry-row {
    grid-template-columns: 1fr;
  }
  .entry-btn {
    min-height: 40px;
  }
}
</style>
