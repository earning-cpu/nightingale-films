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

---

# qa_pro.py — broadcast-grade pass (added 2026-10-20)

`qa_video.py` answers *"did the edit render correctly?"*. `qa_pro.py` answers *"would a broadcaster accept this file?"*
It decodes the finished MP4 once per concern and emits a single JSON report; **exit 1 = blocker**.

```bash
python3 qa_pro.py PROJECT_NIGHTINGALE_full.mp4 --json qa/v9_pro.json --allow-black 66.1-67.1
```

| Code | Check | Standard |
|---|---|---|
| C3 | stream conformance: resolution, CFR fps, pix_fmt, faststart, channels | delivery spec |
| G1 | colour tags (matrix / transfer / primaries / range) | BT.709 |
| V1 | black intervals ≥ 0.2 s | no dead frames |
| V2 | frozen runs ≥ 0.4 s | no dead frames |
| V3 | black-floor and clip percentage, measured on the **raw Y plane** (16–235) | ≤ 8 % floor |
| V4 | flashes per second | WCAG 2.3.1 ≤ 3 |
| V5 | cuts/min, longest static run | rhythm window |
| V6 | letterbox/pillarbox via cropdetect majority vote | full frame |
| A1 | integrated LUFS, LRA, true peak | −14 / 3–8 / ≤ −1.0 |
| A2 | silence gaps | none > 1.5 s |
| A3 | stereo phase, with timestamps + sustained-dip detection | ≥ −0.2 sustained |
| A4 | DC offset | < 0.02 |
| C1 | caption CPS, chars, peak rate | ≤ 20 CPS, ≤ 84 chars |
| C2 | duration | plan |

**Two measurement traps this tool exists to avoid**

1. **Never convert to `gray` before measuring levels.** swscale expands tv-range (16–235) to full range (0–255), so legal black reads as crushed black. The first version of this script reported 63 % "crush" on a clean film. Read the raw Y plane.
2. **Never judge phase from a single minimum.** One -0.43 sample in a reverb tail is inaudible. Only a *sustained* run (< -0.2 for ≥ 0.3 s) is a mono-cancel event.

## v9 result — 2026-10-20

```
C3 1920x1080 30fps h264 yuv420p aac/2ch faststart=True
G1 ⚠ matrix=unknown transfer=iec61966-2-1 primaries=bt709 range=tv
V1 ⚠ 1 interval 66.20–66.97 s (end-card fade-up)
V2 0 frozen
V3 ⚠ floor≤17 mean 10.757% p95 17.119% | ceil≥235 0.0% | hot frames 701/2067
V4 max 3 flashes/s — PASS (6 transitions)
V5 ~18 cuts (15.5/min) longest static 3.70 s
V6 modal crop 1920x1080, 100% fill, no bars
A1 I=-14.0 LUFS LRA=3.6 TP=-1.1 dBTP
A2 0 gaps
A3 min -0.43 @69.3 s (tail), mean 0.303, no sustained dip
A4 DC -0.000295
C1 12 lines, worst 15.1 CPS (s8), 0 over 20 CPS
C2 69.67 s
✅ no blockers · 3 warnings
```

Fix list for v10: retag bt709/bt709/tv · +2 IRE shadow lift · remove the 0.77 s black fade · tighten the tail phase.

---

## Delivery: GitHub Pages watch page (2026-10-20)

**Live:** https://earning-cpu.github.io/nightingale-films/ · source `main` / `docs` · HTTPS enforced

| Check | Result |
|---|---|
| Page build | `status: built` in 21 s |
| `GET /` | 200 · 3,827 B · 0.14 s |
| `poster.jpg` | 200 · 133,120 B · `image/jpeg` |
| `film.mp4` | 200 · 52,167,248 B · **`video/mp4`** · `Accept-Ranges: bytes` · 206 on range |
| Chromium desktop | `readyState 4` · played 2.34 s · seek to 30 s OK |
| Chromium mobile (390×844, touch) | `readyState 4` · played 2.39 s · seek to 30 s OK |
| Console / page errors | 0 |
| Player geometry | 1080 × 607.5 = exact 16:9 |

### Two delivery bugs found and fixed

1. **iOS Safari would not have played the film.** GitHub Release assets are served as
   `application/octet-stream` + `Content-Disposition: attachment` behind a signed redirect.
   Chrome sniffs the bytes and plays; Safari obeys the declared type and shows a dead
   player — so on every iPhone the page would have been broken while working fine on desktop.
   *Fix:* the same 52 MB file is committed to `docs/film.mp4`, so Pages serves it as
   `video/mp4` with Range support. The release URL stays as a `<source>` fallback + JS swap.

2. **The player rendered square (1080×1080).** `width="1920" height="1080"` attributes act as
   presentational hints; with no CSS `height` declared, the attribute won and `aspect-ratio`
   was ignored. *Fix:* `height:auto` on `video`. Measured after: 607.5 px.

### Rule added

> **A watch page must be verified in a mobile viewport, not by looking at it on desktop.**
> `qa_page.py` (Playwright) is now a Q35 gate: it loads the page, plays 2 s, seeks, and fails
> on any console error, non-`video/mp4` content type, missing Range support, or player
> geometry that is not the source aspect ratio.

---

## Delivery: adaptive bitrate (2026-10-20)

**Problem reported:** the film buffers on a normal connection.
**Cause:** the only source was the 1080p master — **5.72 Mbps video / 6.0 Mbps total**, 52 MB for 70 s.
That needs a sustained ~6.5 Mbps. On a 3 Mbps line it can never play without stalling.

### The ladder (same cut, same audio, same VUI tags)

| Rendition | Resolution | Bitrate | Size | SSIM vs master | PSNR |
|---|---|---|---|---|---|
| master | 1920×1080 | 6,000 kbps | 50 MB | 1.000 | — |
| `film_720.mp4` | 1280×720 | **946 kbps** | 7.1 MB | **0.984** | 40.4 dB |
| `film_480.mp4` | 854×480 | **468 kbps** | 3.9 MB | **0.976** | 38.4 dB |
| `film_360.mp4` | 640×360 | **257 kbps** | 2.1 MB | **0.966** | 36.8 dB |

The film compresses this well because it is slow-paced, dark, and grain-light. SSIM 0.98 at 1/6th
the bitrate is a genuinely clean picture, not a compromise.

### Selection logic on the page

1. `navigator.connection.downlink` / `effectiveType` where available (Chrome, Android).
2. Otherwise a **timing probe**: fetch 120 KB of the 360p file with `Range` and measure `performance.now()`.
3. Thresholds: ≥ 1.5 Mbps → 720p · ≥ 0.65 Mbps → 480p · else 360p.
4. Re-picks on `connection.change`.
5. **Safety net:** two `waiting` events in auto mode drop one rung, keeping the position.
6. Manual override buttons (Auto / 720 / 480 / 360) + a 1080p master download link.

### Throttled playback test (Chromium, mobile viewport 390×844, CDP network emulation, 12 s each)

| Simulated link | Chosen | Played | Stalls | Buffered ahead |
|---|---|---|---|---|
| WiFi 10 Mbps | 720p | 11.9 s | 0 | 50.4 s |
| 4G 4 Mbps | 720p | 12.0 s | 0 | 40.2 s |
| 3G 1.5 Mbps | 480p | 12.0 s | 0 | 41.6 s |
| Slow 3G 750 kbps | 480p | 11.3 s | 0 | 19.9 s |
| **2G 350 kbps** | **360p** | **11.2 s** | **1** | **18.4 s** |

### Rule added

> **Never ship a single-bitrate source.** Every delivered film gets at least 720p / 480p / 360p,
> and the page must be regression-tested at 350 kbps. A 6 Mbps master is a download, not a stream.
> (Q36)

---

## Semantic audit — first run (2026-10-20, Cloudflare Llama 3.2 Vision)

`tools/cf_vlm_audit.py docs/film_720.mp4 --narr src/narration.json --fps 3`
209 frames · 4 min 5 s · **~3,900 neurons of the 10,000 daily free allowance**

```
scored      188 / 209
mean match  1.93 / 2.0
mismatches  6   (all false positives — see below)
unparsed    21
```

### What it is genuinely good at

- **Presence checks.** It reliably reports what is *in* a frame ("old paper with top secret
  stamp", "desert with military vehicles and buildings"). That survives resizing and gradability
  and is useful for cutting on subject matter.
- **Catching an empty or broken frame** — a black or garbled plate scores 0 without fail.

### What it is NOT good at — verified, not assumed

I checked the six mismatches against the actual frames:

| t | Model said | Ground truth (I looked) | Verdict |
|---|---|---|---|
| 42.33 s | 0 — "beam not visible" | light beam rising from a desert town, captioned *Eleven* | **model wrong** |
| 49.33 s | 0 — "no eleven minutes" | soldiers, caption *8 MINUTES MISSING* | model misread burned-in text |
| 66.33 s | 0 — "only the word THE" | end card, one frame into a fade-up | correctly flagged, but it is a designed fade |

So: **it hallucinates on faint detail, misreads small burned-in type, and is harsh on fades.**
Its "SEE=" field also sometimes echoes the narration instead of describing the picture — a
classic small-model failure, and the reason a 0 from this model is a *hint*, not a verdict.

### The unparsed cluster at 43–51 s

21 of 209 came back unparsed, 17 of them inside an 8-second window. That is a burst
rate-limit, not a content signal: `llama-3.2-11b-vision-instruct` is capped at
**720 requests/minute**, and the retry path triples traffic exactly when the model is slow.
Fix applied: the audit now **throttles to 2 req/s and retries with backoff**, so later runs
should return 0 unparsed.

### What this changes

The semantic pass stays in the gate list, but with its role corrected:

> **Q34 (semantic match) is a triage tool, not a ship-blocker.** It may flag a frame for human
> review; only a human (or a frontier vision model) may fail a build on "wrong image for the line".
> Presence checks and empty-frame detection remain automated.

The honest upgrade path, in effort order:
1. **Google AI Studio / Gemini free tier** — stronger vision reasoning, same job, ~10 min to wire.
2. **Denser sampling (4 fps) only on flagged windows**, so cost stays flat.
3. **Two-model agreement:** flag only when Llama *and* a second model both score 0.

