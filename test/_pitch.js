const { chromium } = require('playwright'); const fs = require('fs');
const src = fs.readFileSync('../public/app.js', 'utf8'); const m = src.match(/function toWav\(blob, cb0\) \{[\s\S]*?\n/)[0];
(async () => { const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const p = await b.newPage(); await p.goto('about:blank');
 const r = await p.evaluate(async (fn) => { eval(fn + ';window.toWav=toWav'); 
  // synth 440Hz tone, 2s, as webm via MediaRecorder from a MediaStreamDestination
  const ac = new AudioContext(), o = ac.createOscillator(), d = ac.createMediaStreamDestination(); o.frequency.value = 440; o.connect(d); o.start(); await ac.resume();
  const mr = new MediaRecorder(d.stream, { mimeType: 'audio/webm;codecs=opus' }), ch = []; mr.ondataavailable = e => ch.push(e.data); mr.start(250); await new Promise(r => setTimeout(r, 2000)); await new Promise(r => { mr.onstop = r; mr.stop(); });
  const blob = new Blob(ch, { type: 'audio/webm' });
  const w = await new Promise(r => toWav(blob, r)); if (!w) return 'null';
  const ab = await w.arrayBuffer(), v = new DataView(ab), rate = v.getUint32(24, true), n = (ab.byteLength - 44) / 2; let z = 0, prev = 0; for (let i = 0; i < n; i++) { const s = v.getInt16(44 + i * 2, true); if (prev < 0 && s >= 0) z++; prev = s; }
  return { rate, secs: n / rate, hz: z / (n / rate), ctxRate: ac.sampleRate }; }, m);
 console.log(JSON.stringify(r)); await b.close(); })();
