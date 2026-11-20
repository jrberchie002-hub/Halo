'use strict';
const assert = require('assert'); const { memoryStore } = require('../store'); const app = require('../lib/app')({}, memoryStore());
const call = async (method, path, body, tok) => { const r = await app.handle({ method, path, query: {}, headers: tok ? { authorization: 'Bearer ' + tok } : {}, body: body ? Buffer.from(JSON.stringify(body)) : undefined }); return Object.assign(JSON.parse(r.body), { s: r.status }); };
(async () => {
  const A = await call('POST', '/api/signup', { name: 'Ama', username: 'ama.b', password: 'pass1234' }), B = await call('POST', '/api/signup', { name: 'Kojo', username: 'kojo_m', password: 'pass1234' });
  const ta = A.token, tb = B.token; const ida = A.me.id, idb = B.me.id;
  assert.strictEqual((await call('POST', '/api/chatwp', { to: idb, wp: 'pat:1' }, ta)).s, 403, 'not friends');
  await call('POST', '/api/friend', { to: idb }, ta); await call('POST', '/api/friend', { to: ida }, tb);
  assert((await call('POST', '/api/chatwp', { to: idb, wp: 'pat:1' }, ta)).ok, 'set');
  assert.strictEqual((await call('POST', '/api/chatwp', { to: idb, wp: 'url(http://evil)' }, ta)).s, 400, 'reject');
  const sy = await call('GET', '/api/sync', null, tb); const row = sy.rows.find(r => r.c === 'chats'); assert.strictEqual(row.data.wp, 'pat:1', 'other side sees it');
  const ice = await call('GET', '/api/ice'); assert.strictEqual(ice.s, 401, 'ice needs sign in');
  const rm = await call('POST', '/api/unfriend', { to: idb }, ta); assert(rm.ok, 'unfriend'); const me2 = await call('GET', '/api/me', null, tb); assert(!((me2.me || me2).friends || []).includes(ida), 'other side lost friend');
  console.log('chatwp ok');
})().catch(e => { console.error(e); process.exit(1); });
