# Blueprint

**Format:** Explainer · **Render:** fast · **Reference:** `S({id:'blueprint'` in the lookbook

## Use for
Hardware, engineering, APIs, protocols, technical specs, system design. Viewers who like precision.

## Tokens
```css
--bg:#123e7c; --line:#e9f1ff; --soft:#bcd3ff;
--grid-major:rgba(255,255,255,.14); --grid-minor:rgba(255,255,255,.05);
```
Background: four `linear-gradient` grids, 200px major and 40px minor cells.
Fonts: `@fontsource/ibm-plex-mono` (500, 600) for everything, uppercase with `letter-spacing:.08em`.

## Layout
- **Title block** at top right, like an engineering drawing: a bordered box with rows such as `DWG TALLY-01 · REV A` and `SCALE 1:1 · SHEET 2 OF 5`. The sheet number is the chapter number, so it doubles as the chapter header.
- Progress: none, or a thin ruler along the bottom with tick marks.
- **Captions:** 36px Plex Mono, light text on `rgba(5,20,50,.45)` with a 1px light border.

## Scene vocabulary
- Components are rectangles drawn on with `drawOn` (easeIO 0.7 s), labeled above with a part code (`SRC-01 · CONNECT`) and a numbered callout circle.
- Inside each box, a schematic line drawing (thin 3px lines) draws on at a linear pace: stacked ellipses for storage, a bubble for queries, a node graph for sharing.
- **Dimension lines** under parts: a line with end ticks and arrowheads, the value centered under it (`3 SOURCES`, `< 2 S RESPONSE`, `142 VIEWERS`). Use real numbers from the material.
- Connectors between parts with arrowheads, drawn just before the next part appears.
- Exploded views: parts slide apart along one axis with leader lines to labels.

## Motion
Mostly drawing. Anything that moves does it linearly or with easeIO, like a plotter. No bounces.

## Avoid
Filled shapes, color other than blue and white (one warm "redline" color for a correction is OK), rounded friendly shapes.

## Brand match
Keep the blueprint look; tint `--bg` toward the brand's dark color and put the brand name and logo in the title block.
