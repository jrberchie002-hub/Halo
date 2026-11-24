// A voice note sent with no signal is never lost: it waits on the phone (even through closing the app) and arrives when the signal is back.
const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3145); const B = 'http://localhost:3145'; let fail = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) fail = 1; };
 const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const n = async () => ((await c(h.token, 'GET', '/api/sync?since=0')).rows || []).filter(r => r.c === 'msgs' && r.data.aud).length;
 const br = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] }); const ctx = await br.newContext({ viewport: { width: 390, height: 800 }, permissions: ['microphone'] }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 let down = true; await ctx.route(/\/api\/(send|cl)/, r => r.request().url().includes('/api/cl') ? (console.log('CL', decodeURIComponent(r.request().url().split('e=')[1].split('&')[0])), r.fulfill({ body: '{}' })) : down ? r.abort('internetdisconnected') : r.continue());
 await p.addInitScript(t => { localStorage.setItem('halo.tok', t); localStorage.setItem('halo.tour', '1'); }, a.token); await p.goto(B + '/'); await p.waitForSelector('.crow2'); await p.click('.crow2'); await p.waitForSelector('#mbtn');
 for (let i = 0; i < 2; i++) { await p.click('#mbtn'); await p.waitForTimeout(1500); await p.click('[data-a=recsend]'); await p.waitForTimeout(2500); }
 ck('both voice notes stay on screen while there is no signal (' + await p.$$eval('.b.vn', e => e.length) + ')', (await p.$$eval('.b.vn', e => e.length)) === 2);
 ck('none reached the server yet', (await n()) === 0);
 await p.close(); const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message)); await p2.goto(B + '/'); await p2.waitForSelector('.crow2'); await p2.click('.crow2'); await p2.waitForTimeout(1500);
 ck('after closing the app both are still waiting on screen (' + await p2.$$eval('.b.vn', e => e.length) + ')', (await p2.$$eval('.b.vn', e => e.length)) === 2);
 down = false; await p2.waitForTimeout(9000); console.log(await p2.evaluate(() => localStorage.getItem('halo.out')).then(s => String(s).slice(0, 400)));
 ck('signal back: both voice notes arrived on the server (' + await n() + ')', (await n()) === 2);
 ck('exactly two voice bubbles, none stuck (' + await p2.$$eval('.b.vn', e => e.length) + ')', (await p2.$$eval('.b.vn', e => e.length)) === 2);
 ck('no page errors ' + errs.join(' | '), !errs.length); await br.close(); console.log(fail ? 'FAILED' : 'ALL PASS'); process.exit(fail); })();
