'use strict';
// Storage adapters with one interface: get(c,id) put(c,id,data) del(c,id) since(stamp,colls) list(c)
let seq = 0;
function stamp() { seq = (seq + 1) % 1000; return Date.now() * 1000 + seq; }
const clone = (x) => JSON.parse(JSON.stringify(x));

function memoryStore() {
  const rows = new Map();
  return {
    kind: 'memory',
    async get(c, id) { const r = rows.get(c + '\u0000' + id); return r ? clone(r.data) : null; },
    async put(c, id, data) { const u = stamp(); rows.set(c + '\u0000' + id, { c, id, data: clone(data), u }); return u; },
    async del(c, id) { rows.delete(c + '\u0000' + id); },
    async since(s, colls) { const out = []; rows.forEach(r => { if (r.u > s && (!colls || colls.includes(r.c))) out.push({ c: r.c, id: r.id, data: clone(r.data), u: r.u }); }); return out.sort((a, b) => a.u - b.u); },
    async list(c) { const out = []; rows.forEach(r => { if (r.c === c) out.push({ c: r.c, id: r.id, data: clone(r.data) }); }); return out; },
  };
}

function supabaseStore(env) {
  const base = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = String(env.SUPABASE_SERVICE_KEY || '').trim();
  const H = (x) => Object.assign({ apikey: key, 'Content-Type': 'application/json' }, key.startsWith('sb_') ? {} : { Authorization: 'Bearer ' + key }, x || {});
  async function rest(method, p, body, prefer) {
    const r = await fetch(base + '/rest/v1/' + p, { method, headers: H(prefer ? { Prefer: prefer } : {}), body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); if (!r.ok) throw new Error('Supabase ' + r.status + ' ' + t.slice(0, 200));
    return t ? JSON.parse(t) : null;
  }
  const q = encodeURIComponent;
  return {
    kind: 'supabase',
    async get(c, id) { const r = await rest('GET', 'halo_records?c=eq.' + q(c) + '&id=eq.' + q(id) + '&select=data'); return r && r[0] ? r[0].data : null; },
    async put(c, id, data) { const u = stamp(); await rest('POST', 'halo_records?on_conflict=c,id', { c, id, data, u }, 'resolution=merge-duplicates,return=minimal'); return u; },
    async del(c, id) { await rest('DELETE', 'halo_records?c=eq.' + q(c) + '&id=eq.' + q(id)); },
    async since(s, colls) {
      let out = [], from = s;
      for (let i = 0; i < 20; i++) {
        const rows = await rest('GET', 'halo_records?u=gt.' + from + (colls ? '&c=in.(' + colls.map(q).join(',') + ')' : '') + '&select=c,id,data,u&order=u.asc&limit=1000');
        out = out.concat(rows || []); if (!rows || rows.length < 1000) break; from = rows[rows.length - 1].u;
      }
      return out;
    },
    async list(c) { return await rest('GET', 'halo_records?c=eq.' + q(c) + '&select=c,id,data&limit=5000'); },
  };
}
module.exports = { memoryStore, supabaseStore };
