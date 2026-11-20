const { chromium } = require('playwright'); const { start } = require('../dev.js');
(async () => { const srv = await start(3114); const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const c = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['microphone'] }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:3114'); await p.waitForTimeout(1800); await p.screenshot({ path: '/tmp/d0.png' });
 await p.click('[data-a=demo]'); await p.waitForSelector('.nav'); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/d1.png' });
 await p.click('[data-a=chat][data-id=k]'); await p.waitForSelector('.b'); await p.click('[data-a=plus]'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/d2.png' });
 await p.click('[data-a=stick]'); await p.click('[data-a=tt][data-k=g]'); await p.click('[data-a=gift][data-g=crown]'); await p.waitForTimeout(400);
 await p.click('[data-a=rec]'); await p.waitForTimeout(2300); await p.screenshot({ path: '/tmp/d3.png' }); await p.click('[data-a=recsend]'); await p.waitForSelector('.vn.me', { timeout: 5000 });
 await p.click('.vn.me .vp'); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/d4.png' });
 console.log('errors', errs); await b.close(); process.exit(0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
