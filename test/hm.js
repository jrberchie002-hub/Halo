'use strict';
const assert = require('assert'); const { memoryStore } = require('../store');
const app = require('../lib/app')({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_KEY: 'k' }, memoryStore());
const call = async (method, path, body, tok) => { const r = await app.handle({ method, path, query: {}, headers: tok ? { authorization: 'Bearer ' + tok } : {}, body: body ? Buffer.from(JSON.stringify(body)) : undefined }); return Object.assign({ s: r.status }, JSON.parse(r.body || '{}')); };
(async () => {
  const A = await call('POST', '/api/signup', { name: 'Ama', username: 'ama.b', phone: '0244000001' }); const B = await call('POST', '/api/signup', { name: 'Kojo', username: 'kojo_m', email: 'k@x.com' });
  assert((await call('GET', '/api/hm/list')).tracks.length === 0, 'empty list public');
  const good = 'https://x.supabase.co/storage/v1/object/public/halo-media/u1/abc.mp3';
  assert((await call('POST', '/api/hm/pub', { name: 'Song', artist: 'Ama', aud: 'https://evil.com/a.mp3' }, A.token)).s === 400, 'reject foreign url');
  assert((await call('POST', '/api/hm/pub', { name: 'Song', artist: 'Ama', aud: good }, null)).s === 401, 'needs sign in');
  const p = await call('POST', '/api/hm/pub', { name: 'Song', artist: 'Ama', aud: good, dur: 200 }, A.token); assert(p.ok, 'publish');
  const l = await call('GET', '/api/hm/list'); assert(l.tracks.length === 1 && l.tracks[0].name === 'Song' && !('by' in l.tracks[0]), 'list public, no owner id');
  assert((await call('GET', '/api/hm/mine', null, B.token)).tracks.length === 0, 'mine is private');
  assert((await call('POST', '/api/hm/del', { id: p.track.id }, B.token)).s === 404, 'others cannot delete');
  assert((await call('POST', '/api/hm/del', { id: p.track.id }, A.token)).ok, 'owner deletes'); assert((await call('GET', '/api/hm/list')).tracks.length === 0, 'gone');
  console.log('hm api ok');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
