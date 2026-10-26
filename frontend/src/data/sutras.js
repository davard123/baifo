// 诵经板块：经文（已两源对照校订）、诵读音频与逐句时间轴。
// 经文出处 CBETA 电子佛典（CC BY-NC-SA），页面上注明；音频为本站制作，只在音频定稿后才填 audio。
import xinjing from './sutras/xinjing.js'
import dabeizhou from './sutras/dabeizhou.js'
import xinjingChant from './sutras/xinjing-chant-timing.js'

export const SUTRAS = [
  {
    ...xinjing,
    name: '般若波罗蜜多心经',
    image: '/a7-20260906.webp?v=release1',
    intro: '《心经》是般若经典的精要，全经正文二百六十字，汉传寺院早晚课都会诵念。经中观自在菩萨「照见五蕴皆空，度一切苦厄」，教人放下执着、心无挂碍。',
    when: '早晚课、心绪不宁、为家人祈福时都可以念。诵读一遍不到两分钟，结尾揭谛咒念三遍，跟着字幕慢慢念即可。',
    audio: [
      { key: 'chant', label: '诵读版', src: '/jing/xinjing-chant.mp3?v=2e', timing: xinjingChant },
    ],
    videos: [
      { id: '00x2YdhXKSk', label: '诵读版', title: '心经 诵读版（全文 · 揭谛咒三遍）', poster: '/jing/xinjing-read-poster.jpg' },
      { id: 'r40dv0lA__g', label: '音乐版', title: '心经 音乐版（唱诵）', poster: '/jing/xinjing-music-poster.jpg' },
    ],
    faqs: [
      { q: '心经有多少字？', a: '通行的玄奘译本，正文二百六十字（不算经题）。本页经文与汉传寺院课诵本一致。' },
      { q: '「揭谛揭谛，波罗揭谛」是什么意思？', a: '这是心经结尾的咒语。按传统，咒语保留原来的读音，不作翻译，念诵时照读即可。' },
      { q: '一天念几遍比较好？', a: '没有固定要求。每天早晚各念一遍是常见做法；心里不安时多念几遍也好，重在专心。' },
    ],
  },
  {
    ...dabeizhou,
    name: '千手千眼无碍大悲心陀罗尼',
    image: '/buddha-variants/a7-white-standing-20261024.webp',
    intro: '大悲咒出自《千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼经》，唐代伽梵达摩译。汉传寺院早课必诵，通行的课诵本分为八十四句。',
    when: '早课、为家人祈求平安、身体不适或遇到困难时常念。一遍约四分钟。',
    audio: [],
    videos: [],
    faqs: [
      { q: '大悲咒有多少句、多少字？', a: '通行的课诵本为八十四句、四百一十五字。经中原本分为八十二句，后来的课诵本按念诵时的停顿，把结尾一句拆开，成为八十四句。' },
      { q: '「唵」字怎么念？', a: '各地课诵本的注音不完全相同，常见注作 ōng。本站的诵读按通行的念法，跟着念即可，不必为个别字的读音担心。' },
      { q: '不懂意思也可以念吗？', a: '可以。咒语传统上保留原音、不作翻译，诚心持念就好。' },
    ],
  },
]

export const SUTRA_BY_SLUG = Object.fromEntries(SUTRAS.map((s) => [s.slug, s]))

// 去掉标点的纯经文，用于结构化数据和预渲染
export function sutraPlainText(sutra) {
  return sutra.lines.map((l) => l.text).join('')
}
