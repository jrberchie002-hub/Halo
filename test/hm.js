const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3123); const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3123/?demo=1'); await p.waitForSelector('.nav'); await p.click('.nav [data-t=me]'); await p.click('[data-a=sec][data-k=Music]'); await p.click('[data-a=hm]'); await p.waitForSelector('#hmf', { state: 'attached' });
 await p.setInputFiles('#hmf', '/tmp/t.wav'); await p.waitForSelector('#hml .prow'); await p.click('#hml [data-a=hmplay]'); await p.waitForTimeout(600);
 console.log('rows', await p.$$eval('#hml .prow', e => e.length), 'playing', await p.$eval('#hml .prow', e => e.className), errs); await p.screenshot({ path: '/tmp/hm.png' }); await b.close(); process.exit(0); })();
