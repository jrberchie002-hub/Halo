const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await c.newPage();
 const ALL = [1,2,3].map(r => ({ trackId: r, trackName: 'Song ' + r, artistName: 'Artist', collectionName: 'A', artworkUrl100: '', previewUrl: 'https://x/p.m4a', trackTimeMillis: 2e5 }));
 await p.addInitScript(() => { window.__sh = null; navigator.share = d => { window.__sh = d; return Promise.resolve(); }; });
 await p.route(/itunes\.apple\.com|rss\.apple|audius|googleapis|lrclib|halo-chats|\.m4a/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(/rss/.test(r.request().url()) ? { feed: { results: ALL.map(t => ({ id: String(t.trackId) })) } } : { results: ALL, data: [] }) }));
 await p.goto('http://localhost:3199/'); await p.waitForTimeout(3500); await p.click('.inst button', { timeout: 1000 }).catch(() => {});
 await p.click('.row >> nth=0'); await p.waitForTimeout(500); await p.click('#mini [data-a=open]'); await p.waitForTimeout(500); const t0 = Date.now(); await p.click('#pl [data-a=shr]'); await p.waitForTimeout(150);
 const d = await p.evaluate(() => window.__sh); console.log('share called after', Date.now() - t0, 'ms:', JSON.stringify(d)); await b.close(); process.exit(d && d.url ? 0 : 1); })();
