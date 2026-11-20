const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3155); const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'allow' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3155/?demo=1'); await p.waitForSelector('.nav'); await p.waitForTimeout(1500);
 let loads = 0; p.on('load', () => loads++); await p.evaluate(() => { const t = document.querySelector('.nav [data-t=me]'); t.click(); }); await p.waitForTimeout(300);
 await p.evaluate(() => document.querySelector('[data-a=settings]').click()); await p.waitForTimeout(400);
 const has = await p.evaluate(() => { const g = [...document.querySelectorAll('.sech')].find(e => /Calls/.test(e.textContent)); if (g) g.click(); return !!g; }); await p.waitForTimeout(300);
 await p.evaluate(() => { const u = document.querySelector('[data-a=updnow]'); if (u) u.click(); }); await p.waitForTimeout(3000);
 console.log('calls section', has, 'reloads', loads, errs); await b.close(); process.exit(0); })();
