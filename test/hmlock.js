const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true }); const p = await c.newPage();
 const T = r => ({ trackId: r, trackName: 'Song ' + r, artistName: 'Artist ' + (r % 3), collectionName: 'A', artworkUrl100: '', previewUrl: 'https://x/p.m4a', trackTimeMillis: 2e5 }); const ALL = [1,2,3,4,5,6,7,8,9,10,11,12].map(T);
 await p.route(/itunes\.apple\.com|rss\.apple|audius|googleapis|lrclib|halo-chats/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(/rss/.test(r.request().url()) ? { feed: { results: ALL.map(t => ({ id: String(t.trackId) })) } } : { results: ALL, data: [] }) }));
 await p.goto('http://localhost:3199/'); await p.waitForTimeout(3500); await p.click('.inst button', { timeout: 1000 }).catch(() => {});
 let bad = [];
 for (const v of ['home', 'lib', 'set']) { await p.click('[data-a=nav][data-k=' + v + ']'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const m = document.querySelector('#main'); m.scrollLeft = 200; window.scrollTo(300, 0); document.documentElement.scrollLeft = 300; document.body.scrollLeft = 300; return { dw: document.documentElement.scrollWidth, iw: innerWidth, mw: m.scrollWidth, mc: m.clientWidth, ml: m.scrollLeft, wx: window.scrollX, bl: document.body.scrollLeft }; });
  console.log(v, JSON.stringify(r)); if (r.dw > r.iw || r.mw > r.mc || r.ml || r.wx || r.bl) bad.push(v); }
 console.log(bad.length ? 'LOCK FAIL ' + bad : 'LOCK OK'); await b.close(); process.exit(bad.length ? 1 : 0); })();
