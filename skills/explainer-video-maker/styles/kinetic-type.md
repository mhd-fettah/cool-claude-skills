# Kinetic type

**Format:** Promo (also works as a 5–10 s opener for an explainer) · **Render:** fast · **Reference:** `S({id:'kinetic'` in the lookbook

## Use for
Launch teasers, social clips, event openers, quotes, manifesto videos. The words are the visuals.

## Tokens
```css
--bg:#2340ff; --fg:#ffffff; --ink:#0b1033;
--block-1:#ff7ab6; --block-2:#ffd23f; --block-3:#00e0b0;
```
Fonts: `@fontsource/anton` for the big words; `@fontsource/archivo` (500 italic, 600) for small lines and labels.

## Layout
- No header, chapters, progress bar or captions: the type is the message.
- A small label at top left (`TALLY — LAUNCH TEASER`, 30px Archivo 600, letter-spaced).
- One word or short phrase per beat, 300–340px Anton, centered.

## Scene vocabulary
- **Color-block wipe:** a full-width band (about 520px tall) wipes in from the left over ~0.28 s, the word slams in on top (scale 1.4 → 1 with `backOut`, letter-spacing .3em → .02em), then the band wipes out to the right just before the next beat.
- Rotate block colors per word. Text on a block is `--ink`; text on the background is `--fg`.
- A small italic aside can slide in next to a word (`anything.`).
- Other moves: words stacking line by line, a word splitting into letters that scatter, a counter racing to a number, a mask reveal through the letters onto an image.
- End on the logo or product name with an underline block that draws in.

## Timing
Cuts land on the beat (see `formats/promo.md`): each word gets 1–2 beats, so at 120 BPM that's 0.5–1 s per word. Keep the total to 15–30 s.

## Avoid
More than ~5 words on screen, thin fonts, slow fades. It should feel punchy.

## Brand match
Background = brand primary, blocks = brand secondary colors, final lockup = the real logo.
