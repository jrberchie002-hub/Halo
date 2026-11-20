const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3141); const B = 'http://localhost:3141';
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(500);
 await p.click('.chip[data-k=ranks]'); await p.click('[data-a=rknew]'); await p.fill('#rkn', 'The Crew'); await p.check('.rkpick input'); await p.click('[data-a=rkmake]'); await p.waitForSelector('#rk');
 await p.fill('#rtx', 'first!'); await p.click('#rsb'); await p.waitForTimeout(800);
 console.log('bubble', (await p.textContent('#rms')).includes('first!'), 'title', await p.textContent('#rkt'));
 await p.click('[data-a=rkinfo]'); await p.waitForSelector('.modal'); await p.screenshot({ path: '/tmp/rank.png' });
 const j = await call(U.ben.t, 'GET', '/api/sync?since=0'); console.log('ben sees rank', j.rows.some(r => r.c === 'ranks'), errs);
 await b.close(); process.exit(0); })();
