const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3133); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true }); const p = await c.newPage();
 await p.goto('http://localhost:3133/?demo=1'); await p.waitForSelector('.nav', { timeout: 9000 }); let bad = [];
 const chk = async n => { const r = await p.evaluate(() => { window.scrollTo(200, 0); document.documentElement.scrollLeft = 200; return { dw: document.documentElement.scrollWidth, iw: innerWidth, x: window.scrollX }; }); console.log(n, JSON.stringify(r)); if (r.dw > r.iw || r.x) bad.push(n); };
 await chk('chats'); for (const t of ['stories', 'calls', 'me']) { await p.click('[data-a=tab][data-t=' + t + ']', { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(400); await chk(t); }
 await p.click('[data-a=tab][data-t=chats]'); await p.click('[data-a=chat][data-id=k]', { timeout: 2000 }); await p.waitForSelector('.b'); await chk('chat');
 console.log(bad.length ? 'LOCK FAIL ' + bad : 'LOCK OK'); await b.close(); srv.close && srv.close(); process.exit(bad.length ? 1 : 0); })();
