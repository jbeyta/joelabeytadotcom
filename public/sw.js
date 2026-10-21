const CACHE = 'list-v3'
const PAGES = ['/index.html', '/goals.html']
const pageFor = url => (url.pathname.startsWith('/goals') ? '/goals.html' : '/index.html')

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const assets = []
    for (const page of PAGES) {
      const res = await fetch(page, { cache: 'reload' })
      const html = await res.clone().text()
      assets.push(...[...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(m => m[1]))
      await cache.put(page, res)
    }
    await cache.addAll([...new Set([...assets, '/manifest.webmanifest', '/goals.webmanifest', '/goals-icon.svg', '/goals-icon-192.png', '/goals-icon-512.png', '/goals-apple-touch-icon.png'])])
    self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req)
        if (res.ok) (await caches.open(CACHE)).put(pageFor(url), res.clone())
        return res
      } catch {
        return (await caches.match(pageFor(url))) || Response.error()
      }
    })())
    return
  }

  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return

  event.respondWith((async () => {
    const hit = await caches.match(req)
    if (hit) return hit
    try {
      const res = await fetch(req)
      if (res.ok || res.type === 'opaque') (await caches.open(CACHE)).put(req, res.clone())
      return res
    } catch {
      return Response.error()
    }
  })())
})
