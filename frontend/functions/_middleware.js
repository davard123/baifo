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
