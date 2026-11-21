const real = global.fetch; const rss = (cc) => ({ feed: { results: Array.from({ length: 6 }, (_, i) => ({ id: String(cc === 'gh' ? 100 + i : 100 + ((i + 2) % 6)), name: cc === 'ng' && i === 5 ? 'तेरे बिना' : 'Song ' + (100 + i), artistName: 'Artist ' + i, artworkUrl100: 'https://is1-ssl.mzstatic.com/a/100x100bb.jpg' })) } });
global.fetch = (u, o) => { u = String(u); if (/rss\.applemarketingtools/.test(u)) return Promise.resolve({ json: () => Promise.resolve(rss(u.split('/v2/')[1].slice(0, 2))) }); if (/itunes\.apple\.com\/lookup/.test(u)) return Promise.resolve({ json: () => Promise.resolve({ results: u.split('id=')[1].split(',').map(i => ({ trackId: +i, previewUrl: 'https://audio-ssl.itunes.apple.com/' + i + '.m4a', trackTimeMillis: 200000 })) }) }); return real(u, o); };
const { start } = require('../dev.js');
(async () => { const srv = await start(3138); const B = 'http://localhost:3138';
 await fetch(B + '/api/ht/play', { method: 'POST', body: JSON.stringify({ id: 'i104', name: 'Song 104', artist: 'Artist 4', art: 'https://is1-ssl.mzstatic.com/x.jpg', prev: 'https://audio-ssl.itunes.apple.com/104.m4a', full: 200 }) });
 const j = await fetch(B + '/api/ht/top?p=trend').then(r => r.json());
 console.log(j.songs.map(s => s.id + ':' + s.name + (s.prev ? '' : ' NOPREV')).join(' | ')); process.exit(0); })();
