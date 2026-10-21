#!/usr/bin/env python3
"""kaggle_wow_film.py — push a Kaggle notebook that turns the published film into
a 9:16 vertical cut and leaves both videos in /kaggle/working (the Output tab).

    set -a && . ./.env.local && set +a
    python3 tools/kaggle_wow_film.py

The notebook is self-contained: it downloads the master from GitHub Pages, so
the footage in Kaggle is literally the file people watch on the site.
"""
from __future__ import annotations
import json, os, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "earningcpu/wow-signal-film-and-vertical-cut"
TITLE = "Wow! signal - 72 SECONDS: master and vertical cut"
TOKEN = os.environ.get("KAGGLE_API_TOKEN", "")

BASE = "https://earning-cpu.github.io/nightingale-films"

FETCH = '''import os, subprocess, urllib.request, json

# Two mirrors of the same file: GitHub Pages (what the site serves) and the raw
# repo path. Pages can lag a push by a few minutes, so fall back rather than fail.
MIRRORS = [
    "__BASE__",
    "https://raw.githubusercontent.com/earning-cpu/nightingale-films/main/docs",
]
OUT = "/kaggle/working"
os.makedirs(OUT, exist_ok=True)

def grab(name):
    dst = os.path.join(OUT, name)
    if os.path.exists(dst) and os.path.getsize(dst) > 10000:
        pass
    else:
        last = None
        for base in MIRRORS:
            url = base + "/" + name
            try:
                print("downloading", url)
                urllib.request.urlretrieve(url, dst + ".part")
                os.replace(dst + ".part", dst)
                last = None
                break
            except Exception as e:
                print("  failed:", e)
                last = e
        if last:
            raise SystemExit("could not fetch %s from any mirror" % name)
    print("%-22s %8.2f MB" % (name, os.path.getsize(dst) / 1e6))
    return dst

master = grab("wow2_1080.mp4")
poster = grab("wow2_poster.jpg")

probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_format",
    "-show_streams", "-of", "json", master]))
v = [s for s in probe["streams"] if s["codec_type"] == "video"][0]
a = [s for s in probe["streams"] if s["codec_type"] == "audio"][0]
print("video  %sx%s  %s  %s fps  %s frames" % (
    v["width"], v["height"], v["codec_name"], v["r_frame_rate"], v.get("nb_frames")))
print("audio  %s  %s Hz  %s ch  %s kbps" % (
    a["codec_name"], a["sample_rate"], a["channels"], int(a.get("bit_rate", 0)) // 1000))
print("length %.2f s" % float(probe["format"]["duration"]))
'''.replace("__BASE__", BASE)

VERTICAL = '''import subprocess

# 16:9 -> 9:16 without cropping the picture: the plate is scaled to fill the
# portrait frame and blurred hard behind a sharp, letterboxed copy of itself.
# The burned-in captions sit in the lower third, so they stay inside the safe
# area of the vertical frame too.
vf = (
    # the master has 84 px letterbox bars baked in; crop them first, then fit
    "[0:v]crop=1920:912:0:84,scale=1080:1920:force_original_aspect_ratio=increase,"
    "crop=1080:1920,boxblur=60:3,eq=brightness=0.10:saturation=1.4[bg];"
    "[0:v]crop=1920:912:0:84,scale=1080:-2[fg];"
    "[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
)

out = "/kaggle/working/wow2_vertical_1080.mp4"
cmd = ["ffmpeg", "-y", "-v", "error", "-i", "/kaggle/working/wow2_1080.mp4",
       "-filter_complex", vf, "-map", "[v]", "-map", "0:a",
       "-c:v", "libx264", "-preset", "medium", "-crf", "20",
       "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
       "-movflags", "+faststart", out]
print("$", " ".join(cmd))
subprocess.run(cmd, check=True)

probe = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,nb_frames", "-of", "csv=p=0", out]).decode().strip()
print("vertical:", probe, "->", out)
'''

DISPLAY = '''import base64, json, subprocess, os
from IPython.display import HTML, display

poster_b64 = base64.b64encode(open("/kaggle/working/wow2_poster.jpg", "rb").read()).decode()
display(HTML(
    '<div style="max-width:720px">'
    '<div style="font:600 15px system-ui;color:#666;margin:6px 0 10px">'
    '72 SECONDS — the Wow! signal (9:16 vertical cut, 480p proxy)</div>'
    '<video controls loop muted playsinline poster="data:image/jpeg;base64,%s" '
    'style="width:100%%;border-radius:6px;background:#000" '
    'src="%s"></video></div>' % (
        poster_b64,
        "data:video/mp4;base64," + base64.b64encode(open("/kaggle/working/wow2_vertical_480.mp4", "rb").read()).decode())
))

# contact sheet so the film is visible even without playing it
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "/kaggle/working/wow2_1080.mp4",
                "-vf", "fps=1/6,scale=360:-1,tile=4x4", "-frames:v", "1",
                "/kaggle/working/wow2_contact.jpg"], check=True)
display(HTML('<img src="data:image/jpeg;base64,%s" style="width:100%%;max-width:900px;border-radius:6px">'
             % base64.b64encode(open("/kaggle/working/wow2_contact.jpg", "rb").read()).decode()))

for f in sorted(os.listdir("/kaggle/working")):
    p = os.path.join("/kaggle/working", f)
    if os.path.isfile(p):
        print("%-32s %8.2f MB" % (f, os.path.getsize(p) / 1e6))
'''

PROXY = '''import subprocess
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "/kaggle/working/wow2_vertical_1080.mp4",
                "-vf", "scale=480:854", "-c:v", "libx264", "-preset", "veryfast", "-crf", "27",
                "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart",
                "/kaggle/working/wow2_vertical_480.mp4"], check=True)
print("proxy ready")
'''


def cell(src: str, kind: str) -> dict:
    base = {"cell_type": kind, "metadata": {}, "source": src.splitlines(keepends=True)}
    if kind == "code":
        base.update({"id": "c%d" % abs(hash(src[:40])), "execution_count": None, "outputs": []})
    else:
        base["id"] = "m%d" % abs(hash(src[:40]))
    return base


def build() -> dict:
    md = lambda s: cell(s, "markdown")
    code = lambda s: cell(s, "code")
    return {
        "cells": [
            md("""# 72 SECONDS — the Wow! signal

Everything below runs on its own. **Save Version → Save & Run All (Commit)** and
the Output tab ends up with:

| file | what it is |
|---|---|
| `wow2_1080.mp4` | the published master, 1920×1080, 30 fps |
| `wow2_vertical_1080.mp4` | **9:16 cut**, 1080×1920 — the phone version |
| `wow2_vertical_480.mp4` | 480p proxy, small enough to play inline below |
| `wow2_contact.jpg` | 16-frame contact sheet |
| `wow2_poster.jpg` | poster frame |

The film is 85.9 s. Captions are burned in. The audio is mastered to −14 LUFS.
"""),
            md("## 1 — fetch the master that is live on the site"),
            code(FETCH),
            md("## 2 — 9:16 vertical cut"),
            code(VERTICAL),
            md("## 3 — proxy for inline playback"),
            code(PROXY),
            md("## 4 — watch it, plus a contact sheet"),
            code(DISPLAY),
        ],
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def main() -> None:
    if not TOKEN:
        sys.exit("set KAGGLE_API_TOKEN (see .env.local)")
    nb = build()
    payload = {
        "slug": SLUG, "newTitle": TITLE, "text": json.dumps(nb),
        "language": "python", "kernelType": "notebook", "isPrivate": False,
        "enableGpu": False, "enableInternet": True,
        "categoryIds": [], "kernelDataSources": [], "datasetDataSources": [],
        "competitionDataSources": [], "modelDataSources": [],
    }
    out = os.path.join(ROOT, "qa", "kaggle_wow_nb.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(nb, open(out, "w"), indent=1)
    print("notebook written", out, len(nb["cells"]), "cells")

    req = urllib.request.Request(
        "https://www.kaggle.com/api/v1/kernels/push",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            body = json.loads(r.read().decode())
            print("PUSH", r.status, "version", body.get("versionNumber"), "->", body.get("url"))
    except urllib.error.HTTPError as e:
        print("PUSH", e.code, e.read().decode()[:500])
        sys.exit(1)


if __name__ == "__main__":
    main()
