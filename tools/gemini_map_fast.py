#!/usr/bin/env python3
"""gemini_map_fast.py — same as gemini_map.py but 6 workers with retry."""
import base64, glob, json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

KEY = os.environ["GEMINI_API_KEY"]
E = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + KEY
PROMPT = open("tools/_map_prompt.txt").read()
OUT = "src/wow/vision.json"


def one(f):
    b64 = base64.b64encode(open(f, "rb").read()).decode()
    body = json.dumps({"contents": [{"parts": [{"text": PROMPT},
                        {"inline_data": {"mime_type": "image/png", "data": b64}}]}],
                       "generationConfig": {"temperature": 0.1, "maxOutputTokens": 500}}).encode()
    for attempt in range(4):
        try:
            req = urllib.request.Request(E, data=body, headers={"Content-Type": "application/json"})
            d = json.loads(urllib.request.urlopen(req, timeout=120).read())
            txt = "".join(p.get("text", "") for p in d["candidates"][0]["content"]["parts"]).strip()
            line = next((l for l in txt.splitlines() if l.count("|") >= 6), "")
            parts = [x.strip(" .*\"'") for x in line.split("|")]
            keys = ["subject", "thirds", "angle", "light", "depth", "empty", "move", "why"]
            rec = dict(zip(keys, parts)) if len(parts) >= 7 else {"raw": txt[:160]}
            return os.path.basename(f), rec
        except Exception as e:                                  # noqa: BLE001
            if attempt == 3:
                return os.path.basename(f), {"error": repr(e)[:100]}
            time.sleep(4 * (attempt + 1))


files = sorted(glob.glob("public/wow/img/*.png"))
done = json.load(open(OUT)) if os.path.exists(OUT) else {}
todo = [f for f in files if not done.get(os.path.basename(f), {}).get("subject")]
print("todo", len(todo), "of", len(files))
with ThreadPoolExecutor(max_workers=6) as ex:
    for name, rec in ex.map(one, todo):
        done[name] = rec
        print("%-12s %s" % (name, str(rec.get("subject") or rec)[:70]), flush=True)
        json.dump(done, open(OUT, "w"), indent=1)
print("VISION_DONE", len(done))
