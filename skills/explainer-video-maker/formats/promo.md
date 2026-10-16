# Promo format

Use when the user wants a promo, teaser, ad, launch video, trailer, or social clip, or picks a promo style (Apple-style promo, Kinetic type). The pipeline is the same as the explainer except for the clock, the script shape and the mux.

| | Explainer | Promo |
|---|---|---|
| Clock | Narration (or reading time) | **Music beats** |
| Length | As long as the material needs | 15, 30 or 60 s |
| Structure | Chapters, one per section | 4–8 shots: hook → 2–4 features → payoff → logo |
| On screen | Header, captions, progress bar | None of those; big type and hero visuals |
| Transitions | 0.6 s crossfades | Hard cuts on beats (or 2-frame flash/whip) |
| Words | Full sentences | One short phrase per shot, 1–4 words |

**Size:** asked in Step 2 like any video. Promos for Reels, TikTok or Shorts should be vertical (1080×1920), so recommend that when the request mentions social. Lay shots out with the vertical notes in `styles/README.md`.

## Settings (replaces Step 3 for promos)
One AskUserQuestion call, first option the default:
1. **Length:** 30 s (Default) / 15 s / 60 s.
2. **Sound:** Music only (Default) / Music + a short voiceover / Silent.
3. **Music:** "I'll provide a track" (Default; ask for the file) / No music: cut to a fixed 110 BPM grid (silent or voiceover only). Never download music from the web yourself: licensing is the user's call.
4. **Content approach:** same as the explainer (Creative & minimal default).

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

**Voiceover in a promo:** generate each spoken line with Kokoro (or the system voice) as in `tts.py`, but place it at its line's `start` instead of back to back. If a clip is longer than its line, add beats to that shot and rerun `promo_timeline.py`. Build `voice.wav` by padding silence between clips to those start times.

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
# music + voiceover: duck the music under the voice
ffmpeg -y -i video.mp4 -i music.mp3 -i voice.wav -t $D -filter_complex \
  "[1:a]volume=0.35,afade=t=out:st=$(python -c "print($D-1.5)"):d=1.5[m];[m][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart Final.mp4
```
Silent promo: remux without audio as in the explainer.

## Verify
As for the explainer, plus: extract frames right at three beat times and check that each cut lands on its beat (the new shot is visible on the beat frame, not one frame late). Tell the user to listen for whether the cuts feel on the beat; you can't hear it.
