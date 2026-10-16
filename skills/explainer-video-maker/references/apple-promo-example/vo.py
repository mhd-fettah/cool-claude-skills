# Sentence voiceover with keyword timing. Each sentence is placed so its anchor keyword lands on a beat;
# every keyword's spoken onset becomes the time its on-screen line appears (vo.json).
# Keyword onset = estimate from a prefix-only render, snapped to the nearest syllable onset in the full clip.
import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
import os
M = os.environ.get("KOKORO_MODELS", "models") + "/"   # folder with kokoro-v1.0.onnx and voices-v1.0.bin
k = Kokoro(M + "kokoro-v1.0.onnx", M + "voices-v1.0.bin")
VOICE, SPEED, SR, DUR = "af_bella", 1.08, 24000, 41.0
# scene, text, [keywords in order -> one per on-screen line], anchor keyword index, anchor time (s) or None=start time
S = [("open", "So much to read.", [], None, 1.0),
     ("open", "What if you could just watch it?", [], None, 3.0),
     ("open", "Okay. Let's do it!", ["Let's", "do it"], 0, 6.0),
     ("action", "Drop in your docs, and get a finished video out.", ["docs", "video"], 0, 9.0),
     ("files", "Paste a link, drop in a file, or point it at a folder.", ["link", "file"], 0, 13.0),
     ("clock", "The voice is the clock, so every scene lands on its words.", ["The voice", "is the clock"], 0, 16.5),
     ("styles", "Pick from eight different styles, all in your own brand.", ["eight", "all in"], 0, 20.75),
     ("anim", "Every scene is real animation, not just slides.", ["real", "not just"], 0, 25.0),
     ("free", "It's free, it works offline, and there's no A P I key.", ["free", "offline", "no A P I"], 0, 28.5),
     ("logo", "Explainer Video Maker.", ["Explainer"], 0, 32.5),
     ("logo", "Watch, don't read.", ["Watch", "don't"], 0, 34.0)]

def tts(text):
    a, _ = k.create(text, voice=VOICE, speed=SPEED, lang="en-us"); a = a.astype(np.float32)
    nz = np.where(np.abs(a) > 0.012)[0]; return a[max(0, nz[0] - 120): nz[-1] + 1500]
def env(a, hop=240):  # 10 ms RMS
    n = len(a) // hop; return np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1))
def onset(a, text, kw):
    i = text.index(kw)
    if i == 0: return 0.0
    pre, rest = tts(text[:i].rstrip(" ,.")), tts(text[i:])
    est = len(a) * len(pre) / (len(pre) + len(rest)) / SR
    e = env(a); fr = int(est * 100)
    lo, hi = max(1, fr - 12), min(len(e) - 2, fr + 8)
    m = lo + int(np.argmin(e[lo:hi]))            # quietest point near the estimate = word boundary
    top = e[m:m + 15].max(); j = m
    while j < len(e) - 1 and e[j] < e[m] + .25 * (top - e[m]): j += 1
    return j / 100

out = np.zeros(int(DUR * SR), np.float32); res = {}; prev_end = 0; rows = []
for scene, text, kws, ai, at in S:
    a = tts(text); ons = [onset(a, text, w) for w in kws]
    t0 = at - (ons[ai] if kws else 0)
    if t0 < prev_end + .05: rows.append(("!! OVERLAP", scene, text, round(prev_end - t0, 2)))
    s = int(round(t0 * SR)); out[s:s + len(a)] += a[:len(out) - s]; prev_end = t0 + len(a) / SR
    res.setdefault(scene, []).extend(round(t0 + o, 3) for o in ons)
    rows.append((scene, round(t0, 2), round(len(a) / SR, 2), text, [round(t0 + o, 2) for o in ons]))
sf.write("voice.wav", out, SR)
json.dump(res, open("vo.json", "w"), indent=1)
for r in rows: print(r)
