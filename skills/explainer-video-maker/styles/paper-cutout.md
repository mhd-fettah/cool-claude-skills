# Paper cutout

**Format:** Explainer · **Render:** fast · **Reference:** `S({id:'paper'` in the lookbook

## Use for
Storytelling, friendly consumer brands, education, kids, non-profits. Anything that should feel handmade and warm.

## Tokens
```css
--sky:#8ec5c8; --hill-back:#5fa59a; --hill-front:#3f7f72; --sun:#f4d35e;
--paper:#fff8e7; --white:#fdfaf3; --ink:#3b2f2f;
--coral:#ee6c4d; --peach:#f38d68; --blush:#fbc4ab;
--shadow: drop-shadow(0 4px 0 rgba(40,30,20,.22)) drop-shadow(0 14px 16px rgba(40,30,20,.18));
```
Fonts: `@fontsource/patrick-hand` for titles, labels and captions.

## Layout
- **Title** on a cream paper strip at top left, rotated −2°.
- **Chapter/progress:** a small paper tag at top right with the chapter number, no progress bar.
- **Captions:** 54px Patrick Hand on a cream strip with a torn edge (`clip-path: polygon(...)` with irregular points), shadowed like paper.
- **Grain:** one full-stage overlay with an SVG `feTurbulence` noise data URI, `mix-blend-mode: multiply`, opacity ~.45. It's static, so it's deterministic.

## Scene vocabulary
- Every object is a separate flat piece (div or small SVG) with `filter: var(--shadow)`, so layers cast shadows on each other.
- Ragged hills from a seeded path generator (sine + `hash()` noise every 40px).
- Props built from simple shapes: stacked discs (a database), a speech bubble with a square tail, a paper plane of two triangles, clouds of overlapping circles, a sun.
- Pieces enter by sliding up from behind the hills, dropping in from the top with `backOut`, or flying along a quadratic Bézier with a dotted trail.
- Labels are small paper tags that pop up from below.

## Motion (what makes it read as stop-motion)
- **Step time at 12 fps:** compute every pose from `ts = Math.floor(t*12)/12`, not `t`. The video is still 30 fps; the motion just holds each pose for 2–3 frames.
- **Seeded jitter:** each piece gets a tiny per-pose wobble from the frame index, never `Math.random()`:
  ```js
  const f=Math.floor(t*12), hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const J=(id,a=1.2)=>`rotate(${(hash(f*7+id)-.5)*a}deg) translate(${(hash(f*3+id*5)-.5)*2}px,0)`;
  ```
  Append `J(id)` to each piece's transform. Same frame, same jitter, so renders stay reproducible.
- Ease with `backOut` for drops and pops, `easeIO` for flights.

## Avoid
Gradients on pieces (paper is flat colour), thin lines, more than ~6 colors, smooth 30 fps motion.

## Brand match
Build the palette from the brand colors, muted ~15% toward the paper tone so they still look like card stock. The logo is "cut out": shown on a paper piece with the same shadow.
