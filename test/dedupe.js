const assert = require('assert'); const app = require('../lib/app')({}, require('../store').memoryStore());
const call = async (m, p, b, t) => JSON.parse((await app.handle({ method: m, path: p, query: {}, headers: t ? { authorization: 'Bearer ' + t } : {}, body: b ? Buffer.from(JSON.stringify(b)) : Buffer.alloc(0) })).body);
(async () => { const A = await call('POST', '/api/signup', { name: 'A', username: 'aa.d', password: 'abcd' }), B = await call('POST', '/api/signup', { name: 'B', username: 'bb.d', password: 'abcd' });
 await call('POST', '/api/friend', { to: B.me.id }, A.token); await call('POST', '/api/friend', { to: A.me.id }, B.token);
 const x = await call('POST', '/api/send', { to: B.me.id, x: 'hi', ck: 'abcdef123456' }, A.token), y = await call('POST', '/api/send', { to: B.me.id, x: 'hi', ck: 'abcdef123456' }, A.token);
 assert(x.ok && y.ok && x.msg.id === y.msg.id, 'same message'); const s = await call('GET', '/api/sync', null, B.token); const n = Object.values(s.msgs || {}).flat().length || (s.msgs || []).length; console.log('dedupe ok, B sees', n, 'message(s)'); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
