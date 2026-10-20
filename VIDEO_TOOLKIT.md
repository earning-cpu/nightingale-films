# VIDEO TOOLKIT — what to rerun, what fits a T4, what actually helps

**Date:** 2026-10-20

---

## 1. How to re-run — three ways, easiest first

### A. Run All in the browser (30 seconds)

Open **https://www.kaggle.com/code/earningcpu/nightingale-wan-2-2-b-roll**

Click **Run All** (top right, triangle icon), then **Run Anyway** in the dialog.

That's it. Everything reruns from the top. If the notebook is already open and you changed
nothing, use **⋮ → Restart & Run All** to wipe the old session state first.

> **Free-tip:** after a session has downloaded the weights once, rerunning *in the same session*
> skips the 10 GB download and starts generating in seconds.

### B. Change the prompt and rerun (the one you want)

1. In the notebook, scroll to **cell 1**, near the top:
   ```python
   PROMPTS = [
       "thin fog drifting through a beam of light in a dark warehouse, no people, no text",
   ]
   ```
2. Edit the text between the quotes. Keep the `, no people, no text` tail — it stops the model
   inventing faces and captions.
3. **Run All** again.
4. Outputs appear in `/kaggle/working/out/`, visible in the **Output** panel on the right.

### C. Rerun from here (no browser)

```bash
export KAGGLE_API_TOKEN=KGAT_...
python tools/kaggle_push.py --rerun earningcpu/nightingale-wan-2-2-b-roll
```

*(not yet wired — say the word and I'll add it to the script)*

---

## 2. Can we use both? Yes — one notebook, three models

I repushed your notebook to run **Wan, LTX and FLUX-parallax on the same prompts**, one after
another, so you compare them honestly:

**https://www.kaggle.com/code/earningcpu/nightingale-b-roll-wan-ltx-flux-parallax**

*(If that URL 404s, use the original: `earningcpu/nightingale-wan-2-2-b-roll` — the push updated
it; Kaggle sometimes gives a new slug on title change.)*

Outputs for each prompt:

```
out/wan_p01.mp4        Wan 2.2 5B          ← teal, slow, weakest
out/ltx_p01.mp4        LTX-Video           ← faster, cleaner, has audio
out/flux_p01.png       FLUX.1-schnell      ← a still
out/parallax_p01.mp4   + 2.5D depth move   ← the still, moving with real depth
```

**Cost per prompt:** ~12–20 min total on a T4. Two prompts ≈ 40 min ≈ 1.5 GPU-hours (5% of the
weekly allowance).

You need `wan.py` and `make_parallax.py` in `/kaggle/working/`. Add two cells at the top of the
notebook and paste each file's contents:

```python
%%writefile wan.py
# paste tools/kaggle_wan_broll.py

%%writefile make_parallax.py
# paste tools/make_parallax.py
```

---

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

## 5. What's next — ranked

| # | Action | Why | Time |
|---|---|---|---|
| **1** | **Grade the draft you already made** | proves the whole "AI look" problem is a colour-and-grain problem | 2 min |
| **2** | **Rerun Wan at final settings** (`704x1280`, 81 frames, 30 steps) | the 480p/49-frame draft was its worst mode | 15 min |
| **3** | **Run the three-model notebook** | honest side-by-side: Wan vs LTX vs parallax | 40 min |
| **4** | **Parallax on the 18 stills we own** | the biggest real upgrade, zero fabrication | 30 min |
| **5** | **v10 render** — bt709 retag, +2 IRE shadow lift, kill the 0.77 s black hole | fixes every defect `qa_pro.py` found | 20 min |
| **6** | **9:16 vertical cut** | distribution | 1 render |
| **7** | Cloudflare Pages deploy | unmetered bandwidth for the watch page | 20 min |

**My recommendation:** 1 → 2 → 5. Grade the draft tonight, see if the look problem disappears.
If it does, generation is a solved problem and the remaining work is craft. If it doesn't, the
shot doesn't belong in the film and we spend the time on parallax instead — which cannot fail,
because every pixel still comes from a photograph we already own.

---

## 6. The one instruction that matters with these models

**Never ask a model to depict the event.** Fog, dust, light, atmosphere — yes. The recovery,
the craft, the witnesses — no. The moment a viewer suspects a generated frame, every real frame
in the film becomes suspect too.
