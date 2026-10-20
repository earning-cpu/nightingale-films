# PROJECT_NIGHTINGALE — QUALITY SYSTEM v2
### Expanded gates · 65 non-breakable rules · QA toolchain map · access & free-resource plan

**Version:** 2.0 · 2026-10-20
**Supersedes:** §5–§8 of `REPORT_V1_V9.md` (the V1→V9 history there is still authoritative)
**New in this document:** 45 pre-render gates (was 8), 35 post-render gates (was 6), 65 rules (was 25), a measured audit of v9, a toolchain map with install commands, and a costed answer to *"what does Apify buy us?"*

---

## 0. Executive summary

**The system now measures the film, not just the timeline.** `qa_pro.py` is live: it decodes the final MP4 once per concern and reports 14 broadcast-grade checks in **42 seconds**.

Run against the shipped v9 master, it produced this verdict:

| Check | v9 measurement | Verdict |
|---|---|---|
| Stream | 1920×1080 · 30.00 fps · H.264 High · yuv420p · AAC 2ch · 69.67 s · 5.99 Mbps · faststart | ✅ |
| Colour tags | matrix **unknown**, transfer **iec61966-2-1 (sRGB)**, primaries bt709, range tv | ⚠ **defect** |
| Black intervals | 1 × 66.20–66.97 s (0.77 s, end-card fade-up) | ⚠ **retention dip** |
| Frozen runs | 0 | ✅ |
| Levels | 10.76 % of pixels at black floor (p95 17.12 %), 701/2067 frames over 12 % | ⚠ **shadow crush** |
| White clip | 0.00 % | ✅ |
| Photosensitivity | max **3** flashes in any 1 s, 6 transitions total | ✅ WCAG 2.3.1 |
| Rhythm | ~18 cuts, 15.5 cuts/min, longest static run 3.70 s | ✅ |
| Framing | modal crop 1920×1080, 100 % fill, no bars | ✅ |
| Loudness | **−14.0 LUFS**, LRA 3.6, true peak **−1.1 dBTP** | ✅ |
| Silence | 0 gaps | ✅ |
| Stereo phase | min **−0.43 @ 69.3 s** (tail), mean 0.303, no sustained dip | ✅ mono-safe, ⚠ tail |
| DC offset | −0.000295 | ✅ |
| Captions | 12 lines, worst **15.1 CPS** (`s8`), 0 over 20 CPS, all ≤ 84 chars | ✅ Netflix |
| Duration | 69.67 s | ✅ |

**Three findings, all fixable in v10, none visible in the old 20-gate system:**

1. **Colour is tagged sRGB, not bt709.** Primaries say bt709, matrix is *unknown*, transfer is *iec61966-2-1*. Players guess the matrix; some render the film slightly green/magenta and lifted. Cost to fix: **one ffmpeg flag on the final mux.** This is the single cheapest quality win available.
2. **10.8 % of the average frame sits at the black floor.** In a noir palette that reads as *mud* rather than *contrast* — shadow texture disappears on phone screens in daylight. A +2 IRE lift on the low end restores detail without losing the mood.
3. **0.77 s of near-black** before the end card. Verified frame-by-frame: 66.4 s is black, 67.2 s is the "THE FILE WAS RELEASED." card. A fade that long is a drop-off window; it should be a hard cut or an 8-frame dip.

Everything below exists to make findings like these impossible to ship.

---

## 1. The gate architecture

Seven gates. Nothing passes a gate on opinion; every gate has a tool, a number, and a class.

| Gate | When | Question it answers | Blocker rule |
|---|---|---|---|
| **G0 — Story** | before any asset is chosen | Will a stranger watch to the end? | fails = do not build |
| **G1 — Assets** | before the timeline is written | Are these the right pictures, legally and visually? | fails = do not build |
| **G2 — Timeline** | before `remotion render` | Does the edit obey the rules mechanically? | CI exits 1 |
| **G3 — Render** | during render | Did every frame actually render? | job fails |
| **G4 — Master QC** | on the final MP4 | Is the file technically and perceptually clean? | no link is announced |
| **G5 — Delivery** | publish | Can it be watched with zero friction? | no release, no film |
| **G6 — Retro** | 48 h after publish | What did the audience do? | feeds G0 next time |

**Class codes used in the tables:** **B** = blocker (ship-stopper), **W** = warning (must be logged + justified in the release notes), **I** = info (tracked over versions).

---

## 2. PRE-RENDER GATES — 45 checks

### 2.1 Story & structure (P01–P08)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| P01 | Cold-open premise | frame 0 already carries the subject; no logo, no fade-in | still at frame 0 | B |
| P02 | Hook timing | voice + visual + SFX all active by frame 6 (0.2 s) | timeline | B |
| P03 | Read-aloud pace | 80–160 wpm (v9: 103 words / 69.7 s = **88 wpm** — documentary pacing) | script ÷ duration | B |
| P04 | Open loop | a question is posed by 10 % of runtime | script map | B |
| P05 | Payoff placement | the answer lands at 82–90 % of runtime, never at the very end | script map | W |
| P06 | No dead beats | every 2 s advances fact, tension, or image | shot map | B |
| P07 | Last line | ≤ 12 words, ends on the question, not a summary | script | W |
| P08 | Title card | no title/logo before 8 s unless it *is* the hook | timeline | W |

### 2.2 Assets (P09–P16)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| P09 | Manifest | every file has source, licence, ≥1.5× display resolution, SHA-256 | `assets/manifest.json` | B |
| P10 | No repeats | perceptual-hash Hamming distance ≥ 12 between any two stills | `imagehash` | B |
| P11 | No AI tells | hands, teeth, eyes, printed text inspected at 100 %; no garbled type | human + VLM | B |
| P12 | Density | ≥ 1 distinct image per 3.5 s (v9: 18 images / 69.7 s = 3.9 s — pass, thin) | count ÷ runtime | W |
| P13 | Period truth | dated artefacts are period-correct: fonts, logos, tech, signage | human | B |
| P14 | Resolution ladder | masters ≥ 2560 px wide for 1080p; ≥ 3840 px for 4K | `identify` | B |
| P15 | Clean frame | no watermark, licence mark, stock ID, or UI chrome | VLM / human | B |
| P16 | Text-free plates | stills that will host type must have a low-detail region ≥ 30 % of frame | luminance map | W |

### 2.3 Motion & composition (P17–P26)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| P17 | Image analysis first | face/mass/horizon mapped before the move is chosen; choice logged | `move-plan.json` | I |
| P18 | No repeated move | no two adjacent shots use the same vector (in/out/left/right/up/down) | timeline lint | B |
| P19 | No zoom pulses | zero punch-in/pull-out cycles inside a shot | timeline lint | B |
| P20 | One continuous velocity | single ease per shot; no ease-in + ease-out pair within 1 s | timeline lint | W |
| P21 | Scale ceiling | digital push never exceeds 1.15× (10–15 % total) | source math | B |
| P22 | Sharpness ceiling | no still is upscaled > 1.35× at the tightest point of its move | source math | B |
| P23 | Vector alternation | never 3 consecutive shots moving the same direction | timeline lint | W |
| P24 | Composition | subject on a third, headroom 8–12 %, no tangent edges | frame review | W |
| P25 | Breathing shot | ≥ 1 shot with zero camera movement per 60 s | timeline lint | B |
| P26 | Move density | 60–80 % of shots move; 20–40 % hold | timeline lint | I |

### 2.4 Type & graphics (P27–P34)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| P27 | Title safe | all graphics inside 90 % (x 96–1824, y 54–1026 at 1080p) | geometry lint | B |
| P28 | Cut clearance | no graphic enters within 2 frames of a cut; none exits within 2 frames | `check_timeline.py` | B |
| P29 | Screen life | every graphic is fully readable for ≥ 1.0 s of screen time | timeline | B |
| P30 | Minimum size | on-screen text ≥ 28 px at 1080p (2.6 % of height); body ≥ 32 px | geometry lint | B |
| P31 | Contrast | ≥ 4.5:1 (normal) / ≥ 3:1 (≥ 24 px bold) measured against the **actual** backdrop pixels | sampler | B |
| P32 | Line budget | ≤ 42 chars/line, ≤ 2 lines, ≤ 84 chars total per card | narration map | B |
| P33 | Typography hygiene | ≤ 2 families, ≤ 3 weights, no faux-bold, tracking ≥ −2 % | style lint | W |
| P34 | Figures | dates/numbers use tabular figures when stacked or animated | style lint | I |

### 2.5 Audio (P35–P40)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| P35 | Single voice | exactly one VO take per line, no overlap anywhere | `make_narration.py` | B |
| P36 | Line fit | every line ends ≥ 4 frames before its scene ends | `make_narration.py` | B |
| P37 | Cue lock | every visible event has a cue within ±1 frame; every cue maps to a visible event | `make_audio.py` | B |
| P38 | Cut silence | no SFX transient within 2 frames either side of a cut (it masks the cut) | cue map | W |
| P39 | Ducking | music −6 to −9 dB under VO, 200 ms attack / 400 ms release | mix graph | B |
| P40 | Mono safety at source | every stereo layer checked at creation; no wide reverb below 200 Hz | phase meter | B |

### 2.6 Accessibility (P41–P43)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| P41 | Flash plan | storyboard luminance never produces > 3 opposing changes ≥ 10 % in 1 s | animatic + `qa_pro.py` | B |
| P42 | No black holes | no planned > 0.5 s near-black anywhere, including transitions | shot map | B |
| P43 | Caption floor | captions present from 0.5 s, never over a face, ≤ 2 lines, inside 90 % safe | narration map | B |

### 2.7 Delivery plan (P44–P45)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| P44 | Output spec | 1920×1080, 30 fps CFR, yuv420p, **bt709 matrix + bt709 transfer + tv range**, H.264 High ≤ 4.2, 2 s GOP, faststart | mux command | B |
| P45 | Vertical plan | per-shot centre-safe map for the 9:16 reframe (subject within the centre 56 % of width) | frame review | B |

**Commands**

```bash
python3 check_timeline.py                  # P25, P27–P29, P36
python3 make_narration.py                  # P03, P32, P35, P36
python3 make_audio.py                      # P37–P40
python3 qa_pro.py master.mp4 --json qa/pro.json --allow-black 66.1-67.1   # P41 replay
```

---

## 3. POST-RENDER GATES — 35 checks

### 3.1 File integrity (Q01–Q06)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| Q01 | Stream conformance | 1920×1080, 30.00 fps CFR, H.264 High, yuv420p, AAC 2ch ≥ 44.1 kHz | `ffprobe` | B |
| Q02 | Faststart | `moov` before `mdat` | `ffprobe -v trace` | B |
| Q03 | Colour tags | matrix **bt709**, transfer **bt709**, primaries bt709, range **tv** | `ffprobe` | B |
| Q04 | Frame count | duration × 30 within ±1 frame; no duplicate/dropped frames | `ffprobe` + `mpdecimate` | B |
| Q05 | Decode clean | zero errors/warnings on a full decode | `ffmpeg -v error` | B |
| Q06 | A/V sync | audio and video duration differ < 33 ms | `ffprobe` | B |

### 3.2 Picture (Q07–Q14)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| Q07 | Black frames | zero outside declared fade/card windows | `blackdetect` | B |
| Q08 | Frozen frames | zero runs ≥ 0.4 s | `freezedetect` | B |
| Q09 | Shadow floor | ≤ 8 % of pixels at floor (≤ 17) mean; ≤ 12 % p95 | `qa_pro.py` | W→B in v10 |
| Q10 | Highlight clip | ≤ 0.1 % of pixels at ceiling; < 2 % of frames hot | `qa_pro.py` | B |
| Q11 | Banding | no step > 1 IRE across 8 px in a smooth gradient; CAMBI score tracked | `libvmaf` CAMBI or Sobel histogram | W |
| Q12 | Photosensitivity | ≤ 3 general flashes in any 1 s | `qa_pro.py` / PEAT | B |
| Q13 | Flicker | no 3–10 Hz luminance oscillation > 5 % | FFT of luminance series | B |
| Q14 | Gamut | no channel > 100 IRE; no out-of-gamut saturation | `signalstats` SATMAX | W |

### 3.3 Edit & rhythm (Q15–Q20)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| Q15 | Shot list | detected shots match the planned list ± 1 | PySceneDetect (threshold 32, min 15) | W |
| Q16 | Minimum shot | no shot < 30 frames | `vision_audit.py` | B |
| Q17 | Repeats | 0 repeated images | `vision_audit.py` phash | B |
| Q18 | Static run | longest unchanged run < 4.5 s (v9: 3.70 s) | `qa_pro.py` | W |
| Q19 | Cut density | 15–30 cuts/min (v9: 15.5) | `qa_pro.py` | I |
| Q20 | Truncation | no graphic cropped by a cut; no 0.27 s slivers | `qa_video.py` windows | B |

### 3.4 Audio (Q21–Q26)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| Q21 | Integrated loudness | −14.0 ± 0.5 LUFS | `ebur128` | B |
| Q22 | True peak | ≤ −1.0 dBTP | `ebur128=peak=true` | B |
| Q23 | Loudness range | 3–8 LU | `ebur128` | W |
| Q24 | Dead air | no gap > 1.5 s (v9: 0) | `silencedetect` | B |
| Q25 | Phase | no sustained < −0.2 for ≥ 0.3 s (v9: brief −0.43 at 69.3 s, tail) | `aphasemeter` | B |
| Q26 | DC offset | < 0.02 (v9: −0.0003) | `astats` | W |

### 3.5 Captions & accessibility (Q27–Q29)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| Q27 | Reading speed | ≤ 20 CPS, ≤ 42 chars/line, ≤ 2 lines (v9 worst: 15.1) | `qa_pro.py` | B |
| Q28 | Sync | caption word onset within 2 frames of VO onset | whisper.cpp alignment | B |
| Q29 | Presence & placement | captions burned in from 0.5 s; never cover eyes/face; inside 90 % safe | frame review + OCR | B |

### 3.6 Measurement (Q30–Q33)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| Q30 | VMAF vs master | ≥ 93 at 1080p (vmaf_v1 model, not comparable to v0) | `libvmaf` | B |
| Q31 | SSIMULACRA2 | median ≥ 85 (visually lossless) on 20 sampled frames | `ssimulacra2` CLI | W |
| Q32 | QCTools report | `qcli` XML generated and archived with the release | `qcli -i film.mp4` | I |
| Q33 | MediaConch | master (MKV/FFV1) passes policy; delivery passes implementation | `mediaconch` | I |

### 3.7 Human & distribution (Q34–Q35)

| # | Check | Pass criterion | Tool | Class |
|---|---|---|---|---|
| Q34 | Dense review | 4 fps contact sheets read end-to-end; zero visible defects | `vision_audit.py --fps 4` | B |
| Q35 | First frame & 9:16 | thumbnail frame carries the premise; vertical cut keeps subject + captions safe | stills + review | B |

**Current v9 status across the new gates**

```
Q01 ✅  Q02 ✅  Q03 ❌ sRGB transfer / unknown matrix   Q04 ✅  Q05 ✅  Q06 ✅
Q07 ⚠ (declared window)  Q08 ✅  Q09 ⚠ 10.76 %  Q10 ✅  Q11 ? Q12 ✅  Q13 ✅  Q14 ✅
Q15 ✅  Q16 ✅  Q17 ✅  Q18 ✅  Q19 ✅  Q20 ✅
Q21 ✅ −14.0  Q22 ✅ −1.1  Q23 ✅ 3.6  Q24 ✅  Q25 ✅  Q26 ✅
Q27 ✅ 15.1 CPS  Q28 ✅  Q29 ✅
Q30–Q33 = tool not yet installed locally (see §5)  Q34 ✅  Q35 ⚠ 9:16 not built
```

Two blockers (Q03, Q09) and one warning were invisible before this system existed.

---

## 4. NON-BREAKABLE RULES — 65

Rules 1–25 are the original contract, restated so a script can test them. Rules 26–65 are new.

### 4.1 Timing & sound

| # | Rule | Enforced |
|---|---|---|
| 1 | **The picture is the master clock.** SFX are placed on the visual frame, never on a musical grid. | `make_audio.py` |
| 2 | **No narration overlap, ever.** Two simultaneous voices is a build failure. | `make_narration.py` |
| 3 | **Voice sits on top.** Music ducks ≥ 6 dB under speech; no SFX masks a word. | mix graph |
| 4 | **Final mix = −14 LUFS ± 0.5, true peak ≤ −1.0 dBTP.** | `qa_pro.py` |
| 5 | **Every visual event gets a sound** — text lands, stamps, inserts, cuts. | cue map |
| 6 | **No cut may land inside an on-screen animation.** | `check_timeline.py` |
| 7 | **No shot shorter than 1.0 s** (target ≥ 1.5 s). | `vision_audit.py` |
| 8 | **No image may appear twice.** If it must, it needs a different frame, grade, or treatment. | phash |
| 9 | **No graphic may be on screen less than 1 s** (screen life, not entrance). | windows |
| 10 | **A cutaway ends on the scene cut** — never before, never a sliver. | windows |
| 11 | **A cutaway owns its slate** — no inherited headline or stamp. | timeline |
| 12 | **Scenes are hard cuts.** No per-scene fades. | source |
| 13 | **Cutaways are hard cuts.** No cross-fades between photographs. | source |
| 14 | **One continuous camera move per shot, 2–5 % total.** No pulses, reversals, or repeats. | lint |
| 15 | **Digital zoom never exceeds 10–15 %.** | source math |
| 16 | **No glitch/strobe transitions.** | lint |
| 17 | **Handheld ≤ 0.25** (0.5–0.8 px feel); no rotation unless motivated. | source |
| 18 | **Hook by 3 s** — voice, visual and SFX all active by frame 6. | P02 |
| 19 | **Captions from second 1, burned in.** | P43 |
| 20 | **A pattern interrupt at 25–35 s.** | timeline |
| 21 | **At least one breathing shot** with no camera movement. | P25 |
| 22 | **Every deliverable is measured, not assumed.** Both audits pass before a link exists. | CI |
| 23 | **Nothing ships only to the workspace.** Permanent GitHub Release, always. | CI |
| 24 | **CI is the gate.** If `check_timeline.py` fails, the render does not start. | CI |
| 25 | **The blog repo and its token are never touched.** Videos only. | policy |

### 4.2 Picture & grade (new)

| # | Rule | Why it matters | Test |
|---|---|---|---|
| 26 | **No more than 8 % of pixels may sit at the black floor per frame.** | crushed shadows are the #1 tell of a cheap grade; on phones they become flat black blobs | `qa_pro.py` V3 |
| 27 | **Zero frames with > 2 % of pixels clipped at the ceiling.** | blown highlights lose the subject's edge | V3 |
| 28 | **No banding in a smooth gradient** (no ≥ 2 IRE step across 8 px). | banding in skies and dark walls is the most visible encode artefact | Q11 |
| 29 | **Every still is ≥ 1.5× display resolution and never upscaled > 1.35×.** | a soft push looks like a phone zoom | P22 |
| 30 | **No frame may contain a watermark, licence mark, or AI artefact.** | one broken hand destroys trust in a documentary | P11/P15 |
| 31 | **Every delivery is tagged bt709 / bt709 / tv.** | untagged colour is decoded by guesswork and drifts green | Q03 |
| 32 | **No channel above 100 IRE; no neon saturation.** | gamut excursions clip on TV and phone panels | Q14 |
| 33 | **Grain and texture must be uniform across every shot.** | mixed noise floors read as stock footage | visual |
| 34 | **The grade must hold at 30 % screen brightness.** | most viewing happens on a dimmed phone | review |
| 35 | **No shot may be sharpened twice** (source → grade → encode). | double sharpening produces halos on edges | review |

### 4.3 Time & motion (new)

| # | Rule | Why | Test |
|---|---|---|---|
| 36 | **Longest static run < 4.5 s.** | stillness beyond that reads as a slideshow | V5 |
| 37 | **Cut density between 15 and 30 cuts/min.** | below 15 = lecture; above 30 = chaos | V5 |
| 38 | **No two consecutive shots with the same camera vector.** | repetition is the strongest AI-slideshow signal | lint |
| 39 | **A camera move may never reverse inside a shot.** | reversal reads as a bounce, not a lens | lint |
| 40 | **Every shot must show its reason in its first 6 frames.** | if nothing changes, the frame is a still, not a shot | review |
| 41 | **No near-black plate longer than 0.5 s**, including fades. | 0.77 s of black at 66.2 s in v9 is exactly the kind of hole people skip through | V1 |
| 42 | **No single-frame white or black flash at a cut.** | it reads as a glitch and can trigger photosensitivity | Q12 |
| 43 | **No speed ramp without a motivated anchor.** | unmotivated ramps look like a template | review |
| 44 | **Every insert must be motivated in the VO within 8 frames.** | cutaways that ignore the words feel random | timeline |
| 45 | **Motion blur must be consistent** — no sharp objects moving beside blurred ones. | mixed blur = composite | review |

### 4.4 Type & graphics (new)

| # | Rule | Why | Test |
|---|---|---|---|
| 46 | **On-screen text ≥ 28 px at 1080p.** | below that it dies on a phone | P30 |
| 47 | **Contrast ≥ 4.5:1 against the real backdrop**, not the nominal colour. | the most common legibility failure in documentary graphics | P31 |
| 48 | **≤ 42 chars/line, ≤ 2 lines, ≤ 20 CPS.** | Netflix/BBC caption economics apply to all type | P32/Q27 |
| 49 | **No text outside 90 % title safe.** | TVs and vertical crops eat the edges | P27 |
| 50 | **≤ 2 type families, ≤ 3 weights, no faux-bold.** | more reads as a slide deck | P33 |
| 51 | **Stacked numbers use tabular figures.** | proportional digits wobble when animated | P34 |
| 52 | **No text over high-frequency detail without a scrim.** | type on texture is unreadable at 360 px | review |
| 53 | **Every graphic has a stated job**: name, date, consequence, or question. | decorative graphics are noise | review |

### 4.5 Sound (new)

| # | Rule | Why | Test |
|---|---|---|---|
| 54 | **Loudness range 3–8 LU.** | under 3 is flat/compressed; over 8 is unlistenable on phones | Q23 |
| 55 | **No sustained anti-phase below −0.2 for > 0.3 s.** | mono listeners lose the track | Q25 |
| 56 | **DC offset < 0.02.** | DC eats headroom and clicks at cuts | Q26 |
| 57 | **No cue within 2 frames of a cut.** | the transient masks the edit | P38 |
| 58 | **No more than 3 simultaneous SFX layers.** | stacking turns into mush | mix graph |
| 59 | **Music never exceeds VO − 6 dB at any instant.** | intelligibility first | mix |
| 60 | **Every stereo layer must survive a mono sum** (≥ −3 dB loss). | half the audience listens on one speaker | mix |

### 4.6 Accessibility & delivery (new)

| # | Rule | Why | Test |
|---|---|---|---|
| 61 | **≤ 3 general flashes in any 1 s** (WCAG 2.3.1). | legal exposure and viewer safety | Q12 |
| 62 | **Captions never cover eyes or the subject's mouth.** | reading and watching cannot compete | Q29 |
| 63 | **No meaning conveyed only by colour or only by motion.** | colour-blind and reduced-motion viewers | review |
| 64 | **Every caption line must be readable at 360 px wide.** | that is the actual feed width | review |
| 65 | **A build that fails any blocker gets no link, no post, no announcement.** | the only rule that protects all the others | CI |

---

## 5. QA TOOLCHAIN MAP

### 5.1 What is already installed and working

| Tool | Catches | Install | Command | Cost |
|---|---|---|---|---|
| **`qa_pro.py`** (ours) | 14 checks: stream, colour tags, black, freeze, levels, PSE, rhythm, framing, loudness, silence, phase, DC, captions, duration | in repo | `python3 qa_pro.py FILM.mp4 --json qa/pro.json` | free |
| **ffmpeg / ffprobe** | everything else below | `apt install ffmpeg` | see §5.2 | free |
| **PySceneDetect** | shot boundaries | `pip install scenedetect` | `scenedetect -i F.mp4 detect-content -t 32 list-scenes` | free |
| **OpenCV + imagehash** | repeats, contact sheets, luminance series | `pip install opencv-python imagehash` | `vision_audit.py` | free |
| **NumPy/SciPy** | statistics on every series | `pip install numpy scipy` | — | free |

### 5.2 ffmpeg one-liners that replace a $10k QC station

| Check | Command |
|---|---|
| Black | `ffmpeg -i F.mp4 -vf blackdetect=d=0.2:pic_th=0.99:pix_th=0.08 -an -f null -` |
| Freeze | `ffmpeg -i F.mp4 -vf freezedetect=n=-60dB:d=0.4 -an -f null -` |
| Levels | `ffmpeg -i F.mp4 -vf signalstats,metadata=mode=print:file=- -an -f null -` |
| Loudness | `ffmpeg -i F.mp4 -af ebur128=peak=true -vn -f null -` |
| Phase | `ffmpeg -i F.mp4 -af aphasemeter=video=0,ametadata=mode=print:file=- -vn -f null -` |
| DC / stats | `ffmpeg -i F.mp4 -af astats=metadata=1:reset=0 -vn -f null -` |
| Silence | `ffmpeg -i F.mp4 -af silencedetect=n=-50dB:d=1.5 -vn -f null -` |
| Bars | `ffmpeg -i F.mp4 -vf fps=2,cropdetect=limit=16:round=2:reset=0 -an -f null -` |
| A/V drift | `ffprobe -v error -show_entries stream=codec_type,duration -of csv F.mp4` |
| Faststart | `ffprobe -v trace -i F.mp4 2>&1 \| grep -m1 moov` |

### 5.3 Add-ons worth installing (all free)

| Tool | What it adds | Install | Priority |
|---|---|---|---|
| **QCTools 1.3.1 + `qcli`** | archival-grade XML report of signalstats/cropdetect/psnr/ebur128 per frame — the BAVC standard | download from mediaarea.net/QCTools | ★★★ |
| **MediaInfo 26.x** | container/track truth, JSON export | `apt install mediainfo` | ★★★ |
| **MediaConch 25.04** | implementation + policy conformance for MKV/FFV1 masters | `pip install mediaconch` or mediaarea.net | ★★ |
| **libvmaf 3.x + VMAF v1 models** | perceptual score vs master (vmaf_v1.0.16; **scores not comparable to v0**) | static ffmpeg build with libvmaf | ★★★ |
| **SSIMULACRA2** | best human-correlated still/frame metric (0–100; ≥ 90 visually lossless, ≥ 80 imperceptible side-by-side) | `cargo install ssimulacra2` or Python wheel | ★★ |
| **Butteraugli** | "is this encode transparent" (< 1.0) | libjxl tools / Rust port | ★ |
| **ffmpeg-quality-metrics** | wraps VMAF/SSIM/PSNR into one JSON | `pip install ffmpeg-quality-metrics` | ★★ |
| **whisper.cpp / faster-whisper** | word-level alignment to prove caption sync | `pip install faster-whisper` | ★★★ |
| **Tesseract 5** | OCR proof that burned-in captions exist and sit inside safe area | `apt install tesseract-ocr` | ★★ |
| **aubio / librosa** | beat grid, onset detection for cue placement | `pip install aubio librosa` | ★★ |
| **audiowaveform (BBC)** | waveform PNGs for audio review decks | `apt install audiowaveform` | ★ |
| **PEAT** | clinical photosensitive-epilepsy analysis (Windows/.NET, free from Trace Center) | manual download | ★★ |
| **OpenTimelineIO** | export/import EDL so the edit can be audited outside Remotion | `pip install opentimelineio` | ★ |

### 5.4 Measurement ladder (cheapest → most expensive)

1. **Structural** — does the file exist, is it 1080p30, is `moov` first? (seconds)
2. **Signal** — black, freeze, levels, loudness, phase, DC (one decode pass, ~40 s)
3. **Temporal** — cuts, statics, repeats, PSE, captions (2–4 min)
4. **Perceptual** — VMAF / SSIMULACRA2 against a lossless master (5–15 min)
5. **Semantic** — VLM + human review (the only layer that catches "wrong", not "broken")
6. **Audience** — retention curve, drop-off timestamps (48 h later)

Each layer catches a class of defect the layer below cannot. Skipping layer 5 is how a technically perfect film still feels wrong.

---

## 6. WHAT APIFY ACTUALLY BUYS

**Blunt answer: it cannot improve a single pixel.** Apify is a scraping platform; it produces *text and metadata*, not footage, not grades, not encodes. What it can buy is **better decisions before the first frame is rendered** — and that is where most of the perceived quality actually lives.

| Use | Actor | Cost | What changes in the film |
|---|---|---|---|
| Competitor transcript mining | YouTube Transcript Scraper Pro | ~$1 / 1,000 videos | hook phrasing, line length, where they place the turn |
| Niche title/thumbnail patterns | YouTube Scraper | ~$4 / 1,000 videos | the promise on the poster frame |
| Audience questions | YouTube Comments Scraper | ~$2 / 1,000 | the exact question the film answers |
| Trend formats | TikTok / Instagram Scraper | ~$1.5–4 / 1,000 | pacing and pattern-interrupt placement |
| Story sourcing | Reddit Scraper | ~$1–3 / 1,000 | first-person detail that makes it feel human |
| Fact provenance | Website Content Crawler | ~$2–5 / 1,000 pages | citations that hold up under scrutiny |
| Fresh angle | Google News Scraper | ~$1–4 / 1,000 | the "why now" in the cold open |

**A $5/month Free plan, spent well:**

- 300 competitor videos (metadata + stats) → **$1.20**
- 300 transcripts of the top 10 % performers → **$0.30–1.05**
- 1,500 comments on the best 20 → **$3.00**
- 100 Reddit threads on the topic → **$0.20**
- Total ≈ **$4.70** → a written "what wins in this niche" brief for the next film.

**Caveats.** Scraping YouTube is against its ToS; use it for *analysis* (patterns, counts, themes), never republish transcripts. Budget is prepaid and does not roll over. The free tier's 5 concurrent runs is enough for this workload.

**Verdict:** worthwhile only if we build a *retention brief* from it before scripting. Bought and unused, it is $5 of nothing.

---

## 7. OTHER ACCESS TYPES — ranked by quality-per-effort

| # | Access | What it unlocks | Cost | Priority |
|---|---|---|---|---|
| 1 | **GitHub fine-grained PAT with `pages: write`** | the watch page goes live — a link that plays in-browser with no download. This is currently the *only* blocker between us and the delivery format the brief asks for. | free | **do first** |
| 2 | **YouTube channel access (or a screen of Analytics)** | the retention curve: the exact second people leave. No tool can infer this; it is the single highest-value data in the entire pipeline. | free | **highest long-term value** |
| 3 | **Cloudflare API token** | Workers AI: Llama vision for the semantic pass (does the frame match the line?), Whisper for caption sync, FLUX/SDXL for stills — 10,000 neurons/day free, hard stop, no card | free tier | high |
| 4 | **Groq API key** | very fast text models for script variants, hook testing, fact summarisation | free tier | medium |
| 5 | **Google AI Studio key** | Gemini free tier — strong vision reasoning for the "should vs is" audit | free tier | medium |
| 6 | **Kaggle / Colab (just a login)** | ~30 GPU-h/week on T4s: Depth-Anything parallax from stills, batch upscaling, local VLM, Wan 2.2 clips | free | high |
| 7 | **Apify account** | research brief only (§6) | $5/mo free | medium |
| 8 | **Hugging Face token** | ZeroGPU quota, gated models, dataset access | free | low |
| 9 | **A professional VO sample (or your own voice, 60 s clean)** | either a real human read or an ethically-cleared voice model; a human voice is the single biggest "not AI" signal in the whole film | $0–150 | depends |
| 10 | **Stock platform logins (Storyblocks/Artgrid)** | motion b-roll that stills cannot fake | $0–30/mo | optional |
| 11 | **Domain + Cloudflare Pages** | a clean `nightingale.film` watch URL instead of a GitHub path | ~$10/yr | optional |

**What I would ask for, in order:** Pages scope → Cloudflare token → Kaggle login → YouTube analytics screenshot.

---

## 8. FREE RESOURCES

### 8.1 Imagery

| Source | What | Licence |
|---|---|---|
| Pexels / Pixabay / Unsplash | stills + video, broad coverage | free commercial |
| Mixkit / Coverr | video b-roll, clean | free commercial |
| Smithsonian Open Access | museum-grade artefacts, high-res scans | CC0 |
| Library of Congress / NYPL Digital | period photographs, newspapers | mostly public domain |
| Internet Archive / Prelinger | archive film, ephemera, textures | mixed, check per item |
| Wikimedia Commons | everything, with provenance | CC/PD |
| NASA / ESA / Hubble | space, earth, hardware | public domain |
| Biodiversity Heritage Library / Wellcome | engravings, medical, botanical | CC0/PD |

### 8.2 Sound

| Source | What | Licence |
|---|---|---|
| YouTube Audio Library | music + SFX | free, some attribution |
| Pixabay Music / SFX | beds, stingers, whooshes | free commercial |
| Freesound | field recordings, textures | CC0–CC-BY, check per file |
| Free Music Archive / ccMixter | score-like beds | CC |
| BBC Sound Effects | the best archival SFX library in existence | **personal/education only — not commercial** |

### 8.3 Type

Google Fonts — Inter, Newsreader, Fraunces, Instrument Serif, Libre Caslon, Archivo, Barlow Condensed, JetBrains Mono. Fontshare — Satoshi, General Sans (free commercial). Use one display serif + one grotesque + one mono, and stop.

### 8.4 Models & compute (free tier)

| Resource | Gives | Limit |
|---|---|---|
| Cloudflare Workers AI | Llama vision, Whisper, FLUX/SDXL | 10,000 neurons/day |
| Kaggle | 2× T4 or P100 | ~30 GPU-h/week |
| Colab free | T4 | 15–30 h/week, 12 h sessions |
| Google AI Studio | Gemini | free tier, rate-limited |
| Groq | Llama/Mixtral inference | free tier |
| OpenRouter free models | text + some vision | rate-limited |
| Pollinations | image generation | free |
| Hugging Face ZeroGPU | Spaces GPU | short bursts |

Worth knowing: **Depth Anything V2 + ffmpeg** turns a still into a true parallax move (foreground/background separate) — the single biggest upgrade available to a stills-based documentary, and it runs on a free Kaggle T4. `Kokoro-82M` (Apache) and `Piper` give usable TTS; `Whisper large-v3-turbo` gives word timings; `Real-ESRGAN` upscales archive plates.

---

## 9. QUALITY LEVERAGE LADDER

Where the perceived quality actually comes from, ranked — this is the order to spend effort:

| Rank | Lever | Share of perceived quality | Current state |
|---|---|---|---|
| 1 | Sound design + mix | ~30 % | strong (cue-locked, −14 LUFS) |
| 2 | Casting the *right* image | ~25 % | strong (18 period stills) |
| 3 | Pacing / cut rhythm | ~15 % | good (15.5 cuts/min) |
| 4 | Grade + shadow detail | ~12 % | **weak (10.8 % floor)** |
| 5 | Typography | ~8 % | good |
| 6 | Motion design | ~7 % | good (no pulses) |
| 7 | Encode / delivery | ~3 % | good, **but tags wrong** |

The two weakest levers are also the two cheapest to fix. That is what v10 should be.

---

## 10. v10 BUILD PLAN

| # | Fix | Acceptance criterion | Gate |
|---|---|---|---|
| 1 | Retag colour on mux — use `-x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv` (the `-color_primaries`-style flags are dropped by libx264; verified 2026-10-20) | `ffprobe` shows `bt709 / bt709 / bt709 / tv` | Q03 |
| 2 | Shadow lift +2 IRE with a soft toe (no milky blacks) | floor pixels ≤ 8 % mean, ≤ 12 % p95, contrast unchanged within 1 % | Q09 |
| 3 | Kill the 0.77 s black hole at 66.2 s | hard cut to card, ≤ 0.3 s of near-black | Q07/R41 |
| 4 | Tighten tail phase | no phase sample < −0.35 anywhere | Q25 |
| 5 | 9:16 vertical cut | subject inside centre 56 %, captions inside vertical safe | Q35 |
| 6 | Pages watch page | URL plays in-browser, no download | G5 |
| 7 | VLM semantic pass via Cloudflare | 0 "wrong image for line" findings across 280 frames | Q34 |
| 8 | Archive QCTools XML + `qa/pro.json` with the release | files committed under `qa/` | Q32 |

Run order: **1 → 2 → 3 → 4 → full `qa_pro.py` → render → QCTools → publish.**

---

## 11. Appendix — file map

| File | Role |
|---|---|
| `qa_pro.py` | the new 14-check engine (§0 table is its live output) |
| `qa_video.py` | frame-by-frame: frozen, blinks, A→B→A, cuts in animations |
| `vision_audit.py` | 4 fps: shot list, phash repeats, screen life, contact sheets |
| `check_timeline.py` | pre-render cutaway/animation guard |
| `make_narration.py` | word-timed VO, overlap guarantee |
| `make_audio.py` | 102 frame-locked cues, ducking, −14 LUFS mix |
| `qa_windows.json` | 54 measured animation windows |
| `REPORT_V1_V9.md` | V1→V9 changelog + lessons |
| `RESEARCH.md` | engagement + craft research |
| `QUALITY_SYSTEM_V2.md` | this document |

---

## 12. Sources

Netflix timed-text style guide (20 CPS adult / 42 chars / 2 lines / 5⁄6–7 s) · BBC subtitle guidelines (37 chars, 160–180 wpm) · EBU R128 & Tech 3342 (loudness, LRA, true peak) · WCAG 2.3.1 (≤ 3 flashes/s) · ITU-R BT.709 · SMPTE title/action safe · BAVC QCTools 1.3.1 + qcli · MediaArea MediaConch 25.04 / MediaInfo 26.x · Netflix VMAF v1 model set (vmaf_v1.0.16) · Cloudinary SSIMULACRA2 2.1 (≥ 90 visually lossless) · Google Butteraugli (< 1.0 transparent) · Cloudflare Workers AI free tier (10,000 neurons/day) · Kaggle (≈30 GPU-h/week) · Apify pricing (Free $5 credits, $0.20/CU).

---

*The rules in §4 are the contract. §2–§3 are how the contract is kept. §5–§8 are what it costs to keep it — which, it turns out, is almost nothing.*
