'use strict';
const { supabaseStore, memoryStore } = require('../store');
const makeApp = require('../lib/app');
let app;
let st;
function get() { if (!app) { const E = process.env; st = E.SUPABASE_URL ? supabaseStore(E) : memoryStore(); app = makeApp(E, st); } return app; }
const fs = require('fs'), path = require('path');
module.exports = async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks);
  const u = new URL(req.url, 'http://x'), q = Object.fromEntries(u.searchParams);
  let r; try { r = await get().handle({ method: req.method, path: u.pathname, query: q, headers: req.headers, body: raw.length ? raw : undefined }); }
  catch (e) { const m = String(e && e.message || e).replace(/eyJ[\w.-]+|sb_[\w-]+/g, '***').slice(0, 300); r = { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ ok: false, error: 'Database problem: ' + m }) }; }
  if (u.pathname === '/api/send' && req.method === 'POST' && st) { let er = ''; if (r.status >= 400) { try { er = String(JSON.parse(r.body).error || '').slice(0, 90); } catch (e) { er = 'err'; } } await Promise.race([st.put('health', 'lastsend', { t: Date.now(), status: r.status, err: er, len: raw.length }).catch(() => {}), new Promise(z => setTimeout(z, 700))]); } // note of the last send attempt, for checking
  res.statusCode = r.status; Object.entries(r.headers || {}).forEach(([k, v]) => res.setHeader(k, v)); res.end(r.body);
};
module.exports.config = { api: { bodyParser: false } };
