const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3195); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const U = 'http://localhost:3195';
 async function mk(name, un) { const c = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['camera', 'microphone'] }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.click('[data-s=new]'); await p.fill('#a_n', name); await p.fill('#a_u', un); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); return { p, errs }; }
 const A = await mk('Ama', 'ama.t'), B = await mk('Kofi', 'kofi.t');
 await A.p.click('.top [data-a=add]'); await A.p.fill('#sq', 'kofi'); await A.p.waitForSelector('[data-a=req]'); await A.p.waitForTimeout(500); await A.p.click('[data-a=req]', { force: true }); await A.p.waitForSelector('.modal [data-a=reqgo]'); await A.p.fill('#rnote', 'hey it is me'); await A.p.click('.modal .pk[data-a=reqgo]');
 await B.p.waitForSelector('.top [data-a=add] .dot', { timeout: 6000 }); await B.p.click('.top [data-a=add]'); await B.p.click('#sr [data-a=accept]');
 await B.p.waitForSelector('[data-a=chat]', { timeout: 6000 }); await A.p.click('#sr [data-a=close]'); await A.p.waitForSelector('[data-a=chat]', { timeout: 6000 });
 await A.p.click('[data-a=chat]'); await B.p.waitForTimeout(500); await B.p.click('[data-a=chat]');
 const ck = (n, c) => console.log(c ? 'PASS' : 'FAIL', n);
 const J = o => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
 await A.p.addInitScript(() => { window.__src = []; window.__open = 0; window.open = () => { window.__open++; return null; }; HTMLMediaElement.prototype.play = function () { window.__src.push(this.src.slice(0, 90)); return Promise.resolve(); }; HTMLMediaElement.prototype.pause = function () {}; });
 await A.p.route(/api\.audius\.co\/v1\/tracks\/search/, r => { const q = decodeURIComponent(r.request().url()); const second = /Second/.test(q); r.fulfill(J({ data: [{ id: second ? 'AUD2' : 'AUD1', title: second ? 'Second Song' : 'Push to Start', user: { name: 'Tyla' }, duration: 200, is_streamable: true, artwork: {} }] })); });
 await A.p.route(/api\.audius\.co\/v1\/tracks\/trending/, r => r.fulfill(J({ data: [1, 2, 3].map(n => ({ id: 'QK' + n, title: 'My Own Pick ' + n, user: { name: 'Countryside Flute Music Official Channel Worldwide' }, duration: 180, is_streamable: true, artwork: {} })) })));
 await A.p.reload(); await A.p.waitForSelector('.nav'); await A.p.waitForTimeout(800);
 const tok = await B.p.evaluate(() => localStorage.getItem('halo.tok'));
 const np = (song, hm) => B.p.evaluate(async ([t, song, hm]) => { const r = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t, 'x-halo-token': t }, body: JSON.stringify({ np: { song, artist: 'Tyla · Halo Music', link: '', hm } }) }); return r.status; }, [tok, song, hm]);
 console.log('np status', await np('Push to Start', 'i12345678'));
 let join = null; for (let i = 0; i < 14 && !join; i++) { await A.p.waitForTimeout(1000); join = await A.p.$('[data-a=hmjoin]'); }
 ck('A sees Join for her friend', !!join);
 await A.p.evaluate(() => document.querySelector('[data-a=hmjoin]').click()); await A.p.waitForTimeout(1800);
 const r1 = await A.p.evaluate(() => ({ open: window.__open, src: window.__src.slice(-1)[0], mini: !!document.querySelector('.mini:not([hidden])'), txt: (document.querySelector('.mini') || {}).innerText || '', nav: !!document.querySelector('.nav'), url: location.pathname }));
 console.log(JSON.stringify(r1).slice(0, 300));
 ck('does not open another page', r1.open === 0 && r1.url === '/'); ck('stays in chats (nav still there)', r1.nav);
 ck('plays the full Audius song', /v1\/tracks\/AUD1\/stream/.test(r1.src || '')); ck('mini player says who she is listening with', /Listening with Kofi/.test(r1.txt)); await A.p.screenshot({ path: '/tmp/prev4/join-start.png' }); const mh = await A.p.evaluate(() => Math.round(document.querySelector('.mini').getBoundingClientRect().height)); const hid = await A.p.evaluate(() => getComputedStyle(document.querySelector('.mini .mctl')).display === 'none');
 ck('mini starts slim (' + mh + 'px) with controls hidden', mh <= 60 && hid); ck('slim row has its own play/pause', await A.p.evaluate(() => { const b = document.querySelector('.mini .lpq'); return !!b && getComputedStyle(b).display !== 'none'; }));
 await A.p.evaluate(() => document.querySelector('.mini [data-a=minitog]').click()); await A.p.waitForTimeout(400);
 const open1 = await A.p.evaluate(() => ({ ctl: getComputedStyle(document.querySelector('.mini .mctl')).display !== 'none', h: Math.round(document.querySelector('.mini').getBoundingClientRect().height) })); ck('tapping reveals the controls (' + open1.h + 'px)', open1.ctl && open1.h <= 120); await A.p.screenshot({ path: '/tmp/prev4/mini-open.png' });
 await A.p.waitForTimeout(8800); ck('hides again by itself after a few seconds', await A.p.evaluate(() => getComputedStyle(document.querySelector('.mini .mctl')).display === 'none'));
 await A.p.evaluate(() => document.querySelector('.mini [data-a=minitog]').click()); await A.p.waitForTimeout(300); await A.p.mouse.click(200, 400); await A.p.waitForTimeout(300); ck('tapping elsewhere hides it too', await A.p.evaluate(() => getComputedStyle(document.querySelector('.mini .mctl')).display === 'none'));

 await np('Second Song', 'i12345679'); let moved = false; for (let i = 0; i < 16 && !moved; i++) { await A.p.waitForTimeout(1000); moved = await A.p.evaluate(() => window.__src.some(s => /AUD2\/stream/.test(s))); }
 ck('follows her to the next song', moved); await A.p.screenshot({ path: '/tmp/prev4/join-mini.png' });
 await A.p.evaluate(() => document.querySelector('[data-a=jlstop]').click()); await A.p.waitForTimeout(1500);
 ck('Leave closes the mini player', await A.p.evaluate(() => { const m = document.querySelector('.mini'); return !m || m.hidden; }));
 await A.p.waitForTimeout(800); let j2 = null; for (let i = 0; i < 12 && !j2; i++) { await A.p.waitForTimeout(800); j2 = await A.p.$('[data-a=hmjoin]'); } await A.p.evaluate(() => document.querySelector('[data-a=hmjoin]').click()); await A.p.waitForTimeout(1500);
 ck('rejoined her', await A.p.evaluate(() => /Listening with Kofi/.test((document.querySelector('.mini') || {}).innerText || '')));
 await A.p.evaluate(() => document.querySelector('.mini [data-a=miniset]').click()); await A.p.waitForSelector('#qsr [data-a=jlpick]', { timeout: 6000 }); ck('change-song search opens inside the chat (no new page)', await A.p.evaluate(() => window.__open === 0 && !!document.querySelector('.nav')));
 await A.p.evaluate(() => document.querySelector('#qsr [data-a=jlpick]').click()); await A.p.waitForTimeout(1500);
 const own = await A.p.evaluate(() => ({ src: window.__src.slice(-1)[0], txt: (document.querySelector('.mini') || {}).innerText || '' })); ck('plays my own pick', /QK1\/stream/.test(own.src || '')); ck('no longer following her', !/Listening with/.test(own.txt)); await A.p.screenshot({ path: '/tmp/prev4/join-own.png' });
 await A.p.waitForTimeout(2500); const ids = await A.p.evaluate(() => [...document.querySelectorAll('.mini:not([hidden]) [data-a]')].map(x => x.dataset.a).join(','));
 console.log('mini buttons:', ids); ck('long artist name still gets Previous, Pause and Next', /lpprev/.test(ids) && /lpp\b/.test(ids) && /lpnext/.test(ids));
 await A.p.evaluate(() => document.querySelector('.mini [data-a=lpnext]').click()); await A.p.waitForTimeout(1200); ck('Next moves to the next song', await A.p.evaluate(() => /QK2\/stream/.test(window.__src.slice(-1)[0])));
 await A.p.waitForTimeout(2500); ck('buttons are still there after Next', await A.p.evaluate(() => !!document.querySelector('.mini:not([hidden]) [data-a=lpprev]')));
 await A.p.evaluate(() => document.querySelector('.mini [data-a=lpprev]').click()); await A.p.waitForTimeout(1200); ck('Previous goes back', await A.p.evaluate(() => /QK1\/stream/.test(window.__src.slice(-1)[0])));
 await np('Third Song', 'i12345680'); await A.p.waitForTimeout(8000); ck('her next change does not override my song', await A.p.evaluate(() => !window.__src.some(s => /AUD3\/stream/.test(s)) && /QK1\/stream/.test(window.__src.slice(-1)[0] || '')));
 await B.p.evaluate(() => { window.__src = []; window.__open = 0; window.open = () => { window.__open++; return null; }; HTMLMediaElement.prototype.play = function () { window.__src.push(this.src.slice(0, 90)); return Promise.resolve(); }; HTMLMediaElement.prototype.pause = function () {}; });
 let bj = null; for (let i = 0; i < 14 && !bj; i++) { await B.p.waitForTimeout(1000); bj = await B.p.evaluate(() => { const e = document.querySelector('[data-a=hmjoin]'); return e ? e.dataset.id : null; }); }
 ck('her friend (Kofi) sees my song with a Join button', bj === 'aQK1'); await B.p.evaluate(() => document.querySelector('[data-a=hmjoin]').click()); await B.p.waitForTimeout(1500);
 ck('Kofi joining plays my exact song in his chat', await B.p.evaluate(() => window.__open === 0 && window.__src.some(s => /QK1\/stream/.test(s))));
 let sawL = false; for (let i = 0; i < 25 && !sawL; i++) { await A.p.waitForTimeout(1000); sawL = await A.p.evaluate(() => /Kofi listening/.test((document.querySelector('.mini:not([hidden])') || {}).innerText || '')); } console.log('DBG', await A.p.evaluate(async () => { const r = await fetch('/api/sync?since=0&only=stories', { headers: { authorization: 'Bearer ' + localStorage.getItem('halo.tok') } }).then(r => r.json()); return JSON.stringify(r.me.lis) + ' mini=' + ((document.querySelector('.mini') || {}).innerText || '').replace(/\n/g, '|'); })); ck('Ama sees that Kofi is listening along', sawL);
 const atok = await A.p.evaluate(() => localStorage.getItem('halo.tok')); await A.p.evaluate(async (t) => { await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t, 'x-halo-token': t }, body: JSON.stringify({ np: null }) }); }, atok);
 let stopped = false; for (let i = 0; i < 60 && !stopped; i++) { await B.p.waitForTimeout(1000); stopped = await B.p.evaluate(() => !/Listening with/.test((document.querySelector('.mini:not([hidden])') || {}).innerText || '')); }
 ck('when she stops sharing, his listening stops', stopped);
 ck('no sideways overflow', await A.p.evaluate(() => document.documentElement.scrollWidth <= 390)); console.log(A.errs, B.errs);
 await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
