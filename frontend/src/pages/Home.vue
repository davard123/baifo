<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BUDDHAS } from '../data/buddhas.js'
import WishList from '../components/WishList.vue'
import { apiFetch } from '../api.js'

const router = useRouter()
const wishes = ref([])
const loading = ref(true)

onMounted(async () => {
  document.title = '礼佛祈愿 | 八位佛菩萨在线礼佛 - baifo.rentalinca.com'
  document.querySelector('meta[name="description"]')?.setAttribute('content', '选择一位佛菩萨，以虔诚之心礼敬供养，发愿回向。收录释迦牟尼佛、阿弥陀佛、药师佛、观音菩萨等八位佛菩萨在线礼佛祈愿，功德回向十方众生。')
  try {
    const res = await apiFetch('/wishes')
    if (res.ok) wishes.value = await res.json()
  } catch {}
  loading.value = false
})
</script>

<template>
  <main class="home-shell">
    <header class="site-header">
      <div class="header-inner">
        <div class="header-icon">🪷</div>
        <h1>礼佛祈愿</h1>
        <p>选择一位佛菩萨，以虔诚之心礼敬供养，发愿回向。</p>
      </div>
    </header>

    <section class="catalog-section card">
      <h2 class="section-title">诸佛菩萨</h2>
      <p class="section-sub">八位佛菩萨，各具大愿，礼敬供养，福慧双增。</p>
      <div class="catalog-grid">
        <router-link
          v-for="b in BUDDHAS"
          :key="b.slug"
          :to="'/buddha/' + b.slug"
          class="buddha-card"
        >
          <div class="buddha-img-wrap">
            <img :src="b.image" :alt="b.name" />
          </div>
          <div class="buddha-info">
            <h3>{{ b.name }}</h3>
            <span>{{ b.subtitle }}</span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="wishes-section card">
      <h2 class="section-title">祈愿记录</h2>
      <p class="section-sub">十方众生的礼佛祈愿，功德回向一切有情。</p>
      <WishList :wishes="wishes" :loading="loading" />
    </section>

    <footer class="site-footer">
      <p>愿以此功德，庄严佛净土，上报四重恩，下济三途苦。</p>
    </footer>
  </main>
</template>

<style scoped>
.home-shell {
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
  color: var(--accent);
  letter-spacing: 0.12em;
  margin-bottom: 12px;
  text-shadow: 0 2px 12px rgba(127, 90, 54, 0.15);
}
.site-header p { color: var(--text-muted); font-size: 1.05rem; }

.section-title {
  font-size: 1.4rem;
  color: var(--accent);
  margin-bottom: 6px;
  letter-spacing: 0.05em;
}
.section-sub {
  color: var(--text-muted);
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
  background: rgba(255, 250, 240, 0.7);
  border: 1px solid rgba(212, 168, 67, 0.15);
  overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  text-decoration: none;
  color: var(--text);
}
.buddha-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 36px rgba(68, 43, 17, 0.16);
  border-color: var(--gold);
}

.buddha-img-wrap {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: linear-gradient(135deg, #f5e9d0, #ede0c0);
}
.buddha-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.buddha-card:hover .buddha-img-wrap img { transform: scale(1.05); }

.buddha-info {
  padding: 14px 12px;
  text-align: center;
  width: 100%;
}
.buddha-info h3 { font-size: 1rem; margin-bottom: 4px; color: var(--accent); }
.buddha-info span { font-size: 0.8rem; color: var(--text-muted); }

.wishes-section { animation: fadeInUp 0.7s 0.2s ease both; }

.site-footer {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

@media (max-width: 900px) {
  .home-shell { padding: 0 12px 48px; gap: 20px; }
  .card { padding: 20px 16px; }
  .site-header { padding: 36px 12px 24px; }
}

@media (max-width: 600px) {
  .site-header h1 { font-size: 1.9rem; }
  .catalog-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
