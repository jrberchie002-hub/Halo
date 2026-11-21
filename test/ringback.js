const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3117); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const U = 'http://localhost:3117';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go');   await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await A.p.fill('#tx', 'hello kofi'); const t0 = Date.now(); await A.p.click('[data-a=send]');
 let fails = []; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
 await A.p.context().grantPermissions(['microphone', 'camera']); await A.p.waitForSelector('[data-a=call]');
 await A.p.evaluate(() => { window.__au = []; const pl = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__au.push({ el: this, at: performance.now(), src: String(this.src).slice(0, 5), loop: this.loop, vol: this.volume }); return pl.apply(this, arguments); }; });
 await A.p.route(/\/api\/call$/, async r => { await new Promise(x => setTimeout(x, 1500)); r.continue(); }); // the server is slow to answer
 await A.p.click('[data-a=call]'); await A.p.waitForTimeout(400);
 const r = await A.p.evaluate(() => window.__au.map(x => ({ src: x.src, loop: x.loop, vol: x.vol, paused: x.el.paused })));
 ok(r.some(x => x.src === 'blob:' && x.loop && x.vol >= .3 && !x.paused), 'ringing tone is playing 400 ms after I press call, before the server has answered');
 await A.p.waitForTimeout(1800); ok(await A.p.evaluate(() => window.__au.filter(x => x.src === 'blob:' && !x.el.paused).length === 1), 'one ringing tone only (no doubling when the server answers)');
 await A.p.click('[data-c=end]', { timeout: 3000 }).catch(() => {}); await A.p.waitForTimeout(500); ok(await A.p.evaluate(() => window.__au.filter(x => x.src === 'blob:').every(x => x.el.paused)), 'ringing stops when the call ends');
 console.log('page errors', A.errs, B.errs); await b.close(); srv.close && srv.close(); console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
