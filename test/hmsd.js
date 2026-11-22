const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true }); const p = await c.newPage();
 const T = r => ({ trackId: r, trackName: 'Song ' + r, artistName: 'Artist ' + (r % 3), collectionName: 'A', artworkUrl100: '', previewUrl: 'https://x/p.m4a', trackTimeMillis: 200000 });
 await p.route(/itunes\.apple\.com|rss\.apple|audius|googleapis|lrclib|halo-chats/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ resultCount: 12, results: Array.from({ length: 12 }, (_, i) => T(i + 1)), data: [] }) }));
 await p.goto('http://localhost:3199/'); await p.waitForTimeout(3500); await p.click('.inst button', { timeout: 1000 }).catch(() => {});
 let bad = [];
 await p.click('.sbt'); await p.waitForTimeout(400);
 const r = await p.evaluate(() => { const s = document.querySelector('.vw[data-v=search]'), h = document.querySelector('.vw[data-v=home]'), rc = s.getBoundingClientRect(); return { fixed: getComputedStyle(s).position, homeOn: h.classList.contains('on'), top: rc.top, h: rc.height, ih: innerHeight }; });
 console.log('search', JSON.stringify(r)); if (r.fixed !== 'fixed' || !r.homeOn || r.top > 1 || r.h > r.ih * 0.85) bad.push('overlay');
 await p.keyboard.press('Escape'); await p.waitForTimeout(300);
 const r2 = await p.evaluate(() => ({ on: !!document.querySelector('.vw[data-v=search].on'), ins: document.body.classList.contains('insrch') })); if (r2.on || r2.ins) bad.push('close');
 // end of list: bottom padding equals the real dock height (no extra dark space)
 const r3 = await p.evaluate(() => ({ pb: Math.round(parseFloat(getComputedStyle(document.querySelector('#main')).paddingBottom)), dock: Math.round(document.querySelector('#dock').offsetHeight) + 8 }));
 console.log('end', JSON.stringify(r3)); if (Math.abs(r3.pb - r3.dock) > 2) bad.push('pad ' + r3.pb + ' vs ' + r3.dock);
 console.log(bad.length ? 'SD FAIL ' + bad : 'SD OK'); await b.close(); process.exit(bad.length ? 1 : 0); })();
