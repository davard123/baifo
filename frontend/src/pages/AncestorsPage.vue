<script setup>
import { ref, onMounted } from 'vue'
import { ANCESTORS } from '../data/ancestors.js'
import AncestorWishList from '../components/AncestorWishList.vue'
import { apiFetch } from '../api.js'

const wishes = ref([])
const loading = ref(true)

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
      <h2 class="section-title">先人牌位</h2>
      <p class="section-sub">选择一位先人，虔诚祭拜，祈愿庇荫。</p>
      <div class="catalog-grid">
        <router-link
          v-for="a in ANCESTORS"
          :key="a.slug"
          :to="'/ancestor/' + a.slug"
          class="buddha-card ancestor-card"
        >
          <div class="buddha-img-wrap ancestor-img-wrap">
            <img :src="a.image" :alt="a.name" />
          </div>
          <div class="buddha-info">
            <h3>{{ a.name }}</h3>
            <span>{{ a.subtitle }}</span>
          </div>
        </router-link>
      </div>
    </section>

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
