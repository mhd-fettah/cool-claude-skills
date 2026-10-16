// node render.js <startFrame> <endFrame> <out.mp4>
const {chromium}=require('playwright');const{spawn}=require('child_process');const FPS=30,[s,e,out]=[+process.argv[2],+process.argv[3],process.argv[4]];
const MODE=process.env.GL||'gpu';
const ARGS=MODE==='swift'?['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'];
(async()=>{const b=await chromium.launch({args:ARGS});
 const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto('http://localhost:8123/index.html');await p.waitForFunction(()=>window.READY);await p.evaluate(()=>window.READY);
 const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',''+FPS,'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r',''+FPS,out],{stdio:['pipe','inherit','inherit']});
 const t0=Date.now();
 for(let f=s;f<e;f++){await p.evaluate(t=>window.renderAt(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:93});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',out,((Date.now()-t0)/(e-s)/1000).toFixed(3),'s/frame');})();
