const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); let ok = true; const ck = (n, v) => { console.log(v ? 'ok  ' : 'FAIL', n); if (!v) ok = false; };
 for (const [acc, exp] of [[null, '#7b5cff'], ['#e03a46', '#e03a46'], ['#141214', '#7b5cff']]) { const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); if (acc) await p.addInitScript(a => localStorage.setItem('halo.acc', a), acc);
  await p.goto('http://localhost:3199/'); await p.waitForTimeout(2500); const v = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--a').trim()); ck('accent ' + (acc || 'default') + ' -> ' + v, v === exp);
  if (acc === '#e03a46') { const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundImage); ck('background glow follows (' + /224,58,70|rgba\(224/.test(bg) + ')', /224, ?58, ?70/.test(bg)); await p.screenshot({ path: '/tmp/red.png' }); } await p.close(); }
 console.log(ok ? 'THEME OK' : 'THEME FAIL'); await b.close(); process.exit(ok ? 0 : 1); })();
