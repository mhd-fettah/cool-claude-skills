// Each shot: camF(t) gives [pos, look, fov, roll]; update poses the world, then renders.
const GLOW=document.getElementById('glow'),FLASH=document.getElementById('flash'),BLACK=document.getElementById('black');
function glow(p,size,color,op){const[x,y]=W.toScreen(p);GLOW.style.left=x+'px';GLOW.style.top=y+'px';GLOW.style.transform=`scale(${size})`;
  GLOW.style.background=`radial-gradient(closest-side,${color},rgba(0,0,0,0))`;GLOW.style.opacity=op;}
function words(root,s,cfg){return s.lines.map((L,i)=>add(root,`<div class="w" style="font-size:${cfg.size}px">${L.text}</div>`,cfg.x,cfg.y+i*cfg.gap));}
function wordFx(el,t,s,cur){s-=.03;const p=P(t,s,.22),pop=P(t,s,.32,backOut);el.style.opacity=p*(cur?1:.32);el.style.filter=p<1?`blur(${((1-p)*18).toFixed(1)}px)`:'none';
  el.style.transform=`translateY(${((1-p)*50).toFixed(1)}px) scale(${lerp(1.22,1,pop).toFixed(4)})`;}
function wordsUpd(els,t,C){els.forEach((el,i)=>wordFx(el,t,C(i),i===els.length-1||t<C(i+1)));}
function shoot(camF,t,gt,extra=0,punch=.022){W.camSet(camF(t),camF(t-1/30),gt,extra,punch);}
// orbit a point; off>0 shifts the subject to the right of frame
function orbit(c,az,r,hh,off=0,roll=0,fov=34){const rx=Math.cos(az),rz=-Math.sin(az);
  return[[c[0]+Math.sin(az)*r,c[1]+hh,c[2]+Math.cos(az)*r],[c[0]-rx*off,c[1],c[2]-rz*off],fov,roll];}
// Clawd's dance, locked to the beat
function dance(gt,amt){const b=gt/.5,ph=b-Math.floor(b),sb=Math.sin(Math.PI*b);
  return{bounce:amt*.13*Math.abs(sb),squash:amt*(.16*Math.exp(-ph*9)-.05*Math.abs(sb)),rz:amt*.14*sb,ryx:amt*.38*Math.sin(Math.PI*b/2),
    armL:amt*(.3+1.1*Math.max(0,sb)),board:amt*(.15+.55*Math.max(0,-sb)),legL:amt*.07*Math.max(0,sb),legR:amt*.07*Math.max(0,-sb),
    eyes:['happy','normal','happy','wink','happy','sure','happy','blink'][Math.floor(b)%8]};}
const pose=(d,o)=>Object.assign({},d,o,{ry:(o.ry||0)+(d.ryx||0)});

const README=['# Explainer Video Maker','Turn docs, links, or text files into a narrated,','animated explainer video (MP4).','','## Features',
 'Any material in: a URL, uploaded files, a folder,','pasted text, or just a topic to research. If a page','can’t be fetched, it reads it through Claude in','Chrome before asking you.',
 'Narrated or silent: natural voiceover with a choice','of US and British voices and adjustable speed, or a','silent video timed to reading speed. Captions can','be turned off.',
 'Creative or faithful: choose between original,','minimal animations that explain the ideas (default),','a balanced mix, or scenes that stick closely to the','source and its screenshots.',
 'Animated scenes: diagrams, icon cards, typed','terminal commands, flowcharts, and screenshots','shown in browser mockups. Not just slides of text.',
 'On-brand: picks up the logo, colors, fonts, and','screenshots from your site, so the video looks','like yours.','Styles to fit the content: suggests a look based on',
 'the material: Terminal dark, Clean corporate,','Whiteboard, Paper cutout, Isometric, Blueprint,','Flat vector story or Minimal monochrome.',
 'Explainers or promos: a full narrated explainer, or','a 15–60 s promo cut to the beat of your music track.','Captions and chapters: on-screen captions, a chapter',
 'header, and a progress bar. Free and offline: no','paid service or API key. The voice and the','rendering run locally.','','## Install',
 'claude.ai: zip the explainer-video-maker folder and','upload it under Settings → Capabilities → Skills.','Claude Code: copy the folder into your skills','directory. Requirements: Python 3, Node.js, ffmpeg.'];
const LH=50;

// glass crack (31.72 s) and shatter (32 s), drawn in one SVG over everything
const FX=document.getElementById('fx'),TI=31.72,TB=32.0,CX=960,CY=520;
const SH=(()=>{const r=seeded(5),N=15,ang=[...Array(N)].map((_,i)=>i/N*6.283+r()*.3),R=[0,70,190,380,700,1500];
  const pt=(i,k)=>{const a=ang[i%N]+(k?(r()-.5)*.08:0);return[CX+Math.cos(a)*R[k]*(1+(k?(r()-.5)*.25:0)),CY+Math.sin(a)*R[k]*(1+(k?(r()-.5)*.25:0))];};
  const P2=[...Array(N)].map((_,i)=>R.map((_,k)=>pt(i,k)));const NS='http://www.w3.org/2000/svg';
  const mk=(tag,a)=>{const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);FX.appendChild(e);return e;};
  const cracks=[];for(let i=0;i<N;i++)cracks.push(mk('polyline',{points:P2[i].map(p=>p.join(',')).join(' '),fill:'none',stroke:'rgba(255,255,255,.9)','stroke-width':3,'stroke-linejoin':'bevel'}));
  for(let k=1;k<4;k++)cracks.push(mk('polygon',{points:P2.map(q=>q[k].join(',')).join(' '),fill:'none',stroke:'rgba(255,255,255,.7)','stroke-width':2}));
  const shards=[];for(let i=0;i<N;i++)for(let k=0;k<4;k++){const q=[P2[i][k],P2[i][k+1],P2[(i+1)%N][k+1],P2[(i+1)%N][k]],c=q.reduce((a,p)=>[a[0]+p[0]/4,a[1]+p[1]/4],[0,0]);
    const e=mk('polygon',{points:q.map(p=>(p[0]-c[0])+','+(p[1]-c[1])).join(' '),fill:'rgba(255,255,255,.07)',stroke:'rgba(255,255,255,.75)','stroke-width':2});
    shards.push({e,c,v:[(c[0]-CX)*(1.4+r()),(c[1]-CY)*(1.4+r())-200],w:(r()-.5)*900,d:r()*.08});}
  cracks.forEach(e=>{e._len=e.getTotalLength();e.style.strokeDasharray=e._len;});return{cracks,shards};})();
function shatter(gt){const pc=clamp((gt-TI)/.1),on=gt>=TI&&gt<TB;
  SH.cracks.forEach(e=>{e.style.visibility=on?'visible':'hidden';e.style.strokeDashoffset=e._len*(1-pc);});
  SH.shards.forEach(s=>{const tt=gt-TB-s.d;if(tt<0||tt>.9){s.e.style.visibility='hidden';return;}s.e.style.visibility='visible';
    s.e.setAttribute('transform',`translate(${s.c[0]+s.v[0]*tt},${s.c[1]+s.v[1]*tt+900*tt*tt}) rotate(${s.w*tt})`);s.e.style.opacity=1-tt/.9;});}

const SCENES={
open:{camF(t){const kB=easeIO(clamp((t-4.35)/1.1)),kC=expoOut(clamp((t-5.95)/.7));
    let p=lerp3(lerp3([.95,1.42,2.45],[.9,1.4,2.3],clamp(t/3)),[1.75,1.3,4.3],kB),l=lerp3([2.7,1.2,-6],[1.6,1.05,-1.2],kB);
    const F=orbit([0,1.05,0],.3,5.8,.2,-1.45);p=lerp3(p,F[0],kC);l=lerp3(l,F[1],kC);
    p[2]-=bump(t,7,.05,.5)*.45;const sh=t>7&&t<7.4?(1-(t-7)/.4)*.025:0;
    return[[p[0]+sh*Math.sin(t*90),p[1]+sh*Math.cos(t*77),p[2]],l,lerp(36,32,kC),0];},
  build(r){const wrap=add(r,'<div></div>',640,0);wrap.style.cssText+=';width:1240px;height:1080px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent 6%,#000 30%,#000 70%,transparent 94%)';
    const inner=h(`<div style="position:absolute;left:40px;top:430px;width:1150px"></div>`);wrap.appendChild(inner);
    const lines=README.map((s,i)=>{const big=s.startsWith('#');return add(inner,`<div style="font:${big?800:500} ${big?(s.startsWith('##')?40:46):33}px/1 'Inter Tight',sans-serif;white-space:nowrap;color:#f5f5f7">${s.replace(/^#+ /,'')}</div>`,0,i*LH);});
    const bub=add(r,`<div style="position:absolute;width:0;height:0;z-index:10"><div style="position:absolute;left:0;bottom:0;transform-origin:0 100%;width:max-content;background:#f5f5f7;color:#151413;border-radius:44px;padding:26px 40px 30px;box-shadow:0 20px 60px rgba(0,0,0,.45)">
      <div style="font:800 76px/1 'Inter Tight',sans-serif;letter-spacing:-.02em">Huh?</div><div style="font:600 34px/1.2 'Inter Tight',sans-serif;margin-top:8px;color:#5a5550">What did you say?</div>
      <div style="position:absolute;left:28px;bottom:-22px;width:44px;height:44px;background:#f5f5f7;transform:rotate(45deg);border-radius:6px"></div></div></div>`,0,0);
    const lets=add(r,'<div></div>',880,330);lets.innerHTML=`<div class="w" style="position:relative;font-size:190px">Let’s</div><div class="w grad" style="position:relative;font-size:190px;line-height:1.05;padding-bottom:12px">do it.</div>`;
    return{wrap,inner,lines,bub,bi:bub.firstElementChild,lets:[...lets.children]};},
  update(t,C,st,gt){W.only('clawd','floor');W.floor(0,0);
    // 0-3 s over his shoulder | 3 s text pauses, he turns: "Really?" | "Let's do it." | jump + spin | CLACK over the text
    const look=backOut(clamp((t-4.35)/.55)),spin=easeIO(clamp((t-6.3)/.45));
    let ry=lerp(Math.PI+.25,.55,look);if(t>=6.3)ry=lerp(.55,.32-2*Math.PI,spin);
    let eyes='normal';if(t>=4.45&&t<5.4)eyes='sure';else if(t>=5.4&&t<5.95)eyes='wow';else if(t>=5.95&&t<6.9)eyes='happy';else if(t>=6.9&&t<7.12)eyes='sure';else if(t>=7.12)eyes='happy';
    const raise=easeOut(clamp((t-6.7)/.25))*(1-easeIO(clamp((t-7.35)/.5)));
    let cl=0;if(t>=6.7&&t<6.93)cl=-.8*easeOut(clamp((t-6.7)/.2));else if(t>=6.93)cl=t<7?lerp(-.8,1,(t-6.93)/.07):1-easeOut(clamp((t-7.12)/.4));
    const jump=t>6.3&&t<6.75?Math.sin((t-6.3)/.45*Math.PI):0,land=t>=6.75?.25*Math.exp(-(t-6.75)*9):0,tilt=.16*P(t,4.6,.3)*(1-P(t,5.5,.3));
    W.clawd({ry,eyes,rz:t<3?.03*Math.sin(t*1.7):tilt-.08*raise,lean:t<3?-.06:0,board:raise*.45,reach:raise*1.2,clap:cl,armL:1.1*P(t,C(0),.25)*(1-P(t,6.3,.15))+.4*raise,
      bounce:.6*jump,squash:.012*Math.sin(t*2.4)+land-.06*jump+P(t,7.6,.4,easeIn)*.2});
    const dof=t<4.35?11:lerp(11,0,easeOut(clamp((t-4.35)/.45)));W.camSet(this.camF(t),this.camF(t-1/30),gt,0);
    W.renderSplit(dof,t>4.75);
    // speech bubble pops next to his head
    const bp=backOut(clamp((t-4.62)/.3)),bo=clamp((t-4.62)/.1)*(1-clamp((t-5.75)/.15));const[hx,hy]=W.toScreen(W.clawdPoint(21,3,14));
    st.bub.style.left=(hx+40)+'px';st.bub.style.top=(hy+10)+'px';st.bi.style.opacity=bo;st.bi.style.transform=`scale(${(.4+.6*bp).toFixed(3)}) rotate(${(-4*(1-bp)).toFixed(2)}deg)`;
    glow(t<6?[1.5,1.2,-4]:[0,1,0],1,'rgba(217,119,87,.25)',P(t,.2,1.5));
    // README scrolls, eases to a stop on "What if…", then whooshes off on "Let's do it."
    const sc=t<3?t:3+(1-Math.exp(-(t-3)*5))/5,wh=easeIn(clamp((t-5.92)/.4)),y=-sc*105-2400*wh;
    st.inner.style.transform=`translateY(${y.toFixed(1)}px)`;
    st.wrap.style.opacity=P(t,0,.6)*(1-clamp((t-6.05)/.3));st.wrap.style.filter=wh>0?`blur(${(wh*22).toFixed(1)}px)`:'none';
    st.lines.forEach((el,i)=>{const yy=430+i*LH+y,g=Math.exp(-Math.pow((yy-500)/55,2));el.style.color=`rgba(245,245,247,${(.28+.72*g).toFixed(3)})`;});
    st.lets.forEach((el,i)=>{const s=C(i)-.03,p=clamp((t-s)/.08);el.style.opacity=p;el.style.transform=`scale(${lerp(1.9,1,P(t,s,.3,backOut)).toFixed(4)})`;el.style.filter=p<1?`blur(${((1-p)*12).toFixed(1)}px)`:'none';});
    FLASH.style.opacity=(t>=7?.5*(1-P(t,7,.25)):0);BLACK.style.opacity=0;}},

action:{camF(t){return orbit([1.3,1.0,0],lerp(-.22,.16,easeIO(clamp(t/4))),lerp(7.9,7.2,easeOut(clamp(t/4))),.4,0,lerp(-.05,.03,t/4),34);},
  build(r,C,s){return{w:words(r,s,{x:130,y:110,gap:140,size:124})};},
  update(t,C,st,gt){W.only('clawd','floor','conf','cards','main');W.floor(0,0);W.confetti(t);
    // docs fly in from the left and disappear into Clawd
    W.cards.forEach((c,i)=>{const s0=C(0)-.7+i*.1,p=clamp((t-s0)/.7),e=p*(.6+.4*p);
      if(p<=0||p>=1){c.g.scale.setScalar(.001);return;}
      c.g.position.set(lerp(-5.6,-.15,e),lerp(.6+(i%4)*.5,1.1,e)+.7*Math.sin(Math.PI*p),lerp((i%3-1)*.9,.35,e));
      c.g.rotation.set(.25*Math.sin(i+t*4),-.1+.45*Math.sin(t*5+i),.35*Math.sin(i*2+t*5));c.g.scale.setScalar(.95*(1-Math.pow(p,5)));});
    // on "video": CLACK, and the finished video pops out on the right
    const v=C(1),d=dance(gt,.6),raise=P(t,v-.45,.3)*(1-P(t,v+.4,.4)),pop=backOut(clamp((t-v)/.45));
    W.clawd(pose(d,{ry:.1,bounce:d.bounce+.7*Math.sin(Math.PI*clamp(t/.5)),board:Math.max(d.board,raise*1.1),clap:t>v-.5?(t<v?-.7*P(t,v-.45,.3)+1.7*clamp((t-v+.07)/.07):clapAt(t,v)):0,
      eyes:t<.5?'wow':t>C(0)&&t<v-.1?'wow':t>=v-.1&&t<v+.15?'sure':d.eyes}));
    W.main.g.position.set(3.85,1.35,-.6);W.main.g.rotation.set(0,-.32,0);W.main.g.scale.setScalar(Math.max(.001,.55*pop));W.paintVideo(Math.max(0,t-v));
    shoot(this.camF,t,gt,0,.05);W.render();
    if(t<v)glow([0,1,0],1,'rgba(217,119,87,.30)',1);else glow([3.85,1.35,-.6],1.2,'rgba(255,170,120,.42)',P(t,v,.3));
    wordsUpd(st.w,t,C);FLASH.style.opacity=t>=v?.45*(1-P(t,v,.25)):.9*(1-P(t,0,.35));}},

files:{camF(t){const q=easeOut(clamp(t/4));return orbit([0,1.0,0],lerp(.55,-.5,q),lerp(5.0,7.6,q),lerp(.35,2.5,q),1.6,lerp(.1,0,q),36);},
  build(r,C,s){return{w:words(r,s,{x:130,y:640,gap:160,size:140})};},
  update(t,C,st,gt){W.only('clawd','floor','cards');W.floor(0,0);
    const k=easeIn(clamp((t-2.75)/.75));
    W.cards.forEach((c,i)=>{const a=t*2.3+i*.628+(1-P(t,0,.9))*2.5,r=lerp(2.5+(i%3)*.4,.15,k)*(.55+.45*P(t,0,.7)),y=.3+(i%5)*.4+.15*Math.sin(t*3+i);
      c.g.position.set(Math.sin(a)*r,lerp(y,1.4,k),Math.cos(a)*r);c.g.rotation.set(.12*Math.sin(t*2+i),a,.18*Math.sin(t*3+i));c.g.scale.setScalar(Math.max(.001,(1-k)*.82));});
    const d=dance(gt,.75),raise=P(t,2.6,.4)*(1-P(t,3.8,.2));
    W.clawd(pose(d,{board:Math.max(d.board,raise*1.0),clap:t>2.6?clapAt(t,3.5):0,eyes:t>3.4&&t<3.8?'sure':d.eyes}));
    shoot(this.camF,t,gt,0,.04);W.render();glow([0,1,0],1.1,'rgba(217,119,87,.28)',1);wordsUpd(st.w,t,C);FLASH.style.opacity=t>=3.5?.45*(1-P(t,3.5,.25)):0;}},

clock:{camF(t){const q=easeOut(clamp(t/4)),az=lerp(-1.1,.42,q),r=lerp(4.8,3.5,q),hh=lerp(1.7,.65,q);return[[Math.sin(az)*r-.2,hh,Math.cos(az)*r],[-.35,.55,0],36,lerp(.1,0,q)];},
  build(r,C,s){return{w:words(r,s,{x:130,y:130,gap:160,size:140})};},
  update(t,C,st,gt){W.only('main','wave','clawd');W.main.g.position.set(0,0,0);W.main.g.rotation.set(-Math.PI/2,0,0);W.main.g.scale.setScalar(1);
    const ph=.15+(t-C(1))*1.22;W.wave(t,gt,ph);W.paintTimeline(640+(ph/2.45)*600);
    const d=dance(gt,.8),jump=.6*Math.sin(Math.PI*clamp((t-C(1)+.05)/.55));
    W.clawd(pose(d,{pos:[.35,.06,.75],scale:.42,ry:.25,bounce:d.bounce+jump,eyes:t>C(1)-.05&&t<C(1)+.5?'wow':d.eyes}));
    shoot(this.camF,t,gt);W.render();glow([0,.6,0],.9,'rgba(110,125,255,.22)',P(t,0,.8));wordsUpd(st.w,t,C);FLASH.style.opacity=0;}},

styles:{camF(t){const tr=clamp(t/1.9),x=lerp(-3,21,tr*.15+.85*easeIO(tr)),k=expoOut(clamp((t-1.7)/.9));
    const p=lerp3([x,lerp(1.2,.6,tr),lerp(8.5,7.4,tr)],[33.2,.2,8.6],k),l=lerp3([lerp(2.5,24,tr*.15+.85*easeIO(tr)),0,0],[19.6,.3,-.6],k);
    return[[p[0]-.4*easeIO(clamp((t-2.6)/1.4)),p[1],p[2]],l,34,.07*Math.sin(Math.PI*clamp(t/2.2))*(1-k)];},
  build(r,C,s){return{w:words(r,s,{x:130,y:120,gap:150,size:128})};},
  update(t,C,st,gt){W.only('lineup');W.lineup[8].g.visible=false;const b=C(1);
    for(let i=0;i<8;i++){const L=W.lineup[i],fs=b-.05+(7-i)*.07,face=Math.atan2(33.2-L.g.position.x,8.6-L.g.position.z);
      W.styleBrand(i,t>=b-.15);L.g.rotation.y=lerp(-.35,face,backOut(clamp((t-fs)/.5)));}
    shoot(this.camF,t,gt);W.render();glow([20,0,0],1.1,'rgba(217,119,87,.32)',P(t,b,.6));wordsUpd(st.w,t,C);FLASH.style.opacity=0;}},

anim:{camF(t){const q=expoOut(clamp(t/1.8)),push=easeIO(clamp((t-1.8)/2.2));
    return[lerp3([-.2,8.5,1.0],[.5,.35,9.0],q).map((v,i)=>v-[0,0,.8][i]*push),lerp3([0,0,0],[-2.3,0,0],q),34,lerp(.25,0,q)];},
  build(r,C,s){return{w:words(r,s,{x:110,y:560,gap:135,size:104})};},
  update(t,C,st,gt){W.only('main','clawd');W.main.g.position.set(0,0,0);W.main.g.rotation.set(0,0,0);W.main.g.scale.setScalar(1);W.paintFlow(t);
    // Clawd peeks over the top edge of the screen and winks
    const up=backOut(clamp((t-C(1)+.05)/.45));
    W.clawd({pos:[1.25,lerp(-.05,.98,up),-.45],scale:.7,ry:-.1,rz:-.14*up,eyes:t>3.15&&t<3.6?'wink':t>C(1)?'happy':'normal',armL:up*(.8+.5*Math.sin(t*14)),board:.2*up,clap:0});
    shoot(this.camF,t,gt);W.render();glow([0,0,0],1,'rgba(217,119,87,.22)',P(t,.5,1));wordsUpd(st.w,t,C);FLASH.style.opacity=0;}},

free:{camF(t){const ry=-.35,eye=W.clawdPoint(3,5.6,6.6),dir=[Math.sin(ry),0,Math.cos(ry)];
    const start=[eye[0]+dir[0]*.45,eye[1]+.02,eye[2]+dir[2]*.45],L=[-.45,1.0,0],az=.3,end=[L[0]+Math.sin(az)*7.6,2.0,Math.cos(az)*7.6];
    const q=1-Math.pow(1-clamp(t/1.7),4);let p=lerp3(start,end,q),l=lerp3(eye,L,q),fov=35;
    const sh=t>3.72?(1-clamp((t-3.72)/.28))*.05:0;return[[p[0]+sh*Math.sin(t*95),p[1]+sh*Math.cos(t*83),p[2]],l,fov,lerp(.15,0,q)];},
  build(r,C,s){return{w:words(r,s,{x:130,y:560,gap:140,size:128})};},
  update(t,C,st,gt){W.only('clawd','chips','floor');W.floor(0,0);
    const lp=easeIn(clamp((t-3.1)/.62)),d=dance(gt,P(t,1.3,.8)*(1-clamp((t-3.0)/.1)));
    W.clawd(pose(d,{ry:-.35}));const cp=this.camF(Math.min(t,3.05))[0];
    // the leap: from the floor straight into the lens
    W.clawd(pose(d,{pos:lerp3([0,0,0],[cp[0]*.86,cp[1]*.86-.95,cp[2]*.86],lp).map((v,i)=>i===1?v+.9*Math.sin(Math.PI*Math.min(1,lp*1.3)):v),ry:lerp(-.35,.3,clamp((t-3.0)/.3)),
      armL:t>3?1.4:d.armL,board:t>3?.6:d.board,eyes:t<1.2?(t>.55&&t<.85?'wink':'normal'):t>3?'wow':d.eyes,squash:t>3.72?-.0:d.squash}));
    const c=this.camF(t);W.camSet(c,this.camF(t-1/30),gt);
    W.chips.forEach((ch,i)=>{const a=t*(1.1+.9*easeIn(clamp((t-3)/1)))+i*2.094,s=backOut(clamp((t-C(2)+.03-[0,.25,.5][i])/.35));
      ch.m.position.set(Math.sin(a)*1.6,[1.8,1.0,.3][i],Math.cos(a)*1.6);ch.m.quaternion.copy(W.cam.quaternion);ch.m.scale.setScalar(Math.max(.001,s));});
    W.render();glow([0,1,0],.9,'rgba(217,119,87,.30)',P(t,.4,1));wordsUpd(st.w,t,C);FLASH.style.opacity=t>=3.72?.35*(1-P(t,3.72,.15)):0;shatter(gt);}},

logo:{camF(t){const k=P(t,0,.7,backOut);let d=lerp(17,8.2,k)-.9*easeIO(clamp((t-.7)/8.3));d*=1-.06*bump(t,4,.08,.6);
    const az=lerp(-.28,.12,easeIO(clamp(t/9))),L=[1.75,1.0,0];return[[L[0]+Math.sin(az)*d,1.45+.1*Math.sin(t*.6),Math.cos(az)*d],L,30,0];},
  build(r,C,s){const box=add(r,'<div></div>',1010,300);
    box.innerHTML=`<div class="w" style="position:relative;font-weight:600;font-size:52px;letter-spacing:-.01em;color:var(--muted)">Explainer Video Maker</div>
      <div class="w grad" style="position:relative;font-size:140px;margin-top:34px;line-height:1.02">Watch,</div>
      <div class="w grad" style="position:relative;font-size:140px;line-height:1.08;padding-bottom:10px">don’t read.</div>
      <div class="w" style="position:relative;display:inline-block;margin-top:44px;font:500 40px JBM;letter-spacing:0;color:#f5f5f7;padding:18px 34px;border:3px solid rgba(217,119,87,.8);border-radius:60px;background:rgba(217,119,87,.10)">/explainer-video-maker</div>`;
    return{e:[...box.children]};},
  update(t,C,st,gt){W.only('clawd','floor','conf');W.floor(0,0);W.confetti(t-4,[0,1.6,0]);
    const fall=t<.3?lerp(1.6,0,easeIn(t/.3)):0,land=t>=.3?.32*Math.exp(-(t-.3)*7):0,d=dance(gt,.45*P(t,.8,.6));
    W.clawd(pose(d,{ry:lerp(-1.0,-.25,easeIO(clamp(t/9))),bounce:d.bounce+fall,squash:d.squash+land,clap:clapAt(t,4),board:Math.max(d.board,P(t,3.5,.35)*(1-P(t,4.4,.4))*.9),
      eyes:t<.35?'wow':t>6.2&&t<6.6?'wink':'happy'}));
    shoot(this.camF,t,gt);W.render();glow(W.clawdPoint(6,3,8),1,'rgba(217,119,87,.40)',1);
    [C(0),C(1),C(2),4.0].forEach((s,i)=>wordFx(st.e[i],t,s,true));FLASH.style.opacity=t>=4?.35*(1-P(t,4,.3)):.6*(1-P(t,0,.35));BLACK.style.opacity=clamp((gt-40.2)/.8);shatter(gt);}},
};
