const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3199); const B = 'http://localhost:3199'; const c = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, ...(await r.json().catch(() => ({}))) }; }; const ck = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'her', name: 'Her', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const n = 1100000, hdr = Buffer.alloc(44); hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + n, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22); hdr.writeUInt32LE(16000, 24); hdr.writeUInt32LE(32000, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(n, 40);
 const mkaud = (i) => 'data:audio/wav;base64,' + Buffer.concat([hdr, Buffer.alloc(n, i + 1)]).toString('base64');
 await c(a.token, 'POST', '/api/send', { to: h.me.id, x: 'first small', ck: 'cccccccc0' });
 for (let i = 0; i < 3; i++) { const r = await c(a.token, 'POST', '/api/send', { to: h.me.id, aud: mkaud(i), dur: 30, ck: 'cccccccc' + (i + 1) }); if (!r.ok) console.log('send fail', r.s, r.error); }
 for (let i = 0; i < 4; i++) await c(h.token, 'POST', '/api/send', { to: a.me.id, x: 'reply ' + i, ck: 'dddddddd' + i });
 const s = await c(h.token, 'GET', '/api/sync?since=0'); const ms = (s.rows || []).filter(r => r.c === 'msgs'); console.log('first sync msgs', ms.length, 'stubs', ms.filter(r => r.data.stub).length, 'bytes', JSON.stringify(s).length);
 ck('nothing dropped (8 messages)', ms.length === 8); ck('response under 4.5MB', JSON.stringify(s).length < 4300000);
 const br = await chromium.launch(); const p = await (await br.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p.addInitScript(t => localStorage.setItem('halo.tok', t), h.token); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(1500);
 await p.evaluate(() => document.querySelector('.crow2').click()); await p.waitForTimeout(9000);
 const t = await p.evaluate(() => ({ vn: document.querySelectorAll('.b.vn').length, loading: [...document.querySelectorAll('.b')].filter(x => /^Loading/.test(x.textContent)).length, text: /first small/.test(document.body.innerText) }));
 console.log(t); ck('3 voice notes shown after loading', t.vn === 3 && t.loading === 0); ck('oldest small message still there', t.text);
 await br.close(); process.exit(0); })();
