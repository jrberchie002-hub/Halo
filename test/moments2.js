const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3155); const B = 'http://localhost:3155'; let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}, names = ['ben', 'amy', 'cal', 'dee', 'eli', 'fay']; for (const n of names) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 for (const n of names.slice(1)) { await call(U[n].t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U[n].id }); }
 for (const [i, n] of names.slice(1).entries()) await call(U[n].t, 'POST', '/api/story', { text: 'Hello from ' + n, bg: i, ttl: i % 2 ? 72 : 24 });
 const bad = await call(U.ben.t, 'POST', '/api/story', { text: 'old one', bg: 2, ttl: 48 }); ck('2 day moment accepted', bad.story && bad.story.ttl === 48);
 const sm = await call(U.ben.t, 'POST', '/api/story', { text: 'weird ttl', bg: 1, ttl: 999 }); ck('odd length falls back to 24h', sm.story && sm.story.ttl === 24);
 const mem = await call(U.ben.t, 'GET', '/api/memories'); ck('memories lists my posts', mem.list && mem.list.length === 2);
 const oth = await call(U.amy.t, 'GET', '/api/memory?id=' + bad.story.id); ck('friend cannot read my memory', oth.ok !== true);
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => console.log('ERR', e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.ben.t); await p.goto(B + '/'); await p.waitForSelector('.nav', { timeout: 9000 }); await p.waitForTimeout(800);
 await p.evaluate(() => document.querySelector('[data-a=tab][data-t=stories]').click()); await p.waitForTimeout(1800);
 const o = await p.evaluate(() => ({ grid: document.querySelectorAll('.mgrid:not(.mm4) .tile').length, deck: !!document.querySelector('.deck'), mem: document.querySelectorAll('.mm4 .mt').length, over: document.documentElement.scrollWidth > innerWidth }));
 console.log(JSON.stringify(o)); ck('5 friends + mine -> compact grid', o.grid === 6 && !o.deck); ck('memories grid shown', o.mem === 2); ck('no overflow', !o.over);
 if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT, fullPage: false });
 await p.evaluate(() => document.querySelector('.mm4 .mt').click()); await p.waitForTimeout(800); ck('memory opens in viewer', await p.evaluate(() => !!document.querySelector('.sv')));
 await p.evaluate(() => document.querySelector('.sv [data-a=close], .sv .x, .sv button').click()); await p.waitForTimeout(300);
 await p.evaluate(() => document.querySelector('[data-a=compose]').click()); await p.waitForTimeout(500);
 ck('3 length options', await p.evaluate(() => document.querySelectorAll('.ttlr button').length === 3));
 await p.evaluate(() => document.querySelector('.ttlr [data-v="72"]').click()); ck('3 days selects', await p.evaluate(() => document.querySelector('.ttlr [data-v="72"]').classList.contains('on')));
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
