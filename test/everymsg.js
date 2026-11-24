// Every message stays: lost rows come back from the backup copy, a capped first sync never removes messages from the screen, the whole chat loads.
const dev = require('../dev.js'); const { chromium } = require('playwright');
let fails = 0; const ck = (n, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) fails++; };
(async () => { await dev.start(3211); const B = 'http://localhost:3211';
 const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'naa', name: 'Naa', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const cid = [a.me.id, h.me.id].sort().join('|');
 const T0 = Date.now() - 6 * 36e5; for (let i = 0; i < 120; i++) { const t = T0 + i * 60000, id = cid + '~' + String(t).padStart(14, '0') + 'aa', m = { id, chat: cid, from: i % 2 ? h.me.id : a.me.id, t, x: 'msg ' + i }; await dev.store.put('msgs', id, m); await dev.store.put('msgbak', id, m); }
 const sent = (await dev.store.chatMsgs(cid)).length; console.log('sent', sent);
 // simulate the live table losing 100 rows while the backup copies stay
 const st = dev.store; const rows = await st.chatMsgs(cid); rows.sort((x, y) => x.data.t - y.data.t); for (const r of rows.slice(0, 100)) await st.del('msgs', r.id);
 ck('live table really lost 100 rows', (await st.chatMsgs(cid)).length === 20);
 const br = await chromium.launch(); const pg = await (await br.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
 await pg.goto(B + '/'); await pg.evaluate(t => { localStorage.setItem('halo.tok', t); localStorage.setItem('halo.tour', '1'); }, a.token); await pg.goto(B + '/?dbg=1');
 await pg.waitForTimeout(2500); await pg.evaluate(id => window.__S && 0, h.me.id);
 await pg.locator('text=Naa').first().click(); await pg.waitForTimeout(9000);
 const shown = await pg.evaluate(() => Array.from(document.querySelectorAll('#ms .b')).map(e => e.textContent));
 ck('all 120 messages on screen (got ' + shown.filter(x => /msg \d+/.test(x)).length + ')', [...Array(120).keys()].every(i => shown.some(x => x.includes('msg ' + i))));
 ck('server put the 100 lost rows back', (await st.chatMsgs(cid)).length === 120);
 await pg.reload(); await pg.waitForTimeout(3000); await pg.locator('text=Naa').first().click(); await pg.waitForTimeout(4000);
 const shown2 = await pg.evaluate(() => Array.from(document.querySelectorAll('#ms .b')).filter(e => /msg \d+/.test(e.textContent)).length);
 ck('after closing and opening the app they are all still there (got ' + shown2 + ')', shown2 === 120);
 await pg.evaluate(() => { const d = JSON.parse(localStorage.getItem('halo.snap')); d.stamp = 0; localStorage.setItem('halo.snap', JSON.stringify(d)); }); await pg.reload(); await pg.waitForTimeout(3500); await pg.locator('text=Naa').first().click(); await pg.waitForTimeout(1500);
 const shown3 = await pg.evaluate(() => Array.from(document.querySelectorAll('#ms .b')).filter(e => /msg \d+/.test(e.textContent)).length);
 ck('a full first sync (server sends only the newest 40) does not cut the chat (got ' + shown3 + ')', shown3 === 120);
 ck('no page errors ' + errs.join(' | '), !errs.length);
 await br.close(); console.log(fails ? 'FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
