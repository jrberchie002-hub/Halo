const { chromium } = require('playwright'); const O = process.env.OUT || '/tmp';
const svg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#7b5cff"/></svg>');
const T = (id, n, a, al) => ({ wrapperType: 'track', trackId: id, trackName: n, artistName: a, collectionName: al || n, artworkUrl100: svg, previewUrl: 'https://x/p' + id + '.m4a', trackTimeMillis: 199000, kind: 'song' });
const DRAKE = [T(1, "God's Plan", 'Drake', 'Scorpion'), T(2, 'Hotline Bling', 'Drake', 'Views'), T(3, 'One Dance', 'Drake', 'Views'), T(4, "God's Plan (Karaoke Version)", 'Drake', 'Karaoke Hits')];
const FANS = [T(9, "God's Plan", 'Lima Ft Friend', 'Singles'), T(10, "God's Plan (Piano Tribute)", 'Vitamin String Quartet', 'Tribute to Drake')];
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 const J = o => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
 await p.route(/itunes\.apple\.com\/search/, r => { const u = new URL(r.request().url()), e = u.searchParams.get('entity'), t = (u.searchParams.get('term') || '').toLowerCase(); if (e === 'musicArtist') return r.fulfill(J({ results: /^drake$/.test(t) ? [{ artistId: 271256, artistName: 'Drake', primaryGenreName: 'Hip-Hop/Rap' }] : [] })); r.fulfill(J({ results: [...(t.includes('drake') ? DRAKE : []), ...FANS] })); });
 await p.route(/itunes\.apple\.com\/lookup/, r => r.fulfill(J({ results: [{ wrapperType: 'artist', artistName: 'Drake' }, ...DRAKE] })));
 await p.route(/rss\.applemarketingtools/, r => r.fulfill(J({ feed: { results: [] } })));
 await p.route(/api\.audius\.co\/v1\/tracks\/search/, r => r.fulfill(J({ data: [{ id: 'FAN1', title: "God's Plan", user: { name: 'Lima', is_verified: false }, duration: 199, is_streamable: true }] })));
 await p.route(/googleapis\.com\/youtube\/v3\/search/, r => r.fulfill(J({ items: [
   { id: { videoId: 'FAKE1' }, snippet: { title: "Drake - God's Plan (Cover by Lima ft his friend)", channelTitle: 'Lima Music' } },
   { id: { videoId: 'FAKE2' }, snippet: { title: "God's Plan - Drake (full song)", channelTitle: 'SomeRandom' } },
   { id: { videoId: 'REAL1' }, snippet: { title: "God's Plan", channelTitle: 'Drake - Topic' } },
   { id: { videoId: 'REAL2' }, snippet: { title: "Drake - God's Plan (Official Audio)", channelTitle: 'DrakeVEVO' } }] })));
 await p.route(/googleapis\.com\/youtube\/v3\/videos/, r => r.fulfill(J({ items: [{ id: 'FAKE1', contentDetails: { duration: 'PT3M40S' } }, { id: 'FAKE2', contentDetails: { duration: 'PT3M19S' } }, { id: 'REAL1', contentDetails: { duration: 'PT3M19S' } }, { id: 'REAL2', contentDetails: { duration: 'PT3M20S' } }] })));
 await p.route(/lrclib|youtube\.com|halo-chats/, r => r.fulfill(J({ data: [] })));
 await p.route(/\/p\d+\.m4a/, r => r.abort());
 await p.goto('http://localhost:3199/'); await p.waitForTimeout(3000);
 await p.evaluate(() => document.querySelector('.sbt').click()); await p.waitForTimeout(400);
 await p.fill('#q', 'drake'); await p.waitForTimeout(2500);
 console.log('rows', await p.$$eval('.vw.on .row, .vw.on .t1', e => e.map(x => x.textContent.slice(0, 60)).join(' || ')));
 await p.screenshot({ path: O + '/ar_search.png' });
 const bad = await p.$$eval('.vw.on .row, .vw.on .t1', e => e.filter(x => /Lima|Vitamin|Karaoke|Tribute/i.test(x.textContent)).length); console.log('fakes in search', bad); if (bad) process.exitCode = 1;
 await p.fill('#q', 'zzqxartist'); await p.waitForTimeout(2500); console.log('empty', await p.$eval('.vw.on .tip', e => e.textContent)); await p.fill('#q', 'drake'); await p.waitForTimeout(2500);
 await p.evaluate(() => document.querySelector('.art1').click()); await p.waitForTimeout(1500);
 await p.screenshot({ path: O + '/ar_profile.png' });
 console.log('profile rows', await p.$$eval('#apb .row b', e => e.map(x => x.textContent).join(' | ')));
 await p.evaluate(() => document.querySelector('[data-a=apall]').click()); await p.waitForTimeout(2500);
 console.log('yt picks', await p.evaluate(() => localStorage.getItem('hm.yt2')));
 console.log('overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errs', errs); process.exit(0); })();
