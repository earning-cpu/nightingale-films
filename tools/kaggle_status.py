#!/usr/bin/env python3
"""kaggle_status.py — see what a Kaggle notebook run is actually doing.

    export KAGGLE_API_TOKEN=KGAT_...
    python3 tools/kaggle_status.py                      # one-shot status
    python3 tools/kaggle_status.py --log                # + last 40 log lines
    python3 tools/kaggle_status.py --files              # + output file list
    python3 tools/kaggle_status.py --watch              # poll every 60 s

Defaults to the Nightingale b-roll notebook; pass --slug for another.

What the status field means
  complete  the last *saved version* finished. It says nothing about whether
            the code succeeded — read the log for that. A run of four failed
            cells is still "complete".
  running   a saved version is still executing.
  (nothing) an interactive "Run all" never creates a version, so it does not
            show up here at all — watch the cell outputs in the editor instead.
"""
from __future__ import annotations
import argparse, json, os, sys, time, urllib.request, urllib.error

API = "https://www.kaggle.com/api/v1"
DEFAULT_SLUG = "nightingale-b-roll-wan-ltx-flux-parallax"
DEFAULT_USER = "earningcpu"


def get(path: str, token: str) -> dict:
    req = urllib.request.Request(API + path, headers={"Authorization": "Bearer " + token})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        return {"_http_error": e.code, "_body": e.read().decode()[:300]}
    except Exception as e:                                   # noqa: BLE001
        return {"_error": repr(e)}


def flatten_log(blob: dict) -> str:
    raw = blob.get("log") or blob.get("logNullable") or ""
    if not raw:
        return ""
    try:
        entries = json.loads(raw) if isinstance(raw, str) else raw
    except Exception:                                        # noqa: BLE001
        return raw if isinstance(raw, str) else ""
    if isinstance(entries, list):
        return "".join(e.get("data", "") for e in entries if isinstance(e, dict))
    return str(entries)


def state_line(status: dict) -> str:
    if "_error" in status or "_http_error" in status:
        return "unavailable (%s)" % (status.get("_http_error") or status.get("_error"))
    s = status.get("status") or "unknown"
    fail = status.get("failureMessage") or ""
    return s + (" — " + fail if fail else "")


def snap(user: str, slug: str, token: str, want_log: bool, want_files: bool, tail: int) -> None:
    st = get("/kernels/status?userName=%s&kernelSlug=%s" % (user, slug), token)
    print("kernel : %s/%s" % (user, slug))
    print("status : %s" % state_line(st))
    print("time   : %s UTC" % time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()))

    lk = get("/kernels/list?user=%s&pageSize=50" % user, token)
    if isinstance(lk, list):
        for k in lk:
            if k.get("ref", "").endswith(slug):
                print("last run: %s | version: %s | gpu flag: %s"
                      % (k.get("lastRunTime"), k.get("currentVersionNumber"),
                         k.get("enableGpu")))

    if want_log or want_files:
        blob = get("/kernels/output?userName=%s&kernelSlug=%s" % (user, slug), token)
        text = flatten_log(blob)
        if want_files:
            files = blob.get("files") or []
            print("\nfiles in the last version: %d" % len(files))
            for f in files[:20]:
                print("  %-30s %s" % (str(f.get("name") or f.get("fileName") or "?")[:30],
                                      str(f.get("size") or "")[:12]))
        if want_log and text:
            lines = [l.rstrip() for l in text.splitlines() if l.strip()]
            print("\n---- last %d log lines ----" % tail)
            for l in lines[-tail:]:
                print(l[:200])
        elif want_log:
            print("\n(no log attached to the last version)")


def main() -> None:
    ap = argparse.ArgumentParser(description="Kaggle notebook run status")
    ap.add_argument("--user", default=os.environ.get("KAGGLE_USERNAME", DEFAULT_USER))
    ap.add_argument("--slug", default=DEFAULT_SLUG)
    ap.add_argument("--log", action="store_true")
    ap.add_argument("--files", action="store_true")
    ap.add_argument("--tail", type=int, default=40)
    ap.add_argument("--watch", type=int, nargs="?", const=60, default=0,
                    help="poll every N seconds (default 60)")
    a = ap.parse_args()

    token = os.environ.get("KAGGLE_API_TOKEN", "")
    if not token:
        sys.exit("set KAGGLE_API_TOKEN — export $(grep -v '^#' .env.local | xargs)")

    if not a.watch:
        snap(a.user, a.slug, token, a.log, a.files, a.tail)
        return
    last = None
    try:
        while True:
            st = get("/kernels/status?userName=%s&kernelSlug=%s" % (a.user, a.slug), token)
            cur = state_line(st)
            if cur != last:
                print("[%s] %s" % (time.strftime("%H:%M:%S"), cur), flush=True)
                last = cur
                if cur.startswith("complete") or cur.startswith("error"):
                    snap(a.user, a.slug, token, a.log, a.files, a.tail)
            time.sleep(a.watch)
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
