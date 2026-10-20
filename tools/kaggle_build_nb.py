#!/usr/bin/env python3
"""kaggle_build_nb.py — build and push the b-roll shootout notebook.

Reads the two helper scripts straight out of this repo so the notebook is
always self-contained, then pushes it as a new Kaggle version.

    export KAGGLE_API_TOKEN=KGAT_...
    python3 tools/kaggle_build_nb.py

Why a builder and not a hand-edited .ipynb: the notebook must contain
`wan.py` and `make_parallax.py` verbatim. Copy-pasting them by hand is how
notebooks silently drift from the tools they claim to run.
"""
from __future__ import annotations
import json, os, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = "earningcpu/nightingale-b-roll-wan-ltx-flux-parallax"
TITLE = "Nightingale b-roll: Wan + LTX + FLUX parallax"
TOKEN = os.environ.get("KAGGLE_API_TOKEN", "")
if not TOKEN:
    sys.exit("set KAGGLE_API_TOKEN (see .env.local)")

INSTALL = """# Kaggle's image ships a torchao older than the diffusers build pip resolves.
# diffusers.loaders.single_file imports torchao.quantization.FqnToConfig, which that
# old torchao does not have -> every pipeline import dies with ImportError.
# torchao is optional for diffusers, so removing it is the fix.
# Do NOT `pip install -U torchao`: it would pull torch back to an older pinned version.
!pip uninstall -q -y torchao
!pip install -q -U "diffusers>=0.35" transformers accelerate "imageio[ffmpeg]" safetensors sentencepiece protobuf opencv-python-headless
print("install done")"""

VERIFY = '''import sys, torch
print("python  ", sys.version.split()[0])
print("torch   ", torch.__version__, "| cuda:", torch.cuda.is_available())
if torch.cuda.is_available():
    p = torch.cuda.get_device_properties(0)
    print("gpu     ", torch.cuda.get_device_name(0), "| %.1f GB" % (p.total_memory / 1e9))
try:
    import diffusers
    from diffusers import DiffusionPipeline          # noqa: F401
    print("diffusers", diffusers.__version__, "OK")
except Exception as e:
    print("DIFFUSERS IMPORT FAILED:", type(e).__name__, e)
    print("-> !pip uninstall -q -y torchao   then Restart & Run All")
    raise'''

RUNNER = r'''import os, subprocess, sys, time, shutil, glob, json
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

# ------------------------------------------------------------------ CONFIG
SIZE        = "704x1280"   # 9:16 portrait. 1280x704 for landscape.
FRAMES_WAN  = 81           # 3.4 s @ 24 fps (must be 4n+1)
FRAMES_LTX  = 97           # 4.0 s @ 24 fps
STEPS       = 30
SEED        = 1979
RUN_WAN     = True
RUN_LTX     = True

PROMPT_SCENE = (
    "Archival 16mm film footage from 1979, an airfield at night in dense fog, "
    "a row of sodium floodlights glowing through mist over empty wet tarmac, "
    "distant treeline, slow handheld drift to the right, heavy film grain, "
    "halation around the lamps, desaturated, black and white, no people, no text"
)
PROMPT_CONTROL = (
    "Thin fog drifting through a single beam of light in a dark empty room, "
    "dust motes, slow drift, heavy film grain, black and white, no people, no text"
)
PROMPTS = [("scene", PROMPT_SCENE), ("control", PROMPT_CONTROL)]

OUT = "/kaggle/working/out"
os.makedirs(OUT, exist_ok=True)
W, H = [int(x) for x in SIZE.split("x")]
RESULTS = []

def sh(cmd, label):
    print("\n$ " + cmd[:200], flush=True)
    t0 = time.time()
    rc = subprocess.run(cmd, shell=True).returncode
    dt = (time.time() - t0) / 60
    print("   [%s] %.1f min" % ("OK" if rc == 0 else "FAILED rc=%d" % rc, dt), flush=True)
    RESULTS.append((label, rc == 0))
    return rc == 0

def disk(tag=""):
    t, u, f = shutil.disk_usage("/kaggle/working")
    print("   disk%s: %.1f GB free of %.1f GB" % (tag, f / 1e9, t / 1e9), flush=True)

def flush_weights(*names):
    n = 0
    for name in names:
        for p in glob.glob(os.path.expanduser("~/.cache/huggingface/hub/models--%s*" % name)):
            shutil.rmtree(p, ignore_errors=True); n += 1
    print("   freed %d cached model dir(s)" % n, flush=True)

print("=" * 70); disk(" at start"); print("=" * 70)

# ------------------------------------------------------------------ WAN
if RUN_WAN:
    for tag, prompt in PROMPTS:
        dst = "%s/wan_%s.mp4" % (OUT, tag)
        sh('python wan.py --prompt "%s" --size %s --frames %d --steps %d --seed %d --out %s'
           % (prompt.replace('"', ""), SIZE, FRAMES_WAN, STEPS, SEED, dst), "wan:" + tag)
        disk(" after wan-" + tag)

# ------------------------------------------------------------------ LTX
LTX = r"""
import os, torch
from diffusers import LTXPipeline
from diffusers.utils import export_to_video

pipe = LTXPipeline.from_pretrained("Lightricks/LTX-Video", torch_dtype=torch.float16)
pipe.enable_model_cpu_offload()
try:
    pipe.vae.enable_tiling()
except Exception as e:
    print("vae tiling unavailable:", e)

frames = pipe(
    prompt=os.environ["LTX_PROMPT"],
    negative_prompt="blurry, low quality, watermark, text, people, deformed, extra limbs",
    width=int(os.environ["LTX_W"]), height=int(os.environ["LTX_H"]),
    num_frames=int(os.environ["LTX_FRAMES"]),
    num_inference_steps=int(os.environ["LTX_STEPS"]),
    generator=torch.Generator(device="cpu").manual_seed(int(os.environ["LTX_SEED"])),
).frames[0]
export_to_video(frames, os.environ["LTX_OUT"], fps=24)
print("LTX wrote", os.environ["LTX_OUT"], len(frames), "frames")
"""
open("/kaggle/working/_ltx.py", "w").write(LTX)

if RUN_LTX:
    flush_weights("Wan-AI")          # 20 GB disk: Wan out before LTX lands
    for tag, prompt in PROMPTS:
        dst = "%s/ltx_%s.mp4" % (OUT, tag)
        os.environ.update(LTX_PROMPT=prompt, LTX_OUT=dst, LTX_W=str(W), LTX_H=str(H),
                          LTX_FRAMES=str(FRAMES_LTX), LTX_STEPS=str(STEPS), LTX_SEED=str(SEED))
        sh("python /kaggle/working/_ltx.py", "ltx:" + tag)
        disk(" after ltx-" + tag)

# ------------------------------------------------------------------ report
print("\n" + "=" * 70)
print("OUTPUT")
for f in sorted(glob.glob(OUT + "/*")):
    print("  %-42s %6.1f MB" % (os.path.basename(f), os.path.getsize(f) / 1e6))
print("\nMODEL RESULTS")
for label, ok in RESULTS:
    print("  %-14s %s" % (label, "OK" if ok else "FAILED"))
disk(" at end")
print("""
NEXT
 1. Output panel (right) -> download every .mp4
 2. locally:              python3 tools/compare_clips.py qa/clips
 3. grade the winner:     python3 tools/grade_plate.py CLIP.mp4 OUT.mp4 --preset noir
""")
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
    wan = open(os.path.join(ROOT, "tools/kaggle_wan_broll.py")).read()
    par = open(os.path.join(ROOT, "tools/make_parallax.py")).read()
    return {
        "cells": [
            md("""# Nightingale — b-roll model shootout (Wan 2.2 vs LTX-Video)

**One click runs everything.** Nothing to edit unless you want a new prompt.

| | |
|---|---|
| Outputs | `/kaggle/working/out/` → **Output** tab |
| Time | ~45 min on GPU T4 |
| Disk | Wan weights are deleted before LTX loads |

Run with **Save Version → Save & Run All (Commit)** — it survives closing the tab."""),
            md("## Step 1 — install"),
            code(INSTALL),
            md("""## Step 1b — tripwire

Proves the imports work *before* a 10 GB download. If diffusers cannot import,
this fails here in 20 seconds instead of 20 minutes."""),
            code(VERIFY),
            md("## Step 2 — helper scripts"),
            code("%%writefile wan.py\n" + wan),
            code("%%writefile make_parallax.py\n" + par),
            md("""## Step 3 — the shootout

Two prompts × two models. Same seed, size and steps, so the only variable is the model.

* **scene** — the shot the film actually needs.
* **control** — pure atmosphere, no location. If this fails, the model is the problem."""),
            code(RUNNER),
        ],
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def main() -> None:
    nb = build()
    payload = {
        "slug": SLUG, "newTitle": TITLE, "text": json.dumps(nb),
        "language": "python", "kernelType": "notebook", "isPrivate": False,
        "enableGpu": True, "enableInternet": True,
        "categoryIds": [], "kernelDataSources": [], "datasetDataSources": [],
        "competitionDataSources": [], "modelDataSources": [],
    }
    req = urllib.request.Request(
        "https://www.kaggle.com/api/v1/kernels/push",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            body = json.loads(r.read().decode())
            print("PUSH", r.status, "version", body.get("versionNumber"),
                  "->", body.get("url"))
    except urllib.error.HTTPError as e:
        print("PUSH", e.code, e.read().decode()[:500])
        sys.exit(1)


if __name__ == "__main__":
    main()
