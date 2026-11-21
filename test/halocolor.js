const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'), path = require('path');
const srv = http.createServer((q, r) => { let f = path.join(__dirname, '../public', q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream'); r.end(fs.readFileSync(f)); }).listen(3119, async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); let fails = 0; const ck = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) fails++; };
  await p.goto('http://localhost:3119/?demo=1'); await p.waitForSelector('.hr', { timeout: 8000 });
  const col = () => p.evaluate(() => getComputedStyle(document.querySelector('.hr')).borderTopColor);
  const def = await col(); ck('default ring keeps its current look (' + def + ')', /232, 199, 106|181, 140, 255/.test(def));
  await p.evaluate(() => { localStorage.setItem('halo.acc', '#2bb673'); }); await p.reload(); await p.waitForSelector('.hr');
  const c2 = await col(); ck('ring follows the theme colour once changed (' + c2 + ')', /43, 182, 115/.test(c2));
  await b.close(); srv.close(); process.exit(fails ? 1 : 0); });
