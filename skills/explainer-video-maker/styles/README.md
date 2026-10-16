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
- Coordinates in the style files are for the 1920×1080 stage.
- Keep content between y≈110 and y≈880, captions at `bottom:44px` (unless captions are off).
- Header bar, chapter label and progress bar are part of the explainer format. Each style says how to draw them. Promo styles drop them.
- Every color is a CSS token in `index.html` (`--bg`, `--fg`, `--accent`, …) so brand match can swap them.
- Fonts come from `@fontsource/<name>` (npm) so the render stays offline.
