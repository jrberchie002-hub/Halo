self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
function tokGet() { return new Promise(function (res) { try { var r = indexedDB.open('halo', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { try { var q = r.result.transaction('kv').objectStore('kv').get('tok'); q.onsuccess = function () { res(q.result || ''); }; q.onerror = function () { res(''); }; } catch (e) { res(''); } }; r.onerror = function () { res(''); }; } catch (e) { res(''); } }); }
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data.json(); } catch (x) {}
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) {
    if (cl.some(function (c) { return c.focused && c.visibilityState === 'visible'; })) return;
    var call = /^call/.test(d.tag || ''), o = { body: d.body || '', icon: '/icon-192.png', badge: '/badge.png', tag: d.tag || 'halo', renotify: true, requireInteraction: call, silent: false, timestamp: Date.now(), vibrate: call ? [400, 200, 400, 200, 400] : [90, 60, 90], data: { url: d.url || '/', from: d.from || '', kind: d.kind || '' } };
    if (d.kind === 'msg' && d.from) o.actions = [{ action: 'reply', type: 'text', title: 'Reply', placeholder: 'Reply to ' + (d.who || 'them') + '…' }];
    return self.registration.showNotification(d.title || 'Halo', o);
  }));
});
self.addEventListener('notificationclick', function (e) {
  var n = e.notification, dt = n.data || {}; n.close();
  if (e.action === 'reply' && e.reply && dt.from) {
    e.waitUntil(tokGet().then(function (t) { if (!t) return self.clients.openWindow('/'); return fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ to: dt.from, x: String(e.reply).slice(0, 2000), ck: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }) }).catch(function () {}); }));
    return;
  }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) { if (cl.length) return cl[0].focus(); return self.clients.openWindow(dt.url || '/'); }));
});

var SHELL = 'halo-shell-v1', STATIC = ['/', '/index.html', '/app.js', '/qr.js', '/manifest.webmanifest', '/icon-192.png', '/badge.png', '/icon-512.png', '/apple-touch-icon.png', '/logos/spotify.png', '/logos/ytm.png', '/logos/apple.png', '/logos/audiomack.png', '/logos/soundcloud.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(SHELL).then(function (c) { return Promise.all(STATIC.map(function (u) { return fetch(u, { cache: 'reload' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {}); })); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== SHELL && k.indexOf('halo-shell') === 0; }).map(function (k) { return caches.delete(k); })); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return; var u = new URL(r.url); if (u.origin !== location.origin || u.pathname.indexOf('/api/') === 0 || u.pathname.indexOf('/music') === 0) return;
  var key = r.mode === 'navigate' ? '/index.html' : (STATIC.indexOf(u.pathname) > -1 ? u.pathname : null); if (!key) return;
  e.respondWith(caches.open(SHELL).then(function (c) { return c.match(key).then(function (hit) { var net = fetch(r.mode === 'navigate' ? '/index.html' : r, { cache: 'no-cache' }).then(function (resp) { if (resp && resp.ok) c.put(key, resp.clone()); return resp; }).catch(function () { return hit; }); if (!hit) return net; e.waitUntil(net.catch(function () {})); return hit; }); }));
});
