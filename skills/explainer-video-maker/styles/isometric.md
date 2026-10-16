# Isometric

**Format:** Explainer · **Render:** fast (plain SVG, no WebGL) · **Reference:** `S({id:'iso'` in the lookbook

## Use for
SaaS architecture, data pipelines, workflows, integrations, "how the pieces fit together".

## Tokens
```css
--bg-top:#f3f2ff; --bg-bottom:#e2e4ff; --fg:#2b2d6e;
--top:#ffffff; --left:#c9ccff; --right:#a4a9ff;               /* block faces */
--plat-top:#fbfbff; --plat-left:#c4c7f5; --plat-right:#a9aeee; --grid:#e4e5ff;
--accent-top:#ffc29a; --accent-left:#ff9a5a; --accent-right:#f07a35;  /* active block / data packet */
```
Fonts: `@fontsource/sora` (600, 700).

## Projection
```js
const SC=128, CX=660, CY=340;   // 1920×1080 stage; tune CX/CY to center the scene
const iso=(x,y,z)=>[CX+(x-y)*.866*SC, CY+(x+y)*.5*SC - z*SC];
const pts=a=>a.map(p=>iso(...p).join(',')).join(' ');
function setBox(o,x,y,z,w,d,h){   // o = {R,L,T} SVG polygons; draw R, then L, then T
  o.R.setAttribute('points',pts([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]]));
  o.L.setAttribute('points',pts([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]]));
  o.T.setAttribute('points',pts([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]]));}
```
Draw objects back to front, sorted by `x+y`.

## Layout
- Title top left (48px Sora 700). Progress bar: 6px accent line at the bottom of the platform's front edge, or at the top of the stage.
- A platform (top face + two thin side faces, faint grid lines) holds the scene, usually laid out along the x axis so it reads diagonally.
- Labels are white pills with a soft shadow, placed above each block's top face.
- **Captions:** 44px Sora in `--fg`, no background.

## Scene vocabulary
- Blocks rise from the platform (`h` grows with `backOut`) when their sentence starts. The active block's top turns accent.
- A small accent cube is the data packet: it hops between blocks in an arc (`z += sin(p·π)·1.1`) and bobs slightly at rest.
- Stacks (databases), towers (servers), flat tiles (UI screens, shown as a tilted top face with simple bars), pipes (flat iso strips), people as cylinders with a sphere-ish top.
- Grow the whole system chapter by chapter: earlier blocks stay on the platform, dimmed.

## Motion
`backOut` for rising, `easeIO` for packets. Keep the camera fixed; never rotate the projection.

## Avoid
Real perspective, drop shadows (use darker faces for depth), more than one accent.

## Brand match
Make the three face colors light, mid and dark tints of the brand primary, and the accent the brand's secondary color.
