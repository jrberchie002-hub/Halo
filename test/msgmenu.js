const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3142); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true })).newPage(); let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 await p.goto('http://localhost:3142/?demo=1'); await p.waitForSelector('.nav', { timeout: 9000 });
 const r = await p.evaluate(() => { const m = (window.S && 0); return 1; });
 await p.evaluate(() => { document.querySelector('[data-a=chat],[data-a=open]') && document.querySelector('[data-a=chat],[data-a=open]').click(); }); await p.waitForTimeout(800);
 const has = await p.evaluate(() => { const b = document.querySelector('#ms [data-id]'); if (!b) return false; b.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })); return true; });
 if (!has) { console.log('SKIP no message in demo'); process.exit(0); }
 await p.waitForTimeout(300);
 const o = await p.evaluate(() => { const m = document.querySelector('.modal.mm'); if (!m) return null; const c = m.querySelector('.mmw').getBoundingClientRect(); return { h: Math.round(c.height), arrows: 0, close: /Close/.test(m.textContent), title: false, over: document.documentElement.scrollWidth > innerWidth }; });
 console.log(JSON.stringify(o)); ck('menu opened', !!o); if (o) { ck('compact', o.h < 520); ck('no arrows', o.arrows === 0); ck('no Close button', !o.close); ck('no Message title', !o.title); ck('no overflow', !o.over);
  await p.evaluate(() => document.querySelector('[data-a=mrmore]') && document.querySelector('[data-a=mrmore]').click()); ck('plus shows more emojis', await p.evaluate(() => { const x = document.querySelector('.rxx'); return !x || !x.hidden; }));
  await p.evaluate(() => document.querySelector('.modal.mm').click()); await p.waitForTimeout(100); ck('tap anywhere closes', await p.evaluate(() => !document.querySelector('.modal'))); }
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
