import json, os
VO = json.load(open("vo.json")) if os.path.exists("vo.json") else {}
bt = json.load(open("beats.json")); B, per = bt["beats"], bt["period"]
at = lambda i: B[i] if i < len(B) else B[-1] + (i-len(B)+1)*per
shots, i, scenes = json.load(open("script.json", encoding="utf-8")), 0, []
for sc in shots:
    a, b, k = at(i), at(i + sc.get("beats", 4)), len(sc["lines"])
    vs = VO.get(sc["id"])   # voiceover onsets win: text appears exactly when it is spoken
    st = vs if vs and len(vs) == k else [a+(b-a)*j/k for j in range(k)]
    lines = [{"text": cap or say, "start": round(st[j], 3), "end": round(st[j+1] if j+1 < k else b, 3)}
             for j, (say, cap) in enumerate(sc["lines"])]
    scenes.append({"id": sc["id"], "chapter": sc.get("chapter",""), "start": round(a,3), "end": round(b,3), "lines": lines})
    i += sc.get("beats", 4)
dur = round(scenes[-1]["end"] + 1.0, 3)
scenes[-1]["end"] = dur
json.dump({"duration": dur, "scenes": scenes, "beats": B, "bpm": bt["bpm"]}, open("timeline.json","w", encoding="utf-8"), indent=1, ensure_ascii=False)
open("timeline.js","w", encoding="utf-8").write("window.TIMELINE=" + json.dumps({"duration": dur, "scenes": scenes, "beats": B, "bpm": bt["bpm"]}, ensure_ascii=False) + ";")
print("total", dur)
