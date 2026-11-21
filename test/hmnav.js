const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); let ok = true;
 for (const vp of [{ width: 1366, height: 768 }, { width: 390, height: 800 }]) { const c = await b.newContext({ viewport: vp }); const p = await c.newPage();
  const ALL = Array.from({ length: 30 }, (_, i) => ({ trackId: i + 1, trackName: 'Song ' + i, artistName: 'Artist ' + i, collectionName: 'A', artworkUrl100: '', previewUrl: 'https://x/p.m4a', trackTimeMillis: 2e5 }));
  await p.route(/itunes\.apple\.com|rss\.apple|audius|googleapis|lrclib|halo-chats/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(/rss/.test(r.request().url()) ? { feed: { results: ALL.map(t => ({ id: String(t.trackId) })) } } : { results: ALL, data: [] }) }));
  await p.goto('http://localhost:3199/'); await p.waitForTimeout(3500); await p.click('.inst button', { timeout: 1000 }).catch(() => {});
  const g = await p.evaluate(() => { const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, r: b.right, c: (b.left + b.right) / 2 }; }; return { app: r('#app'), nav: r('#nav'), main: r('#main'), vw: innerWidth, sb: document.querySelector('#main').offsetWidth - document.querySelector('#main').clientWidth }; });
  console.log(vp.width, JSON.stringify(g)); if (Math.abs(g.app.c - g.nav.c) > 1 || g.sb) ok = false;
  await p.evaluate(() => { document.querySelector('#main').scrollTop = 300; }); await p.waitForTimeout(400); const hid = await p.evaluate(() => document.querySelector('#dock').classList.contains('nh'));
  await p.evaluate(() => { document.querySelector('#main').scrollTop = 200; }); await p.waitForTimeout(400); const shown = await p.evaluate(() => !document.querySelector('#dock').classList.contains('nh'));
  console.log('hides on scroll down:', hid, 'shows on scroll up:', shown); if (!hid || !shown) ok = false; if (vp.width === 1366) await p.screenshot({ path: process.env.OUT + '/hm_desk.png' }); await c.close(); }
 console.log(ok ? 'NAV OK' : 'NAV FAIL'); await b.close(); process.exit(ok ? 0 : 1); })();
