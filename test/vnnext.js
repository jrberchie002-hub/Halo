const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3147); const B = 'http://localhost:3147';
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
 const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['microphone'] }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(500);
 await p.click('.crow2');
 for (let i = 0; i < 2; i++) { await p.click('#mbtn'); await p.waitForTimeout(1600); await p.click('[data-a=recsend]'); await p.waitForTimeout(2500); }
 // ben opens
 const q = await ctx.newPage(); await q.addInitScript(t => localStorage.setItem('halo.tok', t), U.ben.t); await q.goto(B + '/'); await q.waitForSelector('.nav'); await q.waitForTimeout(800); await q.click('.crow2'); await q.waitForTimeout(800);
 const n = await q.$$eval('.b.vn', e => e.length); const ok = (l, c) => console.log(c ? 'PASS' : 'FAIL', l);
 ok('two voice notes arrived', n === 2);
 await q.click('.b.vn >> nth=0 >> .vp'); await q.waitForTimeout(500);
 const first = await q.$$eval('.b.vn .vp', e => e.map(x => x.textContent));
 let seen2 = false; for (let i = 0; i < 40; i++) { await q.waitForTimeout(150); const st = await q.$$eval('.b.vn .vp', e => e.map(x => x.textContent)); if (st[1] === '❚❚' && st[0] === '▶') { seen2 = true; break; } }
 console.log(first);
 ok('second plays after first ends', seen2);
 ok('no page errors', !errs.length); await b.close(); process.exit(0); })();
