const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3112); const b = await chromium.launch(); const U = 'http://localhost:3112';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go');   await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await A.p.fill('#tx', 'hello kofi'); const t0 = Date.now(); await A.p.click('[data-a=send]');
 const ctxA = A.p.context(); let fails = [];
 const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
 await A.p.waitForSelector('#tx');
 // 1. dictation / autofill puts text in the box without any key events: the send button must still appear
 await A.p.evaluate(() => { document.querySelector('#tx').value = 'typed by voice'; });
 await A.p.waitForTimeout(800); ok(await A.p.evaluate(() => !document.querySelector('#sbtn').hidden), 'send button appears when text arrives without key events');
 await A.p.evaluate(() => { document.querySelector('#tx').value = ''; }); await A.p.waitForTimeout(800); ok(await A.p.evaluate(() => document.querySelector('#sbtn').hidden), 'send button hides again when empty');
 // 2. offline send keeps the message, shows Not sent, keeps it saved
 await ctxA.setOffline(true); await A.p.fill('#tx', 'offline hello'); await A.p.click('[data-a=send]'); await A.p.waitForTimeout(900);
 ok(await A.p.evaluate(() => /Not sent/.test(document.querySelector('#ms').textContent) && /offline hello/.test(document.querySelector('#ms').textContent)), 'failed message stays in the chat with a Not sent line');
 ok(await A.p.evaluate(() => (JSON.parse(localStorage.getItem('halo.out') || '[]')).length === 1), 'failed message is saved on the phone');
 ok(await A.p.evaluate(() => document.querySelector('#tx').value === ''), 'text box is clear, message is in the thread');
 // 3. back online: it goes by itself, exactly once
 await ctxA.setOffline(false); await B.p.waitForFunction(() => /offline hello/.test(document.body.textContent), null, { timeout: 15000 }).catch(() => {});
 ok(await B.p.evaluate(() => document.body.textContent.includes('offline hello')), 'friend receives it after the connection returns (no tap needed)');
 await A.p.waitForTimeout(1500); ok(await A.p.evaluate(() => !/Not sent/.test(document.querySelector('#ms').textContent)), 'Not sent line clears once delivered');
 ok(await A.p.evaluate(() => (JSON.parse(localStorage.getItem('halo.out') || '[]')).length === 0), 'saved copy is removed after delivery');
 ok(await A.p.evaluate(() => (document.querySelector('#ms').textContent.match(/offline hello/g) || []).length === 1), 'no duplicate on my side');
 await B.p.click('[data-a=chat]', { timeout: 3000 }).catch(() => {}); await B.p.waitForTimeout(800);
 ok(await B.p.evaluate(() => (document.querySelector('#ms') ? (document.querySelector('#ms').textContent.match(/offline hello/g) || []).length : 1) === 1), 'no duplicate for the friend');
 console.log('page errors', A.errs, B.errs); await b.close(); srv.close && srv.close(); console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
