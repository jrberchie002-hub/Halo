const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3200); const B = 'http://localhost:3200'; const c = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, ...(await r.json().catch(() => ({}))) }; }; const ck = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 for (let i = 0; i < 12; i++) await c((i % 2 ? a : h).token, 'POST', '/api/send', { to: (i % 2 ? h : a).me.id, x: 'seed ' + i, ck: 'ssssssss' + i + 'x' });
 const br = await chromium.launch(); const p = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), a.token); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(1200);
 await p.evaluate(() => document.querySelector('.crow2').click()); await p.waitForTimeout(1500);
 await p.evaluate(() => { window.__min = 1e9; window.__max = 0; window.__dips = []; let last = -1; setInterval(() => { const n = document.querySelectorAll('#ms [data-id]').length; if (n > window.__max) window.__max = n; if (last >= 0 && n < last) window.__dips.push(last + '>' + n); last = n; }, 50); });
 const t0 = Date.now(); let i = 0; while (Date.now() - t0 < 40000) { i++; await c(h.token, 'POST', '/api/send', { to: a.me.id, x: 'live ' + i, ck: 'llllllll' + i + 'y' }); if (i % 3 === 0) { await p.fill('#th textarea', 'mine ' + i); await p.keyboard.press('Enter'); } await p.waitForTimeout(1200); }
 const r = await p.evaluate(() => ({ max: window.__max, dips: window.__dips, now: document.querySelectorAll('#ms [data-id]').length })); console.log(JSON.stringify(r));
 ck('never lost a message while chatting', r.dips.length === 0); ck('all messages shown at the end', r.now >= 12 + i); ck('no page errors', !errs.length); await br.close(); process.exit(0); })();
