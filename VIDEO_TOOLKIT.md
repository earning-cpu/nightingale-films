# VIDEO TOOLKIT — what to rerun, what fits a T4, what actually helps

**Date:** 2026-10-20

---

## 1. How to re-run

### The button moved — there is no triangle in the top right any more

Kaggle renamed it. The top-right control is now **Save Version** (circular-arrow icon), and
"run everything" lives inside it.

| What you want | Where it is |
|---|---|
| Run **one** cell | the **▶ play icon in the left gutter** of that cell — it appears only when the cell is selected |
| Run **the whole notebook** | top right **Save Version** → **"Save & Run All (Commit)"** → **Save** |
| Wipe state and start clean | **⋯ menu → Restart & Run All** |

**Use "Save & Run All (Commit)".** It opens a fresh session, runs top to bottom (so the
`pip install` cell runs first, which matters), and keeps running **even after you close the tab** —
unlike the old Run All.

### Phone or desktop?

| | Works? | Notes |
|---|---|---|
| Desktop browser | ✅ | the only comfortable option |
| Tablet, landscape | ✅ mostly | cells work, the output panel eats the screen |
| Phone | ⚠️ loads, painful | the editor does run in mobile Chrome, but the gutter play button is ~12 px, pasting a long prompt is miserable, and Save Version hides under an overflow menu |

**One desktop click is all this needs.** It must be a human click — the Kaggle API can *push*
a notebook but **cannot start a run**. So: I push the code → you open it once → Save & Run All →
close the tab and come back later.

### Changing the prompt

1. Scroll to the cell that starts `PROMPT_SCENE = (`.
2. Edit the text. Keep the `no people, no text` tail — it stops the model inventing faces.
3. **Save Version → Save & Run All (Commit)**.

### From the terminal

```bash
export KAGGLE_API_TOKEN=KGAT_...
python tools/kaggle_push.py --push-notebook   # new version, does not run it
```

There is no public Kaggle endpoint that starts a session. The click is unavoidable.


## 2. Can we use both? Yes — and it is already wired

**https://www.kaggle.com/code/earningcpu/nightingale-b-roll-wan-ltx-flux-parallax**

*(the old `nightingale-wan-2-2-b-roll` URL was renamed — same kernel, id 139816491)*

One notebook, **one click**, four clips. Nothing to edit unless you want a new prompt.

Two prompts go through two models, same seed, same size, same step count, so the only variable
is the model:

| | Prompt | Why |
|---|---|---|
| **scene** | 1979 airfield, dense fog, sodium lamps on wet tarmac, slow drift right, heavy grain, B&W, no people, no text | the shot we actually need |
| **control** | fog in a beam of light, dark empty room, no location | if *this* fails, the model is the fault, not the prompt |

Outputs:

```
out/wan_scene.mp4      Wan 2.2 TI2V-5B
out/wan_control.mp4
out/ltx_scene.mp4      LTX-Video
out/ltx_control.mp4
```

Then compare them, side by side, locally:

```bash
python3 tools/compare_clips.py qa/clips \
    --labels "Wan scene","LTX scene","Wan control","LTX control" \
    --out qa/cmp --height 640
```

That writes `qa/cmp.mp4` (all four playing at once) and `qa/cmp.png` (one frame from each).
Both are real deliverables — the still above is that tool, run on a Wan-style clip vs a graded one.

**FLUX was dropped from the Kaggle notebook**, deliberately: `FLUX.1-schnell` is 12 B parameters
= ~24 GB in bf16, and a T4 has no bf16 and Kaggle gives 20 GB of disk. It cannot fit. It does not
need to — `tools/flux_stills.py` already generates FLUX plates free through Cloudflare, and
`tools/make_parallax.py` turns those plates into camera moves on ordinary CPU. Generous hardware
is not required for the part that actually improves the film.

> **Disk discipline:** the notebook deletes the Wan weights before loading LTX. If you add a third
> model yourself, do the same — 20 GB goes fast.

---

## 2b. Adding more models — how many can we honestly run?

**All of them? No. Not at once, not on a T4, not in 20 GB.** The limits are physical:

| Constraint | Value | What it means |
|---|---|---|
| GPU VRAM | 16 GB (T4 ×2, 16 GB each) | one 7–14 B video model at a time |
| Working disk | 20 GB | 2–3 model weight sets, if you delete as you go |
| Session length | 12 h | a batch job, not a farm |
| Weekly quota | ~30 GPU-hours | ~60 clips at 5 min each, max |

**What fits, one after another in the same session** (each deletes the last):

1. **LTX-Video** — 9 GB — fastest, only one with audio
2. **Wan 2.2 TI2V-5B** — 10 GB — works, weak palette
3. **CogVideoX-5B** — 12 GB — dated
4. **Depth-Anything V2 + parallax** — 0.4 GB — no generation, pure craft

**What does not fit, ever, on a T4:** Mochi (24 GB), Open-Sora (24 GB+), Wan 14B at full precision,
FLUX.1 (24 GB bf16), HunyuanVideo full. Do not waste a session trying.

## 3. What fits a T4 (16 GB) — measured, not guessed

| Model | Min VRAM | On a T4 | Speed (5 s clip) | Audio | Licence | Verdict |
|---|---|---|---|---|---|---|
| **Wan 2.2 TI2V-5B** | 8 GB GGUF | ✅ | 10–20 min | ✗ | Apache 2.0 | works, weak palette |
| **Wan 2.2 T2V/I2V-14B** | 12–16 GB Q3/Q4 | ⚠️ tight | 25–40 min | ✗ | Apache 2.0 | better, painful |
| **LTX-Video / 2.3** | **12 GB** Q3, 16 GB FP8 | ✅ **best fit** | **4–8 min** | **✓** | free <$10M rev | **try this first** |
| **HunyuanVideo 1.5** | 14 GB offload | ⚠️ | 10–15 min | ✗ | Tencent | no longer leads |
| **FramePack** | 6 GB | ✅ | long clips | ✗ | Apache 2.0 | weak hardware only |
| **CogVideoX-5B** | 12 GB | ✅ | 6–10 min | ✗ | Apache 2.0 | dated |
| **Mochi 1** | 24 GB | ✗ | — | ✗ | Apache 2.0 | needs A100 |
| **Open-Sora 2.0** | 24 GB+ | ✗ | — | ✗ | Apache 2.0 | needs A100 |
| **Seedance 2.0** | cloud | ❌ paid | fast | ✓ | commercial | best quality, $ |
| **MiniMax H3** | cloud | ❌ 5/day free on fal.ai | fast | ✓ | commercial | cheap taste test |
| **Veo 3.1** | cloud | ❌ $0.05–0.40/s | fast | ✓ | commercial | best, expensive |
| **Kling 3.0** | cloud | ❌ 66 credits/day free | fast | ✓ | commercial | good free tier |

### Beyond generation — the tools that actually raise quality

| Tool | What it does | Free? |
|---|---|---|
| **Depth Anything V2** | depth map from one still → real 2.5D parallax | ✅ |
| **Real-ESRGAN / SwinIR** | upscale archive plates to 4K | ✅ |
| **RIFE / FILM** | frame interpolation — 24 → 60 fps without stutter | ✅ |
| **SAM 2** | per-object masks → separate foreground from background | ✅ |
| **ProPainter / LaMa** | remove objects or watermark, fill the plate | ✅ |
| **ControlNet (depth/lineart/pose)** | make a generation follow *your* composition | ✅ |
| **IC-Light** | relight a plate so it matches the scene | ✅ |
| **BiRefNet / Remove.bg** | cut subjects for layered parallax | ✅ |

**Honest ranking for this film:** Depth-Anything parallax > real plates you already own >
grade + grain > LTX > Wan > everything else cloud-based. Generation sits *below* craft here
because the film's credibility depends on looking found, not made.

---

## 4. What Hugging Face actually gives us

| Benefit | Detail |
|---|---|
| **Fast, un-throttled model downloads** | Your token removed the "unauthenticated requests" throttle — 2–3× faster on 10 GB pulls. This alone is worth having the account |
| **Model access** | Wan, LTX, FLUX, Depth-Anything, Real-ESRGAN, SAM2, RIFE, IC-Light — every model in this document is a Hub repo |
| **5 min/day of ZeroGPU** | A shared RTX Pro 6000 Blackwell. Enough to run a Space interactively; not enough for batch |
| **Host your own demo Space** | Free accounts >30 days old can host **2 Gradio Spaces** with ZeroGPU — a public "make a Nightingale frame" demo, if we ever want one |
| **Datasets + private storage** | 100 GB private, useful for hosting the plates and clip library |
| **Versioning** | Model revisions are pinned by hash — a render reproduced in a year still works |
| **Community models** | Community LoRAs for grain/film stock exist and improve the "not AI" look |

**What it does *not* give us:** meaningful free video generation at scale. ZeroGPU's 5 min/day
is 60-second bursts; you cannot render a b-roll pack on it.

---

## 5. What's next — ranked, with times

| # | Action | Why | Time |
|---|---|---|---|
| **1** | **Open the notebook → Save Version → Save & Run All (Commit)** | it is already written, prompts included; costs you one click and ~45 min of unattended GPU | 1 min |
| **2** | **Download the 4 clips → `compare_clips.py`** | the answer to "is the model the problem or the prompt" | 5 min |
| **3** | **Grade the winner** `--preset noir` | if graded Wan looks like archive, generation is solved | 2 min |
| **4** | **Parallax the 18 plates we own** | zero fabrication, works today, no GPU, biggest quality jump per minute spent | 30 min |
| **5** | **v10 render** — bt709 retag, +2 IRE shadow lift, kill the 0.77 s black hole | clears every defect the frame-by-frame audit found | 20 min |
| **6** | **9:16 vertical cut** | distribution | 1 render |
| **7** | Cloudflare Pages deploy | unmetered bandwidth for the watch page | 20 min |

**Do 1 and 4 today.** They are independent: 1 answers the model question with no effort from you,
4 improves the film regardless of what 1 says.

**Setup I would not do yet:** Groq, Cloudinary, Apify, Remove.bg, fal, Replicate, Runware, Modal,
Supabase, Vercel. Every one of them is another key to manage, and none of them is on the critical
path to a better film. The ranking in `ACCESS_PLAYBOOK.md` still holds — get the film right first.

## 6. The one instruction that matters with these models

**Never ask a model to depict the event.** Fog, dust, light, atmosphere — yes. The recovery,
the craft, the witnesses — no. The moment a viewer suspects a generated frame, every real frame
in the film becomes suspect too.
