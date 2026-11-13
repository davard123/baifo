// 诵经页的 SEO。经文全文和逐句时间轴都从这里进来，所以不能被主包静态引用：
// 构建脚本（预渲染、sitemap、检查）静态 import；浏览器只在访问 /jing 时由 getSeoByPath 动态加载。
import { SUTRAS, sutraPlainText, jingCopy } from '../src/data/sutras.js'
import { getFangweiPages } from './seo.fangwei.js'
import {
  SITE,
  assemblePages,
  buildArticleSchema,
  buildFaqSchema,
  buildWebPageSchema,
} from './seo.config.js'

function jingListPage() {
  const path = '/jing'
  return {
    path,
    title: '在线诵经 | 心经、大悲咒、楞严咒、金刚经、地藏经女声读诵、唱诵视频，跟着念',
    description: '常诵经咒的女声读诵和唱诵视频：楞严咒、大悲咒、十小咒、心经、阿弥陀经、往生咒、金刚经、地藏经、普门品、普贤行愿品，跟着声音念，经文附在下面、带拼音，可跟读、可默读。经文按汉传通行课诵本校订，免费、不用注册。',
    hantCopy: {
      title: '在线诵经 | 心经、大悲咒、楞严咒、金刚经、地藏经女声读诵、唱诵影片，跟着念',
      description: '常诵经咒的女声读诵和唱诵影片：楞严咒、大悲咒、十小咒、心经、阿弥陀经、往生咒、金刚经、地藏经、普门品、普贤行愿品，跟着声音念，经文附在下面、带拼音，可跟读、可默读。想看注音版全文、自己出声念，请到「在线念经」。经文按汉传通行课诵本校订，免费、不用注册。',
    },
    heading: '在线诵经',
    summary: SUTRAS.map((s) => `${s.name}（${s.title}，${s.lines.length}句）`).join('；') + '。',
    image: SITE.defaultImage,
    schema: [
      buildWebPageSchema({
        path,
        name: '在线诵经',
        description: '常诵经咒全文，带拼音与诵读音频。',
        breadcrumbItems: [
          { name: '求财祈福拜佛网', path: '/' },
          { name: '诵经', path },
        ],
        about: { '@type': 'Thing', name: '诵经', description: '读诵佛经与经咒的日常修持方式。' },
        selectors: ['h1', '.lead'],
      }),
    ],
  }
}

function sutraPage(item) {
  const path = `/jing/${item.slug}`
  const fullText = sutraPlainText(item)
  // 和 /nianjing/ 同一部经的分工见 src/data/sutras.js jingCopy：这里主打读诵、唱诵录音和视频
  const copy = jingCopy(item)
  const hant = jingCopy(item, { hant: true })
  return {
    path,
    title: copy.title,
    description: copy.description,
    heading: copy.heading,
    summary: copy.lead,
    leadLink: copy.nianjingLink,
    hantCopy: {
      title: hant.title,
      description: hant.description,
      heading: hant.heading,
      summary: hant.lead,
      leadLink: hant.nianjingLink,
    },
    image: item.image,
    schema: [
      buildWebPageSchema({
        path,
        name: `${item.title}全文`,
        description: item.intro,
        breadcrumbItems: [
          { name: '求财祈福拜佛网', path: '/' },
          { name: '诵经', path: '/jing' },
          { name: item.title, path },
        ],
        about: { '@type': 'CreativeWork', name: item.name, author: item.translator },
        selectors: ['h1', '.jing-text', '.jing-about p'],
      }),
      buildArticleSchema({
        path,
        headline: `${item.title}全文`,
        name: item.name,
        description: item.intro,
        about: { '@type': 'CreativeWork', name: item.name },
        articleBody: fullText,
      }),
      buildFaqSchema(path, item.faqs.map((f) => ({ q: f.q, a: f.a }))),
      ...item.audio.map((a) => ({
        '@context': 'https://schema.org',
        '@type': 'AudioObject',
        name: `${item.title}${a.label}`,
        contentUrl: `${SITE.baseUrl}${a.src}`, // 是文件地址，不能用补结尾斜杠的 canonicalUrl
        encodingFormat: 'audio/mpeg',
        inLanguage: 'zh-CN',
        duration: `PT${Math.round(a.timing.duration)}S`,
      })),
      // 唱诵、读诵视频：让 Google 视频搜索和 AI 能识别到本页有视频
      ...item.videos
        .filter((v) => v.src && v.poster && (v.uploadDate || v.ytFrom))
        .map((v) => ({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: v.title.split('。')[0],
          description: `${v.title}。${item.title}（${item.name}）全文，${item.translator}。`.slice(0, 300),
          thumbnailUrl: `${SITE.baseUrl}${v.poster}`,
          contentUrl: `${SITE.baseUrl}${v.src}`,
          ...(v.yt ? { embedUrl: `https://www.youtube.com/embed/${v.yt}` } : {}),
          uploadDate: v.uploadDate || v.ytFrom,
          inLanguage: 'zh-CN',
          isPartOf: { '@type': 'WebPage', '@id': `${SITE.baseUrl}${path}/` },
        })),
    ],
  }
}

export function getJingPages() {
  return [jingListPage(), ...SUTRAS.map(sutraPage)]
}

// 全站页面（含诵经页、财神方位与入宅吉日页），给构建脚本用
export function getStaticPages() {
  return [...assemblePages(getJingPages()), ...getFangweiPages()]
}
