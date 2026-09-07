export async function onRequest(context) {
  const url = new URL(context.request.url)

  // Keep one canonical host so Google does not treat www and apex URLs as
  // separate pages. Preserve the full path and query string during the move.
  if (url.hostname.toLowerCase() === 'www.fopusha.com') {
    url.hostname = 'fopusha.com'
    return Response.redirect(url.toString(), 301)
  }

  return context.next()
}
