const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3192); const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3192'); await p.click('[data-s=new]'); await p.fill('#a_n', 'Ama'); await p.fill('#a_u', 'ama.t'); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav');
 const top = async () => p.$$eval('.top .ic', e => e.map(x => x.dataset.a).join(','));
 const out = { chats: await top() }; for (const t of ['stories', 'music', 'calls', 'me']) { await p.click('[data-t=' + t + ']'); await p.waitForTimeout(250); out[t] = await top(); }
 await p.click('[data-t=music]'); await p.waitForSelector('.qp'); await p.click('[data-a=mhinfo]'); await p.waitForTimeout(200); await p.screenshot({ path: process.env.OUT + '/n1.png' });
 await p.fill('#spl2', 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'); await p.click('[data-a=qpaste]'); await p.waitForTimeout(1200); await p.screenshot({ path: process.env.OUT + '/n2.png' });
 console.log(out, errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
