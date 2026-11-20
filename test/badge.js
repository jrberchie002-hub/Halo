const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3153); const B = 'http://localhost:3153';
 const call = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(600);
 console.log('before', !!(await p.$('.nav [data-t=stories] .badge')));
 await call(U.ben.t, 'POST', '/api/story', { text: 'new one' }); await p.waitForTimeout(5000);
 console.log('badge after post', await p.$eval('.nav [data-t=stories] .badge', e => e.textContent).catch(() => 'none'), errs); await b.close(); process.exit(0); })();
