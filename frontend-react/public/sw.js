const CACHE_NAME = 'nutri-portal-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/portal',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de API, chamadas não-GET e esquemas não suportados (ex: chrome-extension://)
  if (
    !event.request.url.startsWith('http:') &&
    !event.request.url.startsWith('https:')
  ) {
    return;
  }

  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Network-First: Sempre tenta buscar a versão mais recente do código
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se estiver offline, retorna do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/portal') || caches.match('/');
          }
        });
      })
  );
});
