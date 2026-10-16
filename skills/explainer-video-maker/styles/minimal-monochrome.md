# Minimal monochrome

**Format:** Explainer · **Render:** fast · No lookbook preview

## Use for
A quiet fallback that fits any material, or when the user asks for "simple", "clean" or "minimal".

## Tokens
```css
--bg:#fafafa; --fg:#111111; --muted:#6b6b6b; --line:#dddddd; --accent:#111111;
```
One optional accent color may replace `--accent` for a single highlight per scene.
Fonts: `@fontsource/inter-tight` (300, 600, 800).

## Layout
- Header: chapter number and name in small caps at top left, a 2px progress line in `--fg` across the top.
- Lots of empty space. One idea per scene, centered or on a strict left grid.
- **Captions:** 40px `--fg`, no background.

## Scene vocabulary
- Big type (120–180px, weight 800) for the key word or number, with a light (300) supporting line.
- Thin-line diagrams (2px), circles and dots, simple grids, a single highlighted element.
- Lists that reveal one item at a time; the active item turns `--fg`, others `--muted`.

## Motion
Slow easeIO, 0.6–0.8 s, small distances. Fades and masks rather than movement.

## Brand match
Use the brand font and make the brand primary the single accent.
