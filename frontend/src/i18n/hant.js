// 繁体版：/zh-hant/ 前缀下的页面，内容和简体版共用一份，显示时用 OpenCC 转成台湾正体。
// 转换器只在繁体页面按需加载，简体页面不会下载字典。

export const HANT_PREFIX = '/zh-hant'

export function isHantPath(path = '') {
  return path === HANT_PREFIX || path.startsWith(`${HANT_PREFIX}/`)
}

export function stripHant(path = '/') {
  if (!isHantPath(path)) return path
  return path.slice(HANT_PREFIX.length) || '/'
}

export function toHant(path = '/') {
  if (isHantPath(path)) return path
  return `${HANT_PREFIX}${path === '/' ? '/' : path}`
}

let converterPromise = null
export function loadConverter() {
  if (!converterPromise) {
    converterPromise = import('opencc-js/cn2t').then((mod) => {
      const OpenCC = mod.default || mod
      return OpenCC.Converter({ from: 'cn', to: 'tw' })
    })
  }
  return converterPromise
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'])
const TEXT_ATTRS = ['placeholder', 'title', 'aria-label', 'alt']
const HAN = /[一-鿿]/

let observer = null
let convert = null

function convertTextNode(node) {
  const value = node.nodeValue
  if (!value || !HAN.test(value)) return
  const parent = node.parentElement
  if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest('[data-keep-script]')) return
  const next = convert(value)
  if (next !== value) node.nodeValue = next
}

function convertElement(el) {
  if (SKIP_TAGS.has(el.tagName) && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return
  if (el.closest('[data-keep-script]')) return
  for (const attr of TEXT_ATTRS) {
    const value = el.getAttribute(attr)
    if (value && HAN.test(value)) {
      const next = convert(value)
      if (next !== value) el.setAttribute(attr, next)
    }
  }
  // 站内链接留在繁体版里（切换语言的链接带 data-keep-script，不改）
  if (el.tagName === 'A') {
    const href = el.getAttribute('href')
    if (href && href.startsWith('/') && !href.startsWith('//') && !isHantPath(href) && !/\.[a-z0-9]{2,5}(\?|#|$)/i.test(href)) {
      el.setAttribute('href', toHant(href))
    }
  }
}

function convertTree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    convertTextNode(root)
    return
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return
  convertElement(root)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) convertTextNode(node)
    else convertElement(node)
    node = walker.nextNode()
  }
}

export function convertString(text) {
  return convert && text ? convert(text) : text
}

// 开始转换整页并持续跟踪 Vue 后续渲染出来的内容
export async function startHant() {
  convert = await loadConverter()
  convertTree(document.body)
  if (document.title) document.title = convert(document.title)
  if (observer) return
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') convertTextNode(m.target)
      else if (m.type === 'attributes') convertElement(m.target)
      else m.addedNodes.forEach(convertTree)
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...TEXT_ATTRS, 'href'],
  })
}
