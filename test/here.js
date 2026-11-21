const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3188); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const U = 'http://localhost:3188';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['camera', 'microphone'] }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await B.p.waitForTimeout(500); await B.p.click('[data-a=chat]');
 let seen = false; for (let i = 0; i < 20; i++) { await A.p.waitForTimeout(1000); seen = await A.p.evaluate(() => !!document.getElementById('feye')); if (seen) break; }
 const col = await A.p.evaluate(() => (document.getElementById('feye') || { style: { getPropertyValue: () => '' } }).style.getPropertyValue('--ec'));
 await B.p.click('#th [data-a=close]'); let gone = false; for (let i = 0; i < 20; i++) { await A.p.waitForTimeout(1000); gone = !(await A.p.evaluate(() => document.getElementById('feye'))); if (gone) break; }
 console.log('friend eyes seen', seen, 'colour', col, 'gone after leave', gone, A.errs, B.errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
