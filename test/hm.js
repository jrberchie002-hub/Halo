const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3191); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3191'); await p.click('[data-s=new]'); await p.fill('#a_n', 'Ama'); await p.fill('#a_u', 'ama.t'); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav');
 await p.click('[data-t=music]'); await p.waitForSelector('.hmcard'); await p.waitForTimeout(500); await p.screenshot({ path: process.env.OUT + '/m1.png' });
 await p.click('.hmcard'); await p.click('[data-k=mine]'); await p.waitForSelector('.hmhero'); await p.waitForTimeout(300); await p.screenshot({ path: process.env.OUT + '/m2.png' });
 await p.setInputFiles('#hmf', ['/tmp/av/Sunrise Drive.wav', '/tmp/av/Night Bus Home.wav']); await p.waitForSelector('.hmctl', { timeout: 5000 }); await p.waitForTimeout(500);
 await p.click('[data-a=hmsearch]'); await p.fill('#hmq', 'night'); await p.waitForTimeout(300); const rows = await p.$$eval('#hml .prow', r => r.length); await p.screenshot({ path: process.env.OUT + '/m3.png' });
 console.log('rows after search', rows, errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
