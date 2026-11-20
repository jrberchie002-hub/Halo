const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3122); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3122/?demo=1'); await p.waitForSelector('.nav'); await p.waitForTimeout(300);
 console.log('reqs section', !!(await p.$('.reqs')), 'accept btn', !!(await p.$('.reqs [data-a=accept]')), errs); await p.screenshot({ path: '/tmp/req.png' }); await b.close(); process.exit(0); })();
