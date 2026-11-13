// 诵经板块：经文（已两源对照校订）、诵读音频与逐句时间轴。
// 经文出处 CBETA 电子佛典（CC BY-NC-SA），页面上注明；音频为本站制作，只在音频定稿后才填 audio。
import xinjing from './sutras/xinjing.js'
import dabeizhou from './sutras/dabeizhou.js'
import shixiaozhou from './sutras/shixiaozhou.js'
import lengyan from './sutras/lengyan.js'
import puxian from './sutras/puxian.js'
import jingang from './sutras/jingang.js'
import jingangSing1 from './sutras/jingang-sing1-timing.js'
import jingangSing2 from './sutras/jingang-sing2-timing.js'
import pumen from './sutras/pumen.js'
import pumenSing from './sutras/pumen-sing-timing.js'
import amituo from './sutras/amituo.js'
import wangsheng from './sutras/wangsheng.js'
import dizang from './sutras/dizang.js'
import { RECITE } from './sutras-recite.js'

export const SUTRAS = [
  {
    ...lengyan,
    name: '大佛顶首楞严神咒',
    image: '/buddha-variants/a3-standard-20261024.webp',
    intro: '《楞严咒》全名《大佛顶首楞严神咒》，是汉传佛教早课常诵的长咒，出自《大佛顶如来密因修证了义诸菩萨万行首楞严经》。本页按寺院通行五会课诵本分段，带拼音，方便跟着念。',
    when: '早课、礼佛、为家人祈求平安时常诵。楞严咒篇幅较长，可以按五会分段跟读，也可以先从每天一会开始。',
    audio: [],
    videos: [
      { id: 'lengyan-recite', label: '女声读诵', title: '楞严咒 女声读诵（全文）。带拼音，可跟读、可默读，字幕逐字显示', src: '/jing/recite/lengyan-recite.mp4', poster: '/jing/recite/lengyan-recite-poster.jpg', uploadDate: '2026-11-10' },
    ],
    faqs: [
      { q: '楞严咒有几会？', a: '寺院通行课诵本分为五会。本页按五会分段，全文从「南无萨怛他苏伽多耶」起，依通行本读法排列。' },
      { q: '楞严咒很长，一次念不完怎么办？', a: '可以按五会分段念，先固定每天念一会，熟悉后再完整持诵；重在恭敬、专心，不必勉强赶进度。' },
      { q: '咒语需要翻译吗？', a: '咒语以传统音声持诵为主，本页保留通行课诵本的字音和拼音，跟着字幕念即可。' },
    ],
  },
  {
    ...xinjing,
    name: '般若波罗蜜多心经',
    image: '/a7-20260906.webp?v=release1',
    intro: '《心经》是般若经典的精要，全经正文二百六十字，汉传寺院早晚课都会诵念。经中观自在菩萨「照见五蕴皆空，度一切苦厄」，教人放下执着、心无挂碍。',
    when: '早晚课、心绪不宁、为家人祈福时都可以念。诵读一遍不到两分钟，结尾揭谛咒念三遍，跟着字幕慢慢念即可。',
    audio: RECITE.xinjing.audio,
    videos: [
      ...RECITE.xinjing.videos,
      { id: 'r40dv0lA__g', label: '音乐版', title: '心经 音乐版（唱诵）', src: '/jing/xinjing-music.mp4', uploadDate: '2026-10-25', poster: '/jing/xinjing-music-poster.jpg', yt: 'r40dv0lA__g' },
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
    when: '早课、为家人祈求平安、身体不适或遇到困难时常念。女声读诵一遍约两分半钟，可以跟读，也可以默读。',
    audio: RECITE.dabeizhou.audio,
    videos: [
      { id: 'dabeizhou-sing-film', label: '唱诵 · 故事片', title: '大悲咒 唱诵《千手》：一双手救不了大水，一千双手可以。字幕逐字变色，可跟唱。画面和唱诵由 AI 制作', src: '/jing/recite/dabeizhou-sing-film.mp4', poster: '/jing/recite/dabeizhou-sing-film-poster.jpg', yt: 'TJx-5EvxHfQ', ytFrom: '2026-11-05' },
      ...RECITE.dabeizhou.videos,
    ],
    faqs: [
      { q: '大悲咒有多少句、多少字？', a: '通行的课诵本为八十四句、四百一十五字。经中原本分为八十二句，后来的课诵本按念诵时的停顿，把结尾一句拆开，成为八十四句。' },
      { q: '「唵」字怎么念？', a: '各地课诵本的注音不完全相同，常见注作 ōng。本站的诵读按通行的念法，跟着念即可，不必为个别字的读音担心。' },
      { q: '不懂意思也可以念吗？', a: '可以。咒语传统上保留原音、不作翻译，诚心持念就好。' },
    ],
  },
  {
    ...shixiaozhou,
    name: '十小咒',
    image: '/buddha-variants/a7-white-standing-20261024.webp',
    intro: '十小咒是汉传寺院早课常诵的十部陀罗尼，依次为如意宝轮王陀罗尼、消灾吉祥神咒、功德宝山神咒、准提神咒、圣无量寿决定光明王陀罗尼、药师灌顶真言、观音灵感真言、七佛灭罪真言、往生净土神咒和大吉祥天女咒。',
    when: '早课、礼佛、祈求消灾增福时常诵。十个咒各念一遍，跟着每段咒名和拼音念即可。',
    audio: [],
    videos: [
      { id: 'shixiaozhou-recite', label: '女声读诵', title: '十小咒 女声读诵（十咒全文）。带拼音，可跟读、可默读，字幕逐字显示', src: '/jing/recite/shixiaozhou-recite.mp4', poster: '/jing/recite/shixiaozhou-recite-poster.jpg', uploadDate: '2026-11-10' },
    ],
    faqs: [
      { q: '十小咒是哪十个咒？', a: '本页按汉传寺院早课通行次序，收录如意宝轮王陀罗尼、消灾吉祥神咒、功德宝山神咒、准提神咒、圣无量寿决定光明王陀罗尼、药师灌顶真言、观音灵感真言、七佛灭罪真言、往生净土神咒和大吉祥天女咒。' },
      { q: '十小咒每天要念几遍？', a: '按寺院早课通行做法，十个咒各念一遍；具体功课可依自己的时间和师承安排。' },
      { q: '咒名为什么也放在经文里？', a: '咒名前后分段有助于跟上早课次序，也方便查找每一部咒；正式持诵时按自己熟悉的课诵本念即可。' },
    ],
  },
  {
    ...puxian,
    // 数据文件里是全文（长行+偈颂+流通分，给念经页用）；/jing/ 这页只放偈颂和对应录音，按原样
    title: '普贤行愿品偈颂',
    fullTitle: '大方广佛华严经入不思议解脱境界普贤行愿品偈颂',
    charCount: 1736,
    lines: puxian.lines.filter((l) => l.part === '偈颂'),
    name: '普贤菩萨行愿品偈颂',
    image: '/buddha-variants/a6-six-tusk-20261024.webp',
    intro: '《普贤行愿品》出自《大方广佛华严经》第四十卷，唐代般若三藏译。偈颂共六十二偈、二百四十八句，从「所有十方世界中」念到「速往无量光佛刹」，把普贤菩萨十大愿王——礼敬诸佛、称赞如来、广修供养、忏悔业障、随喜功德、请转法轮、请佛住世、常随佛学、恒顺众生、普皆回向——一一发起，最后回向往生极乐。',
    when: '发愿、回向、为家人祈福时常念，汉传寺院晚课、佛七圆满也常诵。女声读诵一遍约八分钟，可以跟读，也可以默读；唱诵全文约十二分钟，跟着唱更容易记住。',
    audio: RECITE.puxian.audio,
    videos: [
      ...RECITE.puxian.videos,
      { id: 'puxian-sing', label: '唱诵全文', title: '普贤行愿品偈颂 唱诵全文（六十二偈）', src: '/jing/puxian-sing-full.mp4', poster: '/jing/puxian-sing-full-poster.jpg', yt: 'ZTdaR6ivGs0', ytFrom: '2026-11-05' },
    ],
    shorts: [
      { title: '我昔所造诸恶业，皆由无始贪恚痴', src: '/jing/shorts/puxian-02.mp4', poster: '/jing/shorts/puxian-02.jpg', yt: 'zfbAi1iKlAI', ytFrom: '2026-10-31' },
      { title: '临命终时，最想听到的四句话', src: '/jing/shorts/puxian-03.mp4', poster: '/jing/shorts/puxian-03.jpg', yt: 'Ib9pZJX3ci8', ytFrom: '2026-11-03' },
      { title: '虚空有尽，我愿无穷', src: '/jing/shorts/puxian-04.mp4', poster: '/jing/shorts/puxian-04.jpg', yt: 'Sy9qwW_PpAQ', ytFrom: '2026-10-31' },
      { title: '诵此普贤大愿王，一念速疾皆销灭', src: '/jing/shorts/puxian-05.mp4', poster: '/jing/shorts/puxian-05.jpg', yt: '8Frs5sIeU28', ytFrom: '2026-10-30' },
      { title: '普贤十大愿，最后的回向', src: '/jing/shorts/puxian-06.mp4', poster: '/jing/shorts/puxian-06.jpg', yt: 'h4PM32EpuEA', ytFrom: '2026-11-01' },
      { title: '普贤行愿品 唱诵版', src: '/jing/shorts/puxian-07.mp4', poster: '/jing/shorts/puxian-07.jpg', yt: 'N1ed3Syy1vY', ytFrom: '2026-11-02' },
      { title: '请佛住世，回向众生', src: '/jing/shorts/puxian-08.mp4', poster: '/jing/shorts/puxian-08.jpg', yt: 'KbjpwvziDuo', ytFrom: '2026-11-02' },
      { title: '恒顺众生，一切行愿同修学', src: '/jing/shorts/puxian-09.mp4', poster: '/jing/shorts/puxian-09.jpg', yt: 'zaMGdor59MU', ytFrom: '2026-10-30' },
      { title: '一念见尽三世', src: '/jing/shorts/puxian-10.mp4', poster: '/jing/shorts/puxian-10.jpg', yt: '8jp3pLwYMYg', ytFrom: '2026-11-01' },
      { title: '愿面见阿弥陀', src: '/jing/shorts/puxian-11.mp4', poster: '/jing/shorts/puxian-11.jpg', yt: 'pLqfG58VVjI', ytFrom: '2026-11-01' },
      { title: '虚空有尽愿无穷', src: '/jing/shorts/puxian-12.mp4', poster: '/jing/shorts/puxian-12.jpg', yt: 'PBs58nVPaMQ', ytFrom: '2026-11-02' },
      { title: '普贤胜福皆回向', src: '/jing/shorts/puxian-13.mp4', poster: '/jing/shorts/puxian-13.jpg', yt: 'JCOSKiMihTE', ytFrom: '2026-11-03' },
    ],
    faqs: [
      { q: '普贤行愿品偈颂有多少句？', a: '通行本共六十二偈，每偈四句，合计二百四十八句、一千七百三十六字。本页经文按 CBETA 与汉传课诵本两源对照校订。' },
      { q: '普贤十大愿王是哪十个？', a: '一礼敬诸佛，二称赞如来，三广修供养，四忏悔业障，五随喜功德，六请转法轮，七请佛住世，八常随佛学，九恒顺众生，十普皆回向。' },
      { q: '偈颂里「一一」怎么念？', a: '「一一」就是「每一个」的意思，连着念 yī yī，中间不要停顿。' },
    ],
  },
  {
    ...pumen,
    name: '妙法莲华经观世音菩萨普门品',
    image: '/buddha-variants/a7-water-moon-20261024.webp',
    intro: '《普门品》是《妙法莲华经》第二十五品，后秦鸠摩罗什译。无尽意菩萨问佛：观世音菩萨以什么因缘名观世音？佛说众生受诸苦恼，一心称名，菩萨即时观其音声，皆得解脱。经中讲观音菩萨救七难、离三毒、应二求，以三十三应化身随类说法；后半偈颂「念彼观音力」一句一句回应前文，是汉传佛教流传最广的观音经典。',
    when: '为家人祈求平安、出行、生病、遇到难事时常诵，许多寺院在观音诞和早晚课也念。唱诵全品约二十一分钟：前半长行约十五分钟，后半偈颂约六分钟，时间不够时只唱偈颂也好。女声读诵全品约十分钟，可以跟读，也可以默读。',
    audio: [
      ...RECITE.pumen.audio,
      { key: 'sing', label: '唱诵全品', src: '/jing/pumen-sing.mp3', timing: pumenSing },
    ],
    videos: [
      ...RECITE.pumen.videos,
      { id: 'pumen-sing-1', label: '唱诵 · 长行', title: '普门品 唱诵（长行：无尽意菩萨问佛 至 献璎珞）', src: '/jing/pumen-sing-1.mp4', poster: '/jing/pumen-sing-1-poster.jpg', yt: '2Aap6xmad8A', ytFrom: '2026-11-02' },
      { id: 'pumen-sing-2', label: '唱诵 · 偈颂', title: '普门品偈颂 唱诵全偈（世尊妙相具 至 是故应顶礼）', src: '/jing/pumen-sing-2.mp4', poster: '/jing/pumen-sing-2-poster.jpg', yt: 'Yhs_rlf-oT0', ytFrom: '2026-11-02' },
    ],
    shorts: [
      { title: '一心称名，皆得解脱', src: '/jing/shorts/pumen-01.mp4', poster: '/jing/shorts/pumen-01.jpg', yt: 'jT0MXN5vaiw', ytFrom: '2026-11-02' },
      { title: '念彼观音力，火坑变成池', src: '/jing/shorts/pumen-02.mp4', poster: '/jing/shorts/pumen-02.jpg', yt: 'kPF0XAJ3AFA', ytFrom: '2026-11-02' },
      { title: '观音妙智力，能救世间苦', src: '/jing/shorts/pumen-03.mp4', poster: '/jing/shorts/pumen-03.jpg', yt: 'hfza_QFhoPA', ytFrom: '2026-11-02' },
    ],
    faqs: [
      { q: '普门品有多少字？', a: '本页经文按鸠摩罗什译本，与 CBETA 及汉传寺院课诵本两源对照校订，共二千零六十二字（不算标点），其中偈颂从「世尊妙相具」到「是故应顶礼」。' },
      { q: '只念偈颂可以吗？', a: '可以。偈颂把前面长行的内容用韵文重说一遍，很多人日常只念偈颂；时间充裕时念全品更完整。' },
      { q: '唱诵视频里个别字和字幕不一样？', a: '唱诵音乐由 AI 辅助制作，个别字唱音不准，请以字幕和本页经文为准。' },
    ],
  },
  {
    ...jingang,
    name: '金刚般若波罗蜜经',
    image: '/buddha-variants/a1-gilt-20261024.webp',
    intro: '《金刚经》全名《金刚般若波罗蜜经》，姚秦鸠摩罗什译，全经三十二分、五千余字。经中须菩提向佛请问「云何应住，云何降伏其心」，佛以「凡所有相，皆是虚妄」「应无所住而生其心」作答，是汉传佛教流传最广的般若经典。',
    when: '早晚课、为家人祈福、为先人回向时都常诵。全经诵一遍约四十分钟；本站唱诵版分五集：第一集唱第一至第八分，第二集唱第九至第十三分，后面几集陆续上线。女声读诵全本约二十七分钟，分五集，可以跟读，也可以默读。',
    audio: [
      ...RECITE.jingang.audio,
      { key: 'sing1', label: '唱诵第一集', src: '/jing/jingang-sing-1.mp3', timing: jingangSing1 },
      { key: 'sing2', label: '唱诵第二集', src: '/jing/jingang-sing-2.mp3', timing: jingangSing2 },
    ],
    videos: [
      ...RECITE.jingang.videos,
      { id: 'jingang-sing-1', label: '唱诵第一集', title: '金刚经 唱诵第一集（法会因由分第一 至 依法出生分第八）', src: '/jing/jingang-sing-1.mp4', uploadDate: '2026-10-27', poster: '/jing/jingang-sing-1-poster.jpg', yt: '-RoyKDYHljI' },
      { id: 'jingang-sing-2', label: '唱诵第二集', title: '金刚经 唱诵第二集（一相无相分第九 至 如法受持分第十三）', src: '/jing/jingang-sing-2.mp4', uploadDate: '2026-10-28', poster: '/jing/jingang-sing-2-poster.jpg', yt: 'NeMD77R7HRQ' },
    ],
    faqs: [
      { q: '金刚经有多少字、分几分？', a: '通行的鸠摩罗什译本共三十二分，本页经文五千一百六十七字（不算标点），按 CBETA 与汉传通行流通本两源对照校订。' },
      { q: '「三十二分」是谁分的？', a: '相传是南朝梁昭明太子所分，每分各有一个小标题，例如「法会因由分第一」，方便念诵和查找。' },
      { q: '「阿耨多罗三藐三菩提」怎么念？', a: '通行念法是 ā nòu duō luó sān miǎo sān pú tí，意思是「无上正等正觉」。「耨」念 nòu，「藐」念 miǎo。' },
      { q: '唱诵视频里个别字和字幕不一样？', a: '唱诵音乐由 AI 辅助制作，个别字唱音不准，请以字幕和本页经文为准。' },
    ],
  },
  {
    ...amituo,
    name: '佛说阿弥陀经',
    image: '/buddha-variants/a2-mituo-20261024.webp',
    intro: '《佛说阿弥陀经》，后秦鸠摩罗什译，是净土宗最常诵的经典之一。佛陀对舍利弗讲述西方极乐世界的依正庄严，劝人一心执持阿弥陀佛名号，发愿往生。',
    when: '晚课、念佛共修、为家人回向时常诵。女声读诵一遍约九分钟，可以跟读，也可以默读。',
    audio: RECITE.amituo.audio,
    videos: [
      { id: 'amituo-sing-film', label: '唱诵 · 故事片', title: '阿弥陀经 唱诵《净土变》：老画工用一辈子画极乐世界，只为去那里找她。字幕逐字变色，可跟唱。画面和唱诵由 AI 制作', src: '/jing/recite/amituo-sing-film.mp4', poster: '/jing/recite/amituo-sing-film-poster.jpg', yt: 'Q75SCMWTMYw', ytFrom: '2026-11-06' },
      ...RECITE.amituo.videos,
    ],
    shorts: [
      { title: '七宝池八功德水，莲花大如车轮', src: '/jing/shorts/amituo-1.mp4', poster: '/jing/shorts/amituo-1.jpg', yt: 'r-uElKO2dAY', ytFrom: '2026-11-06' },
      { title: '为什么叫阿弥陀？光明无量，寿命无量', src: '/jing/shorts/amituo-2.mp4', poster: '/jing/shorts/amituo-2.jpg', yt: '5m5F6fn48b0', ytFrom: '2026-11-06' },
      { title: '执持名号，一心不乱，临终佛现在其前', src: '/jing/shorts/amituo-3.mp4', poster: '/jing/shorts/amituo-3.jpg', yt: 'n5v-kioDgis', ytFrom: '2026-11-06' },
    ],
    faqs: [
      { q: '阿弥陀经有多少字？', a: `本页经文按鸠摩罗什译本，与 CBETA 及汉传课诵本两源对照校订，共 ${amituo.charCount} 字（不算标点）。` },
      { q: '跟读和默读有什么不同？', a: '跟读是跟着声音念出声，适合刚开始学、想把字音念熟；默读是不出声，眼看字幕、心里念，不方便出声时也能做。两种都可以，按自己的情况选。' },
    ],
  },
  {
    ...wangsheng,
    name: '往生咒',
    image: '/buddha-variants/a2-mituo-20261024.webp',
    intro: '《往生咒》全名《拔一切业障根本得生净土陀罗尼》，是汉传净土法门常诵的陀罗尼。经文短而完整，适合日常念佛、晚课和回向时持诵。',
    when: '晚课、念佛共修、为家人和先人回向时常诵。固定晚课会连续念三遍；本页视频每次读一遍，跟着同一条视频重复即可。',
    audio: [],
    videos: [
      { id: 'wangsheng-recite', label: '女声读诵', title: '往生咒 女声读诵（全文）。带拼音，可跟读、可默读，字幕逐字显示', src: '/jing/recite/wangsheng-recite.mp4', poster: '/jing/recite/wangsheng-recite-poster.jpg', uploadDate: '2026-11-10' },
    ],
    faqs: [
      { q: '往生咒一遍有多少句？', a: '本页按通行课诵本分为十四句，保留传统咒语音声并配有拼音。' },
      { q: '往生咒晚课念几遍？', a: '本次固定晚课安排连续念三遍；视频本身只读一遍，播放结束后再重复两遍即可。' },
      { q: '不懂咒语意思也可以念吗？', a: '可以。陀罗尼传统上以音声持诵为主，跟着通行课诵本和拼音恭敬念诵即可。' },
    ],
  },
  {
    ...dizang,
    name: '地藏菩萨本愿经',
    image: '/buddha-variants/a8-five-crown-20261024.webp',
    intro: '《地藏菩萨本愿经》，唐代实叉难陀译，全经十三品。佛在忉利天为母说法，讲地藏菩萨的大愿、众生业缘与孝亲度亡的法门，汉传佛教常在超度、祭祖、回向先人时诵读。',
    when: '为过世的亲人回向、祭祖、农历七月和地藏菩萨圣诞前后常诵。女声读诵全经约八十四分钟，本页按品分开，一次念一品也可以；可以跟读，也可以默读。',
    audio: RECITE.dizang.audio,
    videos: [
      { id: 'dizang-01-sing-film', label: '唱诵 · 第一品故事片', title: '地藏经第一品 唱诵《寻母》：她卖掉整个家，只为知道母亲去了哪里。字幕逐字变色，可跟唱。画面和唱诵由 AI 制作', src: '/jing/recite/dizang-01-sing-film.mp4', poster: '/jing/recite/dizang-01-sing-film-poster.jpg', yt: 'KcxmEo46pO4', ytFrom: '2026-11-07' },
      { id: 'dizang-02-sing-film', label: '唱诵 · 第二品', title: '地藏经第二品 唱诵《分身集会》：千百亿个地藏菩萨同时来到忉利天宫，一毛一沙的善，他都来度。字幕逐字变色，可跟唱。画面和唱诵由 AI 制作', src: '/jing/recite/dizang-02-sing-film.mp4', poster: '/jing/recite/dizang-02-sing-film-poster.jpg', yt: 'DiEVlL1KsqM', ytFrom: '2026-11-09' },
      { id: 'dizang-03-sing-film', label: '唱诵 · 第三品', title: '地藏经第三品 唱诵《观众生业缘》：佛的母亲问造了恶业的人去哪里，地藏菩萨讲无间地狱为什么叫无间。字幕逐字变色，可跟唱。画面和唱诵由 AI 制作', src: '/jing/recite/dizang-03-sing-film.mp4', poster: '/jing/recite/dizang-03-sing-film-poster.jpg', yt: 'SIoHeEWbfiE', ytFrom: '2026-11-11' },
      { id: 'dizang-04-sing-film', label: '唱诵 · 第四品故事片', title: '地藏经第四品 唱诵《光目》：母亲生前爱吃鱼鳖，死后堕入恶道，女儿为救母亲发下「地狱不空，誓不成佛」的大愿。字幕逐字变色，可跟唱。画面和唱诵由 AI 制作', src: '/jing/recite/dizang-04-sing-film.mp4', poster: '/jing/recite/dizang-04-sing-film-poster.jpg', yt: 'npkw2JVcAHI', ytFrom: '2026-11-13' },
      { id: 'dizang-05-sing-film', label: '唱诵 · 第五品', title: '地藏经第五品 唱诵《地狱名号》：普贤菩萨请地藏菩萨说出地狱的名字——莫轻小恶，以为无罪，死后有报，纤毫受之。字幕逐字变色，可跟唱。画面和唱诵由 AI 制作', src: '/jing/recite/dizang-05-sing-film.mp4', poster: '/jing/recite/dizang-05-sing-film-poster.jpg', yt: 'Z9BkspObqdU', ytFrom: '2026-11-15' },
      ...RECITE.dizang.videos,
    ],
    shorts: [
      { title: '母亲不信佛，死后堕地狱，她卖掉了整个家', src: '/jing/shorts/dizang01-1.mp4', poster: '/jing/shorts/dizang01-1.jpg', yt: '86PcA1WMC3s', ytFrom: '2026-11-07' },
      { title: '她哭到站不起来，空中有声音回答她', src: '/jing/shorts/dizang01-2.mp4', poster: '/jing/shorts/dizang01-2.jpg', yt: 'G-Bgpnl-oZM', ytFrom: '2026-11-07' },
      { title: '母亲三天前已经升天，这个女儿就是地藏菩萨', src: '/jing/shorts/dizang01-3.mp4', poster: '/jing/shorts/dizang01-3.jpg', yt: '3kak-8T2BRY', ytFrom: '2026-11-07' },
      { title: '有人一听就信，有人劝不动，佛说：我分身千百亿去度', src: '/jing/shorts/dizang02-1.mp4', poster: '/jing/shorts/dizang02-1.jpg', yt: 'n3Ddn3sCfs4', ytFrom: '2026-11-09' },
      { title: '国王、官员、出家人、居士，菩萨可能就在你身边', src: '/jing/shorts/dizang02-2.mp4', poster: '/jing/shorts/dizang02-2.jpg', yt: 'f8Xk3ruOQGw', ytFrom: '2026-11-09' },
      { title: '一根毛、一粒沙那么小的善，地藏菩萨都会来度你', src: '/jing/shorts/dizang02-3.mp4', poster: '/jing/shorts/dizang02-3.jpg', yt: 'fkTlKPc-hjY', ytFrom: '2026-11-09' },
      { title: '不孝父母、偷寺里一粒米，地藏菩萨说都堕无间', src: '/jing/shorts/dizang03-1.mp4', poster: '/jing/shorts/dizang03-1.jpg', yt: '1PChILtLFs4', ytFrom: '2026-11-11' },
      { title: '无间地狱到底什么样？一人受罪，自见满床', src: '/jing/shorts/dizang03-2.mp4', poster: '/jing/shorts/dizang03-2.jpg', yt: 'YsS2nK7xmak', ytFrom: '2026-11-11' },
      { title: '为什么叫无间地狱？地藏菩萨说了五个原因', src: '/jing/shorts/dizang03-3.mp4', poster: '/jing/shorts/dizang03-3.jpg', yt: '-TQFy-9P0Os', ytFrom: '2026-11-11' },
      { title: '母亲爱吃鱼鳖，死后受大苦；女儿卖掉玉镯为她画佛', src: '/jing/shorts/dizang04-1.mp4', poster: '/jing/shorts/dizang04-1.jpg', yt: 'YiA_q0K4ISk', ytFrom: '2026-11-13' },
      { title: '母亲转生到婢女家，开口第一句话让她痛哭', src: '/jing/shorts/dizang04-2.mp4', poster: '/jing/shorts/dizang04-2.jpg', yt: 'D4RopiJGRn0', ytFrom: '2026-11-14' },
      { title: '地狱不空，誓不成佛——这个愿最早是她发的', src: '/jing/shorts/dizang04-3.mp4', poster: '/jing/shorts/dizang04-3.jpg', yt: 'ILusQqWimZY', ytFrom: '2026-11-14' },
      { title: '普贤菩萨问地藏：造恶的人会去哪里', src: '/jing/shorts/dizang05-1.mp4', poster: '/jing/shorts/dizang05-1.jpg', yt: 'VPu5fmEL37Y', ytFrom: '2026-11-15' },
      { title: '莫轻小恶，以为无罪；死后有报，纤毫受之', src: '/jing/shorts/dizang05-2.mp4', poster: '/jing/shorts/dizang05-2.jpg', yt: 'ebI0iT0l0Uk', ytFrom: '2026-11-16' },
      { title: '取舌耕田、铜柱抱身——地藏菩萨亲口说的地狱', src: '/jing/shorts/dizang05-3.mp4', poster: '/jing/shorts/dizang05-3.jpg', yt: 'OH-jLGqP5AY', ytFrom: '2026-11-16' },
    ],
    faqs: [
      { q: '地藏经有几品、多少字？', a: `全经十三品，本页经文按 CBETA 与汉传通行本两源对照校订，共 ${dizang.charCount} 字（不算标点）。` },
      { q: '一次念不完怎么办？', a: '可以一次念一品，隔天接着念下一品。点经文里任意一句，音频会从那一句开始。' },
      { q: '跟读和默读有什么不同？', a: '跟读是跟着声音念出声，适合刚开始学、想把字音念熟；默读是不出声，眼看字幕、心里念，不方便出声时也能做。两种都可以，按自己的情况选。' },
    ],
  },
]

export const SUTRA_BY_SLUG = Object.fromEntries(SUTRAS.map((s) => [s.slug, s]))

// 去掉标点的纯经文，用于结构化数据和预渲染
export function sutraPlainText(sutra) {
  return sutra.lines.map((l) => l.text).join('')
}
