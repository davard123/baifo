// 诵经页的 SEO。经文全文和逐句时间轴都从这里进来，所以不能被主包静态引用：
// 构建脚本（预渲染、sitemap、检查）静态 import；浏览器只在访问 /jing 时由 getSeoByPath 动态加载。
import { SUTRAS, sutraPlainText } from '../src/data/sutras.js'
import {
  SITE,
  assemblePages,
  buildArticleSchema,
  buildFaqSchema,
  buildWebPageSchema,
  canonicalUrl,
} from './seo.config.js'

function jingListPage() {
  const path = '/jing'
  return {
    path,
    title: '在线诵经 | 心经、大悲咒、金刚经、地藏经、阿弥陀经全文带拼音，女声读诵可跟读',
    description: '常诵经咒全文：心经、大悲咒、金刚经、地藏经、阿弥陀经、普门品、普贤行愿品，有女声读诵和唱诵视频，带拼音，可跟读、可默读。经文按汉传通行课诵本校订，免费、不用注册。',
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
  return {
    path,
    title: `${item.title}全文带拼音｜${item.name}诵读`,
    description: `${item.name}全文（${item.translator}），${item.lines.length}句、${item.charCount}字，带拼音，有女声读诵，可跟读、可默读。${item.intro}`.slice(0, 160),
    heading: item.name,
    summary: item.intro,
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
        contentUrl: canonicalUrl(a.src),
        encodingFormat: 'audio/mpeg',
        inLanguage: 'zh-CN',
        duration: `PT${Math.round(a.timing.duration)}S`,
      })),
    ],
  }
}

export function getJingPages() {
  return [jingListPage(), ...SUTRAS.map(sutraPage)]
}

// 全站页面（含诵经页），给构建脚本用
export function getStaticPages() {
  return assemblePages(getJingPages())
}
