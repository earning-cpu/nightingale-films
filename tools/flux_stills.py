#!/usr/bin/env python3
"""flux_stills.py — free, commercial-clean stills via Cloudflare FLUX.1-schnell.

Why this exists: Google AI Studio's *web UI* gives you free images, but the
*API* returns `429 limit: 0` for every image model on the free tier — they are
separate entitlements. Cloudflare's FLUX endpoint has no such gap: measured
2.5 s per 1280x720 image on the same free account already used for the audits.

    export CLOUDFLARE_API_TOKEN=...  CLOUDFLARE_ACCOUNT_ID=...

    # one image
    python tools/flux_stills.py --prompt "desert airbase at night" --style archive

    # a batch, one prompt per line, numbered output
    python tools/flux_stills.py --file prompts.txt --style archive --outdir assets/generated

    # reproduce a look exactly
    python tools/flux_stills.py --prompt "..." --seed 1979

Styles append a period-correct tail so the model doesn't drift into a modern
digital look. Everything it produces still has to pass P11 (no AI tells) —
inspect hands, text, faces at 100 % before anything reaches the timeline.
"""
from __future__ import annotations
import argparse, base64, json, os, sys, time
import urllib.error, urllib.request

MODEL = "@cf/black-forest-labs/flux-1-schnell"
API = "https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/{model}"

STYLES = {
    "archive": ("grainy 1979 documentary photograph, harsh direct flash, deep shadows, "
                "high contrast black and white, visible film grain, slight motion blur, "
                "shot on 35mm film, imperfect framing, no text"),
    "evidence": ("classified evidence photograph, flat overhead lighting, faded colour, "
                 "yellowed paper, dust and scratches, 1970s government archive, slight vignette, "
                 "no text, no watermark"),
    "atmosphere": ("night exterior, volumetric fog, dust motes in a light beam, "
                   "cinematic anamorphic flare, muted desaturated palette, 35mm grain, no text"),
    "plate": ("dark textured background for film titles, deep shadow, subtle grain, "
              "large empty negative space in the centre, no text"),
    "recon": ("high altitude reconnaissance frame, aerial perspective, haze, "
              "desaturated cyan and amber, heavy grain, no text"),
}


def gen(token, acct, prompt, width, height, steps, seed):
    # flux-1-schnell on Workers AI accepts ONLY prompt + steps (verified live:
    # extra keys like width/height/seed return 400 "Additional or unevaluated
    # properties"). Size is fixed by the model; we rescale locally afterwards.
    body = json.dumps({"prompt": prompt, "steps": steps}).encode()
    req = urllib.request.Request(API.format(acct=acct, model=MODEL), data=body,
                                 method="POST",
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.loads(r.read().decode())
    if not d.get("success"):
        raise RuntimeError(str(d.get("errors"))[:300])
    raw = base64.b64decode(d["result"]["image"])
    if width and height:
        try:
            from PIL import Image
            import io
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            if im.size != (width, height):
                im = im.resize((width, height), Image.LANCZOS)
                buf = io.BytesIO(); im.save(buf, "PNG"); return buf.getvalue()
        except Exception:
            pass
    return raw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", default="")
    ap.add_argument("--file", default="", help="one prompt per line")
    ap.add_argument("--style", default="archive", choices=list(STYLES) + ["none"])
    ap.add_argument("--outdir", default="assets/generated")
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=720)
    ap.add_argument("--steps", type=int, default=6, help="schnell: 4-8 is the sweet spot")
    ap.add_argument("--seed", type=int, default=0, help="0 = different each run")
    ap.add_argument("--prefix", default="gen")
    a = ap.parse_args()

    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    acct = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    if not token or not acct:
        sys.exit("set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID")

    prompts = []
    if a.file:
        prompts += [l.strip() for l in open(a.file) if l.strip() and not l.startswith("#")]
    if a.prompt:
        prompts.append(a.prompt)
    if not prompts:
        sys.exit("give --prompt or --file")

    os.makedirs(a.outdir, exist_ok=True)
    tail = "" if a.style == "none" else ", " + STYLES[a.style]
    made = []
    for i, p in enumerate(prompts):
        full = p + tail
        seed = a.seed or 0
        t0 = time.time()
        try:
            raw = gen(token, acct, full, a.width, a.height, a.steps, seed)
        except urllib.error.HTTPError as e:
            print(f"  [{i+1}] HTTP {e.code}: {e.read().decode()[:140]}")
            continue
        name = f"{a.prefix}_{i+1:02d}.png"
        path = os.path.join(a.outdir, name)
        open(path, "wb").write(raw)
        made.append(path)
        print(f"  [{i+1}/{len(prompts)}] {name}  {len(raw)//1024} KB  {time.time()-t0:.1f}s  | {p[:56]}")

    if made:
        print(f"\n{len(made)} image(s) -> {a.outdir}")
        print("next: inspect at 100% for AI tells (P11), then add to public/img + manifest.json")


if __name__ == "__main__":
    sys.exit(main())
