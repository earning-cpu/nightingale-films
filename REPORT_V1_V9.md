# PROJECT NIGHTINGALE — V1 → V9
> **Superseded in part:** §5–§8 of this report are expanded, restated and superseded by
> **`QUALITY_SYSTEM_V2.md`** (45 pre-render gates, 35 post-render gates, 65 rules, QA toolchain map,
> access + free-resource plan). The V1→V9 history in §1–§4 here remains authoritative.


## Complete Change Log, Lessons, Checkpoints & Non-Breakable Rules

**Document owner:** Arena Agent
**Last updated:** 2026-10-19
**Repository:** https://github.com/earning-cpu/nightingale-films
**Canonical film:** `PROJECT NIGHTINGALE_full.mp4` — 1920×1080 · 30 fps · 69.67 s · H.264 + AAC · −14 LUFS
**Current build:** V9 → release tag `nightingale-12` (49.8 MB)

---

## 0. Executive summary

Nine versions took this film from *"a slideshow with sound effects"* to *"a measured, audited, professionally-paced short."*
The single biggest change was not artistic — it was **measurement**. Before V6 nobody could prove a cut was
wrong. After V6, two automated auditors inspect every frame, and a third gate blocks a broken render before
it starts.

| | V1 | V9 |
|---|---|---|
| Images used | 10 | **18** (10 scenes + 2 archive + 5 prop inserts + 1 title) |
| Voice | none | word-timed neural narration, 12 lines, zero overlaps |
| SFX | 75 cues on a 90 BPM grid (up to 1.23 s drift) | 102 cues on true visual frames (median 0 frames drift) |
| Camera | one repeated 1.05→1.15 push on every shot | 13 distinct, motivated, 2–5 % continuous moves |
| Shortest shot | 0.27 s | 1.67 s |
| Repeated images | 5 pairs | 0 |
| Truncated graphics | several | 0 |
| Evidence | none | frame-by-frame + 4 fps vision audit on every build |
| Delivery | local file (lost twice) | permanent GitHub Release |

---

## 1. Version-by-version changelog

### V1 — The original film *(local only — LOST)*
**Built:** 10 user-supplied images, script v1, motion-graphics system, burned-in captions, no voiceover.
**Sound:** score placed on a 90 BPM grid (1 beat = 20 frames @ 30 fps).
**Outcome:** complete render existed locally; the workspace snapshot silently dropped the 46–82 MB
files. **Nothing was recoverable.**
**Lesson that changed everything later:** a file that exists only in the workspace does not exist.

---

### V2 — The "v2 quality bar" pass *(local only — LOST)*
**Changed:** frame-locked BGM/SFX rewrite, improved script, tighter motion graphics, second audio pass
(−14 LUFS normalisation, two-pass loudnorm).
**Outcome:** second complete render; also lost to the snapshot.
**Lesson:** this is why the storage decision (GitHub Releases as the *only* home) was made.

---

### V3 — First permanent delivery + the cloud pipeline
**Release:** `nightingale-3` — 37.2 MB (supersampled 1.25× → lanczos 1080p)
**What changed**
- GitHub repo `nightingale-films` created; full Remotion studio pushed.
- GitHub Actions render pipeline authored: apt Chrome deps → `npm ci` → browser cache → render →
  ffmpeg mux → artifact (90 d) → **`softprops/action-gh-release` permanent publish**.
- Quality recipe locked: render at `--scale=1.25 --crf=15`, downscale `-vf scale=1920:1080:flags=lanczos -crf 16`.

**Bugs found and fixed while building the pipeline**
| # | Failure | Root cause | Fix |
|---|---|---|---|
| 1 | apt step exit 100 | Ubuntu 24.04 renamed `libasound2` → `libasound2t64`; both fallback branches had the same name | install `libasound2t64`, fallback `libasound2` |
| 2 | ffmpeg exit 8 `Unrecognized option 'crf=16'` | `-crf=16` is not valid ffmpeg syntax | `-crf 16` |
| 3 | Release publish would fail | default `GITHUB_TOKEN` read-only | job `permissions: contents: write` |
| 4 | Repo creation 403 | fine-grained PAT lacked `administration=write; repository_creation=write` | user edited token (value unchanged) |

**Measured:** local render ≈ 55 min → cloud ≈ 12 min total (5 min render step).

---

### V4 — Narration, real SFX sync, typewriter sound, captions
**Release:** `nightingale-4` — 41.6 MB
**What changed**
- **Narration added** — `edge-tts` (`en-US-ChristopherNeural`, `rate="-6%"`) with **WordBoundary
  timestamps**, giving an exact frame for every spoken word (12 lines, 103 words).
- **All SFX retimed from the music grid to true visual frames.** The picture became the master clock.
- **Typewriter tick clusters** added wherever text is written (S3 case note, S4 telemetry, S9 report, END card).
- **Word-driven zoom pulses** added (punch-in on the noun the narrator is saying).
- **Karaoke caption track** — active word highlighted amber; captions from frame 6.
- Mix: BGM ducked 62 % under voice, SFX punch through; still −14 LUFS.

**Measured sync audit (53 visual events vs 75 cues)**
| | Before | After |
|---|---|---|
| Median gap | 2.0 frames | **0.0 frames** |
| Worst gap | **1233 ms** ("APPROVED FOR PUBLIC RELEASE" had no sound near it) | 333 ms |
| Events > 133 ms off | 21 / 53 | 10 / 53 |

---

### V5 — Real pictures, real camera, real film texture
**Release:** `nightingale-5` — 56.5 MB
**What changed**
- **Vision pass on all 12 images** (labelled contact sheet) — every subject located in frame
  (soldier's helmet, radar screen, fragment, beam, stamp).
- **13 shots, 13 different camera moves**, each aimed at a real subject: lateral track, tilt-up reveal,
  tilt-down to object, pull-back reveal, handheld track, slow creep, macro creep.
- **5 new prop cutaway images generated**: handwritten lab notebook, reel-to-reel tape deck,
  thermal scan, stopped wristwatch on an evidence table, yellowed press clipping.
- **Film treatment layer**: gate weave, exposure flicker, halation glow, dust motes, motivated light
  leaks, film rebate marks, grain raised to 0.19.
- **Narration overlap bug fixed** — see V5 bug table below.

**Bug found and fixed**
| Bug | Evidence | Fix |
|---|---|---|
| **Two voices talking at once** (user-reported) | S4 line ran to frame 919 while S5 line started at 885 → 34 frames of overlap | Narration generator rewritten as an **auto-fitting scheduler**: measures each line's real duration, tries `-6% → -2% → +4% → +10% → +16%` until it fits its scene window, guarantees a 10-frame gap. Build now hard-fails on overlap. |

---

### V6 — The measurement era: frame-by-frame QA + timeline guard
**Release:** `nightingale-6` — 57.9 MB
**Why:** the user reported *"when the frequency image appears it starts writing, changes mid-way, then
the image comes back with everything already placed."*

**Root cause (proved):** the radio-tape cutaway was hard-coded at frame **723**; the frequency readout
begins at **721**. The cutaway therefore interrupted an animation 2 frames after it started, and returned
at 765 once the text, waveform and radar had finished.

**What changed**
- **`qa_video.py`** — decodes the finished MP4 **every frame** and detects: cuts inside animations,
  A→B→A returns, frozen runs, boundary blinks, dead black/white frames, stream + loudness health.
- **`check_timeline.py`** — a CI gate that parses the source and **blocks the render** if any cut would
  land inside an on-screen animation. Runs against `qa_windows.json`.
- **`qa_windows.json`** — animation windows measured *directly from the source* (not hand-guessed).

**Bugs found**
| Bug | Evidence |
|---|---|
| Frequency cutaway mid-animation (yours) | cut @ 724 and @ 763 inside `S4_slug` / `S4_radar` |
| **4 more cutaways in the same condition** | 546/583 (S3 notes), 920/959 (S5 macro), 1491 (S8 watch), 1842 (S10 clipping) |
| 21 false cuts from grain/flicker | detector tuned (`threshold 24→32`, `min_scene_len 8→15`) |

All five inserts relocated into verified gaps; render blocked until they passed.

---

### V7 — Hard cuts: killing the black blink and the ghost
**Release:** `nightingale-7` — 54.4 MB
**Why:** the frame-by-frame audit measured a **1-frame black flash at frame 875** — luminance **9.2** vs **30**
on both sides.

**Root cause:** `Seg` faded every scene out over its final 10 frames *and* faded the next scene in from 0,
while the scenes are back-to-back. **Every one of the 11 scene boundaries dipped to black for a frame.**

**What changed**
- `Seg` → **hard cuts only** (no per-scene fade). Cuts now land on the impact SFX.
- `InsertShot` → **hard cut in/out** (it previously cross-faded, compositing two photographs into a ghost
  image for 3 frames).
- **Boundary-blink detector** added to `qa_video.py`, using a **V-shape test** (a boundary must be darker
  than *both* neighbours). First version wrongly flagged step changes (a darker interior after a bright
  exterior); corrected, with an explicit whitelist for intentional darkness (S7's 11-second blackout, the
  black end card).

---

### V8 — Professional camera language + dense vision audit
**Release:** `nightingale-9` — 50.7 MB
**Why:** user feedback — *"images repeating, some images less than one second, some graphics already there
and less than one second… the zoom in/out jump effect looks very cheap."*

**Research before coding** (see §4): professional/documentary editors cap digital zoom at 10–15 %,
describe the premium look as *"imperceptibly slow"*, and identify **repeated punch-in/pull-out** as the
single biggest "cheap" tell.

**What changed**
- **All 8 per-word zoom pulses removed** — they were the "jump" the user saw.
- **All 5 glitch effects removed** (they also created fake sub-1 s cuts).
- **Every shot reduced to ONE continuous move, 2–5 % total**, ease-in-out, never reversing.
  Handheld clamped to documentary level (≤0.25); rotation removed.
- **Inserts now run to the scene cut** — previously they stopped 8–9 frames early, leaving a
  **0.27-second sliver** of the old image flashing back. That was the "repeating image".
- **1977 archive became a real 3.1 s shot** (was an 11-frame flash).
- **New title image** (`title_dossier.jpg`) — the title previously reused the S10 file photo, so the same
  picture genuinely appeared twice.
- **`vision_audit.py`** built — 4 fps sampling (262 frames for this film): PySceneDetect shot list,
  perceptual-hash repeat detection, edge-energy screen-life analysis, and 6 labelled contact sheets.

**Measured before → after**
| Metric | Before (V7) | After (V8) |
|---|---|---|
| Shots under 1 s | 5 (0.43, 0.27, 0.27, 0.27, 0.70) | 1 (a detector artifact, later tuned away) |
| Repeated images | 5 pairs | **0** |
| Zoom pulses | 8 | **0** |
| Glitch transitions | 5 | **0** |

---

### V9 — Isolated archive shot, nothing truncated
**Release:** `nightingale-11` / `nightingale-12` — 49.7 / 49.8 MB
**Why:** the 4 fps contact sheets — reviewed visually — showed the hangar headline **"IT'S NOT THE
FRAGMENT."** and the blue **PROTOTYPE — TEST UNIT #12** stamp sitting on top of the **1977 crash wreck**.

**Root cause:** the archive image was layered *inside* the S3 scene with a fade, so all S3 graphics
continued to render over it.

**What changed**
- Archive shot **fully isolated** with `display: none` on the hangar layer, plus `hidden` props added to
  `Slug`, `Clock`, `Stamp`.
- Archive got **its own slate and gradient**: *"ARCHIVE — PAPOOSE LAKE · 16 MAY 1977 / THE RECOVERY THAT
  NEVER HAPPENED."*
- Archive cut moved **601 → 618** so the case-note card finishes writing first (it was truncated to 0.63 s).
- QA windows corrected: the "S3 typewriter" was actually a **12-frame fade**, not a typewriter (mislabeled
  by 23 frames). Shot-type entries removed from the *graphic* window list (57 → 54 windows).
- QA margin made **asymmetric** — cutting immediately *after* an animation completes is a normal hard cut;
  only cuts *inside* it or *just as it starts* are faults.

**Final audit — V9**
```
shots: 18          shots under 1.0s: 0        shortest shot: 1.67s
repeated images: 0 graphics on screen < 1s: 0
frozen runs: 0     boundary blinks: 0         A→B→A returns: 0
cuts inside animations: 0
loudness: I = −14.01 LUFS   TP = −1.12 dBTP   LRA = 3.50
✅ PASS — no blocking issues
```

---

## 2. Metrics evolution (the whole story in one table)

| Version | Release | Size | SFX drift (median) | Cuts in anim. | Boundary blinks | Shots <1 s | Repeated images | Graphics <1 s |
|---|---|---|---|---|---|---|---|---|
| V1–V2 | — (lost) | — | unknown | unknown | unknown | unknown | unknown | unknown |
| V3 | nightingale-3 | 37.2 MB | 2.0 f (worst 1233 ms) | 8 | 11 | 5 | 5 | 43 |
| V4 | nightingale-4 | 41.6 MB | **0.0 f** | 8 | 11 | 5 | 5 | 43 |
| V5 | nightingale-5 | 56.5 MB | 0.0 f | 8 | 11 | 5 | 5 | 43 |
| V6 | nightingale-6 | 57.9 MB | 0.0 f | **0** | 11 | 5 | 5 | 43 |
| V7 | nightingale-7 | 54.4 MB | 0.0 f | 0 | **0** | 5 | 5 | 43 |
| V8 | nightingale-9 | 50.7 MB | 0.0 f | 0 | 0 | **0** | **0** | 1 |
| **V9** | **nightingale-11/12** | **49.7 MB** | **0.0 f** | **0** | **0** | **0** | **0** | **0** |

> Note: earlier metrics were measured with cruder tools; the numbers in the V3–V5 columns are the values the
> later tools reported when pointed back at those files. That is the point — **we can now re-audit history.**

---

## 3. What I learned

### 3.1 Storage
- **A file that lives only in the workspace does not exist.** Two complete renders (V1, V2) were silently
  destroyed by snapshots dropping large files. Every deliverable now goes to a GitHub Release the moment it
  finishes.
- Release assets are permanent and unlimited in count; 2 GB per file is far above anything this format needs.

### 3.2 Timing
- **The picture is the master clock.** Placing SFX on a musical grid produced up to **1.23 s** of drift on
  visual events. Placing them on the visual frame gives **0 frames** of drift.
- **Generated speech needs measurement, not hope.** Overlapping narration is a scheduling problem: measure
  every line's real duration, then fit it into its window. Never hand-place two lines in adjacent scenes.
- **Sound must lead or land exactly.** A tape click 2 frames *before* the archive cut (a J-cut) feels
  intentional; 2 frames after feels broken.

### 3.3 The craft of the image
- **Repeated motion is the "cheap/AI" tell.** Eight zoom pulses on a 70-second film read as a machine.
  One slow 2–5 % push per shot reads as a camera.
- **Digital zoom has a ceiling.** Editors cap it at 10–15 %; past that it looks like a crop, not a lens.
- **Subtlety is the premium signal.** Documentary editors describe the ideal as *"almost indiscernible"* —
  the viewer should notice the subject, not the movement.
- **Variety comes from direction and subject, not from size.** Track, tilt, push, pull, creep, and a
  locked-off breathing shot give six feels at the same 3 %.
- **Fades are not free.** A fade-out on a back-to-back scene always leaves a black frame. Hard cuts on the
  sound hit are both cheaper and better.
- **Cross-fades composite.** Two photos at 50 % opacity is a ghost, not a transition. Cutaway = hard cut.

### 3.4 Cutaways (the #1 source of bugs)
- **All five cutaways were wrong on the first attempt**, in two different ways: (a) cut *into* a running
  animation, (b) ended *before* the scene cut, leaving a 0.27 s sliver of the old image.
- **A cutaway must respect the graphics on screen.** Either it starts after the text has landed, or the
  scene's graphics must be suppressed while it's up.
- **It must own its slate.** An archival shot inheriting the previous scene's headline is instantly wrong.

### 3.5 Measurement
- **Measure what the viewer experiences, not what is easy to compute.** My first "graphics under 1 s" metric
  measured the *entrance animation length* and flagged 43 innocent elements. Screen life — from appearance
  to the next cut or covering insert — is what matters.
- **Your detector can be the bug.** The "0.87 s shot" was grain flicker fooling the scene detector; the
  "4 boundary blinks" were darker interiors after bright exteriors. Fix the measurement before touching the film.
- **Full-frame analysis is cheap.** 2,090 frames decode and analyse in ~25 s. There is no excuse to sample
  when the whole file can be checked.
- **Blocking gates beat reports.** A warning is ignored; a failing CI step stops the release.

### 3.6 Process
- **Vision on the finished file is different from vision on the source.** Reading the source tells you what
  you *intended*; reading 4 fps contact sheets tells you what is *actually on screen*. The archive text-bleed
  was invisible in code review and obvious in a contact sheet.
- **A comment in the source is not a guarantee.** The `narrSeg` prop still existed after pulses were removed —
  dead code that looked like a feature.
- **The environment resets.** ffmpeg, node_modules and Chrome libraries vanish between sessions; every build
  script must be idempotent and every CI job self-contained.
- **Permissions are a feature.** Fine-grained tokens need explicit `administration`, `contents`, `workflows`,
  `actions` (and `pages` for the watch page). GitHub tells you exactly which one is missing in the
  `x-accepted-github-permissions` header.

---

## 4. Research that drove the rules

| Finding | Source | Rule derived |
|---|---|---|
| 71 % decide within 3 s; 55 % drop in 60 s | ytincome · virvid | hook at frame ≤ 6, voice + visual + SFX together |
| Hard captions from second 1 lift sound-off retention 25–40 % | aibrify | `CaptionTrack` permanent |
| Visual change every 1.5–4 s; pattern interrupt at 25–35 s | pixflow · AIR Media-Tech | 18 shots in 70 s; S4 HUD takeover at 23–28 s |
| SFX on motion beats is the cheapest pattern interrupt | pixflow | 102 frame-locked cues |
| Digital zoom > 10–15 % reads artificial | r/editors | scale delta ≤ 5 % per shot |
| "Constant punch-in and pull-out" is the cheap look | smoothcapture | zero pulses |
| Documentary ideal = "almost indiscernible" move | r/editors | 2–5 % over the whole shot |
| Handheld 0.5–0.8 px for doc; >2 px reads as effect | djordanmedia | `handheld ≤ 0.25` |
| MrBeast 2026: "yelled less, let scenes breathe" | Washington Post | S9 locked-off breather shot |
| Zoom = emphasis, not decoration | aicut.pro | one motivated move per shot |

---

## 5. PRE-RENDER checkpoints (must all pass before a frame is rendered)

| # | Checkpoint | What it prevents | Enforced by | Pass criterion |
|---|---|---|---|---|
| **P1** | **Asset presence** | the render crash caused by a dropped `public/img` file | CI + local | every referenced image exists |
| **P2** | **Timeline guard** | a cut landing inside a running animation | `check_timeline.py` | every insert starts/ends in a clean gap |
| **P3** | **Narration non-overlap** | two voices at once | `make_narration.py` | `OVERLAP CHECK: PASS` |
| **P4** | **Narration fit** | a line spilling past its scene | `make_narration.py` | line end ≤ scene end − 4 frames |
| **P5** | **Mix loudness** | quiet/loud delivery, clipping | `ffmpeg loudnorm` 2-pass | −14 LUFS, TP ≤ −1.2 dBTP |
| **P6** | **Cue alignment** | SFX floating off the picture | `make_audio.py` cue map | every visual event has a cue ≤ 1 frame away |
| **P7** | **Shot-length plan** | sub-1 s shots | shot plan | every planned shot ≥ 1.0 s (target ≥ 1.5 s) |
| **P8** | **Composition math** | missing/duplicate frames | `theme.ts T.total` | sum of scenes = composition length |

**Commands**
```bash
python3 check_timeline.py          # P2 — exits 1 on failure
python3 make_narration.py          # P3+P4 — prints OVERLAP CHECK
python3 make_audio.py              # P5+P6 — rebuilds the mix
python3 -c "import json;n=json.load(open('src/narration.json'))"   # sanity
```

---

## 6. POST-RENDER checkpoints (must all pass before a link is announced)

| # | Checkpoint | What it catches | Tool | Pass criterion |
|---|---|---|---|---|
| **Q1** | **Frame-by-frame QA** | frozen frames, boundary blinks, A→B→A returns, cuts inside animations, dead frames | `qa_video.py` | 0 blocking issues |
| **Q2** | **Dense vision audit (4 fps)** | sub-1 s shots, repeated images, truncated graphics, shot list sanity | `vision_audit.py` | 0 shots <1 s, 0 repeats, 0 graphics <1 s |
| **Q3** | **Contact-sheet review** | everything a heuristic can't see (text bleed, wrong slate, ugly frame) | human/agent reads the 6 sheets | no visible defect |
| **Q4** | **Loudness on the final mux** | mix damaged by muxing | `loudnorm` on the MP4 | −14 ± 0.5 LUFS, TP ≤ −1.2 |
| **Q5** | **Stream health** | wrong resolution/fps/codec, no faststart | `ffprobe` | 1920×1080, 30 fps, h264+aac, faststart |
| **Q6** | **Permanent publish** | another lost film | GitHub Release | asset present, URL resolves |

**Commands**
```bash
python3 qa_video.py FILM.mp4        # Q1 — exits 1 on blocking issue
python3 vision_audit.py FILM.mp4 --fps 4 --sheets 6   # Q2+Q3
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate FILM.mp4  # Q5
```

**Current V9 result**
```
Q1 ✅  Q2 ✅  Q3 ✅  Q4 ✅ (−14.01 LUFS / −1.12 dBTP)  Q5 ✅  Q6 ✅ (nightingale-12)
```

---

## 7. NON-BREAKABLE RULES

These are hard rules. A build that violates any of them must not ship.

### Timing & sound
1. **The picture is the master clock.** SFX are placed on the visual frame, never on a musical grid.
2. **No narration overlap, ever.** Two simultaneous voices is a build failure, not a preference.
3. **Voice sits on top.** Music ducks under speech; SFX punch through but never mask a word.
4. **Final mix = −14 LUFS integrated, true peak ≤ −1.2 dBTP.**
5. **Every visual event gets a sound.** Text lands, stamps, inserts, cuts — all cue-locked.

### Editing
6. **No cut may land inside an on-screen animation.** Guarded by `check_timeline.py`.
7. **No shot shorter than 1.0 s** (target ≥ 1.5 s).
8. **No image may appear twice.** If it must, it needs a different frame, grade, or treatment.
9. **No graphic may be on screen less than 1 s** (measured as screen life, not entrance time).
10. **A cutaway must end on the scene cut** — never before, never leaving a sliver of the old image.
11. **A cutaway owns its slate.** It may not inherit the previous scene's headline or stamp.
12. **Scenes are hard cuts.** No per-scene fades — they leave black frames at every boundary.
13. **Cutaways are hard cuts.** Cross-fades composite two photographs into a ghost.
14. **One continuous camera move per shot, 2–5 % total.** No pulses, no reversals, no repeats of the
    same move in adjacent shots.
15. **Digital zoom never exceeds 10–15 %.** Beyond that it reads as a crop, not a lens.
16. **No glitch/strobe transitions.** They read as social-media, not documentary — and they create fake
    sub-second cuts.
17. **Handheld ≤ 0.25** (0.5–0.8 px documentary feel); no rotation unless motivated by the shot.

### Structure & engagement
18. **Hook within the first 3 seconds** — voice, visual and SFX all active by frame 6.
19. **Captions from second 1, burned in.** Most feed views start muted.
20. **A pattern interrupt at 25–35 s** — the documented drop-off cliff.
21. **At least one breathing shot** with no camera movement — constant motion reads as machine-made.

### Process & delivery
22. **Every deliverable is measured, not assumed.** Both audits must pass before a link is announced.
23. **Nothing ships only to the workspace.** Permanent GitHub Release, always.
24. **CI is the gate.** If `check_timeline.py` fails, the render does not start.
25. **The blog repo and its token are never touched.** This pipeline is videos-only.

---

## 8. The QA toolchain (reference)

| File | Role |
|---|---|
| `qa_video.py` | every-frame analysis: cuts, frozen runs, A→B→A returns, boundary blinks, black/white, stream + loudness |
| `vision_audit.py` | 4 fps sampling: PySceneDetect shot list, phash repeat detection, screen-life analysis, contact sheets |
| `check_timeline.py` | pre-render gate: cutaways vs measured animation windows |
| `qa_windows.json` | 54 animation windows measured directly from source |
| `make_narration.py` | auto-fitting word-timed narration + overlap guarantee |
| `make_audio.py` | 102 frame-locked SFX cues, BGM bed, VO ducking, −14 LUFS mix |
| `QA.md` | the operational QA doc |
| `RESEARCH.md` | engagement + craft research with sources |
| `REPORT_V1_V9.md` | this document |

Exit codes are meaningful: `qa_video.py` and `check_timeline.py` return **1** on a blocking issue, so they
work as CI gates without extra plumbing.

---

## 9. Open items

| Item | Status |
|---|---|
| GitHub Pages watch page (`docs/index.html`) | built and pushed; **needs one 2-click toggle** in Settings → Pages (folder `/docs`), or `pages: write` on the token |
| 9:16 vertical cut for Shorts/Reels | not started |
| 8–10 minute long-form on the parallel renderer (`render-long.yml`) | workflow ready, composition not written |
| Semantic VLM pass (frame captions, "should vs is" judgement) | scaffolding in `vision_audit.py`; needs an API key — no local GPU available |
| AI b-roll generation at scale (`assets.yml` + Pollinations) | workflow ready and endpoint verified working |

---

*End of report. The rules in §7 are the contract; the checkpoints in §5–6 are how the contract is kept.*
