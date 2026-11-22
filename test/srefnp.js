const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3159); const B = 'http://localhost:3159'; let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';
 const s = await call(U.ben.t, 'POST', '/api/story', { text: 'my moment', bg: 2, ttl: 24 });
 const r = await call(U.amy.t, 'POST', '/api/send', { to: U.ben.id, x: 'love this', sref: { i: s.story.id, n: 'ben', tn: png } }); ck('server keeps story reply card', r.msg && r.msg.sref && r.msg.sref.n === 'ben' && !!r.msg.sref.tn);
 await call(U.amy.t, 'POST', '/api/profile', { np: { song: 'Test Song', artist: 'Artist · Halo Music', link: '', hm: 'i12345678' } });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => console.log('ERR', e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.ben.t); await p.goto(B + '/'); await p.waitForSelector('.nav', { timeout: 9000 }); await p.waitForTimeout(1200);
 await p.evaluate(() => document.querySelector('.crow2').click()); await p.waitForTimeout(1500);
 ck('reply card with title, text and thumbnail', await p.evaluate(() => { const c = document.querySelector('.b.srf'); return !!c && /Replied to your moment/.test(c.innerText) && /love this/.test(c.innerText) && !!c.querySelector('img'); }));
 ck('listening strip with Join in chat header', await p.evaluate(() => !!document.querySelector('#sub .npj') && /Test Song/.test(document.querySelector('#sub').innerText)));
 ck('no overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
 if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
