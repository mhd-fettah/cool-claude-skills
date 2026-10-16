# Flat vector story

**Format:** Explainer · **Render:** fast · **Reference:** `S({id:'vector'` in the lookbook

## Use for
Science, big ideas, education, mission and "why it matters" videos. Inspired by science-channel explainers: ideas become little worlds.

## Tokens
```css
--bg-top:#170f40; --bg-bottom:#3b1d6e; --fg:#ffffff; --ink:#3b1d6e;
--warm-a:#ffb36b; --warm-b:#ff4f7e; --band-a:#ff7a6b; --band-b:#e2406e; --ring:#ffd6a5;
--mint:#5eead4; --gold:#ffd166; --lilac:#a78bfa; --pink:#ff8fab; --steel:#cbd5ff;
```
Fonts: `@fontsource/nunito` (800, 900).

## Layout
- Product name top left (48px Nunito 900). Chapter label as a small rounded pill beside it. Progress bar optional: a 6px rounded line at the bottom in `--ring`.
- One "hero object" in the middle of each scene (a planet, a cell, a machine, a city), with smaller objects around it.
- **Captions:** 48px Nunito 800 white, no background (the background is dark enough).

## Scene vocabulary
- Flat shapes with **two-stop gradients** and a few clipped "bands" or highlight shapes for volume. No outlines.
- Background depth: 60–100 seeded stars or particles that twinkle with `sin(t*2 + i*6)`; 2–3 parallax layers that drift at different speeds.
- Hero objects pop in with `backOut` scale. Small satellites orbit on ellipses (`cos/sin` of `t`), entering from far out.
- Ideas as metaphors: data = satellites docking, a question = speech bubble that flips `?` → `!`, sharing = beams (`drawOn`) to small planets that pop at the end of each beam.
- Rings and orbits have a back half (behind, lower opacity) and a front half (an SVG arc drawn over the object).
- Little characters (round body, dot eyes) can react to events.

## Motion
Lively but smooth: `backOut` pops, easeOut flights, continuous slow orbits and twinkles so the frame is never still.

## Avoid
Outlines, realistic textures, text-heavy scenes. Show it, don't write it.

## Brand match
Pull two of the brand's colors in as the hero gradient and keep the deep background. Logo on the intro, floating like an object, and on the outro.
