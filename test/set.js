const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3117); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3117/?demo=1'); await p.waitForSelector('.nav'); await p.click('[data-t=me]'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/s_me.png' });
 await p.click('.nav [data-t=me]'); await p.click('[data-a=sec][data-k=Themes]'); await p.waitForSelector('[data-a=theme]'); await p.click('[data-a=theme][data-v=dark]'); await p.evaluate(() => 0); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/s_set.png' });
 console.log('dark applied:', await p.evaluate(() => document.documentElement.dataset.theme || document.body.className), 'ok', 'errors', errs); await b.close(); srv.close && srv.close(); process.exit(0); })();
