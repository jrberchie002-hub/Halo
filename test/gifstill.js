// A GIF/sticker on screen never blinks or moves: the same image stays through redraws, nothing shifts sideways.
const dev = require('../dev.js'); const { chromium } = require('playwright');
let fails = 0; const ck = (n, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) fails++; };
(async () => { await dev.start(3217); const B = 'http://localhost:3217', st = dev.store;
 const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'naa', name: 'Naa', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
 const br = await chromium.launch(); const pg = await (await br.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
 await pg.addInitScript(t => { localStorage.setItem('halo.tok', t); localStorage.setItem('halo.tour', '1'); }, a.token); await pg.goto(B + '/'); await pg.waitForSelector('.crow2'); await pg.click('.crow2'); await pg.waitForTimeout(1500);
 await c(h.token, 'POST', '/api/send', { to: a.me.id, img: px, stk: 1, ck: 'gifk000001' }); await c(h.token, 'POST', '/api/send', { to: a.me.id, gif: px, ck: 'gifk000002' }); await pg.waitForTimeout(3000);
 await pg.evaluate(() => { window.__imgs = Array.from(document.querySelectorAll('#ms img')); window.__x = []; setInterval(() => window.__x.push(document.querySelector('#ms').scrollLeft + document.documentElement.scrollLeft + Math.round(document.querySelector('#th').getBoundingClientRect().left)), 100); });
 for (let i = 0; i < 6; i++) { await c(h.token, 'POST', '/api/typing', { to: a.me.id }).catch(() => {}); await c(h.token, 'POST', '/api/send', { to: a.me.id, x: 'text ' + i, ck: 'txtk00000' + i }); await pg.waitForTimeout(2000); }
 console.log(await pg.evaluate(() => window.__imgs.map(e => e.outerHTML.slice(0, 160) + ' conn=' + e.isConnected).join('\n') + '\nNOW ' + Array.from(document.querySelectorAll('#ms img')).map(e => e.outerHTML.slice(0, 160)).join('\n')));
 const r = await pg.evaluate(() => ({ n: window.__imgs.length, same: window.__imgs.every(e => e.isConnected), x: Array.from(new Set(window.__x)) }));
 ck('the GIF and sticker are on screen (' + r.n + ')', r.n >= 1);
 ck('the same GIF/sticker stayed through new messages and typing (no reload, no blink)', r.same);
 ck('chat never moved sideways (left positions seen: ' + r.x.join(',') + ')', r.x.length === 1 && r.x[0] === 0);
 ck('no page errors ' + errs.join(' | '), !errs.length); await br.close(); console.log(fails ? 'FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
