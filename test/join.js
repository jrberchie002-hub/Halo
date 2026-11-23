const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3149); const B = 'http://localhost:3149'; let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const r = await call(U.amy.t, 'POST', '/api/profile', { np: { song: 'Test Song', artist: 'Some Artist · Halo Music', link: '', hm: 'i12345678', art: '' } }); ck('server keeps hm id', r.me && r.me.np && r.me.np.hm === 'i12345678');
 const bad = await call(U.amy.t, 'POST', '/api/profile', { np: { song: 'X', artist: 'Y', hm: 'javascript:1' } }); ck('server drops bad hm', !(bad.me.np && bad.me.np.hm));
 await call(U.amy.t, 'POST', '/api/profile', { np: { song: 'Test Song', artist: 'Some Artist · Halo Music', link: '', hm: 'i12345678' } });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => console.log('ERR', e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.ben.t); await p.goto(B + '/'); await p.waitForSelector('.nav', { timeout: 9000 }); await p.waitForTimeout(1500);
 ck('Join shown, no wordy text', await p.evaluate(() => !!document.querySelector('[data-a=hmjoin]') && !/is playing|Join to listen/.test(document.body.innerText)));
 ck('no version on chats list', await p.evaluate(() => !/Halo version 21\./.test(document.body.innerText)));
 if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
