import { BUDDHAS } from '../data/buddhas.js'

const BASE = 'https://baifo.rentalinca.com'

const pages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  ...BUDDHAS.map(b => ({
    url: `/buddha/${b.slug}`,
    changefreq: 'weekly',
    priority: '0.8'
  }))
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`

 Bun.write(Bun.file('public/sitemap.xml'), xml)