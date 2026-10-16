---
name: "explainer-video-maker"
description: "Turn docs, links, or text files into a narrated animated explainer MP4 (HTML/JS animations + Kokoro offline voice + Playwright + ffmpeg). Use when asked to make a video from material."
---

# Explainer Video Maker

Core idea: the **voiceover is the clock**. Generate narration one sentence at a time with Kokoro (free, offline TTS), record exactly when each sentence starts and ends, then drive every caption and animation from those timestamps. Animations are a single HTML page whose state is a pure function of time `renderAt(t)`. A headless browser screenshots it frame by frame, and ffmpeg encodes the frames and adds the voice track. Because the visuals follow the audio's timing, the two stay in sync.

Pipeline: **Extract what was given → Intro (if needed) → Material (if missing) → Read it + collect brand assets → Style (suggested from the material) → Length & voice (keep or change) → Notes → Script → Voice + timeline → Scenes → Review stills → Render → Mux → Verify → Deliver**

---

## 1. Intake (guided, one step at a time)

Run intake as a short conversation in stages, not one big form. Use AskUserQuestion for choices. If the user is away, use the defaults, say which ones you used, and proceed.

### First: extract what the user already gave you (mandatory, before any question)
Never ask for something the user already provided. Before you ask anything, scan **the whole request**: the user's message, any skill arguments, earlier messages in this conversation, attachments, and pasted text. Fill this checklist:

| Item | Counts as "provided" when the request contains… |
|---|---|
| **Material** | Any URL or bare domain (`https://…`, `www.…`, `querytab.com`, `docs.example.io/guide`); an attached or uploaded file; a named file or folder; pasted text; a clear product or topic plus "research it" |
| **Style** | Any look or feel words (dark, minimal, corporate, playful, "like Apple", brand colors, a reference video) |
| **Length** | Any duration or scope ("1 minute", "short", "cover everything", "one per section") |
| **Voice** | Gender, accent, a named voice, speed, or "no voice" |
| **Notes** | Audience, language, emphasis, things to skip, a call to action |

Rules:
- **A URL or domain anywhere in the request means material is provided.** Fetch it right away (WebFetch; add `https://` to a bare domain). Do not ask "what material should I use?", and don't offer "I'll share a link" as an option.
- **Request material wins over the connected folder.** If the folder has nothing relevant but the request contains a link or text, use the request's material. Don't mention the folder's unrelated contents.
- Only ask about the material if the request has no URL, file, folder, pasted text or researchable topic. If a fetch fails (blocked, 404, login wall), say what failed, then ask for another link, files or a description.
- If the material is thin (for example, a one-page landing site), you may offer to **add** sources (docs pages linked from it, or web research). Phrase it as "I read X. Want me to also pull in Y?", never as asking for the material again.
- Open your first reply by confirming what you picked up, in one line. For example: "Got it: making a video about Querytab from querytab.com (reading it now)." Then continue with the first missing item.
- Each later step runs only if its item is still missing. If the user already gave a style, length or voice, confirm it in the final summary instead of asking.

### Step 0: Short intro (only if the request contains no material at all)
Explain the skill in 2–3 sentences: "I can turn docs, links, or text files into a narrated animated video, so you can watch instead of read. It runs locally: the voice (Kokoro) and the video rendering are offline models and tools that run on the machine, with no paid service or API key. Share the material and I'll take it from there."

### Step 1: Material (skip if already provided; go straight to reading it)
Ask what the video should cover: links, attached files, a connected folder, or pasted text. If they name a folder, list it and confirm which files to use. Then **read the material** (section 2) before asking about style, because the style suggestions depend on the content.

### Step 2: Style (suggest based on the material)
If the user already named a style, confirm it and move on. Otherwise use AskUserQuestion with options in this order:
1. **Two or three styles recommended for this material**, each with one line saying why it fits. Mark the best one "(Recommended)". Examples:
   - Developer tool or CLI docs → "Terminal dark" (dark warm background, monospace commands, brand-inspired accent).
   - Business, process, or policy → "Clean corporate" (light background, navy and teal, simple icons and flowcharts).
   - Science or education → "Whiteboard / chalk" (hand-drawn-style lines, step-by-step build-up).
   - Product or marketing → "Bright flat explainer" (bold colors, playful shapes, a mascot).
   - Data or reports → "Data story" (charts that animate in, big numbers).
   - The client's own brand → "Brand match" (their logo, colors, fonts and real screenshots from the site). Recommend this first whenever brand assets are available.
2. **General styles** that also fit, if they're not already listed: Minimal monochrome, Bright flat, Clean corporate.
3. The user can type their own style ("Other"): a reference video, a palette, or brand colors.

### Step 3: Length and voice (show defaults; keep or change)
Show the defaults in one message:
- **Length:** as long as needed to cover all of the material, as one video with chapters (about 150 spoken words per minute).
- **Voice:** Kokoro `af_heart` (natural American female), speed 1.0.
- **Extras:** captions on, 1920×1080, 30 fps, and the client's logo on the intro and outro (when brand use is OK).

Ask one question: **"Keep these defaults or change them?"**
- **Keep** → go to Step 4.
- **Change** → ask only about what they want changed:
  - Length: as long as needed (one video with chapters) / short summary of about 60–90 s / about 3 min / several shorter videos (one per section).
  - Voice: Female US `af_heart` / Female US `af_bella` / Male US `am_michael` / British female `bf_emma`. "Other" covers `am_adam` and `bm_george`, and a speed between 0.8 and 1.2.
  - Extras: captions on or off, and resolution.

### Step 4: Notes
Ask once whether there's anything else: audience, language, sections to emphasize or skip, or a call to action at the end. "No" is a fine answer.

Then give a 3–4 line summary (material, style, length, voice) and start building.

**Brand assets (logo, colors, fonts, images):** the client decides. Most users make videos for their own company or for a client who asked for it, and then the video should use the real brand: logo, colors, fonts, product screenshots and images from the shared website or files.
- If the brand clearly belongs to the user (their domain or company, or "our product"), or they say it's for a client, use the assets fully. Don't ask.
- If it's unclear (for example, a video about a well-known third-party product), ask once: "Is this your company's (or your client's) brand, so I can use its logo and visuals?" If yes, use them. If no, use a brand-inspired style (palette and type feel) and leave out the logo and mascots.
- If no brand applies, use an original character. The default is "Blink", an orange terminal-cursor block with eyes.

## 2. Read the material and collect brand assets (right after Step 1)

**Content:** fetch every link (WebFetch) and read every file in full. Also follow the site's key internal pages (features, pricing, docs, about), staying within about 10 pages unless the user wants more. List each section or heading. Every section should map to at least one scene unless the user said to skip it. Keep the facts exact: names, numbers, commands, prices, claims.

**Assets (when brand use is OK, per the brand-assets rule):** collect real visuals so the video looks like the client's own. Put them in `vid/assets/` and write `vid/assets/brand.json` listing what you found.

1. **Download the page HTML and CSS:** `curl -sL -A "Mozilla/5.0" <url> -o assets/page.html`, plus the linked stylesheets.
   - Only do this for sites WebFetch could read. If WebFetch was refused for the domain, don't work around it: ask the user to upload a logo, brand colors and screenshots.
2. **Logo:**
   - Look in this order: an inline `<svg>` or `<img>` in the header or nav whose class, id, alt or src contains "logo"; then `apple-touch-icon`; then `og:image`; then `favicon.svg` or `.ico`.
   - Prefer SVG. Save as `assets/logo.svg` or `.png`.
   - If the logo is dark on a transparent background, note whether it needs a light backdrop on a dark theme.
3. **Colors:**
   - Sources: `<meta name="theme-color">`, CSS custom properties (`--primary`, `--brand`, `--accent` and similar), and the most frequent non-gray hex or rgb values in the CSS.
   - Pick a primary, an accent, a background and a text color.
   - Check contrast: text on background should be at least 4.5:1.
4. **Fonts:**
   - Find them in Google Fonts `<link>`s or `@font-face` rules. If the font is on Google Fonts, install it from npm `@fontsource/<font-name>`.
   - Otherwise download the `@font-face` woff2 files the site serves.
   - If neither works, use the closest @fontsource match.
5. **Images and screenshots:**
   - Save hero images, product shots and feature illustrations (`<img>`, `srcset`, `og:image`) at the largest available size.
   - Also screenshot the live site with Playwright: the full page plus each key section at 1920px width, into `assets/shots/`. Close cookie banners first if possible.
6. **Copy:** record the tagline, headline, feature names and call-to-action wording. Use the client's own phrasing in titles and captions.
7. **Report back:** list in one line what you collected (for example: "Got the logo (SVG), 3 brand colors, the Inter font and 6 screenshots"). Ask for anything missing that matters, such as a higher-resolution logo.

**Using the assets in scenes:**
- Logo on the intro title card, in the corner of the header bar (small), and large on the outro with the call to action and website URL.
- Brand colors become the CSS tokens (`--bg`, `--accent` and so on). Brand fonts go in `@font-face`.
- Show screenshots inside a browser or phone mockup, with a slow pan or zoom (Ken Burns, computed from `t`), and callout highlights on the feature being narrated.
- Real product images replace generic icons wherever they explain better.
- Keep every asset local (relative paths in `assets/`); the renderer works offline.

## 3. Script → `script.json`

- Chapters (scenes) in source order: intro, one per section, outro.
- Each line is `[say, caption]`. `say` is written for the ear. `caption` is the on-screen text, or `null` to reuse `say`.
  - Spell out tricky tokens for TTS: `CLAUDE.md` → "Claude dot M D", `/model` → "slash model", `MCP` → "M C P", `APIs` → "A P Is", `Shift+Tab` → "shift tab", `Esc` → "escape".
- Keep sentences short, at most about 25 words, and use roughly 3–7 lines per scene. The voice speaks about 150 words per minute.
- Show the script outline to the user if they're present. If not, proceed.

```json
[{"id":"intro","chapter":"How X works","lines":[["How X works.",null],["Spoken text","Caption text"]]},
 {"id":"loop","chapter":"01 · Part one","lines":[...]}, ...]
```

## 4. Pick the environment

Check which machine has the needed tools: `which ffmpeg node python3`, a Chromium for Playwright, and network access to github.com and pypi/npm.
- The cloud workspace usually has all of these (Chromium is at `/opt/pw-browsers`; never run `playwright install`).
- If the user wants it built on their own computer, check device_bash for the same tools. If they're missing or can't be installed, build in the cloud and commit the MP4 back to their folder.

Setup:
```bash
mkdir -p vid/models vid/stills && cd vid
pip install kokoro-onnx soundfile --break-system-packages
curl -sSLo models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -sSLo models/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
npm init -y && npm i playwright@1.56 @fontsource/inter @fontsource/jetbrains-mono @fontsource/source-serif-4
```
Use absolute paths: `~` may not equal the working directory.

## 5. Voice + timeline → `tts.py`

```python
import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
VOICE, SPEED = "af_heart", 1.0
k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
script = json.load(open("script.json")); SR = 24000
LEAD, LINE_GAP, SCENE_GAP, TAIL = 0.6, 0.35, 0.9, 2.0
chunks, t, timeline = [np.zeros(int(LEAD*SR), np.float32)], LEAD, []
for si, sc in enumerate(script):
    s = {"id": sc["id"], "chapter": sc["chapter"], "start": t - (LEAD if si == 0 else SCENE_GAP/2), "lines": []}
    for li, (say, cap) in enumerate(sc["lines"]):
        a, sr = k.create(say, voice=VOICE, speed=SPEED, lang="en-us"); a = a.astype(np.float32); d = len(a)/SR
        s["lines"].append({"text": cap or say, "start": round(t, 3), "end": round(t+d, 3)})
        chunks.append(a); t += d
        gap = LINE_GAP if li < len(sc["lines"])-1 else (SCENE_GAP if si < len(script)-1 else TAIL)
        chunks.append(np.zeros(int(gap*SR), np.float32)); t += gap
    s["end"] = t - (SCENE_GAP/2 if si < len(script)-1 else 0); timeline.append(s)
sf.write("voice.wav", np.concatenate(chunks), SR)
json.dump({"duration": round(t, 3), "scenes": timeline}, open("timeline.json", "w"), indent=1)
print("total", round(t, 1))
```
Then run `echo "window.TIMELINE=$(cat timeline.json);" > timeline.js`.

## 6. Scenes (HTML/CSS/JS, deterministic)

Files: `index.html` (fonts, CSS tokens, stage, header, captions, progress bar), `lib.js` (helpers), `scenes.js` (one object per scene id), `main.js` (the time engine).

**Rules**
- No CSS transitions or animations, no `setTimeout`, no `Date.now()`, no randomness. Everything is computed from `t` inside `update()`.
- Stage size is 1920×1080. Keep content between y≈110 and y≈880. Captions sit at `bottom:44px`.
- Load fonts from `node_modules/@fontsource/*/files/*.woff2` via `@font-face`. Wait for `document.fonts.ready`.
- Each scene has `build(root, C)`, which creates the DOM once, and `update(t, C, st)`, where `t` is local seconds. `C(i, f)` gives the local time at fraction `f` of line `i`. Use it to time reveals to the words, for example `C(0, .5)` for the middle of the first sentence.
- To hide elements, use `visibility`, never `display=''`, because that wipes an inline `display:flex`.
- Centered elements (`addC`) need `width:max-content`, or their text wraps.
- Visual vocabulary: cycle diagrams (SVG ring with a moving dot), icon cards revealed one by one with the active card highlighted, terminal windows with typed commands, segmented toggles with a sliding pill, flow and branch diagrams with `drawOn`, keycaps, and chips. Show the concept rather than just repeating the words.

**lib.js core**
```js
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), lerp=(a,b,p)=>a+(b-a)*p;
const easeOut=x=>1-Math.pow(1-x,3), easeIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const backOut=x=>{const c1=1.4,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const P=(t,a,d=.6,f=easeOut)=>f(clamp((t-a)/d));
const NS='http://www.w3.org/2000/svg';
function h(html){const d=document.createElement('div');d.innerHTML=html.trim();return d.firstElementChild;}
function add(p,html,x,y,w,hh){const el=h(html);el.style.position='absolute';if(x!=null)el.style.left=x+'px';if(y!=null)el.style.top=y+'px';if(w!=null)el.style.width=w+'px';if(hh!=null)el.style.height=hh+'px';p.appendChild(el);return el;}
function addC(p,html,cx,cy){const wrap=add(p,'<div style="width:0;height:0"></div>',cx,cy);const el=h(html);el.style.position='absolute';el.style.transform='translate(-50%,-50%)';if(!el.style.width)el.style.width='max-content';const inner=document.createElement('div');inner.style.cssText='position:absolute;left:0;top:0';inner.appendChild(el);wrap.appendChild(inner);wrap._el=el;wrap._inner=inner;return wrap;} // animate wrap._inner
function reveal(el,p,dy=26,sc=0,dx=0){el.style.opacity=p;el.style.transform=`translate(${(1-p)*dx}px,${(1-p)*dy}px) scale(${1-(1-p)*sc})`;}
function typeText(el,text,p){const n=Math.round(text.length*clamp(p));if(el._n!==n){el.textContent=text.slice(0,n);el._n=n;}}
function svg(p,w,hh,x=0,y=0){const s=document.createElementNS(NS,'svg');s.setAttribute('width',w);s.setAttribute('height',hh);s.style.cssText=`position:absolute;left:${x}px;top:${y}px;overflow:visible`;p.appendChild(s);return s;}
function sv(p,tag,a){const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e;}
function drawOn(el,p){if(!el._len){el._len=el.getTotalLength();el.style.strokeDasharray=el._len;}el.style.strokeDashoffset=el._len*(1-clamp(p));}
// + an ICON map of 60x60 stroke SVG paths (file, search, term, globe, code, laptop, cloud, ...) and icon(name,size,color)
```

**main.js core**
```js
const TL=window.TIMELINE, LIVE=[];
for(const s of TL.scenes){const def=SCENES[s.id];if(!def)continue;const root=h('<div class="scene"></div>');document.getElementById('scenes').appendChild(root);
  const C=(i,f=0)=>{const L=s.lines[Math.min(i,s.lines.length-1)];return L.start-s.start+f*(L.end-L.start);};C.end=s.end-s.start;
  LIVE.push({s,root,C,def,st:def.build(root,C)||{}});}
window.renderAt=function(t){let cur=null;
  for(const L of LIVE){const{s}=L;const a=clamp((t-s.start+.3)/.6),b=clamp((s.end+.3-t)/.6);
    const op=s===TL.scenes[0]?b:Math.min(a,b);if(op<=0){L.root.style.display='none';continue;}
    L.root.style.display='block';L.root.style.opacity=op;L.def.update(t-s.start,L.C,L.st,t);if(t>=s.start&&t<s.end)cur=s;}
  // captions: show the line whose [start-.15, end+.3] contains t, fade 0.2s; header chapter = cur.chapter; progress bar = t/duration
};
window.READY=document.fonts.ready.then(()=>{window.renderAt(0);return true;});
```

## 7. Review stills (required before the full render)

`stills.js` opens the page, calls `renderAt(t)` for the given times, and saves PNGs. Pick one time near the end of each scene, plus a few mid-scene times. Tile them with `ffmpeg -pattern_type glob -i 's_*.png' -vf "scale=960:540,tile=2x3" sheet_%d.png`, then Read the sheets. Fix overlaps, wrapped labels, text off-screen, captions over three lines, empty panels, and console errors. Iterate until clean.

## 8. Render → `render.js`

```js
// node render.js <startFrame> <endFrame> <out.mp4>
const {chromium}=require('playwright');const{spawn}=require('child_process');const FPS=30,[s,e,out]=[+process.argv[2],+process.argv[3],process.argv[4]];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--allow-file-access-from-files']});
 const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto('file://'+__dirname+'/index.html');await p.evaluate(()=>window.READY);
 const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',''+FPS,'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r',''+FPS,out],{stdio:['pipe','inherit','inherit']});
 for(let f=s;f<e;f++){await p.evaluate(t=>window.renderAt(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',out);})();
```
Adjust `executablePath` to whatever Chromium exists. Total frames are `ceil(duration*30)`. Benchmark 60 frames first (about 0.08 s per frame), then split into one chunk per CPU core and run the chunks in parallel with `nohup ... &`. Poll the logs until each says `done`.

## 9. Mux

```bash
printf "file part1.mp4\nfile part2.mp4\n" > list.txt
ffmpeg -y -f concat -safe 0 -i list.txt -c copy video.mp4
ffmpeg -y -i video.mp4 -i voice.wav -c:v copy -c:a aac -b:a 192k -af "loudnorm=I=-16:TP=-1.5" -shortest -movflags +faststart Final.mp4
```

## 10. Verify

- Check with `ffprobe` that the video and audio durations match within 0.1 s, at 1920x1080 and 30 fps.
- Run `volumedetect`: the mean should be around −16 dB, and the audio must not be silent.
- Extract frames at the chunk seam and at a scene transition, and Read them.
- Remember you can't hear the audio. Tell the user to listen for mispronounced terms, and offer to re-spell them and re-render.

## 11. Deliver

- Copy the MP4 and a timestamped narration script (`[m:ss] Chapter` followed by its lines) to `/mnt/user-data/outputs/`, then SendUserFile both.
- If a folder is connected, also commit both into it with device_commit_files and name the folder and files.
- In 2–3 sentences, give the length and chapters, say which brand assets were used (or what was missing), and offer tweaks: voice, pace, length, or style.