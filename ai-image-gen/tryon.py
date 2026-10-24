#!/usr/bin/env python3
"""
AI Virtual Try-On — professional garment-transfer image generator.

Uses IDM-VTON (https://github.com/yisol/IDM-VTON), one of the best open-source
detail-preserving virtual try-on models (diffusion + garment IP-adapter).
Runs via the model's hosted inference — no GPU needed on this machine.

Usage:
    python3 tryon.py <person_image> <garment_image> "<garment description>" <output.png> [seed]

Example:
    python3 tryon.py model_pink.png dress.jpg \
        "A champagne silk anarkali suit with gold embroidery and a purple dupatta" \
        out.png 123

Tips:
    - Run 2-3 different seeds and pick the cleanest result.
    - Describe the garment's color, fabric, embroidery, borders and any dupatta.
    - Person image: full body, clear pose, works best near 768px wide.
"""
import sys
import shutil
from gradio_client import Client, handle_file

SPACE = "yisol/IDM-VTON"   # demo of github.com/yisol/IDM-VTON
DEFAULT_DESC = "A beautiful traditional outfit with intricate embroidery"


def tryon(person: str, garment: str, desc: str, out: str, seed: float = 42) -> str:
    client = Client(SPACE, verbose=False)
    result, _ = client.predict(
        {"background": handle_file(person), "layers": [], "composite": handle_file(person)},
        handle_file(garment),
        desc,
        True,          # is_checked (remove background)
        False,         # is_checked_crop
        30,            # denoise steps
        seed,
        api_name="/tryon",
    )
    shutil.copy(result, out)
    return out


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    person, garment, desc = sys.argv[1], sys.argv[2], sys.argv[3]
    out = sys.argv[4] if len(sys.argv) > 4 else "tryon_out.png"
    seed = float(sys.argv[5]) if len(sys.argv) > 5 else 42
    print(f"Running IDM-VTON try-on (seed={seed})...")
    path = tryon(person, garment, desc or DEFAULT_DESC, out, seed)
    print("Saved:", path)
