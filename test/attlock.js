const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3161); let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true })).newPage();
 await p.goto('http://localhost:3161/?demo=1'); await p.waitForSelector('.nav'); await p.evaluate(() => document.querySelector('[data-a=chat],[data-a=open]').click()); await p.waitForTimeout(900);
 await p.evaluate(() => document.querySelector('[data-a=plus]').click()); await p.waitForTimeout(300);
 const o = await p.evaluate(() => { const c = document.querySelector('.atchips'), s = getComputedStyle(c); return { oy: s.overflowY, ta: s.touchAction, sh: c.scrollHeight, ch: c.clientHeight, ow: document.documentElement.scrollWidth }; }); console.log(JSON.stringify(o));
 ck('chips cannot scroll vertically', o.oy === 'hidden' && o.sh <= o.ch + 8); ck('sideways only', o.ta === 'pan-x'); ck('no page overflow', o.ow <= 390);
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
