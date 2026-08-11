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

const template = fs.readFileSync(indexPath, 'utf8')

function ensureTrailingSlashless(url) {
  return url === '/' ? '/' : url.replace(/\/+$/, '')
}

function buildMetaTags(page) {
  const canonical = canonicalUrl(page.path)
  const image = `${SITE.baseUrl}${page.image || SITE.defaultImage}`
  const keywords = SITE.keywords.join(',')

  return [
    `<title>${page.title} - ${SITE.baseUrl.replace(/^https?:\/\//, '')}</title>`,
    `<meta name="description" content="${page.description}" />`,
    `<meta name="keywords" content="${keywords}" />`,
    `<meta name="author" content="${SITE.baseUrl.replace(/^https?:\/\//, '')}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.defaultLocale}" />`,
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

  lines.push('</section>')
  return lines.join('\n')
}

function renderPage(page) {
  const head = buildMetaTags(page)
  const jsonLd = buildJsonLd(page)
  const fallbackContent = buildFallbackContent(page)

  return template
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:300,max-video-preview:-1" />')
    .replace(/<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/, `<!-- SEO_META_START -->\n    ${head}\n    <!-- SEO_META_END -->`)
    .replace(/<script type="application\/ld\+json" id="ld-webpage">[\s\S]*?<\/script>/, jsonLd)
    .replace(/<script>\s*const baseUrl = 'https:\/\/www\.fopusha\.com\/'[\s\S]*?document\.getElementById\('ld-webpage'\)\.textContent = JSON\.stringify\(schema\);\s*<\/script>/, '')
    .replace(/<div id="app">[\s\S]*?<\/div><\/div>/, `<div id="app">${fallbackContent}</div>`)
}

for (const page of getStaticPages()) {
  const normalizedPath = ensureTrailingSlashless(page.path)
  const filePath = normalizedPath === '/'
    ? indexPath
    : path.join(distDir, normalizedPath.slice(1), 'index.html')

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, renderPage(page), 'utf8')
}
