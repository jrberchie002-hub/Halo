const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3195); const B = 'http://localhost:3195'; const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const j = await c(null, 'POST', '/api/signup', { username: 'newbie', name: 'New', password: 'pass1234' }); const ck = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), j.token); await p.goto(B + '/#tour'); await p.waitForSelector('.nav'); await p.waitForSelector('.modal', { timeout: 9000 }); ck('tour opens by itself for a new person', /Welcome to Halo/.test(await p.textContent('.modal')));
 for (let i = 0; i < 4; i++) await p.evaluate(() => document.querySelector('.modal [data-a=tourgo]').click()); await p.waitForTimeout(900); ck('reaches last step with install tip', /not have to tap/.test(await p.textContent('.modal'))); await p.screenshot({ path: '/tmp/tour.png' });
 await p.evaluate(() => document.querySelector('.modal [data-a=tourx]').click()); ck('closes', !(await p.$('.modal')));
 await p.reload(); await p.waitForSelector('.nav'); await p.waitForTimeout(5000); ck('does not come back', !(await p.$('.modal')));
 ck('sideways lock', await p.evaluate(() => document.documentElement.scrollWidth <= 390)); ck('no page errors', !errs.length); await b.close(); process.exit(0); })();
