// Google Analytics 4（GA4）统计。
//
// 把 GA4 的衡量 ID（G- 开头）填到下面的 GA_ID 里就会开始统计；留空则完全不加载、不发任何数据。
// 只在正式域名 fopusha.com 上统计，预览站（*.pages.dev）和本机开发不统计，避免测试数据混进报表。
//
// 隐私：事件里只放财神、场景、职业这类选项编号，绝不放用户填的名字、心愿、照片。
// 页面浏览由 GA4 自带的“增强型衡量”自动记录（包括站内切换页面），这里不重复发送。

const GA_ID = ''

let ready = false

export function initAnalytics() {
  if (ready || !GA_ID || typeof window === 'undefined') return
  if (!/(^|\.)fopusha\.com$/.test(window.location.hostname)) return
  ready = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
}

export function track(name, params = {}) {
  if (!ready || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', name, params)
  } catch {
    // 统计失败不影响页面功能
  }
}
