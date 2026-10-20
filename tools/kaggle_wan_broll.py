#!/usr/bin/env python3
"""kaggle_wan_broll.py — generate 3-5 s b-roll clips on a free Kaggle GPU.

Model: Wan 2.2 TI2V-5B (Apache 2.0 — commercial use allowed, no licence risk).
It is the only strong open model that fits a 16 GB T4 / P100 without heroics.

KAGGLE QUICKSTART
  1. kaggle.com → Create → Notebook → Accelerator: GPU T4 x2 → Internet: On
  2. Paste this file's contents into a cell, or upload it as a .py and run:
         !pip install -q "diffusers>=0.35" transformers accelerate imageio[ffmpeg] safetensors
         !python kaggle_wan_broll.py --prompt "..." --out /kaggle/working/clip.mp4
  3. Download the mp4 from /kaggle/working (or save it as a notebook output).

WHAT IT IS GOOD FOR (see ACCESS_PLAYBOOK.md §3)
  atmosphere plates · fog · dust in a lamp beam · projector light · drifting smoke
  · vertical b-roll for the 9:16 cut.
  NOT for depicting real events, people or documents. Never.

NOTES
  * num_frames must be 4n+1 (81 = 3.4 s, 121 = 5.0 s at 24 fps).
  * T4 is Turing: bfloat16 is not supported, so we use float16 + cpu offload.
    P100 is also fp16-only. A100/L4/L40S can take bfloat16 — pass --bf16.
  * First run downloads ~10 GB of weights; Kaggle's disk is fine.
  * If the model id 404s, check the Hub for "Wan2.2-TI2V-5B-Diffusers" — the
    repo name has moved once already.
"""
from __future__ import annotations
import argparse, os, sys, time

def parse():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--image", default=None, help="optional start frame (image-to-video)")
    ap.add_argument("--out", default="broll.mp4")
    ap.add_argument("--model", default="Wan-AI/Wan2.2-TI2V-5B-Diffusers")
    ap.add_argument("--frames", type=int, default=81, help="4n+1")
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--guidance", type=float, default=5.0)
    ap.add_argument("--size", default="704x1280",
                    help="704x1280 landscape, 1280x704 portrait (native), 480x832 draft")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--bf16", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    return ap.parse_args()

def main():
    a = parse()
    w, h = (int(x) for x in a.size.lower().split("x"))
    if (a.frames - 1) % 4:
        sys.exit("--frames must be 4n+1 (81, 121, 161 …)")

    plan = dict(model=a.model, size=f"{w}x{h}", frames=a.frames,
                seconds=round(a.frames / 24.0, 2), steps=a.steps,
                guidance=a.guidance, seed=a.seed, out=a.out)
    print("PLAN", plan)
    if a.dry_run:
        return 0

    import torch
    try:
        from diffusers import WanImageToVideoPipeline, WanPipeline
        from diffusers.utils import export_to_video
    except Exception as e:                                    # noqa: BLE001
        sys.exit(f"diffusers import failed: {e}\n"
                 "pip install -U 'diffusers>=0.35' transformers accelerate imageio[ffmpeg]")
    from PIL import Image

    if not torch.cuda.is_available():
        sys.exit("No GPU. Kaggle → Settings → Accelerator → GPU T4 x2, then restart.")

    dtype = torch.bfloat16 if (a.bf16 and torch.cuda.is_bf16_supported()) else torch.float16
    print(f"device={torch.cuda.get_device_name(0)}  dtype={dtype}")

    t0 = time.time()
    if a.image:
        pipe = WanImageToVideoPipeline.from_pretrained(a.model, torch_dtype=dtype)
        pipe.enable_model_cpu_offload()
        pipe.vae.enable_tiling()
        img = Image.open(a.image).convert("RGB").resize((w, h))
        out = pipe(image=img, prompt=a.prompt, height=h, width=w,
                   num_frames=a.frames, num_inference_steps=a.steps,
                   guidance_scale=a.guidance,
                   generator=torch.Generator(device="cpu").manual_seed(a.seed))
        frames = out.frames[0]
    else:
        pipe = WanPipeline.from_pretrained(a.model, torch_dtype=dtype)
        pipe.enable_model_cpu_offload()
        pipe.vae.enable_tiling()
        out = pipe(prompt=a.prompt, height=h, width=w,
                   num_frames=a.frames, num_inference_steps=a.steps,
                   guidance_scale=a.guidance,
                   generator=torch.Generator(device="cpu").manual_seed(a.seed))
        frames = out.frames[0]

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    export_to_video(frames, a.out, fps=24)
    print(f"wrote {a.out} in {time.time()-t0:.0f}s  ({a.frames} frames, {a.frames/24:.2f}s)")
    print("now run:  python qa_pro.py " + a.out)
    return 0

if __name__ == "__main__":
    sys.exit(main())
