const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});let fails=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fails++};const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>{const u=r.request().url();if(u.includes('localhost'))return r.continue();
 if(u.includes('googleapis.com/youtube/v3/search'))return r.fulfill({json:{items:[{id:{videoId:'TOOS1'},snippet:{title:'Drake - Toosie Slide (Official Audio)',channelTitle:'Drake - Topic',thumbnails:{}}}]}});
 if(u.includes('itunes.apple.com/search')){const t=decodeURIComponent((u.match(/term=([^&]*)/)||[])[1]||'');
  if(/toosie/i.test(t))return r.fulfill({json:{results:[{wrapperType:'track',kind:'song',trackId:9,trackName:'Pop Hits Slide',artistName:'Pop Hits 2020',collectionName:'Hits',previewUrl:'http://x/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Pop'},{wrapperType:'track',kind:'song',trackId:10,trackName:'Slide Away',artistName:'Some One',collectionName:'A',previewUrl:'http://x/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Pop'}]}});
  return r.fulfill({json:{results:[1,2,3].map(i=>({wrapperType:'track',kind:'song',trackId:100+i,trackName:'Song '+i+' '+t,artistName:t,collectionName:'Alb',previewUrl:'http://x/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Hip-Hop'}))}})}
 return r.abort()});
await p.goto('http://localhost:3199/');await p.waitForTimeout(2500);
ck('Halo tab first',await p.evaluate(()=>document.querySelector('#cats button').textContent==='Halo'));
ck('Halo tab selected',await p.evaluate(()=>document.querySelector('#cats button').classList.contains('on')));
ck('Halo tab shows songs',await p.evaluate(()=>document.querySelectorAll('.row').length>3));
await p.click('.sbt');await p.waitForTimeout(300);
ck('top Search button hidden on search page',await p.evaluate(()=>getComputedStyle(document.querySelector('.sbt')).display==='none'));
await p.fill('#q','toosie slide drake');await p.keyboard.press('Enter');await p.waitForTimeout(3500);
const secs=await p.evaluate(()=>[...document.querySelectorAll('.vw.on .sec')].map(e=>e.textContent));
console.log(secs.join(' | '));
ck('Best match comes first',secs[0]==='Best match');
ck('Drake row listed in best match',await p.evaluate(()=>/Toosie Slide/.test((document.querySelector('.vw.on .row')||{}).textContent||'')));
ck('compilation artist removed',!(await p.evaluate(()=>document.body.textContent)).includes('Pop Hits 2020'));
await p.screenshot({path:'/tmp/s_search.png'});
ck('no page errors',errs.length===0);console.log(errs);
await b.close();process.exit(fails?1:0)})()
