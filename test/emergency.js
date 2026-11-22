const { chromium } = require('playwright'); const { start } = require('../dev.js'); const fs = require('fs');
(async () => { const srv = await start(3162); const B = 'http://localhost:3162/?demo=1'; let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 const app = fs.readFileSync(__dirname + '/../public/app.js', 'utf8'); const H = { 'access-control-allow-origin': '*' };
 async function run(mode) { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage(); let loads = 0; p.on('framenavigated', f => { if (f === p.mainFrame()) loads++; });
  await p.route('https://halo-music.vercel.app/chat/emergency.json', r => r.fulfill({ contentType: 'application/json', headers: H, body: mode === 'off' ? '{"on":false}' : JSON.stringify({ on: true, code: '99.0', js: 'https://halo-music.vercel.app/chat/app.js' }) }));
  await p.route('https://halo-music.vercel.app/chat/app.js*', r => r.fulfill({ contentType: 'application/javascript', headers: H, body: mode === 'bad' ? 'this is not ( valid js' : app.replace(/CODE = '[0-9.]+'/, "CODE = '99.0'") }));
  await p.goto(B); await p.waitForTimeout(6500); await p.waitForSelector('.nav', { timeout: 8000 }).catch(() => {});
  const o = await p.evaluate(() => ({ em: window.HALO_EM || '', bad: localStorage.getItem('halo.embad') || '', nav: !!document.querySelector('.nav') })); await b.close(); return { ...o, loads }; }
 const off = await run('off'); console.log(JSON.stringify(off)); ck('off: normal app runs', !off.em && off.nav && off.loads === 1);
 const on = await run('on'); console.log(JSON.stringify(on)); ck('on: emergency bundle runs, one reload', on.em === '99.0' && on.nav && on.loads === 2);
 const bad = await run('bad'); console.log(JSON.stringify(bad)); ck('bad bundle falls back to normal app', !bad.em && bad.bad === '99.0' && bad.nav);
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
