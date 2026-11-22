const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true});const p=await c.newPage();let fails=0;const ck=(n,v)=>{console.log(v?'ok  ':'FAIL',n);if(!v)fails++};const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>{const u=r.request().url();if(u.includes('localhost'))return r.continue();if(u.includes('itunes.apple.com/search'))return r.fulfill({json:{results:[{wrapperType:'track',kind:'song',trackId:1,trackName:'Song',artistName:'Dave',collectionName:'A',previewUrl:'http://x/p.m4a',artworkUrl100:'',trackTimeMillis:200000,primaryGenreName:'Hip-Hop'}]}});return r.abort()});
const swipe=async(x1,y,x2,sel)=>p.evaluate(([x1,y,x2,sel])=>{const el=document.querySelector(sel)||document.body;const mk=(t,x)=>new Touch({identifier:1,target:el,clientX:x,clientY:y});el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[mk(0,x1)],changedTouches:[mk(0,x1)]}));el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[mk(0,x2)]}))},[x1,y,x2,sel]);
await p.goto('http://localhost:3199/');await p.waitForTimeout(2200);
await p.click('.sbt');await p.waitForTimeout(400);
ck('on search page',await p.evaluate(()=>!!document.querySelector('.vw.on .sbox')));
await swipe(60,300,260,'.vw.on');await p.waitForTimeout(500);
ck('swipe right goes back from search',await p.evaluate(()=>!document.querySelector('.vw.on .sbox')));
await p.click('.vw.on .bub button');await p.waitForTimeout(800);
ck('artist sheet open',await p.evaluate(()=>!document.querySelector('#sh').hidden));
await swipe(60,500,260,'#sh .sheet');await p.waitForTimeout(400);
ck('swipe right closes sheet',await p.evaluate(()=>document.querySelector('#sh').hidden));
ck('loader is the halo ring',await p.evaluate(()=>{const i=document.createElement('div');i.className='hload';i.innerHTML='<i></i>';document.body.appendChild(i);const cs=getComputedStyle(i.firstChild);return cs.animationName==='hring'&&cs.borderRadius.includes('50%')}));
ck('no page errors',errs.length===0);console.log(errs);
await b.close();process.exit(fails?1:0)})()
