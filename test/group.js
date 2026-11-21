const { chromium } = require('playwright'); const { start } = require('../dev.js'); const path = require('path');
const OUT = process.env.OUT || '/tmp';
(async () => { const srv = await start(3122); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const U = 'http://localhost:3122';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['camera', 'microphone'] }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', name, e.message); }); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', name, m.text().slice(0, 200)); }); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs, name }; }
const A = await mk('Ama', 'ama.t'); A.p.on('response', async r => { if (/gcall/.test(r.url())) console.log('RESP', r.url().split('/api')[1], r.status(), (await r.text()).slice(0, 200)); }); const _x = 0; const  B = await mk('Kofi', 'kofi.t'), C = await mk('Efua', 'efua.t');
 async function befriend(X, Y, un) { console.log('befriend', X.name, un); await X.p.click('.top [data-a=add]'); await X.p.fill('#sq', un); await X.p.waitForSelector('[data-a=req]'); await X.p.waitForTimeout(500); await X.p.click('[data-a=req]', { force: true }); await X.p.waitForSelector('.modal [data-a=reqgo]'); await X.p.fill('#rnote', 'hi'); await X.p.click('.modal .pk[data-a=reqgo]'); await Y.p.waitForSelector('.top [data-a=add] .dot', { timeout: 8000 }); await Y.p.click('.top [data-a=add]'); await Y.p.click('#sr [data-a=accept]'); await Y.p.waitForTimeout(600); await Y.p.click('#sr [data-a=close]', { timeout: 1500 }).catch(() => {}); await X.p.waitForTimeout(2500); await X.p.click('#sr [data-a=close]', { timeout: 1500 }).catch(() => {}); }
 await befriend(A, B, 'kofi'); await befriend(A, C, 'efua'); await befriend(B, C, 'efua');
 await A.p.waitForTimeout(2500);
 await A.p.click('.nav [data-t=calls], .nav [data-a=tab][data-t=calls]').catch(async () => { await A.p.click('text=Calls'); });
 await A.p.waitForSelector('[data-a=gnew]'); await A.p.click('[data-a=gnew]'); await A.p.waitForSelector('.gpr');
 const rows = await A.p.$$('.gpr'); for (const r of rows) await r.click(); A.p.on('request', r => { if (/api/.test(r.url()) && !/sync/.test(r.url())) console.log('REQ', r.method(), r.url().split('/api')[1]); }); await A.p.click('#gpgo'); await A.p.waitForTimeout(4000); console.log('A GC', await A.p.evaluate(() => window.__gcs && window.__gcs()), await A.p.evaluate(() => (document.querySelector('.toast')||{}).textContent), 'A screen', await A.p.evaluate(() => !!document.querySelector('.call.grp'))); console.log('B', await B.p.evaluate(() => document.querySelector('.call') ? document.querySelector('.call').className : 'nocall'), await B.p.evaluate(() => fetch('/api/sync?since=0',{headers:{Authorization:'Bearer '+(localStorage.getItem('halo.tok')||'')}}).then(r=>r.text()).then(t=>JSON.parse(t).rows.map(function(r){return r.c}).join(',')).catch(e=>String(e))));
 await B.p.waitForSelector('[data-c=gaccept]', { timeout: 10000 }); await C.p.waitForSelector('[data-c=gaccept]', { timeout: 10000 });
 await B.p.screenshot({ path: OUT + '/g_incoming.png' });
 await B.p.click('[data-c=gaccept]'); await C.p.click('[data-c=gaccept]');
 let ok = false; for (let i = 0; i < 40; i++) { await A.p.waitForTimeout(500); const n = await A.p.evaluate(() => document.querySelectorAll('.ggrid .gtl:not(.rg)').length); const tx = await A.p.evaluate(() => Object.keys(window.__gcp ? window.__gcp() : {}).length); ok = n === 3; if (ok) break; }
 await A.p.waitForTimeout(3500);
 const peers = await Promise.all([A, B, C].map(x => x.p.evaluate(() => window.__gcs ? window.__gcs() : null)));
 console.log('tiles joined on A:', ok, 'peers', JSON.stringify(peers));
 // hand + reaction
 await B.p.click('[data-c=ghand]'); await C.p.click('[data-c=react]'); await C.p.click('[data-c=rx][data-e="\u{1F525}"]');
 await A.p.waitForTimeout(2500); const hand = await A.p.evaluate(() => !!document.querySelector('.ghand')), fe = await A.p.evaluate(() => document.querySelectorAll('.fe').length);
 console.log('hand visible on A:', hand, 'floating emoji on A:', fe);
 await A.p.screenshot({ path: OUT + '/g_call.png' });
 await A.p.click('[data-c=min]'); await A.p.waitForTimeout(300); const mini = await A.p.evaluate(() => !!document.querySelector('#cmin') && getComputedStyle(document.querySelector('.call')).display === 'none');
 await A.p.screenshot({ path: OUT + '/g_mini.png' }); await A.p.click('#cmin'); console.log('minimise works:', mini);
 await C.p.click('[data-c=gend]'); await A.p.waitForTimeout(3000); const n2 = await A.p.evaluate(() => document.querySelectorAll('.ggrid .gtl:not(.rg)').length); console.log('after Efua leaves, joined tiles on A:', n2);
 await A.p.click('[data-c=gend]'); await B.p.waitForTimeout(3000); console.log('B call screen gone:', await B.p.evaluate(() => !document.querySelector('.call')));
 console.log('errors', A.errs, B.errs, C.errs); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
