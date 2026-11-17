const CACHE_NAME  = 'care-system-v6';
const CACHE_FILES = [
  './index.html',
  './widget.html',
  './manifest.json',
  './widget-manifest.json',
  './icon.svg',
];

// ── Install: cache app shell ──────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(CACHE_FILES).catch(() => {})
    )
  );
});

// ── Activate: clear ALL old caches immediately ────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always network for Google APIs and OAuth
  if (url.includes('googleapis.com') || url.includes('accounts.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first for HTML — always get latest when online
  if (e.request.destination === 'document' || url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (icons, fonts, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Notification click: focus or open app ─────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('./index.html');
    })
  );
});

// ── Message handler ───────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'PING' && e.ports[0]) {
    e.ports[0].postMessage('PONG');
  }
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    const { title, options } = e.data;
    self.registration.showNotification(title, options);
  }
});
