process.env.ADMIN_USERNAME = 'boss'; const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3180); const B = 'http://localhost:3180'; const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'text/plain', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const ck = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
 const j = await c(null, 'POST', '/api/signup', { username: 'boss', name: 'Boss', password: 'pass1234' });
 for (let i = 0; i < 6; i++) await c(null, 'POST', '/api/ht/play', { id: 'abcdef1234' + i, name: 'Song ' + i, artist: 'Art' });
 for (let i = 0; i < 6; i++) await c(null, 'POST', '/api/ht/play', { id: 'abcdef12340', name: 'Song 0', artist: 'Art' });
 await c(j.token, 'POST', '/api/admin/claim', { pin: 'secretpin1' });
 const o = await c(j.token, 'GET', '/api/admin/overview'); const L = o.live || {};
 ck('total counted with replay cap (6 + 2 extra = 8)', L.total === 8); ck('unique listener once', L.listeners === 1); ck('top list', (L.top || []).length >= 1 && L.people === 1);
 const br = await chromium.launch(); const p = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), j.token); await p.goto(B + '/#admin'); await p.waitForSelector('.nav'); await p.waitForTimeout(500);
 await p.evaluate(() => { openAdmin ? 0 : 0; }).catch(() => {}); await p.evaluate(() => document.querySelector('[data-a=tab][data-t=me]').click()); await p.waitForTimeout(300);
 await p.evaluate(() => document.querySelector('[data-a=settings]').click()); await p.waitForTimeout(600); await p.evaluate(() => { const l = document.querySelectorAll('[data-a=sec][data-k=Calls]'); l[l.length - 1].click(); }); await p.waitForTimeout(300);
 const has = await p.evaluate(() => !!document.querySelector('[data-a=admin]')); console.log('admin button on me tab:', has);
 if (has) { await p.evaluate(() => document.querySelector('[data-a=admin]').click()); await p.waitForSelector('#adm', { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(600); const t = await p.textContent('#adm').catch(() => ''); ck('live tab shows goal', /of 30,000 streams/.test(t) && /online now/.test(t)); ck('no sideways scroll', await p.evaluate(() => document.documentElement.scrollWidth <= 390)); await p.screenshot({ path: '/tmp/live.png' }); }
 ck('no page errors', !errs.length); await br.close(); process.exit(0); })();
