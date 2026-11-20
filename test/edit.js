const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3144); const B = 'http://localhost:3144';
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(600);
 await p.click('.crow2'); await p.fill('#tx', 'helo'); await p.click('#sbtn'); await p.waitForTimeout(900);
 await p.dispatchEvent('#ms .b.me', 'contextmenu'); await p.click('[data-a=medit]'); await p.fill('#tx', 'hello'); await p.click('#sbtn'); await p.waitForTimeout(900);
 console.log('edited', (await p.textContent('#ms .b.me')).replace(/\s+/g, ' '));
 let j = await call(U.ben.t, 'GET', '/api/sync?since=0'); console.log('ben sees edit', j.rows.some(r => r.c === 'msgs' && r.data.x === 'hello' && r.data.ed));
 await p.dispatchEvent('#ms .b.me', 'contextmenu'); await p.click('[data-a=mdel]'); await p.waitForTimeout(900);
 console.log('deleted', await p.textContent('#ms .b.me')); j = await call(U.ben.t, 'GET', '/api/sync?since=0'); console.log('ben sees del', j.rows.some(r => r.c === 'msgs' && r.data.del));
 console.log(errs); await b.close(); process.exit(0); })();
