const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});let fails=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fails++};
await p.route('**/*',r=>{const u=r.request().url();if(u.includes('localhost'))return r.continue();
 if(u.includes('api.audius.co')){return r.fulfill({json:{data:[{id:'AUD9',title:'Lonely At The Top - Asake',duration:201,is_streamable:true,user:{name:'fanuploads',is_verified:false}},{id:'WRONG',title:'Lonely At The Top - Asake',duration:95,is_streamable:true,user:{name:'clip',is_verified:false}}]}})}
 if(u.includes('googleapis.com/youtube'))return r.fulfill({json:{items:[]}});
 if(u.includes('itunes.apple.com/search'))return r.fulfill({json:{results:[{wrapperType:'track',kind:'song',trackId:77,trackName:'Lonely At The Top',artistName:'Asake',collectionName:'Work of Art',previewUrl:'http://x/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Afrobeats'}]}});
 return r.abort()});
await p.goto('http://localhost:3199/');await p.waitForTimeout(2500);await p.click('.vw.on .row');await p.waitForTimeout(2500);
const m=await p.evaluate(()=>JSON.parse(localStorage.getItem('hm.bgm3')||'{}'));
ck('same-length upload found for background play: '+JSON.stringify(m),Object.values(m).includes('AUD9'));
await b.close();process.exit(fails?1:0)})()
