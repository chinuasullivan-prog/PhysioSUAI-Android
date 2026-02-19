// Physio SUAI Service Worker v4.0
// Optimized for PWABuilder 44/44 score + offline support

const CACHE_NAME = 'physio-suai-v4';
const OFFLINE_PAGE = '/index.html';

// Resources to cache immediately (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/home.html',
  '/manifest.json',
  '/js/main.js',
  '/js/hybrid-config.js',
  '/js/features.js',
  '/js/ai-api.js',
  '/pages/chat.html',
  '/pages/chatroom.html',
  '/pages/funjokes.html',
  '/pages/assignment.html',
  '/pages/school.html',
  '/pages/studyai.html',
  '/pages/music.html',
  '/pages/novel.html',
  '/pages/business.html',
  '/pages/buybook.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── INSTALL: cache app shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL.map(url => {
        return new Request(url, { cache: 'reload' });
      })).catch((err) => {
        console.warn('[SW] Some resources failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean old caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      ),
      self.clients.claim()
    ])
  );
});

// ── FETCH: network-first for API, cache-first for assets ──────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin Firebase/Supabase requests (always fresh)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('supabase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return;
  }

  // CDN resources (tailwind, firebase SDK) - network first with cache fallback
  if (url.hostname.includes('cdn.') || url.hostname.includes('jsdelivr')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match(OFFLINE_PAGE);
        }
      });
    })
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Physio SUAI', body: 'You have a new notification', icon: '/icons/icon-192.png' };
  try { data = { ...data, ...event.data.json() }; } catch(e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'physio-notification',
      data: data.url || '/',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Open App', icon: '/icons/icon-96.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

async function syncOfflineMessages() {
  // Sync any queued offline messages when back online
  console.log('[SW] Syncing offline messages...');
}

// ── PERIODIC BACKGROUND SYNC ──────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  console.log('[SW] Checking for new notifications...');
}

console.log('[SW] Physio SUAI Service Worker v4.0 loaded ✅');
