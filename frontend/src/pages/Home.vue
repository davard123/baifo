<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import FestivalGreeting from '../components/FestivalGreeting.vue'
import { HOME_ABOUT, HOME_FAQS } from '../data/homeContent.js'
import { useRouter } from 'vue-router'
import { TOPICS } from '../data/topics.js'
import { BUDDHAS } from '../data/buddhas.js'
import BlessingPool from '../components/BlessingPool.vue'
import WishList from '../components/WishList.vue'
import PublicWishWall from '../components/PublicWishWall.vue'
import { readLocalRecords } from '../utils/localRecords.js'
import { warmApi } from '../api.js'
const recordsError = ref('')

const localWishes = ref([])
const localAncestorWishes = ref([])
const loadingRecords = ref(true)
const viewerName = ref('')
// 主页诵经横幅：每次打开随机放一段静音循环短片（唱诵、诵读都有），点进去到对应的经文页。
// 预渲染出来的 HTML 里没有 muted 属性，所以挂载后再选片、手动静音、播放
const SUTRA_TEASERS = [
  { n: 1, to: '/jing/jingang/', label: '金刚经 · 唱诵' },
  { n: 2, to: '/jing/puxian/', label: '普贤行愿品 · 唱诵' },
  { n: 3, to: '/jing/puxian/', label: '普贤行愿品 · 唱诵' },
  { n: 4, to: '/jing/puxian/', label: '普贤行愿品 · 诵读' },
  { n: 5, to: '/jing/xinjing/', label: '心经 · 诵读' },
  { n: 6, to: '/jing/jingang/', label: '金刚经 · 唱诵' },
]
const sutraTeaserPick = ref(SUTRA_TEASERS[0])
const sutraTeaser = ref(null)
async function startSutraTeaser() {
  sutraTeaserPick.value = SUTRA_TEASERS[Math.floor(Math.random() * SUTRA_TEASERS.length)]
  await nextTick()
  const v = sutraTeaser.value
  if (!v) return
  v.muted = true
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  v.play().catch(() => {})
}
const router = useRouter()

const guideCards = [
  {
    title: '在线礼佛怎么开始',
    body: '从任意佛菩萨页面进入后，按顺序完成供花、点灯、上香，再留下祈愿内容与回向。',
  },
  {
    title: '适合哪些祈愿主题',
    body: '可以为自己或家人祝愿平安、表达感谢，也可以追思亲人。',
  },
  {
    title: '祭祀页面与礼佛页面的区别',
    body: '纪念亲人请进入祭祀先人；日常礼敬佛菩萨，可以从首页的佛像中选择。',
  },
]





const topicPages = ['merit-dedication', 'offering-incense', 'offering-light', 'health', 'overseas-chinese', 'qingming'].map(key => ({ title: TOPICS[key].heading, body: TOPICS[key].intro, to: '/topic/' + key }))

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
  normalizeWishRecords(localWishes.value, 'wish')
    .filter((record) => record.buddha && !record.blessing)
    .sort((a, b) => (b.record_time - a.record_time) || String(b.record_key).localeCompare(String(a.record_key)))
    .slice(0, 5)
)

const blessingRecentWishes = computed(() =>
  normalizeWishRecords(localWishes.value, 'wish')
    .filter((record) => record.blessing)
    .sort((a, b) => (b.record_time - a.record_time) || String(b.record_key).localeCompare(String(a.record_key)))
    .slice(0, 5)
)

const ancestorRecentWishes = computed(() =>
  normalizeWishRecords(localAncestorWishes.value, 'ancestor')
    .sort((a, b) => (b.record_time - a.record_time) || String(b.record_key).localeCompare(String(a.record_key)))
    .slice(0, 5)
)

function loadWishes() {
  loadingRecords.value = true
  recordsError.value = ''
  try {
    const rows = readLocalRecords()
    localWishes.value = rows.filter(row => row.record_type !== 'ancestor')
    localAncestorWishes.value = rows.filter(row => row.record_type === 'ancestor')
    viewerName.value = rows.at(-1)?.username || ''
  } catch (error) {
    recordsError.value = error.message
    localWishes.value = []
    localAncestorWishes.value = []
  }
  loadingRecords.value = false
}

onMounted(() => {
  startSutraTeaser()
  document.title = '求财祈福拜佛网｜网上求财 · 在线拜财神、礼佛祈愿与网上祭祖 - fopusha.com'
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      'content',
      '网上求财、网上祈福：在线拜财神、福禄寿，上香、献元宝、投金币，领一张写着你名字的祝福卡。也可以在线礼佛、网上祭祖，适合海外华人。'
    )
  loadWishes()
})
</script>

<template>
  <main class="home-shell">
    <FestivalGreeting />

    <a
      href="/qiucai/"
      class="qiucai-banner"
      aria-label="进入求财专区，在线拜财神"
      @click.prevent="navigateTo('/qiucai')"
      @mouseenter="warmApi"
      @mousedown="warmApi"
      @touchstart.passive="warmApi"
    >
      <img class="qiucai-banner__media" src="/qiucai/caishen-hero.webp?v=2" alt="财神与福禄寿三星" width="1600" height="900" />
      <div class="qiucai-banner__content">
        <h1 class="qiucai-banner__kicker">网上求财 · 网上祈福 · 在线拜财神</h1>
        <h2>拜一拜，给自己添一份财气</h2>
        <ul class="qiucai-banner__gains">
          <li><strong>求什么拜什么</strong>做生意求客似云来，上班求升职加薪，考试求金榜题名，为父母求健康长寿。</li>
          <li><strong>神仙会回应你</strong>上香、献元宝、投金币，叩拜三下，财神显灵撒金币、赐福放金光。</li>
          <li><strong>带走一张祝福卡</strong>写下心愿，领一张印着你名字和财神像的祝福卡，可以保存分享。</li>
          <li><strong>天天来添财气</strong>记录你的连拜天数和财气值，坚持越久，祝福越满。</li>
        </ul>
        <span class="qiucai-banner__cta">现在去拜财神 →</span>
        <span class="qiucai-banner__note">免费 · 不用注册 · 不收任何费用 · 几分钟拜完</span>
      </div>
    </a>

    <!-- 2026-10-25 诵经板块入口；10-27 用户嫌太靠后，挪到求财横幅正下方 -->
    <router-link :to="sutraTeaserPick.to" class="sutra-banner" aria-label="进入每日诵经：心经、金刚经、普贤行愿品唱诵视频">
      <div class="sutra-banner__media">
        <video
          ref="sutraTeaser"
          class="sutra-banner__img"
          :key="sutraTeaserPick.n"
          :src="`/jing/teaser/t${sutraTeaserPick.n}.mp4`"
          :poster="`/jing/teaser/t${sutraTeaserPick.n}.jpg`"
          muted
          autoplay
          loop
          playsinline
          preload="metadata"
          aria-hidden="true"
        ></video>
        <span class="sutra-banner__badge">▶ {{ sutraTeaserPick.label }} · 点开看完整视频</span>
      </div>
      <div class="sutra-banner__content">
        <p class="sutra-banner__kicker">每日诵经</p>
        <h2>看唱诵视频，跟着念经</h2>
        <p>心经、金刚经、普贤行愿品，唱诵视频点开就能看；全文带拼音，念到哪一句、哪一句就亮起来。</p>
        <span class="sutra-banner__cta">看诵经视频 →</span>
      </div>
    </router-link>

    <section id="buddha-catalog-title" class="catalog-section card">
      <div class="section-head">
        <p class="section-kicker">在线礼佛 · 诸佛菩萨</p>
        <h2 class="section-title">礼佛祈愿</h2>
        <p class="section-sub">八位佛菩萨，各具大愿。选一位与你此刻心意相应的，供花、点灯、上香，再写下祈愿与回向。</p>
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
      <div class="catalog-links">
        <router-link to="/jing/">在线诵经 · 心经、金刚经、普贤行愿品全文与唱诵视频 →</router-link>
        <router-link to="/nianfo/">念佛计数 · 开始今日功课 →</router-link>
        <router-link to="/guide/overview/">第一次来？看使用说明 →</router-link>
      </div>
    </section>

    <BlessingPool @wish-submitted="loadWishes" />

    <!-- 2026-10-24 用户要求：祈福和祭祀换位置，祭祀紧跟在祈福池下面 -->
    <section class="ritual-stage">
      <a
        href="/ancestors/"
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
          <p>为亲人供一束花、点一盏灯，写下思念与祝愿。</p>
          <span class="ancestor-banner__cta">进入祭祀先人</span>
        </div>
      </a>
    </section>


    <section class="intro-video card" aria-labelledby="intro-video-title">
      <div class="section-head">
        <p class="section-kicker">1 分钟看懂</p>
        <h2 id="intro-video-title" class="section-title">不用跑庙，手机上拜财神</h2>
        <p class="section-sub">选一位财神，上香、点灯、供果、献元宝，叩拜赐福，领一张求财祝福卡；也能礼佛、祭祖、为家人祈福。</p>
      </div>
      <video class="intro-video__player" controls playsinline preload="none" poster="/video/fopusha-intro-v3.jpg" width="1280" height="720">
        <source src="/video/fopusha-intro-v3.mp4" type="video/mp4" />
      </video>
    </section>

    <PublicWishWall title="心愿墙" sub="大家在礼佛、求财、祈福、追思时公开的心愿。名字只显示第一个字，不显示年龄和联系方式。" :limit="30" />

    <section class="wishes-section card">
      <div class="section-head">
        <p class="section-kicker">当下回响</p>
        <h2 class="section-title">我的祈愿记录</h2>
        <p class="section-sub">仅显示此浏览器中保存的记录，不按姓名查询服务器。记录不跨设备；清理浏览器数据可能丢失。历史服务器记录未导入，也不会公开。</p>
      </div>
      <p v-if="recordsError" role="alert">{{ recordsError }}</p>
      <div class="record-grid">
        <section class="record-panel" aria-labelledby="buddha-wishes-title">
          <h3 id="buddha-wishes-title" class="record-title">我的拜佛记录</h3>
          <p class="record-note">显示你最近 5 条礼佛与回向记录。</p>
          <WishList
            :wishes="buddhaRecentWishes"
            :loading="loadingRecords"
            :empty-message="
              viewerName
                ? '你最近还没有礼佛记录。'
                : '先到任一佛菩萨页面填写名字并仅保存到本机一次礼佛，之后这里会显示你最近的 5 条记录。'
            "
          />
        </section>

        <section class="record-panel" aria-labelledby="ancestor-wishes-title">
          <h3 id="ancestor-wishes-title" class="record-title">我的祭祀记录</h3>
          <p class="record-note">显示你最近 5 条祭祀、追思与回向记录。</p>
          <WishList
            :wishes="ancestorRecentWishes"
            :loading="loadingRecords"
            :empty-message="
              viewerName
                ? '你最近还没有祭祀记录。'
                : '先到祭祀先人页面填写名字并仅保存到本机一次回向，之后这里会显示你最近的 5 条记录。'
            "
          />
        </section>

        <section class="record-panel" aria-labelledby="blessing-wishes-title">
          <h3 id="blessing-wishes-title" class="record-title">我的求福记录</h3>
          <p class="record-note">显示你最近 5 条祈福池求福记录。</p>
          <WishList
            :wishes="blessingRecentWishes"
            :loading="loadingRecords"
            :empty-message="
              viewerName
                ? '你最近还没有求福记录。'
                : '先到祈福池填写名字并仅保存到本机一次求福，之后这里会显示你最近的 5 条记录。'
            "
          />
        </section>
      </div>
    </section>

    <section class="guide-section">
      <div class="guide-section__intro">
        <p class="section-kicker">初次进入</p>
        <h2 class="section-title">礼佛与回向指南</h2>
        <p class="section-sub">不熟悉操作时，可以先看下面的说明。不必一次完成所有步骤。</p>
      </div>
      <div class="guide-grid">
        <article v-for="item in guideCards" :key="item.title" class="guide-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
      <div class="guide-links">
        <router-link to="/guide/worship">查看在线礼佛指南</router-link>
        <router-link to="/guide/online-worship">网上拜佛怎么拜</router-link>
        <router-link to="/guide/overseas-worship">海外华人怎么拜佛</router-link>
        <router-link to="/guide/home-worship">在家拜佛怎么拜</router-link>
        <router-link to="/guide/ancestors">查看在线祭祀指南</router-link>
        <router-link to="/ancestors">查看祭祀先人总览</router-link>
        <router-link to="/guide/dongzhi-2026">冬至祭祖指南</router-link>
        <router-link to="/guide/qingming-2027">清明祭祖指南</router-link>
        <router-link :to="'/buddha/' + BUDDHAS[0].slug">从本师释迦牟尼佛开始礼佛</router-link>
      </div>
    </section>

    <section class="card privacy-note" aria-labelledby="privacy-note-title">
      <h2 id="privacy-note-title" class="section-title">免费，不用注册，不收任何费用</h2>
      <p>牌位照片、先人姓名和你写的祈愿，默认只保存在你自己的手机里，不上传。只有你选了「公开到心愿墙」，祈愿才会显示在网站上，名字只显示第一个字；公开的内容请不要写住址、电话等私密信息。</p>
    </section>

    <section class="topics-section">
      <div class="section-head">
        <p class="section-kicker">专题说明</p>
        <h2 class="section-title">供养、回向与追思</h2>
        <p class="section-sub">供花、上香或回向时有疑问，可以查阅这些说明。</p>
      </div>
      <div class="topics-list">
        <router-link v-for="item in topicPages" :key="item.title" :to="item.to" class="topic-row">
          <span class="topic-row__title">{{ item.title }}</span>
          <span class="topic-row__body">{{ item.body }}</span>
          <span class="topic-row__cta">查看专题</span>
        </router-link>
      </div>
    </section>


    <section class="card about-section" aria-labelledby="about-site-title">
      <div class="section-head">
        <p class="section-kicker">关于本站</p>
        <h2 id="about-site-title" class="section-title">在线礼佛与网上祭祖</h2>
      </div>
      <p v-for="line in HOME_ABOUT" :key="line" class="about-text">{{ line }}</p>

      <h3 class="faq-heading">常见问题</h3>
      <div class="faq-list">
        <details v-for="faq in HOME_FAQS" :key="faq.q" class="faq-item">
          <summary>{{ faq.q }}</summary>
          <p>{{ faq.a }}</p>
        </details>
      </div>
    </section>

    <footer class="site-footer">
      <p class="footer-brand">求财祈福拜佛网 · fopusha.com</p>
      <p>愿以此功德，庄严佛净土，上报四重恩，下济三途苦。</p>
      <p class="footer-contact">意见反馈与联系：<a href="mailto:fopushacom@gmail.com">fopushacom@gmail.com</a></p>
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
  padding: 54px 52px 48px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.82fr);
  gap: 28px;
  align-items: stretch;
  border-radius: 36px;
  background:
    radial-gradient(circle at 15% 18%, rgba(242, 200, 121, 0.18), transparent 22%),
    radial-gradient(circle at 82% 22%, rgba(137, 99, 195, 0.2), transparent 24%),
    radial-gradient(circle at 50% 78%, rgba(229, 144, 92, 0.14), transparent 20%),
    linear-gradient(135deg, rgba(27, 18, 35, 0.96), rgba(20, 15, 33, 0.94) 55%, rgba(11, 9, 18, 0.98));
  border: 1px solid rgba(242, 200, 121, 0.18);
  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 244, 220, 0.1);
  animation: fadeInUp 0.7s ease both;
  overflow: hidden;
}

.hero-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(125deg, transparent 0 42%, rgba(255, 255, 255, 0.04) 42.2%, transparent 43%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 24%);
  pointer-events: none;
}

.hero-section::before {
  content: '';
  position: absolute;
  inset: 14px;
  border-radius: 30px;
  border: 1px solid rgba(242, 200, 121, 0.1);
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
  border: 1px solid rgba(242, 200, 121, 0.52);
  box-shadow:
    0 0 0 6px rgba(242, 200, 121, 0.08),
    0 12px 36px rgba(0, 0, 0, 0.18);
}

.hero-emblem__core {
  inset: 24px;
  background:
    radial-gradient(circle at 50% 35%, rgba(249, 228, 171, 0.96), rgba(224, 168, 83, 0.95) 60%, rgba(139, 85, 52, 0.95));
}

.hero-kicker {
  color: rgba(246, 223, 170, 0.72);
  font-size: 0.82rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.hero-section h1 {
  font-size: clamp(2.5rem, 5vw, 4.15rem);
  line-height: 1.06;
  color: #fff5dd;
  letter-spacing: 0.12em;
  text-shadow: 0 8px 26px rgba(0, 0, 0, 0.34);
}

.hero-lead {
  max-width: 620px;
  color: rgba(246, 236, 214, 0.86);
  font-size: 1rem;
  line-height: 1.88;
}

.hero-quote {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(246, 223, 170, 0.74);
  font-size: 0.9rem;
  line-height: 1.7;
}

.hero-quote__line {
  width: 58px;
  height: 1px;
  background: rgba(242, 200, 121, 0.7);
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
    linear-gradient(145deg, rgba(44, 28, 57, 0.94), rgba(24, 18, 34, 0.98));
  border: 1px solid rgba(242, 200, 121, 0.18);
  box-shadow:
    0 18px 38px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 240, 214, 0.05);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.hero-action--daily {
  grid-column: 1 / -1;
  border-color: rgba(242, 200, 121, 0.36);
  background:
    linear-gradient(145deg, rgba(58, 38, 74, 0.96), rgba(30, 21, 43, 0.98));
}

.hero-action--daily .hero-action__cta {
  color: var(--gold-light);
}

.hero-action__title {
  color: #fff4da;
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-action__body {
  color: rgba(243, 232, 214, 0.74);
  font-size: 0.84rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.hero-action__cta {
  color: #f6dfaa;
  font-size: 0.8rem;
  font-weight: 600;
}

.hero-action:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
  border-color: rgba(242, 200, 121, 0.34);
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
  color: #fff1d0;
  letter-spacing: 0.03em;
}

.section-sub {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.72;
  max-width: 760px;
}

.card--soft {
  background: rgba(28, 20, 38, 0.72);
}

.catalog-section {
  animation: fadeInUp 0.7s 0.08s ease both;
}

.ritual-stage {
  display: block;
}

.intro-video__player {
  display: block;
  width: 100%;
  max-width: 960px;
  height: auto;
  margin: 18px auto 0;
  border-radius: 16px;
  background: #0b0f1a;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
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
  background: linear-gradient(180deg, rgba(33, 22, 44, 0.92), rgba(21, 15, 31, 0.96));
  border: 1px solid rgba(242, 200, 121, 0.12);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  text-decoration: none;
  color: #fff1d8;
}

.buddha-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.34);
  border-color: rgba(242, 200, 121, 0.28);
}

.buddha-img-wrap {
  width: 80%;
  aspect-ratio: 1;
  margin: 20px auto 0;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(62, 37, 84, 1), rgba(31, 23, 48, 1));
  border: 2px solid rgba(242, 200, 121, 0.28);
  box-shadow: 0 0 0 4px rgba(242, 200, 121, 0.08);
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
  color: #fff2d5;
  letter-spacing: 0.05em;
}

.buddha-info span {
  display: block;
  font-size: 0.78rem;
  color: rgba(244, 230, 204, 0.68);
  line-height: 1.65;
}

.qiucai-banner {
  display: grid;
  border-radius: 24px;
  overflow: hidden;
  color: #5a1a12;
  text-decoration: none;
  background: #fffbf2;
  border: 1px solid rgba(201, 154, 46, 0.45);
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.28);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.qiucai-banner:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}

.qiucai-banner__media {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.qiucai-banner__content {
  display: grid;
  gap: 12px;
  padding: 22px 28px 26px;
  border-top: 1px solid rgba(201, 154, 46, 0.3);
}

.qiucai-banner__kicker { margin: 0; color: #b07a1c; letter-spacing: 0.12em; font-size: 14px; font-weight: 400; line-height: inherit; }
.qiucai-banner__content h2 { font-size: clamp(26px, 4vw, 38px); color: #9e1b1f; }
.qiucai-banner__gains {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px 18px;
}
.qiucai-banner__gains li {
  padding-left: 26px;
  position: relative;
  line-height: 1.7;
  color: #6b3a1e;
}
.qiucai-banner__gains li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  width: 18px;
  height: 18px;
  background: url('/qiucai/prop-coin.webp?v=1') center / contain no-repeat;
}
.qiucai-banner__gains strong { display: block; color: #9e1b1f; }
.qiucai-banner__cta {
  justify-self: start;
  padding: 12px 24px;
  border-radius: 999px;
  background: linear-gradient(180deg, #c8282d, #9e1b1f);
  color: #fff3d6;
  font-weight: 700;
  font-size: 17px;
}
.qiucai-banner__note { font-size: 13px; color: #9a7a55; }

.catalog-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-top: 18px;
}

.catalog-links a {
  color: var(--accent-light);
  font-size: 15px;
}

.hero-action--featured {
  background: linear-gradient(160deg, rgba(184, 22, 27, 0.85), rgba(90, 11, 14, 0.9)) !important;
  border-color: rgba(255, 216, 107, 0.6) !important;
}

.hero-action--featured .hero-action__title,
.hero-action--featured .hero-action__body { color: #fff3d6 !important; }
.hero-action--featured .hero-action__cta { color: #ffd86b !important; }

.ancestor-banner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  min-height: 280px;
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: rgba(15, 12, 20, 0.96);
  border: 1px solid rgba(242, 200, 121, 0.18);
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.28);
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
    url('/jizhu/remembrance-20260906.webp?v=release1') 32% center / cover no-repeat;
}

.ancestor-banner__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 36px 34px;
  background: linear-gradient(180deg, rgba(31, 20, 42, 0.96), rgba(15, 12, 21, 0.94));
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
    linear-gradient(180deg, rgba(31, 21, 41, 0.88), rgba(23, 16, 31, 0.82));
  border: 1px solid rgba(242, 200, 121, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
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
    linear-gradient(180deg, rgba(30, 22, 40, 0.92), rgba(20, 15, 28, 0.82));
  border: 1px solid rgba(242, 200, 121, 0.14);
  border-left: 4px solid rgba(242, 200, 121, 0.5);
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
  background: rgba(255, 248, 233, 0.06);
  border: 1px solid rgba(242, 200, 121, 0.1);
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
  border: 1px solid rgba(242, 200, 121, 0.16);
  color: var(--accent-light);
  text-decoration: none;
  background: rgba(255, 248, 233, 0.04);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.insight-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.about-section {
  padding: 28px;
}

.about-text {
  margin: 0 0 12px;
  color: var(--text-muted);
  line-height: 1.85;
}

.faq-heading {
  margin: 20px 0 10px;
  color: var(--accent);
  font-size: 1.05rem;
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
  background: rgba(255, 248, 233, 0.04);
  border: 1px solid rgba(242, 200, 121, 0.08);
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
  background: rgba(255, 248, 233, 0.04);
  border: 1px solid rgba(242, 200, 121, 0.08);
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
    linear-gradient(90deg, rgba(32, 22, 42, 0.9), rgba(20, 15, 31, 0.8));
  border: 1px solid rgba(242, 200, 121, 0.1);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.topic-row:hover {
  transform: translateY(-2px);
  border-color: rgba(212, 168, 67, 0.35);
  box-shadow: 0 10px 26px rgba(68, 43, 17, 0.08);
}

.topic-row__title {
  color: #fff0cf;
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
  color: #f6dfaa;
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
}

.footer-brand { font-weight: 700; letter-spacing: 0.08em; color: var(--gold, #b8862f); }
.site-footer {
  text-align: center;
  padding: 28px 12px 0;
  color: var(--text-muted);
  font-size: 0.86rem;
  letter-spacing: 0.04em;
}

.footer-contact {
  margin-top: 8px;
  font-size: 0.8rem;
}

.footer-contact a {
  color: var(--accent);
  text-decoration: none;
  word-break: break-all;
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

  .qiucai-banner__content {
    padding: 22px;
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
/* Keep the first screen about choosing an action, not decorative copy. */
.hero-section { padding: 32px; border-radius: 24px; }
.hero-emblem, .hero-quote { display: none; }
.hero-action { padding: 14px 18px; }
.hero-action__body { line-height: 1.75; }
.privacy-note p { margin-top: 16px; max-width: 42em; line-height: 1.9; color: var(--text-muted); }
.topic-row__body { line-height: 1.8; }
@media(max-width: 700px) {
  .hero-section { padding: 24px 20px; grid-template-columns: 1fr; gap: 20px; }
  .hero-actions { grid-template-columns: 1fr 1fr; }
  .hero-action { padding: 14px 12px; }
  .hero-action__body { display: none; }
  .hero-action__title { font-size: 1rem; }
  .home-shell { padding-inline: 16px; }
}

/* Homepage prototype: a warmer, clearer first screen for older overseas Chinese readers. */
.hero-section {
  background:
    radial-gradient(circle at 8% 12%, rgba(247, 221, 168, 0.55), transparent 28%),
    linear-gradient(135deg, #fffaf0 0%, #f6eee1 58%, #efe3d2 100%);
  border: 1px solid rgba(144, 100, 48, 0.24);
  box-shadow: 0 22px 56px rgba(21, 13, 23, 0.22);
}
.hero-section::after { background: linear-gradient(125deg, transparent 0 42%, rgba(121, 78, 36, 0.05) 42.2%, transparent 43%); }
.hero-section::before { border-color: rgba(144, 100, 48, 0.18); }
.hero-kicker { color: #83623c; }
.hero-section h1 { color: #3d2a23; text-shadow: none; }
.hero-lead { color: #5b4a40; font-size: 1.06rem; }
.hero-quote { color: #7b5d38; }
.hero-quote__line { background: #b58a51; }
.hero-intent-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
.hero-intent-strip span { min-height: 36px; display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; color: #704c2a; background: rgba(255,255,255,.62); border: 1px solid rgba(144,100,48,.2); font-size: .86rem; font-weight: 700; }
.hero-action { background: rgba(255, 252, 246, 0.88); border-color: rgba(144, 100, 48, 0.22); box-shadow: 0 12px 24px rgba(87, 54, 25, .11); }
.hero-action__title { color: #3d2a23; }
.hero-action__body { color: #6c5a4f; }
.hero-action__cta { color: #8a5d27; }
.hero-action--daily .hero-action__cta { color: #8a5d27; }
.hero-action:hover { border-color: rgba(144,100,48,.48); box-shadow: 0 18px 34px rgba(87,54,25,.16); }
@media (max-width: 700px) {
  .hero-intent-strip { gap: 6px; }
  .hero-intent-strip span { min-height: 34px; padding-inline: 10px; font-size: .82rem; }
}

.sutra-banner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  margin: 20px 0;
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: rgba(15, 12, 20, 0.96);
  border: 1px solid rgba(242, 200, 121, 0.18);
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.28);
}
.sutra-banner__media { position: relative; min-height: 200px; }
.sutra-banner__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.sutra-banner__badge { position: absolute; left: 12px; top: 12px; padding: 5px 12px; border-radius: 999px; background: rgba(20, 12, 6, 0.72); color: #f8e5bd; font-size: 0.8rem; }
.sutra-banner__content { padding: 28px; display: grid; align-content: center; gap: 10px; }
.sutra-banner__kicker { margin: 0; color: #d4a843; letter-spacing: 0.12em; font-size: 0.85rem; }
.sutra-banner__content h2 { margin: 0; font-size: 1.6rem; color: #f8e5bd; }
.sutra-banner__content p { margin: 0; color: #d9c9b1; line-height: 1.7; }
.sutra-banner__cta { justify-self: start; margin-top: 6px; padding: 10px 18px; border-radius: 999px; background: #d4a843; color: #2a1c0c; font-weight: 700; }
@media (max-width: 720px) {
  .sutra-banner { grid-template-columns: 1fr; }
  .sutra-banner__media { min-height: 0; aspect-ratio: 16 / 9; }
  .sutra-banner__content { padding: 20px; }
}
</style>
