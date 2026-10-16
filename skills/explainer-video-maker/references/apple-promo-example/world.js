// One shared Three.js world. Scenes pose it per shot and call W.render().
const W={};
(function(){
const T=THREE,S=.12,rnd=seeded(11);
const ren=new T.WebGLRenderer({canvas:document.getElementById('gl'),antialias:true,alpha:true,preserveDrawingBuffer:true});
ren.setPixelRatio(1);ren.setSize(1920,1080,false);ren.outputColorSpace=T.SRGBColorSpace;
ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.1;
const scene=new T.Scene(),cam=new T.PerspectiveCamera(35,16/9,.03,300);
// studio reflections for the glossy look
const pmrem=new T.PMREMGenerator(ren);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.add(new T.AmbientLight(0xffffff,.25));
const key=new T.DirectionalLight(0xffffff,2.0);key.position.set(-4,7,6);scene.add(key);
const rim=new T.DirectionalLight(0x8494ff,3.4);rim.position.set(5,3,-6);scene.add(rim);
const warm=new T.DirectionalLight(0xff9a6b,1.2);warm.position.set(3,-2,4);scene.add(warm);
const _m=new T.Matrix4(),_q=new T.Quaternion(),_p=new T.Vector3(),_s=new T.Vector3();

// ---------- rigged voxel Clawd (model from assets/mascot/build_mascot.py) ----------
// model coords: x right, y toward viewer, z up. Root sits at the feet.
const O=0xd97757,SL=0x2b2b2e,CH=0xf2f0ea;
const Wp=(ex,ey,ez)=>new T.Vector3((ex-9.5)*S,ez*S,(ey-3)*S);   // voxel-edge coords -> world
const vc=(x,y,z)=>Wp(x+.5,y+.5,z+.5);
const vgeo=new RoundedBoxGeometry(S*.97,S*.97,S*.97,2,S*.16);
const vmat=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.36,clearcoat:.75,clearcoatRoughness:.28,envMapIntensity:.9});
function boxL(x0,x1,y0,y1,z0,z1,c,out=[]){for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)out.push({x,y,z,c});return out;}
function part(list,parent,origin,localFn){const m=new T.InstancedMesh(vgeo,vmat,list.length),c=new T.Color();
  list.forEach((v,i)=>{const p=localFn?localFn(v,i):vc(v.x,v.y,v.z).sub(origin);m.setMatrixAt(i,_m.makeTranslation(p.x,p.y,p.z));
    c.setHex(v.c);const j=.93+rnd()*.12;c.r*=j;c.g*=j;c.b*=j;m.setColorAt(i,c);});m.instanceColor.needsUpdate=true;parent.add(m);return m;}
function pivot(parent,edge,rel){const g=new T.Group();g.position.copy(Wp(...edge).sub(rel||new T.Vector3()));parent.add(g);return g;}
const clawd=new T.Group();scene.add(clawd);
const bod=new T.Group();clawd.add(bod);
const torso=boxL(0,11,0,5,2,9,O).filter(v=>v.x==0||v.x==11||v.y==0||v.y==5||v.z==2||v.z==9);
part(torso,bod,new T.Vector3());
const legL=pivot(clawd,[0,0,0]),legR=pivot(clawd,[0,0,0]);
const legs=x=>[1,4].flatMap(y=>boxL(x,x,y,y,0,1,O));
part([...legs(1),...legs(4)],legL,Wp(0,0,0));part([...legs(7),...legs(10)],legR,Wp(0,0,0));
const armL=pivot(bod,[0,3,5]);part(boxL(-2,-1,2,3,4,5,O),armL,Wp(0,3,5));
const board=pivot(bod,[12,3,6]),BO=Wp(12,3,6);
const bl=[...boxL(12,12,2,3,5,6,O),...boxL(13,13,2,3,6,7,O),...boxL(14,20,3,3,5,10,SL)];
for(const v of bl){if(v.y===3&&((v.z===9&&v.x>=15&&v.x<=19)||(v.z===7&&v.x>=15&&v.x<=17)))v.c=CH;}
for(let x=14;x<=20;x++)bl.push({x,y:3,z:11,c:x%2?CH:SL});
part(bl,board,BO);
const clapper=pivot(board,[14,3,12],BO);
part(Array.from({length:7},(_,j)=>({c:(14+j)%2?SL:CH})),clapper,null,(v,j)=>new T.Vector3((j+.5)*S,.5*S,.5*S));
// eyes: glossy dark tiles on the front face, arranged per expression
const eyeM=new T.InstancedMesh(new RoundedBoxGeometry(S*.92,S*.92,S*.4,2,S*.12),new T.MeshPhysicalMaterial({color:0x121110,roughness:.15,clearcoat:1,clearcoatRoughness:.1}),10);bod.add(eyeM);
const EYES={normal:[[3,6],[3,7],[8,6],[8,7]],blink:[[2,6],[3,6],[4,6],[7,6],[8,6],[9,6]],happy:[[2,6],[3,7],[4,6],[7,6],[8,7],[9,6]],
  wow:[[3,6],[3,7],[4,6],[4,7],[7,6],[7,7],[8,6],[8,7]],wink:[[3,6],[3,7],[7,6],[8,6],[9,6]],sleepy:[[2,7],[3,7],[4,7],[7,7],[8,7],[9,7]],
  sure:[[2,7],[3,7],[4,7],[3,6],[7,7],[8,7],[9,7],[8,6]]};
function setEyes(name,dx=0){const pat=EYES[name]||EYES.normal;for(let i=0;i<10;i++){const e=pat[i];
  if(e){const p=vc(e[0]+dx,5,e[1]);p.z=3*S+S*.05;eyeM.setMatrixAt(i,_m.makeTranslation(p.x,p.y,p.z));}else eyeM.setMatrixAt(i,_m.makeScale(0,0,0));}
  eyeM.instanceMatrix.needsUpdate=true;}
let lastEyes='';
// pose: {pos, ry, rz, lean, bounce, squash, armL, board, clap, legL, legR, eyes, dx, scale}
W.clawd=o=>{clawd.position.set(...(o.pos||[0,0,0]));clawd.rotation.set(0,o.ry||0,0);clawd.scale.setScalar(o.scale||1);
  const sq=o.squash||0;bod.position.y=o.bounce||0;bod.scale.set(1+sq*.5,1-sq,1+sq*.5);bod.rotation.set(o.lean||0,0,o.rz||0);
  armL.rotation.z=-(o.armL||0);board.rotation.z=o.board||0;board.position.copy(BO).add(_p.set((o.reach||0)*S*7,(o.reach||0)*S*3,(o.reach||0)*S*2));clapper.rotation.z=.55*(1-(o.clap||0));
  legL.position.y=o.legL||0;legR.position.y=o.legR||0;
  const ek=(o.eyes||'normal')+(o.dx||0);if(ek!==lastEyes){setEyes(o.eyes,o.dx||0);lastEyes=ek;}clawd.updateMatrixWorld(true);};
W.clawdPoint=(x,y,z)=>vc(x,y,z).applyMatrix4(bod.matrixWorld).toArray();

// ---------- glossy reflective floor ----------
const floor=new Reflector(new T.PlaneGeometry(80,80),{clipBias:.003,textureWidth:1920,textureHeight:1080,color:0x8a8a8a});floor.rotation.x=-Math.PI/2;scene.add(floor);
const fcv=document.createElement('canvas');fcv.width=fcv.height=512;{const g=fcv.getContext('2d'),gr=g.createRadialGradient(256,256,0,256,256,256);
  gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(.055,'rgba(0,0,0,.72)');gr.addColorStop(.16,'rgba(0,0,0,.97)');gr.addColorStop(.3,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=gr;g.fillRect(0,0,512,512);}
const ftex=new T.CanvasTexture(fcv);
const fade=new T.Mesh(new T.PlaneGeometry(84,84),new T.MeshBasicMaterial({map:ftex,transparent:true,depthWrite:false,toneMapped:false}));fade.rotation.x=-Math.PI/2;fade.position.y=.003;scene.add(fade);
const ring=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshBasicMaterial({color:0x000000}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;// unused filler
W.floor=(x=0,z=0)=>{floor.position.set(x,0,z);fade.position.set(x,.003,z);};

// ---------- voxel confetti ----------
const CN=200,conf=new T.InstancedMesh(new RoundedBoxGeometry(S*.6,S*.6,S*.22,1,S*.06),new T.MeshPhysicalMaterial({color:0xffffff,roughness:.3,clearcoat:.8}),CN);scene.add(conf);
const CF=Array.from({length:CN},()=>{const a=rnd()*6.283,sp=2+rnd()*4.5;return{v:[Math.cos(a)*sp,3.5+rnd()*5.5,Math.sin(a)*sp],ax:new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize(),w:6+rnd()*14,
  c:[0xd97757,0xd97757,0xf2f0ea,0xffb08f,0x2b2b2e][Math.floor(rnd()*5)]};});
{const c=new T.Color();CF.forEach((f,i)=>{c.setHex(f.c);conf.setColorAt(i,c);});}
W.confetti=(t,o=[0,1.2,0])=>{for(let i=0;i<CN;i++){const f=CF[i];if(t<0||t>4){conf.setMatrixAt(i,_m.makeScale(0,0,0));continue;}
  const tt=t*(.85+.3*(i%7)/7),y=o[1]+f.v[1]*tt-4.9*tt*tt;
  _p.set(o[0]+f.v[0]*tt,Math.max(-1,y),o[2]+f.v[2]*tt);_q.setFromAxisAngle(f.ax,f.w*tt);const k=y<-.05?0:1;_s.set(k,k,k);conf.setMatrixAt(i,_m.compose(_p,_q,_s));}
  conf.instanceMatrix.needsUpdate=true;};
W.confetti(-1);

// ---------- background voxel dust for parallax ----------
const DN=520,dust=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xffffff}),DN);
{const c=new T.Color();let i=0;while(i<DN){const x=-45+rnd()*90,y=-14+rnd()*28,z=-75+rnd()*95;
  if(Math.abs(x)<6&&y>-3&&y<4&&z>-40&&z<12)continue;if(x>-6&&x<37&&Math.abs(y)<2.6&&z>-1.5&&z<11)continue;
  const s=.025+rnd()*.07;_q.setFromAxisAngle(new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize(),rnd()*3);
  dust.setMatrixAt(i,_m.compose(_p.set(x,y,z),_q,_s.set(s,s,s)));c.setHex(rnd()<.18?0x7a3f2c:0x3a3632);dust.setColorAt(i,c);i++;}}
scene.add(dust);

// ---------- screens (rounded slab + canvas-textured display) ----------
function rr(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);
  s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function makeScreen(w,h,tw,th,col=0x2a2a30){const g=new T.Group();
  const geo=new T.ExtrudeGeometry(rr(w,h,Math.min(w,h)*.07),{depth:.05,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:4,curveSegments:10});geo.center();
  const body=new T.Mesh(geo,new T.MeshStandardMaterial({color:col,metalness:.7,roughness:.32}));
  const c=document.createElement('canvas');c.width=tw;c.height=th;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
  const b=Math.min(w,h)*.035,scr=new T.Mesh(new T.PlaneGeometry(w-2*b,h-2*b),new T.MeshBasicMaterial({map:tex,toneMapped:false}));scr.position.z=.052;
  g.add(body,scr);scene.add(g);return{g,c,x:c.getContext('2d'),tex,w:tw,h:th};}
const main=makeScreen(4.8,2.7,1280,720);
const CARDS=[['URL','docs.example.com'],['MD','README.md'],['PDF','guide.pdf'],['DIR','/docs'],['TXT','notes.txt'],['WEB','research a topic'],['URL','querytab.com'],['MD','api.md'],['PDF','slides.pdf'],['TXT','pasted text']];
const cards=CARDS.map((c,i)=>{const s=makeScreen(1.7,1.05,512,316,0x3a3836);s.g.position.set((i%2?1.85:-1.85)+(rnd()-.5)*.5,(rnd()-.5)*1.4,-2.5-i*3.0);s.g.rotation.set((rnd()-.5)*.3,i%2?-.42:.42,(rnd()-.5)*.25);s.base=s.g.rotation.clone();s.data=c;return s;});
const STY=['Terminal dark','Clean corporate','Whiteboard','Paper cutout','Isometric','Blueprint','Flat vector story','Minimal monochrome','Brand match'];
const lineup=STY.map((n,i)=>{const s=makeScreen(3.2,1.8,800,450);s.g.position.set(i<8?i*3.9:33.7,0,i<8?0:.8);s.g.rotation.y=i<8?-.35:0;s.name=n;return s;});
// voice waveform made of voxels, standing on the main screen
const WC=32,WR=10,wave=new T.InstancedMesh(new RoundedBoxGeometry(.11,.11,.11,2,.018),vmat,WC*WR);scene.add(wave);
{const c=new T.Color(0xd8d4cc);for(let k=0;k<WC*WR;k++){wave.setColorAt(k,c);wave.setMatrixAt(k,new T.Matrix4().makeScale(0,0,0));}}
const WH=Array.from({length:WC},(_,i)=>Math.max(2,Math.round(2+8*Math.abs(Math.sin(i*.71)*Math.sin(i*.23+1.1)))));
const head=new T.Mesh(new T.BoxGeometry(.035,1.7,.035),new T.MeshBasicMaterial({color:0xffb08f,toneMapped:false}));scene.add(head);
// chips that orbit Clawd
const chips=['No API key','No paid service','Runs on your machine'].map(txt=>{const c=document.createElement('canvas');c.width=900;c.height=150;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(2.4,.4),new T.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false,depthWrite:false}));scene.add(m);return{m,c,tex,txt};});

const GROUPS={clawd:[clawd],floor:[floor,fade],conf:[conf],main:[main.g],cards:cards.map(c=>c.g),lineup:lineup.map(s=>s.g),wave:[wave,head],chips:chips.map(c=>c.m)};
W.only=(...names)=>{for(const k in GROUPS)for(const o of GROUPS[k])o.visible=names.includes(k);};
W.main=main;W.cards=cards;W.lineup=lineup;W.chips=chips;W.cam=cam;

// ---------- camera with a fake motion blur from its own speed ----------
const GL=document.getElementById('gl');
function pose(c){cam.position.set(...c[0]);cam.fov=c[2];cam.updateProjectionMatrix();cam.up.set(0,1,0);cam.lookAt(...c[1]);if(c[3])cam.rotateZ(c[3]);}
W.camSet=(now,prev,gt,extra=0,punch=.022)=>{const d0=new T.Vector3(...prev[1]).sub(new T.Vector3(...prev[0])).normalize(),d1=new T.Vector3(...now[1]).sub(new T.Vector3(...now[0])).normalize();
  const ang=d0.angleTo(d1),dist=new T.Vector3(...now[1]).distanceTo(new T.Vector3(...now[0]))||1,mv=new T.Vector3(...now[0]).distanceTo(new T.Vector3(...prev[0]))/dist;
  const blur=Math.max(extra,Math.min(4,ang*90+mv*30+Math.abs(now[2]-prev[2])*.4));GL.style.filter=blur>.4?`blur(${blur.toFixed(2)}px)`:'none';
  const c=[now[0],now[1],now[2]*(1-punch*beatPulse(gt,.1)),now[3]||0];pose(c);};
const FG=document.getElementById('fg'),fgx=FG.getContext('2d');
W.render=()=>{if(FG._on){FG.style.opacity=0;FG._on=false;}ren.render(scene,cam);};
// over-the-shoulder: Clawd alone goes to the foreground canvas (blurred by CSS), the rest stays behind the DOM text
W.renderSplit=(blur,keepMain=false)=>{const kids=scene.children,saved=kids.map(o=>o.visible);
  kids.forEach(o=>{if(!o.isLight)o.visible=o===clawd;});ren.render(scene,cam);fgx.clearRect(0,0,1920,1080);fgx.drawImage(ren.domElement,0,0);
  kids.forEach((o,i)=>o.visible=saved[i]);clawd.visible=keepMain&&saved[kids.indexOf(clawd)];ren.render(scene,cam);clawd.visible=saved[kids.indexOf(clawd)];
  FG.style.opacity=1;FG._on=true;FG.style.filter=blur>.3?`blur(${blur.toFixed(2)}px)`:'none';};
// project a world point to stage pixels (for DOM glow placement)
W.toScreen=p=>{const v=new T.Vector3(...p).project(cam);return[(v.x+1)*960,(1-v.y)*540];};

// ---------- waveform pose ----------
W.wave=(t,gt,ph)=>{const c=new T.Color(),hot=new T.Color(0xd97757),cool=new T.Color(0xd8d4cc);const pul=1+.18*beatPulse(gt,.14);
  for(let i=0;i<WC;i++){const x=-2.2+i*(4.4/(WC-1)),passed=ph>x,rise=backOut(clamp((t-.03*i)/.45)),pop=passed?1+.25*(1-P(ph-x,0,.5)):1;
    const n=Math.round(WH[i]*Math.min(1,rise)*(passed?pul:1));
    for(let r=0;r<WR;r++){const k=i*WR+r,on=r<n;const s=on?(.6+.4*rise)*pop:0;
      _m.compose(_p.set(x,.11+r*.125,.25),_q.identity(),_s.set(s,s,s));wave.setMatrixAt(k,_m);wave.setColorAt(k,passed?hot:cool);}}
  wave.instanceMatrix.needsUpdate=true;wave.instanceColor.needsUpdate=true;head.position.set(ph,.9,.25);};

// ---------- canvas painting ----------
function rrect(g,x,y,w,h,r,fill,stroke,lw=3){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
  if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
function bg(g,w,h,a='#1c1a18',b='#121110'){const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,w,h);}
const F=(wt,px,fam='"Inter Tight"')=>`${wt} ${px}px ${fam},sans-serif`;
let MASCOT=null;window.LOADING.push(new Promise(ok=>{const im=new Image();im.onload=()=>{MASCOT=im;ok();};im.onerror=ok;im.src='mascot.png';}));

function paintCard(s){const g=s.x,[t,n]=s.data;bg(g,512,316,'#2a2724','#1d1b19');
  rrect(g,30,32,118,64,14,'#d97757');g.fillStyle='#1a1917';g.font=F(700,34,'JBM');g.textAlign='center';g.fillText(t,89,77);
  g.textAlign='left';g.fillStyle='#f3eee6';g.font=F(600,44);g.fillText(n,30,170);
  [[30,215,360],[30,250,280],[30,285,320]].forEach(([x,y,w])=>rrect(g,x,y,w,14,7,'rgba(255,255,255,.13)'));s.tex.needsUpdate=true;}
function paintChip(c){const g=c.c.getContext("2d");g.clearRect(0,0,900,150);rrect(g,6,6,888,138,69,'rgba(30,28,26,.94)','#d97757',6);
  g.beginPath();g.arc(84,75,20,0,7);g.fillStyle='#d97757';g.fill();g.fillStyle='#f5f5f7';g.font=F(600,64);g.textAlign='left';g.fillText(c.txt,128,98);c.tex.needsUpdate=true;}
const STYLEPAINT=[
 (g,w,h)=>{g.fillStyle='#0d1117';g.fillRect(0,0,w,h);g.font=F(500,34,'JBM');g.fillStyle='#3fb950';g.fillText('$ explain ./docs',44,90);g.fillStyle='#8b949e';
   ['reading 6 files…','writing script.json','voice: af_heart'].forEach((s,i)=>g.fillText(s,44,150+i*50));g.fillStyle='#d97757';g.fillRect(44,300,22,38);},
 (g,w,h)=>{g.fillStyle='#f6f8fb';g.fillRect(0,0,w,h);g.fillStyle='#14213d';g.font=F(800,48);g.fillText('Onboarding flow',44,92);
   ['#2f6fed','#4c8bf5','#7aa7f7'].forEach((c,i)=>{rrect(g,44+i*240,140,210,170,18,'#fff','#d6deea',3);rrect(g,68+i*240,165,60,60,14,c);g.fillStyle='#14213d';g.font=F(600,26);g.fillText(['Sign up','Verify','Launch'][i],68+i*240,275);});},
 (g,w,h)=>{g.fillStyle='#fbfbf7';g.fillRect(0,0,w,h);g.lineCap='round';g.lineWidth=7;g.strokeStyle='#1f6feb';g.beginPath();g.ellipse(210,200,120,80,-.1,0,6.1);g.stroke();
   g.strokeStyle='#e5534b';g.beginPath();g.moveTo(350,200);g.quadraticCurveTo(450,140,560,200);g.stroke();g.beginPath();g.moveTo(560,200);g.lineTo(530,175);g.moveTo(560,200);g.lineTo(528,222);g.stroke();
   g.strokeStyle='#222';g.lineWidth=6;g.strokeRect(580,140,150,120);g.fillStyle='#222';g.font=F(600,34);g.fillText('Idea',165,212);g.fillText('Plan',612,212);},
 (g,w,h)=>{g.fillStyle='#e8d9bf';g.fillRect(0,0,w,h);g.shadowColor='rgba(0,0,0,.25)';g.shadowBlur=18;g.shadowOffsetY=8;
   g.fillStyle='#f2a541';g.beginPath();g.arc(600,130,70,0,7);g.fill();g.fillStyle='#7fb08a';g.beginPath();g.ellipse(250,470,380,200,0,0,7);g.fill();
   g.fillStyle='#3f7d5c';g.beginPath();g.ellipse(640,500,360,180,0,0,7);g.fill();g.shadowColor='transparent';},
 (g,w,h)=>{bg(g,w,h,'#f3f2ff','#dfe2ff');const iso=(x,y,z)=>[400+(x-y)*60,250+(x+y)*34-z*60];
   const face=(pts,c)=>{g.beginPath();pts.forEach((p,i)=>{const q=iso(...p);i?g.lineTo(...q):g.moveTo(...q);});g.closePath();g.fillStyle=c;g.fill();};
   [[-2.5,0,1.4],[0,0,2.2],[2.5,0,1.1]].forEach(([x,y,hh])=>{face([[x+1,y,0],[x+1,y+1,0],[x+1,y+1,hh],[x+1,y,hh]],'#a4a9ff');face([[x,y+1,0],[x+1,y+1,0],[x+1,y+1,hh],[x,y+1,hh]],'#c9ccff');face([[x,y,hh],[x+1,y,hh],[x+1,y+1,hh],[x,y+1,hh]],'#fff');});},
 (g,w,h)=>{g.fillStyle='#1d4e89';g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=1;for(let x=0;x<w;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<h;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
   g.strokeStyle='#fff';g.lineWidth=4;g.beginPath();g.arc(300,225,110,0,7);g.stroke();g.beginPath();g.arc(300,225,40,0,7);g.stroke();g.strokeRect(470,130,220,190);
   g.lineWidth=2;g.beginPath();g.moveTo(470,350);g.lineTo(690,350);g.stroke();g.fillStyle='#fff';g.font=F(500,22,'JBM');g.fillText('220 mm',540,385);},
 (g,w,h)=>{g.fillStyle='#2a9d8f';g.fillRect(0,0,w,h);g.fillStyle='#e9c46a';g.beginPath();g.arc(230,240,120,0,7);g.fill();g.fillStyle='#f4a261';g.beginPath();g.arc(560,160,60,0,7);g.fill();
   g.fillStyle='#264653';g.beginPath();g.moveTo(560,420);g.lineTo(610,260);g.lineTo(660,420);g.closePath();g.fill();g.fillStyle='#e76f51';g.beginPath();g.arc(160,200,26,0,7);g.fill();},
 (g,w,h)=>{g.fillStyle='#fafafa';g.fillRect(0,0,w,h);g.fillStyle='#111';g.font=F(800,150);g.fillText('Less.',60,250);g.fillRect(64,300,300,4);g.font=F(300,32);g.fillText('Say one thing well.',64,360);},
 (g,w,h)=>{bg(g,w,h,'#24211e','#161513');const gr=g.createRadialGradient(200,225,10,200,225,260);gr.addColorStop(0,'rgba(217,119,87,.35)');gr.addColorStop(1,'rgba(217,119,87,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
   if(MASCOT)g.drawImage(MASCOT,50,85,300,300*MASCOT.height/MASCOT.width);g.fillStyle='#f3eee6';g.font=F(800,46);g.fillText('Explainer',380,175);g.fillText('Video Maker',380,228);
   g.fillStyle='#d97757';g.font=F(600,28);g.fillText('your logo · colors · fonts',382,290);rrect(g,382,320,64,64,14,'#d97757');rrect(g,458,320,64,64,14,'#f3eee6');rrect(g,534,320,64,64,14,'#2b2b2e');}];
function paintStyle(s,i){const g=s.x;g.save();g.textAlign='left';STYLEPAINT[i](g,800,450);g.restore();
  g.font=F(600,24);const tw=g.measureText(s.name).width;rrect(g,24,392,tw+40,40,20,'rgba(0,0,0,.62)');g.fillStyle='#fff';g.textAlign='left';g.fillText(s.name,44,420);s.tex.needsUpdate=true;}
// brand version of a style: same layout, recolored to the brand hue, logo badge in the corner
function paintStyleBrand(s,i){const g=s.x;g.save();g.textAlign='left';STYLEPAINT[i](g,800,450);g.globalCompositeOperation='color';g.fillStyle='#d97757';g.fillRect(0,0,800,450);
  g.globalCompositeOperation='source-over';g.restore();rrect(g,640,22,136,60,30,'rgba(26,25,23,.82)');if(MASCOT)g.drawImage(MASCOT,652,28,62,62*MASCOT.height/MASCOT.width);
  g.fillStyle='#f3eee6';g.font=F(800,22);g.fillText('EVM',718,60);
  g.font=F(600,24);const n=STY[i],tw=g.measureText(n).width;rrect(g,24,392,tw+40,40,20,'#d97757');g.fillStyle='#1a1917';g.fillText(n,44,420);s.tex.needsUpdate=true;}
W.styleBrand=(i,on)=>{const s=lineup[i];if(s._b===on)return;s._b=on;if(on)paintStyleBrand(s,i);else paintStyle(s,i);};
W.paintStatic=()=>{cards.forEach(paintCard);chips.forEach(paintChip);lineup.forEach(paintStyle);};

// main screen, repainted per frame
W.paintRead=(n,p)=>{const g=main.x;bg(g,1280,720);['#ff5f57','#febc2e','#28c840'].forEach((c,i)=>{g.beginPath();g.arc(44+i*34,40,11,0,7);g.fillStyle=c;g.fill();});
  g.textAlign='left';g.fillStyle='#f3eee6';g.font=F(800,72);g.fillText('Reading sources',70,170);
  CARDS.slice(0,6).forEach(([t,nm],i)=>{const y=230+i*66,ok=i<n;rrect(g,70,y,640,52,12,ok?'rgba(217,119,87,.16)':'rgba(255,255,255,.05)');
    g.fillStyle=ok?'#d97757':'#5b5650';g.font=F(700,24,'JBM');g.fillText(t,92,y+35);g.fillStyle=ok?'#f3eee6':'#77716a';g.font=F(600,28);g.fillText(nm,180,y+36);
    if(ok){g.strokeStyle='#d97757';g.lineWidth=5;g.beginPath();g.moveTo(660,y+27);g.lineTo(672,y+38);g.lineTo(692,y+16);g.stroke();}});
  // play badge
  g.beginPath();g.arc(1000,380,150,0,7);g.fillStyle='rgba(217,119,87,'+(.15+.25*p)+')';g.fill();g.beginPath();g.moveTo(960,310);g.lineTo(960,450);g.lineTo(1075,380);g.closePath();g.fillStyle='#f3eee6';g.fill();
  rrect(g,70,660,1140,12,6,'rgba(255,255,255,.1)');rrect(g,70,660,Math.max(12,1140*p),12,6,'#d97757');main.tex.needsUpdate=true;};
W.paintTimeline=ph=>{const g=main.x;bg(g,1280,720,'#1a1816','#100f0e');g.textAlign='left';g.fillStyle='#d97757';g.font=F(500,30,'JBM');g.fillText('timeline.json',50,62);
  g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=2;for(let x=50;x<1240;x+=60){g.beginPath();g.moveTo(x,90);g.lineTo(x,690);g.stroke();}
  const rows=[[60,420],[500,840],[880,1220],[110,560],[620,1000],[1040,1230]];
  rows.forEach(([a,b],i)=>{const y=110+i*95,on=ph>=a,act=ph>=a&&ph<b;rrect(g,a,y,b-a,62,14,act?'#d97757':on?'rgba(217,119,87,.35)':'rgba(255,255,255,.08)');
    g.fillStyle=act?'#1a1917':'#bdb6ad';g.font=F(500,22,'JBM');g.fillText(((a/100)).toFixed(2)+' → '+((b/100)).toFixed(2),a+18,y+40);});
  g.fillStyle='#ffb08f';g.fillRect(ph-2,90,4,610);main.tex.needsUpdate=true;};
W.paintVideo=t=>{const g=main.x,hue=t*40;const gr=g.createLinearGradient(0,0,1280,720);
  gr.addColorStop(0,`hsl(${(14+hue)%360},78%,62%)`);gr.addColorStop(.55,`hsl(${(34+hue)%360},90%,66%)`);gr.addColorStop(1,`hsl(${(232+hue)%360},80%,72%)`);g.fillStyle=gr;g.fillRect(0,0,1280,720);
  for(let i=0;i<7;i++){const x=(i*190+t*220)%1500-110,y=120+((i*137)%420);g.globalAlpha=.18;rrect(g,x,y,90,90,18,'#fff');}g.globalAlpha=1;
  if(MASCOT){const bh=Math.abs(Math.sin(t*Math.PI*2))*40;g.drawImage(MASCOT,90,170-bh,380,380*MASCOT.height/MASCOT.width);}
  g.fillStyle='#fff';g.textAlign='left';g.font=F(800,84);g.fillText('Your video,',540,300);g.fillText('ready.',540,392);
  g.font=F(600,34);g.fillStyle='rgba(255,255,255,.85)';g.fillText('Narrated · animated · on-brand',544,456);
  rrect(g,60,640,1160,14,7,'rgba(255,255,255,.35)');rrect(g,60,640,Math.max(14,1160*clamp(t/2.2)),14,7,'#fff');
  g.beginPath();g.arc(60+1160*clamp(t/2.2),647,14,0,7);g.fill();main.tex.needsUpdate=true;};
W.paintFlow=t=>{const g=main.x;bg(g,1280,720,'#1c1a18','#121110');g.textAlign='center';
  const N=['Read','Script','Voice','Scenes','Render'],xs=N.map((_,i)=>150+i*245),y=300;
  for(let i=0;i<4;i++){const p=clamp((t-.35-i*.55)/.45);g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=6;g.beginPath();g.moveTo(xs[i]+90,y);g.lineTo(xs[i+1]-90,y);g.stroke();
    g.strokeStyle='#d97757';g.beginPath();g.moveTo(xs[i]+90,y);g.lineTo(lerp(xs[i]+90,xs[i+1]-90,p),y);g.stroke();
    if(p>0&&p<1){g.beginPath();g.arc(lerp(xs[i]+90,xs[i+1]-90,p),y,12,0,7);g.fillStyle='#ffd2b8';g.fill();}}
  N.forEach((n,i)=>{const a=t-i*.55,s=backOut(clamp(a/.35)),act=a>=0&&a<.7;if(a<-.05)return;g.save();g.translate(xs[i],y);g.scale(s,s);
    rrect(g,-88,-88,176,176,30,act?'#d97757':'#2c2925',act?null:'#4a453f',4);g.fillStyle=act?'#1a1917':'#f3eee6';g.font=F(800,34);g.fillText(n,0,12);g.restore();});
  // frame strip: renderAt(t)
  g.font=F(500,30,'JBM');g.fillStyle='#a39d94';g.fillText('renderAt( t = '+(12+t*1.37).toFixed(2)+' s )',640,500);
  for(let i=0;i<16;i++){const on=i<Math.floor(clamp((t-1.5)/2.2)*16);rrect(g,96+i*68,560,56,90,8,on?'#d97757':'rgba(255,255,255,.07)');}
  main.tex.needsUpdate=true;};
})();
