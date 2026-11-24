// Big photos/voice notes that arrive as "Loading" must all fill in, including ones only in the backup copy.
const dev = require('../dev.js'); const { chromium } = require('playwright');
let fails = 0; const ck = (n, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) fails++; };
(async () => { await dev.start(3213); const B = 'http://localhost:3213', st = dev.store;
 const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'naa', name: 'Naa', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const cid = [a.me.id, h.me.id].sort().join('|'), T0 = Date.now() - 36e5, px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
 const ids = []; for (let i = 0; i < 12; i++) { const t = T0 + i * 60000, id = cid + '~' + String(t).padStart(14, '0') + 'bb', m = { id, chat: cid, from: i % 2 ? h.me.id : a.me.id, t, x: 'pic ' + i, img: px + '#' + 'A'.repeat(350000) }; ids.push(id); await st.put('msgs', id, m); await st.put('msgbak', id, m); }
 for (const id of ids.slice(2, 5)) await st.del('msgs', id); // three exist only in the backup copy
 const br = await chromium.launch(); const pg = await (await br.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
 await pg.goto(B + '/'); await pg.evaluate(t => { localStorage.setItem('halo.tok', t); localStorage.setItem('halo.tour', '1'); }, a.token); await pg.goto(B + '/?dbg=1');
 await pg.waitForTimeout(2500); await pg.locator('text=Naa').first().click(); await pg.waitForTimeout(12000);
 const dbg = await pg.evaluate(() => { const o = []; Object.values(window.__S ? window.__S.msgs : {}).forEach(l => l.forEach(m => { if (m.stub || /pic [234]$/.test(m.x)) o.push(m.x + ' stub=' + m.stub + ' hf=' + m.hf + ' img=' + String(m.img).slice(0, 10)); })); return o; }); console.log('stubs', dbg);
 const r = await pg.evaluate(() => { const b = Array.from(document.querySelectorAll('#ms .b')); return { loading: b.filter(e => /Loading|Could not load/.test(e.textContent)).length, imgs: document.querySelectorAll('#ms img').length }; });
 ck('nothing left on Loading (' + r.loading + ')', r.loading === 0);
 ck('all 12 photos shown (' + r.imgs + ')', r.imgs >= 12);
 ck('no page errors ' + errs.join(' | '), !errs.length);
 await br.close(); console.log(fails ? 'FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
