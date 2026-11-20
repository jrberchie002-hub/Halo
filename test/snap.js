const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3118); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage(); const errs = []; p.on('console', m => /SNAP/.test(m.text()) && console.log(m.text())); p.on('pageerror', e => errs.push(e.message));
 const r = await p.request.post('http://localhost:3118/api/signup', { data: { name: 'Snap', username: 'snapper', password: 'pass1234' } }); const j = await r.json(); if (!j.token) { console.log('signup', JSON.stringify(j).slice(0, 200)); process.exit(1); }
 await p.goto('http://localhost:3118/'); await p.evaluate(t => localStorage.setItem('halo.tok', t), j.token); await p.reload(); await p.waitForSelector('.nav'); await p.waitForTimeout(3500);
 console.log('snap saved', await p.evaluate(() => { try { return String(localStorage.getItem('halo.snap')).length + ' ' + typeof snapSave + ' ' + !!localStorage.getItem('halo.tok'); } catch (e) { return String(e); } }));
 await p.route('**/api/sync*', rt => setTimeout(() => rt.continue(), 3000));
 const t0 = Date.now(); await p.reload(); await p.waitForSelector('.nav'); console.log('open ms with slow server:', Date.now() - t0, 'errors', errs); await b.close(); process.exit(0); })();
