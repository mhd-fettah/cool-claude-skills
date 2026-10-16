const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), lerp=(a,b,p)=>a+(b-a)*p;
const easeOut=x=>1-Math.pow(1-x,3), easeIn=x=>x*x*x, easeIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const expoOut=x=>x>=1?1:1-Math.pow(2,-10*x);
const backOut=x=>{const c1=1.6,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const P=(t,a,d=.6,f=easeOut)=>f(clamp((t-a)/d));
const lerp3=(a,b,p)=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p),lerp(a[2],b[2],p)];
function h(html){const d=document.createElement('div');d.innerHTML=html.trim();return d.firstElementChild;}
function add(p,html,x,y){const el=h(html);el.style.position='absolute';if(x!=null)el.style.left=x+'px';if(y!=null)el.style.top=y+'px';p.appendChild(el);return el;}
function seeded(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const BEATS=(window.TIMELINE&&TIMELINE.beats)||[];
function beatPulse(t,decay=.12){let lo=0,hi=BEATS.length-1,b=-1;while(lo<=hi){const m=(lo+hi)>>1;if(BEATS[m]<=t){b=BEATS[m];lo=m+1;}else hi=m-1;}return b<0?0:Math.exp(-(t-b)/decay);}
// closedness of the clapperboard: snaps shut just before s, reopens after
const clapAt=(t,s)=>Math.min(clamp((t-s+.07)/.07),1-easeOut(clamp((t-s-.12)/.4)));
// a quick push that settles: 0 -> 1 -> 0
const bump=(t,s,up=.1,down=.6)=>P(t,s,up)*(1-P(t,s+up,down));
