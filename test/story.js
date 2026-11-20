const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3143); const B = 'http://localhost:3143';
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 await call(U.amy.t, 'POST', '/api/friend', { to: U.ben.id }); await call(U.ben.t, 'POST', '/api/friend', { to: U.amy.id });
 console.log('story', (await call(U.ben.t, 'POST', '/api/story', { text: 'hello moment', bg: 2 })).ok);
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), U.amy.t); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(700);
 await p.tap('.stories .st[data-id]'); await p.waitForTimeout(500); console.log('viewer from chats row', !!(await p.$('.sv')), await p.$eval('.sv', e => e.textContent.slice(0, 40)).catch(() => ''));
 await p.tap('[data-sv=x]'); await p.tap('.nav [data-t=stories]'); await p.waitForTimeout(300); await p.tap('.tile'); await p.waitForTimeout(500); console.log('viewer from tile', !!(await p.$('.sv')), errs);
 await p.screenshot({ path: '/tmp/sv.png' }); await b.close(); process.exit(0); })();
