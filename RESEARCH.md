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
