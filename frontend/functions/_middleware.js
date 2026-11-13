// 只有页面网址和 /api/* 会进到这里：图片、视频、音频、/assets/* 等静态文件
// 在 public/_routes.json 里排除了，直接由 Pages 静态服务和 CDN 缓存返回，
// 所以 www 主机下的静态文件不再跳到 apex（页面网址照常一跳 301）。
export async function onRequest(context) {
  const url = new URL(context.request.url)

  // Keep one canonical host so Google does not treat www and apex URLs as
  // separate pages. Preserve the full path and query string during the move.
  // Page paths go straight to the trailing-slash form that returns 200, so
  // www.fopusha.com/buddha/guanyin takes one hop instead of 301 + 308.
  if (url.hostname.toLowerCase() === 'www.fopusha.com') {
    url.hostname = 'fopusha.com'
    url.protocol = 'https:'
    if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) {
      url.pathname = `${url.pathname}/`
    }
    return Response.redirect(url.toString(), 301)
  }

  return context.next()
}
