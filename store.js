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
    async chatMsgs(cid) { const out = []; rows.forEach(r => { if (r.c === 'msgs' && r.data.chat === cid) out.push({ c: r.c, id: r.id, data: clone(r.data) }); }); return out; },
  };
}

function supabaseStore(env) {
  const base = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = String(env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY || '').trim();
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
    async sinceFor(s, uid, colls) { // only this person's chats/messages, and ephemeral rows only while they matter; falls back to the full scan if refused
      try {
        const WIN = { calls: 36e5, ice: 36e5, typing: 15e3, gsig: 12e4, gcalls: 216e5, stories: 72 * 36e5 }, nowU = Date.now() * 1000, mine = ['chats', 'msgs'];
        const one = async (c, scoped) => {
          let out = [], from = Math.max(s, WIN[c] ? nowU - WIN[c] * 1000 : 0);
          for (let i = 0; i < 20; i++) {
            const rows = await rest('GET', 'halo_records?c=eq.' + c + '&u=gt.' + from + (scoped ? '&id=like.*' + q(uid) + '*' : '') + '&select=c,id,data,u&order=u.asc&limit=1000');
            out = out.concat(rows || []); if (!rows || rows.length < 1000) break; from = rows[rows.length - 1].u;
          }
          return out;
        };
        const all = await Promise.all((colls || []).map(c => one(c, mine.includes(c))));
        if (s === 0 && (colls || []).includes('msgs')) { // first sync: also ask for the newest messages directly, newest first, so they can never be missed
          const nw = await rest('GET', 'halo_records?c=eq.msgs&id=like.*' + q(uid) + '*&select=c,id,data,u&order=u.desc&limit=60'); all.push(nw || []);
        }
        const seen = new Set(), res = []; [].concat(...all).forEach(r => { const k = r.c + '\u0000' + r.id; if (!seen.has(k)) { seen.add(k); res.push(r); } });
        return res.sort((a, b) => a.u - b.u);
      } catch (e) { this.fell = String(e.message || e).slice(0, 80); return this.since(s, colls); }
    },
    async probe2() { // newest write per kind of record, and the oldest message
      const one = async (c, dir) => { try { const r = await rest('GET', 'halo_records?c=eq.' + c + '&select=u&order=u.' + dir + '&limit=1'); return r && r[0] ? r[0].u / 1000 : 0; } catch (e) { return -1; } };
      const cs = ['msgs', 'chats', 'sendkeys', 'typing', 'users'], nw = await Promise.all(cs.map(c => one(c, 'desc'))), old = await one('msgs', 'asc'), o = { old }; cs.forEach((c, i) => { o[c] = nw[i]; }); return o;
    },
    async probe() { return await rest('GET', 'halo_records?c=eq.msgs&select=id,u&order=u.desc&limit=5'); }, // newest message rows in the whole table, ids only
    async list(c) { return await rest('GET', 'halo_records?c=eq.' + q(c) + '&select=c,id,data&limit=5000'); },
    async chatMsgs(cid) { // filtered on the database; falls back to scanning the collection if the filter is refused
      try { const r = await rest('GET', 'halo_records?c=eq.msgs&data-%3E%3Echat=eq.' + q(cid) + '&select=c,id,data&limit=5000'); if (r && r.length) return r; } catch (e) { }
      return ((await this.list('msgs')) || []).filter(r => r.data && r.data.chat === cid);
    },
  };
}
module.exports = { memoryStore, supabaseStore };
