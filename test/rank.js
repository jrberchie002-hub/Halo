const { start } = require('../dev.js');
(async () => { const srv = await start(3140); const B = 'http://localhost:3140';
 const call = async (t, m, p, b) => { const r = await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
 const U = {}; for (const n of ['amy', 'ben', 'cal']) { const j = await call(null, 'POST', '/api/signup', { username: n + 'zz', name: n, password: 'pass1234' }); U[n] = { t: j.token, id: j.me.id }; }
 for (const n of ['ben', 'cal']) { await call(U.amy.t, 'POST', '/api/friend', { to: U[n].id }); await call(U[n].t, 'POST', '/api/friend', { to: U.amy.id }); }
 let j = await call(U.amy.t, 'POST', '/api/rank', { name: 'Crew', members: [U.ben.id, U.cal.id] }); const id = j.rank.id; console.log('create', j.ok, j.rank.leader === U.amy.id, j.rank.members.length);
 j = await call(U.ben.t, 'POST', '/api/rank/send', { id, x: 'hello' }); console.log('send', j.ok);
 let s = await call(U.cal.t, 'GET', '/api/sync?since=0'); console.log('cal sees', s.rows.filter(r => r.c === 'ranks').length, s.rows.filter(r => r.c === 'rmsgs').length);
 j = await call(U.ben.t, 'POST', '/api/rank/vote', { id, for: U.ben.id }); console.log('1 vote no win', !j.won);
 j = await call(U.cal.t, 'POST', '/api/rank/vote', { id, for: U.ben.id }); console.log('majority wins', j.won === U.ben.id, j.rank.leader === U.ben.id);
 j = await call(U.amy.t, 'POST', '/api/rank/kick', { id, user: U.cal.id }); console.log('old leader cannot kick', !j.ok);
 j = await call(U.ben.t, 'POST', '/api/rank/kick', { id, user: U.cal.id }); console.log('new leader kicks', j.ok, j.rank.members.length);
 s = await call(U.cal.t, 'GET', '/api/sync?since=0'); console.log('kicked cal sees msgs', s.rows.filter(r => r.c === 'rmsgs').length);
 j = await call(U.ben.t, 'POST', '/api/rank/leave', { id }); const r = (await call(U.amy.t, 'GET', '/api/sync?since=0')).rows.find(r => r.c === 'ranks'); console.log('leader leaves ->', r.data.leader === U.amy.id);
 process.exit(0); })();
