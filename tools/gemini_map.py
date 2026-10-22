#!/usr/bin/env python3
"""gemini_map.py — one accurate description per plate, from Gemini Flash vision.

    python tools/gemini_map.py public/wow/img/*.png --json src/wow/vision.json
"""
from __future__ import annotations
import argparse, base64, json, os, sys, time, urllib.request

ENDPOINT = ("https://generativelanguage.googleapis.com/v1beta/models/"
            "{model}:generateContent?key={key}")
MODEL = "gemini-3.5-flash"
MIN_INTERVAL = 6.5

PROMPT = """Describe this photograph as a cinematographer. Reply with ONE line only,
eight fields separated by " | ", no other text:

subject | thirds | angle | light | near-far | empty | move | why

subject   = what it is, max 6 words
thirds    = left/centre/right + top/middle/bottom, e.g. right-middle
angle     = eye-level/low/high/macro/aerial
light     = left/right/top/behind/flat/practical
near-far  = what is NEAR, slash, what is FAR
empty     = left/right/top/bottom/none  (where the frame is empty)
move      = push-in/pull-out/drift-left/drift-right/tilt-up/tilt-down/static
why       = what a viewer learns from this frame, max 10 words"""


def one(key, b64):
    body = json.dumps({"contents": [{"parts": [
        {"text": PROMPT},
        {"inline_data": {"mime_type": "image/png", "data": b64}}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 900}}).encode()
    req = urllib.request.Request(ENDPOINT.format(model=MODEL, key=key), data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.loads(r.read().decode())
    txt = "".join(p.get("text", "") for p in d["candidates"][0]["content"]["parts"]).strip()
    line = next((l for l in txt.splitlines() if l.count("|") >= 7), "")
    parts = [x.strip(" .*") for x in line.split("|")]
    keys = ["subject", "thirds", "angle", "light", "depth", "empty", "move", "why"]
    if len(parts) >= 8:
        return dict(zip(keys, parts[:8]))
    return {"raw": txt[:200]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--json", default="src/wow/vision.json")
    a = ap.parse_args()
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        sys.exit("set GEMINI_API_KEY")
    out = json.load(open(a.json)) if os.path.exists(a.json) else {}
    for f in a.files:
        name = os.path.basename(f)
        if name in out and out[name].get("subject"):
            print("%-12s cached" % name); continue
        try:
            out[name] = one(key, base64.b64encode(open(f, "rb").read()).decode())
            print("%-12s %s" % (name, json.dumps(out[name])[:132]))
        except Exception as e:                                # noqa: BLE001
            print("%-12s FAIL %r" % (name, e)); out.setdefault(name, {})
        time.sleep(MIN_INTERVAL)
    os.makedirs(os.path.dirname(a.json) or ".", exist_ok=True)
    json.dump(out, open(a.json, "w"), indent=1)
    print("->", a.json, len(out))


if __name__ == "__main__":
    main()
