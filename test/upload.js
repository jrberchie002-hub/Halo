'use strict';
const assert = require('assert');
const { memoryStore } = require('../store');
const calls = [];
global.fetch = async (u, o) => { calls.push(u); return { ok: true, json: async () => ({ url: '/object/upload/sign/halo-media/x?token=t' }) }; };
const app = require('../lib/app')({ SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_SERVICE_KEY: 'k' }, memoryStore());
const call = async (m, p, b, t) => { const r = await app.handle({ method: m, path: p, query: {}, headers: t ? { authorization: 'Bearer ' + t } : {}, body: b ? Buffer.from(JSON.stringify(b)) : Buffer.alloc(0) }); return Object.assign({ s: r.status }, JSON.parse(r.body)); };
(async () => {
  const A = await call('POST', '/api/signup', { name: 'A', username: 'aa.u' }), B = await call('POST', '/api/signup', { name: 'B', username: 'bb.u' });
  const up = await call('POST', '/api/upload', { kind: 'vid', ext: 'mp4' }, A.token);
  assert(up.ok && up.up.startsWith('https://abc.supabase.co/storage/v1/object/upload/sign/') && up.url.includes('/object/public/halo-media/' + A.me.id), 'sign');
  await call('POST', '/api/friend', { to: B.me.id }, A.token); await call('POST', '/api/friend', { to: A.me.id, accept: true }, B.token);
  const s = await call('POST', '/api/send', { to: B.me.id, vid: up.url }, A.token); console.log('send vid url ->', s.s, !!s.msg && s.msg.vid === up.url);
  const bad = await call('POST', '/api/send', { to: B.me.id, vid: 'https://evil.com/x.mp4' }, A.token); console.log('foreign url blocked ->', bad.s, !(bad.msg && bad.msg.vid));
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
