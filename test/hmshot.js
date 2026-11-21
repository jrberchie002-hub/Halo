const { chromium } = require('playwright'); const S = process.env.OUT; const steps = (process.env.STEPS || 'home').split(',');
const svg = (c) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="${c}"/></svg>`);
const T = (id, n, a, c, al) => ({ trackId: id, trackName: n, artistName: a, collectionName: al || n, artworkUrl100: svg(c), previewUrl: 'https://x/p' + id + '.m4a', trackTimeMillis: 200000, kind: 'song' });
const ALL = [T(1, 'Funky Friday', 'Dave', '#3a2a8e'), T(2, 'Starlight', 'Dave', '#7a3a8e'), T(3, 'Location', 'Dave', '#2a6a8e'), T(4, 'Light the Rave', 'Wavy Kay', '#8e3a3a'), T(5, 'Forgiveness', 'Ashake', '#2a8e5a'), T(6, 'Sing Dem Songs', 'Dave Ghana Mix', '#8e7a2a'), T(7, 'Dave - Dreams', 'Dream Team', '#555')];
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.route(/itunes\.apple\.com\/search/, r => { const t = new URL(r.request().url()).searchParams.get('term') || ''; r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ results: /dave/i.test(t) ? ALL : ALL.slice(3) }) }); });
 await p.route(/rss\.applemarketingtools/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ feed: { results: ALL.map(t => ({ id: String(t.trackId) })) } }) }));
 await p.route(/itunes\.apple\.com\/lookup/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ results: ALL }) }));
 await p.route(/api\.audius\.co|googleapis|lrclib|youtube|halo-chats/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"data":[]}' }));
 await p.route(/\/p\d+\.m4a/, r => r.abort());
 await p.goto('http://localhost:3199/'); await p.waitForTimeout(3500); await p.click('.inst button', { timeout: 1500 }).catch(() => {});
 const sh = async n => { await p.waitForTimeout(400); await p.screenshot({ path: S + '/hm_' + n + '.png' }); };
 for (const s of steps) {
  if (s === 'home') await sh('home');
  if (s === 'search') { await p.click('[data-k=search]'); await p.fill('#q', 'dave'); await p.waitForTimeout(1500); await sh('search'); }
  if (s === 'player') { await p.click('.row >> nth=0'); await p.waitForTimeout(800); await sh('mini'); await p.click('#mini [data-a=open]'); await p.waitForTimeout(600); await sh('player'); }
  if (s === 'add') { await p.click('.row >> nth=0'); await p.waitForTimeout(500); await p.click('#mini [data-a=open]'); await p.waitForTimeout(500); await p.click('#pl [data-a=addpl]').catch(async () => { await p.click('[data-a=pick]'); }); await sh('add'); }
  if (s === 'lib') { await p.click('[data-k=lib]'); await sh('lib'); } if (s === 'set') { await p.click('[data-k=set]'); await sh('set'); }
 }
 console.log('errs', errs); await b.close(); })();
