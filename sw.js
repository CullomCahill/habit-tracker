const CACHE = 'habits-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/app.js', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Don't intercept API calls — only cache static assets
  if (e.request.url.includes('/.netlify/functions/') || e.request.url.includes('/api/')) return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});

// Real push from server (works even when app is closed)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Habit Tracker', {
      body: data.body || "Time to log your habits!",
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'habit-reminder',
      renotify: true,
    })
  );
});

// Tap notification → open/focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      return existing ? existing.focus() : clients.openWindow('/');
    })
  );
});

// Local fallback: show notification on behalf of the app page
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIF') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: e.data.icon || '/icon-192.png',
      tag: 'habit-reminder',
      renotify: true,
    });
  }
});
