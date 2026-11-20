(function () {
'use strict';
var $ = function (s, e) { return (e || document).querySelector(s); };
var app = $('#app');
var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };
var ICO = { chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', story: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', me: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0"/>', add: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>', back: '<path d="M15 18l-6-6 6-6"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', vid: '<rect x="2" y="6" width="14" height="12" rx="3"/><path d="M22 8l-6 4 6 4z"/>', end: '<path d="M3 15c5-5 13-5 18 0l-2 3-4-1v-3a10 10 0 0 0-6 0v3l-4 1z"/>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', ok: '<path d="M5 12l5 5 9-10"/>', plus: '<path d="M12 5v14M5 12h14"/>' };
function I(n) { return '<svg viewBox="0 0 24 24">' + ICO[n] + '</svg>'; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var BG = ['linear-gradient(160deg,#ff4f7b,#ff9a3c)', 'linear-gradient(160deg,#ffd23f,#ff7a3c)', 'linear-gradient(160deg,#ff6f61,#c2185b)', 'linear-gradient(160deg,#1f1a1d,#5b2a3a)', 'linear-gradient(160deg,#ff9a8b,#ffd23f)', 'linear-gradient(160deg,#f45d96,#ffb199)', 'linear-gradient(160deg,#171316,#ff4f7b)', 'linear-gradient(160deg,#ffe3ea,#ffb3c6)'];
var AVC = ['#ff4f7b', '#ff8a3c', '#e0a100', '#d6336c', '#e8590c', '#c2255c', '#f08c00', '#e64980'];
var STK = ['🔥', '😂', '😍', '🥹', '😎', '💀', '🙌', '❤️', '✨', '🎧', '📍', '🍕', '🎉', '👀', '💯', '🫶'];

var S = { tok: LS.get('halo.tok'), me: null, people: {}, chats: {}, msgs: {}, stories: {}, calls: {}, ice: {}, typing: {}, stamp: 0, resync: false, tab: 'chats', view: null, q: '', first: true, seenNotif: +LS.get('halo.sn') || 0, online: true, sig: '' };

/* ---------- api ---------- */
function api(method, path, body) {
  return fetch(path, { method: method, headers: Object.assign({ 'Content-Type': 'application/json' }, S.tok ? { Authorization: 'Bearer ' + S.tok } : {}), body: body ? JSON.stringify(body) : undefined }).then(function (r) {
    return r.json().catch(function () { return { ok: false, error: 'Bad reply' }; }).then(function (j) { if (r.status === 401 && S.tok && j.code === 'auth') { logout(true); } if (!r.ok) { var e = new Error(j.error || 'Something went wrong'); e.status = r.status; throw e; } return j; });
  });
}
function logout(silent) { S.tok = null; S.me = null; LS.del('halo.tok'); S.people = {}; S.chats = {}; S.msgs = {}; S.stories = {}; S.calls = {}; S.stamp = 0; S.first = true; if (!silent) LS.del('halo.key'); drawAuth(); }

/* ---------- helpers ---------- */
function person(id) { return S.people[id] || (S.me && S.me.id === id ? S.me : { id: id, name: 'Someone', username: '', pic: null }); }
function av(id, extra) { var p = person(id); return '<div class="av" style="background-color:' + AVC[(p.username || p.name || 'x').charCodeAt(0) % AVC.length] + ';' + (p.pic ? 'background-image:url(' + p.pic + ')' : '') + (extra || '') + '">' + (p.pic ? '' : esc((p.name || '?')[0].toUpperCase())) + '</div>'; }
function pair(a, b) { return [a, b].sort().join('|'); }
function ago(t) { var m = Math.round((Date.now() - t) / 6e4); if (m < 1) return 'now'; if (m < 60) return m + 'm'; var h = Math.round(m / 60); if (h < 24) return h + 'h'; return Math.round(h / 24) + 'd'; }
function dayKey(t) { return new Date(t).toISOString().slice(0, 10); }
function streakOf(c) { if (!c || !c.streak) return 0; var y = dayKey(Date.now() - 864e5); return c.streakDay >= y ? c.streak : 0; }
function chatList(id) { return S.msgs[id] || []; }
function lastMsg(id) { var l = chatList(id); return l[l.length - 1]; }
function unread(id) { var c = S.chats[id], r = (c && c.r && c.r[S.me.id]) || 0; return chatList(id).filter(function (m) { return m.from !== S.me.id && m.t > r; }).length; }
function totalUnread() { return Object.keys(S.chats).reduce(function (a, id) { return a + unread(id); }, 0); }
function friends() { return (S.me && S.me.friends) || []; }
function lt(m) { return m.x ? m.x.replace(/https?:\/\/\S+/, '🔗 link') : '📷 Photo'; }
function toast(id, x, open) { var o = $('.toast'); if (o) o.remove(); var d = document.createElement('button'); d.className = 'toast'; d.innerHTML = (id ? av(id) : '') + '<div style="flex:1;min-width:0"><b>' + esc(id ? person(id).name : 'Halo') + '</b><div style="font-size:13px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x) + '</div></div>'; d.onclick = function () { d.remove(); if (open) openChat(id); }; app.appendChild(d); setTimeout(function () { d.remove(); }, 4200); }
function beep() { try { var C = window.AudioContext || window.webkitAudioContext, c = new C(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(.15, c.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .25); o.start(); o.stop(c.currentTime + .26); } catch (e) {} }
function sysNotify(title, body) { try { if (document.hidden && window.Notification && Notification.permission === 'granted') new Notification(title, { body: body, icon: '/icon.svg' }); } catch (e) {} }
function shrink(file, max, q, cb) { var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', q)); }; im.onerror = function () { cb(null); }; im.src = r.result; }; r.readAsDataURL(file); }
function embedFor(u) { var m; try { var h = new URL(u); var host = h.hostname.replace(/^www\./, '');
  if ((m = /^(?:youtu\.be\/([\w-]{6,})|youtube\.com\/(?:watch\?v=|shorts\/|embed\/)([\w-]{6,}))/.exec(host + h.pathname.replace(/^\//, '/') + h.search)) || (host === 'youtu.be' && (m = [0, h.pathname.slice(1)]))) { var id = m[1] || m[2] || (h.searchParams.get('v')); if (host === 'youtube.com' && h.searchParams.get('v')) id = h.searchParams.get('v'); if (id) return { src: 'https://www.youtube-nocookie.com/embed/' + id + '?playsinline=1', h: 200 }; }
  if (host === 'youtube.com' && h.searchParams.get('v')) return { src: 'https://www.youtube-nocookie.com/embed/' + h.searchParams.get('v') + '?playsinline=1', h: 200 };
  if (host === 'open.spotify.com' && /^\/(track|album|playlist|episode|show|artist)\/\w+/.test(h.pathname)) return { src: 'https://open.spotify.com/embed' + h.pathname, h: /track|episode/.test(h.pathname) ? 80 : 232 };
  if (host === 'tiktok.com' && (m = /\/video\/(\d+)/.exec(h.pathname))) return { src: 'https://www.tiktok.com/embed/v2/' + m[1], h: 420 };
 } catch (e) {} return null; }
function kindOf(u) { var h = ''; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return null; } if (/tiktok/.test(h)) return ['🎵', 'TikTok']; if (/youtu/.test(h)) return ['▶️', 'YouTube']; if (/snapchat/.test(h)) return ['👻', 'Snapchat']; if (/instagram/.test(h)) return ['📸', 'Instagram']; if (/spotify/.test(h)) return ['🎧', 'Spotify']; if (/(^|\.)x\.com|twitter/.test(h)) return ['💬', 'Post on X']; if (/wa\.me|whatsapp/.test(h)) return ['📞', 'WhatsApp']; return ['🔗', h]; }
function fmt(x, id) { var links = []; var t = esc(x).replace(/(https?:\/\/[^\s<]+)/g, function (u) { var raw = u.replace(/&amp;/g, '&'); links.push(raw); return '<a href="' + esc(raw) + '" target="_blank" rel="noopener noreferrer">' + esc(raw.replace(/^https?:\/\/(www\.)?/, '').slice(0, 34)) + (raw.length > 40 ? '…' : '') + '</a>'; });
  var card = links.slice(0, 1).map(function (u) { var k = kindOf(u); if (!k) return ''; var e = embedFor(u); return '<div class="link"><div class="li">' + k[0] + '</div><div style="flex:1;min-width:0"><b>' + esc(k[1]) + '</b><span>' + esc(u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)) + '</span></div>' + (e ? '<button class="pill pk" style="padding:6px 12px" data-a="embed" data-u="' + esc(u) + '" data-m="' + esc(id) + '">Play here</button>' : '<a class="pill soft" style="padding:6px 12px" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">Open</a>') + '</div><div class="emb" data-for="' + esc(id) + '"></div>'; }).join(''); return t + card; }

/* ---------- sync ---------- */
var pollT = null, busy = false;
function merge(j) {
  var newIn = [];
  S.me = j.me; j.people.forEach(function (p) { S.people[p.id] = p; }); S.people[S.me.id] = S.me;
  var sig = (S.me.friends || []).join(',') + '/' + (S.me.reqIn || []).join(',') + '/' + (S.me.reqOut || []).join(',');
  if (S.sig && sig !== S.sig) S.resync = true; S.sig = sig;
  j.rows.forEach(function (r) {
    var d = r.data;
    if (r.c === 'chats') S.chats[r.id] = d;
    else if (r.c === 'msgs') { var l = S.msgs[d.chat] = S.msgs[d.chat] || []; var i = l.findIndex(function (m) { return m.id === d.id; }); if (i < 0) { l.push(d); l.sort(function (a, b) { return a.t - b.t; }); if (d.from !== S.me.id) delete S.typing[d.from]; if (d.from !== S.me.id && !S.first) newIn.push(d); } else l[i] = d; }
    else if (r.c === 'stories') { if (d.t === 0 || Date.now() - d.t > 864e5) delete S.stories[d.id]; else S.stories[d.id] = d; }
    else if (r.c === 'calls') { S.calls[d.id] = d; callEvent(d); }
    else if (r.c === 'ice') { if (d.to === S.me.id && !S.ice[r.id]) { S.ice[r.id] = d; iceIn(d); } }
    else if (r.c === 'typing') { S.typing[d.from] = d.t; }
  });
  S.stamp = j.stamp; var firstTime = S.first; S.first = false;
  newIn.forEach(function (m) { var open = S.view && S.view.chat === pair(S.me.id, m.from); if (open) { api('POST', '/api/read', { chat: m.chat }).catch(function () {}); } else { beep(); toast(m.from, lt(m), 1); sysNotify(person(m.from).name, lt(m)); } });
  return firstTime;
}
function poll() {
  clearTimeout(pollT); if (!S.tok || busy) return; busy = true;
  var since = S.resync ? 0 : S.stamp; S.resync = false;
  api('GET', '/api/sync?since=' + since).then(function (j) { S.online = true; var ft = merge(j); if (ft) { drawMain(); var u = pending('u'); if (u) { openPerson(u.id); } } else refreshLive(); }).catch(function (e) { if (e.status !== 401) S.online = false; }).then(function () { busy = false; pollT = setTimeout(poll, inCall() ? 700 : document.hidden ? 5000 : 1400); });
}
var _pu = null; function pending(k) { if (k === 'u' && !_pu) { try { var u = new URLSearchParams(location.search).get('u'); if (u) { _pu = { username: u.toLowerCase() }; history.replaceState(null, '', '/'); } } catch (e) {} } if (k === 'u' && _pu && _pu.username) { api('GET', '/api/search?q=' + encodeURIComponent(_pu.username)).then(function (r) { var f = r.users.filter(function (x) { return x.username === _pu.username; })[0]; _pu = null; if (f) { S.people[f.id] = S.people[f.id] || f; openPerson(f.id); } }).catch(function () { _pu = null; }); } return null; }
document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });

/* ---------- auth ---------- */
function drawAuth(step, data) {
  data = data || {}; var h = '';
  if (!step) h = '<div class="welcome"><div class="mark">halo<i>.</i></div><p style="color:var(--mute);margin:0 0 22px;font-size:17px">Chat with your people. Stories, calls and streaks. No phone number needed.</p><button class="cta" data-a="au" data-s="new">Create account</button><button class="cta ghost" data-a="au" data-s="login">I have an account</button></div>';
  else if (step === 'new') h = '<div style="padding:calc(18px + env(safe-area-inset-top,0px)) 20px 0"><button class="ic" data-a="au" data-s="" aria-label="Back">' + I('back') + '</button></div><div class="welcome" style="justify-content:flex-start;padding-top:10px"><h1 style="font-size:34px">Make it yours</h1><label class="field" style="padding:6px 0"><span>Your name</span><input id="a_n" maxlength="30" placeholder="e.g. Jay" autocomplete="name" value="' + esc(data.n || '') + '"></label><label class="field" style="padding:6px 0"><span>Pick a username</span><input id="a_u" maxlength="20" placeholder="e.g. jay.halo" autocapitalize="none" autocomplete="off" value="' + esc(data.u || '') + '"><small id="a_us"></small></label><label class="field" style="padding:6px 0"><span>Phone or email (optional)</span><input id="a_c" placeholder="So friends can find you" autocapitalize="none" value="' + esc(data.c || '') + '"></label><div style="flex:1"></div><button class="cta" id="a_go" data-a="signup">Create account</button></div>';
  else if (step === 'key') h = '<div class="welcome"><h1 style="font-size:32px">You are in, ' + esc(S.me.name.split(' ')[0]) + '.</h1><p style="color:var(--mute);margin:0">This is your key. It is how you log in on another phone. Screenshot it or copy it. We cannot show it again.</p><div class="key" id="keybox">' + esc(data.key) + '</div><button class="pill soft" style="align-self:center" data-a="copykey">Copy key</button><div style="flex:1"></div><button class="cta" data-a="enter">I saved it, open Halo</button></div>';
  else if (step === 'login') h = '<div style="padding:calc(18px + env(safe-area-inset-top,0px)) 20px 0"><button class="ic" data-a="au" data-s="" aria-label="Back">' + I('back') + '</button></div><div class="welcome" style="justify-content:flex-start;padding-top:10px"><h1 style="font-size:34px">Welcome back</h1><label class="field" style="padding:6px 0"><span>Username</span><input id="l_u" autocapitalize="none" autocomplete="username"></label><label class="field" style="padding:6px 0"><span>Your key</span><input id="l_k" autocapitalize="characters" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off"><small id="l_e" class="bad"></small></label><div style="flex:1"></div><button class="cta" data-a="login">Log in</button></div>';
  app.innerHTML = h;
  var u = $('#a_u'); if (u) { var t; u.addEventListener('input', function () { u.value = u.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); clearTimeout(t); var s = $('#a_us'); if (u.value.length < 3) { s.textContent = ''; s.className = ''; return; } t = setTimeout(function () { api('GET', '/api/check?u=' + encodeURIComponent(u.value)).then(function (r) { s.textContent = r.free ? '@' + u.value + ' is free' : (r.why || 'That one is taken'); s.className = r.free ? 'ok' : 'bad'; }).catch(function () {}); }, 300); }); }
}
function signup() {
  var n = $('#a_n').value.trim(), u = $('#a_u').value.trim(), c = $('#a_c').value.trim(), b = $('#a_go'); if (!n) return toast(null, 'Tell us your name'); if (u.length < 3) return toast(null, 'Pick a username of 3+ letters');
  b.disabled = true; var body = { name: n, username: u }; if (/@/.test(c)) body.email = c; else if (c) body.phone = c;
  api('POST', '/api/signup', body).then(function (j) { S.tok = j.token; LS.set('halo.tok', j.token); LS.set('halo.key', j.key); S.me = j.me; drawAuth('key', { key: j.key }); }).catch(function (e) { b.disabled = false; toast(null, e.message); });
}
function doLogin() { var u = $('#l_u').value.trim(), k = $('#l_k').value.trim(); api('POST', '/api/login', { username: u, key: k }).then(function (j) { S.tok = j.token; LS.set('halo.tok', j.token); LS.set('halo.key', k.toUpperCase()); S.me = j.me; start(); }).catch(function (e) { $('#l_e').textContent = e.message; }); }

/* ---------- Spotify strip ---------- */
var MINI = document.createElement('div'); MINI.className = 'mini'; MINI.style.cssText = 'margin:0 16px 8px;background:var(--ink);color:#fff;border-radius:18px;overflow:hidden;flex:none'; var miniSig = '', miniOpen = false;
function paintMini() {
  var np = S.me && S.me.np, sig = np ? np.song + '|' + np.artist + '|' + np.link : 'none'; if (sig + miniOpen === miniSig) return; miniSig = sig + miniOpen;
  if (!np || !np.song) { MINI.innerHTML = '<button data-a="miniset" style="display:flex;gap:10px;align-items:center;width:100%;padding:10px 14px;color:#fff;text-align:left"><span style="font-size:18px">🎧</span><span style="flex:1;font-size:14px;font-weight:600">Share what you are listening to</span><span class="pill sp" style="padding:5px 12px">Add</span></button>'; return; }
  var e = np.link && embedFor(np.link);
  MINI.innerHTML = '<div style="display:flex;gap:10px;align-items:center;padding:9px 12px"><div class="eq"><i></i><i></i><i></i></div><div style="flex:1;min-width:0;line-height:1.25"><b style="font-size:14px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(np.song) + '</b><span style="font-size:12px;opacity:.75">' + esc(np.artist || 'Your music') + '</span></div>' + (e ? '<button class="pill sp" style="padding:6px 14px" data-a="miniplay">' + (miniOpen ? 'Hide' : 'Play') + '</button>' : '') + '<button class="pill" style="padding:6px 12px;background:rgba(255,255,255,.16);color:#fff" data-a="miniset">Change</button></div>' + (e && miniOpen ? '<iframe src="' + e.src + '" style="width:100%;height:' + e.h + 'px;border:0;display:block" allow="autoplay;encrypted-media" loading="lazy"></iframe>' : '');
}
/* ---------- main shell ---------- */
function start() { S.first = true; S.stamp = 0; drawMain(); poll(); }
function drawMain() {
  if (!S.me) return; var open = $('.sheet,.sv,.call'); var nb = (S.me.reqIn || []).length;
  var title = { chats: 'Halo', stories: 'Stories', calls: 'Calls', me: 'You' }[S.tab];
  var head = S.tab === 'me' ? '<div class="top"><div class="t hd">You</div></div>' : '<div class="top"><div class="t hd">' + title + '</div><button class="ic" data-a="search" aria-label="Search">' + I('search') + '</button><button class="ic" data-a="add" aria-label="Add friends">' + I('add') + '</button><button class="ic" data-a="notifs" aria-label="Notifications">' + I('bell') + (notifCount() ? '<i class="dot"></i>' : '') + '</button></div>';
  var searchBar = S.tab === 'chats' ? '<button class="search" data-a="search">' + I('search') + 'Search people and messages</button>' : '';
  var nav = ['chats', 'stories', 'calls', 'me'].map(function (t) { var n = t === 'chats' ? totalUnread() : 0; return '<button data-a="tab" data-t="' + t + '" class="' + (S.tab === t ? 'on' : '') + '">' + I({ chats: 'chat', stories: 'story', calls: 'phone', me: 'me' }[t]) + { chats: 'Chats', stories: 'Stories', calls: 'Calls', me: 'You' }[t] + (n ? '<span class="badge">' + n + '</span>' : '') + '</button>'; }).join('');
  var keep = []; app.querySelectorAll('.sheet,.sv,.call,.toast').forEach(function (e) { keep.push(e); });
  paintMini(); app.innerHTML = head + searchBar + '<div class="body" id="bd">' + tabBody() + '</div><nav class="nav">' + nav + '</nav>'; var bdEl = $('#bd'); if (S.tab !== 'me') app.insertBefore(MINI, bdEl); keep.forEach(function (e) { app.appendChild(e); });
}
function notifCount() { var n = (S.me.reqIn || []).length; Object.keys(S.calls).forEach(function (id) { var c = S.calls[id]; if (c.to === S.me.id && c.missed && c.t > S.seenNotif) n++; }); return n; }
function refreshLive() {
  var bd = $('#bd'); if (bd && S.tab !== 'me' && !(document.activeElement && bd.contains(document.activeElement))) { var st = bd.scrollTop; bd.innerHTML = tabBody(); bd.scrollTop = st; }
  var nav = $('.nav'); if (nav) { var b = nav.querySelector('[data-t=chats]'); var n = totalUnread(); var bd2 = b && b.querySelector('.badge'); if (b) { if (n && !bd2) b.insertAdjacentHTML('beforeend', '<span class="badge">' + n + '</span>'); else if (n && bd2) bd2.textContent = n; else if (!n && bd2) bd2.remove(); } }
  var dot = $('.top .ic[data-a=notifs] .dot'), bell = $('.top .ic[data-a=notifs]'); if (bell) { if (notifCount() && !dot) bell.insertAdjacentHTML('beforeend', '<i class="dot"></i>'); else if (!notifCount() && dot) dot.remove(); }
  if (S.view && S.view.chat) paintThread(false);
  var nt = $('#nt'); if (nt) { nt.remove(); openNotifs(); }
}
function tabBody() { return S.tab === 'chats' ? chatsV() : S.tab === 'stories' ? storiesV() : S.tab === 'calls' ? callsV() : meV(); }
function storyUsers() { var by = {}; Object.keys(S.stories).forEach(function (id) { var s = S.stories[id]; (by[s.uid] = by[s.uid] || []).push(s); }); Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return a.t - b.t; }); }); return by; }
function ringState(uid) { var l = storyUsers()[uid]; if (!l) return ''; return l.some(function (s) { return s.uid !== S.me.id && (s.views || []).indexOf(S.me.id) < 0; }) ? 'new' : 'seen'; }
function chatsV() {
  var by = storyUsers(), ids = friends().slice().sort(function (a, b) { var la = lastMsg(pair(S.me.id, a)), lb = lastMsg(pair(S.me.id, b)); return ((lb && lb.t) || 0) - ((la && la.t) || 0); });
  var h = '<div class="stories"><button class="st" data-a="compose"><div class="add">+</div><span>Your story</span></button>' + friends().filter(function (f) { return by[f]; }).map(function (f) { return '<button class="st" data-a="story" data-id="' + f + '"><div class="ringw ' + (ringState(f) === 'new' ? 'new' : '') + '">' + av(f) + '</div><span>' + esc(person(f).name.split(' ')[0]) + '</span></button>'; }).join('') + '</div>';
  if (!ids.length) return h + '<div class="empty"><div style="font-size:40px">👋</div><h2 style="font-size:22px;margin:8px 0">Add your first friend</h2><p style="margin:0 0 16px">Search their username, or send them your invite link.</p><button class="pill pk" data-a="add">Find friends</button> <button class="pill soft" data-a="invite">Invite link</button></div>';
  return h + ids.map(function (f) { var id = pair(S.me.id, f), c = S.chats[id], m = lastMsg(id), p = person(f), n = unread(id), s = streakOf(c);
    return '<button class="row" data-a="chat" data-id="' + f + '"><div class="ringw ' + (ringState(f) === 'new' ? 'new' : '') + '" style="width:54px;height:54px">' + av(f) + '</div><div class="m"><b>' + esc(p.name) + (s ? '<span class="fire">🔥' + s + '</span>' : '') + '</b><div class="s ' + (n ? 'u' : '') + '">' + (m ? (m.from === S.me.id ? 'You: ' : '') + esc(lt(m)) : 'Say hi 👋') + '</div></div><div class="r"><span>' + (m ? ago(m.t) : '') + '</span>' + (n ? '<span class="unread">' + n + '</span>' : '') + '</div></button>'; }).join('');
}
function tile(s, who) { return '<button class="tile" data-a="story" data-id="' + s.uid + '" data-i="' + s.id + '" style="background-image:' + (s.img ? 'url(' + s.img + ')' : BG[s.bg || 0]) + ';' + ((s.views || []).indexOf(S.me.id) > -1 && s.uid !== S.me.id ? 'filter:saturate(.55)' : '') + '">' + (s.stickers || []).map(function (k) { return '<span class="stk" style="left:' + k.x * 100 + '%;top:' + k.y * 100 + '%;font-size:' + 26 * k.s + 'px">' + esc(k.e) + '</span>'; }).join('') + '<div class="tx">' + esc((s.text || '').slice(0, 50)) + '</div><small>' + esc(who) + ' · ' + ago(s.t) + '</small></button>'; }
function storiesV() {
  var all = Object.keys(S.stories).map(function (k) { return S.stories[k]; }), mine = all.filter(function (s) { return s.uid === S.me.id; }).sort(function (a, b) { return b.t - a.t; }), fr = all.filter(function (s) { return s.uid !== S.me.id; }).sort(function (a, b) { return b.t - a.t; });
  var h = '<div style="padding:4px 16px 6px"><button class="row" style="padding:12px;background:var(--bg);border-radius:18px" data-a="compose"><div class="ringw">' + av(S.me.id) + '</div><div class="m"><b>Add to your story</b><div class="s">' + (mine.length ? mine.length + ' live now' : 'Photos, stickers, thoughts. Gone in 24h.') + '</div></div><span class="pill pk">+ Add</span></button></div>';
  if (mine.length) h += '<div class="sec">Your story</div><div class="grid">' + mine.map(function (s) { return tile(s, 'You'); }).join('') + '</div>';
  h += '<div class="sec">Friends</div>'; if (!fr.length) return h + '<div class="empty">No stories from friends right now.</div>';
  return h + '<div class="grid">' + fr.map(function (s) { return tile(s, person(s.uid).name.split(' ')[0]); }).join('') + '</div>';
}
function callsV() {
  var l = Object.keys(S.calls).map(function (k) { return S.calls[k]; }).filter(function (c) { return c.state === 'ended' || c.missed; }).sort(function (a, b) { return b.t - a.t; });
  if (!l.length) return '<div class="empty"><div style="font-size:40px">📞</div><p>Your calls show up here. Open a chat and tap the phone.</p></div>';
  return l.map(function (c) { var other = c.from === S.me.id ? c.to : c.from, dir = c.missed ? (c.from === S.me.id ? 'No answer' : 'Missed') : (c.from === S.me.id ? 'Outgoing' : 'Incoming'), dur = c.t0 && c.end ? Math.max(1, Math.round((c.end - c.t0) / 1000)) : 0; return '<div class="row">' + av(other) + '<div class="m"><b style="' + (c.missed && c.from !== S.me.id ? 'color:#d6372b' : '') + '">' + esc(person(other).name) + '</b><div class="s">' + dir + (dur ? ' · ' + Math.floor(dur / 60) + ':' + String(dur % 60).padStart(2, '0') : '') + ' · ' + (c.kind === 'video' ? 'Video · ' : '') + ago(c.t) + '</div></div><button class="ic" data-a="call" data-id="' + other + '" aria-label="Call back">' + I('phone') + '</button></div>'; }).join('');
}
function socLinks(soc) { soc = soc || {}; var o = []; if (soc.wa) o.push(['💬 WhatsApp', 'https://wa.me/' + String(soc.wa).replace(/\D/g, '')]); if (soc.sc) o.push(['👻 Snapchat', 'https://www.snapchat.com/add/' + encodeURIComponent(soc.sc)]); if (soc.ig) o.push(['📸 Instagram', 'https://instagram.com/' + encodeURIComponent(soc.ig)]); if (soc.tt) o.push(['🎵 TikTok', 'https://www.tiktok.com/@' + encodeURIComponent(soc.tt)]); return o.length ? '<div class="soc">' + o.map(function (x) { return '<a href="' + x[1] + '" target="_blank" rel="noopener noreferrer">' + x[0] + '</a>'; }).join('') + '</div>' : ''; }
function npBar(np, mine) { if (!np || !np.song) return ''; var e = np.link && embedFor(np.link); return '<div class="np"><div class="eq"><i></i><i></i><i></i></div><div class="m"><b>' + esc(np.song) + '</b>' + (np.artist ? ' · ' + esc(np.artist) : '') + '</div>' + (np.link ? '<a class="pill sp" style="padding:6px 12px" href="' + esc(np.link) + '" target="_blank" rel="noopener noreferrer">Spotify</a>' : '') + (mine ? '<button class="ic" style="width:30px;height:30px" data-a="npclear" aria-label="Stop sharing">' + I('x') + '</button>' : '') + '</div>' + (e ? '<div style="padding:0 16px"><iframe src="' + e.src + '" style="width:100%;height:' + e.h + 'px;border:0;border-radius:14px" allow="autoplay;encrypted-media" loading="lazy"></iframe></div>' : ''); }
function meV() {
  var me = S.me, np = me.np || {}, soc = me.soc || {};
  return '<div class="hero"><button style="position:relative" data-a="pic">' + av(me.id) + '<span class="cam">📷</span></button><h2 style="font-size:24px">' + esc(me.name) + '</h2><div class="chip">@' + esc(me.username) + '</div></div><div style="padding:0 16px 8px;display:flex;gap:8px"><button class="cta" style="height:46px" data-a="invite">Invite friends</button></div>' +
    '<label class="field"><span>Name</span><input id="pn" value="' + esc(me.name) + '" maxlength="30"></label><label class="field"><span>Bio</span><textarea id="pb" rows="2" maxlength="80" placeholder="Say something about you">' + esc(me.bio || '') + '</textarea></label>' +
    '<div class="sec">Now playing</div>' + npBar(me.np, true) + '<label class="field"><span>Spotify link (paste it, we fill the rest)</span><input id="ml" value="' + esc(np.link || '') + '" placeholder="https://open.spotify.com/track/…" inputmode="url"></label><div style="display:flex;gap:8px;padding:0 16px"><input id="ms" value="' + esc(np.song || '') + '" placeholder="Song" maxlength="60" style="flex:1;min-width:0;height:42px;border-radius:14px;padding:0 12px;background:var(--bg);border:0;outline:0"><input id="ma" value="' + esc(np.artist || '') + '" placeholder="Artist" maxlength="50" style="flex:1;min-width:0;height:42px;border-radius:14px;padding:0 12px;background:var(--bg);border:0;outline:0"></div><div style="padding:8px 16px"><button class="pill pk" data-a="npsave">Share what I am playing</button></div>' +
    '<div class="sec">Find me on</div><label class="field"><span>WhatsApp number</span><input id="s_wa" value="' + esc(soc.wa || '') + '" inputmode="tel"></label><label class="field"><span>Snapchat</span><input id="s_sc" value="' + esc(soc.sc || '') + '" autocapitalize="none"></label><label class="field"><span>Instagram</span><input id="s_ig" value="' + esc(soc.ig || '') + '" autocapitalize="none"></label><label class="field"><span>TikTok</span><input id="s_tt" value="' + esc(soc.tt || '') + '" autocapitalize="none"></label><div style="padding:6px 16px"><button class="pill soft" data-a="socsave">Save links</button></div>' +
    '<div class="sec">So friends can find you</div><label class="field"><span>Phone</span><input id="c_p" value="' + esc(me.phone || '') + '" inputmode="tel"></label><label class="field"><span>Email</span><input id="c_e" value="' + esc(me.email || '') + '" inputmode="email" autocapitalize="none"></label><div style="padding:6px 16px"><button class="pill soft" data-a="contactsave">Save</button></div>' +
    '<div class="sec">App</div><div class="menu"><button class="row" data-a="notifon"><div class="m"><b>Message alerts</b><div class="s">Get a ping when Halo is in the background</div></div></button><button class="row" data-a="theme"><div class="m"><b>Look</b><div class="s">Auto, light or dark. Tap to switch</div></div></button><button class="row" data-a="showkey"><div class="m"><b>My login key</b><div class="s">For logging in on another phone</div></div></button><button class="row" data-a="logout"><div class="m"><b style="color:#d6372b">Log out</b></div></button></div><div style="height:20px"></div><input type="file" id="pf" accept="image/*" hidden>';
}

/* ---------- sheets ---------- */
function sheet(h, id) { var s = document.createElement('div'); s.className = 'sheet'; if (id) s.id = id; s.innerHTML = h; app.appendChild(s); return s; }
function closeTop() { var all = app.querySelectorAll('.sheet,.sv,.call'); if (all.length) { var l = all[all.length - 1]; if (l._done) l._done(); l.remove(); } var left = app.querySelectorAll('.sheet'); S.view = null; left.forEach(function (x) { if (x.id === 'th') S.view = { chat: x.dataset.chat }; }); refreshLive(); }
function personOpen(id) { return $('#pr') ; }

function openChat(fid) {
  var cid = pair(S.me.id, fid), old = $('#th'); if (old) old.remove(); S.view = { chat: cid, fid: fid }; var p = person(fid), s = streakOf(S.chats[cid]);
  var el = sheet('<div class="bar"><button class="ic" data-a="close" aria-label="Back">' + I('back') + '</button><button class="ringw ' + (ringState(fid) === 'new' ? 'new' : '') + '" data-a="prof" data-id="' + fid + '" style="width:44px;height:44px;padding:2px" aria-label="Profile">' + av(fid) + '</button><div class="nm"><b>' + esc(p.name) + (s ? '<span class="fire">🔥' + s + '</span>' : '') + '</b><small id="sub">@' + esc(p.username) + '</small></div><button class="ic" data-a="call" data-id="' + fid + '" aria-label="Voice call">' + I('phone') + '</button><button class="ic" data-a="call" data-id="' + fid + '" data-v="1" aria-label="Video call">' + I('vid') + '</button></div><div class="msgs" id="ms"></div><div class="compose"><button class="ic" data-a="photo" aria-label="Send a photo">' + I('cam') + '</button><input type="file" id="cph" accept="image/*" hidden><textarea id="tx" rows="1" placeholder="Message" enterkeyhint="send"></textarea><button class="send" data-a="send" aria-label="Send">' + I('send') + '</button></div>', 'th');
  el.dataset.chat = cid; paintThread(true);
  api('POST', '/api/read', { chat: cid }).then(function () { var c = S.chats[cid]; if (c) { c.r = c.r || {}; c.r[S.me.id] = Date.now(); } refreshLive(); }).catch(function () {});
  var t = $('#tx', el), lastT = 0; t.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
  t.addEventListener('input', function () { t.style.height = 'auto'; t.style.height = Math.min(110, t.scrollHeight) + 'px'; if (Date.now() - lastT > 2500) { lastT = Date.now(); api('POST', '/api/typing', { to: fid }).catch(function () {}); } });
  setTimeout(function () { try { t.focus(); } catch (e) {} }, 300);
}
var lastSig = '';
function paintThread(force) {
  var el = $('#ms'); if (!el || !S.view) return; var cid = S.view.chat, fid = S.view.fid, c = S.chats[cid] || {}, list = chatList(cid), rd = (c.r && c.r[fid]) || 0, typing = S.typing[fid] && Date.now() - S.typing[fid] < 5000;
  var sig = list.map(function (m) { return m.id + (m.r ? JSON.stringify(m.r) : ''); }).join() + '|' + typing; if (!force && sig === lastSig) return; lastSig = sig;
  var near = el.scrollHeight - el.scrollTop - el.clientHeight < 140, h = '', last = 0, lastMine = -1; list.forEach(function (m, i) { if (m.from === S.me.id) lastMine = i; });
  var emb = {}; Array.prototype.forEach.call(el.querySelectorAll('.emb'), function (e) { if (e.innerHTML) emb[e.dataset.for] = e.innerHTML; });
  list.forEach(function (m, i) { if (m.t - last > 18e5) { h += '<div class="time">' + new Date(m.t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) + '</div>'; last = m.t; } var rx = m.r ? Object.keys(m.r).map(function (k) { return m.r[k]; }).join('') : ''; h += '<div class="b ' + (m.from === S.me.id ? 'me' : 'th') + (rx ? ' hasr' : '') + '" data-id="' + esc(m.id) + '" ' + (force ? 'style="animation:none"' : '') + '>' + (m.img ? '<img class="img" data-a="lb" src="' + m.img + '" alt="Photo">' : '') + (m.x ? fmt(m.x, m.id) : '') + (rx ? '<span class="rx">' + rx + '</span>' : '') + '</div>'; if (i === lastMine) h += '<div class="seen">Sent</div>'; });
  if (typing) h += '<div class="typing"><i></i><i></i><i></i></div>'; if (!list.length) h = '<div class="empty" style="margin:auto">Say hi to ' + esc(person(fid).name.split(' ')[0]) + ' 👋</div>';
  el.innerHTML = h; Object.keys(emb).forEach(function (k) { var t = el.querySelector('.emb[data-for="' + k + '"]'); if (t) t.innerHTML = emb[k]; }); if (force || near) el.scrollTop = el.scrollHeight;
  var sub = $('#sub'); if (sub) sub.textContent = typing ? 'typing…' : '@' + person(fid).username;
}
function sendMsg(img) {
  var t = $('#tx'); if (!t || !S.view) return; var x = img ? '' : t.value.trim(); if (!x && !img) return; var fid = S.view.fid; if (!img) { t.value = ''; t.style.height = 'auto'; }
  api('POST', '/api/send', { to: fid, x: x, img: img || undefined }).then(function (j) { var l = S.msgs[j.msg.chat] = S.msgs[j.msg.chat] || []; if (!l.some(function (m) { return m.id === j.msg.id; })) { l.push(j.msg); l.sort(function (a, b) { return a.t - b.t; }); } var c = S.chats[j.msg.chat] || (S.chats[j.msg.chat] = { id: j.msg.chat }); c.r = c.r || {}; c.r[S.me.id] = j.msg.t; paintThread(false); poll(); }).catch(function (e) { if (!img) t.value = x; toast(null, e.message); });
}

/* friends */
function relation(id) { if (friends().indexOf(id) > -1) return 'friends'; if ((S.me.reqIn || []).indexOf(id) > -1) return 'in'; if ((S.me.reqOut || []).indexOf(id) > -1) return 'out'; return 'none'; }
function personRow(p) { var r = relation(p.id); var btn = r === 'friends' ? '<button class="pill soft" data-a="chat2" data-id="' + p.id + '">Message</button>' : r === 'in' ? '<button class="pill pk" data-a="accept" data-id="' + p.id + '">Accept</button>' : r === 'out' ? '<span class="chip">Requested</span>' : '<button class="pill" data-a="req" data-id="' + p.id + '">Add</button>'; S.people[p.id] = S.people[p.id] || p; return '<div class="row"><button style="display:flex;gap:12px;align-items:center;flex:1;min-width:0;text-align:left" data-a="prof" data-id="' + p.id + '">' + av(p.id) + '<div class="m"><b>' + esc(p.name) + '</b><div class="s">@' + esc(p.username) + '</div></div></button>' + btn + '</div>'; }
function openSearch(add) {
  var el = sheet('<div class="bar"><button class="ic" data-a="close" aria-label="Back">' + I('back') + '</button><label class="search" style="margin:0;flex:1;width:auto"><span style="display:flex">' + I('search') + '</span><input id="sq" placeholder="' + (add ? 'Find friends by username, name, phone or email' : 'Search people and messages') + '" autocomplete="off" autocapitalize="none"></label></div><div class="body" id="sb" style="padding-bottom:20px"></div>', 'sr'); el.dataset.add = add ? '1' : '';
  var t, inp = $('#sq', el); function run() { var q = inp.value.trim(), ql = q.toLowerCase().replace(/^@/, ''), h = ''; var box = $('#sb', el);
    if (!q) { box.innerHTML = '<div class="empty">' + (add ? 'Type a username, name, phone number or email.' : 'Search your friends and what you said to them.') + '<br><br><button class="pill pk" data-a="invite">Invite friends</button></div>'; return; }
    var fr = friends().filter(function (f) { var p = person(f); return p.name.toLowerCase().indexOf(ql) > -1 || p.username.indexOf(ql) > -1; });
    var ms = []; friends().forEach(function (f) { chatList(pair(S.me.id, f)).forEach(function (m) { if (m.x && m.x.toLowerCase().indexOf(ql) > -1) ms.push([f, m]); }); }); ms.sort(function (a, b) { return b[1].t - a[1].t; });
    if (!add) { if (fr.length) h += '<div class="sec">Friends</div>' + fr.map(function (f) { return '<button class="row" data-a="chat2" data-id="' + f + '">' + av(f) + '<div class="m"><b>' + esc(person(f).name) + '</b><div class="s">@' + esc(person(f).username) + '</div></div></button>'; }).join(''); if (ms.length) h += '<div class="sec">Messages</div>' + ms.slice(0, 20).map(function (x) { return '<button class="row" data-a="chat2" data-id="' + x[0] + '">' + av(x[0]) + '<div class="m"><b>' + esc(person(x[0]).name) + '</b><div class="s">' + esc(x[1].x) + '</div></div><div class="r">' + ago(x[1].t) + '</div></button>'; }).join(''); }
    box.innerHTML = h + '<div id="pp"></div>';
    if (q.length >= 2) { clearTimeout(t); t = setTimeout(function () { api('GET', '/api/search?q=' + encodeURIComponent(q)).then(function (r) { var pp = $('#pp', el); if (!pp || inp.value.trim() !== q) return; var list = r.users.filter(function (u) { return !(!add && relation(u.id) === 'friends'); }); pp.innerHTML = (list.length ? '<div class="sec">People on Halo</div>' + list.map(personRow).join('') : (h ? '' : '<div class="empty">Nobody found for "' + esc(q) + '".<br><br><button class="pill pk" data-a="invite">Invite them</button></div>')); }).catch(function () {}); }, 250); } }
  inp.addEventListener('input', run); run(); setTimeout(function () { inp.focus(); }, 280);
}
function openNotifs() {
  S.seenNotif = Date.now(); LS.set('halo.sn', S.seenNotif);
  var rq = (S.me.reqIn || []).map(function (id) { return '<div class="row">' + av(id) + '<div class="m"><b>' + esc(person(id).name) + '</b><div class="s">wants to be your friend</div></div><button class="pill pk" data-a="accept" data-id="' + id + '">Accept</button><button class="ic" data-a="decline" data-id="' + id + '" aria-label="Decline">' + I('x') + '</button></div>'; }).join('');
  var mc = Object.keys(S.calls).map(function (k) { return S.calls[k]; }).filter(function (c) { return c.to === S.me.id && c.missed; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 8).map(function (c) { return '<div class="row">' + av(c.from) + '<div class="m"><b>Missed ' + (c.kind === 'video' ? 'video ' : '') + 'call</b><div class="s">' + esc(person(c.from).name) + ' · ' + ago(c.t) + ' ago</div></div></div>'; }).join('');
  var st = Object.keys(S.stories).map(function (k) { return S.stories[k]; }).filter(function (s) { return s.uid !== S.me.id; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 8).map(function (s) { return '<button class="row" data-a="story" data-id="' + s.uid + '" data-i="' + s.id + '">' + av(s.uid) + '<div class="m"><b>' + esc(person(s.uid).name) + '</b><div class="s">added to their story · ' + ago(s.t) + ' ago</div></div></button>'; }).join('');
  var old = $('#nt'); if (old) old.remove();
  sheet('<div class="bar"><button class="ic" data-a="close" aria-label="Back">' + I('back') + '</button><div class="nm"><b>Notifications</b></div></div><div class="body" style="padding-bottom:20px">' + (rq ? '<div class="sec">Friend requests</div>' + rq : '') + (mc ? '<div class="sec">Calls</div>' + mc : '') + (st ? '<div class="sec">Stories</div>' + st : '') + (!rq && !mc && !st ? '<div class="empty">All caught up.</div>' : '') + '</div>', 'nt');
}
function openPerson(id) {
  var p = person(id), r = relation(id), c = S.chats[pair(S.me.id, id)], s = streakOf(c), old = $('#pr'); if (old) old.remove();
  var acts = r === 'friends' ? '<button class="cta" style="flex:1;height:46px" data-a="chat2" data-id="' + id + '">Message</button><button class="ic" data-a="call" data-id="' + id + '" aria-label="Call">' + I('phone') + '</button><button class="ic" data-a="call" data-id="' + id + '" data-v="1" aria-label="Video call">' + I('vid') + '</button>' : r === 'in' ? '<button class="cta" style="flex:1;height:46px" data-a="accept" data-id="' + id + '">Accept request</button>' : r === 'out' ? '<button class="cta ghost" style="flex:1;height:46px" disabled>Requested</button>' : '<button class="cta" style="flex:1;height:46px" data-a="req" data-id="' + id + '">Add friend</button>';
  sheet('<div class="bar"><button class="ic" data-a="close" aria-label="Back">' + I('back') + '</button><div class="nm"><b>' + esc(p.name) + '</b><small>@' + esc(p.username) + '</small></div></div><div class="body" style="padding-bottom:20px"><div class="hero"><div class="ringw ' + (ringState(id) === 'new' ? 'new' : '') + '" style="width:112px;height:112px;padding:4px">' + av(id) + '</div><h2 style="font-size:24px">' + esc(p.name) + '</h2><div style="color:var(--mute)">' + esc(p.bio || '') + '</div>' + (s ? '<span class="chip">🔥 ' + s + ' day streak</span>' : '') + '</div>' + (r === 'friends' ? npBar(p.np) + socLinks(p.soc) : '') + '<div style="display:flex;gap:8px;padding:14px 16px;align-items:center">' + acts + '</div></div>', 'pr');
}
function invite() { var url = location.origin + '/?u=' + S.me.username, msg = 'Add me on Halo: ' + url; if (navigator.share) { navigator.share({ title: 'Halo', text: 'Add me on Halo', url: url }).catch(function () {}); return; } try { navigator.clipboard.writeText(msg).then(function () { toast(null, 'Invite link copied'); }, function () { toast(null, msg); }); } catch (e) { toast(null, msg); } }

/* stories */
function openStory(uid, startId) {
  var list = Object.keys(S.stories).map(function (k) { return S.stories[k]; }).filter(function (s) { return s.uid === uid; }).sort(function (a, b) { return a.t - b.t; }); if (!list.length) return;
  var idx = Math.max(0, startId ? list.findIndex(function (s) { return s.id === startId; }) : list.findIndex(function (s) { return uid !== S.me.id && (s.views || []).indexOf(S.me.id) < 0; })), tm = null, mine = uid === S.me.id;
  var s = document.createElement('div'); s.className = 'sv'; app.appendChild(s);
  function show() { clearTimeout(tm); if (idx >= list.length) return end(); var st = list[idx]; if (!mine) api('POST', '/api/story/view', { id: st.id }).catch(function () {}); var p = person(uid);
    s.innerHTML = '<div class="bars">' + list.map(function (_, k) { return '<i class="' + (k < idx ? 'd' : k === idx ? 'a' : '') + '"><b></b></i>'; }).join('') + '</div><div class="who">' + av(uid) + '<div style="flex:1"><b>' + esc(mine ? 'Your story' : p.name) + '</b><div style="font-size:12px;opacity:.8">' + ago(st.t) + ' ago' + (mine ? ' · ' + (st.views || []).length + ' seen' : '') + '</div></div>' + (mine ? '<button class="ic" style="background:rgba(255,255,255,.2)" data-sv="del" aria-label="Delete"><svg viewBox="0 0 24 24" style="stroke:#fff"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>' : '') + '<button class="ic" style="background:rgba(255,255,255,.2)" data-sv="x" aria-label="Close"><svg viewBox="0 0 24 24" style="stroke:#fff">' + ICO.x + '</svg></button></div><div class="stg" style="background-image:' + (st.img ? 'url(' + st.img + ')' : BG[st.bg || 0]) + '">' + (st.text ? '<div class="tx">' + esc(st.text) + '</div>' : '') + (st.stickers || []).map(function (k) { return '<span class="stk" style="left:' + k.x * 100 + '%;top:' + k.y * 100 + '%;font-size:' + 44 * k.s + 'px">' + esc(k.e) + '</span>'; }).join('') + '</div><div class="tapz"><div data-sv="p"></div><div data-sv="n"></div></div>' + (!mine ? '<div class="reply"><input id="sr" placeholder="Reply to ' + esc(p.name.split(' ')[0]) + '" autocomplete="off"><button class="send" data-sv="s" aria-label="Send">' + I('send') + '</button></div>' : '');
    var inp = $('#sr', s); if (inp) { inp.addEventListener('focus', function () { clearTimeout(tm); s.classList.add('paused'); }); inp.addEventListener('blur', function () { s.classList.remove('paused'); tm = setTimeout(function () { idx++; show(); }, 2500); }); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') reply(); }); }
    tm = setTimeout(function () { idx++; show(); }, 5000); }
  function end() { clearTimeout(tm); s.remove(); refreshLive(); }
  function reply() { var inp = $('#sr', s); if (!inp || !inp.value.trim()) return; var x = '↩︎ Replied to your story: ' + inp.value.trim(); inp.value = ''; api('POST', '/api/send', { to: uid, x: x }).then(function (j) { var l = S.msgs[j.msg.chat] = S.msgs[j.msg.chat] || []; l.push(j.msg); toast(uid, 'Sent'); }).catch(function (e) { toast(null, e.message); }); }
  s.addEventListener('click', function (e) { var a = e.target.closest('[data-sv]'); if (!a) return; var k = a.dataset.sv; if (k === 'x') end(); else if (k === 'n') { idx++; show(); } else if (k === 'p') { idx = Math.max(0, idx - 1); show(); } else if (k === 's') reply(); else if (k === 'del') { api('POST', '/api/story/delete', { id: list[idx].id }).then(function () { delete S.stories[list[idx].id]; end(); }).catch(function (e) { toast(null, e.message); }); } });
  s._done = function () { clearTimeout(tm); }; show();
}
var C = { bg: 0, img: null, stk: [], sel: -1 };
function openCompose() {
  C = { bg: 0, img: null, stk: [], sel: -1 };
  var sw = BG.map(function (b, i) { return '<button class="c ' + (i === 0 ? 'on' : '') + '" data-a="cbg" data-i="' + i + '" style="background:' + b + '" aria-label="Colour ' + (i + 1) + '"></button>'; }).join('');
  var el = sheet('<div class="bar"><button class="ic" data-a="close" aria-label="Close">' + I('x') + '</button><div class="nm"><b>New story</b><small>Friends see it for 24 hours</small></div><button class="pill pk" data-a="post">Post</button></div><div class="comp"><div class="cv" id="cv" style="background-image:' + BG[0] + '"><textarea id="ct" rows="3" maxlength="120" placeholder="Type something"></textarea></div></div><div class="tools">' + STK.map(function (e) { return '<button class="e" data-a="stk" data-e="' + e + '" aria-label="Sticker ' + e + '">' + e + '</button>'; }).join('') + '</div><div class="tools">' + sw + '<button class="pill soft" data-a="ccam" style="flex:none">📷 Camera</button><button class="pill soft" data-a="cgal" style="flex:none">🖼 Gallery</button><button class="pill soft" data-a="sbig" style="flex:none">A+</button><button class="pill soft" data-a="sdel" style="flex:none">Remove</button><input type="file" id="cf" accept="image/*" hidden><input type="file" id="cf2" accept="image/*" capture="user" hidden></div>', 'cp'); setTimeout(function () { $('#ct', el).focus(); }, 300);
  var cv = $('#cv', el), drag = null; cv.addEventListener('pointerdown', function (e) { var t = e.target.closest('.stk'); if (!t) { C.sel = -1; paintStk(); return; } C.sel = +t.dataset.i; drag = { i: C.sel }; t.setPointerCapture(e.pointerId); paintStk(); });
  cv.addEventListener('pointermove', function (e) { if (!drag) return; var r = cv.getBoundingClientRect(), k = C.stk[drag.i]; k.x = Math.max(.04, Math.min(.96, (e.clientX - r.left) / r.width)); k.y = Math.max(.04, Math.min(.96, (e.clientY - r.top) / r.height)); var n = cv.querySelector('.stk[data-i="' + drag.i + '"]'); if (n) { n.style.left = k.x * 100 + '%'; n.style.top = k.y * 100 + '%'; } });
  cv.addEventListener('pointerup', function () { drag = null; });
}
function paintStk() { var cv = $('#cv'); if (!cv) return; cv.querySelectorAll('.stk').forEach(function (n) { n.remove(); }); C.stk.forEach(function (k, i) { var n = document.createElement('div'); n.className = 'stk' + (i === C.sel ? ' sel' : ''); n.dataset.i = i; n.style.left = k.x * 100 + '%'; n.style.top = k.y * 100 + '%'; n.style.fontSize = 44 * k.s + 'px'; n.textContent = k.e; cv.appendChild(n); }); }

/* ---------- calls (WebRTC) ---------- */
var CALL = null; function inCall() { return !!CALL; }
var RTC = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
function callUI(c, status) {
  var other = c.from === S.me.id ? c.to : c.from, p = person(other), video = c.kind === 'video', incoming = c.to === S.me.id && c.state === 'ringing';
  var el = $('.call'); if (!el) { el = document.createElement('div'); el.className = 'call'; app.appendChild(el); }
  el.innerHTML = (video ? '<video class="rv" id="rv" autoplay playsinline></video><video class="lv" id="lv" autoplay playsinline muted></video>' : '') + '<div class="av big" style="background-color:#ff4f7b;' + (p.pic ? 'background-image:url(' + p.pic + ')' : '') + '">' + (p.pic ? '' : esc(p.name[0].toUpperCase())) + '</div><h2 style="font-size:28px;margin-top:24px;text-shadow:0 2px 12px rgba(0,0,0,.3)">' + esc(p.name) + '</h2><div id="cst" style="font-weight:700;text-shadow:0 1px 8px rgba(0,0,0,.3)">' + esc(status) + '</div><div class="ctl">' + (incoming ? '<button class="end" data-c="decline" aria-label="Decline">' + I('end') + '</button><button class="ok" data-c="accept" aria-label="Accept">' + I('phone') + '</button>' : '<button class="' + (CALL && CALL.muted ? 'on' : '') + '" data-c="mute" aria-label="Mute">' + I('mic') + '</button><button class="end" data-c="end" aria-label="End call">' + I('end') + '</button>') + '</div>';
  if (CALL && CALL.local) { var lv = $('#lv'); if (lv) lv.srcObject = CALL.local; } if (CALL && CALL.remote) { var rv = $('#rv'); if (rv) rv.srcObject = CALL.remote; }
}
function mkPc(id, other) { var pc = new RTCPeerConnection(RTC); CALL.pc = pc; CALL.qIce = []; CALL.rd = false; CALL.remote = new MediaStream(); pc.ontrack = function (e) { e.streams[0].getTracks().forEach(function (t) { CALL.remote.addTrack(t); }); var a = CALL.audio; if (!a) { a = CALL.audio = document.createElement('audio'); a.autoplay = true; a.playsInline = true; document.body.appendChild(a); } a.srcObject = CALL.remote; var rv = $('#rv'); if (rv) rv.srcObject = CALL.remote; var pl = a.play(); if (pl && pl.catch) pl.catch(function () {}); };
  pc.onicecandidate = function (e) { if (e.candidate) api('POST', '/api/call/ice', { id: id, cand: JSON.stringify(e.candidate) }).catch(function () {}); };
  pc.onconnectionstatechange = function () { if (pc.connectionState === 'connected') { CALL.t0 = CALL.t0 || Date.now(); tick(); } if (pc.connectionState === 'failed') endCall(true); };
  CALL.local.getTracks().forEach(function (t) { pc.addTrack(t, CALL.local); }); return pc; }
function tick() { clearInterval(CALL.iv); CALL.iv = setInterval(function () { if (!CALL || !CALL.t0) return; var s = Math.floor((Date.now() - CALL.t0) / 1000), e = $('#cst'); if (e) e.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500); }
function media(video) { return navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: 'user' } : false }); }
function startCall(fid, video) {
  if (CALL) return; if (!navigator.mediaDevices || !window.RTCPeerConnection) return toast(null, 'Calls are not supported in this browser');
  media(video).then(function (stream) { CALL = { local: stream, other: fid, kind: video ? 'video' : 'voice' }; var pc = mkPc(null, fid);
    return pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { return api('POST', '/api/call', { to: fid, video: !!video, offer: JSON.stringify(pc.localDescription) }); }).then(function (j) { CALL.id = j.call.id; CALL.rec = j.call; pc.onicecandidate = function (e) { if (e.candidate) api('POST', '/api/call/ice', { id: CALL.id, cand: JSON.stringify(e.candidate) }).catch(function () {}); }; callUI(j.call, 'Calling…'); CALL.ringT = setTimeout(function () { if (CALL && !CALL.t0) { endCall(); toast(null, 'No answer'); } }, 45000); });
  }).catch(function (e) { cleanup(); toast(null, /Permission|denied|NotAllowed/i.test(e.name + e.message) ? 'Allow the microphone to make calls' : (e.message || 'Could not start the call')); });
}
function callEvent(c) {
  if (!S.me) return; if (c.to === S.me.id && c.state === 'ringing' && !CALL && Date.now() - c.t < 45000 && !S.first) { CALL = { id: c.id, other: c.from, kind: c.kind, rec: c, incoming: true }; callUI(c, c.kind === 'video' ? 'Incoming video call' : 'Incoming call'); try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {} sysNotify(person(c.from).name, 'Calling you on Halo'); return; }
  if (!CALL || CALL.id !== c.id) return; CALL.rec = c;
  if (c.state === 'live' && c.answer && CALL.pc && !CALL.rd && c.from === S.me.id) { CALL.rd = true; clearTimeout(CALL.ringT); CALL.pc.setRemoteDescription(JSON.parse(c.answer)).then(flushIce).catch(function () {}); callUI(c, 'Connecting…'); }
  if (c.state === 'ended') { cleanup(); toast(null, c.missed ? (c.from === S.me.id ? 'No answer' : 'Call ended') : 'Call ended'); }
}
function iceIn(d) { if (!CALL || CALL.id !== d.call) return; try { var cand = JSON.parse(d.cand); if (CALL.rd && CALL.pc) CALL.pc.addIceCandidate(cand).catch(function () {}); else (CALL.qIce = CALL.qIce || []).push(cand); } catch (e) {} }
function flushIce() { var q = CALL && CALL.qIce || []; CALL.qIce = []; q.forEach(function (c) { CALL.pc.addIceCandidate(c).catch(function () {}); }); }
function acceptCall() { var c = CALL.rec, video = c.kind === 'video'; media(video).then(function (stream) { CALL.local = stream; var pc = mkPc(c.id, c.from); CALL.incoming = false; return pc.setRemoteDescription(JSON.parse(c.offer)).then(function () { CALL.rd = true; flushIce(); return pc.createAnswer(); }).then(function (a) { return pc.setLocalDescription(a); }).then(function () { return api('POST', '/api/call/answer', { id: c.id, answer: JSON.stringify(pc.localDescription) }); }).then(function () { callUI(c, 'Connecting…'); }); }).catch(function (e) { api('POST', '/api/call/answer', { id: c.id, decline: true }).catch(function () {}); cleanup(); toast(null, 'Allow the microphone to answer calls'); }); }
function endCall(failed) { var id = CALL && CALL.id; if (id) api('POST', '/api/call/end', { id: id }).catch(function () {}); cleanup(); if (failed) toast(null, 'Call dropped'); }
function cleanup() { if (!CALL) return; clearInterval(CALL.iv); clearTimeout(CALL.ringT); try { CALL.pc && CALL.pc.close(); } catch (e) {} try { CALL.local && CALL.local.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} if (CALL.audio) { CALL.audio.remove(); } CALL = null; var el = $('.call'); if (el) el.remove(); refreshLive(); }

/* ---------- events ---------- */
app.addEventListener('click', function (e) {
  var cc = e.target.closest('[data-c]'); if (cc && CALL) { var k = cc.dataset.c; if (k === 'end') endCall(); else if (k === 'decline') { api('POST', '/api/call/answer', { id: CALL.id, decline: true }).catch(function () {}); cleanup(); } else if (k === 'accept') acceptCall(); else if (k === 'mute') { CALL.muted = !CALL.muted; CALL.local.getAudioTracks().forEach(function (t) { t.enabled = !CALL.muted; }); cc.classList.toggle('on', CALL.muted); } return; }
  var a = e.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a, id = a.dataset.id;
  if (k === 'au') { drawAuth(a.dataset.s || undefined); }
  else if (k === 'signup') signup(); else if (k === 'login') doLogin();
  else if (k === 'copykey') { try { navigator.clipboard.writeText(S.tok && LS.get('halo.key')).then(function () { toast(null, 'Key copied'); }); } catch (x) {} }
  else if (k === 'enter') start();
  else if (k === 'tab') { S.tab = a.dataset.t; drawMain(); }
  else if (k === 'search') openSearch(false); else if (k === 'add') openSearch(true);
  else if (k === 'notifs') openNotifs();
  else if (k === 'chat') openChat(id); else if (k === 'chat2') { closeAll(); openChat(id); }
  else if (k === 'prof') openPerson(id);
  else if (k === 'close') closeTop();
  else if (k === 'send') sendMsg();
  else if (k === 'photo') $('#cph').click();
  else if (k === 'lb') { var lb = document.createElement('div'); lb.className = 'lb'; lb.innerHTML = '<img src="' + a.src + '" alt="Photo">'; lb.onclick = function () { lb.remove(); }; app.appendChild(lb); }
  else if (k === 'embed') { var box = a.closest('.b').querySelector('.emb'), em = embedFor(a.dataset.u); if (box.innerHTML) { box.innerHTML = ''; a.textContent = 'Play here'; } else if (em) { box.innerHTML = '<iframe src="' + em.src + '" style="width:100%;height:' + em.h + 'px;border:0;border-radius:12px;margin-top:8px;background:#000" allow="autoplay;encrypted-media;fullscreen" allowfullscreen loading="lazy"></iframe>'; a.textContent = 'Close'; } }
  else if (k === 'req') { api('POST', '/api/friend', { to: id }).then(function (j) { S.me[j.state === 'friends' ? 'friends' : 'reqOut'] = (S.me[j.state === 'friends' ? 'friends' : 'reqOut'] || []).concat(id); toast(null, j.state === 'friends' ? 'You are friends now' : 'Request sent'); poll(); var sr = $('#sr'); if (sr) { var inp = $('#sq'); inp && inp.dispatchEvent(new Event('input')); } if ($('#pr')) openPerson(id); }).catch(function (x) { toast(null, x.message); }); }
  else if (k === 'accept') { api('POST', '/api/friend', { to: id }).then(function () { S.me.reqIn = (S.me.reqIn || []).filter(function (x) { return x !== id; }); S.me.friends = (S.me.friends || []).concat(id); S.resync = true; poll(); toast(null, 'You and ' + person(id).name.split(' ')[0] + ' are friends'); closeAll(); drawMain(); }).catch(function (x) { toast(null, x.message); }); }
  else if (k === 'decline') { api('POST', '/api/friend/decline', { to: id }).then(function () { S.me.reqIn = (S.me.reqIn || []).filter(function (x) { return x !== id; }); var nt = $('#nt'); if (nt) { nt.remove(); openNotifs(); } drawMain(); }).catch(function () {}); }
  else if (k === 'miniplay') { miniOpen = !miniOpen; miniSig = ''; paintMini(); }
  else if (k === 'miniset') { S.tab = 'me'; drawMain(); setTimeout(function () { var m = $('#ml'); if (m) { m.scrollIntoView({ block: 'center' }); m.focus(); } }, 50); }
  else if (k === 'invite') invite();
  else if (k === 'story') openStory(id, a.dataset.i);
  else if (k === 'compose') openCompose();
  else if (k === 'cbg') { C.bg = +a.dataset.i; C.img = null; $('#cv').style.backgroundImage = BG[C.bg]; document.querySelectorAll('.tools .c').forEach(function (b) { b.classList.toggle('on', b === a); }); }
  else if (k === 'ccam') $('#cf2').click(); else if (k === 'cgal') $('#cf').click();
  else if (k === 'stk') { if (C.stk.length >= 12) return; C.stk.push({ e: a.dataset.e, x: .5, y: .35 + Math.random() * .3, s: 1 }); C.sel = C.stk.length - 1; paintStk(); }
  else if (k === 'sbig') { if (C.sel > -1) { var q = C.stk[C.sel]; q.s = q.s >= 2.5 ? 1 : q.s + .5; paintStk(); } else toast(null, 'Tap a sticker first'); }
  else if (k === 'sdel') { if (C.sel > -1) { C.stk.splice(C.sel, 1); C.sel = -1; paintStk(); } else toast(null, 'Tap a sticker first'); }
  else if (k === 'post') { var t = ($('#ct').value || '').trim(); if (!t && !C.img && !C.stk.length) return toast(null, 'Add something first'); a.disabled = true; api('POST', '/api/story', { text: t, bg: C.bg, img: C.img || undefined, stickers: C.stk }).then(function (j) { S.stories[j.story.id] = j.story; closeTop(); toast(null, 'Your story is live'); drawMain(); }).catch(function (x) { a.disabled = false; toast(null, x.message); }); }
  else if (k === 'call') startCall(id, !!a.dataset.v);
  else if (k === 'pic') $('#pf').click();
  else if (k === 'npsave') { var song = $('#ms').value.trim(); if (!song) return toast(null, 'Add a song name'); api('POST', '/api/profile', { np: { song: song, artist: $('#ma').value.trim(), link: $('#ml').value.trim() } }).then(function (j) { S.me = j.me; S.people[S.me.id] = S.me; toast(null, 'Friends can see what you are playing'); miniOpen = true; miniSig = ''; var bd = $('#bd'); bd.innerHTML = meV(); }).catch(function (x) { toast(null, x.message); }); }
  else if (k === 'npclear') { api('POST', '/api/profile', { np: null }).then(function (j) { S.me = j.me; S.people[S.me.id] = S.me; $('#bd').innerHTML = meV(); }).catch(function () {}); }
  else if (k === 'socsave') { api('POST', '/api/profile', { soc: { wa: $('#s_wa').value, sc: $('#s_sc').value, ig: $('#s_ig').value, tt: $('#s_tt').value } }).then(function (j) { S.me = j.me; toast(null, 'Saved'); }).catch(function (x) { toast(null, x.message); }); }
  else if (k === 'contactsave') { api('POST', '/api/profile', { phone: $('#c_p').value, email: $('#c_e').value }).then(function (j) { S.me = j.me; toast(null, 'Saved'); }).catch(function (x) { toast(null, x.message); }); }
  else if (k === 'notifon') { if (window.Notification) Notification.requestPermission().then(function (p) { toast(null, p === 'granted' ? 'Alerts are on' : 'Alerts are off in your browser settings'); }); else toast(null, 'Not supported here'); }
  else if (k === 'theme') { var cur = LS.get('halo.theme') || 'auto', nx = { auto: 'light', light: 'dark', dark: 'auto' }[cur]; LS.set('halo.theme', nx); applyTheme(); toast(null, 'Look: ' + nx); }
  else if (k === 'showkey') { var kk = LS.get('halo.key'); sheet('<div class="bar"><button class="ic" data-a="close" aria-label="Back">' + I('back') + '</button><div class="nm"><b>My login key</b></div></div><div class="welcome"><p style="color:var(--mute);margin:0">Use this with your username to log in on another phone. Keep it private.</p><div class="key">' + esc(kk || 'Not saved on this phone') + '</div></div>'); }
  else if (k === 'logout') { sheet('<div class="bar"><button class="ic" data-a="close" aria-label="Back">' + I('back') + '</button><div class="nm"><b>Log out?</b></div></div><div class="welcome"><p style="color:var(--mute);margin:0">You will need your username and key to get back in. Make sure you have saved your key.</p><button class="cta" style="background:#d6372b" data-a="logout2">Log out</button><button class="cta ghost" data-a="close">Stay</button></div>'); }
  else if (k === 'logout2') { clearTimeout(pollT); closeAll(); logout(false); }
});
function closeAll() { app.querySelectorAll('.sheet').forEach(function (x) { x.remove(); }); S.view = null; }
app.addEventListener('input', function (e) { var t = e.target; if (t.id === 'ml') { var u = t.value.trim(); if (/^https:\/\/open\.spotify\.com\//.test(u)) { fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(u)).then(function (r) { return r.json(); }).then(function (j) { if (j && j.title && !$('#ms').value) $('#ms').value = j.title; }).catch(function () {}); } } });
var saveT; app.addEventListener('change', function (e) { var t = e.target;
  if (t.id === 'pn' || t.id === 'pb') { api('POST', '/api/profile', { name: $('#pn').value, bio: $('#pb').value }).then(function (j) { S.me = j.me; S.people[S.me.id] = S.me; }).catch(function (x) { toast(null, x.message); }); }
  if (t.id === 'pf' && t.files[0]) shrink(t.files[0], 320, .8, function (d) { if (d) api('POST', '/api/profile', { pic: d }).then(function (j) { S.me = j.me; S.people[S.me.id] = S.me; drawMain(); }).catch(function (x) { toast(null, x.message); }); });
  if (t.id === 'cph' && t.files[0] && S.view) shrink(t.files[0], 900, .72, function (d) { if (d) sendMsg(d); t.value = ''; });
  if ((t.id === 'cf' || t.id === 'cf2') && t.files[0]) shrink(t.files[0], 1000, .72, function (d) { if (d) { C.img = d; $('#cv').style.backgroundImage = 'url(' + d + ')'; } });
});
app.addEventListener('dblclick', function (e) { var b = e.target.closest('.b'); if (!b || !S.view) return; var m = chatList(S.view.chat).filter(function (x) { return x.id === b.dataset.id; })[0]; if (!m) return; var had = m.r && m.r[S.me.id]; api('POST', '/api/react', { id: m.id, e: had ? '' : '❤️' }).then(function () { m.r = m.r || {}; if (had) delete m.r[S.me.id]; else m.r[S.me.id] = '❤️'; paintThread(true); }).catch(function () {}); });
var tapT = 0; app.addEventListener('touchend', function (e) { var b = e.target.closest && e.target.closest('.b'); if (!b) return; var n = Date.now(); if (n - tapT < 320) { e.preventDefault(); b.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); tapT = 0; } else tapT = n; });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && app.querySelector('.sheet,.sv')) closeTop(); });
function applyTheme() { var t = LS.get('halo.theme') || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
/* ---------- boot ---------- */
applyTheme();
if (S.tok) { api('GET', '/api/sync?since=0').then(function (j) { S.first = true; merge(j); S.first = false; S.first = true; start(); }).catch(function (e) { if (e.status === 401) drawAuth(); else { drawAuth(); toast(null, 'Cannot reach Halo. Check your connection.'); } }); } else drawAuth();
})();
