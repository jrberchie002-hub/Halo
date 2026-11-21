const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3114); const b = await chromium.launch(); const U = 'http://localhost:3114';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go');   await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await A.p.fill('#tx', 'hello kofi'); const t0 = Date.now(); await A.p.click('[data-a=send]');
 let fails = []; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
 await B.p.waitForSelector('.toast', { timeout: 8000 }).catch(() => {}); await B.p.waitForTimeout(2200); // B has seen the first message and saved its state
 await B.p.goto('about:blank'); // B closes the app
 for (const t of ['while you were away 1', 'while you were away 2', 'while you were away 3']) { await A.p.fill('#tx', t); await A.p.click('[data-a=send]'); await A.p.waitForTimeout(300); }
 await A.p.waitForTimeout(800);
 // B opens the app on a slowish connection (150 ms added to every request)
 const reqs = []; await B.p.route(/\/api\//, async r => { reqs.push(r.request().url().replace(U, '')); await new Promise(x => setTimeout(x, 150)); r.continue(); });
 const tb = Date.now(); await B.p.goto(U); let seen = 0, t1 = 0; while (Date.now() - tb < 6000) { const has = await B.p.evaluate(() => /[3-9] new messages/.test(document.body.textContent)); if (has) { t1 = Date.now() - tb; break; } await B.p.waitForTimeout(25); }
 ok(t1 > 0 && t1 < 900, 'friend\'s new messages shown ' + t1 + ' ms after opening, with 150 ms added to every request (target under 900)');
 const syncs = reqs.filter(u => /api\/sync/.test(u)); const first = syncs[0] || ''; ok(/since=[1-9]\d+/.test(first), 'first refresh asks only for what is new (' + first.slice(0, 40) + ')');
 await B.p.waitForTimeout(1800); ok(reqs.some(u => /since=0&only=stories/.test(u)), 'moments and rings catch up quietly afterwards');
 // my own message is there the instant I reopen, even before the network answers
 await A.p.fill('#tx', 'sent just now'); await A.p.click('[data-a=send]'); await A.p.waitForFunction(() => document.querySelector('#ms .seen') && /Sent/.test(document.querySelector('#ms').textContent), null, { timeout: 5000 });
 await A.p.route(/\/api\/sync/, r => r.abort()); const t2 = Date.now(); await A.p.reload(); let mine = 0; while (Date.now() - t2 < 3000) { const has = await A.p.evaluate(() => document.body.textContent.includes('sent just now')); if (has) { mine = Date.now() - t2; break; } await A.p.waitForTimeout(20); }
 ok(mine > 0 && mine < 700, 'my own message shows ' + mine + ' ms after reopening, with the network down');
 console.log('page errors', A.errs, B.errs); await b.close(); srv.close && srv.close(); console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
