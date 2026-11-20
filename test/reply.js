const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3142); const B = 'http://localhost:3142';
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 await call(U.ben.t, 'POST', '/api/send', { to: U.amy.id, x: 'what time tonight?' });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(600);
 await p.click('.crow2'); await p.waitForSelector('#ms .b'); await p.dispatchEvent('#ms .b', 'contextmenu'); await p.click('[data-a=rplgo]'); await p.waitForSelector('#rplb');
 await p.fill('#tx', '8pm'); await p.click('#sbtn'); await p.waitForTimeout(900);
 console.log('quote shown', await p.$$eval('#ms .b .qt', e => e.map(x => x.textContent)), 'bar gone', !(await p.$('#rplb')));
 const j = await call(U.ben.t, 'GET', '/api/sync?since=0'); console.log('ben got re', j.rows.some(r => r.c === 'msgs' && r.data.re && r.data.re.x === 'what time tonight?'));
 await p.click('[data-a=close]'); await p.click('.crow2', { delay: 700 }).catch(() => {}); await p.click('.nav [data-t=me]'); await p.waitForTimeout(200);
 await p.evaluate(() => document.querySelector('[data-a=music]') || 0); await p.click('.nav [data-t=chats]'); await p.click('[data-a=music]').catch(()=>{}); await p.waitForTimeout(300);
 console.log('music page', !!(await p.$('#mus')), errs); await p.screenshot({ path: '/tmp/mus.png' }); await b.close(); process.exit(0); })();
