<script setup>
import { ref, onMounted } from 'vue'
import { ANCESTORS } from '../data/ancestors.js'
import AncestorWishList from '../components/AncestorWishList.vue'
import { apiFetch } from '../api.js'
import { getPhoto, savePhoto, clearPhoto, getName, saveName } from '../utils/localPhoto.js'

const wishes = ref([])
const loading = ref(true)

// 本地照片 & 姓名映射
const localPhotos = ref(Object.fromEntries(ANCESTORS.map(a => [a.slug, getPhoto(a.slug)])))
const localNames  = ref(Object.fromEntries(ANCESTORS.map(a => [a.slug, getName(a.slug)])))

// 个性化设置弹窗
const showSetup = ref(false)

async function onUpload(slug, e) {
  const file = e.target.files?.[0]
  if (!file) return
  const dataUrl = await savePhoto(slug, file)
  localPhotos.value[slug] = dataUrl
  e.target.value = ''
}

function onClear(slug) {
  clearPhoto(slug)
  localPhotos.value[slug] = null
}

function onNameInput(slug, e) {
  const name = e.target.value
  saveName(slug, name)
  localNames.value[slug] = name || null
}

async function loadWishes() {
  loading.value = true
  try {
    const res = await apiFetch('/ancestor-wishes')
    if (res.ok) wishes.value = await res.json()
  } catch {}
  loading.value = false
}

onMounted(() => {
  document.title = '拜祭先人 | 在线祭拜先人 - baifo.rentalinca.com'
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content', '追思先人，超荐亡灵，虔诚祭拜，庇荫后代。选择一位先人，以虔诚之心祭拜发愿。'
  )
  loadWishes()
})
</script>

<template>
  <main class="ancestors-shell">
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
      <div class="catalog-grid">
        <router-link
          v-for="a in ANCESTORS"
          :key="a.slug"
          :to="'/ancestor/' + a.slug"
          class="buddha-card ancestor-card"
        >
          <div class="buddha-img-wrap ancestor-img-wrap" style="position:relative">
            <img :src="localPhotos[a.slug] || a.image" :alt="a.name"
                 :style="localPhotos[a.slug] ? 'filter:none' : ''" />
            <!-- 姓名叠加（仅牌位图时显示） -->
            <div v-if="!localPhotos[a.slug]" class="card-name-overlay">
              <span>{{ localNames[a.slug] || a.name }}</span>
            </div>
          </div>
          <div class="buddha-info">
            <h3>{{ a.name }}</h3>
            <span>{{ a.subtitle }}</span>
          </div>
        </router-link>
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
      <p class="section-sub">十方众生的祭拜先人，功德回向先人。</p>
      <AncestorWishList :wishes="wishes" />
    </section>

    <footer class="site-footer">
      <p>愿以此功德，庄严佛净土，上报四重恩，下济三途苦。</p>
    </footer>
  </main>
</template>

<style scoped>
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

/* 网格卡片姓名叠加 */
.card-name-overlay {
  position: absolute;
  top: 20%; left: 50%;
  transform: translateX(-50%);
  width: 30%; height: 48%;
  background: #1e0d05;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.card-name-overlay span {
  writing-mode: vertical-lr;
  font-family: 'SimSun', 'STSong', serif;
  font-size: 1.05rem;
  color: #c8a030;
  letter-spacing: 0.15em;
  font-weight: bold;
}

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

.wishes-section { animation: fadeInUp 0.7s 0.2s ease both; }

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
}

@media (max-width: 600px) {
  .site-header h1 { font-size: 1.9rem; }
  .catalog-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
