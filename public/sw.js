// Spendly Service Worker — PWA Offline Support
const CACHE_NAME = 'spendly-v1'
const STATIC_ASSETS = [
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
]

// Install event: cache essential offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event: cleanup older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Strictly NEVER cache Supabase API requests, auth tokens, or mutation requests
  // to ensure absolute data privacy and real-time accuracy across user accounts.
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    event.request.method !== 'GET'
  ) {
    return
  }

  // For HTML navigation requests: network first, fallback to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html')
      })
    )
    return
  }

  // For static assets (images, icons): cache first, fallback to network
  if (
    url.pathname.startsWith('/icon-') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (response.status === 200) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            }
            return response
          })
        )
      })
    )
    return
  }

  // Default: direct network fetch
  event.respondWith(fetch(event.request))
})
