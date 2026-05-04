import { onMounted } from 'vue'

const BASE = 'https://baifo.rentalinca.com'

function setMeta({ title, description, path, image }) {
  document.title = title
  const map = {
    description,
    'og:title': title,
    'og:description': description,
    'og:url': `${BASE}${path}`,
    'og:type': 'website',
    'og:image': image ? `${BASE}${image}` : `${BASE}/og-default.png`,
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    keywords: '拜佛,祈愿,佛菩萨,释迦牟尼佛,阿弥陀佛,药师佛,弥勒佛,文殊菩萨,普贤菩萨,观音菩萨,地藏菩萨,礼佛,供佛,佛教,修行,功德,回向'
  }
  for (const [k, v] of Object.entries(map)) {
    let el = document.querySelector(`meta[name="${k}"], meta[property="${k}"]`)
    if (!el) {
      el = document.createElement('meta')
      if (k.startsWith('og:') || k === 'twitter:card') el.setAttribute('property', k)
      else el.setAttribute('name', k)
      document.head.appendChild(el)
    }
    el.setAttribute('content', v)
  }
  // canonical
  let canon = document.querySelector('link[rel="canonical"]')
  if (!canon) {
    canon = document.createElement('link')
    canon.setAttribute('rel', 'canonical')
    document.head.appendChild(canon)
  }
  canon.setAttribute('href', `${BASE}${path}`)
}

export function useSeo({ title, description, path, image }) {
  onMounted(() => setMeta({ title, description, path, image }))
}