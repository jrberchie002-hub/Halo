const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3150); const B = 'http://localhost:3150'; let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'cal', 'dee', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 for (const n of ['amy', 'cal', 'dee']) await call(U[n].t, 'POST', '/api/friend', { to: U.ben.id });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => console.log('ERR', e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.ben.t); await p.goto(B + '/'); await p.waitForSelector('.nav', { timeout: 9000 }); await p.waitForTimeout(1200);
 ck('badge shows 3', await p.evaluate(() => (document.querySelector('.top [data-a=add] .dot') || {}).textContent === '3'));
 ck('X to decline on each request', await p.evaluate(() => document.querySelectorAll('.row [data-a=decline]').length === 3));
 if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
 await p.evaluate(() => document.querySelector('.row [data-a=decline]').click()); await p.waitForTimeout(800);
 ck('badge drops to 2', await p.evaluate(() => (document.querySelector('.top [data-a=add] .dot') || {}).textContent === '2'));
 ck('no overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
