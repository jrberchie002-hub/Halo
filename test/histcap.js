const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3113); const b = await chromium.launch(); const U = 'http://localhost:3113';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go');   await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await A.p.fill('#tx', 'hello kofi'); const t0 = Date.now(); await A.p.click('[data-a=send]');
 let fails = []; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
 await A.p.waitForSelector('#tx');
 // A sends 70 texts then 25 photos (about 30 KB each) through the real API, pausing for the 40-per-10s limit
 const send = (n, kind, off) => A.p.evaluate(async ({ n, kind, off }) => { const tok = localStorage.getItem('halo.tok'), cid = document.querySelector('#th').dataset.fid; const img = 'data:image/jpeg;base64,' + 'A'.repeat(30000); for (let i = 0; i < n; i++) { const body = { to: cid, ck: 'k' + kind + (off + i) + 'x'.repeat(4), x: kind === 't' ? 'msg ' + (off + i) : '', img: kind === 'i' ? img : undefined }; const r = await fetch('/api/send', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify(body) }); if (!r.ok) return 'fail ' + r.status + ' at ' + i; } return 'ok'; }, { n, kind, off });
 let r1 = await send(35, 't', 0); await A.p.waitForTimeout(10500); let r2 = await send(35, 't', 35); await A.p.waitForTimeout(10500); let r3 = await send(25, 'i', 0); ok(r1 === 'ok' && r2 === 'ok' && r3 === 'ok', 'seeded 70 texts and 25 photos: ' + [r1, r2, r3].join(','));
 // fresh phone for B: first sync must be capped
 const bytes = []; B.p.on('response', async r => { if (/api\/sync\?since=0/.test(r.url())) { try { const t = await r.text(); bytes.push({ n: t.length, j: JSON.parse(t) }); } catch (e) {} } });
 await B.p.reload(); await B.p.waitForSelector('[data-a=chat]', { timeout: 10000 }); await B.p.waitForTimeout(1500);
 const s0 = bytes[bytes.length - 1]; ok(!!s0 && s0.j.capped && s0.j.capped.length === 1, 'first sync reports the chat as having older messages');
 const msgRows = s0 ? s0.j.rows.filter(x => x.c === 'msgs').length : 0; ok(msgRows > 0 && msgRows <= 40, 'first sync carries at most 40 messages for the chat (' + msgRows + ')');
 await B.p.click('[data-a=chat]'); await B.p.waitForSelector('#ms .b'); await B.p.waitForTimeout(600);
 const count = () => B.p.evaluate(() => document.querySelectorAll('#ms .b').length); const c0 = await count();
 ok(c0 <= 40 && c0 > 0, 'thread opens with the newest messages only, no gap (' + c0 + ')'); ok(await B.p.evaluate(() => !!document.querySelector('.earlier')), 'Earlier messages control is shown');
 const newest = await B.p.evaluate(() => { const l = [...document.querySelectorAll('#ms .b')]; return l[l.length - 1].querySelector('.img') ? 'image' : l[l.length - 1].textContent; }); ok(newest === 'image', 'newest message is the last photo');
 let guard = 0; while (await B.p.evaluate(() => !!document.querySelector('.earlier')) && guard++ < 10) { await B.p.click('.earlier'); await B.p.waitForTimeout(900); }
 const c1 = await count(), truth = await A.p.evaluate(() => document.querySelectorAll('#ms .b').length); ok(c1 === truth && c1 >= 95, 'tapping Earlier messages loads everything, nothing lost (' + c1 + ' of ' + truth + ' on the sender)'); ok(await B.p.evaluate(() => !document.querySelector('.earlier')), 'control disappears when the start is reached');
 const ordA = await A.p.evaluate(() => [...document.querySelectorAll('#ms .b')].map(x => x.textContent).join('|')), ordB = await B.p.evaluate(() => [...document.querySelectorAll('#ms .b')].map(x => x.textContent).join('|')); ok(ordA === ordB, 'same messages in the same order on both phones');
 console.log('page errors', A.errs, B.errs); await b.close(); srv.close && srv.close(); console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
