const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3193); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3193'); await p.click('[data-s=new]'); await p.fill('#a_n', 'Ama'); await p.fill('#a_u', 'ama.t'); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav');
 await p.click('[data-t=stories]'); await p.waitForSelector('.mempty'); await p.waitForTimeout(300); await p.screenshot({ path: process.env.OUT + '/o1.png' });
 await p.click('[data-t=music]'); await p.waitForSelector('.hmcard'); await p.screenshot({ path: process.env.OUT + '/o2.png' });
 await p.click('[data-a=pls]'); await p.waitForSelector('.plnew'); await p.fill('#plu', 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'); await p.fill('#pln', 'Road trip'); await p.click('[data-a=plsadd]'); await p.waitForSelector('.pcard'); await p.waitForTimeout(300); await p.screenshot({ path: process.env.OUT + '/o3.png' });
 console.log(errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
