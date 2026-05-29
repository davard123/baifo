import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStaticPages, SITE, canonicalUrl } from './seo.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicSitemapPath = path.resolve(__dirname, '../public/sitemap.xml')
const distSitemapPath = path.resolve(__dirname, '../dist/sitemap.xml')
const publicTextSitemapPath = path.resolve(__dirname, '../public/sitemap.txt')
const distTextSitemapPath = path.resolve(__dirname, '../dist/sitemap.txt')
const publicRobotsPath = path.resolve(__dirname, '../public/robots.txt')
const distRobotsPath = path.resolve(__dirname, '../dist/robots.txt')

function getPageConfig(pagePath) {
  if (pagePath === '/') {
    return { changefreq: 'daily', priority: '1.0' }
  }
  if (pagePath === '/ancestors') {
    return { changefreq: 'daily', priority: '0.95' }
  }
  if (pagePath.startsWith('/buddha/')) {
    return { changefreq: 'weekly', priority: '0.90' }
  }
  if (pagePath.startsWith('/ancestor/')) {
    return { changefreq: 'weekly', priority: '0.85' }
  }
  if (pagePath.startsWith('/rituals/')) {
    return { changefreq: 'weekly', priority: '0.85' }
  }
  if (pagePath.startsWith('/guide/')) {
    return { changefreq: 'weekly', priority: '0.80' }
  }
  if (pagePath.startsWith('/topic/')) {
    return { changefreq: 'weekly', priority: '0.78' }
  }
  if (pagePath.startsWith('/prayers/')) {
    return { changefreq: 'weekly', priority: '0.75' }
  }
  if (pagePath.startsWith('/texts/')) {
    return { changefreq: 'weekly', priority: '0.72' }
  }
  return { changefreq: 'weekly', priority: '0.80' }
}

const pages = getStaticPages().map((page) => ({
  url: page.path,
  ...getPageConfig(page.path),
}))

const lastmod = new Date().toISOString().slice(0, 10)

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${canonicalUrl(page.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

const txt = `${pages.map((page) => canonicalUrl(page.url)).join('\n')}\n`

fs.writeFileSync(publicSitemapPath, xml, 'utf8')
fs.writeFileSync(publicTextSitemapPath, txt, 'utf8')

if (fs.existsSync(path.dirname(distSitemapPath))) {
  fs.writeFileSync(distSitemapPath, xml, 'utf8')
  fs.writeFileSync(distTextSitemapPath, txt, 'utf8')
}

if (fs.existsSync(publicRobotsPath) && fs.existsSync(path.dirname(distRobotsPath))) {
  fs.copyFileSync(publicRobotsPath, distRobotsPath)
}
