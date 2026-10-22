#!/usr/bin/env python3
"""vision_map.py — look at every plate and record what is in it, where, and at
what angle. Used to aim the camera and place graphics with intent instead of
centring everything.

    export CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=...
    python tools/vision_map.py public/wow/img/*.png --json src/wow/vision.json

Output per plate:
  subject    what the frame is actually of
  thirds     which third the subject sits in (left/centre/right, top/middle/bottom)
  angle      eye level / low / high / macro
  light      where the light comes from
  depth      what is near vs far (drives the layer split)
  motion     the motivated camera move this frame wants
"""
from __future__ import annotations
import argparse, base64, json, os, sys, urllib.request

MODEL = "@cf/meta/llama-3.2-11b-vision-instruct"
API = "https://api.cloudflare.com/client/v4/accounts/{a}/ai/run/{m}"

PROMPT = """You are a cinematographer cataloguing a still frame.

Answer in JSON only, no prose, with exactly these keys:
{"subject":"what the frame is of, 6 words max",
 "thirds":"left|centre|right + top|middle|bottom, e.g. 'right-middle'",
 "angle":"eye-level|low|high|macro|aerial",
 "light":"left|right|top|behind|flat|practical",
 "depth":"what is NEAR and what is FAR, 8 words max",
 "empty":"which side of the frame is empty sky/shadow: left|right|top|bottom|none",
 "move":"push-in|pull-out|drift-left|drift-right|tilt-up|tilt-down|static"}

JSON:"""


def call(token, acct, b64):
    body = json.dumps({"prompt": PROMPT, "image": [b64], "max_tokens": 220}).encode()
    req = urllib.request.Request(
        API.format(a=acct, m=MODEL), data=body, method="POST",
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.loads(r.read().decode())
    if not d.get("success"):
        raise RuntimeError(str(d.get("errors"))[:200])
    return d["result"].get("response", "")


def parse(text):
    i, j = text.find("{"), text.rfind("}")
    if i < 0 or j < 0:
        return {"raw": text[:200]}
    try:
        return json.loads(text[i:j + 1])
    except Exception:                                        # noqa: BLE001
        return {"raw": text[:200]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--json", default="src/wow/vision.json")
    a = ap.parse_args()
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    acct = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    if not token or not acct:
        sys.exit("set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID")

    out = {}
    for f in a.files:
        try:
            b64 = base64.b64encode(open(f, "rb").read()).decode()
            rec = parse(call(token, acct, b64))
        except Exception as e:                               # noqa: BLE001
            rec = {"error": repr(e)[:160]}
        out[os.path.basename(f)] = rec
        print("%-12s %s" % (os.path.basename(f), json.dumps(rec)[:150]))
    os.makedirs(os.path.dirname(a.json), exist_ok=True)
    json.dump(out, open(a.json, "w"), indent=1)
    print("->", a.json, len(out))


if __name__ == "__main__":
    main()
