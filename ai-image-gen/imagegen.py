#!/usr/bin/env python3
"""
Top-ranked open-source image generator — Qwen-Image-Edit-2509 (the #1 ranked
open-source image editing model; multi-image, identity- and product-preserving).
Repo: https://github.com/QwenLM/Qwen-Image  ·  Model: Qwen/Qwen-Image-Edit-2509

Runs the model through hosted inference (this machine has no GPU). A FREE
Hugging Face token raises the GPU quota — create one at
https://huggingface.co/settings/tokens and pass it via --hf-token or $HF_TOKEN.

Usage:
  python3 imagegen.py person.jpg dress.jpg "<instruction>" out.png [seed] [height] [width]

Example (champagne dress swap):
  python3 imagegen.py model_pink.png dress_champagne.jpg \
    "Replace the outfit of the girl in the first image with the EXACT outfit shown in the second image..." \
    out.png 42 1600 896
"""
import os, sys, shutil
from gradio_client import Client, handle_file

SPACE_2509 = "Qwen/Qwen-Image-Edit-2509"   # multi-image (person + product)
SPACE_SINGLE = "Qwen/Qwen-Image-Edit"      # fallback, single image (240s slot)
# NOTE: Qwen-2509 endpoint asks a fixed 600s GPU slot (> free-tier max). If it
# errors "GPU duration larger than maximum", use SPACE_SINGLE or wait for
# ZeroGPU quota reset (~daily). Gemini alternative: gemini-3-pro-image via
# generativelanguage.googleapis.com (needs image billing enabled on the key).

DRESS_PROMPT = (
    "Replace the outfit of the girl in the first image with the EXACT outfit shown in the second image (a product photo of a dress). "
    "The new outfit is: a champagne beige silk anarkali kurta with small scattered gold motifs all over, a heavy ornate gold embroidered double-band border on the hem, "
    "gold embroidered cuffs on the sleeves, an embroidered neckline placket with gold work, matching champagne palazzo pants, "
    "and a deep purple dupatta with gold diamond lattice dotted thread work and thick gold embroidered borders draped over her shoulder. "
    "Reproduce the dress colors, fabric sheen, embroidery patterns and borders EXACTLY as in the second image. "
    "Keep the girl's face, smile, hair, maang tikka, necklace, earrings, bangles, pose, hands, gold jutti shoes, and the Hawa Mahal background EXACTLY unchanged. "
    "Do not change her face or the background or the pose at all."
)


def generate(person, garment, prompt, out, seed=42, height=1600, width=896):
    token = os.environ.get("HF_TOKEN") or None
    c = Client(SPACE_2509, token=token, verbose=False)
    res = c.predict(
        [
            {"image": handle_file(person), "caption": "the person"},
            {"image": handle_file(garment), "caption": "the outfit to put on the person"},
        ],
        prompt, seed, False, 4.0, 40, float(height), float(width), False,
        api_name="/infer",
    )
    gallery = res[0]
    item = gallery[0]
    p = item["image"]["path"] if isinstance(item, dict) and isinstance(item.get("image"), dict) else (item["image"] if isinstance(item, dict) else item)
    shutil.copy(p, out)
    return out


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(__doc__); sys.exit(1)
    person, garment = sys.argv[1], sys.argv[2]
    prompt = sys.argv[3] if sys.argv[3] != "DRESS" else DRESS_PROMPT
    out = sys.argv[4] if len(sys.argv) > 4 else "gen_out.png"
    seed = int(sys.argv[5]) if len(sys.argv) > 5 else 42
    h = int(sys.argv[6]) if len(sys.argv) > 6 else 1600
    w = int(sys.argv[7]) if len(sys.argv) > 7 else 896
    print(f"Qwen-Image-Edit-2509 | seed={seed} size={w}x{h}")
    print("Saved:", generate(person, garment, prompt, out, seed, h, w))
