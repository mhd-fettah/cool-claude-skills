---
name: "explainer-video-maker"
description: "Turn docs, links, or text files into a narrated animated explainer MP4, or a short music-led promo (HTML/JS animations + Kokoro offline voice + Playwright + ffmpeg). Use when asked to make an explainer, promo, teaser or other video from material."
---

# Explainer Video Maker

Core idea: the **voiceover is the clock**. Generate narration one sentence at a time with Kokoro (free, offline TTS), record exactly when each sentence starts and ends, then drive every caption and animation from those timestamps. Animations are a single HTML page whose state is a pure function of time `renderAt(t)`. A headless browser screenshots it frame by frame, and ffmpeg encodes the frames and adds the voice track. Because the visuals follow the audio's timing, the two stay in sync.

If the user picks a **silent video** (no narration), the clock is a reading-time timeline instead of the audio (section 5b). For a **promo** (short, music-led teaser), the clock is the music's beats ([formats/promo.md](formats/promo.md)). Everything else stays the same.

Pipeline: **Extract what was given → Detect environment → Intro (if needed) → Material (if missing) → Read it + collect brand assets → Format + style (suggested from the material) → Settings (change any number at once) → Notes + save location → Script → Voice / silent / beat timeline → Scenes (load the style file) → Review stills → Render → Mux → Verify → Deliver**

Supporting files, loaded only when needed:
- [styles/](styles/README.md): one file per style with tokens, fonts, layout, scene vocabulary and motion rules. Load the chosen one before writing scenes.
- [formats/promo.md](formats/promo.md): the promo format (beats, shot script, music mux). Load it only for promos.
- [references/style-lookbook.html](references/style-lookbook.html): working 960×540 code for every style (search `S({id:'<id>'`). Read the chosen style's block as a starting point.

---

## 1. Intake (guided, one step at a time)

Run intake as a short conversation in stages, not one big form. Use AskUserQuestion for choices. If the user is away, use the defaults, say which ones you used, and proceed.

### First: extract what the user already gave you (mandatory, before any question)
Never ask for something the user already provided. Before you ask anything, scan **the whole request**: the user's message, any skill arguments, earlier messages in this conversation, attachments, and pasted text. Fill this checklist:

| Item | Counts as "provided" when the request contains… |
|---|---|
| **Material** | Any URL or bare domain (`https://…`, `www.…`, `querytab.com`, `docs.example.io/guide`); an attached or uploaded file; a named file or folder; pasted text; a clear product or topic plus "research it" |
| **Style** | Any look or feel words (dark, minimal, corporate, playful, "like Apple", brand colors, a reference video) |
| **Length** | Any duration or scope ("1 minute", "short", "cover everything", "one per section") |
| **Size** | "Vertical", "reel", "TikTok", "Shorts", "story", "square", "for Instagram", "4K", "landscape", or a size like `1080x1350` |
| **Voice** | Gender, accent, a named voice, speed |
| **Sound & captions** | "No voice", "silent", "no sound", "music only", "no subtitles", "no captions" |
| **Content approach** | "Stick to the docs", "use the screenshots", "be creative", "keep it minimal", "simplify" |
| **Save location** | A folder or path, "save it to my Desktop", an open project or connected folder |
| **Notes** | Audience, language, emphasis, things to skip, a call to action |

Rules:
- **A URL or domain anywhere in the request means material is provided.** Fetch it right away (WebFetch; add `https://` to a bare domain; if WebFetch fails, use the browser fallback in section 2). Do not ask "what material should I use?", and don't offer "I'll share a link" as an option.
- **Request material wins over the connected folder.** If the folder has nothing relevant but the request contains a link or text, use the request's material. Don't mention the folder's unrelated contents.
- Only ask about the material if the request has no URL, file, folder, pasted text or researchable topic. If a fetch fails (blocked, 404, login wall, JavaScript-only page), **try the browser fallback first** (section 2). Ask the user for another link, files or a description only if the browser is unavailable or also fails, and say what you tried.
- If the material is thin (for example, a one-page landing site), you may offer to **add** sources (docs pages linked from it, or web research). Phrase it as "I read X. Want me to also pull in Y?", never as asking for the material again.
- Open your first reply by confirming what you picked up, in one line. For example: "Got it: making a video about Querytab from querytab.com (reading it now)." Then continue with the first missing item.
- Each later step runs only if its item is still missing. If the user already gave a style, length or voice, confirm it in the final summary instead of asking.

### Then: detect the environment (silently, before the first question)
Where you run decides where files go, which tools you have, and whether the local voice model can run. Check quietly and don't ask the user about it:

| Environment | How to tell | Work folder | Final output |
|---|---|---|---|
| **Desktop: Claude Code** (CLI, IDE extension, desktop app with a local shell) | You have Bash/PowerShell on the user's own machine (Windows paths like `C:\`, `/Users/…`, `/home/…`); no `/mnt/user-data` | A temp/scratchpad folder, or `<save location>/.video-build/` | The save location (Step 4) |
| **Desktop: Claude app with a connected device** | `device_bash` / `device_commit_files` tools exist | Cloud workspace (or the device if it has the tools) | Committed to the connected folder |
| **Web: claude.ai cloud workspace** | `/mnt/user-data/` exists, Linux sandbox, Chromium in `/opt/pw-browsers` | `vid/` in the workspace | `/mnt/user-data/outputs/` + SendUserFile |

Then probe what the build needs (`python --version` or `python3`, `node -v`, `ffmpeg -version`, `pip`, and network access to github.com, pypi and npm). Record:
- **Local voice OK?** Kokoro needs Python 3.9+, pip, and a one-time ~340 MB model download. If any is missing and can't be installed, the voice options change (Step 3): offer the system voice (Windows SAPI via PowerShell `System.Speech`, macOS `say`, Linux `espeak-ng`), building in the cloud if available, or a silent video. Say this in one line; don't fail late.
- **Render OK?** Node + ffmpeg + a Chromium for Playwright. On a desktop, `npx playwright install chromium` is fine. In the cloud workspace, never run it; use `/opt/pw-browsers`.
- **Browser tools?** Note whether the Claude in Chrome tools (`mcp__claude-in-chrome__*`) are available for the fetch fallback in section 2.

### Step 0: Short intro (only if the request contains no material at all)
Explain the skill in 2–3 sentences: "I can turn docs, links, or text files into a narrated animated video, so you can watch instead of read. It runs locally: the voice (Kokoro) and the video rendering are offline models and tools that run on the machine, with no paid service or API key. Share the material and I'll take it from there."

### Step 1: Material (skip if already provided; go straight to reading it)
Ask what the video should cover: links, attached files, a connected folder, or pasted text. If they name a folder, list it and confirm which files to use. Then **read the material** (section 2) before asking about style, because the style suggestions depend on the content.

### Step 2: Format and style (suggest based on the material)
**Format.** Explainer is the default. Use **Promo** when the request says promo, teaser, ad, trailer, launch video, or social clip, or the user picks a promo style. If the request is ambiguous about this (for example "a video for our launch"), ask it as the first question of this step: Explainer (narrated, covers the material, Default) / Promo (15–60 s, music-led, big visuals). For promos, load [formats/promo.md](formats/promo.md).

**Style.** If the user already named a style, confirm it and move on. Otherwise use AskUserQuestion with 2–4 options:
1. **Two or three styles recommended for this material and format**, each with one line saying why it fits. Mark the best one "(Recommended)". The catalogue is in [styles/README.md](styles/README.md):
   - Developer tool, CLI, API docs → **Terminal dark**.
   - Business, process, policy, B2B → **Clean corporate**.
   - Tutorials and teaching → **Whiteboard**.
   - Storytelling, friendly consumer brands, education → **Paper cutout**.
   - Architecture, integrations, workflows → **Isometric**.
   - Hardware, engineering, specs, protocols → **Blueprint**.
   - Science, big ideas, mission → **Flat vector story**.
   - Anything, quiet and safe → **Minimal monochrome**.
   - Promo: product launch, hero shots → **Apple-style promo** (3D, slower to render). Teaser, social clip, quote → **Kinetic type**.
   - When brand assets are available, offer the best fit as **"Brand match · <style>"** first: the style's layout with the client's logo, colors and fonts.
2. The user can type their own style ("Other"): a reference video, a palette, or brand colors.

**Size.** Ask it in the **same AskUserQuestion call** as the style (and the format, when that's asked), so this step stays one screen. Skip it if the request already implies a size, and confirm it in the summary.
- **Horizontal 16:9 · 1920×1080 (Default):** YouTube, websites, presentations.
- **Vertical 9:16 · 1080×1920:** Reels, TikTok, YouTube Shorts, stories.
- **Square 1:1 · 1080×1080:** social feeds, LinkedIn, ads.
- **Other (custom):** the user types a size, for example `1080×1350` (Instagram 4:5 portrait), `3840×2160` (4K), or any width × height. They can also ask for several sizes of the same video.

Mark the size that fits the request "(Recommended)": a promo or social clip for Reels or TikTok → Vertical; a feed post → Square; otherwise Horizontal.

Custom size rules:
- Round each side to an even number (H.264 needs it), and say so if you changed it.
- Keep the short side at least 480 px and the long side at most 3840 px. Beyond that, ask before going on.
- An aspect ratio wider than 3:1 or taller than 1:3 is unusual. Confirm it's intended.
- Render time grows with pixel count: 4K takes about 4× as long as 1080p. Say so when the user picks it.
- **Several sizes:** build the scenes once for the main size, then do a layout pass for each extra size (section 6, "Sizes and layout"), with its own stills review and render. Narration and the timeline are shared. Name the files `<video-slug>-<W>x<H>.mp4`.

If the user wants to see the styles first, point them to the lookbook ([references/style-lookbook.html](references/style-lookbook.html)), published as an artifact if the environment can publish one.

### Step 3: Settings (all on one screen; change as many as you like)
For a promo, use the promo settings in [formats/promo.md](formats/promo.md) instead (length, sound, music, content approach). The rest of this step is for explainers.

Don't ask "keep or change?" and then make the user pick a single thing. Ask **one AskUserQuestion call with up to four questions**, one per setting, so the user can change several settings in one go. In each question the **first option is the current default, labeled "(Default)"**, so keeping everything is just accepting the first option of each. Skip a question if the user already answered it in the request, and confirm it in the summary instead.

1. **Length:** As long as needed, one video with chapters (Default; about 150 spoken words per minute) / Short summary, about 60–90 s / About 3 min / Several shorter videos, one per section.
2. **Voice:** Female US `af_heart` (Default) / Female US `af_bella` / Male US `am_michael` / British female `bf_emma`. "Other" covers `am_adam`, `bm_george`, and a speed between 0.8 and 1.2. If the local voice can't run (environment check), list the fallback voices instead and say why.
3. **Sound & captions:** Voice + captions (Default) / Voice, no captions / Silent with captions (no audio track; on-screen text carries the story) / Silent, no captions (visuals and on-screen titles only). With any silent option, the voice question doesn't apply: drop it, or ignore its answer.
4. **Content approach:**
   - **Creative & minimal (Default):** explain the ideas with original, clean animations (diagrams, flows, icons, simplified UI mockups). Use real screenshots only where the actual UI is the point, a few at most.
   - **Balanced:** mix original animations with the material's screenshots and images.
   - **Stick to the material:** follow the source closely and build scenes around its own screenshots, images and wording.

   Facts (names, numbers, commands, prices) stay exact in every approach. Only the visuals and the framing change.

The size was chosen in Step 2. Frame rate (30 fps) and the client's logo on the intro and outro stay at their defaults unless the user mentions them or types them under "Other".

Without AskUserQuestion, show the same four settings as a numbered list with lettered options and the defaults marked, and ask the user to reply with only the ones to change (for example "1b, 3c"), or "ok" to keep all.

### Step 4: Notes and save location
Ask once whether there's anything else: audience, language, sections to emphasize or skip, or a call to action at the end. "No" is a fine answer.

**Save location:** ask only when the request didn't name one **and** there's no project to save into, meaning no connected folder, and the working directory isn't a user project (for example a home folder, a system or temp folder, or the skills repo itself). Ask with AskUserQuestion, using real absolute paths for this machine:
- `~/Videos/<video-slug>/` (Recommended) / Desktop / The current folder / Other (type a path).

If there's a project (an open repo, a connected folder, or a path in the request), save into it without asking: `<project>/videos/<video-slug>/`, and say where in the summary. In the claude.ai cloud workspace with no connected folder, don't ask: deliver to `/mnt/user-data/outputs/`.

Then give a short summary (material, format, style, size, length, voice or silent, captions, content approach, save location) and start building.

**Brand assets (logo, colors, fonts, images):** the client decides. Most users make videos for their own company or for a client who asked for it, and then the video should use the real brand: logo, colors, fonts, product screenshots and images from the shared website or files.
- If the brand clearly belongs to the user (their domain or company, or "our product"), or they say it's for a client, use the assets fully. Don't ask.
- If it's unclear (for example, a video about a well-known third-party product), ask once: "Is this your company's (or your client's) brand, so I can use its logo and visuals?" If yes, use them. If no, use a brand-inspired style (palette and type feel) and leave out the logo and mascots.
- If no brand applies, use an original character. The default is "Blink", an orange terminal-cursor block with eyes.

## 2. Read the material and collect brand assets (right after Step 1)

**Content:** fetch every link (WebFetch) and read every file in full. Also follow the site's key internal pages (features, pricing, docs, about), staying within about 10 pages unless the user wants more. List each section or heading. Every section should map to at least one scene unless the user said to skip it. Keep the facts exact: names, numbers, commands, prices, claims.

**Browser fallback (when WebFetch or curl can't read a page):** before asking the user, try Claude in Chrome if its tools are available.
1. Load the tools in one ToolSearch call: `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__javascript_tool`.
2. Call `tabs_context_mcp`, open a **new** tab, `navigate` to the URL, and read it with `get_page_text` (or `read_page`). Follow key internal links the same way.
3. The same tab can also collect assets: `javascript_tool` can return the logo's `src` or inline SVG, `getComputedStyle` colors and CSS custom properties, font families, and image URLs. `computer` screenshots capture sections.
4. If the page needs a login, ask the user to sign in in that tab, then continue. Don't type credentials yourself.
5. Only if the browser tools are missing, not connected, or also fail, tell the user what you tried and ask for files, pasted text, or another link.

**Assets (when brand use is OK, per the brand-assets rule):** collect real visuals so the video looks like the client's own. Put them in `vid/assets/` and write `vid/assets/brand.json` listing what you found.

1. **Download the page HTML and CSS:** `curl -sL -A "Mozilla/5.0" <url> -o assets/page.html`, plus the linked stylesheets.
   - If curl gets blocked or returns an empty JavaScript shell, collect the assets through the browser fallback above. If that isn't possible either, ask the user to upload a logo, brand colors and screenshots.
2. **Logo:**
   - Look in this order: an inline `<svg>` or `<img>` in the header or nav whose class, id, alt or src contains "logo"; then `apple-touch-icon`; then `og:image`; then `favicon.svg` or `.ico`.
   - Prefer SVG. Save as `assets/logo.svg` or `.png`.
   - If the logo is dark on a transparent background, note whether it needs a light backdrop on a dark theme.
3. **Colors:**
   - Sources: `<meta name="theme-color">`, CSS custom properties (`--primary`, `--brand`, `--accent` and similar), and the most frequent non-gray hex or rgb values in the CSS.
   - Pick a primary, an accent, a background and a text color.
   - Check contrast: text on background should be at least 4.5:1.
4. **Fonts:**
   - Find them in Google Fonts `<link>`s or `@font-face` rules. If the font is on Google Fonts, install it from npm `@fontsource/<font-name>`.
   - Otherwise download the `@font-face` woff2 files the site serves.
   - If neither works, use the closest @fontsource match.
5. **Images and screenshots:**
   - Save hero images, product shots and feature illustrations (`<img>`, `srcset`, `og:image`) at the largest available size.
   - Also screenshot the live site with Playwright: the full page plus each key section at 1920px width, into `assets/shots/`. Close cookie banners first if possible. For a vertical or square video, also take mobile-width shots (430px wide, `deviceScaleFactor: 2`) into `assets/shots/mobile/`; they fit phone mockups far better than cropped desktop shots.
6. **Copy:** record the tagline, headline, feature names and call-to-action wording. Use the client's own phrasing in titles and captions.
7. **Report back:** list in one line what you collected (for example: "Got the logo (SVG), 3 brand colors, the Inter font and 6 screenshots"). Ask for anything missing that matters, such as a higher-resolution logo.

**Using the assets in scenes:**
- Logo on the intro title card, in the corner of the header bar (small), and large on the outro with the call to action and website URL.
- Brand colors become the CSS tokens (`--bg`, `--accent` and so on). Brand fonts go in `@font-face`.
- **Screenshots follow the content approach (Step 3).** Screenshots are reference material first: use them to understand the product, then decide how to show it.
  - *Creative & minimal:* redraw the idea as an original animation, such as a simplified UI mockup in brand colors, a diagram, or a flow. Use a real screenshot only when the viewer must recognize the actual screen, at most one or two in the video. Never let a screenshot be the whole scene with the narration just describing it.
  - *Balanced:* about half the feature scenes may use a screenshot. Pair each one with animated callouts, or build up a simplified version of it.
  - *Stick to the material:* screenshots can carry most feature scenes.
- When a screenshot is shown, put it inside a browser or phone mockup, with a slow pan or zoom (Ken Burns, computed from `t`), and callout highlights on the feature being narrated.
- Real product images replace generic icons wherever they explain better.
- Keep every asset local (relative paths in `assets/`); the renderer works offline.

## 3. Script → `script.json`

- Chapters (scenes) in source order: intro, one per section, outro.
- Each line is `[say, caption]`. `say` is written for the ear. `caption` is the on-screen text, or `null` to reuse `say`.
  - Spell out tricky tokens for TTS: `CLAUDE.md` → "Claude dot M D", `/model` → "slash model", `MCP` → "M C P", `APIs` → "A P Is", `Shift+Tab` → "shift tab", `Esc` → "escape".
- Keep sentences short, at most about 25 words, and use roughly 3–7 lines per scene. The voice speaks about 150 words per minute.
- **Silent video:** write each line for reading, not listening. Use the caption form, about 12 words at most. The `say` text isn't spoken, so it can equal the caption. With "Silent, no captions", the lines still time the scene, and the key words must appear in the scene itself as titles or labels.
- **Creative & minimal:** for each scene, write down the one idea it must get across and the original visual that shows it (for example "three steps → three cards that light up in turn") before writing the lines.
- Show the script outline to the user if they're present. If not, proceed.

```json
[{"id":"intro","chapter":"How X works","lines":[["How X works.",null],["Spoken text","Caption text"]]},
 {"id":"loop","chapter":"01 · Part one","lines":[...]}, ...]
```

## 4. Pick the environment

Use what the environment check (section 1) found:
- **Claude Code on a desktop:** build on the user's machine, in a temp/scratchpad folder or `<save location>/.video-build/`, never in the middle of their project files. Install missing pieces only with the user's OK. If the tools are missing and can't be installed, say so and offer a silent video or the system voice.
- **claude.ai cloud workspace:** it usually has everything. Chromium is at `/opt/pw-browsers`; never run `playwright install`.
- **Claude app with a connected device:** check `device_bash` for the same tools. If they're missing or can't be installed, build in the cloud and commit the MP4 back to their folder.

Setup (skip the Kokoro lines for a silent video, or when using the system voice):
```bash
mkdir -p vid/models vid/stills && cd vid
pip install kokoro-onnx soundfile --break-system-packages   # on Windows/macOS desktops: pip install --user kokoro-onnx soundfile (or a venv)
curl -sSLo models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -sSLo models/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
npm init -y && npm i playwright@1.56 @fontsource/inter @fontsource/jetbrains-mono @fontsource/source-serif-4
npx playwright install chromium   # desktop only; never in the cloud workspace
```
Use absolute paths: `~` may not equal the working directory. On Windows, use `python` instead of `python3`, and keep the Kokoro model in a reusable place (for example `%LOCALAPPDATA%\explainer-video-maker\models`) so later videos skip the download.

## 5. Voice + timeline → `tts.py`

```python
import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
VOICE, SPEED = "af_heart", 1.0
k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
script = json.load(open("script.json")); SR = 24000
LEAD, LINE_GAP, SCENE_GAP, TAIL = 0.6, 0.35, 0.9, 2.0
chunks, t, timeline = [np.zeros(int(LEAD*SR), np.float32)], LEAD, []
for si, sc in enumerate(script):
    s = {"id": sc["id"], "chapter": sc["chapter"], "start": t - (LEAD if si == 0 else SCENE_GAP/2), "lines": []}
    for li, (say, cap) in enumerate(sc["lines"]):
        a, sr = k.create(say, voice=VOICE, speed=SPEED, lang="en-us"); a = a.astype(np.float32); d = len(a)/SR
        s["lines"].append({"text": cap or say, "start": round(t, 3), "end": round(t+d, 3)})
        chunks.append(a); t += d
        gap = LINE_GAP if li < len(sc["lines"])-1 else (SCENE_GAP if si < len(script)-1 else TAIL)
        chunks.append(np.zeros(int(gap*SR), np.float32)); t += gap
    s["end"] = t - (SCENE_GAP/2 if si < len(script)-1 else 0); timeline.append(s)
sf.write("voice.wav", np.concatenate(chunks), SR)
json.dump({"duration": round(t, 3), "scenes": timeline}, open("timeline.json", "w"), indent=1)
print("total", round(t, 1))
```
Then run `echo "window.TIMELINE=$(cat timeline.json);" > timeline.js`.

**System-voice fallback** (when Kokoro can't run): keep the same loop, but synthesize each line to a WAV with the OS voice (Windows: PowerShell `Add-Type -AssemblyName System.Speech` and `SpeechSynthesizer.SetOutputToWaveFile`; macOS: `say -o line.aiff`; Linux: `espeak-ng -w line.wav`), resample to 24 kHz with ffmpeg, then read it with `soundfile` in place of `k.create`.

## 5b. Silent timeline → `timeline.py` (silent video only)

No audio, so reading time is the clock. Each line stays on screen long enough to read comfortably:
```python
import json
script = json.load(open("script.json"))
LEAD, LINE_GAP, SCENE_GAP, TAIL = 0.6, 0.35, 0.9, 2.0
t, timeline = LEAD, []
for si, sc in enumerate(script):
    s = {"id": sc["id"], "chapter": sc["chapter"], "start": t - (LEAD if si == 0 else SCENE_GAP/2), "lines": []}
    for li, (say, cap) in enumerate(sc["lines"]):
        text = cap or say; d = max(2.2, len(text.split()) / 2.8 + 0.8)   # ~2.8 words/s plus a beat
        s["lines"].append({"text": text, "start": round(t, 3), "end": round(t+d, 3)}); t += d
        t += LINE_GAP if li < len(sc["lines"])-1 else (SCENE_GAP if si < len(script)-1 else TAIL)
    s["end"] = t - (SCENE_GAP/2 if si < len(script)-1 else 0); timeline.append(s)
json.dump({"duration": round(t, 3), "scenes": timeline}, open("timeline.json", "w"), indent=1)
print("total", round(t, 1))
```
Then write `timeline.js` the same way. With "Silent, no captions", lean on bigger on-screen titles and keep each scene's key text up for the scene's full length.

## 5c. Beat timeline (promo only)
Follow [formats/promo.md](formats/promo.md): `beats.py` finds the music's beats (or makes a fixed BPM grid), and `promo_timeline.py` writes a `timeline.json` of the same shape, so sections 6–8 work unchanged.

## 6. Scenes (HTML/CSS/JS, deterministic)

Files: `config.json` + `config.js` (the video size), `index.html` (fonts, CSS tokens, stage, header, captions, progress bar), `lib.js` (helpers), `scenes.js` (one object per scene id), `main.js` (the time engine).

**Size config:** write the chosen size once and read it everywhere:
```bash
echo '{"W":1920,"H":1080}' > config.json   # e.g. 1080x1920 vertical, 1080x1080 square
echo "window.STAGE=$(cat config.json);" > config.js
```
Load `config.js` first in `index.html`. The stage element gets `width:${STAGE.W}px;height:${STAGE.H}px`. `render.js` and `stills.js` read `config.json` for the viewport.

**Sizes and layout:** never stretch or letterbox a 16:9 layout into another size. Lay each scene out for its frame, in terms of `W`, `H` and a unit `U = Math.min(W,H)/1080` (multiply font sizes, strokes and spacing by `U`):

| Size | Safe content area | Captions | Layout |
|---|---|---|---|
| 16:9 · 1920×1080 | x 80–1840, y 110–880 | `bottom:44px`, up to 2 lines of ~60 chars | Rows of 3–4 items, side-by-side panels |
| 9:16 · 1080×1920 | x 60–940, y 260–1480 (the top ~250 px, bottom ~420 px and right ~140 px get covered by app buttons and text) | `bottom:440px`, up to 2 lines of ~28 chars, 56px+ | Stack vertically: one item per row, panels top and bottom, bigger type, fewer words per scene |
| 1:1 · 1080×1080 | x 60–1020, y 100–860 | `bottom:50px`, up to 2 lines of ~36 chars | 2×2 grids, one panel plus a caption, compact header |
| Custom | 6% of the short side on every edge; landscape-like ratios follow 16:9, portrait-like follow 9:16 | Scale with `U` | Pick the closest row above |

Each style file has notes on adapting it to vertical and square (see [styles/README.md](styles/README.md)). Check every size in the stills review.

**Rules**
- **Load the style file first** (`styles/<style>.md`) and take tokens, fonts, layout and scene vocabulary from it. Use the matching block in the lookbook as working code (its stage is 960×540; double the coordinates).
- No CSS transitions or animations, no `setTimeout`, no `Date.now()`, no `Math.random()`. Everything is computed from `t` inside `update()`. Seeded pseudo-randomness is fine (for example `hash(frameIndex*7+id)`), because the same frame always gives the same result.
- Stage size is `STAGE.W × STAGE.H` (1920×1080 by default). Keep content inside the safe area for that size, and captions where the table above puts them. Style files give coordinates for 1920×1080: re-lay them out for other sizes, don't just scale.
- **Captions off:** set `window.CAPTIONS=false` in `index.html` and skip caption rendering in `renderAt`. Content may then use the caption space too (for vertical, still stay above the bottom ~420 px).
- Load fonts from `node_modules/@fontsource/*/files/*.woff2` via `@font-face`. Wait for `document.fonts.ready`.
- Each scene has `build(root, C)`, which creates the DOM once, and `update(t, C, st)`, where `t` is local seconds. `C(i, f)` gives the local time at fraction `f` of line `i`. Use it to time reveals to the words, for example `C(0, .5)` for the middle of the first sentence.
- To hide elements, use `visibility`, never `display=''`, because that wipes an inline `display:flex`.
- Centered elements (`addC`) need `width:max-content`, or their text wraps.
- Visual vocabulary comes from the style file. Shared basics in any style: cycle diagrams (SVG ring with a moving dot), cards revealed one by one with the active one highlighted, flow and branch diagrams with `drawOn`, keycaps, and chips. Show the concept rather than just repeating the words.
- 3D (Apple-style promo) needs Three.js served over HTTP and WebGL flags for Chromium; the setup is in `styles/apple-promo.md`.

**lib.js core**
```js
const W=STAGE.W, H=STAGE.H, U=Math.min(W,H)/1080;   // from config.js; scale sizes by U
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), lerp=(a,b,p)=>a+(b-a)*p;
const easeOut=x=>1-Math.pow(1-x,3), easeIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const backOut=x=>{const c1=1.4,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const P=(t,a,d=.6,f=easeOut)=>f(clamp((t-a)/d));
const NS='http://www.w3.org/2000/svg';
function h(html){const d=document.createElement('div');d.innerHTML=html.trim();return d.firstElementChild;}
function add(p,html,x,y,w,hh){const el=h(html);el.style.position='absolute';if(x!=null)el.style.left=x+'px';if(y!=null)el.style.top=y+'px';if(w!=null)el.style.width=w+'px';if(hh!=null)el.style.height=hh+'px';p.appendChild(el);return el;}
function addC(p,html,cx,cy){const wrap=add(p,'<div style="width:0;height:0"></div>',cx,cy);const el=h(html);el.style.position='absolute';el.style.transform='translate(-50%,-50%)';if(!el.style.width)el.style.width='max-content';const inner=document.createElement('div');inner.style.cssText='position:absolute;left:0;top:0';inner.appendChild(el);wrap.appendChild(inner);wrap._el=el;wrap._inner=inner;return wrap;} // animate wrap._inner
function reveal(el,p,dy=26,sc=0,dx=0){el.style.opacity=p;el.style.transform=`translate(${(1-p)*dx}px,${(1-p)*dy}px) scale(${1-(1-p)*sc})`;}
function typeText(el,text,p){const n=Math.round(text.length*clamp(p));if(el._n!==n){el.textContent=text.slice(0,n);el._n=n;}}
function svg(p,w,hh,x=0,y=0){const s=document.createElementNS(NS,'svg');s.setAttribute('width',w);s.setAttribute('height',hh);s.style.cssText=`position:absolute;left:${x}px;top:${y}px;overflow:visible`;p.appendChild(s);return s;}
function sv(p,tag,a){const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e;}
function drawOn(el,p){if(!el._len){el._len=el.getTotalLength();el.style.strokeDasharray=el._len;}el.style.strokeDashoffset=el._len*(1-clamp(p));}
// + an ICON map of 60x60 stroke SVG paths (file, search, term, globe, code, laptop, cloud, ...) and icon(name,size,color)
```

**main.js core**
```js
const TL=window.TIMELINE, LIVE=[];
for(const s of TL.scenes){const def=SCENES[s.id];if(!def)continue;const root=h('<div class="scene"></div>');document.getElementById('scenes').appendChild(root);
  const C=(i,f=0)=>{const L=s.lines[Math.min(i,s.lines.length-1)];return L.start-s.start+f*(L.end-L.start);};C.end=s.end-s.start;
  LIVE.push({s,root,C,def,st:def.build(root,C)||{}});}
window.renderAt=function(t){let cur=null;
  for(const L of LIVE){const{s}=L;const a=clamp((t-s.start+.3)/.6),b=clamp((s.end+.3-t)/.6);
    const op=s===TL.scenes[0]?b:Math.min(a,b);if(op<=0){L.root.style.display='none';continue;}
    L.root.style.display='block';L.root.style.opacity=op;L.def.update(t-s.start,L.C,L.st,t);if(t>=s.start&&t<s.end)cur=s;}
  // captions: show the line whose [start-.15, end+.3] contains t, fade 0.2s; header chapter = cur.chapter; progress bar = t/duration
};
window.READY=document.fonts.ready.then(()=>{window.renderAt(0);return true;});
```

## 7. Review stills (required before the full render)

`stills.js` opens the page, calls `renderAt(t)` for the given times, and saves PNGs. Pick one time near the end of each scene, plus a few mid-scene times. Tile them at half size with `ffmpeg -pattern_type glob -i 's_*.png' -vf "scale=iw/2:ih/2,tile=2x3" sheet_%d.png` (use `tile=3x2` for vertical, `tile=3x3` for square), then Read the sheets. For vertical, also check that nothing important sits in the areas app buttons cover. Fix overlaps, wrapped labels, text off-screen, captions over three lines, empty panels, and console errors. Iterate until clean.

## 8. Render → `render.js`

```js
// node render.js <startFrame> <endFrame> <out.mp4>
const {chromium}=require('playwright');const{spawn}=require('child_process');const FPS=30,[s,e,out]=[+process.argv[2],+process.argv[3],process.argv[4]];
const {W,H}=require('./config.json');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--allow-file-access-from-files']});
 const p=await b.newPage({viewport:{width:W,height:H}});await p.goto('file://'+__dirname+'/index.html');await p.evaluate(()=>window.READY);
 const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',''+FPS,'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r',''+FPS,out],{stdio:['pipe','inherit','inherit']});
 for(let f=s;f<e;f++){await p.evaluate(t=>window.renderAt(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',out);})();
```
For 3D styles, add the WebGL args from `styles/apple-promo.md`, load `http://localhost:8123/index.html` instead of the file URL, and wait for `window.READY` to exist before awaiting it. Adjust `executablePath` to whatever Chromium exists. On a desktop, omit `executablePath` so Playwright uses its own Chromium, and on Windows build the URL with `require('url').pathToFileURL(__dirname+'/index.html').href`. Total frames are `ceil(duration*30)`. Benchmark 60 frames first (about 0.08 s per frame at 1080p; vertical and square are similar, 4K about 4× slower), then split into one chunk per CPU core and run the chunks in parallel (`nohup ... &` on Linux/macOS; on Windows use background shell runs or `Start-Process`). Poll the logs until each says `done`.

## 9. Mux

```bash
printf "file part1.mp4\nfile part2.mp4\n" > list.txt
ffmpeg -y -f concat -safe 0 -i list.txt -c copy video.mp4
ffmpeg -y -i video.mp4 -i voice.wav -c:v copy -c:a aac -b:a 192k -af "loudnorm=I=-16:TP=-1.5" -shortest -movflags +faststart Final.mp4
```
Silent video: skip the audio mux and just remux: `ffmpeg -y -i video.mp4 -c copy -an -movflags +faststart Final.mp4`. Promo with music: use the mux commands in `formats/promo.md`.

## 10. Verify

- Check with `ffprobe` that the video and audio durations match within 0.1 s, at the size in `config.json` and 30 fps. For a silent video, check that the video duration matches `timeline.json` and that there is no audio stream.
- Run `volumedetect` (voiced videos only): the mean should be around −16 dB, and the audio must not be silent.
- Extract frames at the chunk seam and at a scene transition, and Read them.
- Remember you can't hear the audio. Tell the user to listen for mispronounced terms, and offer to re-spell them and re-render.

## 11. Deliver

Name the files after the video (`<video-slug>.mp4` and `<video-slug>-script.txt`, a timestamped script: `[m:ss] Chapter` followed by its lines). With several sizes, add the size: `<video-slug>-1080x1920.mp4`; the script file is shared. Deliver by environment:
- **Claude Code on a desktop:** move both into the save location (Step 4) and give their full absolute paths. Delete the build folder unless the user wants to keep it for edits (offer once). If SendUserFile is available, send the MP4 too.
- **claude.ai cloud workspace:** copy both to `/mnt/user-data/outputs/`, then SendUserFile both.
- **Connected folder:** also commit both into it with device_commit_files, and name the folder and files.

In 2–3 sentences, give the length and chapters, say which brand assets were used (or what was missing), and offer tweaks: voice, pace, length, style, captions, content approach, or a silent version.