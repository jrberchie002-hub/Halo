(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var H = 'https://api.audius.co', APP = 'Halo Music';
  var IC = {
    note: '<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
    play: '<svg viewBox="0 0 24 24" style="fill:currentColor"><path d="M8 5l11 7-11 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M6 5v14M19 5l-9 7 9 7z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M18 5v14M5 5l9 7-9 7z"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>'
  };
  var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var S = { tab: LS.get('hm.tab') || 'free', q: '', list: [], i: -1, playing: false, src: 'free', free: [], loading: false, err: false, local: [], stamp: 0 };
  var A = new Audio(); A.preload = 'auto';
  function liked() { try { var l = JSON.parse(LS.get('hm.liked') || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function isLiked(x) { return !!x && liked().some(function (l) { return l.id === x.id; }); }
  function toggleLike(x) { if (!x || !x.remote) return; var l = liked(), k = l.findIndex(function (a) { return a.id === x.id; }); if (k > -1) l.splice(k, 1); else l.unshift({ id: x.id, name: x.name, artist: x.artist, art: x.art, dur: x.dur }); LS.set('hm.liked', JSON.stringify(l.slice(0, 400))); }
  function fmt(n) { n = Math.max(0, Math.floor(n || 0)); return Math.floor(n / 60) + ':' + ('0' + (n % 60)).slice(-2); }
  /* ---- local files (same database as Halo chat, so songs added there show here) ---- */
  function dbOpen(cb) { try { var r = indexedDB.open('halomusic', 1); r.onupgradeneeded = function () { r.result.createObjectStore('f', { keyPath: 'id' }); }; r.onsuccess = function () { cb(r.result); }; r.onerror = function () { cb(null); }; } catch (e) { cb(null); } }
  function localAll(cb) { dbOpen(function (db) { if (!db) return cb([]); try { var q = db.transaction('f').objectStore('f').getAll(); q.onsuccess = function () { cb((q.result || []).sort(function (a, b) { return a.t - b.t; })); }; q.onerror = function () { cb([]); }; } catch (e) { cb([]); } }); }
  function localAdd(files, cb) { dbOpen(function (db) { if (!db) return cb(0); var tx = db.transaction('f', 'readwrite'), st = tx.objectStore('f'), n = 0; Array.prototype.forEach.call(files, function (f, i) { if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i.test(f.name)) return; st.put({ id: 'h' + Date.now() + i + Math.random().toString(36).slice(2, 5), name: f.name.replace(/\.[^.]+$/, ''), size: f.size, t: Date.now() + i, blob: f }); n++; }); tx.oncomplete = function () { cb(n); }; tx.onerror = function () { cb(0); }; }); }
  function localDel(id, cb) { dbOpen(function (db) { if (!db) return cb(); var tx = db.transaction('f', 'readwrite'); tx.objectStore('f').delete(id); tx.oncomplete = cb; }); }
  /* ---- free catalog ---- */
  function get(path, cb) { fetch(H + path + (path.indexOf('?') > -1 ? '&' : '?') + 'app_name=' + encodeURIComponent(APP)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { cb(null, (j && j.data) || []); }).catch(function () { cb(1); }); }
  function mapT(t) { var a = t.artwork || {}; return { id: t.id, name: t.title || 'Song', artist: (t.user && t.user.name) || '', art: a['480x480'] || a['150x150'] || '', dur: t.duration || 0, remote: 1 }; }
  function urlOf(x) { return H + '/v1/tracks/' + x.id + '/stream?app_name=' + encodeURIComponent(APP); }
  function load(q) { S.q = q; S.err = false; S.loading = true; var st = S.stamp = Date.now(); draw(); get(q ? '/v1/tracks/search?query=' + encodeURIComponent(q) + '&limit=30' : '/v1/tracks/trending?limit=30', function (err, d) { if (st !== S.stamp) return; S.loading = false; if (err) S.err = true; else S.free = d.filter(function (t) { return t.is_streamable !== false; }).map(mapT); draw(); }); }
  /* ---- playback ---- */
  function play(list, i, src) { S.list = list.slice(); S.src = src; set(i); }
  function set(i) { var x = S.list[i]; if (!x) return; S.i = i; var u; if (x.remote) u = urlOf(x); else { if (S.blobUrl) { try { URL.revokeObjectURL(S.blobUrl); } catch (e) {} } u = S.blobUrl = URL.createObjectURL(x.blob); } A.src = u; var p = A.play(); if (p && p.catch) p.catch(function () {});
    try { if ('mediaSession' in navigator) { navigator.mediaSession.metadata = new MediaMetadata({ title: x.name, artist: x.artist || 'Halo Music', artwork: x.art ? [{ src: x.art, sizes: '480x480' }] : [] }); navigator.mediaSession.setActionHandler('nexttrack', function () { step(1); }); navigator.mediaSession.setActionHandler('previoustrack', function () { step(-1); }); navigator.mediaSession.setActionHandler('play', function () { A.play(); }); navigator.mediaSession.setActionHandler('pause', function () { A.pause(); }); } } catch (e) {}
    paintAll(); }
  function step(d) { if (!S.list.length) return; set((S.i + d + S.list.length) % S.list.length); }
  function toggle() { if (A.src) { if (A.paused) A.play(); else A.pause(); } }
  A.addEventListener('ended', function () { step(1); }); A.addEventListener('play', function () { S.playing = true; paintAll(); }); A.addEventListener('pause', function () { S.playing = false; paintAll(); });
  A.addEventListener('timeupdate', tick); A.addEventListener('loadedmetadata', tick);
  A.addEventListener('error', function () { if (S.list[S.i] && S.list[S.i].remote) { S.playing = false; paintAll(); } });
  function cur() { return S.list[S.i]; }
  /* ---- drawing ---- */
  function row(x, i, src) { var c = cur(), on = c && c.id === x.id && S.src === src; var sub = x.remote ? esc(x.artist) + (x.dur ? ' · ' + fmt(x.dur) : '') : (x.size / 1048576).toFixed(1) + ' MB';
    return '<div class="row ' + (on ? 'on' : '') + '" data-a="pick" data-s="' + src + '" data-i="' + i + '"><span class="art">' + (x.art ? '<img src="' + esc(x.art) + '" alt="" loading="lazy">' : IC.note) + '</span><span class="m"><b>' + esc(x.name) + '</b><small>' + sub + '</small></span>' +
      (x.remote ? '<button class="hb ' + (isLiked(x) ? 'on' : '') + '" data-a="like" data-s="' + src + '" data-i="' + i + '" aria-label="Like">' + IC.heart + '</button>' : '<button class="hb" data-a="del" data-i="' + i + '" aria-label="Remove">' + IC.x + '</button>') +
      '<span class="pp">' + (on && S.playing ? IC.pause : IC.play) + '</span></div>'; }
  function listFor(src) { return src === 'free' ? S.free : src === 'liked' ? liked().map(function (l) { return Object.assign({ remote: 1 }, l); }) : S.local; }
  function draw() { var m = $('#main'); if (!m) return; var t = S.tab, h = '';
    if (t === 'free') { if (S.err) h = '<div class="none">Could not reach the free music library. Check your connection.<br><br><button class="pill soft" data-a="retry">Try again</button></div>'; else if (S.loading) h = '<div class="none">Loading...</div>'; else if (!S.free.length) h = '<div class="none">No songs found</div>'; else h = '<div class="sec">' + (S.q ? 'Results' : 'Trending now') + '</div>' + S.free.map(function (x, i) { return row(x, i, 'free'); }).join('') + '<div class="cr">Free music from Audius artists. No ads.</div>'; }
    else if (t === 'liked') { var l = listFor('liked'); h = l.length ? '<div class="sec">' + l.length + ' liked</div>' + l.map(function (x, i) { return row(x, i, 'liked'); }).join('') : '<div class="none">Tap the heart on any song to keep it here.</div>'; }
    else { var q = (S.q || '').toLowerCase(); h = '<div class="hero"><b>Your music. No ads. No limits.</b><small>Songs live on your phone and play here, even with the screen off.</small><button class="pill" data-a="add">Add songs</button></div>' + (S.local.length ? '<div class="ctl"><span>' + S.local.length + ' song' + (S.local.length === 1 ? '' : 's') + '</span><button class="pill" data-a="all">Play all</button><button class="pill soft" data-a="shuf">Shuffle</button></div>' + S.local.map(function (x, i) { return (!q || x.name.toLowerCase().indexOf(q) > -1) ? row(x, i, 'mine') : ''; }).join('') : ''); }
    var top = m.scrollTop; m.innerHTML = h; m.scrollTop = top; }
  function paintMini() { var x = cur(), el = $('#mini'); if (!x) { el.hidden = true; return; } el.hidden = false; var inner = '<div class="mb"><span class="art" data-a="open">' + (x.art ? '<img src="' + esc(x.art) + '" alt="">' : IC.note) + '</span><span class="m" data-a="open"><b>' + esc(x.name) + '</b><small>' + esc(x.artist || 'Halo Music') + '</small></span><button class="pp" data-a="pp" aria-label="Play or pause">' + (S.playing ? IC.pause : IC.play) + '</button><button class="cb" data-a="next" aria-label="Next">' + IC.next + '</button></div><div class="bar"><i id="mbar"></i></div>'; if (el._h !== inner) { el._h = inner; el.innerHTML = inner; } tick(); }
  function paintPl() { var el = $('#pl'); if (el.hidden) return; var x = cur(); if (!x) return; var sk = $('#sk'), keep = sk && sk._d; el.innerHTML = '<div class="hd"><button class="ic" data-a="close" aria-label="Close">' + IC.down + '</button><div class="logo"><i class="ring"></i>Now playing</div>' + (x.remote ? '<button class="ic" data-a="plike" aria-label="Like" style="margin-left:auto">' + IC.heart.replace('<path', '<path ' + (isLiked(x) ? 'style="fill:#141214"' : '')) + '</button>' : '') + '</div><div class="cover">' + (x.art ? '<img src="' + esc(x.art) + '" alt="">' : IC.note) + '</div><h2>' + esc(x.name) + '</h2><p>' + esc(x.artist || 'Halo Music') + '</p><input type="range" id="sk" min="0" max="1000" value="0" aria-label="Seek"><div class="tm"><span id="tc">0:00</span><span id="td">0:00</span></div><div class="pc"><button data-a="prev" aria-label="Previous">' + IC.prev + '</button><button class="big" data-a="pp" aria-label="Play or pause">' + (S.playing ? IC.pause.replace('<svg', '<svg style="stroke:#fff"') : IC.play.replace('<svg', '<svg style="fill:#fff;stroke:#fff"')) + '</button><button data-a="next" aria-label="Next">' + IC.next + '</button></div>'; tick(); }
  function tick() { var x = cur(); if (!x) return; var d = A.duration && isFinite(A.duration) ? A.duration : (x.dur || 0), p = d ? A.currentTime / d : 0, b = $('#mbar'); if (b) b.style.width = Math.round(p * 100) + '%'; var sk = $('#sk'); if (sk && !sk._d) sk.value = Math.round(p * 1000); var c = $('#tc'), e = $('#td'); if (c) c.textContent = fmt(A.currentTime); if (e) e.textContent = fmt(d); }
  function paintAll() { draw(); paintMini(); paintPl(); }
  /* ---- events ---- */
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a;
    if (k === 'like') { e.stopPropagation(); var x = listFor(a.dataset.s)[+a.dataset.i]; toggleLike(x); draw(); return; }
    if (k === 'del') { e.stopPropagation(); var d = S.local[+a.dataset.i]; if (!d) return; if (cur() && cur().id === d.id && S.src === 'mine') A.pause(); localDel(d.id, function () { localAll(function (l) { S.local = l; draw(); }); }); return; }
    if (k === 'pick') { var src = a.dataset.s, lst = listFor(src), i = +a.dataset.i; if (cur() && lst[i] && cur().id === lst[i].id && S.src === src) toggle(); else play(lst, i, src); return; }
    if (k === 'pp') toggle(); else if (k === 'next') step(1); else if (k === 'prev') step(-1);
    else if (k === 'open') { $('#pl').hidden = false; paintPl(); } else if (k === 'close') $('#pl').hidden = true;
    else if (k === 'plike') { toggleLike(cur()); paintAll(); }
    else if (k === 'retry') load(S.q);
    else if (k === 'add') $('#ff').click();
    else if (k === 'all') { if (S.local.length) play(S.local, 0, 'mine'); } else if (k === 'shuf') { if (S.local.length) play(S.local, Math.floor(Math.random() * S.local.length), 'mine'); } });
  $('#seg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.tab = b.dataset.t; LS.set('hm.tab', S.tab); S.q = ''; var qi = $('#q'); qi.value = ''; qi.placeholder = S.tab === 'free' ? 'Search free music' : 'Search your songs'; $('#sq').hidden = true; Array.prototype.forEach.call($('#seg').children, function (c) { c.classList.toggle('on', c === b); }); if (S.tab === 'free') load(''); else if (S.tab === 'mine') localAll(function (l) { S.local = l; draw(); }); else draw(); });
  $('#sb').addEventListener('click', function () { if (S.tab === 'liked') return; var sq = $('#sq'); sq.hidden = !sq.hidden; if (!sq.hidden) $('#q').focus(); else { S.q = ''; $('#q').value = ''; if (S.tab === 'free') load(''); else draw(); } });
  var qt = 0; $('#q').addEventListener('input', function (e) { var v = e.target.value.trim(); clearTimeout(qt); if (S.tab === 'free') qt = setTimeout(function () { load(v); }, 450); else { S.q = v; draw(); } });
  $('#ff').addEventListener('change', function (e) { var f = Array.prototype.slice.call(e.target.files); localAdd(f, function () { localAll(function (l) { S.local = l; if (S.tab === 'mine') draw(); }); }); e.target.value = ''; });
  document.addEventListener('input', function (e) { if (e.target.id === 'sk') { var d = A.duration || 0; if (d) A.currentTime = e.target.value / 1000 * d; var c = $('#tc'); if (c) c.textContent = fmt(A.currentTime); } });
  document.addEventListener('pointerdown', function (e) { if (e.target.id === 'sk') e.target._d = 1; }); document.addEventListener('pointerup', function () { var s = $('#sk'); if (s) s._d = 0; });
  Array.prototype.forEach.call($('#seg').children, function (c) { c.classList.toggle('on', c.dataset.t === S.tab); });
  localAll(function (l) { S.local = l; if (S.tab === 'mine') draw(); });
  if (S.tab === 'free') load(''); else draw();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/music/sw.js', { scope: '/music/' }).catch(function () {});
})();
