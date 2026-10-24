# AI Image Generator — Virtual Try-On Toolkit

Professional AI image generation for fashion: put **any garment onto any person**, keeping the person's face, pose, jewellery and background intact while preserving the garment's embroidery, borders, colors and fabric detail.

**Model:** [IDM-VTON](https://github.com/yisol/IDM-VTON) — one of the best open-source virtual try-on models (detail-preserving diffusion try-on). Runs through hosted inference, so no GPU is needed.

## Quick start

```bash
pip install gradio_client pillow
python3 tryon.py <person_image> <garment_image> "<garment description>" <output.png> [seed]
```

Example (the champagne-suit generation in `docs/ai-image-gen/`):

```bash
python3 tryon.py model_pink.png dress_champagne.jpg \
  "A champagne beige silk anarkali suit set with scattered gold motifs, heavy ornate gold embroidered hem border, gold embroidered sleeve cuffs, embroidered neckline placket, champagne palazzo pants, and a deep purple dupatta with gold diamond lattice thread work and gold borders" \
  champagne_on_pink_final.png 123
```

## Tips for maximum detail retention

1. **Describe everything** — color, fabric, embroidery style, hem borders, dupatta color + pattern. The model follows the description to lock details.
2. **Try 2–3 seeds** (last arg) and pick the cleanest result.
3. Person photo: full body, good lighting, uncluttered pose.
4. Small artifacts (e.g. a shoe strap) can be color-corrected afterwards with a tiny PIL edit — ask the assistant.

## Outputs produced so far

| File (in `docs/ai-image-gen/`) | What it is |
|---|---|
| `champagne_on_pink_final.png` | Champagne anarkali + purple dupatta on the pink-dress girl (768×1376, true proportions) |
| `champagne_on_pink_2x.png` | Real-ESRGAN ×4 enhanced master (1536×2752) |
| `champagne_on_pink_2x.jpg` | Web-friendly copy |

Direct download links use the Pages base:
`https://earning-cpu.github.io/nightingale-films/ai-image-gen/<filename>`

**v2 update:** restored the model's true height (the try-on engine compresses output to 3:4 — pipeline now un-squashes to the source framing), repaired the shoe-strap artifact, and ran a Real-ESRGAN ×4plus detail-enhancement pass (onnx weights, SHA-verified).

**v3 update:** removed the Real-ESRGAN pass (it hallucinated different embroidery and over-processed the face). The image is now rebuilt from the pristine generation: true height, natural face, faithful dress details, repaired shoe strap. Installed `imagegen.py` — the #1 ranked open-source image editor **Qwen-Image-Edit-2509** (multi-image person+product swap) — set `HF_TOKEN` (free at huggingface.co/settings/tokens) to run unlimited swaps with high quota.
