const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3134); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true }); const p = await c.newPage();
 await p.goto('http://localhost:3134/?demo=1'); await p.waitForSelector('.nav', { timeout: 9000 }); await p.waitForTimeout(600);
 const r = await p.evaluate(() => { const n = document.querySelector('.nav').getBoundingClientRect(), bd = document.querySelector('.body'); return { bp: Math.round(parseFloat(getComputedStyle(bd).paddingBottom)), need: Math.round(innerHeight - n.top + 8) }; });
 console.log(JSON.stringify(r)); const ok = Math.abs(r.bp - r.need) <= 2; console.log(ok ? 'BP OK' : 'BP FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
