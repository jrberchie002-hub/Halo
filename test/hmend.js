const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); let bad = [];
 for (const [w, h] of [[1366, 700], [390, 800]]) { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto('http://localhost:3199/'); await p.waitForTimeout(2500); await p.click('.inst button', { timeout: 500 }).catch(() => {});
  await p.evaluate(() => { const v = document.querySelector('.vw.on'); v.insertAdjacentHTML('beforeend', '<div style="height:1500px;grid-column:1/-1">x</div><div id="lastel" style="height:20px;grid-column:1/-1">end</div>'); });
  const r = await p.evaluate(() => { const m = document.querySelector('#main'); m.scrollTop = m.scrollHeight; const l = document.getElementById('lastel').getBoundingClientRect(), mb = m.getBoundingClientRect().bottom, d = document.querySelector('#dock').getBoundingClientRect(); return { below: Math.round(innerHeight - l.bottom), dockTop: Math.round(innerHeight - d.top) }; });
  console.log(w, JSON.stringify(r)); if (r.below - r.dockTop > 24) bad.push(w + ' gap ' + (r.below - r.dockTop)); }
 console.log(bad.length ? 'END FAIL ' + bad : 'END OK'); await b.close(); process.exit(bad.length ? 1 : 0); })();
