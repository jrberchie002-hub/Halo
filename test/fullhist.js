const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3201); const B = 'http://localhost:3201'; const c = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, ...(await r.json().catch(() => ({}))) }; }; const ck = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const N = 130; for (let i = 0; i < N; i++) { let r = await c((i % 2 ? a : h).token, 'POST', '/api/send', { to: (i % 2 ? h : a).me.id, x: 'old ' + i, ck: 'hhhhhhhh' + String(i).padStart(3, '0') }); if (r.s === 429) { await new Promise(r2 => setTimeout(r2, 10500)); i--; } }
 const br = await chromium.launch(); const p = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p.addInitScript(t => localStorage.setItem('halo.tok', t), a.token); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(1500);
 await p.evaluate(() => document.querySelector('.crow2').click()); await p.waitForTimeout(9000);
 const n = await p.evaluate(() => ({ b: document.querySelectorAll('#ms [data-id]').length, btn: !!document.querySelector('.earlier') })); console.log(JSON.stringify(n)); ck('whole history loaded on opening (130)', n.b === N); ck('no Earlier button needed', !n.btn);
 await br.close(); process.exit(0); })();
