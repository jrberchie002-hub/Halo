const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3154); const B = 'http://localhost:3154';
 const call = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 await call(U.ben.t, 'POST', '/api/story', { text: 'hi' }); console.log('ring set', (await call(U.ben.t, 'POST', '/api/profile', { ring: '#1fc77a' })).me.ring);
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.stories .ringw.new'); await p.waitForTimeout(600);
 console.log('friend ring bg', await p.$eval('.stories .ringw.new', e => e.style.background.slice(0, 40)), errs); await b.close(); process.exit(0); })();
