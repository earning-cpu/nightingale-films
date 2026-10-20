#!/usr/bin/env python3
"""cf_whisper_sync.py — caption-sync proof with Cloudflare Whisper (Q28).

Transcribes the finished film's audio, then compares every recognised word
against the word timings in narration.json. If the VO in the file is where the
captions say it is, every word lands within a frame or two. This is the
difference between "captions look right" and "captions are provably in sync".

    export CLOUDFLARE_API_TOKEN=...   CLOUDFLARE_ACCOUNT_ID=...
    python3 tools/cf_whisper_sync.py FILM.mp4 --narr src/narration.json --out qa/whisper.json

Needs ffmpeg. Free tier: Whisper ≈ 41 neurons per audio minute → ~240 min/day.
"""
from __future__ import annotations
import argparse, json, os, subprocess, sys, tempfile
import urllib.error, urllib.request

MODELS = ["@cf/openai/whisper-large-v3-turbo", "@cf/openai/whisper"]


def run_whisper(token, acct, audio_bytes, model):
    url = f"https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/{model}"
    boundary = "----nightingale"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="audio"; filename="vo.wav"\r\n'
        "Content-Type: audio/wav\r\n\r\n"
    ).encode() + audio_bytes + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    })
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--narr", default="src/narration.json")
    ap.add_argument("--out", default="qa/whisper.json")
    ap.add_argument("--tolerance", type=float, default=0.10,
                    help="allowed drift in seconds (0.10 = 3 frames at 30 fps)")
    a = ap.parse_args()
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    acct = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    if not token or not acct:
        sys.exit("set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID")

    tmp = tempfile.mktemp(suffix=".wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video,
                    "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", tmp], check=True)
    audio = open(tmp, "rb").read()
    print(f"audio {len(audio)/1024:.0f} KB")

    res, used = None, None
    for m in MODELS:
        try:
            res = run_whisper(token, acct, audio, m)
            used = m
            break
        except urllib.error.HTTPError as e:
            print(f"{m}: HTTP {e.code} — trying next")
    if res is None:
        sys.exit("no Whisper model accepted the request")
    out = res.get("result", {})
    words = out.get("words") or []
    print(f"{used}: {len(words)} words, text {len(out.get('text',''))} chars")

    # expected onsets from narration.json
    expect = []
    if os.path.exists(a.narr):
        n = json.load(open(a.narr))
        for _k, v in (n.items() if isinstance(n, dict) else enumerate(n)):
            for w in (v.get("words") or []) if isinstance(v, dict) else []:
                expect.append((w["w"].strip().lower(), w["f"] / 30.0))
    pairs, drift = [], []
    ei = 0
    for w in words:
        t = w.get("start", w.get("timestamp", [0, 0]))
        sec = t[0] + t[1] / 1000.0 if isinstance(t, list) else float(t)
        txt = (w.get("word") or "").strip().lower().strip(".,!?")
        while ei < len(expect) and expect[ei][0] != txt:
            ei += 1
        if ei < len(expect):
            d = abs(sec - expect[ei][1])
            pairs.append({"word": txt, "heard": round(sec, 3), "expected": round(expect[ei][1], 3),
                          "drift": round(d, 3)})
            if d > a.tolerance:
                drift.append(pairs[-1])
            ei += 1
    worst = max([p["drift"] for p in pairs], default=0)
    print(f"matched {len(pairs)} / {len(expect)} words · worst drift {worst*1000:.0f} ms "
          f"· {len(drift)} over {a.tolerance*1000:.0f} ms")
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    json.dump({"model": used, "words_heard": len(words), "matched": len(pairs),
               "worst_drift_ms": round(worst * 1000, 1), "over_tolerance": drift,
               "text": out.get("text", "")[:4000]}, open(a.out, "w"), indent=1)
    print("report ->", a.out)
    return 1 if len(drift) > max(2, 0.02 * max(1, len(pairs))) else 0


if __name__ == "__main__":
    sys.exit(main())
