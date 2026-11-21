const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3115); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 let fails = []; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
 await p.goto('http://localhost:3115/?demo=1'); await p.waitForSelector('.nav'); await p.click('[data-a=chat][data-id=k]'); await p.waitForSelector('#tx');
 const n = () => p.evaluate(() => document.querySelectorAll('#ms .b.me').length);
 let n0 = await n();
 // phone keyboards: the Enter key arrives as a line-break input event
 await p.fill('#tx', 'sent from a phone keyboard'); await p.evaluate(() => { const t = document.querySelector('#tx'); t.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertLineBreak', cancelable: true, bubbles: true })); });
 await p.waitForTimeout(400); ok((await n()) === n0 + 1 && await p.evaluate(() => /sent from a phone keyboard/.test(document.querySelector('#ms').textContent) && document.querySelector('#tx').value === ''), 'phone Enter (line-break event) sends and clears the box');
 // desktop: Enter sends, Shift+Enter makes a new line
 n0 = await n(); await p.fill('#tx', 'desktop enter'); await p.press('#tx', 'Enter'); await p.waitForTimeout(400); ok((await n()) === n0 + 1, 'Enter key sends');
 n0 = await n(); await p.click('#tx'); await p.keyboard.type('line one'); await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); await p.keyboard.type('line two'); await p.waitForTimeout(300);
 ok((await n()) === n0 && await p.evaluate(() => document.querySelector('#tx').value === 'line one\nline two'), 'Shift+Enter adds a new line and does not send');
 n0 = await n(); await p.evaluate(() => { const t = document.querySelector('#tx'); t.value = ''; }); await p.press('#tx', 'Enter'); await p.waitForTimeout(300); ok((await n()) === n0, 'Enter on an empty box sends nothing');
 console.log('page errors', errs); await b.close(); srv.close && srv.close(); console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
