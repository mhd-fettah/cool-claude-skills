# Apple-style promo

**Format:** Promo · **Render:** slow (WebGL 3D) · **Reference:** `S({id:'promo3d'` in the lookbook

## Use for
Product launches, hero shots, feature teasers, 15–60 s. Premium and calm.

## Tokens
```css
--bg:#000000; --fg:#f5f5f7; --muted:#a1a1a6;
--grad-a:#9aa8ff; --grad-b:#ff9a6b;   /* tagline gradient text */
--glow:rgba(96,110,255,.34);          /* radial glow behind the object */
```
Fonts: `@fontsource/inter-tight` (300, 600, 800).

## Layout
- Black stage, no header, chapters, progress bar or captions.
- The 3D object on one side (about 40% of the width), big words on the other. Or the object centered with one word under it.
- A soft radial glow behind the object.
- Ending: product name in `--muted`, then a two-line tagline in 128px Inter Tight 800 with gradient text (`background-clip:text`).

## Scene vocabulary
- **Words that come into focus:** each word fades in from `blur(28px)` and 50px lower over 0.6 s. Earlier words stay at 32% opacity, so only the current one is bright.
- **The 3D object** turns slowly the whole time (for example `rotation.y` from −0.8 to 0.5 over the video, easeIO) with a gentle float. Its screen changes per beat or per shot (a `CanvasTexture` repainted when the shot changes).
- Shots: a slow push-in, an orbit around the object, an extreme close-up with a shallow-focus feel (blur a DOM copy), an exploded view of parts, a lineup of color variants.
- Lighting: dim ambient, a white key light from top left, a strong cool rim light from behind, a warm point light from below right.

## 3D setup (Three.js, offline)
- `npm i three@0.160.0`. Load it as an ES module through an import map, and serve the folder over HTTP: `python -m http.server 8123` (module scripts don't load from `file://`). Render and stills use `http://localhost:8123/index.html`.
- `index.html` loads only `boot.js`:
  ```html
  <script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script>
  <script type="module" src="boot.js"></script>
  ```
  ```js
  // boot.js: expose THREE, then load the classic scripts in order
  import * as THREE from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
  window.THREE=THREE; window.GLTFLoader=GLTFLoader; window.LOADING=[];
  for(const f of ['timeline.js','lib.js','scenes.js','main.js'])
    await new Promise((ok,err)=>{const s=document.createElement('script');s.src=f;s.onload=ok;s.onerror=err;document.head.appendChild(s);});
  ```
  In `main.js`, `window.READY = Promise.all([document.fonts.ready, ...window.LOADING])` so model loads finish first. In `render.js` and `stills.js`, `await p.waitForFunction(()=>window.READY)` before evaluating it.
- Renderer: `new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true})`, `setPixelRatio(1)`, size 1920×1080, `outputColorSpace = THREE.SRGBColorSpace`. Call `renderer.render(scene, camera)` inside the scene's `update(t)`: no animation loop, no clock.
- Chromium args for headless WebGL: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. On a desktop with a GPU, try `--use-angle=default` first; it's much faster.
- **Objects:** a GLB/GLTF the user supplies (product model) via `GLTFLoader`, pushing its promise into `window.LOADING`. Otherwise build one: a rounded phone or laptop slab from `ExtrudeGeometry` of a rounded-rect `Shape` with bevels, plus a screen `ShapeGeometry` whose UVs are remapped to 0–1 (see the lookbook).
- **Render cost:** expect 0.3–1 s per frame in software WebGL. Benchmark 60 frames, keep geometry light, and split into more parallel chunks.

## Timing
Music-led: shots and word reveals land on beats (see `formats/promo.md`). Camera moves span whole phrases (4–8 beats), never one beat.

## Avoid
Busy backgrounds, more than one accent gradient, fast spins, text that isn't a single short phrase.

## Brand match
Use the brand's product model or logo as the 3D object, brand colors as the gradient and rim light, the brand font if it's a clean sans.
