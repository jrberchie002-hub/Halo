'use strict';
const crypto = require('crypto');
const push = require('./push');

module.exports = function makeApp(E, store) {
  const now = () => Date.now();
  const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
  const rnd = (n) => crypto.randomBytes(n).toString('hex');
  const out = (status, obj) => ({ status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(obj) });
  const err = (s, m, x) => out(s, Object.assign({ ok: false, error: m }, x || {}));
  const str = (x, n) => String(x == null ? '' : x).slice(0, n);
  const pair = (a, b) => [a, b].sort().join('|');
  const day = (t) => new Date(t).toISOString().slice(0, 10);
  const UN = /^[a-z0-9._]{3,20}$/;
  const normEmail = (e) => { e = String(e || '').trim().toLowerCase(); return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e) ? e : ''; };
  const normPhone = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.length === 10 && d[0] === '0') d = '233' + d.slice(1); return d.length >= 11 && d.length <= 15 ? d : ''; };
  const sbBase = String(E.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, ''), sbKey = String(E.SUPABASE_SERVICE_KEY || E.SUPABASE_SERVICE_ROLE_KEY || E.SUPABASE_KEY || '').trim();
  const okMedia = (s) => !!sbBase && typeof s === 'string' && s.length < 400 && s.indexOf(sbBase + '/storage/v1/object/public/halo-media/') === 0 && /^[\w:\/.\-]+$/.test(s);
  let bucketOk = false, iceCache = null;
  const okVid = (s, max) => okMedia(s) || typeof s === 'string' && s.length <= max && /^data:video\/(mp4|webm|quicktime|x-m4v)(;codecs=[\w.,-]+)?;base64,[A-Za-z0-9+/=]+$/.test(s);
  const okImg = (s, max) => typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= max;
  const hits = new Map();
  const cleanRe = (r) => r && typeof r === 'object' && r.id ? { id: str(r.id, 80), f: str(r.f, 30), x: str(r.x, 80) } : null;
  const limit = (k, n, ms) => { const t = now(), a = (hits.get(k) || []).filter(x => t - x < ms); a.push(t); hits.set(k, a); return a.length > n; };

  const pub = (u) => ({ id: u.id, username: u.username, name: u.name, bio: u.bio || '', pic: u.pic || null, np: u.np || null, vibe: u.vibe || null, soc: u.soc || {}, seen: u.seen || 0 });
  const slim = (u) => ({ id: u.id, username: u.username, name: u.name, pic: u.pic || null });
  const mine = (u) => Object.assign(pub(u), { phone: u.phone || '', email: u.email || '', friends: u.friends || [], reqIn: u.reqIn || [], reqOut: u.reqOut || [], hasPw: !!u.pw, reqNote: u.reqNote || {} });

  async function authed(req) {
    const h = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '');
    const t = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!t) return null;
    const rec = await store.get('tokens', sha(t)); if (!rec) return null;
    const u = await store.get('users', rec.uid); return u || null;
  }
  async function saveUser(u) { await store.put('users', u.id, u); }
  const jbody = (req) => { try { return req.body ? JSON.parse(req.body.toString('utf8')) : {}; } catch (e) { return null; } };
  const keyGen = () => { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; const b = crypto.randomBytes(16); for (let i = 0; i < 16; i++) { s += A[b[i] % A.length]; if (i % 4 === 3 && i < 15) s += '-'; } return s; };

  const pwHash = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
  const setPw = (u, pw) => { const salt = crypto.randomBytes(12).toString('hex'); u.pw = { s: salt, h: pwHash(pw, salt) }; };
  const okPw = (u, pw) => { if (!u.pw || !pw) return false; try { return crypto.timingSafeEqual(Buffer.from(pwHash(pw, u.pw.s), 'hex'), Buffer.from(u.pw.h, 'hex')); } catch (e) { return false; } };
  async function issue(u) { const tok = rnd(24); await store.put('tokens', sha(tok), { uid: u.id, t: now() }); return tok; }

  async function areFriends(a, b) { const u = await store.get('users', a); return !!(u && (u.friends || []).includes(b)); }

  async function handle(req) {
    const p = req.path, m = req.method, q = req.query || {};
    if (m === 'OPTIONS') return { status: 204, headers: {}, body: '' };
    if (p === '/api/spotify/list') { const key = sha('halo-admin' + (E.SPOTIFY_CLIENT_ID || 'b737681bd4c242b683b574237cb06895')).slice(0, 12); if (q.k !== key) return err(403, 'No'); const rows = (await store.list('spreq')).map(r => r.data).sort((a, b) => a.t - b.t); return { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, body: rows.length ? rows.map(r => r.email + '   (@' + r.username + ')').join('\n') : 'No requests yet' }; }
    if (p === '/api/ice') {
      if (!(await authed(req))) return out(401, { ok: false, code: 'auth', error: 'Sign in first' });
      const stun = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
      if (E.TURN_URL && E.TURN_USER) { const urls = String(E.TURN_URL).split(',').map(x => x.trim()).filter(Boolean); return out(200, { ok: true, relay: true, servers: stun.concat([{ urls, username: E.TURN_USER, credential: E.TURN_PASS || '' }]) }); }
      if (E.METERED_APP && E.METERED_KEY) { try { if (!iceCache || now() - iceCache.t > 36e5) { const r = await fetch('https://' + E.METERED_APP + '.metered.live/api/v1/turn/credentials?apiKey=' + encodeURIComponent(E.METERED_KEY)), j = await r.json(); if (Array.isArray(j) && j.length) iceCache = { t: now(), s: j }; } if (iceCache) return out(200, { ok: true, relay: true, servers: iceCache.s }); } catch (e) {} }
      return out(200, { ok: true, relay: false, servers: [] });
    }
    if (p === '/api/version') return out(200, { ok: true, v: String(E.VERCEL_GIT_COMMIT_SHA || E.VERCEL_DEPLOYMENT_ID || 'dev').slice(0, 20) });
    if (p === '/api/config') return out(200, { ok: true, spotify: String(E.SPOTIFY_CLIENT_ID || 'b737681bd4c242b683b574237cb06895').trim() || null });
    if (p === '/api/health') { let db = 'ok'; try { await store.get('health', 'x'); } catch (e) { db = String(e.message || e).replace(/eyJ[\w.-]+|sb_[\w-]+/g, '***').slice(0, 200); } return out(200, { ok: db === 'ok', store: store.kind, db }); }
    const body = m === 'POST' ? jbody(req) : {};
    if (body === null) return err(400, 'Bad request');

    if (p === '/api/check' && m === 'GET') { const u = String(q.u || '').toLowerCase(); if (!UN.test(u)) return out(200, { ok: true, free: false, why: 'Use 3 to 20 letters, numbers, dots or underscores' }); return out(200, { ok: true, free: !(await store.get('names', u)) }); }

    if (p === '/api/signup' && m === 'POST') {
      if (limit('su' + (req.headers && req.headers['x-forwarded-for'] || ''), 60, 36e5)) return err(429, 'Too many tries from here. Wait a few minutes.');
      const username = str(body.username, 30).trim().toLowerCase().replace(/^@/, ''), name = str(body.name, 30).trim();
      if (name.length < 1) return err(400, 'Tell us your name');
      if (!UN.test(username)) return err(400, 'Username: 3 to 20 letters, numbers, dots or underscores');
      if (await store.get('names', username)) return err(409, 'That username is taken');
      const phone = normPhone(body.phone), email = normEmail(body.email);
      const id = 'u' + rnd(6), key = keyGen();
      const u = { id, username, name, bio: '', pic: okImg(body.pic, 160000) ? body.pic : null, phone, email, np: null, soc: {}, friends: [], reqIn: [], reqOut: [], keyHash: sha(key), created: now(), seen: now() };
      if (typeof body.password === 'string' && body.password.length >= 4) setPw(u, body.password.slice(0, 64));
      await store.put('names', username, { uid: id }); await saveUser(u);
      const token = await issue(u);
      return out(200, { ok: true, token, key, me: mine(u) });
    }
    if (p === '/api/handoff/use' && m === 'POST') {
      if (limit('ho' + (req.headers && req.headers['x-forwarded-for'] || ''), 12, 6e4)) return err(429, 'Too many tries. Wait a minute.');
      const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), h = code.length === 8 && await store.get('handoff', code);
      if (!h || h.exp < now()) return err(401, 'That code is wrong or expired. Make a new one in Safari.');
      const u = await store.get('users', h.uid); if (!u) return err(404, 'Not found');
      await store.del('handoff', code); return out(200, { ok: true, token: await issue(u), me: mine(u) });
    }
    if (p === '/api/login' && m === 'POST') {
      const username = str(body.username, 30).trim().toLowerCase().replace(/^@/, '');
      if (limit('lg' + username, 8, 6e5)) return err(429, 'Too many tries. Wait a few minutes.');
      const n = await store.get('names', username), u = n && await store.get('users', n.uid);
      const key = String(body.key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const fmt = key.replace(/(.{4})(?=.)/g, '$1-');
      if (!u || !(okPw(u, String(body.key || '')) || sha(fmt) === u.keyHash)) return err(401, 'That username and password do not match');
      return out(200, { ok: true, token: await issue(u), me: mine(u) });
    }

    const me = await authed(req);
    if (!me) return err(401, 'Please sign in', { code: 'auth' });
    if (now() - (me.seen || 0) > 30000) { me.seen = now(); await saveUser(me); }

    if (p === '/api/sync' && m === 'GET') {
      const since = Math.max(0, +q.since || 0);
      const fresh = await store.get('users', me.id); Object.assign(me, fresh);
      const ids = new Set([me.id].concat(me.friends || [], me.reqIn || [], me.reqOut || []));
      const people = []; for (const id of ids) { const u = id === me.id ? me : await store.get('users', id); if (u) people.push(id === me.id ? mine(u) : ((me.friends || []).includes(id) ? pub(u) : slim(u))); }
      const rows = await store.since(since, ['chats', 'msgs', 'stories', 'calls', 'ice', 'typing', 'ranks', 'rmsgs']);
      const fr = new Set(me.friends || []), t = now(), keep = [], rankMem = {};
      let stamp = since;
      for (const r of rows) {
        if (r.u > stamp) stamp = r.u; const d = r.data;
        if (r.c === 'chats') { if (r.id.split('|').includes(me.id)) keep.push(r); }
        else if (r.c === 'msgs') { if (d.chat && d.chat.split('|').includes(me.id)) keep.push(r); }
        else if (r.c === 'stories') { if ((d.uid === me.id || fr.has(d.uid)) && t - d.t < 864e5) keep.push(r); }
        else if (r.c === 'calls') { if ((d.from === me.id || d.to === me.id) && t - d.t < 36e5) keep.push(r); }
        else if (r.c === 'ice') { if ((d.from === me.id || d.to === me.id) && t - d.t < 36e5) keep.push(r); }
        else if (r.c === 'ranks') { if ((d.members || []).includes(me.id)) keep.push(r); }
        else if (r.c === 'rmsgs') { if (rankMem[d.rank] === undefined) { const rk = await store.get('ranks', d.rank); rankMem[d.rank] = rk ? rk.members : []; } if (rankMem[d.rank].includes(me.id)) keep.push(r); }
        else if (r.c === 'typing') { if (d.to === me.id && t - d.t < 6000) keep.push(r); }
      }
      return out(200, { ok: true, rows: keep, people, me: mine(me), stamp, now: t });
    }

    if (p === '/api/profile' && m === 'POST') {
      const u = await store.get('users', me.id);
      if (body.name != null) { const n = str(body.name, 30).trim(); if (n) u.name = n; }
      if (body.bio != null) u.bio = str(body.bio, 80);
      if (body.pic !== undefined) { if (body.pic === null) u.pic = null; else if (okImg(body.pic, 160000)) u.pic = body.pic; else return err(400, 'Photo is too large'); }
      if (body.soc) u.soc = { wa: normPhone(body.soc.wa) || str(body.soc.wa, 20).replace(/[^\d+ ]/g, ''), sc: str(body.soc.sc, 30).replace(/^@/, ''), ig: str(body.soc.ig, 30).replace(/^@/, ''), tt: str(body.soc.tt, 30).replace(/^@/, '') };
      if (body.np !== undefined) { if (!body.np || !body.np.song) u.np = null; else { const link = /^https:\/\//.test(body.np.link || '') ? str(body.np.link, 300) : ''; u.np = { song: str(body.np.song, 60), artist: str(body.np.artist, 50), link, t: now() }; const pv = String(body.np.prev || ''), ar = String(body.np.art || ''); if (/^https:\/\/[\w.-]+\.(mzstatic|itunes\.apple)\.com\/[\w\-./%?=&~+]{5,300}$/.test(pv)) u.np.prev = pv; if (/^https:\/\/[\w.-]+\.mzstatic\.com\/[\w\-./%?=&~+]{5,300}$/.test(ar)) u.np.art = ar; } }
      if (body.vibe !== undefined) { if (!body.vibe || !body.vibe.e) u.vibe = null; else u.vibe = { e: str(body.vibe.e, 8), t: str(body.vibe.t, 28), at: now() }; }
      if (body.phone !== undefined) u.phone = normPhone(body.phone);
      if (body.email !== undefined) u.email = normEmail(body.email);
      await saveUser(u); return out(200, { ok: true, me: mine(u) });
    }

    if (p === '/api/search' && m === 'GET') {
      const s = String(q.q || '').trim().toLowerCase().replace(/^@/, ''); if (s.length < 2 && !q.all) return out(200, { ok: true, users: [] });
      if (q.all && !s) { const al = (await store.list('users')).map(r => r.data).filter(u => u.id !== me.id).sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, 20).map(slim); return out(200, { ok: true, users: al }); }
      const ph = normPhone(s), em = normEmail(s), users = (await store.list('users')).map(r => r.data);
      const res = users.filter(u => u.id !== me.id && (u.username.includes(s) || u.name.toLowerCase().includes(s) || (ph && u.phone === ph) || (em && u.email === em))).slice(0, 20).map(slim);
      return out(200, { ok: true, users: res });
    }

    if (p === '/api/friend' && m === 'POST') {
      const to = str(body.to, 30); if (to === me.id) return err(400, 'That is you');
      const other = await store.get('users', to); if (!other) return err(404, 'Not found');
      const u = await store.get('users', me.id);
      const has = (a, x) => (a || []).includes(x), rm = (a, x) => (a || []).filter(y => y !== x);
      if (has(u.friends, to)) return out(200, { ok: true, state: 'friends' });
      if (has(u.reqIn, to)) { u.reqIn = rm(u.reqIn, to); other.reqOut = rm(other.reqOut, me.id); u.friends = (u.friends || []).concat(to); other.friends = (other.friends || []).concat(me.id); await saveUser(u); await saveUser(other); const cid = pair(me.id, to); if (!(await store.get('chats', cid))) await store.put('chats', cid, { id: cid, a: me.id, b: to, streak: 0, streakDay: '', days: {}, r: {}, last: now() }); const nt = u.reqNote && u.reqNote[to]; if (nt) { const mid = 'm' + rnd(8); await store.put('msgs', mid, { id: mid, chat: cid, from: to, t: now(), x: nt, img: null }); delete u.reqNote[to]; await saveUser(u); } try { await Promise.race([push.notify(store, to, { title: u.name, body: 'accepted your friend request', tag: 'fa' + me.id, url: '/' }), new Promise(r => setTimeout(r, 1500))]); } catch (e) {} return out(200, { ok: true, state: 'friends' }); }
      if (!has(u.reqOut, to)) { if (limit('fr' + me.id, 30, 36e5)) return err(429, 'Slow down a little'); u.reqOut = (u.reqOut || []).concat(to); other.reqIn = (other.reqIn || []).concat(me.id); const note = str(body.note, 120).trim(); if (note) { other.reqNote = Object.assign({}, other.reqNote, { [me.id]: note }); } await saveUser(u); await saveUser(other); try { await Promise.race([push.notify(store, to, { title: me.name, body: note ? 'wants to be your friend: ' + note : 'wants to be your friend on Halo', tag: 'fr' + me.id, url: '/' }), new Promise(r => setTimeout(r, 1500))]); } catch (e) {} }
      return out(200, { ok: true, state: 'sent' });
    }
    if (p === '/api/unfriend' && m === 'POST') {
      const to = str(body.to, 30), u = await store.get('users', me.id), other = await store.get('users', to); if (!other) return err(404, 'Not found');
      const rm = (a, x) => (a || []).filter(y => y !== x); u.friends = rm(u.friends, to); other.friends = rm(other.friends, me.id); u.reqIn = rm(u.reqIn, to); u.reqOut = rm(u.reqOut, to); other.reqIn = rm(other.reqIn, me.id); other.reqOut = rm(other.reqOut, me.id);
      await saveUser(u); await saveUser(other); return out(200, { ok: true });
    }
    if (p === '/api/friend/decline' && m === 'POST') {
      const to = str(body.to, 30), u = await store.get('users', me.id), other = await store.get('users', to); if (!other) return err(404, 'Not found');
      const rm = (a, x) => (a || []).filter(y => y !== x); u.reqIn = rm(u.reqIn, to); u.reqOut = rm(u.reqOut, to); other.reqOut = rm(other.reqOut, me.id); other.reqIn = rm(other.reqIn, me.id); await saveUser(u); await saveUser(other); return out(200, { ok: true });
    }

    if (p === '/api/upload' && m === 'POST') {
      if (!sbBase || !sbKey) return err(503, 'Big files are not set up yet');
      const ext = { aud: ['webm', 'ogg', 'm4a', 'mp4', 'mp3', 'wav'], vid: ['mp4', 'webm', 'mov'] }, kind = body.kind === 'aud' ? 'aud' : 'vid', e = String(body.ext || '').toLowerCase(), x = ext[kind].includes(e) ? e : ext[kind][0];
      const H = { apikey: sbKey, Authorization: 'Bearer ' + sbKey, 'Content-Type': 'application/json' };
      if (!bucketOk) { try { await fetch(sbBase + '/storage/v1/bucket', { method: 'POST', headers: H, body: JSON.stringify({ id: 'halo-media', name: 'halo-media', public: true, file_size_limit: 52428800 }) }); } catch (_) {} bucketOk = true; }
      const path = me.id + '/' + rnd(10) + '.' + x;
      const r = await fetch(sbBase + '/storage/v1/object/upload/sign/halo-media/' + path, { method: 'POST', headers: H, body: '{}' }), j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) return err(502, 'Could not start the upload');
      return out(200, { ok: true, up: sbBase + '/storage/v1' + j.url, url: sbBase + '/storage/v1/object/public/halo-media/' + path });
    }
    if (p === '/api/password' && m === 'POST') {
      const pw = String(body.password || ''); if (pw.length < 4 || pw.length > 64) return err(400, 'Use at least 4 characters');
      const u = await store.get('users', me.id); setPw(u, pw); await store.put('users', u.id, u); return out(200, { ok: true });
    }
    if (p === '/api/spotify/request' && m === 'POST') {
      const em = normEmail(String(body.email || '')); if (!em) return err(400, 'That does not look like an email');
      await store.put('spreq', me.id, { uid: me.id, username: me.username, email: em, t: now() }); return out(200, { ok: true });
    }
    if (p === '/api/handoff' && m === 'POST') {
      if (limit('hc' + me.id, 10, 6e5)) return err(429, 'Too many codes. Wait a few minutes.');
      const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = ''; const b = crypto.randomBytes(8); for (let i = 0; i < 8; i++) code += A[b[i] % A.length];
      await store.put('handoff', code, { uid: me.id, exp: now() + 10 * 60 * 1000 }); return out(200, { ok: true, code: code.slice(0, 4) + '-' + code.slice(4) });
    }
    if (p === '/api/send' && m === 'POST') {
      const ck = /^[a-z0-9]{8,24}$/.test(String(body.ck || '')) ? me.id + body.ck : ''; if (ck) { const dup = await store.get('sendkeys', ck); if (dup) return out(200, { ok: true, msg: dup.msg }); }
      const to = str(body.to, 30), x = str(body.x, 2000).trim(), img = body.img ? (okImg(body.img, 420000) ? body.img : null) : null;
      const okAud = (a) => okMedia(a) || typeof a === 'string' && a.length <= 3300000 && /^data:audio\/(webm|ogg|mp4|mpeg|aac|x-m4a|wav)(;codecs=[\w.,-]+)?;base64,[A-Za-z0-9+/=]+$/.test(a);
      const aud = body.aud && okAud(body.aud) ? body.aud : null, dur = aud ? Math.max(1, Math.min(90, Math.round(+body.dur || 1))) : 0;
      const wave = aud && Array.isArray(body.wave) ? body.wave.slice(0, 48).map(n => Math.max(2, Math.min(100, Math.round(+n || 2)))) : null;
      const GIFTS = ['rose', 'crown', 'fire', 'trophy', 'cake', 'heart', 'diamond', 'rocket'];
      const hi = body.wave === 1 && body.sticker === '👋' ? 1 : 0, gift = GIFTS.includes(body.gift) ? body.gift : null, sticker = typeof body.sticker === 'string' && body.sticker.length <= 8 && body.sticker ? body.sticker : null;
      const gif = typeof body.gif === 'string' && /^https:\/\/(media\d*|i)\.giphy\.com\/[\w\-./%?=&]{5,300}$/.test(body.gif) ? body.gif : null, stk = img && body.stk ? 1 : 0;
      const vid = body.vid && okVid(body.vid, 3000000) ? body.vid : null;
      if (!x && !img && !aud && !gift && !sticker && !gif && !vid) return err(400, 'Nothing to send');
      if (!(await areFriends(me.id, to))) return err(403, 'You can only message friends');
      if (limit('sd' + me.id, 40, 10000)) return err(429, 'Slow down a little');
      const cid = pair(me.id, to), t = now();
      const chat = (await store.get('chats', cid)) || { id: cid, a: me.id, b: to, streak: 0, streakDay: '', days: {}, r: {} };
      chat.days = chat.days || {}; chat.days[me.id] = day(t); chat.last = t;
      const D = day(t), y = day(t - 864e5);
      if (chat.days[chat.a] === D && chat.days[chat.b] === D && chat.streakDay !== D) { chat.streak = (chat.streakDay === y ? (chat.streak || 0) : 0) + 1; chat.streakDay = D; }
      chat.r = chat.r || {}; chat.r[me.id] = t;
      await store.put('chats', cid, chat);
      const mid = cid + '~' + String(t).padStart(14, '0') + rnd(2);
      const msg = { id: mid, chat: cid, from: me.id, t, x, img }; const re = cleanRe(body.re); if (re) msg.re = re;
      if (aud) { msg.aud = aud; msg.dur = dur; msg.wave = wave; } if (gift) msg.gift = gift; if (sticker) msg.sticker = sticker; if (gif) msg.gif = gif; if (stk) msg.stk = 1; if (vid) msg.vid = vid;
      await store.put('msgs', mid, msg); if (ck) await store.put('sendkeys', ck, { msg, t: now() });
      const txt = hi ? 'waved at you 👋' : vid ? '🎥 Video' : aud ? '🎤 Voice note' : gift ? '🎁 Sent you a gift' : sticker ? sticker + ' Sticker' : gif ? 'GIF' : x ? x.slice(0, 100) : stk ? 'Sticker' : '📷 Photo';
      try { await Promise.race([push.notify(store, to, { title: me.name, body: txt, tag: 'm' + me.id, url: '/', kind: 'msg', from: me.id }), new Promise(r => setTimeout(r, 1500))]); } catch (e) {}
      return out(200, { ok: true, msg });
    }
    if (p === '/api/read' && m === 'POST') {
      const cid = str(body.chat, 70); if (!cid.split('|').includes(me.id)) return err(403, 'No');
      const chat = await store.get('chats', cid); if (!chat) return err(404, 'No chat');
      chat.r = chat.r || {}; chat.r[me.id] = now(); await store.put('chats', cid, chat); return out(200, { ok: true });
    }
    if (p === '/api/chatwp' && m === 'POST') {
      const to = str(body.to, 30); if (!(await areFriends(me.id, to))) return err(403, 'No');
      const w = typeof body.wp === 'string' ? body.wp : '';
      const ok = w === '' || /^(halo2|pat:\d{1,2})$/.test(w) || /^#[0-9a-f]{6}$/i.test(w) || /^linear-gradient\(160deg,#[0-9a-f]{6},#[0-9a-f]{6}\)$/i.test(w) || (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(w) && w.length < 200000);
      if (!ok) return err(400, 'That wallpaper is not allowed');
      const cid = pair(me.id, to); let c = await store.get('chats', cid) || { id: cid, a: me.id, b: to, streak: 0, streakDay: '', days: {}, r: {}, last: now() };
      c.wp = w; c.wpBy = me.id; c.wpT = now(); await store.put('chats', cid, c); return out(200, { ok: true, chat: c });
    }
    if (p === '/api/typing' && m === 'POST') {
      const to = str(body.to, 30); if (!(await areFriends(me.id, to))) return err(403, 'No');
      await store.put('typing', pair(me.id, to) + '~' + me.id, { from: me.id, to, t: now() }); return out(200, { ok: true });
    }
    if (p === '/api/react' && m === 'POST') {
      const msg = await store.get('msgs', str(body.id, 120)); if (!msg || !msg.chat.split('|').includes(me.id)) return err(404, 'No message');
      msg.r = msg.r || {}; const e = str(body.e, 4); if (e) msg.r[me.id] = e; else delete msg.r[me.id]; await store.put('msgs', msg.id, msg); return out(200, { ok: true });
    }

    if (p === '/api/story' && m === 'POST') {
      const text = str(body.text, 120), img = body.img ? (okImg(body.img, 480000) ? body.img : null) : null;
      const vid = body.vid && okVid(body.vid, 3000000) ? body.vid : null;
      const aud = body.aud && okMedia(body.aud) ? body.aud : body.aud && /^data:audio\/[a-z0-9.+-]+(;[a-z0-9=.+-]+)*;base64,/i.test(body.aud) && body.aud.length < 420000 ? body.aud : null;
      if (!text && !img && !vid && !aud && !(body.stickers || []).length) return err(400, 'Add something first');
      const st = (Array.isArray(body.stickers) ? body.stickers : []).slice(0, 12).map(s => ({ e: str(s.e, 8), x: Math.max(0, Math.min(1, +s.x || .5)), y: Math.max(0, Math.min(1, +s.y || .5)), s: Math.max(.5, Math.min(3, +s.s || 1)) }));
      const id = 's' + rnd(6), s = { id, uid: me.id, t: now(), bg: Math.max(0, Math.min(7, +body.bg | 0)), text, img, vid, aud, adur: aud ? Math.min(30, +body.adur || 0) : 0, fs: Math.max(0, Math.min(72, +body.fs || 0)), ff: Math.max(0, Math.min(3, +body.ff | 0)), stickers: st, views: [] };
      await store.put('stories', id, s); return out(200, { ok: true, story: s });
    }
    if (p === '/api/story/view' && m === 'POST') {
      const s = await store.get('stories', str(body.id, 30)); if (!s) return err(404, 'Gone');
      if (s.uid !== me.id && !(me.friends || []).includes(s.uid)) return err(403, 'No');
      if (!s.views.includes(me.id) && s.uid !== me.id) { s.views.push(me.id); await store.put('stories', s.id, s); } return out(200, { ok: true });
    }
    if (p === '/api/story/delete' && m === 'POST') {
      const s = await store.get('stories', str(body.id, 30)); if (!s || s.uid !== me.id) return err(404, 'No');
      await store.del('stories', s.id); s.t = 0; await store.put('stories', s.id, s); return out(200, { ok: true });
    }

    if (p === '/api/key/new' && m === 'POST') {
      if (limit('kn' + me.id, 5, 36e5)) return err(429, 'Too many tries. Wait a bit.');
      const u = await store.get('users', me.id), key = keyGen(); u.keyHash = sha(key); await saveUser(u); return out(200, { ok: true, key });
    }
    if (p === '/api/push/key' && m === 'GET') { const v = await push.vapid(store); return out(200, { ok: true, key: v.pub }); }
    if (p === '/api/push/test' && m === 'POST') {
      let sent = 0; try { sent = await push.notify(store, me.id, { title: 'Halo', body: 'Notifications are working', tag: 'test', url: '/' }); } catch (e) {}
      return out(200, { ok: true, sent });
    }
    if (p === '/api/push/sub' && m === 'POST') {
      const sub = body.sub; if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return err(400, 'Bad subscription');
      const rec = (await store.get('push', me.id)) || { subs: [] }; rec.subs = rec.subs.filter(x => x.endpoint !== sub.endpoint).concat([{ endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } }]).slice(-5);
      await store.put('push', me.id, rec); return out(200, { ok: true });
    }
    if (p === '/api/gif' && m === 'GET') {
      const key = E.GIPHY_KEY || E.GIPHY_API_KEY; if (!key) return err(503, 'GIFs are not switched on yet', { code: 'nogif' });
      const qq = String(q.q || '').trim().slice(0, 60), url = 'https://api.giphy.com/v1/gifs/' + (qq ? 'search?q=' + encodeURIComponent(qq) + '&' : 'trending?') + 'api_key=' + encodeURIComponent(key) + '&limit=24&rating=pg-13';
      try { const r = await fetch(url), j = await r.json(); if (!r.ok) return err(502, 'GIF search is busy, try again'); return out(200, { ok: true, gifs: (j.data || []).map(g => ({ id: g.id, small: g.images && g.images.fixed_height_small && g.images.fixed_height_small.url, url: g.images && g.images.fixed_height && g.images.fixed_height.url })).filter(g => g.small && g.url) }); } catch (e) { return err(502, 'Could not reach GIPHY'); }
    }

    const rankOf = async (id) => { const r = await store.get('ranks', str(id, 20)); return r && (r.members || []).includes(me.id) ? r : null; };
    const tally = (r) => { const n = r.members.length, cnt = {}; for (const v of Object.keys(r.votes || {})) { if (!r.members.includes(v) || !r.members.includes(r.votes[v])) { delete r.votes[v]; continue; } cnt[r.votes[v]] = (cnt[r.votes[v]] || 0) + 1; } for (const k of Object.keys(cnt)) if (cnt[k] > n / 2 && k !== r.leader) { r.leader = k; r.votes = {}; r.ledAt = now(); return k; } return null; };
    if (p === '/api/rank' && m === 'POST') {
      const name = str(body.name, 30).trim(); if (!name) return err(400, 'Give your rank a name');
      const mem = [me.id]; for (const f of (Array.isArray(body.members) ? body.members : []).slice(0, 49)) { const id = str(f, 30); if (!mem.includes(id) && (me.friends || []).includes(id)) mem.push(id); }
      if (limit('rk' + me.id, 6, 60000)) return err(429, 'Slow down a little');
      const id = 'r' + rnd(6), r = { id, name, emoji: str(body.emoji, 8) || '👑', leader: me.id, creator: me.id, members: mem, votes: {}, t: now(), last: now(), streak: 0, streakDay: '', days: {} };
      await store.put('ranks', id, r);
      for (const to of mem.filter(x => x !== me.id)) { try { await Promise.race([push.notify(store, to, { title: name, body: me.name + ' added you to a rank', tag: 'rk' + id, url: '/', kind: 'msg', from: me.id }), new Promise(x => setTimeout(x, 800))]); } catch (e) {} }
      return out(200, { ok: true, rank: r });
    }
    if (p === '/api/rank/send' && m === 'POST') {
      const r = await rankOf(body.id); if (!r) return err(404, 'No such rank');
      const ck = /^[a-z0-9]{8,24}$/.test(String(body.ck || '')) ? me.id + body.ck : ''; if (ck) { const dup = await store.get('sendkeys', ck); if (dup) return out(200, { ok: true, msg: dup.msg }); }
      const x = str(body.x, 2000).trim(), img = body.img ? (okImg(body.img, 420000) ? body.img : null) : null, sticker = typeof body.sticker === 'string' && body.sticker.length <= 8 && body.sticker ? body.sticker : null;
      if (!x && !img && !sticker) return err(400, 'Nothing to send');
      if (limit('rs' + me.id, 40, 10000)) return err(429, 'Slow down a little');
      const t = now(), D = day(t), y = day(t - 864e5); r.days = r.days || {}; r.days[me.id] = D; r.last = t;
      if (r.members.every(u => r.days[u] === D) && r.streakDay !== D) { r.streak = (r.streakDay === y ? (r.streak || 0) : 0) + 1; r.streakDay = D; }
      await store.put('ranks', r.id, r);
      const mid = r.id + '~' + String(t).padStart(14, '0') + rnd(2), msg = { id: mid, rank: r.id, from: me.id, t, x, img }; if (sticker) msg.sticker = sticker; const re = cleanRe(body.re); if (re) msg.re = re;
      await store.put('rmsgs', mid, msg); if (ck) await store.put('sendkeys', ck, { msg, t: now() });
      const txt = me.name.split(' ')[0] + ': ' + (x ? x.slice(0, 90) : sticker ? sticker : '📷 Photo');
      for (const to of r.members.filter(u => u !== me.id)) { try { await Promise.race([push.notify(store, to, { title: r.name, body: txt, tag: 'rk' + r.id, url: '/', kind: 'msg', from: me.id }), new Promise(z => setTimeout(z, 700))]); } catch (e) {} }
      return out(200, { ok: true, msg });
    }
    if (p === '/api/rank/vote' && m === 'POST') {
      const r = await rankOf(body.id); if (!r) return err(404, 'No such rank');
      const c = body.for ? str(body.for, 30) : ''; r.votes = r.votes || {};
      if (!c) delete r.votes[me.id]; else { if (!r.members.includes(c)) return err(400, 'Not in this rank'); r.votes[me.id] = c; }
      const won = tally(r); await store.put('ranks', r.id, r);
      if (won) { const mid = r.id + '~' + String(now()).padStart(14, '0') + rnd(2); await store.put('rmsgs', mid, { id: mid, rank: r.id, from: '', sys: 1, t: now(), x: '👑 ' + ((await store.get('users', won)) || {}).name + ' is the new rank leader' }); }
      return out(200, { ok: true, rank: r, won: won || null });
    }
    if (p === '/api/rank/add' && m === 'POST') {
      const r = await rankOf(body.id); if (!r) return err(404, 'No such rank'); if (r.leader !== me.id) return err(403, 'Only the rank leader can add people');
      let n = 0; for (const f of (Array.isArray(body.members) ? body.members : []).slice(0, 20)) { const id = str(f, 30); if (!r.members.includes(id) && r.members.length < 50 && (me.friends || []).includes(id)) { r.members.push(id); n++; } }
      if (n) await store.put('ranks', r.id, r); return out(200, { ok: true, rank: r });
    }
    if (p === '/api/rank/kick' && m === 'POST') {
      const r = await rankOf(body.id); if (!r) return err(404, 'No such rank'); if (r.leader !== me.id) return err(403, 'Only the rank leader can remove people');
      const u = str(body.user, 30); if (u === me.id || !r.members.includes(u)) return err(400, 'Cannot remove that person');
      r.members = r.members.filter(x => x !== u); delete r.votes[u]; await store.put('ranks', r.id, r); return out(200, { ok: true, rank: r });
    }
    if (p === '/api/rank/edit' && m === 'POST') {
      const r = await rankOf(body.id); if (!r) return err(404, 'No such rank'); if (r.leader !== me.id) return err(403, 'Only the rank leader can change this');
      if (body.name != null) { const n = str(body.name, 30).trim(); if (n) r.name = n; } if (body.emoji != null) r.emoji = str(body.emoji, 8) || r.emoji;
      await store.put('ranks', r.id, r); return out(200, { ok: true, rank: r });
    }
    if (p === '/api/rank/leave' && m === 'POST') {
      const r = await rankOf(body.id); if (!r) return err(404, 'No such rank');
      r.members = r.members.filter(x => x !== me.id); delete r.votes[me.id];
      if (!r.members.length) { await store.put('ranks', r.id, r); return out(200, { ok: true }); }
      if (r.leader === me.id) { r.leader = r.members[0]; r.votes = {}; r.ledAt = now(); }
      await store.put('ranks', r.id, r); return out(200, { ok: true });
    }
    if ((p === '/api/msg/edit' || p === '/api/msg/del') && m === 'POST') {
      const rk = !!body.rank, col = rk ? 'rmsgs' : 'msgs', msg = await store.get(col, str(body.id, 120)); if (!msg || msg.from !== me.id) return err(404, 'No message');
      if (rk) { if (!(await rankOf(msg.rank))) return err(404, 'No message'); } else if (!msg.chat.split('|').includes(me.id)) return err(404, 'No message');
      if (p === '/api/msg/del') { for (const k of ['img', 'vid', 'aud', 'wave', 'gif', 'gift', 'sticker', 'stk', 'r', 're', 'dur', 'ed']) delete msg[k]; msg.x = '🚫 Message deleted'; msg.del = 1; }
      else { if (msg.del || !msg.x) return err(400, 'Cannot edit this'); if (now() - msg.t > 35000) return err(400, 'Too late to edit. You can edit for 30 seconds'); const x = str(body.x, 2000).trim(); if (!x) return err(400, 'Message is empty'); msg.x = x; msg.ed = now(); }
      await store.put(col, msg.id, msg); return out(200, { ok: true, msg });
    }
    if (p === '/api/call' && m === 'POST') {
      const to = str(body.to, 30); if (!(await areFriends(me.id, to))) return err(403, 'You can only call friends');
      const id = 'c' + rnd(6), c = { id, from: me.id, to, kind: body.video ? 'video' : 'voice', offer: str(body.offer, 12000), answer: '', state: 'ringing', t: now() };
      await store.put('calls', id, c); try { await Promise.race([push.notify(store, to, { title: me.name, body: (c.kind === 'video' ? 'Video calling you' : 'Calling you') + ' on Halo', tag: 'call' + id, url: '/', kind: 'call', from: me.id }), new Promise(r => setTimeout(r, 1500))]); } catch (e) {}
      return out(200, { ok: true, call: c });
    }
    if (p === '/api/call/answer' && m === 'POST') {
      const c = await store.get('calls', str(body.id, 20)); if (!c || c.to !== me.id) return err(404, 'No call');
      if (body.decline) c.state = 'ended'; else { c.answer = str(body.answer, 12000); c.state = 'live'; c.t0 = now(); }
      await store.put('calls', c.id, c); return out(200, { ok: true });
    }
    if (p === '/api/call/ice' && m === 'POST') {
      const c = await store.get('calls', str(body.id, 20)); if (!c || (c.from !== me.id && c.to !== me.id)) return err(404, 'No call');
      const id = c.id + '~' + rnd(4); await store.put('ice', id, { call: c.id, from: me.id, to: c.from === me.id ? c.to : c.from, cand: str(body.cand, 1200), t: now() }); return out(200, { ok: true });
    }
    if (p === '/api/call/end' && m === 'POST') {
      const c = await store.get('calls', str(body.id, 20)); if (!c || (c.from !== me.id && c.to !== me.id)) return err(404, 'No call');
      if (c.state !== 'ended') { c.state = 'ended'; c.end = now(); c.endBy = me.id; c.missed = !c.t0; await store.put('calls', c.id, c); }
      return out(200, { ok: true });
    }
    return err(404, 'Not found');
  }
  return { handle };
};
