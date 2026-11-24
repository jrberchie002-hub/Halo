'use strict';
// Local server: node dev.js  ->  http://localhost:3000  (uses Supabase if SUPABASE_URL is set, else memory)
const http = require('http'), fs = require('fs'), path = require('path');
const { supabaseStore, memoryStore } = require('./store');
const makeApp = require('./lib/app');
const E = process.env, store = E.SUPABASE_URL ? supabaseStore(E) : memoryStore(), app = makeApp(E, store);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function start(port) {
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname.startsWith('/api/')) {
      const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks);
      const r = await app.handle({ method: req.method, path: u.pathname, query: Object.fromEntries(u.searchParams), headers: req.headers, body: raw.length ? raw : undefined });
      res.writeHead(r.status, r.headers || {}); return res.end(r.body);
    }
    let f = path.join(__dirname, 'public', u.pathname === '/' ? 'index.html' : u.pathname);
    if (fs.existsSync(f) && fs.statSync(f).isDirectory() && fs.existsSync(path.join(f, 'index.html'))) f = path.join(f, 'index.html');
    if (!f.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(__dirname, 'public', 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}
module.exports = { start, store };
if (require.main === module) start(+E.PORT || 3000).then(() => console.log('Halo on http://localhost:' + (+E.PORT || 3000)));
