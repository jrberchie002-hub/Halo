const dev = require('../dev.js'); const { chromium } = require('playwright');
let fails = 0; const ck = (n, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) fails++; };
(async () => { await dev.start(3214); const B = 'http://localhost:3214', st = dev.store;
 const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'naa', name: 'Naa', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const cid = [a.me.id, h.me.id].sort().join('|'), d = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
 const T0 = Date.now() - 3 * 864e5; for (let i = 0; i < 4; i++) { const t = T0 + i * 1000, id = cid + '~' + String(t).padStart(14, '0') + 'cc', m = { id, chat: cid, from: i % 2 ? h.me.id : a.me.id, t, x: i === 0 ? 'original text https://example.com' : 'reply ' + i, ...(i === 3 ? { re: { id: cid + '~' + String(T0).padStart(14, '0') + 'cc', f: a.me.id, x: 'original text' } } : {}) }; await st.put('msgs', id, m); await st.put('msgbak', id, m); }
 await st.put('chats', cid, { id: cid, a: a.me.id, b: h.me.id, streak: 12, streakDay: d(2), days: {}, r: {} });
 const br = await chromium.launch(); const pg = await (await br.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
 await pg.addInitScript(t => { localStorage.setItem('halo.tok', t); localStorage.setItem('halo.tour', '1'); }, a.token); await pg.goto(B + '/'); await pg.waitForSelector('.crow2'); await pg.click('.crow2'); await pg.waitForTimeout(2500);
 ck('chat shows Restore streak without a halo ring', await pg.$eval('#keepw', e => /Restore streak/.test(e.textContent) && !e.querySelector('.sring')).catch(() => false));
 ck('reply quote is tappable', !!(await pg.$('.qt[data-a=qjump]')));
 await pg.click('.qt[data-a=qjump]'); await pg.waitForTimeout(400); ck('tapping the quote highlights the original', !!(await pg.$('.b.qflash')));
 await pg.click('#keepw button'); await pg.waitForTimeout(1200); ck('profile opens with a restore button', !!(await pg.$('[data-a=srest]')));
 await pg.click('[data-a=srest]'); await pg.waitForTimeout(1200); const ch = await st.get('chats', cid); ck('streak restored (12 days, alive)', ch.streak === 12 && ch.streakDay === d(1));
 const again = await c(a.token, 'POST', '/api/streak/restore', { to: h.me.id }); ck('cannot double-restore', again.ok);
 ck('no page errors ' + errs.join(' | '), !errs.length); await br.close(); console.log(fails ? 'FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
