#!/usr/bin/env python3
"""cut_layers.py — split a still into three real depth planes so the camera can
move with parallax that does NOT smear edges.

The v2 film warped every pixel of one plate by a depth-proportional offset.
At a depth discontinuity (a dish against sky) neighbouring pixels got different
offsets, so the edge *stretched*: the "moving edge" artefact. A warp displaces
pixels; it can never reveal the background that should appear behind a
foreground object.

This splits the plate into foreground / midground / background instead:

  * background = the plate with the foreground and midground painted out and
    inpainted, so it is a complete backdrop with nothing missing;
  * midground and foreground = RGBA cutouts, feathered by 2 px.

A compositor then moves the three planes by different amounts. When the
foreground slides, it uncovers *painted* background — no smear, no holes.

    python tools/cut_layers.py public/wow/img/c_01.png --out public/wow/layers

Outputs c_01_far.png (RGB), c_01_mid.png (RGBA), c_01_near.png (RGBA).
"""
from __future__ import annotations
import argparse, os, sys
import numpy as np

DEPTH_MODEL = "depth-anything/Depth-Anything-V2-Small-hf"


def load_depth(path):
    import torch
    from PIL import Image
    from transformers import pipeline
    img = Image.open(path).convert("RGB")
    dev = 0 if torch.cuda.is_available() else -1
    pipe = pipeline("depth-estimation", model=DEPTH_MODEL, device=dev)
    d = np.array(pipe(img)["depth"], dtype=np.float32)
    d -= d.min()
    if d.max() > 0:
        d /= d.max()
    return d, np.array(img)


def feathered(mask, px=2):
    import cv2
    m = (mask * 255).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    return cv2.GaussianBlur(m, (0, 0), px)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--out", default="public/wow/layers")
    ap.add_argument("--near", type=float, default=0.62, help="depth above this = foreground")
    ap.add_argument("--mid", type=float, default=0.40, help="depth above this = midground")
    a = ap.parse_args()
    import cv2
    from PIL import Image

    depth, rgb = load_depth(a.image)
    h, w = depth.shape
    os.makedirs(a.out, exist_ok=True)
    stem = os.path.splitext(os.path.basename(a.image))[0]

    near_m = feathered((depth > a.near).astype(np.float32), 2)
    mid_m = feathered(((depth > a.mid) & (depth <= a.near)).astype(np.float32), 3)

    # background: paint out everything that is not far, then inpaint it back in
    hole = (((depth > a.mid) * 255).astype(np.uint8))
    hole = cv2.dilate(hole, np.ones((7, 7), np.uint8))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    far = cv2.inpaint(bgr, hole, 9, cv2.INPAINT_TELEA)
    # large holes inpaint flat; a light blur keeps them from reading as smears
    far = cv2.GaussianBlur(far, (0, 0), 0.8)

    def rgba(img, alpha):
        b, g, r = cv2.split(img)
        return cv2.merge([b, g, r, alpha])

    cv2.imwrite(os.path.join(a.out, stem + "_far.png"), far,
                [cv2.IMWRITE_PNG_COMPRESSION, 9])
    cv2.imwrite(os.path.join(a.out, stem + "_mid.png"),
                rgba(bgr, mid_m), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    cv2.imwrite(os.path.join(a.out, stem + "_near.png"),
                rgba(bgr, near_m), [cv2.IMWRITE_PNG_COMPRESSION, 9])

    cov = (near_m > 40).mean() * 100, (mid_m > 40).mean() * 100
    print("%-14s %dx%d  near %.0f%%  mid %.0f%%  -> %s" %
          (stem, w, h, cov[0], cov[1], a.out))


if __name__ == "__main__":
    sys.exit(main())
