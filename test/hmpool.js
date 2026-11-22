const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await (await b.newContext({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',viewport:{width:390,height:800}})).newPage();let fails=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fails++};const errs=[];p.on('pageerror',e=>errs.push(e.message));
const trk=(id,n,a)=>({wrapperType:'track',kind:'song',trackId:id,trackName:n,artistName:'Black Sherif',collectionName:'Alb',previewUrl:'http://127.0.0.1:1/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Hip-Hop'});
await p.addInitScript(()=>{const ae=HTMLMediaElement.prototype.addEventListener;HTMLMediaElement.prototype.addEventListener=function(t,f,o){if(t==='error')return;return ae.call(this,t,f,o)};Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return !this.__pl}});HTMLMediaElement.prototype.play=function(){this.__pl=1;this.dispatchEvent(new Event('play'));return Promise.resolve()};HTMLMediaElement.prototype.pause=function(){this.__pl=0;this.dispatchEvent(new Event('pause'))}});
await p.route('**/*',r=>{const u=decodeURIComponent(r.request().url());if(u.includes('localhost'))return r.continue();
 if(u.includes('youtube.com/iframe_api'))return r.fulfill({contentType:'text/javascript',body:"window.YT={Player:function(id,o){window.__yo=o;this.loadVideoById=function(){};this.getCurrentTime=function(){return 0};this.getDuration=function(){return 200};this.pauseVideo=function(){};this.playVideo=function(){};this.stopVideo=function(){};this.destroy=function(){};setTimeout(function(){o.events.onReady()},10)}};setTimeout(function(){window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady()},10)"});
 if(u.includes('googleapis.com/youtube/v3/search'))return r.fulfill({json:{items:[{id:{videoId:'YT1'},snippet:{title:'Black Sherif - Painkiller',channelTitle:'Black Sherif - Topic'}}]}});
 if(u.includes('googleapis.com/youtube/v3/videos'))return r.fulfill({json:{items:[{id:'YT1',contentDetails:{duration:'PT3M20S'}}]}});
 if(u.includes('api.audius.co')){return r.fulfill({json:{data:/Second/.test(u)?[{id:'AUD2',title:'Second Sermon',duration:200,is_streamable:true,user:{name:'Black Sherif'}}]:[]}})}
 if(/lookup\?id=7&entity=song/.test(u))return r.fulfill({json:{results:[trk(21,'Painkiller'),trk(22,'Second Sermon'),trk(23,'Soja')]}});
 if(/lookup\?id=\d+&entity=album/.test(u))return r.fulfill({json:{results:[]}});
 if(u.includes('entity=musicArtist'))return r.fulfill({json:{results:[{artistId:7,artistName:'Black Sherif',primaryGenreName:'Hip-Hop'}]}});
 if(u.includes('itunes.apple.com/search'))return r.fulfill({json:{results:[trk(21,'Painkiller')]}});
 return r.abort()});
await p.goto('http://localhost:3199/');await p.waitForTimeout(2000);
await p.click('.sbt');await p.fill('#q','painkiller');await p.keyboard.press('Enter');await p.waitForTimeout(2500);
await p.click('.vw.on [data-a=pick]');await p.waitForTimeout(2500);
await p.evaluate(()=>window.__yo&&window.__yo.events.onStateChange({data:1}));await p.waitForTimeout(6000);
const before=await p.evaluate(()=>document.querySelector('#mini').textContent.replace(/\s+/g,' '));
await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get(){return true}});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(1500);
const after=await p.evaluate(()=>document.querySelector('#mini').textContent.replace(/\s+/g,' '));
console.log(before,'=>',after);
ck('Painkiller was playing through YouTube',/Painkiller/.test(before));
ck('leaving the app jumps to a related song that can play with the screen off',/Second Sermon/.test(after));
await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get(){return false}});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(1500);
const back=await p.evaluate(()=>document.querySelector('#mini').textContent.replace(/\s+/g,' '));
ck('coming back returns to the original song',/Painkiller/.test(back));
ck('no page errors',errs.length===0);console.log(errs);
await b.close();process.exit(fails?1:0)})()
