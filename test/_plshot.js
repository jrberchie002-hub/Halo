const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const svg = (c) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="' + c + '"/></svg>');
 const T = (id, n, a, c) => ({ id: 'i' + id, name: n, artist: a, art: svg(c), dur: 200, remote: 1, prev: 'https://x/p.m4a', src: 'i' });
 const PL = [{ id: 'p1', name: 'Late night drive', tracks: [T(1, 'Kwaku the Traveller', 'Black Sherif', '#7b5cff'), T(2, 'Second Sermon', 'Black Sherif', '#d9a93b'), T(3, 'Soja', 'Burna Boy', '#3b7dd9')] }, { id: 'p2', name: 'Gym', tracks: [T(4, 'Push 2 Start', 'Tyla', '#d93b6a')] }, { id: 'p3', name: 'Empty one', tracks: [] }];
 for (const [n, w, h] of [['phone', 390, 800], ['desk', 1366, 768]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 500 })).newPage();
  await p.addInitScript((pl) => { localStorage.setItem('hm.pls', JSON.stringify(pl)); localStorage.setItem('hm.lt', 'pls'); localStorage.setItem('hm.view', 'lib'); }, PL);
  await p.route(/itunes|audius|googleapis|lrclib|halo-chats/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"results":[],"data":[]}' }));
  await p.goto('http://localhost:3199/'); await p.waitForTimeout(2200);
  await p.evaluate(() => { const l = document.querySelector('[data-a=nav][data-k=lib],[data-v=lib],#nav [data-a][data-k=lib]'); l && l.click(); }); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/prev4/pl-' + n + '-list.png' });
  await p.evaluate(() => { const o = document.querySelector('[data-a=openpl]'); o && o.click(); }); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/prev4/pl-' + n + '-detail.png' });
  await p.evaluate(() => { const o = document.querySelector('[data-a=plback]'); o && o.click(); }); await p.waitForTimeout(300); await p.evaluate(() => { const o = document.querySelector('[data-a=newpl]'); o && o.click(); }); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/prev4/pl-' + n + '-new.png' });
 } await b.close(); })();
