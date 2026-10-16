# Clean corporate

**Format:** Explainer · **Render:** fast · **Reference:** `S({id:'corporate'` in the lookbook

## Use for
B2B products, internal processes, policies, onboarding, compliance. Audiences who want clarity over flair.

## Tokens
```css
--bg:#f6f8fb; --card:#ffffff; --line:#dbe3ee; --fg:#1e3a5f; --muted:#64748b;
--accent:#14b8a6; --accent-ink:#0f766e; --accent-tint:#e6f7f5; --arrow:#94a3b8;
```
Fonts: `@fontsource/manrope` (500, 700) for everything.

## Layout
- **Header:** small square accent mark + product name (700) + "· chapter" in `--muted` at top left. Progress bar: 4px accent line at the very top.
- **Title** 68px bold centered under the header, one line.
- **Captions:** 44px navy on a white pill with a soft shadow.

## Scene vocabulary
- Icon cards (about 400×440, radius 32, 2px border) in a row of 2–4, each with an icon in a tinted circle, a title and a one-line subtitle. Cards reveal one by one on their sentence. The active card lifts 16px, gets an accent border and a teal shadow.
- Arrows between cards draw on (`drawOn`) just before the next card appears; the arrowhead appears when the line finishes.
- Flowcharts, swimlanes, checklists that tick, simple bar or donut charts, timelines with milestones.
- Icons: 2.5px stroke line icons from the `ICON` map, never emoji.

## Motion
Calm: easeOut 0.5–0.6 s, small offsets (24–48px). No bounces, no rotation.

## Avoid
Stock-photo people, gradients, more than two accent colors, clip art.

## Brand match
Swap `--fg` for the brand's dark color and `--accent` for its primary, use the brand font if it's a clean sans, logo top left.
