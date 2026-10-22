#!/usr/bin/env python3
"""Convert src/wow/timeline.json into the narration.json shape qa_pro.py expects."""
import json, sys

tl = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "src/wow/timeline.json"))
out = {}
for s in tl["scenes"]:
    ws = s.get("words") or []
    if not ws:
        continue
    # caption groups are 3 words (same as what the film burns in), so the C1
    # reading-speed check measures the real caption lines, not the paragraph
    ends = [ws[i + 3]["f"] if i + 3 < len(ws) else s["from"] + s["dur"]
            for i in range(0, len(ws), 3)]
    for gi, gend in zip(range(0, len(ws), 3), ends):
        grp = ws[gi:gi + 3]
        key = s["id"] if gi == 0 else "%s_%d" % (s["id"], gi // 3)
        out[key] = {
            "start": grp[0]["f"],
            "text": " ".join(w["w"] for w in grp),
            "rate": "+6%",
            "words": [
                {"w": w["w"], "f": w["f"],
                 "d": (ws[i + 1]["f"] - w["f"]) if i + 1 < len(ws) else max(10, gend - w["f"])}
                for i, w in enumerate(grp, start=gi)
            ],
        }
path = sys.argv[2] if len(sys.argv) > 2 else "qa/narr_v2.json"
json.dump(out, open(path, "w"), indent=1)
print("wrote", path, len(out), "segments")
