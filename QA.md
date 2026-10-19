# 🔬 Frame-by-frame QA — how a broken cut can never ship again

Everything in this repo is now checked automatically, at two stages.

## Stage 1 — before rendering (`check_timeline.py`)
Runs as a CI step **before** every cloud render. It parses the film source and fails the build if:

- any `InsertShot` cutaway cuts **in** or **out** while a text/stamp/graphic animation is mid-flight
- a cut would interrupt something the viewer can see starting

It checks against `qa_windows.json` — **58 animation windows measured directly from the source**
(every BlurWords stagger, Stamp land, typewriter, fade, counter and glitch, with exact frames).

```
timeline guard: 5 inserts checked against 58 animation windows
  img/insert_notes.jpg    248 →  312
  img/insert_radio.jpg    800 →  866
  img/insert_thermal.jpg 1150 → 1244
  img/insert_watch.jpg   1534 → 1586
  img/insert_newspaper.jpg 1930 → 1977
✅ PASS — every insert sits in a clean gap
```

## Stage 2 — after rendering (`qa_video.py`)
Decodes the **finished MP4 frame by frame** (every single frame, no sampling) and detects:

| Check | What it catches | v4 | v6 |
|---|---|---|---|
| **Cuts inside animations** | the "image changes mid-writing" glitch | 8 ❌ | **0 ✅** |
| **A→B→A returns** | an image that comes back after being replaced | 0 ✅ | **0 ✅** |
| **Frozen runs** | stalled/duplicate frames ≥5 long | 0 ✅ | **0 ✅** |
| **Boundary blinks** | a dark frame at a scene change (V-shape test) | 11 ❌ | **0 ✅** |
| **Black / blown-white frames** | dead frames | 0 ✅ | 0 ✅ (3 = intended blackout/end card) |
| **Stream + loudness** | container, fps, −14 LUFS | ✅ | ✅ |

Run it yourself on any file:
```bash
python3 qa_video.py path/to/video.mp4     # exit 1 = blocking issue, writes *_qa.json
```

## Bugs this caught (all fixed)

1. **Frequency-scene glitch (reported)** — cutaway hard-coded at frame 723, the readout starts at 721 → image swapped 2 frames after the readout appeared, then returned once text had finished placing. *Detected as cut @ 724 / @ 763 inside `S3`/`S4` windows.*
2. **Four more cutaways in the same condition** — S3 notebook (546), S5 macro (920, 959), S8 watch (1491), S10 clipping (1842).
3. **Black blink at all 11 scene boundaries** — `Seg` faded each scene out over 10 frames *and* the next in from 0, while scenes are back-to-back → one fully black frame per boundary (frame 875 measured luminance **9.2** vs **30** on both sides).
4. **Cutaway double-exposure** — inserts cross-faded, compositing two photos into a ghost image for 3 frames. Now a hard cut.
5. **Narration overlap** — two voices talking at once for 34 frames (S4/S5). Build now fails on overlap.

## Current status of the released cut (v6 / tag `nightingale-7`)

```
shots: 22   cuts: 21   frozen: 0   black: 0   white: 0
cuts inside animations: 0
A→B→A returns: 0
boundary blinks: 0
loudness: I=-14.02 LUFS  TP=-1.07 dBTP  LRA=3.60
✅ PASS — no blocking issues
```
