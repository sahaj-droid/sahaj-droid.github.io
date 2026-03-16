const CACHE_NAME = 'markettracker-v3';
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — cache core assets immediately, force activation
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete ALL old caches, claim clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - App shell (index.html, icons, manifest): Cache-first → always available offline
// - External scripts (unpkg.com CDN): Cache-first with network update in background
// - Proxy API calls (/quotes, /chart): Network-first, no caching
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Proxy API — always network only, never cache
  if (!e.request.url.startsWith(self.location.origin)) {
    // External: CDN scripts get stale-while-revalidate
    if (url.hostname.includes('unpkg.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
      e.respondWith(
        caches.open(CACHE_NAME).then(cache =>
          cache.match(e.request).then(cached => {
            const fresh = fetch(e.request).then(res => {
              if (res.ok) cache.put(e.request, res.clone());
              return res;
            }).catch(() => cached);
            return cached || fresh;
          })
        )
      );
    }
    // All other external (proxy server etc.) — pure network
    return;
  }

  // App shell — cache first, fallback to network, always update cache
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(e.request).then(cached => {
        const networkFetch = fetch(e.request)
          .then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          })
          .catch(() => cached || new Response('Offline', {status: 503}));

        // For navigation requests serve cache immediately for instant load
        if (e.request.mode === 'navigate') {
          return cached || networkFetch;
        }
        return networkFetch.catch(() => cached);
      })
    )
  );
});

// Listen for skip-waiting message from app (for instant update)
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
