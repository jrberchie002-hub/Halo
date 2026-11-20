'use strict';
// Web Push (RFC 8030 + VAPID RFC 8292 + aes128gcm RFC 8291) using only node crypto.
const crypto = require('crypto');
const b64u = (b) => Buffer.from(b).toString('base64url');
const unb64u = (s) => Buffer.from(String(s), 'base64url');
const hkdf = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));

async function vapid(store) {
  let v = await store.get('config', 'vapid');
  if (!v) {
    const kp = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const j = kp.privateKey.export({ format: 'jwk' });
    v = { priv: j, pub: b64u(Buffer.concat([Buffer.from([4]), unb64u(j.x), unb64u(j.y)])) };
    await store.put('config', 'vapid', v);
  }
  return v;
}
function jwt(v, aud) {
  const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), c = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:hello@halo.app' }));
  const key = crypto.createPrivateKey({ key: v.priv, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(h + '.' + c), { key, dsaEncoding: 'ieee-p1363' });
  return h + '.' + c + '.' + b64u(sig);
}
function encrypt(sub, payload) {
  const ua = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const eph = crypto.createECDH('prime256v1'); eph.generateKeys(); const asPub = eph.getPublicKey();
  const shared = eph.computeSecret(ua);
  const salt = crypto.randomBytes(16);
  const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const ci = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([ci.update(Buffer.concat([Buffer.from(JSON.stringify(payload)), Buffer.from([2])])), ci.final(), ci.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}
function decrypt(uaECDH, auth, body) { // used by tests
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
  const shared = uaECDH.computeSecret(asPub), ua = uaECDH.getPublicKey();
  const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(ct.subarray(ct.length - 16));
  const pt = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]); return JSON.parse(pt.subarray(0, pt.lastIndexOf(2)).toString());
}
async function notify(store, uid, payload, fetchFn) {
  const rec = await store.get('push', uid); if (!rec || !rec.subs || !rec.subs.length) return 0;
  const v = await vapid(store), keep = []; let sent = 0, f = fetchFn || fetch;
  await Promise.all(rec.subs.map(async (sub) => {
    try {
      const aud = new URL(sub.endpoint).origin, body = encrypt(sub, payload);
      const r = await f(sub.endpoint, { method: 'POST', headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: String(/^call/.test((payload && payload.tag) || '') ? 45 : 86400), Urgency: 'high', Authorization: 'vapid t=' + jwt(v, aud) + ',k=' + v.pub }, body });
      if (r.status === 404 || r.status === 410) return; keep.push(sub); if (r.ok) sent++;
    } catch (e) { keep.push(sub); }
  }));
  if (keep.length !== rec.subs.length) await store.put('push', uid, { subs: keep });
  return sent;
}
module.exports = { vapid, notify, encrypt, decrypt };
