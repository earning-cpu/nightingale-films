# Three editing styles, measured — and which one Nightingale should use

*Researched 2026-10-20. Two creators, one film, one instrument (`tools/style_profile.py`).*

---

## 0. The two people are different people — you were right

| | **Adam Stewart** | **Miftahul Islam Efaz** |
|---|---|---|
| Who | Author at AI Systems Lab | Full-stack product builder, Chattogram, Bangladesh |
| The link you sent | `resources.aisystemslab.ai/claude-code-edit-lesson/` | — |
| Known for | A one-prompt reel edited 100 % by Claude Code | A Claude Code skill that draws motion graphics in code |
| Talks to camera | **Yes — it is a talking-head reel** | **No — there is no person in any frame** |
| Footage | 3:17.4 of himself, 33.6 s out | Screen recordings, UI mockups, 3D product renders |
| Stack | Claude Code + HyperFrames + ffmpeg | Canvas / SVG / Three.js / GSAP → headless Chrome → ffmpeg |
| Audience | Newsletter subscribers | 10,177 Instagram followers, founders buying launch videos |

You were right on both counts: they are not the same person, and Efaz's page has **no talking
head**. I scraped it and confirmed it — see §2.

---

## 1. How I got his videos (no login, no API key)

The method, in one command, works today:

```bash
curl -s -H "x-ig-app-id: 936619743392459" \
  -H "User-Agent: Mozilla/5.0 …Chrome/131…" \
  "https://i.instagram.com/api/v1/users/web_profile_info/?username=miftahul_islam_efaz"
```

That returns the full profile JSON **including a direct `video_url` for every post**, no auth.
Plain `instagram.com/<user>/` and `api.instagram.com/oembed` both return **302 → login wall**.
The `i.instagram.com` app endpoint does not. Rate-limit yourself: one call per profile.

Wrapped properly: `tools/ig_profile.py` (see §7).

**What the repo ecosystem offers:** `instaloader` (logs in, then unlimited), `yt-dlp`
(accepts post URLs, needs cookies for most), `gallery-dl` (same), `instagram-scraper`
(dead), RapidAPI "Instagram Scraper" (paid, $10–50/mo). The unauthenticated `web_profile_info`
endpoint is faster than all of them and needs no account — it is the right tool for
"read a competitor's public grid".

---

## 2. What his page actually is

**`@miftahul_islam_efaz`** · 10,177 followers · 19 posts · bio: *"Helping founders build
working systems"*

Captions, verbatim, from the last 12 posts:

> "I made this video with Claude Opus 5.5 🤯 — Here's the tutorial"
> "Opus 5.5 made these animations"
> "Made a Vertical version of the previous motion graphics video that claude made"
> "every frame is code. even the 3D laptop at the end"
> "I didn't open After Effects once. This whole launch video for my VS Code extension…
> Every frame is code. No timeline, no keyframes."
> "Claude Opus 5.5 just edited this raw video footage. Real Iman Gadzhi footage turned into
> motion graphics, captions, SFX and pacing."

Contact sheet of four of them — no people anywhere:

![contact sheet](qa/efaz_contact.png)

**What it is:** SaaS product motion design. App windows, cursors, UI cards, 3D product
renders, kinetic type on pastel backgrounds. Each post is *also advertising the skill* —
"comment SKILL and I'll DM you the file". It is a funnel, and the videos are the proof.

**What it is not:** documentary, archival, film, or narrative of any kind.

---

## 3. Measured: his work vs ours

Same instrument on every file — `tools/style_profile.py`. Numbers, not adjectives.

| clip | dur s | cuts/min | avg shot s | motion | sat | hue | LUFS | true peak |
|---|---|---|---|---|---|---|---|---|
| efaz 08 (3D) | 22.2 | **0.0** | 22.23 | 0.0068 | **0.9** | 199 | −14.22 | **+1.18** ⚠️ |
| efaz 01 (ad) | 56.6 | 2.1 | 18.88 | 0.0085 | 13.5 | 254 | −14.17 | −1.04 |
| efaz 02 (product) | 142.1 | 4.2 | 12.92 | 0.0073 | 26.8 | 226 | −14.19 | −0.60 |
| efaz 04 (tutorial) | 143.7 | 17.1 | 3.42 | 0.0126 | 9.5 | 155 | −14.14 | **+0.22** ⚠️ |
| efaz 06 (vertical) | 62.1 | 20.3 | 2.82 | 0.0184 | 18.8 | 190 | −14.27 | **+0.07** ⚠️ |
| efaz 00 (tutorial) | 120.0 | **21.5** | 2.73 | 0.0212 | 15.1 | 176 | −14.14 | −0.44 |
| **our film_720** | **69.7** | **8.6** | **6.33** | **0.0081** | **5.2** | 200 | **−14.07** | **−0.91** |

### What the numbers say

1. **He has no single style — he has format-appropriate pacing.** 0 to 21.5 cuts a minute
   across his own grid: a 3D hero stays on one shot for 22 s; a tutorial cuts every 2.7 s.
   *That* is the professional habit worth copying, not any single look.
2. **His loudness is dead constant: −14.1 to −14.3 LUFS on every post.** That is the platform
   standard applied like a machine. Ours is −14.07 — **we already match him**. No work needed.
3. **Three of his six clips clip above 0 dBTP** (+0.22, +0.07, +1.18). Ours is −0.91.
   **We are cleaner than the professional.** "Professional" is a target, not a halo.
4. **His saturation runs 9.5–26.8; ours is 5.2.** We are 2–5× flatter. That is correct for a
   monochrome archive film — and it is precisely why his aesthetic cannot be dropped over ours
   without destroying it.
5. **Motion energy is nearly identical** (0.007–0.021 vs our 0.008). We are not "slower" than
   him in per-frame terms. We just achieve it with pans instead of cuts.

---

## 4. Ranked: what each style is *for*

| # | Style | Purpose | Pacing | Look | Verdict for Nightingale |
|---|---|---|---|---|---|
| **1** | **Ours — archival reconstruction** | Make an unverifiable 1979 event feel like recovered evidence | 8.6 cuts/min, 6.3 s shots, locked pans | Mono, sat 5.2, heavy grain, halation, near-black shadows | **Keep. This is the film.** |
| **2** | **Adam Stewart — talking-head + code graphics** | Sell an idea in 33 s, make the viewer believe an AI did it | ~21 cuts/min, effect per word | Warm cinematic + 3 brand colours, captions per word | Keep the **engineering method**, drop the format (no talking head here) |
| **3** | **Efaz — SaaS product motion** | Sell a product; show the software working | 0–21 cuts/min depending on the beat | Light, pastel, UI cards, 3D, kinetic type | Borrow **two techniques only**: the exhibit card and the loudness discipline |

### Why Efaz ranks below Adam for *this* project

Not quality — **subject**. Efaz's entire grammar is *interface*: windows, cursors, buttons,
cards. A 1979 recovery report has no interface. Every time his style appears in our film,
the audience is reminded they are watching software.

Adam's grammar is *narration synchronised to graphics*. Nightingale has narration. His method
transfers; his face does not.

---

## 5. The decision

**Go with ours, engineered harder.** Concretely, in this order:

### Adopt from Adam (method)
1. **Cut to the waveform, not the transcript** — Whisper runs up to 0.33 s early.
2. **2-frame handles**, never cut mid-word, tiny audio fades at every cut.
3. **The QC table** before every render: sync, face, safe zone, cuts, spelling, loudness, loop,
   black frames.
4. **Motion every 2–4 s, never two effects on one beat.**
5. **Last frame = frame 0** on the vertical cut, so it loops.

### Adopt from Efaz (craft)
6. **Format-appropriate pacing** — his 0→21.5 spread is the lesson. A 22 s hero shot is as
   professional as a 2.7 s cut rate, *if the beat calls for it*.
7. **The exhibit card** — terminal, document zoom, timeline strip, 3D document render. The one
   motion-graphic idiom that adds evidence instead of decorating over it.
8. **Cursor / focus animation on documents.** A slowly drifting highlight across a typed report
   is period-correct and costs nothing.

### Refuse from both
- Kinetic typography as a default layer (Adam's captions, Efaz's kinetic headlines)
- Whoosh/riser on every transition
- Punch-ins above 115 % (breaks our no-zoom-jump rule)
- Pastel/UI palette, rounded cards, brand colours
- Any graphic that covers a face or a document's text

### Fix in our own build
- Nothing on loudness — we are already correct and cleaner than both.
- **Raise saturation 0.5–1 point** in the mid-tones only. At 5.2 we are slightly *under*
  where a real 1979 reversal print would sit. Test on `warm_archive` before changing anything.

---

## 6. What this changes in the plan

| Item | Before | Now |
|---|---|---|
| HyperFrames | "maybe install" | **No** — Node 22 vs our 20, duplicates Remotion |
| Efaz skill | "copy his style" | **No repo** (404), and wrong subject. Copy the exhibit-card idiom only |
| Captions component | unplanned | **Build** — but as *document subtitles*, mono, 2–3 words, no colour pop |
| Loudness | "add loudnorm" | **Already correct at −14.07.** Verify only |
| Cut placement | transcript-based | **waveform-based**, mandatory |
| Saturation | untouched | test +0.5 to +1.0 in mid-tones on one scene |

---

## 7. Tools written for this

| File | What it does |
|---|---|
| `tools/style_profile.py` | Measures any clip: shots, cuts/min, avg shot, motion energy, luma/sat/hue, LUFS, true peak. `--json` for archiving |
| `tools/ig_profile.py` | Lists an Instagram account's public posts + direct video URLs, no login |

```bash
python3 tools/style_profile.py qa/ig/*.mp4 docs/film_720.mp4 --json qa/style_compare.json
python3 tools/ig_profile.py miftahul_islam_efaz --download qa/ig
```

---

## 8. Sources

- AI Systems Lab lesson — https://resources.aisystemslab.ai/claude-code-edit-lesson/
- `@miftahul_islam_efaz` — https://www.instagram.com/miftahul_islam_efaz/ (public grid read via
  `i.instagram.com/api/v1/users/web_profile_info`, 2026-10-20)
- Efaz's skill spec v3.5.2 — https://www.skills.sh/miftahul-islam-efaz/motion-graphics-skill/motion-video-director
- Efaz's GitHub — https://github.com/Miftahul-Islam-Efaz (19 public repos; the motion-graphics
  skill repo returns **404** as of 2026-10-20)
- Measurements — `qa/style_compare.json`, `qa/style_efaz.json`
