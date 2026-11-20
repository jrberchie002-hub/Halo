const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3157); const B = 'http://localhost:3157';
 const call = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const r = (await call(U.amy.t, 'POST', '/api/rank', { name: 'Crew', members: [] })).rank;
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.ben.t); await p.goto(B + '/?rank=' + r.id); await p.waitForSelector('#rk', { timeout: 8000 }); console.log('joined and opened', (await p.textContent('#rkt')).trim(), errs);
 const s = await call(U.amy.t, 'GET', '/api/sync?since=0'); console.log('members', s.rows.find(x => x.c === 'ranks').data.members.length); await b.close(); process.exit(0); })();
