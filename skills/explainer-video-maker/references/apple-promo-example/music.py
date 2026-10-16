# Original 41 s ad track, 120 BPM (beat = 0.5 s). Pure numpy, deterministic.
# 0-6 s ticking intro | 6 s whoosh | 7 s clapper CLACK + silence | 8 s DROP | 28-32 s build | 32 s DROP 2 | 36 s final hit
import numpy as np, soundfile as sf
SR, BPM, DUR = 44100, 120, 41.0
B = 60 / BPM
N = int(DUR * SR)
rng = np.random.default_rng(21)
L = np.zeros(N); R = np.zeros(N); VERB = np.zeros((2, N)); SC = np.ones(N)  # SC: sidechain gain from kicks

def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def at(beat): return int(round(beat * B * SR))
def put(buf, start, sig, gain=1.0):
    s = max(0, start); e = min(N, start + len(sig))
    if e > s: buf[s:e] += sig[s - start:e - start] * gain
def onepole(x, a):
    y = np.empty_like(x); z = 0.0; a = np.broadcast_to(a, x.shape)
    for i in range(len(x)):
        z += a[i] * (x[i] - z); y[i] = z
    return y
def stereo(sig, start, gain=1.0, pan=0.0, verb=0.0, duck=False):
    gl, gr = np.cos((pan + 1) * np.pi / 4) * 1.41, np.sin((pan + 1) * np.pi / 4) * 1.41
    if duck:
        s = max(0, start); e = min(N, start + len(sig)); sig = sig.copy(); sig[s - start:e - start] *= SC[s:e]
    put(L, start, sig, gain * gl); put(R, start, sig, gain * gr)
    if verb: put(VERB[0], start, sig, gain * verb * gl); put(VERB[1], start, sig, gain * verb * gr)

def saw(freq, n, harm=12, det=0.0):
    t = np.arange(n) / SR; s = np.zeros(n)
    for k in range(1, harm + 1):
        if k * freq > 16000: break
        s += np.sin(2 * np.pi * k * freq * (1 + det) * t + k) / k
    return s
def kick(dur=.42, f0=170, f1=44, gain=1.0):
    t = np.arange(int(dur * SR)) / SR; f = f1 + (f0 - f1) * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    s[:150] += rng.standard_normal(150) * np.linspace(.6, 0, 150)
    return np.tanh(s * 1.8) * gain
def clap(dur=.32):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); x = x - onepole(x, .3)
    env = np.exp(-t * 16)
    for d in (0, .01, .021): env += np.where(t >= d, np.exp(-(t - d) * 130), 0) * .9
    return x * env * .33
def hat(dur=.05, a=.6):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); x = x - onepole(x, a)
    return x * np.exp(-t * (4 / dur)) * .2
def tick(f=2600, dur=.05):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) * .5 + rng.standard_normal(len(t)) * .3) * np.exp(-t * 90) * .5
def clack():  # wooden clapperboard
    n = int(.35 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    body = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((1150, .6), (1870, .45), (3100, .25))) * np.exp(-t * 38)
    snap = (x - onepole(x, .5)) * np.exp(-t * 160) * 1.4
    return np.tanh((body + snap) * 2.2) * .8
def impact(dur=2.5, k=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = 30 + 80 * np.exp(-t * 6)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.0)
    nz = onepole(rng.standard_normal(n), .15) * np.exp(-t * 4.5) * 1.5
    return np.tanh((sub * 1.3 + nz) * 1.4) * .8 * k
def crash(dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); x = x - onepole(x, .55)
    return x * np.exp(-t * 2.6) * .2
def riser(dur, top=1200):
    n = int(dur * SR); t = np.arange(n) / SR; p = t / dur
    y = onepole(rng.standard_normal(n), .01 + .55 * p ** 2.2)
    tone = np.sin(2 * np.pi * np.cumsum(200 + top * p ** 2) / SR) * .1
    return (y * 1.2 + tone) * p ** 1.7 * .55
def whoosh(dur=.6, k=.9):
    n = int(dur * SR); t = np.arange(n) / SR; p = t / dur
    y = onepole(rng.standard_normal(n), .02 + .35 * np.sin(np.pi * p) ** 2); y = y - onepole(y, .02)
    return y * np.sin(np.pi * p) ** 2 * k

PROG = [[53, 57, 60], [55, 59, 62], [57, 60, 64], [48, 52, 55]]  # F G Am C
ROOT = [41, 43, 45, 36]
ci = lambda b: int(b // 4) % 4
_cache = {}
def stab(c):  # bright supersaw chord stab
    if ('s', c) not in _cache:
        n = int(.28 * SR); t = np.arange(n) / SR; l = np.zeros(n); r = np.zeros(n)
        for m in PROG[c] + [PROG[c][0] + 12]:
            for d in (-.007, -.003, 0, .003, .007):
                v = saw(mtof(m + 12), n, 14, d); l += v * (1 - d * 40); r += v * (1 + d * 40)
        env = np.minimum(1, t / .004) * np.exp(-t * 11)
        _cache[('s', c)] = (l * env * .02, r * env * .02)
    return _cache[('s', c)]
def bass(m, dur=B * .5):
    if ('b', m) not in _cache:
        n = int(dur * SR); t = np.arange(n) / SR
        s = saw(mtof(m), n, 7) + .7 * np.sin(2 * np.pi * mtof(m - 12) * t)
        _cache[('b', m)] = s * np.minimum(1, t / .004) * np.exp(-t * 6) * .3
    return _cache[('b', m)]
def pluck(m, dur=.45):
    if ('p', m) not in _cache:
        n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
        s = np.sin(2*np.pi*f*t) + .6*np.sin(4*np.pi*f*t)*np.exp(-t*14) + .3*np.sin(6*np.pi*f*t)*np.exp(-t*24)
        _cache[('p', m)] = s * np.minimum(1, t / .002) * np.exp(-t * 10) * .13
    return _cache[('p', m)]
def pad(notes, dur, atk=.8, rel=1.0, harm=6, k=.05):
    n = int(dur * SR); t = np.arange(n) / SR; l = np.zeros(n); r = np.zeros(n)
    for m in notes: l += saw(mtof(m), n, harm, -.004); r += saw(mtof(m), n, harm, .004)
    env = np.minimum(1, t / atk) * np.clip((dur - t) / rel, 0, 1)
    return l * env * k, r * env * k
def padput(notes, b0, beats, **kw):
    l, r = pad(notes, beats * B + .3, **kw); put(L, at(b0), l); put(R, at(b0), r); put(VERB[0], at(b0), l * .5); put(VERB[1], at(b0), r * .5)

def kick_at(b, g=.9):
    stereo(kick(gain=g), at(b))
    s = at(b); n = int(B * SR); tt = np.arange(n) / SR; e = min(N, s + n)
    SC[s:e] = np.minimum(SC[s:e], (1 - .65 * np.exp(-tt * 9))[:e - s])

# ---------- intro 0-12: tick-tock, dark pad, sub drone ----------
for b in range(0, 6):   # the clock stops when the text pauses at 3 s
    stereo(tick(2600 if b % 2 == 0 else 1900), at(b), .55, pan=.3 if b % 2 else -.3, verb=.4)
for k, c in enumerate((0, 1, 2)):
    padput([n + 12 for n in PROG[c]] + [ROOT[c]], k * 4, 4, atk=1.4, harm=3, k=.06)
t = np.arange(int(6 * SR)) / SR; stereo(np.sin(2 * np.pi * 55 * t) * np.minimum(1, t / 2) * .12, 0)
stereo(riser(2.0, 900), at(7), .55, verb=.3)
t = np.arange(int(.5 * SR)) / SR; stereo(np.sin(2 * np.pi * (330 - 160 * t / .5) * t) * np.exp(-t * 5) * .18, at(9.3), verb=.6)  # "huh?" blip with the speech bubble
# ---------- 12-14: whoosh, roll, riser; 14: CLACK then silence ----------
stereo(whoosh(.9, 1.3), at(12) - int(.25 * SR), .9, verb=.3)
stereo(impact(1.2, .5), at(12), .6, verb=.3)
for b in np.concatenate([np.arange(12, 13, .25), np.arange(13, 14, .125)]):
    stereo(clap(.2), at(b), .25 + .4 * (b - 12) / 2, verb=.3)
stereo(riser(1.0, 1600), at(12), .7)
stereo(clack(), at(14), 1.1, verb=.7)
# ---------- 16-56: main groove ----------
def groove(b0, b1, arp_from=24, stabs=True):
    for b in range(b0, b1):
        kick_at(b)
        if b % 2 == 1: stereo(clap(), at(b), .85, verb=.3)
        stereo(hat(.11, .7), at(b + .5), .55, pan=.2)  # open hat on the off-beat
        for k in (.25, .75): stereo(hat(), at(b + k), .45, pan=-.25)
        c = ci(b)
        for e in (0, .5): stereo(bass(ROOT[c] + (12 if e else 0)), at(b + e), .95, duck=True)
        if stabs:
            l, r = stab(c); s = at(b + .5); put(L, s, l * SC[s:s + len(l)] if s + len(l) <= N else l); put(R, s, r * SC[s:s + len(r)] if s + len(r) <= N else r)
            put(VERB[0], s, l * .4); put(VERB[1], s, r * .4)
        if b >= arp_from:
            notes = PROG[c] + [PROG[c][0] + 12]
            for k in range(4):
                stereo(pluck(notes[(b * 4 + k) % 4] + 24), at(b + k * .25), .8, pan=(-.45 if k % 2 else .45), verb=.45)
stereo(impact(2.6), at(16), 1.0, verb=.35); stereo(crash(), at(16), 1.2, verb=.4)
groove(16, 56)
for bar in range(4, 14):
    padput([n + 12 for n in PROG[bar % 4]], bar * 4, 4, atk=.2, rel=.3, harm=5, k=.035)
for b in (24, 32, 40, 48):
    stereo(whoosh(.5), at(b) - int(.45 * SR), .6, verb=.2); stereo(crash(1.1), at(b), .9, verb=.3)
# ---------- 56-64: build ----------
for b in range(56, 62):
    kick_at(b, .8); stereo(hat(), at(b + .5), .5)
    if b % 2: stereo(clap(), at(b), .7, verb=.3)
    stereo(bass(ROOT[ci(b)]), at(b), .8, duck=True)
for i, b in enumerate(np.concatenate([np.arange(60, 62, .5), np.arange(62, 63, .25), np.arange(63, 63.75, .125)])):
    stereo(clap(.2), at(b), .3 + .5 * (b - 60) / 4, verb=.3)
stereo(riser(4 * B * 2, 1800), at(60), .85, verb=.3)
stereo(whoosh(.7, 1.1), at(64) - int(.6 * SR), .7)
# ---------- 63.44: glass cracks as Clawd hits the lens; 64: it shatters ----------
def glass(dur, n_tinks, seed):
    r = np.random.default_rng(seed); n = int(dur * SR); t = np.arange(n) / SR; x = r.standard_normal(n); x = x - onepole(x, .7)
    s = x * np.exp(-t * 30) * .9
    for _ in range(n_tinks):
        d = r.uniform(0, dur * .7); f = r.uniform(2500, 7000); s += np.where(t >= d, np.sin(2 * np.pi * f * (t - d)) * np.exp(-(t - d) * r.uniform(25, 60)), 0) * r.uniform(.08, .2)
    return s
stereo(glass(.5, 6, 3), at(63.44), .9, verb=.4)
stereo(glass(1.4, 40, 4), at(64), 1.0, verb=.5)
# ---------- 64-72: drop 2 ----------
stereo(impact(3.0, 1.1), at(64), 1.0, verb=.4); stereo(crash(2.0), at(64), 1.3, verb=.5)
l, r = pad([60, 64, 67, 72, 76, 48], 4 * B, atk=.01, rel=1.8, harm=14, k=.07)
put(L, at(64), l); put(R, at(64), r); put(VERB[0], at(64), l * .6); put(VERB[1], at(64), r * .6)
groove(66, 72, arp_from=66)
# ---------- 72: final hit + ring out ----------
stereo(impact(4.0, .9), at(72), .9, verb=.5); stereo(clack(), at(72), .9, verb=.8); stereo(crash(3.0), at(72), 1.1, verb=.6)
l, r = pad([48, 60, 64, 67, 72], 9 * B * 2, atk=.02, rel=6, harm=10, k=.06)
put(L, at(72), l); put(R, at(72), r); put(VERB[0], at(72), l * .8); put(VERB[1], at(72), r * .8)
for b in np.arange(72, 80, .5):
    stereo(pluck([72, 76, 79, 84][int(b * 2) % 4], .8), at(b), .45 * (1 - (b - 72) / 9), pan=(.4 if int(b * 2) % 2 else -.4), verb=.7)

# ---------- reverb + master ----------
irn = int(2.4 * SR); ti = np.arange(irn) / SR
for ch, out in ((0, L), (1, R)):
    ir = onepole(rng.standard_normal(irn) * np.exp(-ti * 3.0), .3); ir /= np.sqrt((ir ** 2).sum())
    m = 1 << int(np.ceil(np.log2(N + irn)))
    out += np.fft.irfft(np.fft.rfft(VERB[ch], m) * np.fft.rfft(ir, m), m)[:N] * .5
mix = np.stack([L, R], 1)
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.5) * .9
f = np.ones(N); fn = int(2.0 * SR); f[-fn:] = np.linspace(1, 0, fn) ** 2
sf.write("music.wav", (mix * f[:, None]).astype(np.float32), SR)
print("music.wav", DUR, "s")
