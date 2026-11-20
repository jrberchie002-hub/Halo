self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data.json(); } catch (x) {}
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) {
    if (cl.some(function (c) { return c.focused && c.visibilityState === 'visible'; })) return;
    return self.registration.showNotification(d.title || 'Halo', { body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag || 'halo', renotify: true, requireInteraction: /^call/.test(d.tag || ''), vibrate: /^call/.test(d.tag || '') ? [400, 200, 400, 200, 400] : [120], data: { url: d.url || '/' } });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) { if (cl.length) return cl[0].focus(); return self.clients.openWindow((e.notification.data && e.notification.data.url) || '/'); }));
});

var SHELL = 'halo-shell-v1', STATIC = ['/', '/index.html', '/app.js', '/qr.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(SHELL).then(function (c) { return Promise.all(STATIC.map(function (u) { return fetch(u, { cache: 'reload' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {}); })); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== SHELL && k.indexOf('halo-shell') === 0; }).map(function (k) { return caches.delete(k); })); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return; var u = new URL(r.url); if (u.origin !== location.origin || u.pathname.indexOf('/api/') === 0) return;
  var key = r.mode === 'navigate' ? '/index.html' : (STATIC.indexOf(u.pathname) > -1 ? u.pathname : null); if (!key) return;
  e.respondWith(caches.open(SHELL).then(function (c) { return c.match(key).then(function (hit) { var net = fetch(r.mode === 'navigate' ? '/index.html' : r, { cache: 'no-cache' }).then(function (resp) { if (resp && resp.ok) c.put(key, resp.clone()); return resp; }).catch(function () { return hit; }); return hit || net; }); }));
});
