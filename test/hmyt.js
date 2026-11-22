const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});let fails=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fails++};
const yq=[];
await p.route('**/*',r=>{const u=r.request().url();if(u.includes('localhost'))return r.continue();
 if(u.includes('googleapis.com/youtube/v3/search')){const q=decodeURIComponent((u.match(/[?&]q=([^&]*)/)||[])[1]||'');yq.push(q);
  if(/official audio/.test(q))return r.fulfill({json:{items:[]}});
  return r.fulfill({json:{items:[{id:{videoId:'VID123'},snippet:{title:'Dave - Starlight (Official Audio)',channelTitle:'Warner Records'}}]}})}
 if(u.includes('googleapis.com/youtube/v3/videos'))return r.fulfill({json:{items:[{id:'VID123',contentDetails:{duration:'PT3M20S'}}]}});
 if(u.includes('itunes.apple.com/search'))return r.fulfill({json:{results:[{wrapperType:'track',kind:'song',trackId:555,trackName:'Starlight',artistName:'Dave',collectionName:'Alb',previewUrl:'http://x/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Hip-Hop'}]}});
 return r.abort()});
await p.goto('http://localhost:3199/');await p.waitForTimeout(2000);
await p.evaluate(()=>{try{localStorage.setItem('hm.bgp','0')}catch(e){}});await p.reload();await p.waitForTimeout(2000);
await p.click('.row[data-a=pick]');await p.waitForTimeout(2500);
const m=await p.evaluate(()=>JSON.parse(localStorage.getItem('hm.yt2')||'{}'));
ck('first search asked for official audio, then retried plain',yq.length>=2&&/official audio/.test(yq[0])&&!/official audio/.test(yq[1]));
ck('label-channel upload accepted as the full song',JSON.stringify(m).includes('VID123'));
await b.close();process.exit(fails?1:0)})()
