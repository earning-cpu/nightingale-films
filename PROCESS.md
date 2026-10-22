# How 72 SECONDS is actually made — the full funnel

Written after the v2 delivery, as an honest account of every stage, every filter,
and every reason the result still reads as "moving photographs" rather than film.

---

## 1. Straight answers

**Are the images generated or stock?**
Every single one is **AI-generated**. Zero stock, zero archival scans, zero
photographs I found anywhere.

| | |
|---|---|
| Model | `@cf/black-forest-labs/flux-1-schnell` on Cloudflare Workers AI |
| Endpoint | `POST /client/v4/accounts/{id}/ai/run/@cf/black-forest-labs/flux-1-schnell` |
| Cost | free tier; measured **2.5 s per image** |
| Native size | **1280 × 720** (the model fixes it; width/height/seed are rejected) |
| Count in this film | **10 plates** + 7 depth-derived clips + 3 code-drawn cards |

Also generated: the depth maps (Depth-Anything-V2-Small), the voice (Microsoft
edge-tts neural), the booms/ticks/tone (sine synthesis, not samples). Drawn in
code: the 6EQUJ5 printout card, the 1420.4556 readout, the end card, all captions.

---

## 2. The image funnel — 7 gates before a plate is allowed on screen

```
prompt  →  FLUX  →  gate 1-4 (numbers)  →  gate 5 (100% inspection)
        →  gate 6 (depth map)  →  gate 7 (warp)  →  timeline
```

### Gate 1–4 — measured automatically
After every batch I compute, on a 160×90 downsample:

| metric | why | reject if |
|---|---|---|
| mean luminance | a plate that averages 5 % grey is invisible on a phone in daylight | `< 30` |
| p95 luminance | something has to be bright enough to give the eye an anchor | `< 80` |
| histogram spread | flat grey = no composition | — reviewed |
| per-plate identity | no shot may repeat; duplicates get caught here | any repeat |

This is why v2 exists at all: the first set (prefix `p_`) measured **mean 5–37
on eight of fourteen plates**. They were technically correct and completely
invisible. I regenerated a brighter set (`b_`) with explicit light direction in
the prompt — "strong rim light", "harsh side light", "bright practical light" —
and dropped every plate that failed.

### Gate 5 — 100 % inspection (the one that catches AI tells)
I view a contact sheet of every plate at full size. Looking specifically for:
hands with six fingers, text that isn't text, faces, symmetrical
"AI-perfect" geometry, impossible cables, warped reflections, plastic skin,
and the tell-tale FLUX sheen on metal.

This is also why **every prompt says "no people"**. A wrong hand destroys a
film faster than an empty room does. That was a deliberate trade: safety for
emptiness. It is one of the reasons the film does not feel professional — see §7.

### Gate 6 — depth map
`Depth-Anything-V2-Small-hf` via `transformers` pipeline, on CPU (~10 s/frame
to infer once per plate, then cached for all 90 frames). Output: float32 in
[0,1], 1 = near.

### Gate 7 — the warp
Per frame *i* of 90:

```
t      = i / 89                          smoothstep → t² (3−2t)
depth' = depth ^ 0.75                    keeps midtones from flattening
offset = strength × width × t × depth'   strength = 0.030 → 38 px at 1280
map    = (x + offset·dirx, y + offset·diry)  clipped to the frame
```
Near pixels move, far pixels barely move. That is real differential parallax in
the pixels, and it is also the source of the artefact you can still see — at a
depth edge (dish against sky) neighbouring pixels receive different offsets, so
the edge **stretches** instead of occluding. A warp cannot invent the background
that should be revealed behind a foreground object. Hence "moving edges".

---

## 3. The voice funnel

| stage | setting |
|---|---|
| engine | `edge-tts`, voice `en-US-ChristopherNeural` |
| rate | **+6 %** (v1 was −6 %; too slow for a hook) |
| output | mp3 → 48 kHz mono WAV per line, 12 lines |
| timing | `WordBoundary` events give **an offset in 100-ns ticks for every word** |
| retry | the service intermittently returns no audio; 4 attempts, then a −4 % fallback |

Those word offsets are the spine of the whole film. Everything else is built
from them.

---

## 4. How voice, picture and graphics stay in sync

One timeline object (`src/wow/timeline.json`) is the single source of truth.
Each scene stores `voStart`, `voDur`, and `words: [{w, f}]` — word, absolute frame.

```
TTS word offsets ──► word frames ──┬──► caption groups (3 words)
                                   ├──► graphic cues (regex lookup)
                                   ├──► SFX cue frames
                                   └──► shot lengths (scene duration)
```

**Graphics are cued to words, not to seconds.** In `Wow.tsx`:

| graphic | fires on |
|---|---|
| `72` stamp | first word matching `/72\|seventy/` |
| frequency counter locking to 1420.4556 | word `megahertz` |
| six tiles 6 E Q U J 5 landing | word `6`, then one every n frames |
| the red "Wow!" ink stroke | word `wow` |
| boom #2 | word `megahertz` |
| boom #3 | 2 frames before `wow` |
| printer ticks | `voStart + 14 + 9·k` |

**Captions** are the same word array, sliced 3 at a time:

```
group_i starts at words[3i].f, ends at words[3i+3].f
word already spoken → white; word not yet spoken → 42 % opacity
```

So the text on screen is literally the text being said, at the frame it is said.
Measured worst reading speed **13.1 CPS** (Netflix limit 20).

**What is *not* synced:** the moving plates. A parallax clip starts when its shot
starts, not when a word lands. The cut rhythm follows sentence lengths. That is a
real gap — film cuts on breath and beat, not on grammar.

---

## 5. The motion-graphics layer

Six overlays, all in code, all deterministic (seeded `prand`, no `Math.random`,
so any frame renders identically every time):

1. **Camera** — one continuous move per shot: `scale(s) · translate(px, py)`,
   `s` and focus interpolated with `easeInOutCubic`, plus a handheld wander.
   The pan is **clamped** to `(s−1)/2` of the frame, so a plate can never pan
   off its own edge — that was the v1 "moving edge" bug.
2. **FilmGrain** — 512² noise texture, repositioned every frame from a seeded
   hash, `mix-blend-mode: overlay`.
3. **Scanlines** — 1 px dark line every 3 px, 5 % opacity.
4. **Vignette** — radial gradient, 42 % at the corners.
5. **Letterbox** — 84 px black bars top and bottom (2.35:1 inside a 16:9 frame).
6. **Slug** — top-left mono caption, e.g. `RECEIVER B · 1420 MHz`.

---

## 6. Every filter, in the order it runs

### Video — `build_v2.sh`

| # | filter | what it does | why |
|---|---|---|---|
| 1 | `scale=out_range=tv:out_color_matrix=bt709:flags=lanczos` | tag the render as broadcast-range 709 | the Remotion render is untagged; without this everything looks washed |
| 2 | `format=yuv420p` | 8-bit 4:2:0 | required before filters that need a chroma layout |
| 3 | `curves=all='0/0.030 0.25/0.286 0.5/0.516 0.75/0.740 1/0.985'` | lift blacks 0 → 0.030, gentle S in the midtones | kills crushed blacks, keeps the S-curve film feel |
| 4 | `eq=contrast=1.0:saturation=0.93:gamma=1.03` | 7 % desaturation, slight gamma lift | makes FLUX plates look like one stock, not seven |
| 5 | `noise=alls=7:allf=t+u` | temporal + uniform grain | the only thing that stopped QC reporting frozen frames |
| 6 | `scale=1920:1080:flags=lanczos` | upscale from the 60 % render | cost: this is a 1.67× upscale of a 1152×648 render |
| 7 | `setsar=1` | square pixels | |
| 8 | `format=yuv420p` | back to 4:2:0 | must be the **last** filter or the colour tags break |
| 9 | `drawbox … h=84` ×2 | repaint the letterbox bars true black | the shadow lift in #3 was turning the bars grey |
| 10 | `libx264 -crf 20 -maxrate 6000k -preset slow` | master encode | |
| 11 | `-x264-params colorprim/transfer/colormatrix/range` | VUI tags | x264 ignores `-colorspace` for VUI; only x264-params writes it |

**A defect I can name precisely:** grain (#5) is applied at **1152×648** and then
upscaled by #6. Real grain is 1 pixel at delivery size; mine is a 1.67-pixel
soft blob. Moving `noise` after the final `scale` is a one-line fix that will
make the texture read as film instead of as compression noise. It was not in the
QC gate, so it shipped.

### Audio — `make_wow_v2.py`

| # | filter | what it does |
|---|---|---|
| 1 | `adelay={ms}\|{ms}` per line | places every VO line at its absolute frame |
| 2 | `highpass=f=65` | removes rumble and handling noise under the voice |
| 3 | `acompressor=threshold=-20dB:ratio=3.2:attack=10:release=180` | evens the narration, gives it body |
| 4 | `alimiter=limit=0.891` (−1 dB) | catches transient peaks before the encoder |
| 5 | `afade=t=out:d=0.9` | clean tail |
| 6 | `loudnorm=I=-14:TP=-1.5:LRA=9` (second pass, separate file) | broadcast/web loudness |

SFX are synthesised, not sampled: boom = 44 Hz sine with a 110 Hz lowpass and a
1.4 s decay; tick = 2.2 kHz 50 ms; tone = 1420 Hz with a 0.9 s fade in.

### The ladder

`crf 24 @ 3200k` (1080) → `1280×720 crf 25 @1800k` → `854×480 crf 26 @1100k`
→ `640×360 crf 28 @650k`. Vertical: crop the 84 px bars **first**, then
`force_original_aspect_ratio=increase` + `boxblur=60:3` as a fill, overlay the
sharp 1080-wide copy centred.

---

## 7. Why it does not look professional — the actual mechanisms

Ranked by how much damage each one does.

**1. There is no motion in the image, only motion of the image.**
Every shot is a still photograph under a global 2D transform. Nobody walks,
nothing drifts, no light changes, no paper feeds. Human vision classifies that in
under a second as "photo being pushed around" — the exact same cue as a PowerPoint
Ken Burns. A depth warp adds differential motion but still no *event*. This is
90 % of the problem and no amount of grading fixes it.

**2. The parallax warp smears edges.** Explained in §2.7. A warp displaces; it
cannot reveal occluded background. At every high-contrast edge you get stretch.

**3. Resolution is 1024 real pixels in a 1920 frame.** Plate 1280 → composition
1.25× because the camera needs room to move → render at 0.6 → upscale 1.67×.
Net: about **1024 pixels of actual detail** stretched across 1920, on 2 CPU cores
and 1.9 GB RAM. Softness reads as "cheap" long before anyone can name it.

**4. No people.** Every prompt says "no people" for safety, so the film has no
faces, no hands, no eyes. Documentary language is built on them. An empty
corridor is atmosphere; a person in it is a story.

**5. One grade for the whole film.** Every shot goes through the same curve. Real
editing balances each shot against its neighbour — this one is uniform, which
reads as flat.

**6. Graphics sit on the picture, not in it.** The 6EQUJ5 card, the readout and
the stamp are flat UI. No shadow on the paper, no grain over the type, no lens
between camera and card. They read as a template.

**7. The moves are all the same weight.** Same ease, same duration, same
distance. No acceleration, no settle, no whip pan, no match cut, no shot that
ends early on purpose.

**8. 30 fps with no motion blur.** Film has a 180° shutter. A still pan at 30 fps
with zero blur is one of the strongest "this is a slideshow" signals there is.

**9. The sound is synthetic.** A TTS voice with no room, no breath and no
performance; a pure sine "boom" with no transient; no music, no room tone.
Half of perceived production value is sound, and this half is thin.

**10. Cuts follow grammar, not rhythm.** Scene length comes from how long the
sentence takes. Film cuts on beats and breaths.

---

## 8. Can we make better videos? Yes — three routes

| route | what it fixes | cost | time | verdict |
|---|---|---|---|---|
| **A. Real image-to-video** (Kling / Runway / Veo / Wan 2.2 on a rented GPU) | #1, #2, #3, #8 | ₹0 with free credits, else ~$10–30 | hours | **the only real fix.** Motion exists in the pixels, edges are generated, not warped. |
| **B. Real footage** (NASA, Prelinger, public-domain archival) | #1, #3, #4, #8, and every AI tell | free | medium | **zero AI look.** Available for a 1977 radio-telescope story. Needs colour-matching work. |
| **C. Stay with stills, fix everything else** | #5, #6, #7, #9, #10 partly | free | ~1 day | still a slideshow, but a *good* one: music bed, real SFX samples, per-shot grade, grain at delivery size, layer-split parallax with occlusion fill, cut to music. |

Cheapest real gains, in order: **music bed + sampled SFX** (perceived value jumps
more than anything else per rupee) → **grain after upscale** (one line) →
**per-shot grade** → **slow the camera moves and let some shots be still**
(constant motion is itself an amateur tell) → **cut to music**.

---

## 9. If you say go, this is what I'd do

1. Rent one GPU hour (Kaggle T4 is free and already connected) → Wan 2.2 image-to-video
   on the 5 best plates, 3 s each, at 720p. Grade to the same look. Compare side by
   side against the current parallax clips.
2. Rebuild the audio bed: one music cue, sampled impacts, room tone under the VO.
3. Move `noise` to after the final scale; add a 180°-shutter motion blur pass.
4. Cut to the music: 8-bar structure, cut on the downbeat, keep the words landing
   between cuts instead of the reverse.
5. Re-QC, republish, and put the A/B in Kaggle.

---

# v4 — what actually changed, and the vocabulary behind it

v3 was a well-lit slideshow with good plates. v4 is built from the five things
that separate a film from a slideshow: pacing, sound, music, easing, and the
cut that the audio crosses.

## 10. Pacing — ASL and "enter late, leave early"

**ASL** = average shot length. Under 3 s reads as urgency; 3–6 s as natural;
over 10 s as weight. Modern features sit near 2.5 s; trailers and short-form
openers under 2 s. v3 measured 2.19 s over 44 shots; v4 measures **1.91 s over
46 shots in 88 s** — deliberately under two seconds, because this is a hook-led
short, not a scene.

The single highest-leverage pacing rule is **enter late, leave early**: start
each shot after the action has begun and cut before it finishes. Every cut in
v4 is therefore on a *word*, not on a grid, and the picture is allowed to lead
or lag that word by up to 6 frames — which turns the join into a J-cut or an
L-cut instead of a butt-join.

Other pacing levers in use:

- **Cut on emotion first** (Murch's rule of six: emotion 51 %, story 23 %,
  rhythm 10 %, eye-trace 7 %, 2D plane 5 %, 3D space 4 %). If a cut serves
  rhythm but breaks the emotion, it is the wrong cut.
- **Cut on a beat, a gesture, or a breath** — never on an arbitrary frame.
- **Watch it with the sound off.** If the picture alone does not tell the
  story, the graphics are doing work the edit should be doing.

## 11. Roll and cut vocabulary

- **A-roll** — the spine: the narration and the shots that carry it.
- **B-roll** — coverage that illustrates: establishing plates, cutaways,
  inserts, process shots, archival.
- **C-roll** — tertiary texture: atmosphere, abstract motion, graphics.
- **D-roll / L-roll are not editing terms.** The ask almost certainly meant
  **J-cut and L-cut**:
  - **J-cut** — the *next* scene's audio arrives before its picture. The sound
    pulls you into the cut.
  - **L-cut** — the *current* audio runs on over the next picture. The voice
    carries you across the cut.
  Both are audio bridges, and both are why a film feels continuous rather than
  stitched.

## 12. Sound — five layers, each with one job

| layer | what it is | job | v4 level |
|---|---|---|---|
| **DX** dialogue | the narration | carries story | −16 LUFS short-term |
| **AMB** ambience | room tone, air, wind | glues cuts, hides edits | −34 LUFS |
| **SFX** hard effects | printer, paper, clicks | sync to visible action | peaks −8 to −12 |
| **FX** designed | impacts, risers, braams, stingers | emotion and transitions | momentary |
| **MX** music | the score | pace and lift | bed −28, ducked |

Rules that matter more than the levels:

- **An impact is three layers**: transient (the click), body (the low hit),
  tail (the decay). A single sample on a grid is what "boring SFX" sounds like.
- **Ducking**: music is sidechained to the voice, not turned down globally, so
  it breathes back up in the gaps.
- **Negative space** before a hit — v4 drops 0.55 s of near-silence before the
  climax. Silence is the loudest edit.
- **Diegetic vs non-diegetic** is a decision, made per sound, not an accident.
- **Foley** is performed sync sound; **hard effects** are real objects;
  **designed effects** are impossible things (a magnetar flare).
- Whoosh through a cut = a **sound bridge**, the audio equivalent of an L-cut.

## 13. Music — three acts, one motif

- **Act 1 setup** (0–22 s): drone, a bell motif, no pulse. Establishes D minor.
- **Act 2 escalation** (22–62 s): an **ostinato** in eighth notes grouped
  **3-3-2**, a half-time kick, a rising pad.
- **Act 3 climax** (62–88 s): taiko, braams, then the last line on a bare
  drone. Final hit plus a long tail.

Tempo: **100 BPM**, so one beat = 0.6 s = exactly **18 frames** at 30 fps and
one bar = 2.4 s = 72 frames. That is why cuts can be snapped to bars without
ever landing on a fractional frame. 100 BPM sits in the "slow build" band
(90–110); 60–80 would be gravity/solitude, 130–160 action.

The score is **synthesised from scratch in numpy** (`tools/synth_score.py`):
detuned-saw pads, a sub drone, a bell lead, an eighth-note ostinato, taiko,
braams, and a `tanh` limiter. No samples, no licensed music.

## 14. Keyframing — the easing vocabulary

Linear interpolation is the single biggest amateur tell. v4 uses:

| curve | cubic-bezier | use |
|---|---|---|
| snappy entrance | `(0.16, 1, 0.3, 1)` | type in, cards in |
| accelerating exit | `(0.70, 0, 0.84, 0)` | anything leaving |
| symmetric move | `(0.65, 0, 0.35, 1)` | on-screen camera moves |
| overshoot settle | `(0.34, 1.56, 0.64, 1)` | playful arrivals, counters |

- **Anticipation** — 2–3 frames of counter-move before the main action.
- **Overshoot** — 1 frame past the target, then 4–6 frames to settle.
- **Follow-through / overlapping action** — trailing parts arrive 40–80 ms
  after the leading part.
- **Secondary motion** — a small rotation or scale breath on top of the main
  move, so nothing is mathematically still.

In `src/wow/Wow.tsx` these are `outBack` (overshoot), `outCubic`/`outQuint`
(decelerating), `inExpo` (accelerating exit), and `P(f, at, dur)` for
normalised progress.

## 15. Cutout animation types in v4

Each one is a *rig*, not a transition, and each carries a drop shadow with a
real offset so it sits in the plate instead of sliding over it:

1. **Hinge / pivot rotate** — the paper corner swings on an off-centre origin.
2. **Paper drop** — falls in, overshoots, settles with a 2-frame bounce.
3. **Card slide-up** — enters from below with overshoot, exits early (enter
   late, leave early).
4. **Counter roll** — digits count to 1420.4556 with an overshoot at lock.
5. **Tile flip** — the six characters land one per spoken letter.
6. **Parallax sway** — far/mid/near planes move at 0.15× / 0.45× / 1.0×.
7. **Radial reveal** — circle drawn round the logbook string.
8. **Mask wipe** — the split screen wipes between two plates.
9. **Type-on** — lower thirds, slugs.
10. **Spring scale** — kinetic type punch-in.

Effects riding on top: **drop shadow** (offset, soft), **rim light** (a bloom
duplicate screened back), **halation** (highlights blurred and tinted), **depth
of field per plane** (far plane softer), **dust and light interplay**
(screen-blend particles + a travelling anamorphic sweep).

## 16. The finish order (build_v4.sh)

1. technical: bt709, lanczos upscale from the 60 % render, 1920×1080
2. look: curve lift, gamma, saturation
3. **halation**: highlights split, blurred σ=26, tinted red-orange, screened
   back at 30 % — only in the highlights, or it reads cheap
4. texture: grain **after** the upscale, so it is 1 px at delivery size
5. letterbox: 84 px bars drawn **last**, so the grade can never grey them

Colour vocabulary used: **lift / gamma / gain** (shadows / mids / highlights),
the ASC CDL equivalents **offset / slope / power**, a **qualifier** (key by
luma to isolate highlights for the halation), and **film emulation** (lifted
blacks, gate weave from the grain loop, dust).
