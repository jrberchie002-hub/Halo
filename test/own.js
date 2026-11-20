const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3159); const B = 'http://localhost:3159';
 const call = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const j = await call(null, 'POST', '/api/signup', { username: 'ownzz', name: 'own', password: 'pass1234' }); await call(j.token, 'POST', '/api/story', { text: 'mine 1' }); await call(j.token, 'POST', '/api/story', { text: 'mine 2' });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), j.token); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(600); await p.click('.nav [data-t=stories]'); await p.waitForSelector('.deck');
 for (let i = 0; i < 2; i++) { const bx = await (await p.$('.deck .dk:last-child')).boundingBox(); const x = bx.x + bx.width / 2, y = bx.y + bx.height / 2; await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x - 200, y, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(500); }
 console.log('deck gone', !(await p.$('.deck')), 'own circle ring', !!(await p.$('.stwrap .ringw.new')), 'plus btn', !!(await p.$('.stwrap .plb')), errs); await p.screenshot({ path: '/tmp/own.png' }); await b.close(); process.exit(0); })();
