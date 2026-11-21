const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3116); const b = await chromium.launch(); const U = 'http://localhost:3116';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go');   await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await A.p.fill('#tx', 'hello kofi'); const t0 = Date.now(); await A.p.click('[data-a=send]');
 let fails = []; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
 await B.p.waitForSelector('.toast', { timeout: 8000 }).catch(() => {}); await B.p.waitForTimeout(2200);
 const ids = await B.p.evaluate(() => ({ me: JSON.parse(localStorage.getItem('halo.snap')).me.id, friend: document.querySelector('[data-a=chat]').dataset.id }));
 const chat = [ids.me, ids.friend].sort().join('|'); const mm = (x, from) => ({ id: chat + '~' + Date.now() + x.length, chat, from: from || ids.friend, t: Date.now(), x });
 // 1. network down: a push arrives while the app is open, then I tap it
 await B.p.route(/\/api\/sync/, r => r.abort());
 await B.p.evaluate(m => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'push', m } })), mm('pushed hello'));
 await B.p.waitForTimeout(300); ok(await B.p.evaluate(() => /new message/.test(document.body.textContent)), 'push puts the message in the chat list at once (network down)');
 await B.p.evaluate(m => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'open', from: m.from, m } })), mm('pushed hello'));
 await B.p.waitForSelector('#ms .b', { timeout: 2000 }); ok(await B.p.evaluate(() => /pushed hello/.test(document.querySelector('#ms').textContent)), 'tapping the notification opens the chat with the message already in it');
 // 2. a message claiming to be from someone who is not my friend is ignored
 const before = await B.p.evaluate(() => document.querySelector('#ms').textContent.length);
 await B.p.evaluate(m => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'push', m } })), mm('fake stranger', 'ustranger123'));
 await B.p.waitForTimeout(300); ok(await B.p.evaluate(() => !/fake stranger/.test(document.body.textContent)), 'message from a non-friend is ignored');
 // 3. app was closed: the service worker stored the message, tapping opens the app straight into the chat
 await B.p.goto('about:blank');
 const p2 = await B.p.context().newPage(); await p2.route(/\/api\/sync/, r => r.abort());
 await p2.goto(U); await p2.evaluate(m => new Promise(res => { const r = indexedDB.open('halo', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { const tx = r.result.transaction('kv', 'readwrite'); tx.objectStore('kv').put([{ at: Date.now(), m }], 'pm'); tx.oncomplete = res; }; }), mm('stored while closed'));
 const t1 = Date.now(); await p2.goto(U + '/?o=' + encodeURIComponent(ids.friend)); await p2.waitForSelector('#ms .b', { timeout: 4000 }).catch(() => {});
 const seen = await p2.evaluate(() => document.querySelector('#ms') && /stored while closed/.test(document.querySelector('#ms').textContent)); ok(seen, 'cold start from a notification opens the chat with the message, network down (' + (Date.now() - t1) + ' ms)');
 console.log('page errors', A.errs, B.errs); await b.close(); srv.close && srv.close(); console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
