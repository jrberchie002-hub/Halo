const { chromium } = require('playwright'); const O = process.env.OUT || '/tmp';
const svg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%237b5cff"/></svg>');
const T = (id, n, a) => ({ trackId: id, trackName: n, artistName: a, collectionName: n, artworkUrl100: svg, previewUrl: 'https://x/p' + id + '.m4a', trackTimeMillis: 200000, kind: 'song' });
const ALL = [T(1, 'Golden Hour Drive', 'Kwame Lane'), T(2, 'Midnight Lagos', 'Ada Waves')];
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 const J = o => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
 const LRC = Array.from({ length: 10 }, (_, i) => '[00:' + String(i * 4).padStart(2, '0') + '.00] This is lyric line number ' + (i + 1) + ' of the song').join('\n');
 await p.route(/itunes\.apple\.com\/search|itunes\.apple\.com\/lookup/, r => r.fulfill(J({ results: ALL })));
 await p.route(/rss\.applemarketingtools/, r => r.fulfill(J({ feed: { results: ALL.map(t => ({ id: String(t.trackId) })) } })));
 await p.route(/lrclib/, r => r.fulfill(J({ syncedLyrics: LRC, plainLyrics: '' })));
 await p.route(/api\.audius\.co|googleapis|youtube|halo-chats/, r => r.fulfill(J({ data: [], items: [] })));
 await p.route(/\/p\d+\.m4a/, r => r.abort());
 await p.addInitScript(() => { window.__sh = null; navigator.canShare = () => true; navigator.share = d => { (d.files || []).forEach(f => { const r = new FileReader(); r.onload = () => { window['__img_' + f.name] = r.result; }; r.readAsDataURL(f); }); window.__sh = { files: (d.files || []).map(f => f.name + ':' + f.size), text: d.text }; return Promise.resolve(); }; });
 await p.goto('http://localhost:3199/'); await p.waitForTimeout(3000);
 await p.evaluate(() => document.querySelectorAll('[data-a=pick]')[0].click()); await p.waitForTimeout(2500);
 await p.evaluate(() => document.querySelector('#mini [data-a=open]').click()); await p.waitForTimeout(600);
 // plain song share
 await p.evaluate(() => document.querySelector('#pl [data-a=shr]').click()); await p.waitForTimeout(400); console.log('song share', JSON.stringify(await p.evaluate(() => window.__sh)));
 await p.evaluate(() => { window.__sh = null; const bt = document.createElement('button'); bt.dataset.a = 'lyr'; bt.style.display = 'none'; document.querySelector('#pl').appendChild(bt); bt.click(); }); await p.waitForTimeout(900);
 console.log('ly', await p.evaluate(() => { const o = document.querySelector('#ly'); return o ? 'exists hidden=' + o.hidden + ' html=' + o.innerHTML.slice(0, 120) : 'none'; })); await p.evaluate(() => document.querySelector('[data-a=lysh]').click()); await p.waitForTimeout(300);
 await p.evaluate(() => { const ps = document.querySelectorAll('#ly .lyb p'); ps[2].click(); ps[3].click(); }); await p.waitForTimeout(900);
 await p.screenshot({ path: O + '/ly_select.png' });
 console.log('bar hidden?', await p.$eval('#lybar', e => e.hidden), await p.$eval('#lybar button', e => e.textContent));
 await p.evaluate(() => document.querySelector('[data-a=lyshare]').click()); await p.waitForTimeout(300);
 await p.waitForTimeout(500); for (const n of ['halo-lyrics.png', 'halo-music.png']) { const d = await p.evaluate(k => window['__img_' + k], n); if (d) require('fs').writeFileSync(O + '/' + n, Buffer.from(d.split(',')[1], 'base64')); }
 console.log('lyric share', JSON.stringify(await p.evaluate(() => window.__sh)), 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errs', errs); process.exit(0); })();
