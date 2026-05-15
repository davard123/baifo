<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BUDDHAS } from '../data/buddhas.js'
import WishList from '../components/WishList.vue'
import BlessingPool from '../components/BlessingPool.vue'
import { apiFetch } from '../api.js'
import { getViewerProfile } from '../utils/viewerProfile.js'

const router = useRouter()
const publicWishes = ref([])
const publicAncestorWishes = ref([])
const myWishes = ref([])
const myAncestorWishes = ref([])
const loadingPublic = ref(true)
const loadingMine = ref(true)
const viewerName = ref('')
const topBookmarks = [
  {
    title: '礼佛祈愿',
    body: '进入佛菩萨页面，依次供花、点灯、上香并填写祈愿。',
    to: '/guide/worship',
  },
  {
    title: '祭祖追思',
    body: '进入先人牌位页面，追思祭拜、超荐回向，并可自定义牌位显示。',
    to: '/ancestors',
  },
  {
    title: '使用说明',
    body: '第一次使用时，先看这里了解礼佛、祭祖和回向页面的大致区别。',
    to: '/guide/overview',
  },
]

const allWishes = computed(() => {
  const combined = [
    ...publicWishes.value,
    ...publicAncestorWishes.value,
  ]
  return combined.sort((a, b) => b.id - a.id).slice(0, 15)
})

const myRecentWishes = computed(() => {
  const combined = [
    ...myWishes.value,
    ...myAncestorWishes.value,
  ]
  return combined.sort((a, b) => b.id - a.id).slice(0, 5)
})

const guideCards = [
  {
    title: '在线礼佛怎么开始',
    body: '进入任意佛菩萨页面后，可以依次供花、点灯、上香，再填写祈愿内容并回向众生。',
  },
  {
    title: '适合哪些祈愿主题',
    body: '常见主题包括平安健康、学业事业、智慧增长、家庭和顺、超荐回向与消灾延寿。',
  },
  {
    title: '祭祖页面有什么不同',
    body: '拜祭先人页面更适合追思祖先、超荐亡灵与家族祈愿，也支持本地个性化牌位照片与姓名。',
  },
]

const faqs = [
  {
    q: '礼佛祈愿网站可以做什么？',
    a: 'www.fopusha.com 是一个在线拜佛、祭祀追思与祈福回向的网站，提供八位佛菩萨的礼佛祈愿页面，也提供拜祭先人、追思祖先与超荐回向相关页面。',
  },
  {
    q: '在线礼佛会公开个人照片吗？',
    a: '礼佛祈愿内容会进入记录列表，而拜祭先人的个性化照片和姓名设置只保存在当前设备本地，不会上载到服务器。',
  },
  {
    q: '第一次使用建议先去哪个页面？',
    a: '如果是日常祈福，可以先从首页选择佛菩萨页面；如果是追思先人或祭祖，则可以直接进入拜祭先人页面。',
  },
]

const featuredPaths = [
  {
    title: '日常祈福入口',
    body: '适合从首页开始，选择释迦牟尼佛、观音菩萨或药师佛等页面进行礼佛祈愿。',
    to: '/guide/worship',
    cta: '查看礼佛指南',
  },
  {
    title: '超荐与回向入口',
    body: '如果重点是超荐祖先、祭祖追思或回向先人，可以直接进入拜祭先人总览页面。',
    to: '/guide/ancestors',
    cta: '查看祭祖指南',
  },
]

const aiTopicPages = [
  {
    title: '在线礼佛网站使用说明',
    body: '整理在线礼佛的常见用法、页面入口与供养步骤，方便第一次使用时快速了解。',
    to: '/topic/online-worship',
  },
  {
    title: '在线祭祖网站使用说明',
    body: '说明在线祭祖、追思先人与个性化牌位设置的常见用法与注意事项。',
    to: '/topic/online-ancestors',
  },
  {
    title: '功德回向怎么做',
    body: '整理礼佛、祭祖与超荐场景中常见的回向方式与表达思路。',
    to: '/topic/merit-dedication',
  },
  {
    title: '观音菩萨祈福指南',
    body: '适合查看观音菩萨常见的平安、慈悲、消灾与求助相关祈愿主题。',
    to: '/topic/guanyin',
  },
  {
    title: '药师佛健康祈愿指南',
    body: '适合查看药师佛常见的健康、延寿、消灾与身心安乐相关祈愿主题。',
    to: '/topic/medicine',
  },
  {
    title: '地藏菩萨超荐回向指南',
    body: '适合查看地藏菩萨与超荐、回向、追思先人及亡灵救度相关的常见主题。',
    to: '/topic/ksitigarbha',
  },
]

async function loadWishes() {
  loadingPublic.value = true
  loadingMine.value = true
  viewerName.value = getViewerProfile().username
  try {
    const publicResults = await Promise.all([
      apiFetch('/wishes?limit=15'),
      apiFetch('/ancestor-wishes?limit=15'),
    ])
    publicWishes.value = await publicResults[0].json()
    publicAncestorWishes.value = await publicResults[1].json()
  } catch {
    publicWishes.value = []
    publicAncestorWishes.value = []
  }
  loadingPublic.value = false

  if (!viewerName.value) {
    myWishes.value = []
    myAncestorWishes.value = []
    loadingMine.value = false
    return
  }

  try {
    const mineResults = await Promise.all([
      apiFetch(`/wishes?limit=5&username=${encodeURIComponent(viewerName.value)}`),
      apiFetch(`/ancestor-wishes?limit=5&username=${encodeURIComponent(viewerName.value)}`),
    ])
    myWishes.value = await mineResults[0].json()
    myAncestorWishes.value = await mineResults[1].json()
  } catch {
    myWishes.value = []
    myAncestorWishes.value = []
  }
  loadingMine.value = false
}

onMounted(() => {
  document.title = '礼佛祈愿 | 八位佛菩萨在线礼佛 - www.fopusha.com'
  document.querySelector('meta[name="description"]')?.setAttribute('content', '选择一位佛菩萨，以虔诚之心礼敬供养，发愿回向。收录释迦牟尼佛、阿弥陀佛、药师佛、观音菩萨等八位佛菩萨在线礼佛祈愿，功德回向十方众生。')
  loadWishes()
})
</script>

<template>
  <main class="home-shell">
    <header class="site-header">
      <div class="header-inner">
        <div class="header-icon">🪷</div>
        <h1>礼佛祈愿</h1>
        <p>选择一位佛菩萨，以虔诚之心礼敬供养，发愿回向。</p>
        <div class="header-divider"></div>
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

    <router-link to="/ancestors" class="ancestor-banner">
      <div class="banner-inner">
        <div class="banner-icon">🪔</div>
        <div class="banner-text">
          <h2>拜祭先人</h2>
          <p>追思先人，超荐亡灵，虔诚祭拜，庇荫后代</p>
        </div>
        <div class="banner-arrow">→</div>
      </div>
    </router-link>

    <section class="bookmark-section dim-section">
      <div class="bookmark-grid">
        <router-link v-for="item in topBookmarks" :key="item.title" :to="item.to" class="bookmark-card">
          <h2>{{ item.title }}</h2>
          <p>{{ item.body }}</p>
          <span>进入</span>
        </router-link>
      </div>
    </section>

    <BlessingPool @wish-submitted="loadWishes" />

    <!-- ── 祈愿记录：网站内容，优先展示 ── -->
    <section class="wishes-section card">
      <h2 class="section-title">祈愿记录</h2>
      <div class="record-grid">
        <section class="record-panel">
          <h3 class="record-title">最新祈愿记录</h3>
          <p class="section-sub">显示所有人最近 15 条礼佛与回向记录。</p>
          <WishList
            :wishes="allWishes"
            :loading="loadingPublic"
            empty-message="暂时还没有公开祈愿记录。"
          />
        </section>

        <section class="record-panel">
          <h3 class="record-title">我的祈愿记录</h3>
          <p class="section-sub">显示当前设备识别到的最近 5 条个人记录。</p>
          <WishList
            :wishes="myRecentWishes"
            :loading="loadingMine"
            :empty-message="viewerName ? '你最近还没有祈愿记录。' : '先提交一次祈愿，之后这里会显示你的最近 5 条记录。'"
          />
        </section>
      </div>
    </section>

    <!-- ── 以下为使用说明类，视觉降权 ── -->
    <section class="guide-section help-section">
      <h2 class="help-title">礼佛与回向指南</h2>
      <p class="help-sub">如果你第一次使用，可以先从这里了解礼佛、回向和祭祖页面的大致区别。</p>
      <div class="guide-grid">
        <article v-for="item in guideCards" :key="item.title" class="guide-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
      <div class="guide-links">
        <router-link to="/guide/worship">查看在线礼佛指南</router-link>
        <router-link to="/guide/ancestors">查看在线祭祖指南</router-link>
        <router-link to="/ancestors">查看拜祭先人总览</router-link>
        <router-link :to="'/buddha/' + BUDDHAS[0].slug">从本师释迦牟尼佛开始礼佛</router-link>
      </div>
    </section>

    <section class="faq-section help-section help-section--faq">
      <h2 class="help-title">常见问题</h2>
      <div class="faq-list">
        <article v-for="faq in faqs" :key="faq.q" class="faq-item">
          <h3>{{ faq.q }}</h3>
          <p>{{ faq.a }}</p>
        </article>
      </div>
    </section>

    <section class="path-section dim-section">
      <h2 class="section-title">推荐礼敬路径</h2>
      <p class="section-sub">如果你已经熟悉页面结构，可以从这里按不同祈愿方向继续进入。</p>
      <div class="path-grid">
        <article v-for="item in featuredPaths" :key="item.title" class="path-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
          <router-link :to="item.to">{{ item.cta }}</router-link>
        </article>
      </div>
    </section>

    <section class="path-section dim-section">
      <h2 class="section-title">专题指南</h2>
      <p class="section-sub">如果你想先看不同主题之间的区别，再决定进入哪个页面，可以从这里开始。</p>
      <div class="path-grid">
        <article v-for="item in aiTopicPages" :key="item.title" class="path-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
          <router-link :to="item.to">查看专题页</router-link>
        </article>
      </div>
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
  gap: 40px;
}

.site-header {
  text-align: center;
  padding: 60px 20px 40px;
  animation: fadeInUp 0.7s ease both;
}
.header-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  display: inline-block;
  animation: slowSpin 20s linear infinite;
}
@keyframes slowSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.site-header h1 {
  font-size: 2.6rem;
  color: var(--accent);
  letter-spacing: 0.12em;
  margin-bottom: 12px;
  text-shadow: 0 2px 12px rgba(127, 90, 54, 0.15);
}
.site-header p { color: var(--text-muted); font-size: 1.05rem; }
.header-divider {
  width: 80px;
  height: 1px;
  background: var(--gold);
  margin: 24px auto 0;
  opacity: 0.6;
}

/* ── 主内容区 section 标题 ── */
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 6px;
  letter-spacing: 0.06em;
}
.section-sub {
  color: var(--text-muted);
  font-size: 0.88rem;
  margin-bottom: 28px;
}

/* ── 辅助性 section（降权） ── */
.dim-section {
  background: rgba(255, 252, 245, 0.45);
  border: 1px solid rgba(212, 168, 67, 0.1);
  border-radius: var(--radius);
  padding: 28px 32px;
}
.dim-section .section-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
.dim-section .section-sub {
  font-size: 0.82rem;
  margin-bottom: 18px;
}

.catalog-section { animation: fadeInUp 0.7s 0.1s ease both; }

.bookmark-section {
  padding-top: 16px;
  padding-bottom: 16px;
}

.bookmark-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.bookmark-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  background:
    linear-gradient(135deg, rgba(250, 244, 231, 0.96), rgba(244, 233, 213, 0.9));
  border: 1px solid rgba(212, 168, 67, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.bookmark-card h2 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent);
}

.bookmark-card p {
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.7;
  opacity: 0.85;
}

.bookmark-card span {
  color: var(--accent-light);
  font-size: 0.8rem;
  font-weight: 600;
}

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
  width: 80%;
  aspect-ratio: 1;
  margin: 20px auto 0;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5e9d0, #ede0c0);
  border: 2px solid rgba(212, 168, 67, 0.35);
  box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.1);
  transition: box-shadow 0.3s, border-color 0.3s;
}
.buddha-card:hover .buddha-img-wrap {
  border-color: var(--gold);
  box-shadow: 0 0 0 6px rgba(212, 168, 67, 0.2);
}
.buddha-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.buddha-card:hover .buddha-img-wrap img { transform: scale(1.06); }

.buddha-info {
  padding: 14px 12px;
  text-align: center;
  width: 100%;
}
.buddha-info h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; color: var(--accent); letter-spacing: 0.05em; }
.buddha-info span { font-size: 0.75rem; color: var(--text-muted); opacity: 0.75; }

/* 分隔语 */
.section-divider {
  text-align: center;
  color: var(--gold-light);
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  opacity: 0.7;
  padding: 8px 0;
}

/* 先人横幅 */
.ancestor-banner {
  display: block;
  padding: 28px 32px;
  background: linear-gradient(135deg, #2a1f15, #3a2a1a, #2a1f15);
  border: 1px solid rgba(120, 100, 80, 0.3);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: fadeInUp 0.6s 0.15s ease both;
}
.ancestor-banner:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(30, 20, 10, 0.3);
}
.banner-inner {
  display: flex;
  align-items: center;
  gap: 20px;
}
.banner-icon { font-size: 2.8rem; flex-shrink: 0; }
.banner-text { flex: 1; }
.banner-text h2 {
  font-size: 1.5rem;
  color: #d0c8b0;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.banner-text p {
  color: rgba(180, 170, 150, 0.8);
  font-size: 0.9rem;
}
.banner-arrow {
  font-size: 1.5rem;
  color: rgba(180, 170, 150, 0.6);
  flex-shrink: 0;
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
  color: var(--accent);
  font-size: 1rem;
  margin-bottom: 6px;
}

/* ── 祈愿记录：完整卡片，主标题，生动感 ── */
.wishes-section .section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.06em;
}
.wishes-section .record-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
  border-left: 3px solid var(--gold);
  padding-left: 10px;
  margin-bottom: 10px;
}

/* ── 使用指南类（指南 + FAQ）：统一帮助区风格 ── */
.help-section {
  background: rgba(240, 233, 215, 0.5);
  border: 1px solid rgba(160, 130, 80, 0.14);
  border-radius: 14px;
  padding: 24px 28px;
  animation: fadeInUp 0.7s 0.18s ease both;
}
.help-title {
  font-size: 0.98rem;
  font-weight: 600;
  color: #9a8260;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  text-transform: none;
}
.help-sub {
  color: #a89070;
  font-size: 0.78rem;
  margin-bottom: 16px;
}

/* 礼佛指南：暖金左边框标记 */
.guide-section.help-section {
  border-left: 4px solid rgba(212, 168, 67, 0.45);
}

/* 常见问题：更暗一点，区别于指南 */
.help-section--faq {
  background: rgba(228, 222, 208, 0.45);
  border-left: 4px solid rgba(140, 110, 70, 0.3);
}
.help-section--faq .help-title {
  color: #8a7458;
}

.guide-section,
.faq-section,
.path-section {
  animation: fadeInUp 0.7s 0.18s ease both;
}

.guide-grid,
.faq-list,
.path-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.guide-card,
.faq-item,
.path-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 251, 242, 0.55);
  border: 1px solid rgba(212, 168, 67, 0.1);
}

.guide-card h3,
.faq-item h3,
.path-card h3 {
  margin-bottom: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--accent);
}

.guide-card p,
.faq-item p,
.path-card p {
  color: var(--text-muted);
  line-height: 1.75;
  font-size: 0.8rem;
  opacity: 0.85;
}

.path-card a {
  display: inline-flex;
  margin-top: 12px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.guide-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.guide-links a {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(212, 168, 67, 0.22);
  color: var(--accent);
  text-decoration: none;
  background: rgba(255, 250, 240, 0.9);
}

.site-footer {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

@media (max-width: 900px) {
  .home-shell { padding: 0 12px 48px; gap: 24px; }
  .card { padding: 20px 16px; }
  .site-header { padding: 36px 12px 24px; }
  .record-grid { grid-template-columns: 1fr; }
  .bookmark-grid { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .site-header h1 { font-size: 1.9rem; }
  .catalog-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
