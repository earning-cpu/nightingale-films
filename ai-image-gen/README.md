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
| `champagne_on_pink_final.png` | Champagne anarkali + purple dupatta on the pink-dress girl (768×1024) |
| `champagne_on_pink_2x.png` | 2× sharpened master (1536×2048) |
| `champagne_on_pink_2x.jpg` | Web-friendly copy |

Direct download links use the Pages base:
`https://earning-cpu.github.io/nightingale-films/ai-image-gen/<filename>`
