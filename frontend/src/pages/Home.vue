<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BUDDHAS } from '../data/buddhas.js'
import BlessingPool from '../components/BlessingPool.vue'
import WishList from '../components/WishList.vue'
import { apiFetch, warmApi } from '../api.js'
import { getViewerProfile } from '../utils/viewerProfile.js'

const publicWishes = ref([])
const publicAncestorWishes = ref([])
const myWishes = ref([])
const myAncestorWishes = ref([])
const loadingPublic = ref(true)
const loadingMine = ref(true)
const viewerName = ref('')
const router = useRouter()

const primaryPaths = [
  {
    title: '礼佛祈愿',
    body: '进入佛菩萨页面后，可以依次供花、点灯、上香，再写下祈愿并回向众生。',
    to: { path: '/', hash: '#buddha-catalog-title' },
    cta: '进入礼佛入口',
  },
  {
    title: '祈愿求福',
    body: '如果此刻更想直接为平安、健康、学业、姻缘等主题发愿，可先进入祈福池再继续下行。',
    to: { path: '/', hash: '#blessing-pool-title' },
    cta: '进入祈福池',
  },
  {
    title: '祭祀先人',
    body: '追思祖先、祭拜先人、回向亡灵，也支持本地个性化牌位照片与姓名显示。',
    to: '/ancestors',
    cta: '进入祭祀先人',
  },
  {
    title: '初次使用说明',
    body: '第一次来到这里时，先了解礼佛、回向与祭祀页面的差别，会更容易找到适合的入口。',
    to: '/guide/overview',
    cta: '阅读使用说明',
  },
]

const guideCards = [
  {
    title: '在线礼佛怎么开始',
    body: '从任意佛菩萨页面进入后，按顺序完成供花、点灯、上香，再留下祈愿内容与回向。',
  },
  {
    title: '适合哪些祈愿主题',
    body: '常见祈愿包括平安健康、学业事业、智慧增长、家庭和顺、超荐回向与消灾延寿。',
  },
  {
    title: '祭祀页面与礼佛页面的区别',
    body: '祭祀先人更适合追思祖先、超荐亡灵与家族祈愿，礼佛页面则更适合日常发愿与供养。',
  },
]

const faqs = [
  {
    q: '礼佛祈愿网站可以做什么？',
    a: '这里提供在线礼佛、祭祀追思与祈福回向入口，方便你在不同场景下找到合适的页面表达心意。',
  },
  {
    q: '祭祀时会公开我的照片吗？',
    a: '祭祀先人使用的个性化照片与姓名设置仅保存在当前设备本地，不会上传到服务器。',
  },
  {
    q: '第一次使用建议先去哪一个页面？',
    a: '如果是日常祈福，可以先从礼佛指南或佛菩萨页面开始；如果是追思亲人，则建议直接进入祭祀先人页面。',
  },
]

const featuredPaths = [
  {
    title: '日常祈福入口',
    body: '适合从首页开始，选择释迦牟尼佛、观音菩萨、药师佛等页面进行礼佛祈愿。',
    to: '/guide/worship',
    cta: '查看礼佛动线',
  },
  {
    title: '超荐与回向入口',
    body: '如果重点是超荐祭祖、追思先人或为家人回向，可以直接进入祭祀先人总览页面。',
    to: '/guide/ancestors',
    cta: '查看祭祀动线',
  },
]

const topicPages = [
  {
    title: '在线礼佛网站使用说明',
    body: '整理在线礼佛的常见用法、页面入口与供养步骤，方便第一次使用时快速了解。',
    to: '/topic/online-worship',
  },
  {
    title: '在线祭祀网站使用说明',
    body: '说明在线祭祀、追思先人与个性化牌位设置的常见用法与注意事项。',
    to: '/topic/online-ancestors',
  },
  {
    title: '功德回向怎么做',
    body: '整理礼佛、祭祀与超荐场景中常见的回向方式与表达思路。',
    to: '/topic/merit-dedication',
  },
  {
    title: '观音菩萨祈福指南',
    body: '适合查看与平安、慈悲、消灾和求助相关的观音祈愿主题。',
    to: '/topic/guanyin',
  },
  {
    title: '药师佛健康祈愿指南',
    body: '适合查看与健康、延寿、消灾和身心安乐相关的药师佛祈愿主题。',
    to: '/topic/medicine',
  },
  {
    title: '地藏菩萨超荐回向指南',
    body: '适合查看与超荐、回向、追思先人及亡灵救度相关的常见主题。',
    to: '/topic/ksitigarbha',
  },
]

function resolveHref(target) {
  return router.resolve(target).href
}

async function navigateTo(target) {
  const resolved = router.resolve(target)
  const current = router.currentRoute.value

  if (resolved.path === current.path && resolved.hash) {
    await nextTick()
    const samePageTarget = document.querySelector(resolved.hash)
    if (samePageTarget) {
      samePageTarget.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return
  }

  await router.push(target)

  if (resolved.hash) {
    await nextTick()
    const hashTarget = document.querySelector(resolved.hash)
    if (hashTarget) {
      hashTarget.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

function normalizeWishRecords(records, type) {
  return records.map((record) => {
    const createdAt = record.created_at ? String(record.created_at).replace(' ', 'T') : ''
    const time = createdAt ? new Date(createdAt).getTime() : 0
    return {
      ...record,
      record_type: type,
      record_key: `${type}-${record.id}`,
      record_time: Number.isNaN(time) ? 0 : time,
    }
  })
}

const buddhaRecentWishes = computed(() =>
  normalizeWishRecords(publicWishes.value, 'wish')
    .filter((record) => record.buddha && !record.blessing)
    .sort((a, b) => (b.record_time - a.record_time) || String(b.record_key).localeCompare(String(a.record_key)))
    .slice(0, 5)
)

const blessingRecentWishes = computed(() =>
  normalizeWishRecords(publicWishes.value, 'wish')
    .filter((record) => record.blessing)
    .sort((a, b) => (b.record_time - a.record_time) || String(b.record_key).localeCompare(String(a.record_key)))
    .slice(0, 5)
)

const ancestorRecentWishes = computed(() =>
  normalizeWishRecords(publicAncestorWishes.value, 'ancestor')
    .sort((a, b) => (b.record_time - a.record_time) || String(b.record_key).localeCompare(String(a.record_key)))
    .slice(0, 5)
)

const myRecentWishes = computed(() => {
  const combined = [
    ...normalizeWishRecords(myWishes.value, 'wish'),
    ...normalizeWishRecords(myAncestorWishes.value, 'ancestor'),
  ]
  return combined
    .sort((a, b) => (b.record_time - a.record_time) || String(b.record_key).localeCompare(String(a.record_key)))
    .slice(0, 5)
})

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
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      'content',
      '选择一位佛菩萨，以虔诚之心礼敬供养，发愿回向。收录释迦牟尼佛、阿弥陀佛、药师佛、观音菩萨等八位佛菩萨在线礼佛祈愿入口，也提供祭祀先人与回向页面。'
    )
  loadWishes()
})
</script>

<template>
  <main class="home-shell">
    <header class="hero-section">
      <div class="hero-copy">
        <div class="hero-emblem" aria-hidden="true">
          <span class="hero-emblem__ring"></span>
          <span class="hero-emblem__core"></span>
        </div>
        <p class="hero-kicker">线上礼佛与祭祀入口</p>
        <h1>礼佛祈愿</h1>
        <p class="hero-lead">
          以庄严而温和的方式，进入礼佛、祈愿、回向与追思的页面，在现代生活中保留一份敬意与安定。
        </p>
        <div class="hero-quote">
          <span class="hero-quote__line"></span>
          <p>愿来者先得安定，再明白如何进入。</p>
        </div>
      </div>

      <div class="hero-actions" aria-label="首页主要入口">
        <a
          v-for="item in primaryPaths"
          :key="item.title"
          :href="resolveHref(item.to)"
          class="hero-action"
          @click.prevent="navigateTo(item.to)"
          @mouseenter="warmApi"
          @mousedown="warmApi"
          @touchstart.passive="warmApi"
        >
          <span class="hero-action__title">{{ item.title }}</span>
          <span class="hero-action__body">{{ item.body }}</span>
          <span class="hero-action__cta">{{ item.cta }}</span>
        </a>
      </div>
    </header>

    <section id="buddha-catalog-title" class="catalog-section card">
      <div class="section-head">
        <p class="section-kicker">礼佛入口</p>
        <h2 class="section-title">诸佛菩萨</h2>
        <p class="section-sub">八位佛菩萨，各具大愿。选择与你此刻心意最相应的一页，安静进入礼敬与回向。</p>
      </div>
      <div class="catalog-grid">
        <router-link
          v-for="b in BUDDHAS"
          :key="b.slug"
          :to="'/buddha/' + b.slug"
          class="buddha-card"
          :aria-label="`进入${b.name}礼佛页面`"
          @mouseenter="warmApi"
          @mousedown="warmApi"
          @touchstart.passive="warmApi"
        >
          <div class="buddha-img-wrap">
            <img :src="b.thumb || b.image" :alt="b.name" loading="lazy" decoding="async" />
          </div>
          <div class="buddha-info">
            <h3>{{ b.name }}</h3>
            <span>{{ b.subtitle }}</span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="ritual-stage">
      <a
        href="/ancestors"
        class="ancestor-banner"
        aria-label="进入祭祀先人页面，追思祖先并进行回向祈福"
        @click.prevent="navigateTo('/ancestors')"
        @mouseenter="warmApi"
        @mousedown="warmApi"
        @touchstart.passive="warmApi"
      >
        <div class="ancestor-banner__media" aria-hidden="true"></div>
        <div class="ancestor-banner__content">
          <p class="ancestor-banner__kicker">追思与祭祀</p>
          <h2>祭祀先人</h2>
          <p>追思祖先，超荐亡灵，以克制而温暖的方式安放思念，也为家人留下可持续回访的祭祀入口。</p>
          <span class="ancestor-banner__cta">进入祭祀先人</span>
        </div>
      </a>
    </section>

    <BlessingPool @wish-submitted="loadWishes" />

    <section class="wishes-section card">
      <div class="section-head">
        <p class="section-kicker">当下回响</p>
        <h2 class="section-title">祈愿记录</h2>
        <p class="section-sub">网站内最近的礼佛与回向记录，以及当前设备识别到的个人记录，方便继续回看与追踪。</p>
      </div>
      <div class="record-grid">
        <section class="record-panel" aria-labelledby="buddha-wishes-title">
          <h3 id="buddha-wishes-title" class="record-title">拜佛记录</h3>
          <p class="record-note">显示最近 5 条礼佛与回向记录。</p>
          <WishList
            :wishes="buddhaRecentWishes"
            :loading="loadingPublic"
            empty-message="暂时还没有公开拜佛记录。"
          />
        </section>

        <section class="record-panel" aria-labelledby="ancestor-wishes-title">
          <h3 id="ancestor-wishes-title" class="record-title">祭祀记录</h3>
          <p class="record-note">显示最近 5 条祭祀、追思与回向记录。</p>
          <WishList
            :wishes="ancestorRecentWishes"
            :loading="loadingPublic"
            empty-message="暂时还没有公开祭祀记录。"
          />
        </section>

        <section class="record-panel" aria-labelledby="blessing-wishes-title">
          <h3 id="blessing-wishes-title" class="record-title">求福记录</h3>
          <p class="record-note">显示最近 5 条祈福池求福记录。</p>
          <WishList
            :wishes="blessingRecentWishes"
            :loading="loadingPublic"
            empty-message="暂时还没有公开求福记录。"
          />
        </section>

        <section class="record-panel" aria-labelledby="mine-wishes-title">
          <h3 id="mine-wishes-title" class="record-title">我的记录</h3>
          <p class="record-note">显示当前设备识别到的最近 5 条个人记录，方便你继续回看。</p>
          <WishList
            :wishes="myRecentWishes"
            :loading="loadingMine"
            :empty-message="
              viewerName
                ? '你最近还没有新的祈愿记录。'
                : '先提交一次祈愿，之后这里会显示你最近的 5 条记录。'
            "
          />
        </section>
      </div>
    </section>

    <section class="guide-section">
      <div class="guide-section__intro">
        <p class="section-kicker">初次进入</p>
        <h2 class="section-title">礼佛与回向指南</h2>
        <p class="section-sub">如果你是第一次使用，建议先了解礼佛、回向和祭祀页面的区别，再决定从哪一条路径开始。</p>
      </div>
      <div class="guide-grid">
        <article v-for="item in guideCards" :key="item.title" class="guide-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
      <div class="guide-links">
        <router-link to="/guide/worship">查看在线礼佛指南</router-link>
        <router-link to="/guide/ancestors">查看在线祭祀指南</router-link>
        <router-link to="/ancestors">查看祭祀先人总览</router-link>
        <router-link :to="'/buddha/' + BUDDHAS[0].slug">从本师释迦牟尼佛开始礼佛</router-link>
      </div>
    </section>

    <section class="insight-layout">
      <section class="faq-section card card--soft">
        <div class="section-head section-head--compact">
          <p class="section-kicker">常见问题</p>
          <h2 class="section-title">首次使用前，你可能想知道</h2>
        </div>
        <div class="faq-list">
          <details v-for="faq in faqs" :key="faq.q" class="faq-item">
            <summary>{{ faq.q }}</summary>
            <p>{{ faq.a }}</p>
          </details>
        </div>
      </section>

      <section class="path-section card card--soft">
        <div class="section-head section-head--compact">
          <p class="section-kicker">推荐路径</p>
          <h2 class="section-title">按心愿方向继续进入</h2>
        </div>
        <div class="path-grid">
          <article v-for="item in featuredPaths" :key="item.title" class="path-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
            <router-link :to="item.to">{{ item.cta }}</router-link>
          </article>
        </div>
      </section>
    </section>

    <section class="topics-section">
      <div class="section-head">
        <p class="section-kicker">专题说明</p>
        <h2 class="section-title">先看主题，再决定进入哪一页</h2>
        <p class="section-sub">如果你想先理解不同主题之间的区别，再决定从哪一条礼佛或祭祀路径进入，可以从这里开始。</p>
      </div>
      <div class="topics-list">
        <router-link v-for="item in topicPages" :key="item.title" :to="item.to" class="topic-row">
          <span class="topic-row__title">{{ item.title }}</span>
          <span class="topic-row__body">{{ item.body }}</span>
          <span class="topic-row__cta">查看专题</span>
        </router-link>
      </div>
    </section>

    <footer class="site-footer">
      <p>愿以此功德，庄严佛净土，上报四重恩，下济三途苦。</p>
    </footer>
  </main>
</template>

<style scoped>
.home-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 20px 72px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.hero-section {
  position: relative;
  padding: 46px 46px 42px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.82fr);
  gap: 24px;
  align-items: stretch;
  border-radius: 30px;
  background:
    radial-gradient(circle at 18% 12%, rgba(240, 208, 128, 0.22), transparent 18%),
    radial-gradient(circle at 30% 70%, rgba(196, 154, 108, 0.1), transparent 30%),
    linear-gradient(135deg, rgba(255, 249, 236, 0.98), rgba(239, 225, 195, 0.92) 54%, rgba(86, 57, 29, 0.96) 54.4%, rgba(46, 28, 13, 0.98));
  border: 1px solid rgba(180, 132, 72, 0.3);
  box-shadow:
    0 26px 70px rgba(68, 43, 17, 0.14),
    inset 0 1px 0 rgba(255, 251, 243, 0.8);
  animation: fadeInUp 0.7s ease both;
  overflow: hidden;
}

.hero-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(125deg, transparent 0 50%, rgba(255, 255, 255, 0.06) 50.2%, transparent 51%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 22%);
  pointer-events: none;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 14px;
  text-align: left;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.hero-emblem {
  position: relative;
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
}

.hero-emblem__ring,
.hero-emblem__core {
  position: absolute;
  border-radius: 999px;
}

.hero-emblem__ring {
  inset: 0;
  border: 1px solid rgba(212, 168, 67, 0.55);
  box-shadow:
    0 0 0 6px rgba(212, 168, 67, 0.08),
    0 12px 36px rgba(68, 43, 17, 0.08);
}

.hero-emblem__core {
  inset: 24px;
  background:
    radial-gradient(circle at 50% 35%, rgba(240, 208, 128, 0.9), rgba(196, 154, 108, 0.95) 60%, rgba(127, 90, 54, 0.95));
}

.hero-kicker {
  color: rgba(110, 74, 45, 0.76);
  font-size: 0.82rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.hero-section h1 {
  font-size: clamp(2.5rem, 5vw, 4.15rem);
  line-height: 1.06;
  color: #5f3e25;
  letter-spacing: 0.1em;
  text-shadow: 0 6px 16px rgba(127, 90, 54, 0.1);
}

.hero-lead {
  max-width: 620px;
  color: rgba(70, 50, 34, 0.92);
  font-size: 1rem;
  line-height: 1.88;
}

.hero-quote {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(127, 90, 54, 0.82);
  font-size: 0.9rem;
  line-height: 1.7;
}

.hero-quote__line {
  width: 58px;
  height: 1px;
  background: rgba(212, 168, 67, 0.7);
}

.hero-actions {
  width: 100%;
  display: grid;
  align-content: center;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  text-align: left;
  position: relative;
  z-index: 1;
}

.hero-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 18px 18px 16px;
  border-radius: 18px;
  text-decoration: none;
  color: inherit;
  background:
    linear-gradient(145deg, rgba(95, 66, 38, 0.96), rgba(52, 32, 16, 0.98));
  border: 1px solid rgba(240, 208, 128, 0.24);
  box-shadow:
    0 16px 34px rgba(20, 10, 0, 0.2),
    inset 0 1px 0 rgba(255, 240, 214, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.hero-action__title {
  color: #f3dfba;
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-action__body {
  color: rgba(243, 232, 214, 0.82);
  font-size: 0.84rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.hero-action__cta {
  color: #f0d080;
  font-size: 0.8rem;
  font-weight: 600;
}

.hero-action:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 44px rgba(20, 10, 0, 0.28);
  border-color: rgba(240, 208, 128, 0.42);
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.section-head--compact {
  margin-bottom: 18px;
}

.section-kicker {
  color: var(--accent-light);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.section-title {
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.03em;
}

.section-sub {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.72;
  max-width: 760px;
}

.card--soft {
  background: rgba(255, 252, 245, 0.72);
}

.catalog-section {
  animation: fadeInUp 0.7s 0.08s ease both;
}

.ritual-stage {
  display: block;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 20px;
}

.buddha-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  border-radius: 16px;
  background: rgba(255, 250, 240, 0.8);
  border: 1px solid rgba(212, 168, 67, 0.15);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  text-decoration: none;
  color: var(--text);
}

.buddha-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 36px rgba(68, 43, 17, 0.16);
  border-color: rgba(212, 168, 67, 0.4);
}

.buddha-img-wrap {
  width: 80%;
  aspect-ratio: 1;
  margin: 20px auto 0;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(245, 233, 208, 1), rgba(237, 224, 192, 1));
  border: 2px solid rgba(212, 168, 67, 0.35);
  box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.1);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.buddha-card:hover .buddha-img-wrap {
  border-color: var(--gold);
  box-shadow: 0 0 0 6px rgba(212, 168, 67, 0.18);
}

.buddha-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.buddha-card:hover .buddha-img-wrap img {
  transform: scale(1.04);
}

.buddha-info {
  width: 100%;
  padding: 16px 14px 18px;
  text-align: center;
}

.buddha-info h3 {
  font-size: 1.12rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.buddha-info span {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.65;
}

.ancestor-banner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  min-height: 280px;
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: rgba(30, 20, 10, 0.92);
  border: 1px solid rgba(212, 168, 67, 0.22);
  box-shadow: 0 16px 40px rgba(20, 10, 0, 0.18);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  animation: fadeInUp 0.7s 0.14s ease both;
}

.ancestor-banner:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 46px rgba(20, 10, 0, 0.24);
  border-color: rgba(212, 168, 67, 0.4);
}

.ancestor-banner__media {
  min-height: 100%;
  background:
    linear-gradient(90deg, rgba(20, 10, 0, 0.08), rgba(20, 10, 0, 0.52)),
    url('/jizhu/b1.png') center / cover no-repeat;
}

.ancestor-banner__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 36px 34px;
  background: linear-gradient(180deg, rgba(38, 25, 14, 0.96), rgba(58, 38, 22, 0.92));
}

.ancestor-banner__kicker {
  color: rgba(240, 208, 128, 0.78);
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.ancestor-banner__content h2 {
  color: #f2deba;
  font-size: clamp(1.75rem, 4vw, 2.6rem);
  line-height: 1.08;
  letter-spacing: 0.08em;
}

.ancestor-banner__content p {
  color: rgba(240, 231, 214, 0.88);
  font-size: 0.96rem;
  line-height: 1.85;
}

.ancestor-banner__cta {
  color: #f0d080;
  font-size: 0.88rem;
  font-weight: 600;
}

.wishes-section {
  animation: fadeInUp 0.7s 0.18s ease both;
}

.record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.record-panel {
  min-width: 0;
  padding: 16px 16px 14px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 251, 242, 0.86), rgba(248, 240, 224, 0.72));
  border: 1px solid rgba(212, 168, 67, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.record-title {
  color: var(--accent);
  font-size: 0.98rem;
  margin-bottom: 6px;
  padding-left: 9px;
  border-left: 3px solid var(--gold);
}

.record-note {
  color: var(--text-muted);
  font-size: 0.79rem;
  line-height: 1.65;
  margin-bottom: 12px;
}

.guide-section {
  padding: 30px 32px 32px;
  background:
    linear-gradient(180deg, rgba(244, 236, 220, 0.9), rgba(233, 220, 196, 0.72));
  border: 1px solid rgba(212, 168, 67, 0.16);
  border-left: 4px solid rgba(212, 168, 67, 0.5);
  border-radius: 22px;
  animation: fadeInUp 0.7s 0.2s ease both;
}

.guide-section__intro {
  margin-bottom: 20px;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.guide-card {
  min-width: 0;
  padding: 15px 16px;
  border-radius: 16px;
  background: rgba(255, 251, 242, 0.8);
  border: 1px solid rgba(212, 168, 67, 0.12);
}

.guide-card h3 {
  margin-bottom: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--accent);
}

.guide-card p {
  color: var(--text-muted);
  line-height: 1.72;
  font-size: 0.81rem;
  overflow-wrap: anywhere;
}

.guide-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.guide-links a {
  padding: 11px 15px;
  border-radius: 999px;
  border: 1px solid rgba(212, 168, 67, 0.22);
  color: var(--accent);
  text-decoration: none;
  background: rgba(255, 250, 240, 0.92);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.insight-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  min-width: 0;
  padding: 13px 15px;
  border-radius: 14px;
  background: rgba(255, 250, 242, 0.72);
  border: 1px solid rgba(212, 168, 67, 0.1);
}

.faq-item summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--accent);
  line-height: 1.65;
  list-style: none;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item p {
  color: var(--text-muted);
  line-height: 1.72;
  font-size: 0.81rem;
  margin-top: 8px;
}

.path-grid {
  display: grid;
  gap: 14px;
}

.path-card {
  padding: 15px 16px;
  border-radius: 14px;
  background: rgba(255, 251, 242, 0.72);
  border: 1px solid rgba(212, 168, 67, 0.1);
}

.path-card h3 {
  margin-bottom: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--accent);
}

.path-card p {
  color: var(--text-muted);
  line-height: 1.72;
  font-size: 0.81rem;
}

.path-card a {
  display: inline-flex;
  margin-top: 12px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.topics-section {
  padding: 14px 0 0;
  animation: fadeInUp 0.7s 0.22s ease both;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topic-row {
  display: grid;
  grid-template-columns: minmax(180px, 0.7fr) minmax(0, 1.2fr) auto;
  gap: 18px;
  align-items: center;
  padding: 18px 20px;
  border-radius: 18px;
  text-decoration: none;
  color: inherit;
  background:
    linear-gradient(90deg, rgba(255, 252, 246, 0.85), rgba(247, 238, 220, 0.76));
  border: 1px solid rgba(212, 168, 67, 0.14);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.topic-row:hover {
  transform: translateY(-2px);
  border-color: rgba(212, 168, 67, 0.35);
  box-shadow: 0 10px 26px rgba(68, 43, 17, 0.08);
}

.topic-row__title {
  color: var(--accent);
  font-weight: 600;
  line-height: 1.5;
}

.topic-row__body {
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.72;
  min-width: 0;
}

.topic-row__cta {
  color: var(--accent-light);
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
}

.site-footer {
  text-align: center;
  padding: 28px 12px 0;
  color: var(--text-muted);
  font-size: 0.86rem;
  letter-spacing: 0.04em;
}

.hero-action:focus-visible,
.buddha-card:focus-visible,
.ancestor-banner:focus-visible,
.guide-links a:focus-visible,
.faq-item summary:focus-visible,
.path-card a:focus-visible,
.topic-row:focus-visible {
  outline: 3px solid rgba(212, 168, 67, 0.55);
  outline-offset: 3px;
}

@media (max-width: 960px) {
  .home-shell {
    padding: 0 14px 56px;
    gap: 28px;
  }

  .hero-section {
    grid-template-columns: 1fr;
    padding: 34px 22px 30px;
  }

  .hero-actions,
  .guide-grid,
  .insight-layout,
  .record-grid {
    grid-template-columns: 1fr;
  }

  .ancestor-banner {
    grid-template-columns: 1fr;
  }

  .ancestor-banner__media {
    min-height: 220px;
  }

  .topic-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

@media (max-width: 640px) {
  .hero-lead,
  .section-sub,
  .ancestor-banner__content p {
    font-size: 0.94rem;
  }

  .hero-actions {
    grid-template-columns: 1fr;
  }

  .catalog-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .guide-section,
  .ancestor-banner__content,
  .topic-row,
  .path-card,
  .faq-item {
    padding-inline: 16px;
  }

  .buddha-info h3 {
    font-size: 1rem;
  }

  .hero-action {
    padding: 18px 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-section,
  .catalog-section,
  .ancestor-banner,
  .wishes-section,
  .guide-section,
  .topics-section,
  .hero-action,
  .buddha-card,
  .topic-row,
  .guide-links a {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>
