import json, sys
bpm, dur = float(sys.argv[1]), float(sys.argv[2]); period = 60/bpm
beats = [round(i*period, 3) for i in range(int(dur/period)+1)]
json.dump({"bpm": bpm, "period": period, "beats": beats, "duration": dur}, open("beats.json","w"), indent=1)
print("bpm", bpm, "beats", len(beats))
