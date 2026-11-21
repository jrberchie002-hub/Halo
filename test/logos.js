const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3190); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3190'); await p.click('[data-s=new]'); await p.fill('#a_n', 'Ama'); await p.fill('#a_u', 'ama.t'); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav');
 await p.click('[data-a=music]'); await p.waitForSelector('.mhero'); await p.waitForTimeout(800); await p.screenshot({ path: process.env.OUT + '/music.png' });
 await p.click('[data-a=miniset]'); await p.waitForSelector('.svrow'); await p.waitForTimeout(500); await p.screenshot({ path: process.env.OUT + '/share.png' });
 const ok = await p.evaluate(() => [...document.querySelectorAll('img.svi')].every(i => i.complete && i.naturalWidth > 0)); console.log('logos loaded', ok, errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
