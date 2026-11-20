const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3158); const B = 'http://localhost:3158';
 const call = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(500);
 await p.click('.crow2'); await p.waitForSelector('#cph', { state: 'attached' }); await p.setInputFiles('#cph', '/tmp/t.png'); await p.waitForSelector('#mcap'); await p.fill('#mcap', 'look at this'); await p.screenshot({ path: '/tmp/mcap.png' }); await p.click('#mpgo'); await p.waitForTimeout(1200);
 const j = await call(U.ben.t, 'GET', '/api/sync?since=0'); console.log('sent with caption', j.rows.some(r => r.c === 'msgs' && r.data.img && r.data.x === 'look at this'), errs); await b.close(); process.exit(0); })();
