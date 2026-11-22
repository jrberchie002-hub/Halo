const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p.goto('http://localhost:3199/'); await p.waitForTimeout(2500);
 const seen = new Set(); for (let i = 0; i < 14; i++) { seen.add(await p.evaluate(() => (document.querySelector('.vw[data-v=home] .hi b') || {}).textContent)); await p.waitForTimeout(1000); }
 const ok = seen.size >= 3 && seen.has('What are we playing?') && !(await p.evaluate(() => /Music lives here/.test(document.querySelector('.vw[data-v=home]').innerText)));
 console.log([...seen].join(' | ')); console.log(ok ? 'HERO OK' : 'HERO FAIL'); await b.close(); process.exit(ok ? 0 : 1); })();
