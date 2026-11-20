const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3116); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const c = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['camera', 'microphone'] }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3116/?demo=1'); await p.waitForSelector('.nav');
 await p.click('[data-t=me]'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/u_me.png' });
 await p.click('.spot'); await p.waitForSelector('#mq'); await p.click('#music [data-a=close]');
 await p.click('[data-t=stories]'); await p.click('.top [data-a=compose], [data-a=compose]'); await p.waitForSelector('.cx'); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/u_comp.png' });
 await p.click('[data-a=ccam]'); await p.waitForSelector('video#cvid'); await p.waitForTimeout(900); await p.click('#shut'); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/u_cam.png' });
 console.log('cam photo set:', await p.evaluate(() => document.querySelector('#cv').style.backgroundImage.indexOf('data:image/jpeg')>-1));
 // back button behaviour
 const before = await p.evaluate(() => location.href); await p.click('[data-a=close]'); await p.waitForTimeout(300); console.log('compose closed, still on app:', await p.evaluate(() => !!document.querySelector('.nav')));
 await p.click('[data-t=chats]'); await p.click('[data-a=chat][data-id=k]'); await p.waitForSelector('#th'); await p.goBack(); await p.waitForTimeout(300); console.log('browser back closed chat, app still open:', await p.evaluate(() => !document.querySelector('#th') && !!document.querySelector('.nav')));
 console.log('errors', errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
