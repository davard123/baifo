<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BUDDHAS } from '../data/buddhas.js'

const route = useRoute()
const router = useRouter()

const guides = {
  worship: {
    title: '在线礼佛指南',
    heading: '在线礼佛步骤与适用祈愿指南',
    description: '这份指南说明如何在线礼佛、供花、点灯、上香和发愿回向，也整理不同佛菩萨更常见的祈愿侧重。',
    intro: '这页把在线礼佛的常见步骤、不同佛菩萨的常见祈愿主题，以及第一次使用时的进入方式整理成了一份总览。',
    tags: ['在线礼佛', '礼佛步骤', '祈愿回向'],
    sections: [
      {
        title: '在线礼佛一般怎么进行',
        paragraphs: [
          '在线礼佛通常分为四步：先选择佛菩萨页面，再完成供花、点灯、上香等供养动作，然后填写姓名、年龄和祈愿内容，最后提交回向。',
          '这种流程适合第一次接触佛教祈愿的人，因为页面已经把常见动作集中在一个地方，用户不需要自己整理仪轨，也更容易理解礼佛的基本步骤。'
        ]
      },
      {
        title: '常见祈愿主题怎么对应',
        paragraphs: [
          '如果主题偏向平安、慈悲、消灾与普门应感，很多人会优先礼敬观音菩萨；如果主题偏向超荐祖先、回向亡灵与大愿救度，通常更适合地藏菩萨；如果主题偏向健康长寿与消灾延寿，则常见对应药师佛。',
          '如果用户希望从更基础、更全面的礼佛入口开始，可以先从释迦牟尼佛页面进入，再根据自己具体心愿继续浏览其他佛菩萨页面。'
        ]
      }
    ],
    faqs: [
      {
        q: '在线礼佛网站通常能做什么？',
        a: '通常可以选择佛菩萨页面，完成供花、点灯、上香等动作，并填写祈愿内容后提交回向。'
      },
      {
        q: '第一次礼佛建议先从哪个页面开始？',
        a: '如果没有特别明确的祈愿主题，可以先从释迦牟尼佛页面开始，再根据健康、平安、智慧、超荐等主题进入相应佛菩萨页面。'
      },
      {
        q: '观音菩萨、药师佛、地藏菩萨分别适合什么主题？',
        a: '观音菩萨常见于慈悲、平安、消灾与求助；药师佛更常见于健康、延寿、消灾；地藏菩萨则更常见于超荐、回向与亡灵救度。'
      }
    ],
    related: [
      { label: '本师释迦牟尼佛', to: '/buddha/shakyamuni' },
      { label: '观音菩萨', to: '/buddha/guanyin' },
      { label: '药师佛', to: '/buddha/medicine' },
      { label: '地藏菩萨', to: '/buddha/ksitigarbha' }
    ]
  },
  ancestors: {
    title: '在线祭祖指南',
    heading: '拜祭先人、追思回向与隐私说明',
    description: '这份指南说明如何在线祭祖、拜祭先人、进行追思回向，以及个性化照片与姓名设置的隐私边界。',
    intro: '这页集中说明在线祭祖、追思回向、牌位使用场景，以及个性化照片和姓名的保存方式。',
    tags: ['在线祭祖', '拜祭先人', '追思回向'],
    sections: [
      {
        title: '在线祭祖适合哪些场景',
        paragraphs: [
          '在线祭祖页面适合追思先父、先母、祖父、祖母、列祖列宗，也适合为亡偶、亡子女与一切亡灵做超荐回向。',
          '这类页面更偏向纪念、回向、祭祖和家族祈愿，与日常礼佛祈福页面的使用目的不同。'
        ]
      },
      {
        title: '个性化照片和姓名如何处理',
        paragraphs: [
          '先人页面支持在本地设备中设置个性化照片和姓名，用于生成更贴近个人情感的牌位显示效果。',
          '这些个性化设置只保存在当前设备，不会上传到服务器，因此更适合包含私密家庭纪念信息的使用场景。'
        ]
      }
    ],
    faqs: [
      {
        q: '在线祭祖页面一般怎么使用？',
        a: '通常先选择对应先人或相关页面，再完成供奉动作，填写祈愿内容，最后提交回向。'
      },
      {
        q: '照片和姓名会不会上传到服务器？',
        a: '不会。个性化照片和姓名设置仅保存在本地设备，用于当前设备显示。'
      },
      {
        q: '在线祭祖和在线礼佛有什么不同？',
        a: '在线礼佛更偏向佛菩萨礼敬与日常祈福；在线祭祖更偏向追思祖先、超荐亡灵和家族回向。'
      }
    ],
    related: [
      { label: '拜祭先人总览', to: '/ancestors' },
      { label: '列祖列宗', to: '/ancestor/ancestors' },
      { label: '一切亡灵', to: '/ancestor/general' },
      { label: '先父', to: '/ancestor/father' }
    ]
  }
}

const guide = computed(() => guides[route.params.slug])
if (!guide.value) router.replace('/')

onMounted(() => {
  if (!guide.value) return
  document.title = `${guide.value.title} | www.fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute('content', guide.value.description)
})

const quickReference = computed(() => [
  {
    name: '释迦牟尼佛',
    point: '适合作为通用礼佛入口，帮助初次使用者理解网站结构与礼佛流程。',
  },
  {
    name: '观音菩萨',
    point: '常见于慈悲、平安、消灾、求助与普门应感相关主题。',
  },
  {
    name: '药师佛',
    point: '常见于健康、延寿、消灾与身体安乐相关主题。',
  },
  {
    name: '地藏菩萨',
    point: '常见于超荐、回向、追思先人和亡灵救度相关主题。',
  }
])
</script>

<template>
  <main v-if="guide" class="guide-shell">
    <nav class="top-nav">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span>/</span>
      <span>{{ guide.title }}</span>
    </nav>

    <header class="hero card">
      <div class="hero-copy">
        <p class="eyebrow">使用指南</p>
        <h1>{{ guide.heading }}</h1>
        <p class="hero-text">{{ guide.intro }}</p>
        <div class="tag-row">
          <span v-for="tag in guide.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
    </header>

    <section class="content-grid">
      <article class="main-column card">
        <section v-for="section in guide.sections" :key="section.title" class="copy-section">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>

        <section v-if="route.params.slug === 'worship'" class="copy-section">
          <h2>不同佛菩萨的常见侧重</h2>
          <div class="reference-list">
            <article v-for="item in quickReference" :key="item.name" class="reference-item">
              <h3>{{ item.name }}</h3>
              <p>{{ item.point }}</p>
            </article>
          </div>
        </section>

        <section class="copy-section">
          <h2>常见问题</h2>
          <div class="faq-list">
            <article v-for="faq in guide.faqs" :key="faq.q" class="faq-item">
              <h3>{{ faq.q }}</h3>
              <p>{{ faq.a }}</p>
            </article>
          </div>
        </section>
      </article>

      <aside class="side-column card">
        <section class="side-section">
          <h2>相关页面</h2>
          <div class="side-links">
            <router-link v-for="item in guide.related" :key="item.to" :to="item.to">
              {{ item.label }}
            </router-link>
          </div>
        </section>

        <section class="side-section">
          <h2>阅读建议</h2>
          <p>如果你是第一次使用，可以先看这页，再进入对应的礼佛或祭祖页面操作。</p>
        </section>

        <section class="side-section" v-if="route.params.slug === 'worship'">
          <h2>延伸阅读</h2>
          <div class="side-links">
            <router-link v-for="buddha in BUDDHAS.slice(0, 4)" :key="buddha.slug" :to="'/buddha/' + buddha.slug">
              {{ buddha.name }}
            </router-link>
          </div>
        </section>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.guide-shell {
  max-width: 1140px;
  margin: 0 auto;
  padding: 18px 20px 64px;
}

.top-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.88rem;
  margin-bottom: 18px;
}

.back-link {
  color: var(--accent);
  text-decoration: none;
}

.hero {
  margin-bottom: 20px;
}

.eyebrow {
  color: var(--gold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.78rem;
  margin-bottom: 10px;
}

.hero h1 {
  color: var(--accent);
  font-size: 2rem;
  margin-bottom: 12px;
}

.hero-text {
  color: var(--text-muted);
  line-height: 1.85;
  max-width: 760px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.tag-row span {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(212, 168, 67, 0.12);
  color: var(--accent);
  font-size: 0.8rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 20px;
}

.copy-section + .copy-section {
  margin-top: 24px;
}

.copy-section h2,
.reference-item h3,
.faq-item h3,
.side-section h2 {
  color: var(--accent);
}

.copy-section h2,
.side-section h2 {
  font-size: 1.05rem;
  margin-bottom: 10px;
}

.copy-section p,
.reference-item p,
.faq-item p,
.side-section p {
  color: var(--text-muted);
  line-height: 1.9;
  font-size: 0.94rem;
}

.reference-list,
.faq-list {
  display: grid;
  gap: 14px;
}

.reference-item,
.faq-item {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 251, 242, 0.75);
  border: 1px solid rgba(212, 168, 67, 0.14);
}

.reference-item h3,
.faq-item h3 {
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.side-section + .side-section {
  margin-top: 22px;
}

.side-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-links a {
  color: var(--accent);
  text-decoration: none;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .guide-shell {
    padding: 14px 12px 48px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 1.6rem;
  }
}
</style>
