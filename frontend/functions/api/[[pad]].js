// Cloudflare Pages Function: alles wat de frontend naar /api/... stuurt, komt hier binnen
// en gaat door naar de backend op Railway. Lokaal doet de proxy in vite.config.js hetzelfde.
//
// Waarom zo en niet rechtstreeks vanuit de browser naar Railway?
// - Cloudflare Access (inloggen) staat vóór dit adres, dus alleen jij komt hier.
// - Hier voegen we de geheime sleutel toe; die komt nooit in de browser terecht.
// - Frontend en API op hetzelfde adres: geen CORS-gedoe.
//
// Instellen in Cloudflare Pages → Settings → Variables and Secrets:
// - BACKEND_URL: het adres van de backend op Railway, bijv. https://onderhoud.up.railway.app
// - APP_SLEUTEL: dezelfde geheime sleutel als op Railway (als "Secret")
//
// [[pad]] in de bestandsnaam = "alles onder /api/", bijv. /api/tasks/123/done.

export async function onRequest({ request, env }) {
  // Duidelijke melding in plaats van een crash (Cloudflare "error 1101") als er iets niet is ingesteld
  if (!env.APP_SLEUTEL) return fout('APP_SLEUTEL is niet ingesteld in Cloudflare Pages')
  let basis
  try {
    basis = new URL(env.BACKEND_URL)
  } catch {
    return fout('BACKEND_URL ontbreekt of is geen volledig adres (begint het met https://?)')
  }

  const url = new URL(request.url)
  const doel = new URL(url.pathname.replace(/^\/api/, '') + url.search, basis)

  const headers = new Headers(request.headers)
  headers.set('X-App-Sleutel', env.APP_SLEUTEL)
  // De inlog-cookie van Cloudflare Access hoeft de backend niet te zien
  headers.delete('cookie')
  headers.delete('host')

  try {
    return await fetch(doel, {
      method: request.method,
      headers,
      // Body eerst helemaal inlezen: onze verzoeken zijn kleine JSON-berichtjes
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
    })
  } catch {
    return fout(`Backend niet bereikbaar op ${basis.origin}`, 502)
  }
}

// Zelfde vorm als FastAPI-fouten ({ detail }), zodat de app de melding gewoon toont
function fout(detail, status = 500) {
  return new Response(JSON.stringify({ detail }), { status, headers: { 'Content-Type': 'application/json' } })
}
