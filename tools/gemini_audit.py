#!/usr/bin/env python3
"""gemini_audit.py — semantic frame audit with Gemini (stronger vision than Llama).

Same job as cf_vlm_audit.py, one generation better at reading faint detail and
burned-in type. Runs on the free tier with a Flash model.

    export GEMINI_API_KEY=AIza...
    python tools/gemini_audit.py docs/film_720.mp4 --narr src/narration.json --fps 3

    # two-model agreement: only flag a frame when BOTH audits score it 0
    python tools/gemini_audit.py ... --compare qa/semantic_v9.json

Free tier (Oct 2026): Flash / Flash-Lite text+vision are free; image models
(Nano Banana), Veo and Lyria are paid-only and will return 429 with limit 0.
"""
from __future__ import annotations
import argparse, base64, json, os, re, subprocess, sys, tempfile, time
import urllib.error, urllib.request

ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
MODELS = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.5-flash-lite"]
MIN_INTERVAL = 0.4

PROMPT = """Narration at t={t:.2f}s: "{line}"

Look at the image, then reply on ONE line in exactly this shape:

SCORE=<2 or 1 or 0> ; SEE=<what you see, max 8 words> ; BAD=<problems, or none>

SCORE 2 = the image clearly supports the narration.
SCORE 1 = only partly or generically related.
SCORE 0 = wrong image for this line, or unreadable.
Nothing before SCORE=. Nothing after BAD=. One line only."""


def frames(path, fps, width=640):
    tmp = tempfile.mkdtemp(prefix="gem_")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path,
                    "-vf", f"fps={fps},scale={width}:-2", "-q:v", "4",
                    os.path.join(tmp, "f_%06d.jpg")], check=True)
    for i, n in enumerate(sorted(os.listdir(tmp))):
        with open(os.path.join(tmp, n), "rb") as fh:
            yield i / float(fps), fh.read()


def narration_lines(p):
    if not p or not os.path.exists(p):
        return []
    out, n = [], json.load(open(p))
    for _k, v in (n.items() if isinstance(n, dict) else enumerate(n)):
        if not isinstance(v, dict) or not v.get("words"):
            continue
        w = v["words"]
        out.append((v.get("start", w[0]["f"]) / 30.0,
                    (w[-1]["f"] + w[-1].get("d", 0)) / 30.0,
                    " ".join(x["w"] for x in w)))
    return sorted(out)


def line_at(lines, t, pad=0.6):
    for s, e, txt in lines:
        if s - pad <= t <= e + pad:
            return txt
    return min(lines, key=lambda l: abs((l[0] + l[1]) / 2 - t))[2] if lines else "(no narration)"


def ask(key, model, prompt, jpg, retries=3):
    body = json.dumps({"contents": [{"parts": [
        {"text": prompt},
        {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(jpg).decode()}},
    ]}], "generationConfig": {"temperature": 0.1, "maxOutputTokens": 200}}).encode()
    url = ENDPOINT.format(model=model, key=key)
    for attempt in range(retries):
        r = urllib.request.Request(url, data=body, method="POST",
                                   headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(r, timeout=90) as resp:
                d = json.loads(resp.read().decode())
                cands = d.get("candidates") or []
                if not cands:
                    return ""
                parts = cands[0].get("content", {}).get("parts", [])
                return "".join(p.get("text", "") for p in parts)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:200]
            if e.code in (429, 500, 503) and attempt < retries - 1:
                time.sleep(2 ** attempt + 1)
                continue
            raise RuntimeError(f"HTTP {e.code}: {msg}")


def parse(text):
    m = re.search(r"SCORE\s*[=:]\s*([0-2])", text or "", re.I)
    if not m:
        return None
    see = re.search(r"SEE\s*[=:]\s*([^;\n]*)", text, re.I)
    bad = re.search(r"BAD\s*[=:]\s*([^;\n]*)", text, re.I)
    issues = []
    if bad and bad.group(1).strip().lower() not in ("", "none", "no", "-"):
        issues = [bad.group(1).strip()[:90]]
    return {"match": int(m.group(1)), "subject": (see.group(1).strip() if see else "")[:80],
            "issues": issues}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--narr", default="src/narration.json")
    ap.add_argument("--fps", type=float, default=3.0)
    ap.add_argument("--out", default="qa/semantic_gemini.json")
    ap.add_argument("--model", default="")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--compare", default="", help="a previous audit json to intersect with")
    a = ap.parse_args()

    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        sys.exit("GEMINI_API_KEY not set")

    models = [a.model] if a.model else list(MODELS)
    probe = next(frames(a.video, max(0.5, a.fps / 8)), None)
    if probe is None:
        sys.exit("no frames extracted")
    _t, pjpg = probe
    chosen = None
    for m in models:
        try:
            ask(key, m, "Reply with one word: ok", pjpg)
            chosen = m
            break
        except RuntimeError as e:
            print(f"skip {m}: {e}")
    if not chosen:
        sys.exit("no usable Gemini model (image/video models are paid-only on the free tier)")

    lines = narration_lines(a.narr)
    rows, n, last = [], 0, 0.0
    for t, jpg in frames(a.video, a.fps):
        if a.limit and n >= a.limit:
            break
        wait = MIN_INTERVAL - (time.time() - last)
        if wait > 0:
            time.sleep(wait)
        last = time.time()
        line = line_at(lines, t)
        v = parse(ask(key, chosen, PROMPT.format(t=t, line=line), jpg))
        v = v or {"match": None, "subject": "", "issues": ["unparsed"]}
        v.update({"t": round(t, 2), "line": line})
        rows.append(v)
        n += 1
        if v.get("match") != 2:
            print(f"{t:6.2f}s match={v['match']} {v.get('subject','')[:52]}")

    scored = [r for r in rows if r.get("match") is not None]
    bad = [r for r in scored if r["match"] == 0]
    summary = {"model": chosen, "frames": len(rows), "scored": len(scored),
               "mean": round(sum(r["match"] for r in scored) / len(scored), 2) if scored else None,
               "mismatches": len(bad)}

    if a.compare and os.path.exists(a.compare):
        prev = {round(f["t"], 2): f.get("match") for f in json.load(open(a.compare))["frames"]}
        agree = [r for r in bad if prev.get(r["t"]) == 0]
        summary["two_model_agreement"] = [{"t": r["t"], "line": r["line"],
                                           "subject": r.get("subject", "")} for r in agree]
        print(f"\nflagged by both models: {len(agree)}")

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    json.dump({**summary, "frames": rows}, open(a.out, "w"), indent=1)
    print(json.dumps({k: v for k, v in summary.items() if k != "two_model_agreement"}, indent=1))
    print("report ->", a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
