const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3146); const B = 'http://localhost:3146';
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['microphone'] }); const p = await ctx.newPage();
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(500);
 await p.click('.crow2'); await p.click('#mbtn'); await p.waitForTimeout(1500); await p.click('[data-a=recsend]'); await p.waitForTimeout(3000);
 const j = await call(U.ben.t, 'GET', '/api/sync?since=0'); await p.click('.b.vn .vp'); await p.waitForTimeout(800); await p.dispatchEvent('.b.vn', 'contextmenu'); await p.click('[data-a=mreact][data-e="🔥"]'); await p.waitForTimeout(700); console.log('voice msgs', j.rows.filter(r => r.c === 'msgs' && r.data.aud).length, 'btn', await p.textContent('.b.vn .vp'), 'rx', await p.$$eval('.b.vn .rx', e => e.map(x => x.textContent))); await b.close(); process.exit(0); })();
