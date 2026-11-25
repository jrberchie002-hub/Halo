// A chat with a wallpaper must never let the chat list show through, even if the wallpaper photo fails to load.
const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3139); const b = await chromium.launch(); let bad = [];
 for (const theme of ['dark', 'light']) {
  const c = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, colorScheme: theme }); const p = await c.newPage();
  await p.route(/\/wp\//, r => r.abort());   // the wallpaper photo cannot load
  await p.addInitScript(() => { try { localStorage.setItem('halo.wp.all', 'img:rose'); } catch (e) {} });
  await p.goto('http://localhost:3139/?demo=1'); await p.waitForSelector('.nav', { timeout: 9000 });
  await p.click('[data-a=chat][data-id=k]'); await p.waitForTimeout(700);
  const r = await p.evaluate(() => { const sh = document.querySelector('.sheet[data-chat]'); const cs = getComputedStyle(sh); return { wp: sh.classList.contains('wpon'), bg: cs.backgroundColor }; });
  let a = 0; const m1 = r.bg.match(/^rgba?\(([^)]+)\)$/), m2 = r.bg.match(/^color\([a-z0-9-]+ ([^)]+)\)$/);
  if (m1) { const v = m1[1].split(',').map(Number); a = v.length > 3 ? v[3] : 1; } else if (m2) { const sl = m2[1].split('/'); a = sl.length > 1 ? Number(sl[1]) : 1; }
  console.log(theme, JSON.stringify(r), 'opaque:', a === 1); if (!r.wp || a !== 1) bad.push(theme);
  await c.close(); }
 await b.close(); srv.close && srv.close(); if (bad.length) { console.log('FAIL', bad); process.exit(1); } console.log('PASS: chat wallpaper always sits on a solid colour'); process.exit(0); })();
