const { chromium } = require('playwright'); const { start, store } = require('../dev.js');
(async () => { await start(3203); const B = 'http://localhost:3203'; const c = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, ...(await r.json().catch(() => ({}))) }; }; const ck = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 await c(h.token, 'POST', '/api/send', { to: a.me.id, x: 'before', ck: 'eeeeeeee01' });
 const cid = [a.me.id, h.me.id].sort().join('|');
 const br = await chromium.launch(); const p = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p.addInitScript(t => localStorage.setItem('halo.tok', t), a.token); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(1500);
 await p.evaluate(() => document.querySelector('.crow2').click()); await p.waitForTimeout(1500);
 // a normal message later, so the app's sync stamp moves ahead
 await c(h.token, 'POST', '/api/send', { to: a.me.id, x: 'normal one', ck: 'eeeeeeee02' }); await p.waitForTimeout(3500);
 // now a message whose save "finishes late": its stamp is 60 seconds in the past
 const t = Date.now() - 60000, id = cid + '~' + String(t).padStart(14, '0') + 'zz'; await store.put('msgs', id, { id, chat: cid, from: h.me.id, t, x: 'LATE message', __u: t * 1000 });
 await p.waitForTimeout(3500); const early = await p.evaluate(() => /LATE message/.test(document.body.innerText)); console.log('shown by normal sync alone:', early);
 await p.waitForTimeout(23000); const later = await p.evaluate(() => /LATE message/.test(document.body.innerText)); ck('late-landing message appears via catch-up', later);
 const miss = await p.evaluate(() => [...document.querySelectorAll('#ms [data-id]')].length); console.log('bubbles', miss);
 await br.close(); process.exit(0); })();
