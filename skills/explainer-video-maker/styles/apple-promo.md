# Apple-style promo

**Format:** Promo · **Render:** WebGL 3D (fast on a GPU, slow in software) · **Reference:** `S({id:'promo3d'` in the lookbook; a full worked example is in [references/apple-promo-example/](../references/apple-promo-example/README.md)

## Use for
Product launches, hero shots, feature teasers and ads, 15–60 s. Premium, with real action.

## Tokens
```css
--bg:#000000; --fg:#f5f5f7; --muted:#a1a1a6;
--grad-a:#9aa8ff; --grad-b:#ff9a6b;   /* tagline gradient text; brand match: two tints of the brand color */
--glow:rgba(96,110,255,.34);          /* radial glow behind the hero */
```
Fonts: `@fontsource/inter-tight` (300, 600, 800).

## Layout
- Black stage, no header, chapters, progress bar or captions.
- The hero (a character or product) on one side, at about 40% of the width, with big words on the other side. **Words never sit on top of the hero.** If the camera move would push them together, move the words (top-left, bottom-left or right) or reframe.
- A soft radial glow behind the hero, blended with `mix-blend-mode:screen` *over* the canvas. A glow behind the canvas gets cut off by an opaque floor and leaves a hard horizon line.
- Ending: product name in `--muted`, then a two-line tagline in 128–140px Inter Tight 800 gradient text, then the command or URL in a pill on the final music hit.

## The premium look (what made it feel "expensive")
- **Glossy materials:** `MeshPhysicalMaterial({roughness:.36, clearcoat:.75, clearcoatRoughness:.28})`, plus studio reflections: `scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture`. Use `ACESFilmicToneMapping` at an exposure of about 1.1.
- **Soft edges:** use `RoundedBoxGeometry` for voxel or block shapes, never sharp `BoxGeometry`.
- **Reflective black floor:** a `Reflector` (about 0.55 grey) with a large transparent-to-black radial-gradient plane on top. Make the plane at least as large as the reflector, or you get a grey band beyond it.
- **Depth:** a few hundred tiny dim cubes scattered in space give parallax when the camera moves. Keep them out of the camera's path.
- **Finish:** a vignette, motion blur from camera speed (CSS `blur()` on the canvas, scaled by how far the camera moved since the last frame, capped at about 4px), and a white flash of 0.3–0.5 s on each music drop.

## Hero character (when the brand has a mascot)
A mascot that acts carries an ad much better than a slowly turning object. Rig it in parts:
- **Root at the feet** (so squash and stretch scale from the floor) → body group → legs (two groups) / free arm (pivot at the shoulder) / prop arm (for example a clapperboard, pivot at the shoulder, with its own moving part) / eyes.
- **Eyes as swappable tile patterns** on the face: normal, blink, happy (^ ^), wink, wow, sure (skeptical), sleepy, plus eyes shifted left or right for reading. Test each one on a still: an extra tile above the "wow" eyes read as angry eyebrows.
- **A beat-locked dance:** `b = t / beatPeriod`. Bounce `|sin πb|`, squash on landing `exp(-phase·9)`, sway `sin πb`, a half-tempo turn, alternating arm and leg lifts, and eyes cycling per beat. Scale everything with an `amt` value (0 = still, 1 = full dance).
- **Acting beats, not just dancing:**
  - anticipation (a crouch before the jump)
  - a jump with a full spin
  - a landing squash
  - a prop action on the key word (the clapperboard snaps shut, with a sound, a flash and camera shake)
  - reactions: a head turn, a tilt, a speech bubble ("Huh? What did you say?")
  - peeking over an object and winking
  - leaping into the lens
- **The prop is a storytelling device:** the clap is the "cut". Use it to trigger reveals ("docs in → *clack* → video out").

## Camera grammar
Every shot has its own move. Give the camera a pure function `camF(t) → [pos, look, fov, roll]`, and use `camF(t)` and `camF(t-1/30)` to compute motion blur.
- **Dolly zoom** (vertigo: FOV shrinks while the distance grows, keeping `d·tan(fov/2)` constant) for an opening hero reveal.
- **Over the shoulder:** the hero is huge and blurred in the foreground, and what they're looking at is sharp in the distance. Then **rack focus** to the hero as they turn round.
- **Orbit** with the subject offset (`orbit(center, az, r, h, off)` shifts the look point so the subject sits left or right of frame).
- **Crane** from overhead down to eye level. A **fly-through** of floating objects. A **pull-back** from an extreme close-up (the eye).
- **Whip** between positions with `expoOut`. A **crash zoom** on beats (FOV punch through `beatPulse`, stronger in action shots). **Shake** on impacts.
- Moves start fast and settle (`easeOut` / `expoOut`): starting fast right after a cut gives the "pop".
- **The camera arrives before the key line.** If the reveal (a screen flipping, a character peeking) happens while the camera is still whipping, it happens off-screen. Check a still at the keyword time.

## Layering 3D over text (real depth of field)
DOM text normally sits above the canvas. To put the hero *in front of* text, or to blur only the foreground:
```js
// render Clawd alone, copy him to a 2D canvas stacked ABOVE the DOM text, then render the rest normally
W.renderSplit=(blur,keepMain)=>{const kids=scene.children,vis=kids.map(o=>o.visible);
  kids.forEach(o=>{if(!o.isLight)o.visible=o===hero;});ren.render(scene,cam);fg2d.clearRect(0,0,W,H);fg2d.drawImage(ren.domElement,0,0);
  kids.forEach((o,i)=>o.visible=vis[i]);hero.visible=keepMain&&vis[kids.indexOf(hero)];ren.render(scene,cam);
  FG.style.opacity=1;FG.style.filter=blur>.3?`blur(${blur}px)`:'none';};
```
- Use `keepMain=false` while the foreground is blurred, so no sharp copy shows underneath. Use `true` once it's sharp, so the floor reflection stays.
- Speech bubbles and other overlays that must sit above the hero need a `z-index`.

## Scene vocabulary
- **Words that come into focus:** blur(18px) → sharp, 50px lift, and a 1.22 → 1 `backOut` pop over **0.22 s**, starting one frame early. The slower 0.6 s reveal reads as late when there's a voiceover. Earlier words stay at 32% opacity.
- **Slam text** for the call to action ("Let's do it."): scale 1.9 → 1 with `backOut` in 0.3 s.
- **Reading text** (a document scrolling past): small (about 33px), fast (about 100 px/s), with a bright reading band. It eases to a stop when the story pauses, and whooshes off the top (blur, easeIn) on the cut.
- **Screens:** a rounded slab with a `CanvasTexture` screen, repainted per frame for live UI (a progress bar, a flowchart, a timeline). A bright, colorful "finished video" screen that pops out with `backOut`.
- **Flying objects:** cards travelling on arcs into the hero, a vortex orbiting the hero, a lineup the camera trucks along that then turns to face the camera.
- **Voxel confetti** on drops: deterministic physics (`p = p0 + v·t − ½g·t²`).
- **Glass break transition:** the hero leaps into the lens, SVG cracks draw out from the impact point (stroke-dashoffset, 0.1 s), and on the drop they burst into shards that fly into the next shot.
- **Brand reveal:** the same eight layouts re-tinted to the brand hue (`globalCompositeOperation='color'`), with a logo badge on each.

## 3D setup (Three.js, offline)
- `npm i three@0.160.0`. Load it as an ES module through an import map, and serve the folder over HTTP: `python -m http.server 8123` (module scripts don't load from `file://`). Render and stills use `http://localhost:8123/index.html`.
- `index.html` loads only `boot.js`:
  ```html
  <script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script>
  <script type="module" src="boot.js"></script>
  ```
  ```js
  // boot.js: expose THREE (+ the addons you use), then load the classic scripts in order
  import * as THREE from 'three';
  import {Reflector} from 'three/addons/objects/Reflector.js';
  import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
  import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
  Object.assign(window,{THREE,Reflector,RoomEnvironment,RoundedBoxGeometry});window.LOADING=[];
  for(const f of ['timeline.js','lib.js','world.js','scenes.js','main.js'])
    await new Promise((ok,err)=>{const s=document.createElement('script');s.src=f;s.onload=ok;s.onerror=err;document.head.appendChild(s);});
  ```
  In `main.js`, set `window.READY = Promise.all([fonts, ...window.LOADING])`. Load canvas-only fonts explicitly with `document.fonts.load('800 40px "Inter Tight"')`, because a font that appears only in canvas text is never fetched. Paint the static textures after READY. In `render.js` and `stills.js`, `await p.waitForFunction(()=>window.READY)` before evaluating it.
- **One shared world** (`world.js`) with every object. Each shot shows only what it needs (`W.only('clawd','floor',…)`), poses it, and calls render. No animation loop and no clock.
- Renderer: `antialias:true, alpha:true, preserveDrawingBuffer:true`, `setPixelRatio(1)`, size `STAGE.W × STAGE.H`, `outputColorSpace = SRGBColorSpace`.
- **Chromium args:** with a GPU, try `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist` (Windows) first. On an RTX-class card this ran at **about 0.05 s per frame**, including a Reflector and the split render. Fall back to `--use-angle=swiftshader --enable-unsafe-swiftshader` (0.3–1 s per frame). Log `UNMASKED_RENDERER_WEBGL` in stills.js to see which one you got.
- **Objects:** a GLB/GLTF the user supplies, or a mascot rebuilt from its voxel or vector source (the same data that drew the logo), or a rounded device slab built from `ExtrudeGeometry` (see the lookbook).

## Timing
- Music-led: shots and drops land on beats (see `formats/promo.md`).
- With a voiceover, **text and big actions land on the spoken word**, and each sentence is placed so its main keyword falls on a beat.
- A character reacts *after* a line finishes (about 0.3 s later), never during it.
- A camera move spans a whole phrase. Big actions get anticipation (about 0.3 s) and follow-through.

## Avoid
- Busy backgrounds, or more than one accent gradient.
- Words on top of the hero or a key screen.
- Aimless spinning. A spin is fine as a character move that lands on a beat.
- Reveals that happen while the camera is still moving.
- Showing a background screen edge-on (it flashes white).
- Leaving a global overlay (cracks, bubbles) undriven in other shots. Update global FX every frame from `renderAt`, not from one scene.

## Brand match
Use the brand's mascot or product model as the hero, brand colors as the gradient, glow and confetti, and the brand font if it's a clean sans.

## Review checklist (stills)
Take stills at: each shot's midpoint, **every keyword onset frame**, every drop or flash frame, and one frame on each side of every hard cut. Check that:
- text never covers the hero
- the hero isn't clipped by a jump
- props move toward the text when they're meant to overlap it
- eye expressions read correctly
- there's no grey band beyond the floor
- no overlay leaks into another shot
