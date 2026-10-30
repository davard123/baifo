// 诵经板块：经文（已两源对照校订）、诵读音频与逐句时间轴。
// 经文出处 CBETA 电子佛典（CC BY-NC-SA），页面上注明；音频为本站制作，只在音频定稿后才填 audio。
import xinjing from './sutras/xinjing.js'
import dabeizhou from './sutras/dabeizhou.js'
import xinjingChant from './sutras/xinjing-chant-timing.js'
import puxian from './sutras/puxian.js'
import puxianRead from './sutras/puxian-read-timing.js'
import jingang from './sutras/jingang.js'
import jingangSing1 from './sutras/jingang-sing1-timing.js'
import jingangSing2 from './sutras/jingang-sing2-timing.js'

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
    when: '发愿、回向、为家人祈福时常念，汉传寺院晚课、佛七圆满也常诵。诵读一遍约九分钟；唱诵全文约十二分钟，跟着唱更容易记住。',
    audio: [
      { key: 'read', label: '诵读版', src: '/jing/puxian-read.mp3?v=3', timing: puxianRead },
    ],
    videos: [
      { id: 'puxian-sing', label: '唱诵全文', title: '普贤行愿品偈颂 唱诵全文（六十二偈）', src: '/jing/puxian-sing-full.mp4', poster: '/jing/puxian-sing-full-poster.jpg' },
      { id: 'puxian-read', label: '诵读版', title: '普贤行愿品偈颂 诵读版（全文六十二偈）', src: '/jing/puxian-read.mp4?v=3', poster: '/jing/puxian-read-poster.jpg' },
    ],
    shorts: [
      { title: '我昔所造诸恶业，皆由无始贪恚痴', src: '/jing/shorts/puxian-02.mp4', poster: '/jing/shorts/puxian-02.jpg' },
      { title: '临命终时，最想听到的四句话', src: '/jing/shorts/puxian-03.mp4', poster: '/jing/shorts/puxian-03.jpg' },
      { title: '虚空有尽，我愿无穷', src: '/jing/shorts/puxian-04.mp4', poster: '/jing/shorts/puxian-04.jpg' },
      { title: '诵此普贤大愿王，一念速疾皆销灭', src: '/jing/shorts/puxian-05.mp4', poster: '/jing/shorts/puxian-05.jpg' },
      { title: '普贤十大愿，最后的回向', src: '/jing/shorts/puxian-06.mp4', poster: '/jing/shorts/puxian-06.jpg' },
      { title: '普贤行愿品 唱诵版', src: '/jing/shorts/puxian-07.mp4', poster: '/jing/shorts/puxian-07.jpg' },
      { title: '请佛住世，回向众生', src: '/jing/shorts/puxian-08.mp4', poster: '/jing/shorts/puxian-08.jpg' },
      { title: '恒顺众生，一切行愿同修学', src: '/jing/shorts/puxian-09.mp4', poster: '/jing/shorts/puxian-09.jpg' },
      { title: '一念见尽三世', src: '/jing/shorts/puxian-10.mp4', poster: '/jing/shorts/puxian-10.jpg' },
      { title: '愿面见阿弥陀', src: '/jing/shorts/puxian-11.mp4', poster: '/jing/shorts/puxian-11.jpg' },
      { title: '虚空有尽愿无穷', src: '/jing/shorts/puxian-12.mp4', poster: '/jing/shorts/puxian-12.jpg' },
      { title: '普贤胜福皆回向', src: '/jing/shorts/puxian-13.mp4', poster: '/jing/shorts/puxian-13.jpg' },
    ],
    faqs: [
      { q: '普贤行愿品偈颂有多少句？', a: '通行本共六十二偈，每偈四句，合计二百四十八句、一千七百三十六字。本页经文按 CBETA 与汉传课诵本两源对照校订。' },
      { q: '普贤十大愿王是哪十个？', a: '一礼敬诸佛，二称赞如来，三广修供养，四忏悔业障，五随喜功德，六请转法轮，七请佛住世，八常随佛学，九恒顺众生，十普皆回向。' },
      { q: '偈颂里「一一」怎么念？', a: '「一一」就是「每一个」的意思，连着念 yī yī，中间不要停顿。' },
    ],
  },
  {
    ...jingang,
    name: '金刚般若波罗蜜经',
    image: '/buddha-variants/a1-gilt-20261024.webp',
    intro: '《金刚经》全名《金刚般若波罗蜜经》，姚秦鸠摩罗什译，全经三十二分、五千余字。经中须菩提向佛请问「云何应住，云何降伏其心」，佛以「凡所有相，皆是虚妄」「应无所住而生其心」作答，是汉传佛教流传最广的般若经典。',
    when: '早晚课、为家人祈福、为先人回向时都常诵。全经诵一遍约四十分钟；本站唱诵版分五集：第一集唱第一至第八分，第二集唱第九至第十三分，后面几集陆续上线。',
    audio: [
      { key: 'sing1', label: '唱诵第一集', src: '/jing/jingang-sing-1.mp3', timing: jingangSing1 },
      { key: 'sing2', label: '唱诵第二集', src: '/jing/jingang-sing-2.mp3', timing: jingangSing2 },
    ],
    videos: [
      { id: 'jingang-sing-1', label: '唱诵第一集', title: '金刚经 唱诵第一集（法会因由分第一 至 依法出生分第八）', src: '/jing/jingang-sing-1.mp4', poster: '/jing/jingang-sing-1-poster.jpg' },
      { id: 'jingang-sing-2', label: '唱诵第二集', title: '金刚经 唱诵第二集（一相无相分第九 至 如法受持分第十三）', src: '/jing/jingang-sing-2.mp4', poster: '/jing/jingang-sing-2-poster.jpg' },
    ],
    faqs: [
      { q: '金刚经有多少字、分几分？', a: '通行的鸠摩罗什译本共三十二分，本页经文五千一百六十七字（不算标点），按 CBETA 与汉传通行流通本两源对照校订。' },
      { q: '「三十二分」是谁分的？', a: '相传是南朝梁昭明太子所分，每分各有一个小标题，例如「法会因由分第一」，方便念诵和查找。' },
      { q: '「阿耨多罗三藐三菩提」怎么念？', a: '通行念法是 ā nòu duō luó sān miǎo sān pú tí，意思是「无上正等正觉」。「耨」念 nòu，「藐」念 miǎo。' },
      { q: '唱诵视频里个别字和字幕不一样？', a: '唱诵音乐由 AI 辅助制作，个别字唱音不准，请以字幕和本页经文为准。' },
    ],
  },
]

export const SUTRA_BY_SLUG = Object.fromEntries(SUTRAS.map((s) => [s.slug, s]))

// 去掉标点的纯经文，用于结构化数据和预渲染
export function sutraPlainText(sutra) {
  return sutra.lines.map((l) => l.text).join('')
}
