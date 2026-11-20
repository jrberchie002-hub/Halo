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
