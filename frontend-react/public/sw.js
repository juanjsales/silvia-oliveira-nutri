const CACHE_NAME = 'nutri-portal-v6';
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

// ── WEB PUSH NOTIFICATIONS ──
self.addEventListener('push', (event) => {
  let data = {
    title: 'Consultório Nutricional',
    body: 'Você possui uma nova notificação do consultório.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/portal',
    tag: 'nutri-alert',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || 'nutri-alert',
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || (data.data && data.data.url) || '/portal',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open_url',
        title: 'Abrir no Portal',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/portal';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta, foca nela e navega
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Se não houver aba aberta, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
