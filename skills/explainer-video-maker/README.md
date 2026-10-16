# Explainer Video Maker

Turn docs, links, or text files into a narrated, animated explainer video (MP4).

## Features

- **Any material in**: a URL, uploaded files, a folder, pasted text, or just a topic to research.
- **Narrated**: natural voiceover with a choice of US and British voices and adjustable speed.
- **Animated scenes**: diagrams, icon cards, typed terminal commands, flowcharts, and screenshots shown in browser mockups. Not just slides of text.
- **On-brand**: picks up the logo, colors, fonts, and screenshots from your site, so the video looks like yours.
- **Styles to fit the content**: suggests a look based on the material (terminal dark, clean corporate, whiteboard, data story, brand match, and more).
- **Captions and chapters**: on-screen captions, a chapter header, and a progress bar.
- **Free and offline**: no paid service or API key. The voice and the rendering run locally.
- **Guided setup**: asks a few short questions (style, length, voice), or uses sensible defaults if you're away.

## Install

**claude.ai**: zip the `explainer-video-maker` folder and upload it under **Settings → Capabilities → Skills**.

**Claude Code**: copy the folder into your skills directory:

```
# for all projects
cp -r skills/explainer-video-maker ~/.claude/skills/

# or for one project
cp -r skills/explainer-video-maker <your-project>/.claude/skills/
```

**Requirements** on the machine that builds the video: Python 3, Node.js, ffmpeg, and Chromium (for Playwright). The skill installs the Python and npm packages and downloads the voice model itself.

Then ask Claude something like *"make an explainer video from https://example.com"* or run `/explainer-video-maker`.

## How it works

The key idea: **the voiceover is the clock.**

1. **Read**: Claude fetches the links and files and, if allowed, collects brand assets (logo, colors, fonts, screenshots).
2. **Script**: it writes a short script, one chapter per section of the material, with spoken text and caption text for each line.
3. **Voice + timeline**: [Kokoro](https://github.com/thewh1teagle/kokoro-onnx), an offline text-to-speech model, speaks the script one sentence at a time. The exact start and end time of every sentence is saved to `timeline.json`.
4. **Scenes**: the animations are a single HTML page. Its whole state is a pure function of time, `renderAt(t)`, timed from the timeline, so each visual appears when its sentence is spoken. No CSS animations, timers, or randomness, so every frame can be reproduced.
5. **Review**: Claude renders still frames, checks them for layout problems, and fixes them before the full render.
6. **Render**: headless Chromium (Playwright) calls `renderAt(t)` for every frame at 30 fps and pipes screenshots to ffmpeg. Rendering is split into chunks that run in parallel.
7. **Mux + verify**: ffmpeg joins the chunks, adds the voice track with loudness normalization, and checks that audio and video durations match.

The result is a 1920×1080 MP4 plus a timestamped narration script.
