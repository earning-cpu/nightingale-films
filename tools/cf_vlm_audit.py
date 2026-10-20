#!/usr/bin/env python3
"""cf_vlm_audit.py — semantic frame audit via Cloudflare Workers AI (Llama 3.2 Vision).

The one thing no metric can catch: a frame that is technically perfect but
*wrong for the line being spoken*. This script pairs every sampled frame with
the narration active at that instant and asks a vision model whether they match.

    export CLOUDFLARE_API_TOKEN=...      # Workers AI: Edit
    export CLOUDFLARE_ACCOUNT_ID=...

    python3 tools/cf_vlm_audit.py FILM.mp4 --narr src/narration.json \
        --fps 4 --out qa/semantic.json

    # quick smoke test (3 frames, prints raw model output)
    python3 tools/cf_vlm_audit.py FILM.mp4 --limit 3 --verbose

Needs ffmpeg on PATH. No other dependencies (urllib only).
Free tier: 10,000 neurons/day. ~280 frames ≈ 2.5k neurons, so one full pass/day is safe.
"""
from __future__ import annotations
import argparse, base64, json, os, re, subprocess, sys, tempfile, time
import urllib.error, urllib.request

# Vision models, best first. The first needs a one-time licence acceptance,
# which is an API call, not a dashboard button (see agree()).
VISION_MODELS = [
    "@cf/meta/llama-3.2-11b-vision-instruct",
    "@cf/google/gemma-3-12b-it",
    "@cf/llava-hf/llava-1.5-7b-hf",
]
MODEL = VISION_MODELS[0]
MIN_INTERVAL = 0.5          # seconds between frames (720 req/min cap -> stay well under)
API = "https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/{model}"

SYSTEM = (
    "You are a film editor reviewing frames of a short documentary. "
    "You will see ONE frame and the narration line being spoken over it. "
    "Decide whether the picture supports that line. Be strict but fair: "
    "a mood shot can support a line; a mismatched subject cannot."
)

PROMPT = """Narration at t={t:.2f}s: "{line}"

Look at the image, then reply on ONE line in exactly this shape:

SCORE=<2 or 1 or 0> ; SEE=<what you see, max 8 words> ; BAD=<problems, or none>

SCORE 2 = the image clearly supports the narration.
SCORE 1 = only partly or generically related.
SCORE 0 = wrong image for this line, or unreadable.
Nothing before SCORE=. Nothing after BAD=. One line only."""



def sh(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.stdout


def frames(path, fps, width=512):
    """Yield (timestamp_seconds, jpeg_bytes) via one ffmpeg pass."""
    tmp = tempfile.mkdtemp(prefix="cfvlm_")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path,
                    "-vf", f"fps={fps},scale={width}:-2", "-q:v", "6",
                    os.path.join(tmp, "f_%06d.jpg")], check=True)
    names = sorted(os.listdir(tmp))
    for i, n in enumerate(names):
        with open(os.path.join(tmp, n), "rb") as fh:
            yield i / float(fps), fh.read()


def narration_lines(narr_path):
    """[(start_s, end_s, text)] from narration.json; tolerant of shapes."""
    if not narr_path or not os.path.exists(narr_path):
        return []
    n = json.load(open(narr_path))
    out = []
    items = n.items() if isinstance(n, dict) else enumerate(n)
    for _k, v in items:
        if not isinstance(v, dict) or "words" not in v:
            continue
        words = v["words"]
        if not words:
            continue
        st = v.get("start", words[0].get("f", 0)) / 30.0
        en = (words[-1]["f"] + words[-1].get("d", 0)) / 30.0
        out.append((st, en, " ".join(w["w"] for w in words)))
    return sorted(out)


def line_at(lines, t, pad=0.6):
    for st, en, txt in lines:
        if st - pad <= t <= en + pad:
            return txt
    # nearest line, so a gap still gets context instead of "None"
    if lines:
        return min(lines, key=lambda l: abs((l[0] + l[1]) / 2 - t))[2]
    return "(no narration)"


class ModelUnavailable(Exception):
    """Model is gated, deprecated, or not permitted on this plan."""


def agree(token, acct, model):
    """Accept the licence. Cloudflare requires one request containing {"prompt":"agree"}.
    The dashboard's licence link only shows the text - there is no Accept button."""
    url = API.format(acct=acct, model=model)
    req = urllib.request.Request(url, data=json.dumps({"prompt": "agree"}).encode(),
                                 method="POST", headers={"Authorization": f"Bearer {token}",
                                                         "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            r.read()
        print(f"  licence accepted for {model}")
        return True
    except urllib.error.HTTPError as e:
        print(f"  agree failed on {model}: HTTP {e.code}")
        return False


def vision_payload(model, prompt, jpg_bytes, system=None):
    """Cloudflare's vision endpoints do not share one payload shape.
    llama-3.2-11b-vision-instruct: {"prompt": str, "image": [int, ...]}   (raw bytes)
    llava / gemma:                {"messages": [...], "image": "data:...;base64,..."}
    Verified against the live API 2026-10-20."""
    if "llama-3.2-11b-vision" in model:
        return {"prompt": prompt, "image": list(jpg_bytes), "max_tokens": 200, "temperature": 0.1}
    return {"messages": ([{"role": "system", "content": system}] if system else []) +
                        [{"role": "user", "content": prompt}],
            "image": "data:image/jpeg;base64," + base64.b64encode(jpg_bytes).decode(),
            "max_tokens": 200, "temperature": 0.1}


def call_ai(token, acct, model, payload, retries=3):
    url = API.format(acct=acct, model=model)
    body = json.dumps(payload).encode()
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, method="POST", headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "nightingale-vlm/1.0",
        })
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:300]
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(2 ** attempt + 1)
                continue
            low = msg.lower()
            if e.code == 403 and ("licen" in low or "agree" in low or "terms" in low):
                if agree(token, acct, model):
                    continue
                raise ModelUnavailable(f"licence not accepted: {msg}")
            if "5018" in msg or "not allowed to access" in low:
                raise ModelUnavailable(f"account not permitted: {msg}")
            if "5035" in msg or "5007" in msg or "paid plan" in low or "upgrade" in low:
                raise ModelUnavailable(f"needs Workers Paid: {msg}")
            if e.code in (400, 404):
                raise ModelUnavailable(f"model rejected input: {msg}")
            raise SystemExit(f"HTTP {e.code}: {msg}")


def parse_verdict(text):
    """Anchor on SCORE= . A small model will echo JSON templates or number its own
    lines; an explicit key=value on one line survives both."""
    if isinstance(text, dict):
        text = text.get("response") or json.dumps(text)
    t = str(text)
    m = re.search(r"SCORE\s*[=:]\s*([0-2])", t, re.I)
    if not m:
        return None
    see = re.search(r"SEE\s*[=:]\s*([^;\n]*)", t, re.I)
    bad = re.search(r"BAD\s*[=:]\s*([^;\n]*)", t, re.I)
    issues = []
    if bad and bad.group(1).strip().lower() not in ("", "none", "no", "-"):
        issues = [bad.group(1).strip()[:90]]
    return {"match": int(m.group(1)),
            "subject": (see.group(1).strip() if see else "")[:80],
            "issues": issues}


def parse_json(text):
    """Take the FIRST complete JSON object - small models like to keep
    emitting extra ones (one per imagined frame) and a greedy match fails."""
    for m in re.finditer(r"\{[^{}]*\}", text, re.S):
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            continue
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--narr", default="src/narration.json")
    ap.add_argument("--fps", type=float, default=4.0)
    ap.add_argument("--out", default="qa/semantic.json")
    ap.add_argument("--limit", type=int, default=0, help="stop after N frames (smoke test)")
    ap.add_argument("--model", default=MODEL)
    ap.add_argument("--verbose", action="store_true")
    a = ap.parse_args()

    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    acct = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    if not token or not acct:
        sys.exit("set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID "
                 "(or put them in .env.local and `export $(grep -v '^#' .env.local | xargs)`).\n"
                 "Dry run only: pass --limit 0 with a video and no key to preview the pairing.")

    lines = narration_lines(a.narr)

    models = [a.model] if a.model != MODEL else list(VISION_MODELS)
    chosen, probe = None, next(frames(a.video, max(0.5, a.fps / 8)), None)
    if probe is None:
        sys.exit("could not extract a frame from " + a.video)
    _pt, pjpg = probe
    for m in models:
        try:
            call_ai(token, acct, m, vision_payload(m, "Reply with one word: ok", pjpg))
            chosen = m
            print(f"using {m}")
            break
        except ModelUnavailable as e:
            print(f"skip {m}: {e}")
    if not chosen:
        sys.exit("no vision model available on this account - see messages above")

    rows, bad, n = [], [], 0
    last_call = 0.0
    for t, jpg in frames(a.video, a.fps):
        if a.limit and n >= a.limit:
            break
        line = line_at(lines, t)
        payload = vision_payload(chosen, PROMPT.format(t=t, line=line), jpg, SYSTEM)
        wait = MIN_INTERVAL - (time.time() - last_call)
        if wait > 0:
            time.sleep(wait)
        last_call = time.time()
        res = call_ai(token, acct, chosen, payload)
        text = ""
        r = res.get("result", {})
        if isinstance(r, dict):
            text = r.get("response") or r.get("description") or json.dumps(r)[:400]
        else:
            text = str(r)
        verdict = parse_verdict(text)
        if verdict is None:                       # one retry, then give up on this frame
            res = call_ai(token, acct, chosen,
                          vision_payload(chosen, f'Narration: "{line}". Reply exactly: SCORE=<0,1,2> ; SEE=<words> ; BAD=<none>', jpg))
            rr = res.get("result", {})
            t2 = rr.get("response") if isinstance(rr, dict) else rr
            verdict = parse_verdict(t2) or {"match": None, "subject": "", "issues": ["unparsed"]}
        verdict.update({"t": round(t, 2), "line": line})
        rows.append(verdict)
        n += 1
        flag = "" if verdict.get("match") == 2 else ("  ⚠" if verdict.get("match") == 1 else "  ✗")
        if a.verbose or verdict.get("match") != 2:
            print(f"{t:6.2f}s  match={verdict.get('match')}{flag}  {verdict.get('subject','')[:60]}")
            if verdict.get("issues"):
                print(f"          issues: {', '.join(str(i) for i in verdict['issues'])[:150]}")
        if verdict.get("match") == 0:
            bad.append(verdict)

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    json.dump({"model": chosen, "frames": rows, "mismatches": bad}, open(a.out, "w"), indent=1)
    scored = [r for r in rows if r.get("match") is not None]
    print("\n" + "=" * 60)
    print(f"{len(rows)} frames · {len(scored)} scored · {len(bad)} mismatches (match=0)")
    if scored:
        avg = sum(r["match"] for r in scored) / len(scored)
        print(f"mean match {avg:.2f} / 2.0")
    print("report ->", a.out)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
