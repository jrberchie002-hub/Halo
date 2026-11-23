const { start } = require('../dev.js');
(async () => { await start(3156); const B = 'http://localhost:3156'; const g = id => fetch(B + '/api/yt?id=' + encodeURIComponent(id)).then(r => r.json()); const po = (b) => fetch(B + '/api/yt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
 const ck = (n, c) => console.log(c ? 'PASS' : 'FAIL', n);
 ck('empty at first', (await g('i123')).ids.length === 0);
 await po({ id: 'i123', ids: ['abcdefghijk', 'bad id!', 'ZYXWVUTSRQP'] }); const r = await g('i123');
 ck('shared lookup is stored (valid ids only)', r.ids.join() === 'abcdefghijk,ZYXWVUTSRQP');
 await po({ id: 'i123', ids: ['AAAAAAAAAAA'] }); ck('first writer wins (cannot be overwritten)', (await g('i123')).ids[0] === 'abcdefghijk');
 await po({ id: 'i9', ids: ['short'] }); ck('junk rejected', (await g('i9')).ids.length === 0);
 process.exit(0); })();
