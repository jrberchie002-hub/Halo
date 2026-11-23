const { start } = require('../dev.js');
(async () => { await start(3190); const B = 'http://localhost:3190'; const c = async (t, m, p, b) => { const t0 = process.hrtime.bigint(); const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); const j = await r.json().catch(() => ({})); return { s: r.status, ms: Number(process.hrtime.bigint() - t0) / 1e6, ...j }; };
 const N = +process.env.N || 200, U = []; const t0 = Date.now();
 for (let i = 0; i < N; i++) U.push(await c(null, 'POST', '/api/signup', { username: 'lu' + i, name: 'User ' + i, password: 'pass1234' }));
 console.log('signup', N, 'users in', Date.now() - t0, 'ms', 'failed:', U.filter(u => !u.token).length);
 for (let i = 0; i < N; i++) { const o = U[(i + 1) % N], o2 = U[(i + 7) % N]; await c(U[i].token, 'POST', '/api/friend', { to: o.me.id }); await c(o.token, 'POST', '/api/friend', { to: U[i].me.id }); await c(U[i].token, 'POST', '/api/friend', { to: o2.me.id }); await c(o2.token, 'POST', '/api/friend', { to: U[i].me.id }); }
 const pct = (a, p) => { a = a.slice().sort((x, y) => x - y); return Math.round(a[Math.floor(a.length * p)] || 0); };
 const sends = [], syncs = [], searches = [], errs = { n: 0 };
 const rounds = 15; const t1 = Date.now();
 for (let r = 0; r < rounds; r++) await Promise.all(U.map(async (u, i) => { const to = U[(i + 1) % N].me.id; const a = await c(u.token, 'POST', '/api/send', { to, x: 'hello ' + r + ' from ' + i, ck: 'k' + r + 'x' + i + 'abcdefgh' }); sends.push(a.ms); if (a.s !== 200) errs.n++; const s = await c(u.token, 'GET', '/api/sync?since=0'); syncs.push(s.ms); if (s.s !== 200) errs.n++; if (r % 5 === 0) { const q = await c(u.token, 'GET', '/api/search?q=user%201'); searches.push(q.ms); } }));
 console.log('messages', sends.length, 'in', Date.now() - t1, 'ms; errors', errs.n);
 console.log('send ms  p50', pct(sends, .5), 'p95', pct(sends, .95), 'max', pct(sends, .999));
 console.log('sync ms  p50', pct(syncs, .5), 'p95', pct(syncs, .95), 'max', pct(syncs, .999));
 console.log('search ms p50', pct(searches, .5), 'p95', pct(searches, .95));
 process.exit(0); })();
