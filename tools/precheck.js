#!/usr/bin/env node
// Self-test before going live. Vercel runs this before every build (vercel.json "ignoreCommand").
// If anything is broken, the build is skipped and the last good version stays live.
// Checks: every JS file compiles, every inline <script> in every HTML page compiles, every JSON file parses,
// the server entry loads, and tools/precheck.local.js (this project's own extra tests) passes if it exists.
// Run by hand: node tools/precheck.js   (exit 0 = all good, 1 = broken)
// Vercel mode: node tools/precheck.js --vercel   (exit 1 = go ahead and build, 0 = skip the build)
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..'), VERCEL = process.argv.includes('--vercel');
const SKIP = /(^|\/)(node_modules|\.git|\.vercel|test-results|playwright-report)(\/|$)/;
const fails = [];
let files = 0;
function walk(d) {
  for (const n of fs.readdirSync(d)) {
    const f = path.join(d, n), rel = path.relative(ROOT, f);
    if (SKIP.test(rel)) continue;
    const st = fs.statSync(f);
    if (st.isDirectory()) walk(f); else check(f, rel, st.size);
  }
}
function compile(src, rel) {
  if (/^\s*(import|export)\s/m.test(src)) return;   // modules: compiled by the platform itself
  try { new vm.Script(src.replace(/^#!.*/, ''), { filename: rel }); } catch (e) { fails.push(rel + ': ' + e.message); }
}
function check(f, rel, size) {
  if (size > 15e6) return;
  if (/\.(c?js)$/.test(rel)) { files++; compile(fs.readFileSync(f, 'utf8'), rel); }
  else if (/\.json$|\.webmanifest$/.test(rel)) { files++; try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fails.push(rel + ': bad JSON: ' + e.message); } }
  else if (/\.html?$/.test(rel)) {
    files++; const h = fs.readFileSync(f, 'utf8'), re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, i = 0;
    while ((m = re.exec(h))) { i++; const attrs = m[1]; if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["']?(module|application\/(ld\+)?json|text\/(template|x-template|plain))/i.test(attrs) || !m[2].trim()) continue; compile(m[2], rel + ' <script #' + i + '>'); }
  }
}
walk(ROOT);
// the server entry must load (catches missing files and top-level mistakes)
for (const e of ['api/index.js', 'server.js']) {
  const f = path.join(ROOT, e); if (!fs.existsSync(f)) continue;
  try { const src = fs.readFileSync(f, 'utf8'); if (/^\s*(import|export)\s/m.test(src)) continue; cp.execFileSync(process.execPath, ['-e', 'require(' + JSON.stringify(f) + ')'], { cwd: ROOT, timeout: 20000, stdio: 'pipe', env: { PATH: process.env.PATH, NODE_ENV: 'test', PRECHECK: '1' } }); }
  catch (e) { const er = String(e.stderr || ''), mm = er.match(/Cannot find module '([^']+)'/); if (mm && !/^[./]/.test(mm[1])) continue;   // packages are installed after this check runs on Vercel
    fails.push(path.basename(f) + ' does not load: ' + String((e.stderr || e.message || '')).split('\n').filter(Boolean).slice(0, 4).join(' | ')); }
}
// this project's own tests
const local = path.join(ROOT, 'tools', 'precheck.local.js');
if (fs.existsSync(local)) { try { cp.execFileSync(process.execPath, [local], { cwd: ROOT, timeout: 60000, stdio: 'pipe' }); } catch (e) { fails.push('project tests failed: ' + String((e.stdout || '') + (e.stderr || '') || e.message).split('\n').filter(Boolean).slice(-4).join(' | ')); } }
if (fails.length) {
  console.log('PRECHECK FAILED - not going live. The last good version stays up.\n- ' + fails.slice(0, 25).join('\n- '));
  process.exit(VERCEL ? 0 : 1);
}
console.log('Precheck passed: ' + files + ' files checked.');
process.exit(VERCEL ? 1 : 0);
