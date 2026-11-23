const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3197); const B = 'http://localhost:3197'; const c = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, ...(await r.json().catch(() => ({}))) }; }; const ck = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const aud = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
 await c(a.token, 'POST', '/api/send', { to: h.me.id, x: 'how Halo chat works', ck: 'aaaaaaaa1' }); await c(a.token, 'POST', '/api/send', { to: h.me.id, aud, ck: 'aaaaaaaa2' });
 for (let i = 0; i < 9; i++) { await c((i % 2 ? a : h).token, 'POST', '/api/send', { to: (i % 2 ? h : a).me.id, x: 'msg ' + i, ck: 'bbbbbbb' + i + 'x' }); }
 const count = async (u, o) => { const s = await c(u.token, 'GET', '/api/sync?since=0'); return (s.msgs || s.rows || []).length || Object.values(s.chats || {}).length; };
 const s1 = await c(a.token, 'GET', '/api/sync?since=0'); console.log('sync keys', Object.keys(s1).join(','));
 const cid = [a.me.id, h.me.id].sort().join('|'); const m1 = await c(a.token, 'GET', '/api/messages?chat=' + encodeURIComponent(cid)); console.log('messages endpoint keys', Object.keys(m1).join(','), (m1.msgs || m1.items || []).length);
 const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); await p.addInitScript(t => localStorage.getItem('halo.tok') || localStorage.setItem('halo.tok', t), a.token);
 const shown = async () => p.evaluate(() => Object.values(window.__S ? window.__S.msgs : {}).reduce((n, x) => n + (x ? x.length : 0), 0));
 await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(1500);
 const open = async (pg) => { await pg.evaluate(() => document.querySelector('.crow2').click()); await pg.waitForTimeout(1500); return pg.evaluate(() => document.querySelectorAll('.msg, .bub, [data-mid]').length); };
 const n1 = await open(p); console.log('bubbles after first open', n1); ck('11 visible', n1 >= 11);
 await p.reload(); await p.waitForSelector('.nav'); await p.waitForTimeout(1500); const n2 = await open(p); console.log('after reload', n2); ck('same after reload', n2 === n1);
 const p2 = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p2.addInitScript(t => localStorage.setItem('halo.tok', t), a.token); await p2.goto(B + '/'); await p2.waitForSelector('.nav'); await p2.waitForTimeout(1500); const n3 = await open(p2); console.log('fresh device', n3); ck('same on fresh device', n3 === n1);
 const p3 = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p3.addInitScript(t => localStorage.setItem('halo.tok', t), h.token); await p3.goto(B + '/'); await p3.waitForSelector('.nav'); await p3.waitForTimeout(1500); const n4 = await open(p3); console.log('her device', n4); ck('her side same', n4 === n1);
 await br.close(); process.exit(0); })();
