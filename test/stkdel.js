const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3158); const B = 'http://localhost:3158'; let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const u = {}; for (const n of ['ann', 'bob']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); u[n] = { t: j.token || j.t, id: (j.me || j.user || {}).id }; }
 await call(u.bob.t, 'POST', '/api/friend', { to: u.ann.id }); await call(u.ann.t, 'POST', '/api/friend', { to: u.bob.id });
 const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';
 await call(u.ann.t, 'POST', '/api/send', { to: u.bob.id, img: png, stk: 1 }); await call(u.ann.t, 'POST', '/api/send', { to: u.bob.id, x: 'gone soon' }); const del = await call(u.ann.t, 'GET', '/api/chat?with=' + u.bob.id);
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true })).newPage(); p.on('pageerror', e => console.log('ERR', e.message));
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), u.ann.t); await p.goto(B + '/'); await p.waitForSelector('.nav', { timeout: 9000 }); await p.waitForTimeout(600);
 await p.evaluate(id => document.querySelector('[data-a=chat2],[data-a=chat]') && 0, u.bob.id);
 await p.evaluate(id => { const e = document.querySelector('[data-a=chat][data-id="' + id + '"]'); e && e.click(); }, u.bob.id); await p.waitForTimeout(1000);
 const has = await p.evaluate(() => !!document.querySelector('#ms .stkimg')); ck('sticker shown', has);
 if (has) { const bx = await (await p.$('#ms .stkimg')).boundingBox(); await p.evaluate(() => document.querySelector('#ms .stkimg').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))); await p.waitForTimeout(400); ck('menu offers delete for everyone', await p.evaluate(() => !!document.querySelector('[data-a=mdel]'))); await p.evaluate(() => document.querySelector('[data-a=mdel]') && document.querySelector('[data-a=mdel]').click()); await p.waitForTimeout(800); ck('sticker replaced by deleted note', await p.evaluate(() => !document.querySelector('#ms .stkimg') && !!document.querySelector('#ms .delnote'))); }
 await p.screenshot({ path: '/tmp/sd.png' }); console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
