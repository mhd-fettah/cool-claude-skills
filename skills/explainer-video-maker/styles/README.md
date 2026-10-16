# Styles

Load **only** the file for the chosen style before writing `index.html` and `scenes.js`. Each file gives the tokens, fonts, layout, scene vocabulary and motion rules for that look. A working 960×540 reference of every style is in [../references/style-lookbook.html](../references/style-lookbook.html): search it for `S({id:'<id>'` and scale coordinates ×2 for the 1920×1080 stage.

| Style | File | Format | Best for | Render |
|---|---|---|---|---|
| Terminal dark | [terminal-dark.md](terminal-dark.md) | Explainer | Developer tools, CLIs, APIs | Fast |
| Clean corporate | [clean-corporate.md](clean-corporate.md) | Explainer | B2B products, processes, policies | Fast |
| Whiteboard | [whiteboard.md](whiteboard.md) | Explainer | Tutorials, education, step-by-step ideas | Fast |
| Paper cutout | [paper-cutout.md](paper-cutout.md) | Explainer | Storytelling, friendly brands, education | Fast |
| Isometric | [isometric.md](isometric.md) | Explainer | SaaS architecture, workflows, systems | Fast |
| Blueprint | [blueprint.md](blueprint.md) | Explainer | Hardware, engineering, APIs, specs | Fast |
| Flat vector story | [flat-vector-story.md](flat-vector-story.md) | Explainer | Science, big ideas, "why it matters" | Fast |
| Minimal monochrome | [minimal-monochrome.md](minimal-monochrome.md) | Explainer | Anything; a safe, quiet fallback | Fast |
| Apple-style promo | [apple-promo.md](apple-promo.md) | Promo | Launches, product hero shots | Slow (WebGL) |
| Kinetic type | [kinetic-type.md](kinetic-type.md) | Promo (or an explainer opener) | Teasers, social clips, quotes | Fast |

The lookbook also shows Bright flat, Data story and Retro synthwave. They were previewed but not adopted, so they have no style file.

**Brand match** is not a separate look. It's a modifier that applies the client's logo, colors and fonts on top of one of the styles above (see "Brand match" at the end of each file). Offer it as "Brand match · <style>".

## Rules shared by every style
- Coordinates in the style files are for the 1920×1080 stage. For other sizes, re-lay the scene out for the frame using the safe areas in SKILL.md section 6 ("Sizes and layout") and the notes below, with font sizes and strokes multiplied by `U = min(W,H)/1080`.
- At 1920×1080, keep content between y≈110 and y≈880, captions at `bottom:44px` (unless captions are off).
- Header bar, chapter label and progress bar are part of the explainer format. Each style says how to draw them. Promo styles drop them.
- Every color is a CSS token in `index.html` (`--bg`, `--fg`, `--accent`, …) so brand match can swap them.
- Fonts come from `@fontsource/<name>` (npm) so the render stays offline.

## Vertical (9:16) and square (1:1)
General rule: one idea per screen, stacked top to bottom, with bigger type and fewer words. Things that sit side by side in 16:9 go one above the other in 9:16 and into a 2×2 grid in 1:1.

| Style | Vertical 9:16 | Square 1:1 |
|---|---|---|
| Terminal dark | Terminal window full width (~960px), 30–34px mono, shorter commands (wrap long ones with `\`); show one command per scene. Header shrinks to product name only. Blink sits above the window. | Window ~960×620, 2–3 output lines max. |
| Clean corporate | Cards stack in a column (~860×300 each, icon left, text right), arrows point down. Title wraps to two lines. | 2×2 card grid, or 3 cards in a column with smaller icons. |
| Whiteboard | Drawings go top to bottom, arrows point down; one drawing per screen, then wipe. Handwritten title on two lines. | Two drawings per screen, side by side or stacked. |
| Paper cutout | Taller sky; hills fill the bottom third; props stack in the middle; the plane flies upward. Title strip and captions sit inside the safe area. | Hills lower quarter, one prop at a time, centered. |
| Isometric | Turn the layout so blocks run down the screen (along the y axis, which reads bottom-left to top-right); raise `SC` so blocks stay big. | Keep the diagonal but use 2–3 blocks per screen. |
| Blueprint | Parts stack in a column with connectors running down; title block at the top, full width. Dimension lines go beside parts, not under. | 2×2 sheet of parts, title block top right, smaller. |
| Flat vector story | Hero object in the upper half, satellites and small planets above and below it; bubbles above. | Hero centered, fewer satellites. |
| Minimal monochrome | Big word in the upper third, supporting line under it, lists as full-width rows. | Centered big word, list below. |
| Apple-style promo | Object in the upper half (camera `aspect = W/H`, move the object up), words centered below it, 1–2 words per shot. | Object centered and smaller, one word under it. |
| Kinetic type | Words stacked one per line at 220–260px, color bands full width; long words break onto two lines or shrink to fit `W - 120px`. | One word per beat at ~220px, centered. |
