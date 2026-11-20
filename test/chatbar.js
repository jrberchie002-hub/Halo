const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3121); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3121/?demo=1'); await p.waitForSelector('.nav'); await p.click('.crow'); await p.waitForSelector('#ms'); await p.waitForTimeout(400);
 console.log('times', await p.$$eval('.time', e => e.map(x => x.textContent)), 'gal', !!(await p.$('#gbtn')), 'mic', !!(await p.$('#mbtn')), errs); await p.screenshot({ path: '/tmp/cb.png' }); await b.close(); process.exit(0); })();
