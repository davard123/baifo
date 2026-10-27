// 诵经板块：经文（已两源对照校订）、诵读音频与逐句时间轴。
// 经文出处 CBETA 电子佛典（CC BY-NC-SA），页面上注明；音频为本站制作，只在音频定稿后才填 audio。
import xinjing from './sutras/xinjing.js'
import dabeizhou from './sutras/dabeizhou.js'
import xinjingChant from './sutras/xinjing-chant-timing.js'
import puxian from './sutras/puxian.js'
import puxianRead from './sutras/puxian-read-timing.js'

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
      { id: '00x2YdhXKSk', label: '诵读版', title: '心经 诵读版（全文 · 揭谛咒三遍）', src: '/jing/xinjing-read.mp4', poster: '/jing/xinjing-read-poster.jpg' },
      { id: 'r40dv0lA__g', label: '音乐版', title: '心经 音乐版（唱诵）', src: '/jing/xinjing-music.mp4', poster: '/jing/xinjing-music-poster.jpg' },
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
  {
    ...puxian,
    name: '普贤菩萨行愿品偈颂',
    image: '/buddha-variants/a6-six-tusk-20261024.webp',
    intro: '《普贤行愿品》出自《大方广佛华严经》第四十卷，唐代般若三藏译。偈颂共六十二偈、二百四十八句，从「所有十方世界中」念到「速往无量光佛刹」，把普贤菩萨十大愿王——礼敬诸佛、称赞如来、广修供养、忏悔业障、随喜功德、请转法轮、请佛住世、常随佛学、恒顺众生、普皆回向——一一发起，最后回向往生极乐。',
    when: '发愿、回向、为家人祈福时常念，汉传寺院晚课、佛七圆满也常诵。诵读一遍约九分钟；唱诵版分上下两集，跟着唱更容易记住。',
    audio: [
      { key: 'read', label: '诵读版', src: '/jing/puxian-read.mp3?v=3', timing: puxianRead },
    ],
    videos: [
      { id: 'puxian-sing-1', label: '唱诵上集', title: '普贤行愿品偈颂 唱诵上集（礼敬诸佛 广修供养）', src: '/jing/puxian-sing-1.mp4', poster: '/jing/puxian-sing-1-poster.jpg' },
      { id: 'puxian-sing-2', label: '唱诵下集', title: '普贤行愿品偈颂 唱诵下集（导归极乐 普皆回向）', src: '/jing/puxian-sing-2.mp4', poster: '/jing/puxian-sing-2-poster.jpg' },
      { id: 'puxian-read', label: '诵读版', title: '普贤行愿品偈颂 诵读版（全文六十二偈）', src: '/jing/puxian-read.mp4?v=3', poster: '/jing/puxian-read-poster.jpg' },
    ],
    faqs: [
      { q: '普贤行愿品偈颂有多少句？', a: '通行本共六十二偈，每偈四句，合计二百四十八句、一千七百三十六字。本页经文按 CBETA 与汉传课诵本两源对照校订。' },
      { q: '普贤十大愿王是哪十个？', a: '一礼敬诸佛，二称赞如来，三广修供养，四忏悔业障，五随喜功德，六请转法轮，七请佛住世，八常随佛学，九恒顺众生，十普皆回向。' },
      { q: '偈颂里「一一」怎么念？', a: '「一一」就是「每一个」的意思，连着念 yī yī，中间不要停顿。' },
    ],
  },
]

export const SUTRA_BY_SLUG = Object.fromEntries(SUTRAS.map((s) => [s.slug, s]))

// 去掉标点的纯经文，用于结构化数据和预渲染
export function sutraPlainText(sutra) {
  return sutra.lines.map((l) => l.text).join('')
}
