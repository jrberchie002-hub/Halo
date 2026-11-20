(function(){'use strict';
var ECC=[-1,10,16,26,18,24,16,18,22,22,26],BLK=[-1,1,1,2,2,4,4,4,5,5,5];
function mul(x,y){var z=0;for(var i=7;i>=0;i--){z=(z<<1)^((z>>7)*0x11D);z^=((y>>i)&1)*x;}return z&255;}
function rsDiv(d){var r=[];for(var i=0;i<d;i++)r.push(0);r[d-1]=1;var root=1;for(i=0;i<d;i++){for(var j=0;j<d;j++){r[j]=mul(r[j],root);if(j+1<d)r[j]^=r[j+1];}root=mul(root,2);}return r;}
function rsRem(data,div){var r=div.map(function(){return 0;});data.forEach(function(b){var f=b^r.shift();r.push(0);div.forEach(function(c,i){r[i]^=mul(c,f);});});return r;}
function raw(v){var r=(16*v+128)*v+64;if(v>=2){var n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36;}return r;}
function dataCw(v){return Math.floor(raw(v)/8)-ECC[v]*BLK[v];}
function align(v){if(v==1)return[];var n=Math.floor(v/7)+2,size=v*4+17,step=Math.floor((v*8+n*3+5)/(n*4-4))*2,r=[6];for(var p=size-7;r.length<n;p-=step)r.splice(1,0,p);return r;}
window.makeQR=function(text){
  var bytes=Array.from(new TextEncoder().encode(text)),v=1;
  for(;v<=10;v++){if(4+8+bytes.length*8<=dataCw(v)*8)break;}
  if(v>10)return null;
  var bits=[];function put(val,len){for(var i=len-1;i>=0;i--)bits.push((val>>>i)&1);}
  put(4,4);put(bytes.length,8);bytes.forEach(function(b){put(b,8);});
  var cap=dataCw(v)*8;put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
  var data=[];for(var i=0;i<bits.length;i+=8){var b=0;for(var j=0;j<8;j++)b=b*2+bits[i+j];data.push(b);}
  for(var pad=0xEC;data.length<dataCw(v);pad^=0xEC^0x11)data.push(pad);
  var nb=BLK[v],el=ECC[v],rc=Math.floor(raw(v)/8),ns=nb-rc%nb,sl=Math.floor(rc/nb),blocks=[],k=0,dv=rsDiv(el);
  for(i=0;i<nb;i++){var len=sl-el+(i<ns?0:1),d=data.slice(k,k+len);k+=len;var e=rsRem(d,dv);if(i<ns)d.push(0);blocks.push(d.concat(e));}
  var all=[];for(i=0;i<blocks[0].length;i++)blocks.forEach(function(bl,j){if(i!=sl-el||j>=ns)all.push(bl[i]);});
  var size=v*4+17,M=[],F=[];for(i=0;i<size;i++){M.push(new Array(size).fill(false));F.push(new Array(size).fill(false));}
  function sf(x,y,c){M[y][x]=c;F[y][x]=true;}
  for(i=0;i<size;i++){sf(6,i,i%2==0);sf(i,6,i%2==0);}
  function finder(x,y){for(var dy=-4;dy<=4;dy++)for(var dx=-4;dx<=4;dx++){var dist=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)sf(xx,yy,dist!=2&&dist!=4);}}
  finder(3,3);finder(size-4,3);finder(3,size-4);
  var ap=align(v),n=ap.length;for(i=0;i<n;i++)for(var j=0;j<n;j++){if((i==0&&j==0)||(i==0&&j==n-1)||(i==n-1&&j==0))continue;for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++)sf(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!=1);}
  function fmt(mask){var d=mask,r=d;for(var i=0;i<10;i++)r=(r<<1)^((r>>9)*0x537);var b=((d<<10)|r)^0x5412;function g(i){return((b>>i)&1)!=0;}
    for(i=0;i<=5;i++)sf(8,i,g(i));sf(8,7,g(6));sf(8,8,g(7));sf(7,8,g(8));for(i=9;i<15;i++)sf(14-i,8,g(i));
    for(i=0;i<8;i++)sf(size-1-i,8,g(i));for(i=8;i<15;i++)sf(8,size-15+i,g(i));sf(8,size-8,true);}
  fmt(0);
  if(v>=7){var r=v;for(i=0;i<12;i++)r=(r<<1)^((r>>11)*0x1F25);var vb=(v<<12)|r;for(i=0;i<18;i++){var c=((vb>>i)&1)!=0,a=size-11+i%3,bb=Math.floor(i/3);sf(a,bb,c);sf(bb,a,c);}}
  k=0;for(var right=size-1;right>=1;right-=2){if(right==6)right=5;for(var vert=0;vert<size;vert++)for(j=0;j<2;j++){var x=right-j,up=((right+1)&2)==0,y=up?size-1-vert:vert;if(!F[y][x]&&k<all.length*8){M[y][x]=((all[k>>3]>>(7-(k&7)))&1)!=0;k++;}}}
  function cond(m,x,y){return[(x+y)%2==0,y%2==0,x%3==0,(x+y)%3==0,(Math.floor(x/3)+Math.floor(y/2))%2==0,x*y%2+x*y%3==0,(x*y%2+x*y%3)%2==0,((x+y)%2+x*y%3)%2==0][m];}
  function apply(m){for(var y=0;y<size;y++)for(var x=0;x<size;x++)if(!F[y][x]&&cond(m,x,y))M[y][x]=!M[y][x];}
  function pen(){var p=0,y,x;for(y=0;y<size;y++){var run=1;for(x=1;x<size;x++){if(M[y][x]==M[y][x-1]){run++;if(run==5)p+=3;else if(run>5)p++;}else run=1;}}
    for(x=0;x<size;x++){run=1;for(y=1;y<size;y++){if(M[y][x]==M[y-1][x]){run++;if(run==5)p+=3;else if(run>5)p++;}else run=1;}}
    for(y=0;y<size-1;y++)for(x=0;x<size-1;x++){var c=M[y][x];if(c==M[y][x+1]&&c==M[y+1][x]&&c==M[y+1][x+1])p+=3;}return p;}
  var best=0,bp=1e9;for(var m=0;m<8;m++){apply(m);fmt(m);var s=pen();if(s<bp){bp=s;best=m;}apply(m);}
  apply(best);fmt(best);return{size:size,m:M};
};
window.qrSvg=function(text,fg,bg,quiet){var q=makeQR(text);if(!q)return '';quiet=quiet==null?3:quiet;var n=q.size+quiet*2,d='';for(var y=0;y<q.size;y++)for(var x=0;x<q.size;x++)if(q.m[y][x])d+='M'+(x+quiet)+' '+(y+quiet)+'h1v1h-1z';return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+n+' '+n+'" shape-rendering="crispEdges"><rect width="'+n+'" height="'+n+'" fill="'+(bg||'#fff')+'"/><path d="'+d+'" fill="'+(fg||'#000')+'"/></svg>';};
})();
