import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStaticPages, SITE } from './seo.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicPath = path.resolve(__dirname, '../public/sitemap.xml')
const distPath = path.resolve(__dirname, '../dist/sitemap.xml')

const pages = getStaticPages().map((page) => ({
  url: page.path,
  changefreq: page.path === '/' ? 'daily' : 'weekly',
  priority: page.path === '/' ? '1.0' : page.path === '/ancestors' ? '0.9' : '0.8',
}))
const lastmod = new Date().toISOString().slice(0, 10)

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${SITE.baseUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

fs.writeFileSync(publicPath, xml, 'utf8')

if (fs.existsSync(path.dirname(distPath))) {
  fs.writeFileSync(distPath, xml, 'utf8')
}
