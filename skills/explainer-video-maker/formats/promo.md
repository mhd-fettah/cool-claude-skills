# Promo format

Use when the user wants a promo, teaser, ad, launch video, trailer, or social clip, or picks a promo style (Apple-style promo, Kinetic type). The pipeline is the same as the explainer except for the clock, the script shape and the mux.

| | Explainer | Promo |
|---|---|---|
| Clock | Narration (or reading time) | **Music beats** |
| Length | As long as the material needs | 15, 30 or 60 s |
| Structure | Chapters, one per section | An ad story arc (below): cold open → trigger → drop → 3–6 feature shots → motivated transition → logo |
| On screen | Header, captions, progress bar | None of those; big type and hero visuals |
| Transitions | 0.6 s crossfades | Hard cuts on beats, flash on drops, plus one motivated transition (the hero smashes the lens, a whoosh, a clap) |
| Words | Full sentences | On screen: 1–4 word keywords. Voiceover (if any): full sentences that contain those keywords |

## Story arc (what turned a feature list into an ad)
The first cut of a promo tends to be "feature, feature, feature, logo". That isn't art direction. Build a small story with a character or hero and a turn:
1. **Cold open, the problem (0–6 s):** show the pain (for example, an endless document scrolling past). The hero is in the scene but not the focus (over the shoulder, out of focus). Use quiet music: ticks and a pad.
2. **The turn (about 6–8 s):** a voiceover question ("What if you could just watch it?"). The story *pauses*: the motion stops and the music ticks stop. The hero reacts *after* the line ends (a head turn, a "Huh?" bubble). Then the trigger line ("Let's do it.") and the hero's signature action (a jump, a spin, the clapperboard clack), then a moment of silence.
3. **The drop:** a flash, confetti, the hero in full motion. The first feature is shown as cause → effect ("Docs in → *clack* → Video out").
4. **Feature shots, 4 s each:** each has its own camera move and one visual idea tied to one keyword.
5. **Motivated transition into the logo:** the hero leaps into the lens, the glass cracks, and it shatters on the second drop.
6. **Logo:** the hero lands, the tagline appears word by word, then the command or URL on the final hit, and a fade out.

Write the shot list as a table (time | what we see | camera | voiceover | music or SFX) and show it to the user before building.

**Size:** asked in Step 2 like any video. Promos for Reels, TikTok or Shorts should be vertical (1080×1920), so recommend that when the request mentions social. Lay shots out with the vertical notes in `styles/README.md`.

## Settings (replaces Step 3 for promos)
One AskUserQuestion call, first option the default:
1. **Length:** 30 s (Default) / 15 s / 40 s (room for a story opening) / 60 s.
2. **Sound:** Music + voiceover (Default for ads) / Music only / Silent.
3. **Music:** "Generate an original track" (Default when they have none; synthesized in numpy, no licensing question, exact beats) / "I'll provide a track" (ask for the file) / No music, fixed 110 BPM grid. Never download music from the web yourself: licensing is the user's call. If they ask for help, offer generation first, then royalty-free libraries they can download from themselves (YouTube Audio Library, Pixabay Music, Uppbeat).
4. **Content approach:** same as the explainer (Creative & minimal default).

Then ask once for art direction ("Anything about the feel or motion? For example, more action, a character moment, a specific transition"). Users often have strong ideas here.

## Script → `script.json`
Same shape as the explainer, plus `beats` per shot. Each line is one on-screen phrase; `say` is only spoken if a voiceover was chosen.
```json
[{"id":"hook","chapter":"","beats":8,"lines":[["", "Your data."],["", "Every answer."]]},
 {"id":"connect","chapter":"","beats":4,"lines":[["Connect anything.","Connect."]]},
 {"id":"logo","chapter":"","beats":8,"lines":[["", "Tally."]]}]
```
Total beats ≈ length × BPM / 60 (30 s at 120 BPM = 60 beats). Put the payoff on a downbeat (a multiple of 4 or 8 from the start).

## Beats → `beats.py`
```python
# python beats.py music.mp3   (or: python beats.py --bpm 110 --seconds 30)
import json, subprocess, sys, numpy as np
if sys.argv[1] == "--bpm":
    bpm, dur = float(sys.argv[2]), float(sys.argv[4]); period = 60/bpm; first = 0.0
else:
    SR, HOP = 22050, 256
    raw = subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar",str(SR),"-f","f32le","-"],
                         capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32); dur = len(y)/SR; n = len(y)//HOP; fps = SR/HOP
    env = np.log1p(np.sqrt((y[:n*HOP].reshape(n, HOP)**2).mean(1))*100)
    onset = np.maximum(0, np.diff(env, prepend=env[0])); o = onset - onset.mean()
    ac = np.correlate(o, o, "full")[n-1:]
    lags = np.arange(int(fps*60/180), int(fps*60/70)+1)          # 70–180 BPM
    period = lags[np.argmax(ac[lags])]/fps
    while period > 60/90: period /= 2                             # prefer 90–180 BPM
    # refine: try periods within ±4% and phases on a 5 ms grid; keep the grid that lands on the most onset energy
    wide = np.maximum(onset, np.maximum(np.roll(onset, 1), np.roll(onset, -1)))
    score, period, first = max((wide[np.minimum((i*fps).astype(int), n-1)].sum(), p, ph)
        for p in np.arange(period*.96, period*1.04, .0005)
        for ph in np.arange(0, p, .005)
        for i in [ph + np.arange(int((dur-ph)/p))*p])
    bpm = 60/period
beats = [round(first + i*period, 3) for i in range(int((dur-first)/period)+1)]
json.dump({"bpm": round(bpm,1), "period": round(period,4), "beats": beats, "duration": round(dur,3)},
          open("beats.json","w"), indent=1)
print("bpm", round(bpm,1), "beats", len(beats), "first", round(first,3))
```
Tell the user the detected BPM. If it sounds wrong to them, rerun with `--bpm <their number> --seconds <track length>` and use the track's first beat as an offset if needed.

## Timeline → `promo_timeline.py`
Places each shot on beat boundaries and splits its lines evenly across its beats. The output has the same shape as the explainer's `timeline.json` (plus `beats`), so `main.js` and the scenes work unchanged.
```python
import json
bt = json.load(open("beats.json")); B, per = bt["beats"], bt["period"]
at = lambda i: B[i] if i < len(B) else B[-1] + (i-len(B)+1)*per
shots, i, scenes = json.load(open("script.json")), 0, []
for sc in shots:
    a, b, k = at(i), at(i + sc.get("beats", 4)), len(sc["lines"])
    lines = [{"text": cap or say, "start": round(a+(b-a)*j/k, 3), "end": round(a+(b-a)*(j+1)/k, 3)}
             for j, (say, cap) in enumerate(sc["lines"])]
    scenes.append({"id": sc["id"], "chapter": sc.get("chapter",""), "start": round(a,3), "end": round(b,3), "lines": lines})
    i += sc.get("beats", 4)
json.dump({"duration": round(scenes[-1]["end"] + 1.0, 3), "scenes": scenes, "beats": B, "bpm": bt["bpm"]},
          open("timeline.json","w"), indent=1)
print("total", scenes[-1]["end"] + 1.0)
```
Then write `timeline.js` as usual. If the music is longer than the video, it gets trimmed and faded at the mux.

## Original music → `music.py` (when the user has no track)
Synthesize the track in numpy so the beats are exact and the arrangement follows the story. A worked 41 s example is in `references/apple-promo-example/music.py`.
- **Instruments that worked:** sine kick with a pitch sweep, noise clap, hats, saw bass sidechained to the kick, supersaw chord stabs on the off-beats, a 16th-note pluck arpeggio, pads, a filtered-noise riser, a sub-boom impact, a crash, and FFT convolution reverb. Use an uplifting progression (F–G–Am–C).
- **Score the story, not just a loop:**
  - a ticking intro that stops when the story pauses
  - a "huh?" blip on the reaction
  - a whoosh when the text flies off
  - a snare roll and riser into the trigger
  - a **wooden clack exactly on the prop's clap, followed by about 1 s of silence before the drop**
  - a crash and whoosh at every shot change
  - glass crack and shatter on the lens-smash transition
  - a second drop on the logo, and the final hit on the call to action
- Cache repeated notes and stabs. The whole render takes about 2–3 s.

## Voiceover → `vo.py` (sentences, with keywords synced to the beat)
Two failure modes to avoid:
- Lines placed at fixed beat slots drift away from the text that's supposed to match them.
- Speaking only the on-screen keywords sounds robotic.

What works: **the voice speaks full sentences, and the on-screen words are keywords from them that pop in at the exact moment they're spoken.** Each sentence is shifted so its main keyword lands on a beat.
```python
# per sentence: (scene, text, [keywords, one per on-screen line], anchor keyword index, anchor time on a beat)
def onset(a, text, kw):                      # when kw starts inside the full clip a
    i = text.index(kw)
    if i == 0: return 0.0
    pre, rest = tts(text[:i].rstrip(" ,.")), tts(text[i:])
    est = len(a) * len(pre) / (len(pre) + len(rest)) / SR          # proportional estimate
    e = env(a)                                                       # 10 ms RMS envelope
    fr = int(est*100); lo, hi = max(1, fr-12), min(len(e)-2, fr+8)
    m = lo + int(np.argmin(e[lo:hi]))                                 # word boundary = quietest point near it
    top = e[m:m+15].max(); j = m
    while j < len(e)-1 and e[j] < e[m] + .25*(top - e[m]): j += 1   # snap to the syllable onset
    return j / 100
# t0 = anchor_time - onset(anchor keyword); every keyword's t0+onset goes to vo.json -> line start times
```
- `promo_timeline.py` reads `vo.json` and uses those onsets as the line `start` times (falling back to an even split). Scenes key visual events to `C(i)` too: the spin on "video", the screen flip on "brand", the chips on "no API key".
- Keep every sentence inside its shot, and warn when one overlaps the next.
- **Voice:** `af_bella` at speed 1.08, pitched up about 1 semitone for a brighter ad read: `asetrate=48000*1.07,aresample=48000,atempo=0.9346`. This keeps the timing, so the onsets still match.
- Trim the silence at the start of each clip, so the start time is when the word begins.

## Scenes
- In `main.js`, use hard cuts for promos: a scene's opacity is 1 while `start ≤ t < end`, else 0 (no crossfade). Skip the header, captions and progress bar.
- Beat pulse helper for small accents (a scale bump, a flash, a light flicker):
  ```js
  const BEATS=TIMELINE.beats||[];
  function beatPulse(t,decay=.12){let lo=0,hi=BEATS.length-1,b=-1;while(lo<=hi){const m=(lo+hi)>>1;if(BEATS[m]<=t){b=BEATS[m];lo=m+1;}else hi=m-1;}return b<0?0:Math.exp(-(t-b)/decay);}
  ```
  Use it sparingly, for example `scale(${1+.03*beatPulse(t)})` on the hero word.
- Big camera moves and word reveals start on a beat and last a whole number of beats.

## Mux
```bash
D=$(python -c "import json;print(json.load(open('timeline.json'))['duration'])")
# music only
ffmpeg -y -i video.mp4 -i music.mp3 -t $D -af "afade=t=out:st=$(python -c "print($D-1.5)"):d=1.5,loudnorm=I=-14:TP=-1.5" \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart Final.mp4
# music + voiceover: sidechain-duck the music under the (pitched-up) voice, then limit
ffmpeg -y -i video.mp4 -i music.wav -i voice.wav -t $D -filter_complex \
  "[1:a]aresample=48000,volume=0.85[m];[2:a]aresample=48000,asetrate=48000*1.07,aresample=48000,atempo=0.9346,volume=2.7,asplit=2[v1][v2];\
   [m][v1]sidechaincompress=threshold=0.05:ratio=4:attack=15:release=350[md];[md][v2]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.7:level=false[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart Final.mp4
```
Check the balance with `volumedetect` on a voiced window and on a music-only window. They should be within about 1 dB. If the voiced parts come out quieter, the ducking is too strong or the voice gain too low. `loudnorm` on short, punchy material overshoots to 0 dBFS after AAC, so use gain plus `alimiter` instead.
Silent promo: remux without audio as in the explainer.

## Verify
As for the explainer, plus:
- extract frames right at three beat times and check that each cut lands on its beat (the new shot is visible on the beat frame, not one frame late)
- extract frames at **every keyword onset** from `vo.json`: each should show its word just starting to pop in, with the matching action (flip, clap, peek) visible in frame
- tell the user to listen for whether the cuts and keywords feel on the beat, and whether the voice pitch feels right. You can't hear it.

## Iterating with the user
- Keep each version (`<date>_<slug>-v2`, `-v3`…) and a script file listing the voiceover and keyword times, so the user can compare.
- Re-render only the chunks a fix touches, then re-concat and re-mux.
- SendUserFile caps at 30 MB. Send a `-crf 24` preview copy and point to the full file in the output folder.
