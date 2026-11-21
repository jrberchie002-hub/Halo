const { supabaseStore } = require('../store.js');
const urls = []; let refuse = false;
global.fetch = async (u) => { urls.push(decodeURIComponent(u)); if (refuse && /id=like/.test(decodeURIComponent(u))) return { ok: false, status: 400, text: async () => 'bad' }; return { ok: true, text: async () => '[]' }; };
(async () => {
  const st = supabaseStore('https://x.supabase.co', 'k');
  let fails = 0; const ck = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) fails++; };
  await st.sinceFor(0, 'u1', ['chats', 'msgs', 'typing', 'ice', 'ranks']);
  const g = (c) => urls.find(u => u.includes('c=eq.' + c)) || '';
  ck('chats scoped to this user', /id=like\.\*u1\*/.test(g('chats')));
  ck('msgs scoped to this user', /id=like\.\*u1\*/.test(g('msgs')));
  ck('typing not scoped but windowed', !/like/.test(g('typing')) && /u=gt\.\d{15,}/.test(g('typing')));
  ck('ice windowed', /u=gt\.\d{15,}/.test(g('ice')));
  ck('ranks plain from stamp', /u=gt\.0&/.test(g('ranks')));
  urls.length = 0; refuse = true; await st.sinceFor(0, 'u1', ['chats', 'msgs']);
  ck('falls back to the full scan when the filter is refused', urls.some(u => /c=in\.\(chats,msgs\)/.test(u)));
  process.exit(fails ? 1 : 0);
})();
