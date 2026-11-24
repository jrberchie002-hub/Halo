const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3143); const B = 'http://localhost:3143'; let fail = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) fail = 1; };
 const c = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 for (let i = 0; i < 6; i++) await c(i % 2 ? h.token : a.token, 'POST', '/api/send', { to: i % 2 ? a.me.id : h.me.id, x: 'line ' + i, ck: 'lockinn' + i });
 const br = await chromium.launch(); const p = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), a.token); await p.goto(B + '/?dbg=1'); await p.waitForSelector('.crow2'); await p.click('.crow2'); await p.waitForSelector('.b'); await p.waitForTimeout(600);
 const count = () => p.evaluate(() => Array.from(document.querySelectorAll('.b')).filter(e => /line \d/.test(e.textContent)).length);
 ck('six messages shown', (await count()) === 6);
 await p.route(/\/api\/(sync|history)/, r => r.abort()); await p.evaluate(() => { const S = window.__S, cid = Object.keys(S.msgs)[0]; S.msgs[cid] = S.msgs[cid].slice(4); }); // pretend the list was wiped down to 2 by a bad sync
 await p.click('[data-a=back]').catch(() => p.click('.bar .ic')); await p.waitForTimeout(400); await p.click('.crow2'); await p.waitForSelector('.b'); await p.waitForTimeout(500);
 ck('all six come back on screen after the list was cut', (await count()) === 6); ck('the lock-in noticed and counted it', await p.evaluate(() => window.__S.keepFix >= 1));
 await p.evaluate(() => { const S = window.__S, cid = Object.keys(S.msgs)[0]; S.msgs[cid].push({ id: 'x~1', chat: cid, from: S.me.id, t: Date.now(), x: 'last line', tmp: 'zz' }); });
 ck('no page errors ' + errs.join('|'), !errs.length); await br.close(); process.exit(fail); })();
