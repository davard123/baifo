<script setup>
// 诵经板块：/jing/ 目录，/jing/:slug/ 单部经。
// 先放「跟着念」的播放器和全文（操作），介绍和常见问题放在后面，不让操作被说明埋住。
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { SUTRAS, SUTRA_BY_SLUG } from '../data/sutras.js'
import NotFoundPage from './NotFoundPage.vue'

const route = useRoute()
const sutra = computed(() => (route.params.slug ? SUTRA_BY_SLUG[route.params.slug] : null))
const isList = computed(() => !route.params.slug)

const versionKey = ref('read')
const version = computed(() => sutra.value?.audio.find((a) => a.key === versionKey.value) || sutra.value?.audio[0] || null)
const showPinyin = ref(false)
// 视频点了才加载 YouTube，平时不拖慢页面
const videoOn = ref(false)
const videoIndex = ref(0)
const video = computed(() => sutra.value?.videos?.[videoIndex.value] || null)
watch(() => route.params.slug, () => { videoOn.value = false; videoIndex.value = 0 })
function pickVideo(i) {
  videoIndex.value = i
  videoOn.value = false
}
const player = ref(null)
const playing = ref(false)
const currentN = ref(0)
const lineRefs = {}

function onTimeUpdate() {
  const t = player.value?.currentTime ?? 0
  const hit = version.value?.timing.lines.find(([, start, end]) => t >= start && t < end + 0.35)
  const n = hit ? hit[0] : 0
  if (n && n !== currentN.value) {
    currentN.value = n
    lineRefs[n]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

function pickVersion(key) {
  if (key === versionKey.value) return
  versionKey.value = key
  currentN.value = 0
  playing.value = false
}

// 点哪一句就从哪一句开始念
function seekTo(n) {
  const hit = version.value?.timing.lines.find(([ln]) => ln === n)
  if (!hit || !player.value) return
  player.value.currentTime = hit[1]
  player.value.play()
}

watch(() => route.params.slug, () => {
  versionKey.value = 'read'
  currentN.value = 0
  playing.value = false
})
onBeforeUnmount(() => player.value?.pause())
</script>

<template>
  <main v-if="isList" class="jing-shell">
    <nav class="top-nav"><router-link to="/" class="page-link">← 返回首页</router-link></nav>
    <header class="jing-head">
      <p class="section-kicker">每日诵经</p>
      <h1>诵经</h1>
      <p class="lead">常诵经咒的完整经文，带拼音，可以跟着诵读音频一句一句念。免费，不用注册。</p>
    </header>
    <section class="jing-list">
      <router-link v-for="s in SUTRAS" :key="s.slug" :to="`/jing/${s.slug}/`" class="jing-card card">
        <img :src="s.image" :alt="s.name" class="jing-card__img" loading="lazy" />
        <div>
          <h2>{{ s.title }}<small>{{ s.name }}</small></h2>
          <p>{{ s.translator }} · {{ s.lines.length }} 句 · {{ s.charCount }} 字</p>
          <span class="jing-card__tag">{{ s.audio.length ? '可跟读音频' : '音频制作中' }}</span>
        </div>
      </router-link>
    </section>
    <p class="jing-note">经文出处：CBETA 电子佛典（CC BY-NC-SA），本站按通行课诵本校订。</p>
  </main>

  <main v-else-if="sutra" class="jing-shell">
    <nav class="top-nav">
      <router-link to="/" class="page-link">首页</router-link>
      <span class="crumb-sep">/</span>
      <router-link to="/jing/" class="page-link">诵经</router-link>
      <span class="crumb-sep">/</span>
      <span class="crumb-current">{{ sutra.title }}</span>
    </nav>

    <header class="jing-head">
      <p class="section-kicker">{{ sutra.translator }}</p>
      <h1>{{ sutra.name }}</h1>
      <p class="lead">{{ sutra.title }}全文 · {{ sutra.lines.length }} 句 · {{ sutra.charCount }} 字 · 带拼音</p>
    </header>

    <section class="jing-player card" aria-label="诵读音频">
      <template v-if="version">
        <div class="jing-versions" role="tablist" aria-label="诵读版本">
          <button
            v-for="a in sutra.audio"
            :key="a.key"
            type="button"
            role="tab"
            :aria-selected="a.key === versionKey"
            :class="{ on: a.key === versionKey }"
            @click="pickVersion(a.key)"
          >{{ a.label }}</button>
        </div>
        <audio
          ref="player"
          :key="version.src"
          :src="version.src"
          controls
          preload="metadata"
          class="jing-audio"
          @timeupdate="onTimeUpdate"
          @play="playing = true"
          @pause="playing = false"
        ></audio>
        <p class="jing-tip">播放时当前句会亮起；点任意一句，从那一句开始念。</p>
      </template>
      <p v-else class="jing-tip">诵读音频正在制作，先可以对着经文自己念。</p>
      <label class="jing-switch"><input v-model="showPinyin" type="checkbox" /> 显示拼音</label>
    </section>

    <section v-if="sutra.videos?.length" class="jing-video card" aria-label="诵经视频">
      <h2 class="jing-video__title">诵经视频</h2>
      <div v-if="sutra.videos.length > 1" class="jing-versions" role="tablist" aria-label="视频版本">
        <button
          v-for="(v, i) in sutra.videos"
          :key="v.id"
          type="button"
          role="tab"
          :aria-selected="i === videoIndex"
          :class="{ on: i === videoIndex }"
          @click="pickVideo(i)"
        >{{ v.label }}</button>
      </div>
      <div class="jing-video__frame">
        <iframe
          v-if="videoOn"
          :key="video.id"
          :src="`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`"
          :title="video.title"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>
        <button v-else type="button" class="jing-video__poster" @click="videoOn = true" :aria-label="`播放：${video.title}`">
          <img :src="video.poster || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`" alt="" loading="lazy" />
          <span class="jing-video__play" aria-hidden="true">▶</span>
        </button>
      </div>
      <p class="jing-tip">{{ video.title }}。也可以到 YouTube 频道「求財祈福網・每日誦經」观看、订阅。</p>
    </section>

    <article class="jing-text card" :class="{ 'with-pinyin': showPinyin }" aria-label="经文">
      <h2 class="jing-text__title">{{ sutra.name }}</h2>
      <p
        v-for="l in sutra.lines"
        :key="l.n"
        :ref="(el) => { if (el) lineRefs[l.n] = el }"
        class="jing-line"
        :class="{ current: l.n === currentN }"
        @click="seekTo(l.n)"
      >
        <span v-if="showPinyin" class="jing-pinyin">{{ l.pinyin }}</span>
        <span class="jing-hanzi">{{ l.text }}</span>
      </p>
      <p class="jing-dedication">愿以此功德，普及于一切，我等与众生，皆共成佛道。</p>
    </article>

    <section class="jing-actions">
      <router-link to="/nianfo/" class="jing-btn">念完了，去念佛计数 →</router-link>
      <router-link to="/buddha/guanyin/" class="jing-btn">为家人在线上香 →</router-link>
    </section>

    <section class="jing-about card">
      <h2>关于{{ sutra.title }}</h2>
      <p>{{ sutra.intro }}</p>
      <p>{{ sutra.when }}</p>
      <h2>常见问题</h2>
      <details v-for="f in sutra.faqs" :key="f.q" class="jing-faq">
        <summary>{{ f.q }}</summary>
        <p>{{ f.a }}</p>
      </details>
      <p class="jing-note">
        经文出处：<a :href="sutra.source.url" target="_blank" rel="noopener">{{ sutra.source.name }} {{ sutra.source.id }}</a>
        （CC BY-NC-SA），本站按通行课诵本校订；诵读音频为本站制作。
      </p>
    </section>
  </main>

  <NotFoundPage v-else title="经文页面未找到" message="这部经暂时还没有上线，可以回到诵经目录看看其他经文。" />
</template>

<style scoped>
.jing-shell { max-width: 760px; margin: 0 auto; padding: 0 20px 72px; display: flex; flex-direction: column; gap: 20px; }
.top-nav { padding: 12px 0 0; display: flex; gap: 8px; align-items: center; font-size: 0.88rem; color: var(--text-muted); }
.crumb-sep, .crumb-current { color: var(--text-muted); }
.jing-head { padding: 18px 0 0; text-align: center; }
.section-kicker { color: var(--accent); font-size: 0.8rem; letter-spacing: 0.18em; margin-bottom: 8px; }
.jing-head h1 { font-size: clamp(1.7rem, 5vw, 2.4rem); color: var(--gold-light); letter-spacing: 0.12em; margin-bottom: 10px; }
.lead { color: var(--text-muted); font-size: 0.92rem; line-height: 1.85; max-width: 32em; margin: 0 auto; }

.jing-list { display: grid; gap: 14px; }
.jing-card { display: grid; grid-template-columns: 96px 1fr; gap: 16px; align-items: center; padding: 14px 16px; text-decoration: none; color: var(--text); }
.jing-card__img { width: 96px; height: 96px; object-fit: contain; }
.jing-card h2 { font-size: 1.25rem; color: var(--gold-light); display: flex; flex-direction: column; gap: 2px; }
.jing-card h2 small { font-size: 0.82rem; color: var(--text-muted); font-weight: 400; }
.jing-card p { font-size: 0.86rem; color: var(--text-muted); margin: 6px 0; }
.jing-card__tag { font-size: 0.78rem; color: var(--accent); border: 1px solid rgba(242, 200, 121, 0.35); border-radius: 999px; padding: 2px 10px; }

.jing-player { display: grid; gap: 12px; padding: 18px; position: sticky; top: 8px; z-index: 3; }
.jing-versions { display: flex; gap: 8px; }
.jing-versions button { flex: 1; min-height: 42px; border-radius: 10px; border: 1px solid rgba(242, 200, 121, 0.3); background: transparent; color: var(--accent); font-size: 0.95rem; cursor: pointer; }
.jing-versions button.on { background: linear-gradient(135deg, #e0b76e, #f0d091); color: #2a1c0c; font-weight: 700; border-color: transparent; }
.jing-audio { width: 100%; }
.jing-tip { font-size: 0.82rem; color: var(--text-muted); }
.jing-switch { font-size: 0.88rem; color: var(--text); display: flex; gap: 6px; align-items: center; }

.jing-text { padding: 24px 22px; text-align: center; }
.jing-text__title { font-size: 1.3rem; color: var(--gold-light); letter-spacing: 0.16em; margin-bottom: 16px; }
.jing-line { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 8px; margin: 2px 0; border-radius: 10px; cursor: pointer; transition: background 0.25s ease, color 0.25s ease; }
.jing-hanzi { font-size: 1.22rem; line-height: 1.8; letter-spacing: 0.08em; color: var(--text); }
.jing-pinyin { font-size: 0.8rem; color: var(--text-muted); letter-spacing: 0.04em; }
.jing-line.current { background: rgba(242, 200, 121, 0.14); }
.jing-line.current .jing-hanzi { color: var(--gold-light); font-weight: 700; }
.jing-dedication { margin-top: 18px; font-size: 0.92rem; color: var(--accent); letter-spacing: 0.06em; }

.jing-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.jing-btn { display: flex; align-items: center; justify-content: center; min-height: 46px; border-radius: 12px; border: 1px solid rgba(242, 200, 121, 0.3); color: var(--accent); text-decoration: none; font-size: 0.92rem; }

.jing-about { padding: 20px; display: grid; gap: 10px; }
.jing-about h2 { font-size: 1.1rem; color: var(--gold-light); margin-top: 6px; }
.jing-about p { font-size: 0.92rem; line-height: 1.85; color: var(--text); }
.jing-faq summary { cursor: pointer; font-size: 0.95rem; color: var(--text); padding: 6px 0; }
.jing-faq p { color: var(--text-muted); }
.jing-note { font-size: 0.8rem; color: var(--text-muted); line-height: 1.7; }
.jing-note a { color: var(--accent); }
@media (max-width: 520px) { .jing-actions { grid-template-columns: 1fr; } }
.jing-video { padding: 18px; }
.jing-video__title { margin: 0 0 10px; font-size: 1.05rem; }
.jing-video .jing-versions { margin-bottom: 10px; }
.jing-video__frame { position: relative; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #1b1223; margin-bottom: 8px; }
.jing-video__frame iframe, .jing-video__poster { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.jing-video__poster { padding: 0; cursor: pointer; background: #1b1223; }
.jing-video__poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.jing-video__play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 68px; height: 68px; border-radius: 50%; background: rgba(165, 100, 26, 0.92); color: #fff; font-size: 26px; display: grid; place-items: center; padding-left: 4px; box-shadow: 0 6px 18px rgba(0,0,0,0.3); }
</style>
