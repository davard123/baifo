import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStaticPages, SITE, canonicalUrl } from './seo.config.js'

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
    `<title>${page.title} - ${SITE.baseUrl.replace(/^https?:\/\//, '')}</title>`,
    `<meta name="description" content="${page.description}" />`,
    `<meta name="keywords" content="${keywords}" />`,
    `<meta name="author" content="${SITE.baseUrl.replace(/^https?:\/\//, '')}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${page.hant ? 'zh_TW' : SITE.defaultLocale}" />`,
    `<meta property="og:title" content="${page.title}" />`,
    `<meta property="og:description" content="${page.description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${page.title}" />`,
    `<meta name="twitter:description" content="${page.description}" />`,
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

function buildFallbackContent(page) {
  // 放在 #app 内部，Vue mount 时整体替换；对无 JS 的爬虫/访客是真实可见内容。
  // 之前是 position:absolute;left:-9999px 的离屏隐藏块 —— 属于 Google 明确
  // 列为作弊信号的 hidden text，且内容与页面可见 FAQ 重复。
  const lines = [
    '<div class="prerender-fallback">',
    `  <h1>${page.heading}</h1>`,
    `  <p>${page.summary}</p>`,
  ]

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

  // Keep useful navigation available before JavaScript loads, using existing routes.
  const links = getStaticPages().filter((entry) =>
    entry.path !== page.path && (entry.path === '/' || entry.path === '/ancestors' || entry.path.startsWith('/guide/'))
  )
  lines.push('  <nav aria-label="使用说明与主要入口"><ul>')
  for (const entry of links) {
    const href = page.hant ? hantUrl(canonicalUrl(entry.path)) : canonicalUrl(entry.path)
    const label = page.hant ? toHantText(entry.heading) : entry.heading
    lines.push(`    <li><a href="${href}">${label}</a></li>`)
  }
  lines.push('  </ul></nav>')
  lines.push('</div>')
  return lines.join('\n')
}

function renderPage(page) {
  const head = buildMetaTags(page)
  const jsonLd = buildJsonLd(page)
  const fallbackContent = buildFallbackContent(page)

  return template
    .replace('<html lang="zh-CN">', page.hant ? '<html lang="zh-Hant">' : '<html lang="zh-CN">')
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:300,max-video-preview:-1" />')
    .replace(/<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/, `<!-- SEO_META_START -->\n    ${head}\n    <!-- SEO_META_END -->`)
    .replace(/<script type="application\/ld\+json" id="ld-webpage">[\s\S]*?<\/script>/, jsonLd)
    .replace(/<script>\s*const baseUrl = 'https:\/\/(?:www\.)?fopusha\.com\/'[\s\S]*?document\.getElementById\('ld-webpage'\)\.textContent = JSON\.stringify\(schema\);\s*<\/script>/, '')
    .replace(/<div id="app">[\s\S]*?<\/div><\/div>/, `<div id="app">${fallbackContent}</div>`)
}

for (const page of getStaticPages()) {
  const normalizedPath = ensureTrailingSlashless(page.path)
  const filePath = normalizedPath === '/'
    ? indexPath
    : path.join(distDir, normalizedPath.slice(1), 'index.html')

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, renderPage(page).replace(/^[ \t]+$/gm, ''), 'utf8')

  const hantPath = normalizedPath === '/'
    ? path.join(distDir, HANT_DIR, 'index.html')
    : path.join(distDir, HANT_DIR, normalizedPath.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(hantPath), { recursive: true })
  fs.writeFileSync(hantPath, renderPage(toHantPage(page)).replace(/^[ \t]+$/gm, ''), 'utf8')
}
