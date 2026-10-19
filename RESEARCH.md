# 📈 VIDEO ENGAGEMENT RESEARCH — Retention Science, Viral Editing & Tools

*Compiled 2026-10-19. Every rule below is traceable to the cited source; the "Applied" column shows what PROJECT NIGHTINGALE v3 already implements.*

---

## 1. YouTube / Shorts retention — the numbers

| Fact | Source | Applied in v3 |
|---|---|---|
| **71% of viewers decide within the first 3 seconds**; 55% drop inside 60s | [ytincome retention masterclass](https://ytincome.in/blog/youtube-audience-retention-masterclass-2026/) | Hook line voiced at 0.2s ("In nineteen forty seven…") + title slam SFX at frame 6 |
| First spoken word should land **within 0.5s**; no music intro, no logo first | [virvid Shorts hooks](https://virvid.ai/blog/first-3-seconds-hook-faceless-shorts-2026) | VO starts frame 6 over the title sting (branding after hook) |
| **Hard-coded captions from second 1** lift sound-off retention 25–40%; 60–80% of feeds start muted | [aibrify retention playbook](https://aibrify.com/blog/youtube-shorts-retention-curve-playbook) | Karaoke caption track (active word amber) from frame 6 |
| Visual change every **1.5–2s (Shorts) / 10–15s (long-form)**; zoom levels every 3–5s | [blitzreels](https://blitzreels.com/blog/short-form-video-editing), [pixflow](https://pixflow.net/blog/youtube-video-retention-editing/) | 12 cuts in 70s + zoom punch-ins on every narration noun |
| Pattern interrupt at **25–35s** (first major drop-off zone) | [AIR Media-Tech via pixflow](https://pixflow.net/blog/youtube-video-retention-editing/) | S4 radar/HUD takeover + glitch at 23–28s |
| Retention curve at **0:30 predicts reach**; >70% still watching = algorithm push | [YT SEO Architect](https://yt-seo-architect.vercel.app/blog/youtube-intro-hook-first-3-seconds) | Story format (highest retention 50–65%) — 10-scene narrative arc |
| Story format outperforms listicle/unscripted (40–60% vs 25–35%) | [OutlierKit script writing](https://outlierkit.com/resources/youtube-script-writing/) | Full narrative screenplay, not a slideshow |
| **SFX on motion beats** = cheapest pattern interrupt; keep music UNDER voice | [pixflow sound design](https://pixflow.net/blog/youtube-video-retention-editing/) | 100 cues frame-locked to motion + BGM ducked 62% under VO |

## 2. Viral editing craft (MrBeast/Hormozi school, with the 2026 correction)

- **Zoom punch-ins** on key words/objects (Hormozi signature) — [increditors](https://increditors.com/an-ultimate-guide-to-alex-hormozi-ali-abdaal-and-mr-beast-video-editing-style-and-methods/)
- **Text appearing without audio feels flat** — every text pop needs a pop/tick SFX — [techmrbeast guide](https://techmrbeast.starlandpromotions.com/master-mrbeast-retention-editing-with-ai-tools/)
- **J-cuts/L-cuts**: audio leads picture into transitions (our 1977 tape click fires 2 frames BEFORE the flash cut) — [domer.io](https://domer.io/blog/viral-video-editing-workflow)
- **Beat of silence before the payoff** makes reveals land 2× harder — [markstudios](https://www.markstudios.com/guide)
- **Cut dead air >0.3s**, captions ≤2–4 words per beat, text overlay slightly BEFORE the spoken word — [sozee TikTok retention](https://www.sozee.ai/resources/edit-tiktok-trends-video-retention/), [shortzly](https://shortzly.com/blog/short-form-video-retention-strategies)
- ⚠️ **The 2026 correction**: MrBeast publicly walked back hyper-fast cutting — "yelled less, let scenes breathe," and views went up ([Washington Post](https://www.washingtonpost.com/technology/2024/03/30/video-editing-mrbeast-retention/)). Over-editing backfires especially for 35+ audiences. Rule: **constant subtle motion, deliberate big moments** — not chaos.
- End on a **loopable/satisfying final frame**; put the payoff in the first half for Shorts — [aibrify](https://aibrify.com/blog/youtube-shorts-retention-curve-playbook)

## 3. TTS (voice) — what's actually usable in 2026

| Tool | Quality | Word timestamps | License | Notes |
|---|---|---|---|---|
| **edge-tts** ✅ *used in v3* | Excellent (MS neural) | ✅ WordBoundary | MIT (cloud) | Free, 400+ voices; `pip install edge-tts` |
| **Kokoro-82M** | Excellent, CPU-friendly | ✅ (via APIs like HeadTTS) | Apache 2.0 | Best local model; 82M params, runs without GPU |
| Piper (OHF-Voice fork) | Good, fast | ❌ | GPL-3.0 | 900+ voices, edge/ONNX, offline-first |
| XTTS v2 | Very good + cloning | ❌ | Non-commercial | 6s voice clone |
| Chatterbox | Beats ElevenLabs in blind tests | ❌ | MIT | Expressive |
| F5-TTS / Fish Speech | High naturalness | varies | permissive | cloning focus |

Word-timestamp recipes: [HeadTTS (Kokoro + phoneme timestamps + visemes)](https://github.com/met4citizen/HeadTTS) · [explainroo (Kokoro + Whisper alignment)](https://www.explainroo.com/guides/best-open-source-text-to-speech/) · [kokoro word-timestamp trick](https://news.ycombinator.com/item?id=48821576)

## 4. Video generation — the honest 2026 landscape

Open-source image-to-video (Wan 2.x, LTX-Video, CogVideoX, Stable Video Diffusion, AnimateDiff) needs a **GPU (12–24 GB VRAM)** — not viable on free GitHub runners. Practical paths:
- **Cloud GPU per-render** (RunPod / Replicate / fal.ai) — ~$0.10–0.50/clip
- **Local GPU** (12 GB+): LTX-Video / Wan2.2 for quick b-roll inserts
- **Motion-graphics route (what we do)**: Remotion + Ken Burns + kinetic type + compositing beats raw AI video for documentary/retention content — cheaper, deterministic, frame-accurate to audio
- SFX libraries: [youtubesfx.com MrBeast pack mapping](https://youtubesfx.com/mrbeast-sound-effects/) (riser → impact → whoosh-per-cut structure)

## 5. The "every video viral" checklist (used for v3)

1. ☑ Hook in ≤3s — voice + visual + SFX all in frame one
2. ☑ Captions from second 1 (sound-off viewers)
3. ☑ Visual change every 2–4s (cuts, zoom punches, text, HUD)
4. ☑ Big pattern interrupt at 25–35s
5. ☑ SFX locked to every motion/text event (nothing floats)
6. ☑ Music under voice, ducked; silence before big reveals
7. ☑ Zoom on the noun the narrator is saying (pointing with the lens)
8. ☑ Story arc with open loops (fragment → signal → breach → cover-up)
9. ☑ Loopable/satisfying ending + open question ("The redactions remain")
10. ☑ Thumbnail = most striking frame (poster: the prismatic fragment macro)
11. ☑ Test hooks in pairs; watch the 3s retention cliff in YouTube Studio
12. ☑ Deliver in both 16:9 and 9:16 (Shorts cut = separate retention surface)

---
*Sources fetched 2026-10-19. Re-check annually — retention benchmarks move fast.*

---

# 🖼️ AI IMAGES & VIDEO AT SCALE — can GitHub do it? (tested 2026-10-19)

## The hard limits first
| Resource | Free GitHub runner reality |
|---|---|
| GPU | **None.** Free runners are 2-core (public: 4-core) CPUs — no CUDA |
| Job length | 6 h max per job |
| Concurrency | up to 20 parallel jobs (public repos) |
| Storage | Release asset ≤ 2 GB/file, unlimited assets; artifacts 90 days |
| Minutes | public repo = **free & unmetered**; private = 2,000 min/mo |

**So:** Stable Diffusion/Flux/Wan/LTX *cannot* run locally on the runner in reasonable time (SDXL ≈ minutes/image on CPU; video models ≈ hours). But Actions can **orchestrate** generation through free APIs — that's the winning pattern.

## Images — ✅ SOLVED, free, unlimited-ish
**Pollinations free URL endpoint** (`image.pollinations.ai/prompt/{text}`):
- **Tested from this workspace today: HTTP 200, JPEG returned, no key needed.**
- Anonymous tier ≈ 1 request / 15 s (≈ 240 images/hour), optional watermark; a free Pollinations account key lifts limits and removes it.
- Wired into the repo: **`.github/workflows/assets.yml`** reads `assets/prompts.txt` → generates → commits to `public/img/generated/`.
- Cost: **$0.** 100 new b-roll images ≈ 25 min of runner time.
- Quality bar tip: keep prompts in the film's visual language (1970s, Kodak grain, tungsten, dust) so new assets match.

## Video — honest options (no free lunch yet)
| Route | Cost | Reality |
|---|---|---|
| Local Wan 2.x / LTX-Video / CogVideoX | $0 software | needs **12–24 GB VRAM GPU** — not on Actions |
| Replicate / fal.ai API from Actions | ~$0.05–0.50 per 3–5 s clip | works well; key stored as repo secret |
| Pollinations video models | pollen credits | same orchestration pattern as images |
| **Motion-graphics (this project)** | **$0** | deterministic, frame-locked to audio, no artifacts — and no "AI-slop" look |

**Verdict:** for a documentary/story format, animated stills + props + motion graphics outperform cheap AI video and cost nothing. Use paid AI video only for 1–2 hero shots per video if ever needed.

## 8–10 minute videos — ✅ solved with parallel rendering
**`render-long.yml`** splits the timeline into equal chunks, renders them on up to **20 runners concurrently**, then concatenates (`ffmpeg concat`, `-c copy`) and muxes the score, publishing one permanent Release.

| Video length | Frames @30fps | 8 workers | Wall time (est.) |
|---|---|---|---|
| 70 s (this film) | 2,090 | 1 | ~12 min |
| 3 min | 5,400 | 4 | ~12–18 min |
| 8 min | 14,400 | 8 | ~20–30 min |
| 10 min | 18,000 | 10 | ~25–35 min |

File size at CRF 17–18 1080p ≈ **25–45 MB/min** → a 10-min film is ~300–450 MB, comfortably under the 2 GB Release limit. Storage stays **$0**.

## Why it must not look "AI-generated" (and what we changed)
YouTube requires disclosure only for *realistic synthetic* content. Our format (photo + motion graphics) isn't that — but viewers still smell "AI" from: **uniform zooms, perfect symmetry, sterile sharpness, repeated motion**. Fixes now in the film:
- **Motivated camera moves only** — every move targets a real subject found by vision (soldier's helmet, radar, fragment, beam, stamp)
- **11 different move types** — lateral track, tilt-up reveal, tilt-down to object, pull-back reveal, handheld track, fast push, locked-off static (breathing shot), macro creep
- **Physical imperfections**: gate weave (projector wobble), exposure flicker, halation glow, dust motes, light leaks, film rebate marks, grain 0.19
- **Human props**: handwritten notebook, reel-to-reel tape deck, stopped wristwatch on an evidence table, yellowed press clipping, thermal scan
- **Breathing moments** — 2 shots with no zoom at all (the 2026 MrBeast correction: constant subtle motion, deliberate big moments)

---

# 🎥 THE PREMIUM LOOK — what professional editors actually do (2026 research)

## Why "zoom in/out" reads as cheap
- **Digital zoom beyond 10–15% starts looking artificial** — editors on r/editors cap it there ([thread](https://www.reddit.com/r/editors/comments/kcfljs/digital_vs_physical_camera_pushin/)).
- *"The trouble starts when the edit turns into a constant punch-in and pull-out sequence"* ([smoothcapture](https://www.smoothcapture.app/blog/how-to-zoom-in-videos-pro-techniques)).
- Documentary editors: *"Subtlety is the key… slow, simple movement that is almost indiscernible is the best method"* ([r/editors](https://www.reddit.com/r/editors/comments/p14685/documentary_editors_and_others_who_work_with_a/)).
- Georgetown film guide: *"AVOID ZOOMING… films with a lot of zooming resemble home movies"* ([Georgetown](https://guides.library.georgetown.edu/c.php?g=75854&p=491500)).

## The professional grammar we now follow
| Technique | Professional spec | Applied in v7 |
|---|---|---|
| **Slow push-in** | 5–10% over 5–10 s, ease-in-out, "imperceptibly slow" | 2–5% over each 3–7 s shot, single direction only |
| **Pull-back reveal** | same rate, reversed — used *once*, for scale | S3 (tent reveal), S7 (beam→base) |
| **Lateral track / slider** | "just barely noticeable" | S1 convoy track |
| **Tilt-up / tilt-down** | motivated by subject reveal | S3, S5 |
| **Rack focus / depth** | layer separation, subtle | staged via GradeBottom + halation depth |
| **Handheld** | **0.5–0.8 px** for documentary; >2 px reads as an effect | clamped to ≤0.25 param |
| **Zoom pulses on words** | ❌ never — this is the "cheap jump" | **removed entirely** |
| **Glitch transitions** | social-media device, not documentary | **all 5 removed** |
| **Hard cuts on impact SFX** | standard documentary grammar | every scene cut = hard cut + impact |

## Vision: how we "watch" the video like a human
No GPU available (2 cores, no CUDA), so a local VLM (Qwen2.5-VL etc.) isn't viable here.
The working stack is:
1. **PySceneDetect** (ContentDetector) → exact shot list + durations
2. **Perceptual hashing** (imagehash phash) → catches the *same picture used twice*
3. **Edge-energy analysis** on the caption band → catches *graphics already placed at the cut*
4. **Dense contact sheets at 4 fps** (~280 frames for this 70 s film) → reviewed visually
5. For deeper semantic QA, `vision_audit.py` can be pointed at a hosted VLM
   (Qwen2.5-VL / MiniCPM-V / GPT-class vision) by adding an API key — the frame
   extraction and prompting scaffolding is already in place.
