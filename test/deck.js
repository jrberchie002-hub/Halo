const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3151); const B = 'http://localhost:3151';
 const call = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 for (let i = 1; i <= 6; i++) await call(U.ben.t, 'POST', '/api/story', { text: 'moment ' + i, bg: i % 7 });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(600);
 await p.click('.nav [data-t=stories]'); await p.waitForSelector('.deck'); console.log('cards', await p.$$eval('.deck .dk', e => e.length), await p.textContent('.dkc'));
 const box = await (await p.$('.deck .dk:last-child')).boundingBox(); const mx = box.x + box.width / 2, my = box.y + box.height / 2;
 await p.mouse.move(mx, my); await p.mouse.down(); await p.mouse.move(mx - 160, my, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(600);
 console.log('after swipe', await p.textContent('.dkc'), 'tab still stories', await p.$eval('.nav [data-t=stories]', e => e.classList.contains('on')));
 await p.screenshot({ path: '/tmp/deck0.png' }); const b2 = await (await p.$('.deck .dk:last-child')).boundingBox(); await p.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2); await p.waitForTimeout(500); console.log('opens viewer', !!(await p.$('.sv')), errs);
 await p.screenshot({ path: '/tmp/deck.png' }); await b.close(); process.exit(0); })();
