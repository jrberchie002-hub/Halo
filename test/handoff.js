const assert = require('assert'); const { memoryStore } = require('../store'); const app = require('../lib/app')({}, memoryStore());
const call = async (m, p, b, t) => { const r = await app.handle({ method: m, path: p, query: {}, headers: t ? { authorization: 'Bearer ' + t } : {}, body: b ? Buffer.from(JSON.stringify(b)) : Buffer.alloc(0) }); return Object.assign({ s: r.status }, JSON.parse(r.body)); };
(async () => { const A = await call('POST', '/api/signup', { name: 'J', username: 'jay.x' }); const h = await call('POST', '/api/handoff', {}, A.token); assert(h.ok && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(h.code), 'code');
 const u = await call('POST', '/api/handoff/use', { code: h.code.toLowerCase() }); assert(u.ok && u.token && u.token !== A.token && u.me.username === 'jay.x', 'use');
 const s = await call('GET', '/api/sync', null, u.token); assert(s.ok, 'new token works');
 assert((await call('POST', '/api/handoff/use', { code: h.code })).s === 401, 'single use'); console.log('handoff ok'); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
