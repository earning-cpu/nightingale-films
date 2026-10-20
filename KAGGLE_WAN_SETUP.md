# KAGGLE + WAN 2.2 — detailed setup
### Free GPU video generation, step by step

**Date:** 2026-10-20 · **Tool:** `tools/kaggle_wan_broll.py` (already written) · **Cost:** $0

---

## 0. Before you start — what this can and cannot do for us

| Use it for | Never use it for |
|---|---|
| Fog drifting through a light beam | A fake photograph of the 1979 recovery |
| Dust motes in a projector lamp | Fake witnesses, fake documents, fake radio audio |
| Night desert atmosphere, heat haze | Any depiction of a real event as if archival |
| Title-plate backgrounds | Faces of real people |
| Vertical b-roll for the 9:16 cut | Anything that pretends to be evidence |

Nightingale's spine is that everything looks **found**, not **made**. Generated
footage goes in the gaps between facts — never where a fact should be.

**Expected throughput on a free T4 (16 GB):**

| Setting | Time per clip | Quality |
|---|---|---|
| 480×832, 49 frames (2 s), 20 steps | ~3–5 min | draft — use to test a prompt |
| 704×1280, 81 frames (3.4 s), 30 steps | ~10–15 min | final |
| 704×1280, 121 frames (5 s), 30 steps | ~18–25 min | final, longest the model does cleanly |

A 30-clip b-roll pack = one or two Kaggle sessions.

---

## Part 1 — Kaggle account (6 minutes)

### Step 1 — sign up
Go to **https://www.kaggle.com/account/login**
Use **Sign in with Google** (fastest) or email. No credit card, ever.

### Step 2 — verify your phone
Kaggle **refuses GPU until your phone is verified.**
1. Click your avatar (top right) → **Settings**
2. Find **Phone Verification** → enter your number → receive an OTP → confirm

> Indian numbers work. If the SMS never arrives, try once more after 5 minutes; the
> verifier is flaky but the quota is worth it.

### Step 3 — create the API token ✅ done

You created a **token** (`KGAT_…`), not a legacy key — that's the right choice: the legacy
`kaggle.json` pair is the path that produces `OSError: Could not find kaggle.json`.

**Verified live from here:**

```
GET /api/v1/hello       200  {"userName":"earningcpu"}
GET /api/v1/kernels     200  (list access confirmed)
```

Both `Authorization: Bearer <token>` and `user:token` basic auth work. Note the username is
`earningcpu` (Kaggle strips punctuation) — that matters, because kernel paths are
`earningcpu/<slug>`.

**What this token can do:** read the API, list kernels and datasets, and — through the
`kaggle` CLI — push and run notebooks. **What it cannot do:** create a dataset directly via
the REST endpoint (returns `403`). Use the browser for the one-time dataset upload; the CLI
handles it fine once a dataset exists.

### Step 4 — check your quota
**Settings → Accelerator** (or the notebook's session panel) shows the weekly GPU
hours. It's usually ~30 h/week. It resets weekly and is not published anywhere else.

---

## Part 2 — first notebook (10 minutes)

### Step 1 — create it
Go to **https://www.kaggle.com/code** → **New Notebook**

### Step 2 — turn on the GPU (this is the step people miss)
In the right-hand panel:
1. **Session options** → expand
2. **Accelerator** → **GPU T4 ×2**
3. **Internet** → **On**  ← without this, `pip install` fails
4. Click **Save**

If "Accelerator" is greyed out, your phone isn't verified — go back to Part 1, Step 2.

### Step 3 — verify you actually have a GPU
New cell, run:

```python
!nvidia-smi
```

You should see two **Tesla T4** entries with ~15 GB each. If you see
"No devices were found", the accelerator isn't on — re-do Step 2 and restart.

### Step 4 — install what we need (one cell, ~2 minutes)

```python
!pip install -q "diffusers>=0.35" transformers accelerate "imageio[ffmpeg]" safetensors sentencepiece protobuf
```

### Step 5 — get our script in
Two ways, pick one:

**A — upload the file (simplest)**
1. Right panel → **Input** → **Upload** → *New Dataset*
2. Drag in `tools/kaggle_wan_broll.py` from this repo
3. Name the dataset `nightingale-tools` → **Create**
4. It appears under `/kaggle/input/nightingale-tools/`

**B — paste it (no dataset needed)**
Create a new code cell and paste the entire contents of
`tools/kaggle_wan_broll.py` into it, then run it as a script by saving the cell to
a file first:

```python
%%writefile wan.py
# <paste the whole script here>
```

### Step 6 — dry run first (10 seconds, no GPU cost)

```python
!python /kaggle/input/nightingale-tools/kaggle_wan_broll.py --prompt "test" --dry-run
```
*(or `!python wan.py --prompt "test" --dry-run` in the paste route)*

You should see:
```
PLAN {'model': 'Wan-AI/Wan2.2-TI2V-5B-Diffusers', 'size': '704x1280', 'frames': 81,
      'seconds': 3.38, 'steps': 30, ...}
```

### Step 7 — the real run

Start with a **draft** so a bad prompt costs 4 minutes instead of 20:

```python
!python /kaggle/input/nightingale-tools/kaggle_wan_broll.py \
    --prompt "thin fog drifting through a beam of light in a dark desert warehouse, no people, no text" \
    --size 480x832 --frames 49 --steps 20 \
    --out /kaggle/working/draft01.mp4
```

Then the **final**:

```python
!python /kaggle/input/nightingale-tools/kaggle_wan_broll.py \
    --prompt "thin fog drifting through a beam of light in a dark desert warehouse, no people, no text, 1970s film grain" \
    --size 704x1280 --frames 81 --steps 30 --seed 1979 \
    --out /kaggle/working/broll_fog_01.mp4
```

The first run downloads ~10 GB of weights (2–4 min). Later runs in the same
session start immediately.

### Step 8 — get the file out
Right panel → **Output** → `/kaggle/working` → click the ⋮ on `broll_fog_01.mp4` →
**Download**.

Or, from the notebook:
```python
import shutil
shutil.copy("/kaggle/working/broll_fog_01.mp4", "/kaggle/working/")
# then use the Output panel — Kaggle has no public file URL for a running session
```

### Step 9 — batch several clips in one session
```python
prompts = [
  ("fog",  "thin fog drifting through a beam of light in a dark warehouse"),
  ("dust", "dust motes floating in a shaft of sunlight, extreme close up, no people"),
  ("heat", "desert heat haze shimmering over an empty runway at dawn"),
  ("lamp", "a bare bulb swinging slowly in a dark concrete corridor"),
]
for name, p in prompts:
    !python /kaggle/input/nightingale-tools/kaggle_wan_broll.py \
        --prompt "$p" --size 704x1280 --frames 81 --steps 30 \
        --out /kaggle/working/{name}.mp4
```

---

## Part 3 — turning clips into film

### Step 1 — conform them to the project
Generated clips come out at 24 fps with no colour tags. Match the film before they
touch the timeline:

```bash
ffmpeg -i broll_fog_01.mp4 -r 30 -vf "scale=1920:1080" \
  -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv" \
  -an public/broll/fog_01.mp4
```

### Step 2 — grade them to match
Every generated clip must sit next to real archive plates without looking pasted.
Compare a frame from the clip and a frame from `public/img/` side by side and match
contrast, grain and hue **before** it goes in the edit.

### Step 3 — QA the clip
```bash
python3 qa_pro.py public/broll/fog_01.mp4
```
Catches black frames, frozen runs and the missing bt709 tags that the conform above
should already have fixed.

### Step 4 — the rules that still apply
- No clip shorter than 1.0 s once cut into the film.
- A cutaway runs **to** the scene cut, never leaving a sliver.
- No two adjacent shots with the same camera vector — a generated push that repeats
  the previous still's push reads as a template.
- Generated footage is labelled in `assets/manifest.json` with `"source": "generated"`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `No GPU` / `nvidia-smi` empty | Accelerator off | Session options → GPU T4 ×2 → Save → **Restart** |
| `pip install` hangs | Internet off | Session options → Internet → On |
| `CUDA out of memory` | too many frames or too big | `--frames 49 --size 480x832`, or `--steps 20` |
| Model id 404 | the Hub repo was renamed | search Hugging Face for `Wan2.2-TI2V-5B-Diffusers` and pass `--model` |
| Session dies at 12 h | Kaggle hard limit | split the batch; weights re-download on a new session |
| Weekly quota exhausted | ~30 h/week | wait for reset, or use Lightning AI (15 credits/mo) or Colab (T4) |
| Clip looks like a video game | no film grain in the prompt | add `1970s film grain, underexposed, shallow depth of field` |

---

## What to send me

**Credentials are already in place** (`KAGGLE_API_TOKEN` + username `earningcpu` in
`.env.local`). So I can:

1. **Push the notebook for you** — `tools/kaggle_push.py` is written; once you've confirmed
   the token can push kernels, I'll create `earningcpu/nightingale-wan` with the Wan script
   pre-loaded and the GPU flag set.
2. **Receive clips** — drop finished mp4s in chat and I conform, grade, QA and cut them.

**One thing only you can do, because it needs a browser and takes 10 seconds:** follow
Part 1, Step 2 and verify your phone at
**https://www.kaggle.com/settings** → *Phone Verification*. Without it the accelerator
dropdown stays greyed out and no amount of API access will start a GPU.

---

## The cheaper upgrade that comes first

Before generating a single clip, run **Depth-Anything parallax on the 18 stills we
already own** (`tools/make_parallax.py`). It produces real camera movement with zero
fabrication, takes ~2 min per still, and costs the same nothing. Shots with genuine
depth read as *filmed*; generated fog reads as *added*. Do the depth first, then use
Wan only for atmosphere the shoot could never have captured.
