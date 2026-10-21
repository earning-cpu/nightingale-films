#!/usr/bin/env python3
"""make_parallax.py — real 2.5D parallax from a single still.

Turns a photograph into a camera move with genuine depth separation by
warping each pixel according to a monocular depth map. No generation, no
fabrication: every pixel still comes from the original frame.

Run on Kaggle / Colab (GPU makes depth fast; CPU works too, ~10 s per frame).

    pip install -q transformers torch opencv-python-headless imageio[ffmpeg]
    python make_parallax.py in.jpg out.mp4 --seconds 4 --strength 0.035 --dir right

    # 9:16 vertical output
    python make_parallax.py in.jpg out_v.mp4 --aspect 9:16 --seconds 4

Why warp instead of layer-split: disocclusion holes at object edges are the
classic artefact of naive layer splitting. A depth-proportional warp with
edge-replicated borders produces no holes at the 2-5 % move sizes our rules
allow (see QUALITY_SYSTEM_V2.md P14/P21).
"""
from __future__ import annotations
import argparse, os, shutil, subprocess, sys
import numpy as np

def load_depth(path, model_id="depth-anything/Depth-Anything-V2-Small-hf"):
    """Return a float32 depth map in [0,1], 1 = near, 0 = far, same size as image."""
    import torch
    from PIL import Image
    from transformers import pipeline
    img = Image.open(path).convert("RGB")
    dev = 0 if torch.cuda.is_available() else -1
    pipe = pipeline("depth-estimation", model=model_id, device=dev)
    out = pipe(img)
    d = np.array(out["depth"], dtype=np.float32)
    d -= d.min()
    if d.max() > 0:
        d /= d.max()
    # Depth-Anything returns near = bright
    return d, np.array(img)

def warp_frames(img, depth, n_frames, strength, direction, ease="smooth"):
    """Yield RGB uint8 frames with a depth-proportional offset."""
    h, w = depth.shape
    yy, xx = np.meshgrid(np.arange(h, dtype=np.float32),
                         np.arange(w, dtype=np.float32), indexing="ij")
    # Normalise so the move is measured as a fraction of frame width
    vec = {"right": (1.0, 0.0), "left": (-1.0, 0.0),
           "up": (0.0, -1.0), "down": (0.0, 1.0),
           "in": (0.0, 0.0)}[direction]
    depth_scaled = np.clip(depth, 0, 1) ** 0.75       # gamma keeps midtones from flattening

    for i in range(n_frames):
        t = i / max(1, n_frames - 1)
        if ease == "smooth":
            t_e = t * t * (3 - 2 * t)                  # smoothstep: no jerk at either end
        else:
            t_e = t
        amp = strength * w * t_e                       # total move = strength * width
        if direction == "in":
            # dolly: scale about the centre, driven by depth
            s = 1.0 + strength * t_e
            cx, cy = (w - 1) / 2.0, (h - 1) / 2.0
            map_x = (xx - cx) / s + cx
            map_y = (yy - cy) / s + cy
        else:
            # parallax: near pixels move most, far pixels barely move
            off = amp * depth_scaled
            map_x = xx + off * vec[0]
            map_y = yy + off * vec[1]
        map_x = np.clip(map_x, 0, w - 1).astype(np.float32)
        map_y = np.clip(map_y, 0, h - 1).astype(np.float32)
        import cv2
        frame = cv2.remap(img, map_x, map_y, interpolation=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)
        yield frame

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("out")
    ap.add_argument("--seconds", type=float, default=4.0)
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--strength", type=float, default=0.035,
                    help="total move as a fraction of frame width (0.02-0.05 = premium)")
    ap.add_argument("--dir", default="right",
                    choices=["right", "left", "up", "down", "in"])
    ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16", "1:1"])
    ap.add_argument("--model", default="depth-anything/Depth-Anything-V2-Small-hf")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    if a.dry_run:
        print("would render", a.out, a.seconds, "s @", a.fps, "fps,", a.aspect,
              "strength", a.strength, "dir", a.dir)
        return 0

    import cv2
    sys.path.append(os.path.dirname(__file__))
    depth, rgb = load_depth(a.image, a.model)
    print(f"depth {depth.shape}  near-percentile {np.percentile(depth,95):.2f}")

    # target size
    tw, th = {"16:9": (1920, 1080), "9:16": (1080, 1920), "1:1": (1080, 1080)}[a.aspect]
    src_h, src_w = rgb.shape[:2]
    # centre-crop source to target aspect, then resize with 8 % overscan for the move
    target_ar = tw / th
    src_ar = src_w / src_h
    if src_ar > target_ar:
        new_w = int(src_h * target_ar); x0 = (src_w - new_w) // 2
        crop = rgb[:, x0:x0 + new_w]; dcrop = depth[:, x0:x0 + new_w]
    else:
        new_h = int(src_w / target_ar); y0 = (src_h - new_h) // 2
        crop = rgb[y0:y0 + new_h, :]; dcrop = depth[y0:y0 + new_h, :]
    over_w, over_h = int(tw * 1.08), int(th * 1.08)
    crop = cv2.resize(crop, (over_w, over_h), interpolation=cv2.INTER_LANCZOS4)
    dcrop = cv2.resize(dcrop, (over_w, over_h), interpolation=cv2.INTER_CUBIC)
    ox, oy = (over_w - tw) // 2, (over_h - th) // 2
    crop = crop[oy:oy + th, ox:ox + tw]
    dcrop = dcrop[oy:oy + th, ox:ox + tw]

    n = max(2, int(round(a.seconds * a.fps)))
    tmp = a.out + ".frames"
    os.makedirs(tmp, exist_ok=True)
    for i, fr in enumerate(warp_frames(crop, dcrop, n, a.strength, a.dir)):
        cv2.imwrite(os.path.join(tmp, f"{i:05d}.png"), cv2.cvtColor(fr, cv2.COLOR_RGB2BGR))

    cmd = ["ffmpeg", "-y", "-v", "error", "-framerate", str(a.fps),
           "-i", os.path.join(tmp, "%05d.png"),
           "-c:v", "libx264", "-preset", "slow", "-crf", "16",
           "-pix_fmt", "yuv420p",
           # libx264 only writes full VUI tags through x264-params — verified 2026-10-20
           "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
           a.out]
    subprocess.run(cmd, check=True)
    shutil.rmtree(tmp, ignore_errors=True)   # 200MB of PNGs per clip otherwise
    print("wrote", a.out, f"({n} frames, {n/a.fps:.2f}s)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
