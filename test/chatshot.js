const { chromium } = require('playwright'); const { start } = require('../dev.js'); const O = process.env.OUT;
(async () => { const srv = await start(3131); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3131/?demo=1'); await p.waitForSelector('.nav', { timeout: 9000 }); await p.waitForTimeout(800); await p.screenshot({ path: O + '/c_list.png' });
 await p.click('[data-a=chat][data-id=k]'); await p.waitForSelector('.b'); await p.waitForTimeout(600); await p.screenshot({ path: O + '/c_chat.png' });
 await p.click('[data-a=back]', { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(300);
 await p.click('[data-a=tab][data-t=stories]', { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500); await p.screenshot({ path: O + '/c_mom.png' });
 await p.click('[data-a=tab][data-t=calls]', { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500); await p.screenshot({ path: O + '/c_calls.png' });
 await p.click('[data-a=tab][data-t=me]', { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500); await p.screenshot({ path: O + '/c_me.png' });
 console.log('errs', errs); await b.close(); srv.close && srv.close(); process.exit(0); })();
