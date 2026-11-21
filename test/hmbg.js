const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3135); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3135/?demo=1'); await p.waitForSelector('.nav'); await p.evaluate(() => { document.querySelector('[data-a=tab][data-t=music]').click(); }); await p.waitForTimeout(400);
 await p.evaluate(() => document.querySelector('[data-a=hm]').click()); await p.waitForTimeout(600);
 await p.evaluate(() => document.querySelector('[data-a=hmx]').click()); await p.waitForTimeout(300);
 console.log(await p.$eval('#hmo', x => 'display=' + getComputedStyle(x).display + ' vis=' + getComputedStyle(x).visibility + ' pe=' + getComputedStyle(x).pointerEvents + ' hiddenAttr=' + x.hidden));
 await p.click('[data-a=tab][data-t=chats]'); console.log('chats clickable, errs', errs); process.exit(0); })();
