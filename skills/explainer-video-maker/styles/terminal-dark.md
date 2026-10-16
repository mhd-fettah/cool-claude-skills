# Terminal dark

**Format:** Explainer · **Render:** fast · **Reference:** `S({id:'terminal'` in the lookbook

## Use for
Developer tools, CLIs, SDKs, APIs, infra. Anything where the real interface is typed commands.

## Tokens
```css
--bg:#1a1714; --panel:#0f0d0b; --chrome:#221e1a; --line:#3a332d;
--fg:#e7e5e4; --muted:#a8a29e; --accent:#f97316; --ok:#4ade80; --warn:#fdba74;
```
Fonts: `@fontsource/jetbrains-mono` (500, 700) for terminal and header; `@fontsource/instrument-sans` (600) for captions.

## Layout
- **Header bar** 96px tall: product name in accent (700), chapter label in `--muted`, 1px bottom border. A 4px accent progress bar sits on the border.
- **Terminal window** about 1400×680, centered a little left, radius 24, three traffic-light dots, deep shadow.
- **Captions:** sans 44px, light text on `rgba(0,0,0,.55)` pill.
- **Mascot "Blink"** (an orange cursor block with eyes) at the lower right: bobs on `sin(t)`, blinks every ~2.3 s, eyes glance toward whatever is typing.

## Scene vocabulary
- Typed commands: `$ ` prompt in accent, the command typed at a constant rate (`typeText`, ~0.9 s per command), block cursor blinking at 2.5 Hz only on the active line.
- Output appears all at once 0.1 s after typing ends, colored by meaning (`--ok` success, `--warn` data).
- Keycaps for shortcuts, file trees, split panes (editor + terminal), diff views with red/green lines.
- One idea per window. Clear the window between scenes, don't scroll a long log.

## Motion
Fast and crisp: easeOut 0.3–0.5 s. Nothing bounces except Blink.

## Avoid
Neon green-on-black hacker clichés, fake "matrix" rain, more than one accent.

## Brand match
Replace `--accent` with the brand primary (check 4.5:1 on `--bg`), put the logo in the header instead of the text name, and keep the dark warm background.
