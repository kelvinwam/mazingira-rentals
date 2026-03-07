const CACHE_NAME    = 'macharent-v1';
const STATIC_ASSETS = ['/', '/listings', '/offline'];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache, then offline page
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin API calls, and Next.js internals
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/_next/')) return;
  if (url.hostname !== self.location.hostname) return;

  e.respondWith(
    fetch(request)
      .then(res => {
        // Cache successful page navigations
        if (res.ok && request.mode === 'navigate') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('/offline');
          return new Response('', { status: 503 });
        })
      )
  );
});
