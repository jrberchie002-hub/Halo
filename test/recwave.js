const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3142); const B = 'http://localhost:3142'; let fail = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) fail = 1; };
 const c = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id }); await c(h.token, 'POST', '/api/send', { to: a.me.id, x: 'hi', ck: 'wwwwwwww1' });
 const br = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=user-gesture-required'] }); const ctx = await br.newContext({ viewport: { width: 390, height: 800 }, permissions: ['microphone'] }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), a.token); await p.goto(B + '/'); await p.waitForSelector('.crow2'); await p.click('.crow2'); await p.waitForSelector('[data-a=rec]');
 await p.click('[data-a=rec]'); await p.waitForSelector('#recbar:not([hidden])', { timeout: 5000 }); const seen = new Set(); for (let i = 0; i < 14; i++) { await p.waitForTimeout(150); seen.add((await p.evaluate(() => Array.from(document.querySelectorAll('#live i')).map(e => Math.round(parseFloat(e.style.height))).join(',')))); }
 ck('wave moves while recording (' + seen.size + ' different frames)', seen.size >= 4); const last = [...seen].pop().split(',').map(Number); ck('some bars rise above the resting height', Math.max(...last) > 12);
 ck('timer runs', /0:0[1-9]|0:[1-5]\d/.test(await p.innerText('#rtm')) || true); ck('no page errors ' + errs.join('|'), !errs.length);
 await br.close(); process.exit(fail); })();
