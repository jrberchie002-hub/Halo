const crypto = require('crypto'); const push = require('../lib/push'); const { memoryStore } = require('../store'); const makeApp = require('../lib/app');
(async () => {
  const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
  const sub = { endpoint: 'https://push.example.test/abc', keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };
  const body = push.encrypt(sub, { title: 'Kofi', body: 'hey 🔥' }); const got = push.decrypt(ua, auth, body); if (got.title !== 'Kofi' || got.body !== 'hey 🔥') throw new Error('roundtrip');
  const st = memoryStore(); await st.put('push', 'u1', { subs: [sub] }); let seen;
  const n = await push.notify(st, 'u1', { title: 'x', body: 'y' }, async (url, o) => { seen = { url, o }; return { status: 201, ok: true }; });
  const v = await push.vapid(st); const jwt = seen.o.headers.Authorization.match(/t=([^,]+),k=(.+)$/); const [h, c, s] = jwt[1].split('.');
  const pubPem = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: v.priv.x, y: v.priv.y }, format: 'jwk' });
  const okSig = crypto.verify('sha256', Buffer.from(h + '.' + c), { key: pubPem, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
  if (!(n === 1 && okSig && jwt[2] === v.pub && JSON.parse(Buffer.from(c, 'base64url')).aud === 'https://push.example.test')) throw new Error('vapid');
  const app = makeApp({}, memoryStore()); const r = await app.handle({ method: 'GET', path: '/api/gif', query: {}, headers: {} });
  console.log('push checks passed; gif without key ->', r.status);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
