// JobHunt Service Worker — cache only static assets, never pages or API calls

const CACHE_NAME = 'jobhunt-v3'
const STATIC_ASSETS = [
  '/icon-192.svg',
  '/icon-512.svg',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Delete ALL old caches immediately
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // NEVER cache these — always go to network:
  // - Pages (dashboard, login, profile)
  // - API calls
  // - Auth-related
  const neverCache = [
    url.pathname.startsWith('/api/'),
    url.pathname.startsWith('/dashboard'),
    url.pathname.startsWith('/login'),
    url.pathname.startsWith('/profile'),
    url.pathname === '/',
    event.request.method !== 'GET',
    url.hostname.includes('supabase'),
  ]

  if (neverCache.some(Boolean)) {
    event.respondWith(fetch(event.request))
    return
  }

  // Cache only static assets (icons, manifest)
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, response.clone())
            )
          }
          return response
        })
      )
    )
    return
  }

  // Everything else — network only
  event.respondWith(fetch(event.request))
})
