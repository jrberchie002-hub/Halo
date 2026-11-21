const { chromium } = require('playwright'); const { start } = require('../dev.js'); const O = process.env.OUT || '/tmp';
(async () => { const srv = await start(3134); const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3134/?demo=1'); await p.waitForSelector('.nav'); await p.click('[data-a=tab][data-t=stories]'); await p.waitForTimeout(600);
 const n0 = await p.$$eval('.deck .dk', e => e.length); console.log('cards', n0, 'decks', await p.$$eval('.deck', e => e.length), 'grid tiles', await p.$$eval('.tile', e => e.length));
 await p.screenshot({ path: O + '/mom_deck.png' });
 const top = await p.$('.deck .dk:last-child'); const bx = await top.boundingBox();
 await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.mouse.move(bx.x + bx.width / 2 + 160, bx.y + bx.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(600);
 console.log('after swipe', await p.$$eval('.deck .dk', e => e.length), 'dx', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
 await p.screenshot({ path: O + '/mom_deck2.png' }); console.log('errs', errs); process.exit(0); })();
