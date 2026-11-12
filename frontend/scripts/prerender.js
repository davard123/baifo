import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, canonicalUrl } from './seo.config.js'
import { getStaticPages } from './seo.jing.js'
import { getStaticNavigation } from './static-navigation.js'
import { SOUND_HELP } from '../src/data/soundHelp.js'
import { GUIDES } from '../src/data/guides.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexPath = path.join(distDir, 'index.html')

if (!fs.existsSync(indexPath)) {
  throw new Error(`Cannot prerender without build output: ${indexPath}`)
}

// 繁体版：内容与简体共用，构建时用 OpenCC 转成台湾正体，输出到 dist/zh-hant/
const OpenCC = (await import('opencc-js/cn2t')).default
const toHantText = OpenCC.Converter({ from: 'cn', to: 'tw' })
const HANT_DIR = 'zh-hant'

function hantUrl(url) {
  return url.replace(SITE.baseUrl, `${SITE.baseUrl}/${HANT_DIR}`)
}

function toHantPage(page) {
  return {
    ...page,
    hant: true,
    title: toHantText(page.title),
    description: toHantText(page.description),
    heading: toHantText(page.heading),
    summary: toHantText(page.summary || ''),
    schema: JSON.parse(toHantText(JSON.stringify(page.schema ?? []))),
  }
}

const template = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '')

function ensureTrailingSlashless(url) {
  return url === '/' ? '/' : url.replace(/\/+$/, '')
}

function buildMetaTags(page) {
  const hansCanonical = canonicalUrl(page.path)
  const canonical = page.hant ? hantUrl(hansCanonical) : hansCanonical
  const image = `${SITE.baseUrl}${page.image || SITE.defaultImage}`
  const keywords = SITE.keywords.join(',')

  return [
    `<title>${escapeHtml(page.title)} - ${SITE.baseUrl.replace(/^https?:\/\//, '')}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<meta name="keywords" content="${keywords}" />`,
    `<meta name="author" content="${SITE.baseUrl.replace(/^https?:\/\//, '')}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${page.hant ? 'zh_TW' : SITE.defaultLocale}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="zh-Hans" href="${hansCanonical}" />`,
    `<link rel="alternate" hreflang="zh-Hant" href="${hantUrl(hansCanonical)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${hansCanonical}" />`,
  ].join('\n    ')
}

function buildJsonLd(page) {
  return `<script type="application/ld+json" id="ld-webpage">${JSON.stringify(page.schema)}</script>`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildFallbackContent(page, staticPages) {
  // 放在 #app 内部，Vue mount 时整体替换；对无 JS 的爬虫/访客是真实可见内容。
  // 之前是 position:absolute;left:-9999px 的离屏隐藏块 —— 属于 Google 明确
  // 列为作弊信号的 hidden text，且内容与页面可见 FAQ 重复。
  const lines = [
    '<div class="prerender-fallback">',
    `  <h1>${page.heading}</h1>`,
    `  <p>${page.summary}</p>`,
  ]
  if (page.leadLink) {
    const href = page.hant ? hantUrl(canonicalUrl(page.leadLink.path)) : canonicalUrl(page.leadLink.path)
    const label = page.hant ? toHantText(page.leadLink.label) : page.leadLink.label
    lines.push(`  <p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`)
  }

  // Visible help content, without adding FAQ rich-result markup.
  const convert = page.hant ? toHantText : value => value
  if (page.path === '/nianfo') {
    lines.push('<section id="sound-help">', '<h2>'+escapeHtml(convert(SOUND_HELP.title))+'</h2>',
      '<p>'+escapeHtml(convert(SOUND_HELP.intro))+'</p>')
    for (const faq of SOUND_HELP.faqs) lines.push('<h3>'+escapeHtml(convert(faq.q))+'</h3>', '<p>'+escapeHtml(convert(faq.a))+'</p>')
    lines.push('<p>'+escapeHtml(convert(SOUND_HELP.disclaimer))+'</p>', '</section>')
  }
  if (page.path === '/guide/ancestors') {
    lines.push('<section id="memorial-writing"><h2>'+escapeHtml(convert('追思的话怎么写'))+'</h2></section>')
    for (const faq of GUIDES.ancestors.faqs) lines.push('<h3>'+escapeHtml(convert(faq.q))+'</h3>', '<p>'+escapeHtml(convert(faq.a))+'</p>')
  }
  // Flatten schema array (some entries may themselves be arrays)
  const schemas = [page.schema].flat(2).filter(Boolean)

  // Inject articleBody if present and different from summary
  const articleSchema = schemas.find((s) => s['@type'] === 'Article' || s['@type'] === 'BlogPosting')
  if (articleSchema?.articleBody && articleSchema.articleBody !== page.summary) {
    lines.push(`  <p>${articleSchema.articleBody}</p>`)
  }

  // Inject FAQ Q&A as HTML <dl> so Google sees the text directly
  const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
  if (faqSchema?.mainEntity?.length) {
    lines.push('  <dl>')
    for (const q of faqSchema.mainEntity) {
      lines.push(`    <dt>${q.name}</dt>`)
      lines.push(`    <dd>${q.acceptedAnswer?.text ?? ''}</dd>`)
    }
    lines.push('  </dl>')
  }

  // Keep bounded, relevant navigation available before JavaScript loads.
  const navigation = getStaticNavigation(page, staticPages)
  if (navigation.length) {
    lines.push(`  <nav aria-label="${page.hant ? '相關內容' : '相关内容'}">`)
    for (const group of navigation) {
      const groupLabel = page.hant ? toHantText(group.label) : group.label
      lines.push(`    <section><h2>${escapeHtml(groupLabel)}</h2><ul>`)
      for (const link of group.links) {
        const href = page.hant ? hantUrl(canonicalUrl(link.path)) : canonicalUrl(link.path)
        const label = page.hant ? toHantText(link.label) : link.label
        lines.push(`      <li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`)
      }
      lines.push('    </ul></section>')
    }
    lines.push('  </nav>')
  }
  lines.push('</div>')
  return lines.join('\n')
}

function renderPage(page, staticPages) {
  const head = buildMetaTags(page)
  const jsonLd = buildJsonLd(page)
  const fallbackContent = buildFallbackContent(page, staticPages)

  return template
    .replace('<html lang="zh-CN">', page.hant ? '<html lang="zh-Hant">' : '<html lang="zh-CN">')
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:300,max-video-preview:-1" />')
    .replace(/<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/, `<!-- SEO_META_START -->\n    ${head}\n    <!-- SEO_META_END -->`)
    .replace(/<script type="application\/ld\+json" id="ld-webpage">[\s\S]*?<\/script>/, jsonLd)
    .replace(/<script>\s*const baseUrl = 'https:\/\/(?:www\.)?fopusha\.com\/'[\s\S]*?document\.getElementById\('ld-webpage'\)\.textContent = JSON\.stringify\(schema\);\s*<\/script>/, '')
    .replace(/<div id="app">[\s\S]*?<\/div><\/div>/, `<div id="app">${fallbackContent}</div>`)
}

const staticPages = getStaticPages()

for (const page of staticPages) {
  const normalizedPath = ensureTrailingSlashless(page.path)
  const filePath = normalizedPath === '/'
    ? indexPath
    : path.join(distDir, normalizedPath.slice(1), 'index.html')

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, renderPage(page, staticPages).replace(/^[ \t]+$/gm, ''), 'utf8')

  const hantPath = normalizedPath === '/'
    ? path.join(distDir, HANT_DIR, 'index.html')
    : path.join(distDir, HANT_DIR, normalizedPath.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(hantPath), { recursive: true })
  fs.writeFileSync(hantPath, renderPage(toHantPage(page), staticPages).replace(/^[ \t]+$/gm, ''), 'utf8')
}
