const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { await start(3151); const B = 'http://localhost:3151'; const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const a = await c(null, 'POST', '/api/signup', { username: 'amazz', name: 'Ama', password: 'pass1234' }), k = await c(null, 'POST', '/api/signup', { username: 'kofizz', name: 'Kofi', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: k.me.id }); await c(k.token, 'POST', '/api/friend', { to: a.me.id }); await c(a.token, 'POST', '/api/profile', { np: { song: 'Luta', artist: 'Asake · Halo Music', link: '', hm: 'aAbc123' } });
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 700 } })).newPage();
 await p.addInitScript(() => { HTMLMediaElement.prototype.play = function () { this._pl = 1; this.dispatchEvent(new Event('play')); return Promise.resolve(); }; Object.defineProperty(HTMLMediaElement.prototype, 'paused', { get() { return !this._pl; } }); });
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), k.token); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(1200);
 await p.evaluate(() => document.querySelector('[data-a=hmjoin],[data-a=jljoin]') && document.querySelector('[data-a=hmjoin],[data-a=jljoin]').click()); await p.waitForTimeout(800);
 console.log(await p.evaluate(() => (document.querySelector('.mini') || {}).innerText)); await p.screenshot({ path: '/tmp/prev4/stop.png' }); await b.close(); process.exit(0); })();
