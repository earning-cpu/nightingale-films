#!/usr/bin/env python3
"""kaggle_push.py — push a notebook + dataset to Kaggle from here, then report.

    export KAGGLE_API_TOKEN=KGAT_...
    python tools/kaggle_push.py --whoami
    python tools/kaggle_push.py --push-dataset tools/kaggle_wan_broll.py
    python tools/kaggle_push.py --push-notebook

Kaggle's private API moves around; every call prints its raw HTTP status so a
failure is diagnosable rather than mysterious.
"""
from __future__ import annotations
import argparse, json, os, sys, urllib.error, urllib.request

BASE = "https://www.kaggle.com/api/v1"


def call(path, token, method="GET", body=None, ctype="application/json"):
    url = BASE + path
    data = None
    if body is not None:
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}", "Content-Type": ctype})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            raw = r.read().decode("utf-8", "replace")
            return r.status, raw
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:500]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", default=os.environ.get("KAGGLE_API_TOKEN", ""))
    ap.add_argument("--whoami", action="store_true")
    ap.add_argument("--push-dataset", default="", help="path to the .py to upload as a dataset")
    ap.add_argument("--push-notebook", action="store_true")
    ap.add_argument("--list-kernels", action="store_true")
    a = ap.parse_args()
    if not a.token:
        sys.exit("set KAGGLE_API_TOKEN")

    if a.whoami:
        s, b = call("/hello", a.token)
        print(s, b[:200])

    if a.list_kernels:
        for p in ("/kernels/list?pageSize=5", "/kernels/list/mine?pageSize=5",
                  "/kernels/list?user=earningcpu&pageSize=5"):
            s, b = call(p, a.token)
            print(f"{p:42} {s} {b[:120]}")

    if a.push_dataset:
        print("dataset push needs multipart form data; see KAGGLE_WAN_SETUP.md Part 2 Step 5A")
        print("file ready:", a.push_dataset, os.path.getsize(a.push_dataset), "bytes")

    if a.push_notebook:
        print("notebook push uses /kernels/push with a JSON blob (source + metadata). "
              "Not attempted yet — verify credentials first.")


if __name__ == "__main__":
    sys.exit(main())
