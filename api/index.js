'use strict';
const { supabaseStore, memoryStore } = require('../store');
const makeApp = require('../lib/app');
let app;
function get() { if (!app) { const E = process.env; app = makeApp(E, E.SUPABASE_URL ? supabaseStore(E) : memoryStore()); } return app; }
const fs = require('fs'), path = require('path');
module.exports = async (req, res) => {
  if (String(req.url).startsWith('/api/invite')) {
    const u0 = new URL(req.url, 'http://x'), un = String(u0.searchParams.get('u') || '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20), host = req.headers['x-forwarded-host'] || req.headers.host || '';
    let html = ''; try { html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8'); } catch (e) { html = '<!doctype html><meta http-equiv="refresh" content="0;url=/">'; }
    html = html.replace(/<meta property="og:title"[^>]*>/, '<meta property="og:title" content="' + (un ? '@' + un + ' invited you to Halo' : 'Join me on Halo') + '">').replace(/<meta property="og:image"[^>]*>/, '<meta property="og:image" content="https://' + host + '/og.png"><meta property="og:url" content="https://' + host + '/i/' + un + '">');
    res.statusCode = 200; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'public, max-age=300'); return res.end(html);
  }
  const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks);
  const u = new URL(req.url, 'http://x'), q = Object.fromEntries(u.searchParams);
  let r; try { r = await get().handle({ method: req.method, path: u.pathname, query: q, headers: req.headers, body: raw.length ? raw : undefined }); }
  catch (e) { const m = String(e && e.message || e).replace(/eyJ[\w.-]+|sb_[\w-]+/g, '***').slice(0, 300); r = { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ ok: false, error: 'Database problem: ' + m }) }; }
  res.statusCode = r.status; Object.entries(r.headers || {}).forEach(([k, v]) => res.setHeader(k, v)); res.end(r.body);
};
module.exports.config = { api: { bodyParser: false } };
