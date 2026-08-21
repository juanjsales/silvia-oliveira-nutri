const CACHE_NAME = 'nutri-portal-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/portal',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(
      ASSETS_TO_CACHE.map((asset) => cache.add(asset).catch(() => undefined))
    ))
  );
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
  const requestUrl = new URL(event.request.url);

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

  // Recursos externos devem respeitar diretamente a política do navegador/CSP.
  if (requestUrl.origin !== self.location.origin) {
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
      .catch(async () => {
        // Se estiver offline, retorna do cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          const appShell = await caches.match('/') || await caches.match('/portal');
          if (appShell) return appShell;
        }

        return new Response('Sem conexão. Tente novamente quando a rede estiver disponível.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
