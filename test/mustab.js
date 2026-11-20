const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3145); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['microphone'] }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3145/?demo=1'); await p.waitForSelector('.nav'); await p.click('.nav [data-t=music]'); await p.waitForTimeout(300);
 console.log('music tab', (await p.textContent('#bd')).includes('Halo Music'), 'tabs', await p.$$eval('.nav button', e => e.length)); await p.screenshot({ path: '/tmp/mt.png' });
 await p.click('.nav [data-t=chats]'); await p.click('.crow2'); await p.waitForSelector('#mbtn'); await p.click('#mbtn'); await p.waitForTimeout(1500); await p.click('[data-a=recsend]'); await p.waitForTimeout(2500);
 console.log('voice msgs', await p.$$eval('.b.vn', e => e.length), errs); await b.close(); process.exit(0); })();
