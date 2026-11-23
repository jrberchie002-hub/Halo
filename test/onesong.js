const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3150); const B = 'http://localhost:3150';
 const call = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const j = await call(null, 'POST', '/api/signup', { username: 'kofizz', name: 'Kofi', password: 'pass1234' });
 await call(j.token, 'POST', '/api/profile', { np: { song: 'Luta', artist: 'Asake', link: '', hm: 'aAbc123' } });
 const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.addInitScript(() => { HTMLMediaElement.prototype.play = function () { this._pl = 1; this.dispatchEvent(new Event('play')); return Promise.resolve(); }; Object.defineProperty(HTMLMediaElement.prototype, 'paused', { get() { return !this._pl; } }); HTMLMediaElement.prototype.pause = function () { this._pl = 0; this.dispatchEvent(new Event('pause')); }; });
 await p.addInitScript(t => localStorage.setItem('halo.tok', t), j.token); await p.goto(B + '/'); await p.waitForSelector('.nav'); await p.waitForTimeout(1000);
 const ck = (n, c) => console.log(c ? 'PASS' : 'FAIL', n);
 await p.click('.mini [data-a=myplay]'); await p.waitForTimeout(400);
 ck('chat playing', await p.evaluate(() => !document.querySelector('.mini .lpq svg path[d*="M8 5l"]')));
 await p.evaluate(() => { document.querySelectorAll('audio'); });
 // another app (music) sets a different np after chat started: shift LP start back so the guard passes
 await call(j.token, 'POST', '/api/profile', { np: { song: 'Other song', artist: 'Z · Halo Music', link: '' } });
 await p.evaluate(() => window.dispatchEvent(new Event('focus')));
 const st = await p.evaluate(async () => { const r = await fetch('/api/sync?since=0&only=stories', { headers: { authorization: 'Bearer ' + localStorage.getItem('halo.tok') } }).then(r => r.json()); return r.me.np.song; });
 ck('server has other song', st === 'Other song');
 console.log('errs', errs.length); await b.close(); process.exit(0); })();
