# Editing video with a coding agent — what's real, what's marketing

*Researched 2026-10-20. Sources: the AI Systems Lab lesson, the HeyGen
HyperFrames repo, Miftahul Islam Efaz's skill, and a 323-repo graded index.*

---

## 1. The AI Systems Lab lesson — what it actually teaches

**URL:** https://resources.aisystemslab.ai/claude-code-edit-lesson/
**Author:** Adam Stewart · updated 13 Oct 2026

It is an email-gated lesson built around one 33-second reel that is *about its own edit*.
Real numbers from that edit:

| | |
|---|---|
| Raw footage | 3:17.4 across 3 clips |
| Final | 0:33.6 |
| Attempts removed | 37 |
| Pauses cut | 75 (over 0.15 s) |
| Sync tolerance | every effect within **1 frame** of its word |

**The stack is three things, all free except the agent:**

1. **Claude Code** — the agent (needs a paid Claude plan).
2. **HyperFrames** — open source (Apache 2.0), by HeyGen. Write HTML/CSS + seekable
   animations → deterministic MP4. `npm i hyperframes`, needs **Node ≥ 22**.
3. **ffmpeg** — cutting, grading, audio, encode.

**The 11 steps it describes, in order:**

1. Transcribe every clip with word-level timestamps.
2. **Measure edit points from the audio waveform, not the transcript** — Whisper timestamps
   can run up to a third of a second early.
3. Pick takes: last complete take of each line, write `takes.md` explaining each choice.
4. Tight cut: remove pauses > 0.15 s, keep **2-frame handles**, never cut mid-word, tiny
   audio fades so there are no clicks.
5. Grade with ffmpeg; **keep an ungraded copy** for the before/after reveal.
6. Track the face so zooms centre on the eyes; alternate 100 % / 120 % on each cut.
7. Cut the subject out of the background so graphics can sit *behind* the head.
8. Build every graphic in HTML: captions per word, terminal card, timeline strip built from
   real cut data, before/after wipe.
9. Mix: voice clean-up, music ducked ~20 dB under voice, SFX on the beats, master −14 LUFS.
10. **Self-check**: every effect against its word, every frame for text over the face, every
    frame against the safe zone, last frame matches the first (loops).
11. Render preview → approval → final.

**Safe zone it uses for 9:16:** nothing in the top 220 px, bottom 420 px, right 140 px.

**The QC checklist before every final render** — the one thing worth stealing outright:

> 1. Every effect within 2 frames of its word. 2. No text over the face. 3. Nothing outside
> the safe zone. 4. No clipped words, no mid-word cuts, no clicks. 5. Captions spelled right.
> 6. −14 LUFS, −1 dBTP, music ducked. 7. Last frame matches frame 0. 8. No black frames,
> flashes or frozen frames.

### Is it real?

Yes — the technique is real and it is not new. It is **code-rendered video**: a
deterministic renderer plus ffmpeg, driven by an agent that can read files and run commands.
The lesson's genuine insight is not "AI edits video" — it is:

> **Place cuts and effects from the audio waveform, not from speech-to-text timestamps.**

That single line is worth more than the rest of the page, and it is exactly what
`tools/cf_whisper_sync.py` was written to do.

### The catch nobody puts in the headline

The page is a **lead magnet for a paid newsletter**. The prompt is good. The tool is free.
The agent is $20–$200/month. And it only works because the creator *talks to camera* — his
sync map is his own script. There is no talking head in Nightingale, so half the workflow
(takes, face tracking, captions behind the head) does not apply to us.

---

## 2. Miftahul Islam Efaz — the honest finding

**Who he is:** Miftahul Islam Efaz, Chattogram, Bangladesh. Full-stack product builder.
Instagram `@miftahul_islam_efaz`, YouTube `@miftahulislamefaz`.

**What he is famous for:** a Claude Code skill called **Motion-graphics-skill** (a.k.a.
`motion-video-director`), ~141 stars, 188 installs.

**What his style actually is** — read straight off his own skill spec:

| Layer | What he does |
|---|---|
| Plan | hook in the first 3 seconds, pacing, J/L cuts, match cuts, CTA structure |
| Animate | **Canvas, SVG, Three.js, GSAP** — motion graphics drawn in code |
| Footage | punch zooms, subject cut-outs (RVM, SAM2), captions behind the subject, speed ramps |
| Type | kinetic typography, 3D text, UI mockups, cursor animation, stickers, particles, Lottie |
| Sound | risers, impacts, whooshes **synced to the frame**, ducking, **−14 LUFS / −1.5 dBTP** |
| Render | headless Chrome → ffmpeg. **No After Effects, no Premiere** |
| Rules | 12 principles of animation, 60-30-10 colour, WCAG contrast, 9:16 safe zones |

**Two things you should know:**

1. **I cannot watch his Instagram.** Instagram serves video only to a logged-in browser,
   and I have no account — so "check every video on his page" is not something I can do.
   What I *can* read is better: his skill file is the written recipe behind those videos.
2. **His GitHub repo is gone.** `github.com/Miftahul-Islam-Efaz/Motion-graphics-skill`
   returns **404** as of today, and it is no longer in his 19 public repos. It existed on
   17 Oct with 86 stars. The SKILL.md is still mirrored on skills.sh and index sites, which
   is how the table above was assembled.

### Can we copy the style?

**Yes — and we already own the machinery.** His renderer is "write code, render frames with
headless Chrome, encode with ffmpeg." So is Remotion, which is already installed in this repo
(`@remotion/cli 4.0.536`). Same architecture, different syntax.

What we would need to add:

| Piece | Have it? |
|---|---|
| Deterministic frame renderer | ✅ Remotion |
| ffmpeg cut / grade / encode | ✅ `tools/grade_plate.py`, `qa_pro.py` |
| Word-level timestamps | ✅ `tools/cf_whisper_sync.py` |
| Kinetic caption component | ❌ **build — 1 day** |
| SFX cue sheet locked to words | ⚠️ half — sync exists, cue sheet does not |
| Loudness master to −14 LUFS | ❌ add `loudnorm` — 10 minutes |
| Safe-zone / face / loop QC | ⚠️ partial — `qa_pro.py` covers black frames and cuts |

### But should we?

**Partly. This is the decision, not a maybe.**

His style is the **short-form explainer reel** — kinetic type, snap zooms, riser on every
beat, a UI card every three seconds. It works because the viewer is watching a *creator*,
not a document.

Nightingale is an archival reconstruction. Put orange kinetic typography over 1979 photographs
and you have made a content reel about a UFO story — and destroyed the one thing the film has:
**the feeling of recovered evidence.**

So: take the **craft**, refuse the **aesthetic**.

**Adopt (all of it, immediately):**
- 2-frame handles, never cut mid-word
- motion every 2–4 s, never two effects on one beat
- safe zones checked across the whole animation, shadows included
- −14 LUFS / −1 dBTP master
- last frame matches frame 0 (a loop is free watch-time on a 9:16 cut)
- the pass/fail QC table before every render
- **cut to the waveform, not the transcript**

**Refuse (would break the film):**
- kinetic typography as a default layer
- riser/whoosh on every transition
- 120 % punch-ins on stills — our rule is already no zoom jumps
- brand palette cards; the film's palette is the photograph's

**Borrow in one place only:** the exhibit card. A terminal, a timeline strip, a document
zoom — the "show the proof" graphic. That is the one motion-graphic idiom that *adds* to a
documentary, because it shows evidence rather than decorating over it.

---

## 3. "There are GitHub repos that can do any kind of editing" — no

The index is **awesome-claude-video-skills**: 323 repos, each read and security-graded.
Live: https://agentskillshub.top/best/claude-video-skills/

| Category | Count |
|---|---|
| Frameworks & toolkits | 53 |
| Promo & demos | 65 |
| Explainers | 53 |
| **Editing (footage cutting, captions, B-roll, recaps)** | **42** |
| Shorts & social (vertical) | 40 |
| Motion graphics | 23 |
| Stories & animation | 17 |
| Music videos | 12 |
| Scripts & learning | 10 |
| Avatars / lip-sync | 8 |

Sixteen of them were run end-to-end on the same 15-second brief, on a machine with **no API
keys** for video, image or voice models. All sixteen produced a playable film. Ranked by time:

| | Repo | Time | Note |
|---|---|---|---|
| 🥇 | `vincentsch/explainroo` | **2 min** | fastest, does not look like the default |
| 🥈 | `feitangyuan/onetake` | — | one continuous shot, no cuts |
| 🥉 | `remotion-dev/skills` | 4.5 min | Remotion's own skills — reliable, plain look |
| — | `hyperframes` (HeyGen) | 23.5 min | the best-known renderer, and the slowest here |
| — | `Miftahul-Islam-Efaz/Motion-graphics-skill` | — | built for talking-head footage |

**What that test proves:** the *tool* was never the bottleneck. Claude Code with **no skill at
all** made a film that passed every check in 4.4 minutes. Skills earn their place with a
**look**, a **workflow**, or **footage to edit** — not with capability.

So: "any type of editing" is true only in the sense that any of these can *render* anything
you can describe. None of them can decide what belongs in your film. That is still the work.

---

## 4. What this means for us — concrete

**Do not install HyperFrames.** It needs Node ≥ 22; this sandbox has Node 20. More
importantly it duplicates Remotion, which is already wired into the repo. Two renderers is
one too many.

**Do not install the other 320 repos.** Nothing there fixes a defect the frame-by-frame audit
already found.

**Do install three small things:**

1. `loudnorm` mastering to −14 LUFS / −1 dBTP in the audio build — 10 minutes, standards-compliant.
2. A `Captions.tsx` Remotion component driven by `narration.json` word timings — kinetic type,
   but in the film's own quiet register.
3. An `Exhibit.tsx` component: terminal card, document zoom, timeline strip — the one motion
   idiom that belongs in a documentary.

**And one rule change, effective now:**

> Every cut point and every SFX cue is placed from the **waveform**, not from the transcript.

That is the real lesson from the lesson.

---

## 5. Sources

- AI Systems Lab, *Edit a video 100% with Claude Code* —
  https://resources.aisystemslab.ai/claude-code-edit-lesson/
- HeyGen HyperFrames (Apache 2.0) — https://github.com/heygen-com/hyperframes · npm `hyperframes` 0.8.181
- Miftahul Islam Efaz, `motion-video-director` v3.5.2 — mirrored at
  https://www.skills.sh/miftahul-islam-efaz/motion-graphics-skill/motion-video-director
  (GitHub repo returns 404 as of 2026-10-20)
- Awesome Claude Video Skills, 323 graded repos — https://github.com/zhuyansen/awesome-claude-video-skills
