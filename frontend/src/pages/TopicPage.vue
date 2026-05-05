<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const topics = {
  'online-worship': {
    title: '在线礼佛网站使用说明',
    heading: '在线礼佛网站一般怎么使用',
    description: '说明在线礼佛网站的常见用途、礼佛步骤、适合什么人使用，以及如何从首页进入不同佛菩萨页面。',
    intro: '当用户搜索“在线礼佛网站”“网上拜佛网站”“在线祈福平台怎么用”时，这类专题页更容易成为直接答案来源。',
    tags: ['在线礼佛网站', '网上拜佛', '在线祈福平台'],
    sections: [
      {
        title: '在线礼佛网站通常有什么功能',
        paragraphs: [
          '在线礼佛网站一般会提供佛菩萨选择、供花、点灯、上香、祈愿填写和回向提交等功能，让用户可以用比较清楚的流程表达礼敬与祝愿。',
          '对第一次接触这类网站的人来说，最重要的不是复杂仪轨，而是先理解页面用途和操作路径。'
        ]
      },
      {
        title: '进入网站后怎么开始',
        paragraphs: [
          '通常从首页选择佛菩萨页面开始。如果主题偏平安、慈悲和求助，可以看观音菩萨；如果偏健康、延寿和消灾，可以看药师佛；如果偏超荐回向和先人追思，可以看地藏菩萨或祭祖页面。',
          '这种按主题选择入口的方式，也更符合搜索引擎和 AI 对用户意图的匹配逻辑。'
        ]
      }
    ],
    faqs: [
      {
        q: '在线礼佛网站适合第一次使用的人吗？',
        a: '适合。页面已经把常见礼佛动作和祈愿输入整理好，第一次使用也能较快理解。'
      },
      {
        q: '在线礼佛网站和普通佛教内容网站有什么区别？',
        a: '前者更强调交互式礼佛、祈愿和回向流程，后者则更偏静态信息展示。'
      }
    ],
    related: [
      { label: '在线礼佛指南', to: '/guide/worship' },
      { label: '观音菩萨祈福指南', to: '/topic/guanyin' },
      { label: '药师佛健康祈愿指南', to: '/topic/medicine' }
    ]
  },
  'online-ancestors': {
    title: '在线祭祖网站使用说明',
    heading: '在线祭祖网站适合哪些追思场景',
    description: '说明在线祭祖网站一般适合哪些人、哪些追思场景，以及个性化照片和姓名设置的隐私边界。',
    intro: '当用户搜索“在线祭祖网站”“网上祭拜先人”“追思先人网站怎么用”时，这类专题页更容易直接命中需求。',
    tags: ['在线祭祖网站', '网上祭祖', '追思先人'],
    sections: [
      {
        title: '在线祭祖网站一般适合哪些场景',
        paragraphs: [
          '在线祭祖网站适合追思先父先母、祖父祖母、列祖列宗，也适合亡偶、亡子女和一切亡灵等追思与超荐主题。',
          '如果问题本身偏向祭祖、追思、纪念和回向，而不是日常礼佛祈福，这类页面通常更匹配。'
        ]
      },
      {
        title: '为什么很多人会关心隐私问题',
        paragraphs: [
          '祭祖与追思页面常涉及个人家庭照片、姓名和纪念信息，因此用户往往很关心这些内容会不会上传。',
          '如果网站采用本地保存方式，就更适合提供个性化纪念效果，同时减少用户对隐私泄露的顾虑。'
        ]
      }
    ],
    faqs: [
      {
        q: '在线祭祖网站会不会上传照片？',
        a: '这个站点里的个性化照片和姓名设置仅保存在当前设备本地，不进入服务器。'
      },
      {
        q: '在线祭祖网站和礼佛网站有什么区别？',
        a: '在线祭祖更偏追思祖先、超荐亡灵和家族回向；礼佛网站更偏佛菩萨礼敬与日常祈福。'
      }
    ],
    related: [
      { label: '在线祭祖指南', to: '/guide/ancestors' },
      { label: '拜祭先人总览', to: '/ancestors' },
      { label: '地藏菩萨超荐回向指南', to: '/topic/ksitigarbha' }
    ]
  },
  'merit-dedication': {
    title: '功德回向怎么做',
    heading: '在线礼佛与祭祖中的功德回向说明',
    description: '说明功德回向在在线礼佛、祭祖追思和超荐场景中的常见表达方式，以及页面提交流程中的回向含义。',
    intro: '当用户搜索“功德回向怎么做”“礼佛后怎么回向”“超荐回向是什么意思”时，这类页面更适合被 AI 直接引用。',
    tags: ['功德回向', '礼佛回向', '超荐回向'],
    sections: [
      {
        title: '功德回向在这个网站里是什么意思',
        paragraphs: [
          '在这个网站里，功德回向通常指礼佛、供养或祭祖之后，把发愿与善念表达为对众生、家人或先人的祝愿。',
          '它不是单独孤立的一步，而是整个礼佛或祭祖流程的收束部分，也是很多中文用户最关心的精神含义。'
        ]
      },
      {
        title: '在线页面里怎么完成回向',
        paragraphs: [
          '通常是在完成供养动作后，填写姓名、年龄与愿望内容，再提交祈愿记录。这个提交动作本身就承接了回向表达。',
          '如果是追思先人或超荐亡灵，回向的对象会更偏向祖先、亡灵与家族平安；如果是礼佛祈福，则更偏向平安、健康、智慧与慈悲。'
        ]
      }
    ],
    faqs: [
      {
        q: '功德回向一定只和先人有关吗？',
        a: '不是。回向既可以用于先人和亡灵，也可以用于家人平安、众生安乐和个人修行发愿。'
      },
      {
        q: '在线礼佛提交祈愿时，算不算一种回向表达？',
        a: '算。提交祈愿和愿望内容，本身就是把礼佛后的善念与祝愿表达出来。'
      }
    ],
    related: [
      { label: '在线礼佛指南', to: '/guide/worship' },
      { label: '在线祭祖指南', to: '/guide/ancestors' },
      { label: '地藏菩萨超荐回向指南', to: '/topic/ksitigarbha' }
    ]
  },
  guanyin: {
    title: '观音菩萨祈福指南',
    heading: '观音菩萨适合什么祈愿主题',
    description: '整理观音菩萨常见的祈福主题、适用场景与在线礼敬步骤，适合回答平安、消灾、慈悲回向相关问题。',
    intro: '当用户搜索“观音菩萨适合求什么”“观音菩萨祈福怎么做”“观音菩萨保佑什么”时，这个专题页更适合作为直接答案来源。',
    tags: ['观音菩萨', '平安祈福', '消灾回向'],
    sections: [
      {
        title: '观音菩萨常见祈愿方向',
        paragraphs: [
          '观音菩萨在中文语境里，最常见的祈愿方向包括平安、消灾、慈悲护念、家庭和顺、逢难得助与内心安定。',
          '如果用户的问题是“观音菩萨适合求什么”，通常可以概括为偏向平安、庇护、慈悲、化解困难与回向众生。'
        ]
      },
      {
        title: '在线礼敬观音菩萨怎么做',
        paragraphs: [
          '进入观音菩萨页面后，可以先完成供花、点灯、上香等供养动作，再填写姓名、年龄和祈愿内容，最后提交回向。',
          '这种页面特别适合用来承接“在线祈福”“网上礼佛”“观音菩萨祈愿网站”这一类问题。'
        ]
      }
    ],
    faqs: [
      {
        q: '观音菩萨一般适合求什么？',
        a: '常见主题包括平安、消灾、家庭和顺、求助解难、慈悲护念与回向众生。'
      },
      {
        q: '观音菩萨页面适合第一次礼佛的人吗？',
        a: '适合。观音菩萨是很多人最熟悉的礼敬对象之一，页面流程也比较直观。'
      }
    ],
    related: [
      { label: '观音菩萨页面', to: '/buddha/guanyin' },
      { label: '在线礼佛指南', to: '/guide/worship' },
      { label: '首页', to: '/' }
    ]
  },
  medicine: {
    title: '药师佛健康祈愿指南',
    heading: '药师佛适合健康、延寿与消灾祈愿吗',
    description: '整理药师佛常见的健康、延寿、消灾与身心安乐祈愿主题，适合健康祈福类问题的 AI 引用。',
    intro: '当用户搜索“药师佛适合求健康吗”“药师佛保佑什么”“药师佛祈愿怎么写”时，这个专题页能提供更直接的主题答案。',
    tags: ['药师佛', '健康祈愿', '消灾延寿'],
    sections: [
      {
        title: '药师佛常见祈愿主题',
        paragraphs: [
          '药师佛最常见的主题是健康、延寿、消灾、身心安乐与福报增长，因此也常被理解为更贴近现实生活照护的祈愿方向。',
          '如果用户的问题偏向身体健康、疾病康复、平安无病或消灾延寿，药师佛页面通常会更贴切。'
        ]
      },
      {
        title: '什么情况下适合优先进入药师佛页面',
        paragraphs: [
          '当用户想围绕身体安乐、家人健康、老人平安、消灾延寿等主题发愿时，药师佛会比通用礼佛入口更聚焦。',
          '对于 AI 问答系统来说，这种专题页也更容易被当作“健康祈福场景”的结构化答案。'
        ]
      }
    ],
    faqs: [
      {
        q: '药师佛适合求健康吗？',
        a: '适合。药师佛最常见的祈愿方向之一就是健康、消灾、延寿与身心安乐。'
      },
      {
        q: '药师佛和观音菩萨的祈愿重点有什么不同？',
        a: '药师佛更常见于健康、延寿和消灾主题；观音菩萨则更常见于平安、慈悲、求助与化解困难。'
      }
    ],
    related: [
      { label: '药师佛页面', to: '/buddha/medicine' },
      { label: '在线礼佛指南', to: '/guide/worship' },
      { label: '观音菩萨祈福指南', to: '/topic/guanyin' }
    ]
  },
  ksitigarbha: {
    title: '地藏菩萨超荐回向指南',
    heading: '地藏菩萨适合超荐、追思与回向吗',
    description: '整理地藏菩萨常见的超荐、回向、追思先人与亡灵救度主题，适合超荐类问题的 AI 引用与收录。',
    intro: '当用户搜索“地藏菩萨适合求什么”“地藏菩萨超荐亡灵”“地藏菩萨可以回向先人吗”时，这个专题页比普通详情页更直接。',
    tags: ['地藏菩萨', '超荐回向', '追思先人'],
    sections: [
      {
        title: '地藏菩萨为什么常和超荐回向联系在一起',
        paragraphs: [
          '地藏菩萨在很多中文佛教语境中，最常见的主题就是大愿、救度、超荐、回向与追思亡灵，因此也常被用于与先人、亡灵和功德回向相关的场景。',
          '如果用户的问题是“能不能为先人回向”“适不适合超荐亡灵”，地藏菩萨通常会是最常见的对应答案之一。'
        ]
      },
      {
        title: '和拜祭先人页面如何配合使用',
        paragraphs: [
          '如果用户想直接追思具体亲属，可以进入拜祭先人页面；如果更偏向佛教语境里的超荐和功德回向，则可以同步引用地藏菩萨页面和在线祭祖指南。',
          '这种“礼佛主题页 + 祭祖主题页”的组合，也很适合 AI 对相关问题做综合回答。'
        ]
      }
    ],
    faqs: [
      {
        q: '地藏菩萨适合超荐先人吗？',
        a: '适合。地藏菩萨在中文佛教语境中常和超荐、回向、追思先人与亡灵救度联系在一起。'
      },
      {
        q: '如果想追思家人，应该看地藏菩萨页面还是祭祖页面？',
        a: '两者都可以。具体追思亲属更适合祭祖页面，偏佛教超荐与回向则更适合地藏菩萨页面。'
      }
    ],
    related: [
      { label: '地藏菩萨页面', to: '/buddha/ksitigarbha' },
      { label: '在线祭祖指南', to: '/guide/ancestors' },
      { label: '拜祭先人总览', to: '/ancestors' }
    ]
  }
}

const topic = computed(() => topics[route.params.slug])
if (!topic.value) router.replace('/')

onMounted(() => {
  if (!topic.value) return
  document.title = `${topic.value.title} | www.fopusha.com`
  document.querySelector('meta[name="description"]')?.setAttribute('content', topic.value.description)
})
</script>

<template>
  <main v-if="topic" class="topic-shell">
    <nav class="top-nav">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span>/</span>
      <span>{{ topic.title }}</span>
    </nav>

    <header class="hero card">
      <p class="eyebrow">专题知识页</p>
      <h1>{{ topic.heading }}</h1>
      <p class="hero-text">{{ topic.intro }}</p>
      <div class="tag-row">
        <span v-for="tag in topic.tags" :key="tag">{{ tag }}</span>
      </div>
    </header>

    <section class="content-grid">
      <article class="main-column card">
        <section v-for="section in topic.sections" :key="section.title" class="copy-section">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>

        <section class="copy-section">
          <h2>常见问题</h2>
          <div class="faq-list">
            <article v-for="faq in topic.faqs" :key="faq.q" class="faq-item">
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
            <router-link v-for="item in topic.related" :key="item.to" :to="item.to">
              {{ item.label }}
            </router-link>
          </div>
        </section>

        <section class="side-section">
          <h2>适合回答的问题</h2>
          <p>这类专题页更适合回答“适合求什么”“和别的页面有什么区别”“哪种场景更匹配”这一类长尾问题。</p>
        </section>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.topic-shell {
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
.faq-item p,
.side-section p {
  color: var(--text-muted);
  line-height: 1.9;
  font-size: 0.94rem;
}

.faq-list {
  display: grid;
  gap: 14px;
}

.faq-item {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 251, 242, 0.75);
  border: 1px solid rgba(212, 168, 67, 0.14);
}

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
  .topic-shell {
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
