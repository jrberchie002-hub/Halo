// Every call leaves an entry in the chat: missed in red with call back, answered with its length; the Calls tab counts missed calls.
const dev = require('../dev.js'); const { chromium } = require('playwright');
let fails = 0; const ck = (n, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) fails++; };
(async () => { await dev.start(3219); const B = 'http://localhost:3219';
 const c = async (t, m, p, b) => (await fetch(B + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();
 const a = await c(null, 'POST', '/api/signup', { username: 'jay', name: 'Jay', password: 'pass1234' }), h = await c(null, 'POST', '/api/signup', { username: 'naa', name: 'Naa', password: 'pass1234' });
 await c(a.token, 'POST', '/api/friend', { to: h.me.id }); await c(h.token, 'POST', '/api/friend', { to: a.me.id });
 const m1 = await c(a.token, 'POST', '/api/call', { to: h.me.id, offer: '{}' }); await c(a.token, 'POST', '/api/call/end', { id: m1.call.id }); // Jay calls, Naa never answers
 const m2 = await c(h.token, 'POST', '/api/call', { to: a.me.id, offer: '{}', video: 1 }); await c(a.token, 'POST', '/api/call/answer', { id: m2.call.id, answer: '{}' }); await new Promise(r => setTimeout(r, 1200)); await c(h.token, 'POST', '/api/call/end', { id: m2.call.id });
 await c(a.token, 'POST', '/api/call/end', { id: m1.call.id }); // ending twice must not add a second entry
 const br = await chromium.launch(); const pg = await (await br.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
 await pg.addInitScript(t => { localStorage.setItem('halo.tok', t); localStorage.setItem('halo.tour', '1'); }, h.token); await pg.goto(B + '/?dbg=1'); await pg.waitForSelector('.crow2'); await pg.waitForTimeout(1500); console.log('  state:', await pg.evaluate(() => JSON.stringify(Object.keys(window.__S.msgs).map(k => k + ':' + window.__S.msgs[k].length)) + ' rows=' + document.querySelectorAll('.crow2').length + ' first=' + document.querySelector('.crow2').innerText.replace(/\s+/g, ' ')));
 const badge = await pg.$eval('[data-a=tab][data-t=calls]', e => e.textContent.replace(/\D/g, '')).catch(() => ''); ck('Calls tab shows 1 missed call (' + badge + ')', badge === '1');
 await pg.click('.crow2'); await pg.waitForTimeout(1500);
 console.log('  served has callTitle:', await pg.evaluate(() => fetch('/app.js', { cache: 'no-store' }).then(r => r.text()).then(t => t.includes('callTitle')))); console.log('  html:', await pg.evaluate(() => (document.querySelector('#ms .b') || {}).outerHTML)); console.log('  msg:', await pg.evaluate(() => JSON.stringify(Object.values(window.__S.msgs)[0]).slice(0, 400))); console.log('  thread:', await pg.evaluate(() => Array.from(document.querySelectorAll('#ms > *')).map(e => e.className + ':' + e.innerText.slice(0, 40).replace(/\s+/g, ' ')).join(' | '))); const items = await pg.$$eval('#ms .b.cl', l => l.map(e => (e.classList.contains('miss') ? 'RED ' : '') + e.innerText.replace(/\s+/g, ' ')));
 console.log('  entries:', JSON.stringify(items));
 ck('two call entries, no duplicate', items.length === 2);
 ck('missed call shows in red for Naa', items.some(x => /^RED Missed voice call/.test(x)));
 ck('answered video call shows its length', items.some(x => /Video call 0:0\d/.test(x)));
 ck('call back button is there', !!(await pg.$('#ms .b.cl [data-a=callback]')));
 await pg.click('[data-a=back]').catch(() => {}); await pg.waitForTimeout(500); await pg.click('[data-a=tab][data-t=calls]'); await pg.waitForTimeout(800);
 ck('Calls tab lists both calls', (await pg.$$('.row.crow2.cl')).length >= 2);
 ck('badge clears after opening Calls', await pg.$eval('[data-a=tab][data-t=calls]', e => !/\d/.test(e.textContent)));
 ck('no page errors ' + errs.join(' | '), !errs.length); await br.close(); console.log(fails ? 'FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
