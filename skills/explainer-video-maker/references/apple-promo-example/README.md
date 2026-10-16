# Apple-style promo: worked example

The source of the 41 s "Explainer Video Maker" ad (v5). It's the reference for [styles/apple-promo.md](../../styles/apple-promo.md) and [formats/promo.md](../../formats/promo.md). Read the parts you need; don't copy it wholesale. The story, shots and copy are specific to that video.

| File | What to take from it |
|---|---|
| `world.js` | Shared Three.js world: glossy rounded voxels + RoomEnvironment, the rigged voxel mascot (`W.clawd({...})`: bounce, squash, sway, arm, prop, clap, legs, eye patterns, reach), the Reflector floor with its fade, confetti, background dust, screens with CanvasTextures, `renderSplit` (hero above the DOM text, with its own blur), brand-tinted style repaint, camera motion blur |
| `scenes.js` | One object per shot with `camF(t)` + `update`. Look at: `orbit()`, `dance()`, the over-the-shoulder opening with the pause / head turn / "Huh?" bubble / clap over the text, docs-in → clack → video-out, screens turning to camera on a keyword, the lens-smash `shatter()` overlay |
| `music.py` | Original numpy score that follows the story: ticks that stop, whoosh, clack + silence, two drops, glass crack and shatter |
| `vo.py` | Sentence voiceover: keyword onsets measured, each sentence shifted so its anchor keyword lands on a beat, writes `vo.json` |
| `promo_timeline.py` | Beat timeline whose line start times come from `vo.json` |
| `render.js` / `stills.js` | GPU (ANGLE d3d11) Playwright render over `http://localhost:8123` |

Pipeline: `python music.py` → `python beats.py 120 41` → `KOKORO_MODELS=<dir> python vo.py` → `python promo_timeline.py` → `python -m http.server 8123` → `node stills.js <t…>` → `node render.js <from> <to> partN.mp4` (parallel chunks) → concat → mux (formats/promo.md). It also needs `mascot.png` next to `index.html`, plus `npm i playwright@1.56 three@0.160.0 @fontsource/inter-tight @fontsource/jetbrains-mono`.
