// HotelFlexi Safe Production Service Worker
// Version: hotelflexi-v1

const CACHE_NAME = 'hotelflexi-static-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/favicon.ico',
  '/favicon.png',
  '/light-logo.png',
  '/dark-logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

// Install: Cache offline page and core brand assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset fetch failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Purge obsolete caches
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

// Fetch Handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests immediately
  if (request.method !== 'GET') {
    return;
  }

  // 1.1 Bypass non-http/https schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 2. Strict Bypass: Never cache API endpoints, Firebase Auth, Razorpay, or Cloudflare Worker calls
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('razorpay.com')
  ) {
    return;
  }

  // 3. Navigation requests (HTML pages): Network-First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return cachedOffline || new Response('Offline - HotelFlexi', { status: 503, headers: { 'Content-Type': 'text/html' } });
      })
    );
    return;
  }

  // 4. Static assets (images, fonts, scripts, styles): Stale-While-Revalidate
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// ------------------------------------------------------------------------------
// 5. Firebase Cloud Messaging & Web Push Handler
// ------------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let title = 'HotelFlexi Alert';
  let options = {
    body: 'New operational update received.',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: '/app' },
    tag: 'hotelflexi-push',
    renotify: true,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      const notification = data.notification || data;
      title = notification.title || title;
      options.body = notification.body || options.body;
      if (notification.icon) options.icon = notification.icon;
      if (data.data?.url || data.action_url) {
        options.data.url = data.data?.url || data.action_url;
      }
    } catch (e) {
      options.body = event.data.text() || options.body;
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// ------------------------------------------------------------------------------
// 6. Notification Click Handler
// ------------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
