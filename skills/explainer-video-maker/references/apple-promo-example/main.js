// Promo engine: hard cuts on beats, no header, captions or progress bar.
const TL=window.TIMELINE, LIVE=[];
for(const s of TL.scenes){const def=SCENES[s.id];if(!def)continue;const root=h('<div class="scene"></div>');document.getElementById('scenes').appendChild(root);
  const C=(i,f=0)=>{const L=s.lines[Math.min(i,s.lines.length-1)];return L.start-s.start+f*(L.end-L.start);};C.end=s.end-s.start;
  LIVE.push({s,root,C,def,st:def.build(root,C,s)||{}});}
window.renderAt=function(t){
  for(const L of LIVE){const{s}=L;const on=t>=s.start&&t<s.end||(L===LIVE[LIVE.length-1]&&t>=s.end);
    L.root.style.display=on?'block':'none';if(on)L.def.update(t-s.start,L.C,L.st,t);}
  shatter(t);
};
const fontsLoaded=Promise.all(['300 40px "Inter Tight"','600 40px "Inter Tight"','800 40px "Inter Tight"','500 40px JBM','700 40px JBM'].map(f=>document.fonts.load(f))).then(()=>document.fonts.ready);
window.READY=Promise.all([fontsLoaded,...window.LOADING]).then(()=>{W.paintStatic();window.renderAt(0);return true;});
