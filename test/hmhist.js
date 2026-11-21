const { chromium } = require('playwright'); const O = process.env.OUT;
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 const ALL = [1,2,3].map(i => ({ trackId: i, trackName: 'Funky ' + i, artistName: 'Dave', collectionName: 'A', artworkUrl100: '', previewUrl: 'https://x/p.m4a', trackTimeMillis: 2e5 }));
 await p.route(/itunes\.apple\.com|rss\.apple|audius|googleapis|lrclib|halo-chats/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(/rss/.test(r.request().url()) ? { feed: { results: ALL.map(t => ({ id: String(t.trackId) })) } } : { results: ALL, data: [] }) }));
 await p.goto('http://localhost:3199/'); await p.waitForTimeout(3500); await p.click('.inst button', { timeout: 1000 }).catch(() => {});
 await p.screenshot({ path: O + '/hm_logo.png', clip: { x: 0, y: 0, width: 390, height: 110 } });
 await p.click('.sbt'); await p.fill('#q', 'dave'); await p.waitForTimeout(1500); await p.click('[data-a=sback]'); await p.waitForTimeout(300); await p.click('.sbt'); await p.waitForTimeout(300); await p.screenshot({ path: O + '/hm_rs.png' });
 const n = await p.$$eval('.rsr', r => r.length), chips = await p.$$eval('.fl button', r => r.map(x => x.textContent).join(',')); console.log('recent:', n, 'chips:', chips, 'errs', errs); await b.close(); })();
