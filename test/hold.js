const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3140); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3140/?demo=1'); await p.waitForSelector('.crow2');
 const box = await p.$eval('.crow2', e => { const r = e.getBoundingClientRect(); return { x: r.x + 100, y: r.y + 20 }; });
 const cdp = await c.newCDPSession(p); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] }); await p.waitForTimeout(700); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
 await p.waitForSelector('[data-a=cmpin]', { timeout: 3000 }); console.log('menu open', !!(await p.$('[data-a=cmrm]')));
 await p.waitForTimeout(600); await p.click('[data-a=cmpin]'); await p.waitForTimeout(300); console.log('pinned', await p.$$eval('.pin', e => e.length), errs);
 await p.screenshot({ path: '/tmp/hold.png' }); await b.close(); process.exit(0); })();
