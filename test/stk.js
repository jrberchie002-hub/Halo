const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3115); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3115/?demo=1'); await p.waitForSelector('.nav'); await p.click('[data-a=chat][data-id=a]'); await p.waitForSelector('.b');
 await p.click('[data-a=plus]'); await p.click('[data-a=tt][data-k=m2]'); await p.setInputFiles('#stkf', ['public/og.png', 'public/og.png']); await p.waitForSelector('[data-a=mystk]'); await p.screenshot({ path: '/tmp/s_mine.png' });
 await p.click('[data-a=mystk]'); await p.waitForSelector('img.stkimg.me'); console.log('sticker sent');
 await p.click('[data-a=plus]'); await p.click('[data-a=tt][data-k=f]'); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/s_gif.png' });
 const real = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await real.goto('http://localhost:3115'); await real.click('[data-s=new]'); await real.fill('#a_n', 'X'); await real.fill('#a_u', 'xx.y'); await real.fill('#a_p', 'pass1234'); await real.click('#a_go');   await real.click('[data-a=enter]'); await real.waitForSelector('.nav');
 console.log('errors', errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
