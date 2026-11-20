const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3120); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3120/?demo=1'); await p.waitForSelector('.nav'); await p.click('.nav [data-t=me]'); await p.click('[data-a=sec][data-k=Music]'); await p.click('[data-a=pls]'); await p.waitForSelector('#plu');
 await p.fill('#plu', 'https://www.youtube.com/playlist?list=PLabcdefghij1234'); await p.fill('#pln', 'Gym mix'); await p.click('[data-a=plsadd]'); await p.waitForSelector('.prow');
 console.log('rows', await p.$$eval('.prow', e => e.length), 'saved', await p.evaluate(() => localStorage.getItem('halo.pls')), errs); await p.screenshot({ path: '/tmp/pls.png' }); await b.close(); process.exit(0); })();
