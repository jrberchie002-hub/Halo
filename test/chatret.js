const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3192); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const U = 'http://localhost:3192';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['camera', 'microphone'] }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await B.p.waitForTimeout(500); await B.p.click('[data-a=chat]');
 let seen = false; for (let i = 0; i < 20; i++) { await A.p.waitForTimeout(1000); seen = await A.p.evaluate(() => !!document.getElementById('feye')); if (seen) break; }
 await A.p.waitForTimeout(800);
 await A.p.evaluate(() => document.querySelector('#th [data-a=chatmenu], [data-a=chatmenu]') && 0);
 // open menu via the profile sheet's more button
 await A.p.click('#th .nm'); await A.p.waitForSelector('#pr [data-a=chatmenu]'); await A.p.click('#pr [data-a=chatmenu]'); await A.p.waitForSelector('[data-a=cmret]');
 const before = await A.p.evaluate(() => document.querySelector('[data-a=cmret] em').textContent);
 await A.p.click('[data-a=cmret]'); await A.p.waitForTimeout(1200);
 await A.p.click('#pr [data-a=chatmenu]'); await A.p.waitForSelector('[data-a=cmret]');
 const after = await A.p.evaluate(() => document.querySelector('[data-a=cmret] em').textContent);
 let bsees = false; for (let i = 0; i < 12 && !bsees; i++) { await B.p.waitForTimeout(1000); bsees = await B.p.evaluate(() => /clear after 24 hours/.test(document.body.innerText)); }
 await A.p.click('[data-a=cmret]'); await A.p.waitForTimeout(1200); await A.p.click('#pr [data-a=chatmenu]'); await A.p.waitForSelector('[data-a=cmret]');
 const back = await A.p.evaluate(() => document.querySelector('[data-a=cmret] em').textContent);

 await A.p.click('[data-a=cmret]'); await A.p.waitForTimeout(1000);
 await A.p.evaluate(() => { const m = document.querySelector('.modal'); if (m) m.remove(); });
 await A.p.click('#pr [data-a=close]'); await A.p.waitForSelector('#th textarea'); await A.p.fill('#th textarea', 'hello old message'); await A.p.keyboard.press('Enter'); await A.p.waitForTimeout(1500);
 let bgot = false; for (let i = 0; i < 10 && !bgot; i++) { await B.p.waitForTimeout(800); bgot = await B.p.evaluate(() => /hello old message/.test(document.body.innerText)); }
 await B.p.evaluate(() => { const o = Date.now; window.__o = o; Date.now = () => o() + 25 * 36e5; }); await B.p.waitForTimeout(6000);
 const stillThere = await B.p.evaluate(() => /hello old message/.test(document.body.innerText)); await B.p.evaluate(() => { Date.now = window.__o; });
 const ck = (n, c) => console.log(c ? 'PASS' : 'FAIL', n);
 ck('B received the message first', bgot); ck('after 25h it is gone for B', !stillThere);
 ck('starts on Forever', /Forever/.test(before)); ck('switches to 24 hours', /24 hours/.test(after)); ck('friend sees the change in the chat', bsees); ck('switches back to Forever', /Forever/.test(back)); console.log(A.errs, B.errs);
 await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
