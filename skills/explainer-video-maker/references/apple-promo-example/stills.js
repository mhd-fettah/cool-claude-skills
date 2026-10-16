// node stills.js [args...] t1 t2 ...   (ARGS env: gpu|swift)
const {chromium}=require('playwright');
const MODE=process.env.GL||'gpu';
const ARGS=MODE==='swift'?['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'];
(async()=>{const b=await chromium.launch({args:ARGS});const p=await b.newPage({viewport:{width:1920,height:1080}});
 const errs=[];p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8123/index.html');await p.waitForFunction(()=>window.READY);await p.evaluate(()=>window.READY);
 console.log('renderer:',await p.evaluate(()=>{const g=document.createElement('canvas').getContext('webgl2');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'?';}));
 const times=process.argv.slice(2).map(Number);let i=0;
 for(const t of times){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:`stills/s_${String(i++).padStart(3,'0')}.png`});}
 console.log('errors:',errs.slice(0,10));await b.close();})();
