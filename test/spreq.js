const assert = require('assert'); const app = require('../lib/app')({}, require('../store').memoryStore());
const call = async (m, p, b, t, q) => { const r = await app.handle({ method: m, path: p, query: q || {}, headers: t ? { authorization: 'Bearer ' + t } : {}, body: b ? Buffer.from(JSON.stringify(b)) : Buffer.alloc(0) }); return r; };
(async () => { const A = JSON.parse((await call('POST', '/api/signup', { name: 'Ama', username: 'ama.s', password: 'abcd1234' })).body);
 assert(JSON.parse((await call('POST', '/api/spotify/request', { email: 'Ama@Mail.com' }, A.token)).body).ok, 'req');
 assert((await call('GET', '/api/spotify/list', null, null, { k: 'bad' })).status === 403, 'locked');
 const r = await call('GET', '/api/spotify/list', null, null, { k: '03f0d29d82b2' }); assert(r.status === 200 && /ama@mail.com/.test(r.body), 'list: ' + r.body); console.log('spotify requests ok:', r.body); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
