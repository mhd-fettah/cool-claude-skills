# Whiteboard

**Format:** Explainer · **Render:** fast · **Reference:** `S({id:'whiteboard'` in the lookbook

## Use for
Tutorials, teaching, step-by-step reasoning, "let me sketch how this works". Works well with long narration.

## Tokens
```css
--bg:#fdfdfb; --bg-edge:#f1f1ec; --ink:#1f2937; --blue:#2563eb; --red:#dc2626; --green:#16a34a;
```
Background: `radial-gradient(ellipse at 40% 30%, var(--bg), var(--bg-edge))`.
Fonts: `@fontsource/caveat` (600) for handwriting; `@fontsource/instrument-sans` (600) for captions.

## Layout
- No header bar. The chapter title is handwritten at top left (100px Caveat), revealed left to right with `clip-path: inset(0 X% 0 0)`, then underlined with a red marker stroke.
- Progress: a thin marker line along the bottom edge, or none.
- **Captions:** 44px sans in `--ink`, no background.

## Scene vocabulary
- Everything is SVG paths with `stroke-width` 10 (ink) or 8 (color), round caps and joins, drawn on with `drawOn` at a **linear** pace, as if a pen is moving.
- Write paths by hand with slight wobble: Béziers whose control points are a few px off a perfect shape, endpoints that don't quite meet.
- Draw order follows the narration: outline first, then details in blue, then a red highlight (underline, circle, check mark) on the key point.
- Handwritten labels (80px Caveat) revealed left to right under each drawing.
- Arrows: a slightly curved shaft, then a two-stroke head drawn after the shaft.
- Build the board up within a chapter, then wipe it (fade to blank) between chapters.

## Motion
Only drawing and revealing. Nothing slides or bounces. Optional: a marker-pen cursor that follows the end of the active stroke (`getPointAtLength`).

## Avoid
Perfect geometric shapes, filled areas, more than three ink colors on screen.

## Brand match
Use the brand primary as the "blue" marker and the brand accent as the highlight color. Logo drawn on (if it's simple SVG) or faded in on the outro.
