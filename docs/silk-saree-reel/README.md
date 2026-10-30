# Champagne Silk Saree — Glitch-Free Story Cut (TJF-S02)

**Reel length: 11.58s (4 bars @ 83 BPM)** — inside the 7–15s viral bracket (2026 data: highest completion rate 60–80%, 1.8× more replays than 60s+).

**Song:** "Mast Magan" · Arijit Singh & Chinmayi (2 States) — **83 BPM**, G major. #1 trending India sound (1.4M+ reels, Oct 2026).
**Upload flow:** post `_NOMUSIC` → add **Mast Magan** in-app → align the song's first beat to video 0:00 → cuts land on beats 2/5/8/11.

## Story (sequential, one action type per beat, ends mid-motion — no pause)
| Beat | Time | Story | Source window | Speed |
|---|---|---|---|---|
| 1–2 | 0.00–1.46 | She poses (arm extended) | a1 0.00–1.05 | 0.72× |
| 3–5 | 1.46–3.63 | She shows the drape (pallu flick) | b2 4.70–6.17 | 0.68× |
| 6–8 | 3.63–5.79 | She holds the gaze (settled sway) | b2 6.17–7.65 | 0.68× |
| 9–11 | 5.79–7.96 | She settles the look | a1 3.60–5.12 | 0.70× |
| 12–16 | 7.96–11.58 | She smiles (ends mid-sway ✓) | a1 7.20–9.73 | 0.70× |

## Glitch audit (every frame checked @5fps full-frame + @10fps dress crops)
CUT OUT (user-reported AI issues):
- **Floaty pallu "holding in air"**: a1 1.2–3.4, b2 1.0–3.4 (both flip windows removed)
- **Pattern morph** (held-out pallu goes plain gold vs motif-heavy in later frames): b2 1.2–2.8 removed
- **Drape pattern shift** at b2 0.5–0.6 and the re-gather at b2 4.0–4.5 (pallu reshapes over the front) — both avoided
- Every shipped window verified pattern-stable at 10fps dress/hand crops (w1/w2/w5/w6 sheets)

## Variants
- `reel_s02_MUSIC_REF.mp4` — Mast Magan baked (reference)
- `reel_s02_NOMUSIC.mp4` — soft 83 BPM beat bed (**upload this**)
- `reel_s02_SILENT.mp4` — no audio

Overlay: headline/underline top band, beat rings at edges, captions in bottom band — dress zone never covered, no price on screen.
