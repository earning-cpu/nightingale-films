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
API = "https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/{model}"

SYSTEM = (
    "You are a film editor reviewing frames of a short documentary. "
    "You will see ONE frame and the narration line being spoken over it. "
    "Decide whether the picture supports that line. Be strict but fair: "
    "a mood shot can support a line; a mismatched subject cannot."
)

PROMPT = """Narration at this moment (t={t:.2f}s): "{line}"

Answer with ONLY a JSON object, no prose:
{{"match": 2|1|0, "subject": "<what you actually see, 8 words max>", "issues": ["<short issue>", ...]}}

match = 2 the image clearly supports the line
match = 1 partly / generically related
match = 0 wrong image for this line, or unreadable (blur, black, garbled text)"""


def sh(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.stdout


def frames(path, fps, width=640):
    """Yield (timestamp_seconds, jpeg_bytes) via one ffmpeg pass."""
    tmp = tempfile.mkdtemp(prefix="cfvlm_")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path,
                    "-vf", f"fps={fps},scale={width}:-2", "-q:v", "5",
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
            if "5035" in msg or "5007" in msg or "paid plan" in low or "upgrade" in low:
                raise ModelUnavailable(f"needs Workers Paid: {msg}")
            if e.code in (400, 404):
                raise ModelUnavailable(f"model rejected input: {msg}")
            raise SystemExit(f"HTTP {e.code}: {msg}")


def parse_json(text):
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
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
            call_ai(token, acct, m, {
                "messages": [{"role": "user", "content": "Reply with one word: ok"}],
                "image": "data:image/jpeg;base64," + base64.b64encode(pjpg).decode(),
                "max_tokens": 8, "temperature": 0})
            chosen = m
            print(f"using {m}")
            break
        except ModelUnavailable as e:
            print(f"skip {m}: {e}")
    if not chosen:
        sys.exit("no vision model available on this account - see messages above")

    rows, bad, n = [], [], 0
    for t, jpg in frames(a.video, a.fps):
        if a.limit and n >= a.limit:
            break
        line = line_at(lines, t)
        data_uri = "data:image/jpeg;base64," + base64.b64encode(jpg).decode()
        payload = {
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": PROMPT.format(t=t, line=line)},
            ],
            "image": data_uri,
            "max_tokens": 160,
            "temperature": 0.1,
        }
        res = call_ai(token, acct, chosen, payload)
        text = ""
        r = res.get("result", {})
        if isinstance(r, dict):
            text = r.get("response") or r.get("description") or json.dumps(r)[:400]
        else:
            text = str(r)
        verdict = parse_json(text) or {"match": None, "subject": "", "issues": ["unparsed"]}
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
