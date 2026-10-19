#!/usr/bin/env python3
"""TIMELINE GUARD — blocks a render that would interrupt an in-flight animation.
Parses every <InsertShot from={T.x.from + N} dur={D}> in the film and fails if the
cut lands inside any measured animation window (qa_windows.json).
Run in CI before rendering so a broken cut can never reach a release.
"""
import json, re, sys
T = dict(title=0, s1=140, s2=320, s3=485, s4=695, s5=875, s6=1055, s7=1250,
         s8=1430, s9=1595, s10=1775, end=1985, total=2090)
MARGIN = 6

src = open('src/Nightingale.tsx').read()
inserts = []
for m in re.finditer(r'<InsertShot\s+src="([^"]+)"\s+from=\{T\.(\w+)\.from \+ (\d+)\}\s+dur=\{(\d+)\}', src):
    src_img, scene, off, dur = m.group(1), m.group(2), int(m.group(3)), int(m.group(4))
    start = T[scene] + off
    inserts.append({"file": src_img, "start": start, "end": start + dur})

windows = json.load(open('qa_windows.json'))
fails = []
for ins in inserts:
    for w in windows:
        # an insert may fully CONTAIN an animation (viewer never sees it start),
        # but it may never CUT while an animation is mid-flight on screen.
        for cut, label in ((ins["start"], "IN"), (ins["end"], "OUT")):
            if w["start"] - MARGIN <= cut <= w["end"] + MARGIN:
                if w["start"] >= ins["start"] and w["end"] <= ins["end"]:
                    continue  # fully hidden inside the insert — fine
                fails.append(f'{ins["file"]}: {label}-cut @ {cut} lands inside "{w["name"]}" [{w["start"]}-{w["end"]}]')

print(f"timeline guard: {len(inserts)} inserts checked against {len(windows)} animation windows")
for i in inserts:
    print(f'  {i["file"]:28s} {i["start"]:5d} → {i["end"]:5d}  ({i["end"]-i["start"]}f, {(i["end"]-i["start"])/30:.2f}s)')
if fails:
    print("\n❌ BLOCKED — cuts would interrupt on-screen animation:")
    for f in fails: print("   " + f)
    sys.exit(1)
print("\n✅ PASS — every insert sits in a clean gap")
