const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});let fails=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fails++};const errs=[];p.on('pageerror',e=>errs.push(e.message));
const trk=(id,n,a)=>({wrapperType:'track',kind:'song',trackId:id,trackName:n,artistName:a||'Black Sherif',collectionName:'Alb',previewUrl:'http://127.0.0.1:1/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Hip-Hop'});
await p.route('**/*',r=>{const u=decodeURIComponent(r.request().url());if(u.includes('localhost'))return r.continue();
 if(/lookup\?id=7&entity=song/.test(u))return r.fulfill({json:{results:[trk(21,'Kwaku the Traveller'),trk(22,'Second Sermon'),trk(23,'Soja')]}});
 if(/lookup\?id=\d+&entity=album/.test(u))return r.fulfill({json:{results:[{wrapperType:'collection',collectionId:55,collectionName:'New Tape',artistName:'Black Sherif',artworkUrl100:'',releaseDate:new Date(Date.now()-5*864e5).toISOString(),trackCount:10}]}});
 if(u.includes('entity=musicArtist'))return r.fulfill({json:{results:[{artistId:7,artistName:'Black Sherif',primaryGenreName:'Hip-Hop'}]}});
 if(u.includes('itunes.apple.com/search')){return r.fulfill({json:{results:/blck/i.test(u)?[trk(20,'Kwaku the Traveller')]:[trk(31,'Home song '+Math.random(),'Black Sherif'),trk(32,'Another','Black Sherif')]}})}
 return r.abort()});
await p.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){(window.__as=window.__as||[]).push(this);return Promise.resolve()}});
await p.goto('http://localhost:3199/');await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>[document.querySelector('.vw.on').textContent.slice(0,200), localStorage.getItem('hm.nr')]));
ck('New releases row appears on home',await p.evaluate(()=>/New releases/.test(document.querySelector('.vw.on').textContent)));
await p.click('.sbt');await p.fill('#q','blck sherif');await p.keyboard.press('Enter');await p.waitForTimeout(2500);
ck('misspelled artist still found (artist card)',await p.evaluate(()=>/Black Sherif/.test(document.querySelector('.vw.on .art1')?.textContent||'')));
await p.click('.vw.on [data-a=pick]');await p.waitForTimeout(800);
const first=await p.evaluate(()=>document.querySelector('#mini').textContent);
await p.evaluate(()=>{const as=window.__as.filter(a=>a.src&&!/^data:/.test(a.src));const a=as[as.length-1];a.dispatchEvent(new Event('ended'))});await p.waitForTimeout(2500);
const second=await p.evaluate(()=>document.querySelector('#mini').textContent);
console.log(first.replace(/\s+/g,' ').slice(0,60),'=>',second.replace(/\s+/g,' ').slice(0,60));
ck('next related song starts by itself',first!==second&&/Second Sermon|Soja|Kwaku/.test(second));
ck('no page errors',errs.length===0);console.log(errs);
await b.close();process.exit(fails?1:0)})()
