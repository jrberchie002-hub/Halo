const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3196); const b = await chromium.launch(); let ok = true; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) ok = false; };
 for (const [n, ua] of [['safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'], ['snapchat', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.80.0'], ['android', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36']]) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2, userAgent: ua }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:3196'); await p.click('[data-s=new]'); await p.fill('#a_n', 'Ama'); await p.fill('#a_u', 'ama' + n); await p.fill('#a_p', 'pass1234'); await p.click('#a_go'); await p.click('[data-a=enter]'); await p.waitForSelector('.nav'); await p.waitForTimeout(800);
  await p.click('[data-a=install]'); await p.waitForSelector('.ihs'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => ({ steps: [...document.querySelectorAll('.ihst span')].map(x => x.textContent), arrow: !!document.querySelector('.ihar'), ow: document.documentElement.scrollWidth }));
  console.log(n, JSON.stringify(r)); ck(n + ': three steps', r.steps.length === 3); ck(n + ': no overflow', r.ow <= 390); ck(n + ': no errors', errs.length === 0);
  if (n === 'safari') ck('safari: arrow toward Share', r.arrow); if (n === 'snapchat') ck('in-app browser: says open in Safari', /Safari/.test(r.steps[0]) && !r.arrow);
  await p.screenshot({ path: '/tmp/prev4/inst-' + n + '.png' }); await c.close(); }
 console.log(ok ? 'ALL PASS' : 'SOME FAIL'); await b.close(); srv.close && srv.close(); process.exit(ok ? 0 : 1); })();
