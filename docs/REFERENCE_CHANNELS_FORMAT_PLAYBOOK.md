# Reference-channel access, format and Platform Two application

**Updated:** 17 November 2026 (UTC)
**Scope:** Khooni Monday, Scary Pumpkin, Scary Town Hindi, Chacha Ke Facts, Bloody Satya.
**Important distinction:** the channel/video research below uses public titles, descriptions, captions/transcripts and third-party view-count tables. It is **not** a frame-by-frame or audio-track audit of the creators' videos.

## Executive findings

- I tested an ordinary, no-cookie `yt-dlp --simulate` request against one public YouTube video. YouTube's initial-data request failed with **TLS/SSL EOF**. Simulation did not save a media file; reference video/audio files downloaded: **0**. No proxy, login-cookie, player or restriction bypass was attempted.
- YouTube's own Terms restrict copying/downloading content except when expressly authorized by the Service or with prior written permission; the terms also restrict automated access and circumvention. Safest completion path: get creator-provided review files/proxies and written permission, or have the rights holder arrange a review screener. Do not use a third-party ripper as a workaround. See [YouTube Terms of Service](https://www.youtube.com/t/terms), [YouTube Data API videos.list](https://developers.google.com/youtube/data/reference/rest/v3/videos/list), and [YouTube license types](https://support.google.com/youtube/answer/2797468?hl=en).
- This five-channel set does **not** currently confirm a channel whose videos are solely still-image slideshows. Public descriptions identify Scary Pumpkin and Scary Town Hindi as animation, and Khooni Monday as an animated horror video podcast; Bloody Satya includes a live-action short-film format. Chacha Ke Facts is narration-led in the reviewed text, but its picture/edit treatment remains unknown. These are format descriptions or transcript-level clues, not visual findings about motion in every sampled upload.
- Highest-viewed examples surfaced from vidIQ's channel tables (snapshot **17 Nov 2026**) are listed below. They are useful topic/title candidates, not proof that a particular editing technique caused popularity. Some top videos are compilations, long-form animation or devotional/paranormal topics, not Shorts.
- I applied a **rights-safe, original** short-form structure to Platform Two. New render: [`docs/deliverables/platform-no2-short-format-test.mp4`](deliverables/platform-no2-short-format-test.mp4). The prior master remains unchanged. The new export is 48.5 seconds, 1080×1920, 30 fps, H.264/AAC; measured integrated loudness is −15.0 LUFS and true peak −1.4 dBFS. It uses the same six original plates, reframed across 11 timed story beats, a visible clue highlight, and a story-specific closing question. It is still-image/cinematic-pan storytelling—not full animation.

## 1. Lawful ways to complete visual and audio analysis

### What was tested here

Command (format selection only; simulation, no media file output):

```bash
yt-dlp --simulate --no-warnings --no-playlist \
  -f 'bestvideo*+bestaudio/best' \
  'https://www.youtube.com/watch?v=gT_lrolo4UY'
```

Outcome: `Unable to download API page: TLS/SSL connection has been closed (EOF)`. The shell's permitted egress does not include YouTube's video/API/CDN hosts. No reference frames, audio, or video bytes were available to analyze. The installed `yt-dlp` tool does not override that network limit or create rights to a creator's content.

### Practical authorized routes

1. **Ask each creator/rightsholder for a review copy or proxy.** Request 5–6 selected files per channel (25–30 total) or a smaller first batch, along with written permission that explicitly covers downloading/analysis for research. A creator can provide an original source, private screener, or licensed review copy independently of YouTube's stream.
2. **Use an authorized playback/review session.** If the creator or platform has authorized the intended review, a human can watch in the permitted player and record timecoded notes. For this workspace there is no actual YouTube video player/decoder path, so an authorized playable file or accessible screener is still needed for me to perform the visual scan.
3. **Use only content with a verified license and permitted delivery method.** Check the actual upload's license and all included rights. YouTube's Creative Commons Attribution option is not a blanket license for every upload; confirm ownership and required credit. Permission to reuse content and permission/method to download from a platform are distinct questions.
4. **For your own uploads**, export the source/master from the creator account or provide the original files directly.

The official YouTube Data API returns structured video resources (such as metadata/statistics); it is not a source of downloadable media. For the authorized files, our local analysis can decode every frame, produce contact sheets and cut candidates, inspect image composition/on-screen text, and use FFmpeg for loudness/peak/silence/spectral measurements. Faster-Whisper is installed, but its Hindi model weights are not cached and the required model host is outside current egress. A supplied transcript or accessible local ASR model would resolve that gap.

### Planned per-video audit once files are authorized

- Decode and scan every frame; manually review detected cuts and contact sheets.
- Log shot duration, motion type (live action, character animation, moving still, static slide), framing, subject placement, captions, legibility, and visual change.
- Measure speech/music/SFX levels, integrated loudness, true peak, pauses, speech rate, and mix balance; transcribe Hindi where an authorized model is available.
- Build a timecoded beat sheet: hook → premise/rule → escalation → reveal/payoff → close; then compare against Platform Two.
- Keep view totals and the visual/audio analysis separate. A popular upload is not causal evidence that its edit or sound caused the views.

## 2. Is this set still-image-based or motion-based?

| Channel | What public descriptions / reviewed samples indicate | Still-image-only conclusion? | Confidence / gap |
|---|---|---|---|
| **Khooni Monday** | Channel description calls its stories an animated horror video podcast. In our transcript sample, some Shorts are host/podcast excerpts; Aarey Colony is a narrated plot. | **Not established.** “Animated” does not tell us whether each scene is full character animation, limited motion, a still with a pan, or a podcast shot. | Low for exact motion style. Needs playback. |
| **Scary Pumpkin** | Channel descriptions call these animated horror stories; the top-viewed examples include long animated-story titles and compilations. | **No evidence of a still-image-only channel.** Exact animation cadence/amount is unknown. | Medium for broad format from creator/channel descriptions; low for frame-level technique. |
| **Scary Town Hindi** | Channel description calls the stories animation; top-viewed catalog is predominantly long horror-story episodes. | **No evidence of a still-image-only channel.** | Medium for broad format; low for frame-level technique. |
| **Chacha Ke Facts** | Reviewed transcripts are conversational, host-led long narrations; the transcript does not reveal whether the video uses a host, still illustrations, animated inserts, or a static background. | **Unresolved.** This is the main still-vs-motion candidate to inspect, not a confirmed still-image channel. | Low until playback. |
| **Bloody Satya** | The sampled catalog is mixed: narrated Shorts and live-action short films (for example, *The Onion Witch* and *Sona Mana Hai*). | **Not still-image-only as a channel.** A specific Short may still use stills; not checked frame-by-frame. | Medium for mixed catalog, low for individual visual methods. |

**Bottom line:** we can confidently say our current Platform Two master is a still-image/cinematic-pan video. We cannot truthfully label any reference channel “still images, not video” from transcripts, page text, titles, thumbnails, or view counts alone. A video thumbnail is one still frame, not evidence of the video's editing style.

## 3. Most-viewed examples surfaced

Counts below are rounded estimates shown in vidIQ's **Top videos** tables as fetched 17 Nov 2026; pages can change and are not creator-certified analytics. Lists mix durations, series, compilations, and topics. They are not directly comparable to Shorts view totals.

### Khooni Monday

Source: [vidIQ Khooni Monday stats/top videos](https://vidiq.com/youtube-stats/channel/@khoonimonday/)

| Video | Views shown | Why it is a useful premise reference |
|---|---:|---|
| [Labubu Doll Horror Story](https://www.youtube.com/watch?v=L0BPCUlp4qo) | 16.81M | A current, recognizable object turned into a threat. |
| [Annabelle Rap Song](https://www.youtube.com/watch?v=hkgr5eV0K24) | 13.81M | Familiar horror icon plus a format twist (music/rap). |
| [School Trip](https://www.youtube.com/watch?v=vRJwIFVHykI) | 12.26M | Ordinary group outing becomes a contained danger. |
| [Munjya Real Horror Story](https://www.youtube.com/watch?v=z1BY7TgKdGY) | 10.17M | Local folklore/recognizable entity. |
| [The Nun Full Story](https://www.youtube.com/watch?v=CIogAU2OTRM) | 9.49M | Familiar supernatural subject in long-form podcast framing. |

### Scary Pumpkin

Source: [vidIQ Scary Pumpkin stats/top videos](https://vidiq.com/youtube-stats/channel/@scarypumpkin/)

| Video | Views shown | Premise signal from title/page |
|---|---:|---|
| [Chhalava Complete Story](https://www.youtube.com/watch?v=HikM22mwxoc) | 41.39M | Named folkloric threat; complete-story promise. |
| [Welcome Home Compilation](https://www.youtube.com/watch?v=nNLc_5cArIs) | 26.67M | Compilation/binge packaging. |
| [Chhalava Horror Story](https://www.youtube.com/watch?v=h047kn-XPi4) | 14.71M | Repeatable folklore label. |
| [Haunted Train](https://www.youtube.com/watch?v=pb18n_13XDs) | 12.91M | Familiar transport setting turned uncanny. |
| [Yakshini Horror Story](https://www.youtube.com/watch?v=FP-k3ytHCp0) | 12.33M | Named supernatural folklore figure. |

### Scary Town Hindi

Source: [vidIQ Scary Town Hindi stats/top videos](https://vidiq.com/youtube-stats/channel/@scarytownhindi/)

| Video | Views shown | Premise signal from title/page |
|---|---:|---|
| [Apsara Beauty Parlour](https://www.youtube.com/watch?v=CWWq0ZRKE4U) | 44.16M | Everyday business setting meets mythic figure. |
| [Maut Ka Santa Claus](https://www.youtube.com/watch?v=hEQQoHcULuc) | 29.84M | Familiar seasonal icon turned threatening. |
| [Bhagalpur Express](https://www.youtube.com/watch?v=w9JWr9CvaBI) | 15.90M | Named train/route premise. |
| [Serbian Dancing Lady](https://www.youtube.com/watch?v=-nremUieVD8) | 12.84M | Viral internet legend with a clear visual archetype. |
| [Train Mein Dayan](https://www.youtube.com/watch?v=Kl2qQP0Kkm0) | 9.38M | Strong, instantly legible setting plus supernatural threat. |

### Chacha Ke Facts

Source: [vidIQ Chacha Ke Facts stats/top videos](https://vidiq.com/youtube-stats/channel/@chachakefacts/)

| Video | Views shown | Category note |
|---|---:|---|
| [Jai BajrangBali, Salasar Balaji Chamatkar](https://www.youtube.com/watch?v=OsDzgGGThBo) | 1.16M | Top surfaced overall example; devotional miracle, not horror fiction. |
| [मुर्दाघर में नौकरी करनी पड़ी भारी](https://www.youtube.com/watch?v=20JBhotwETU) | 1.00M | Strongest horror-story entry in this surfaced top list; morgue/night-shift setting. |
| [साई बाबा के चमत्कार](https://www.youtube.com/watch?v=jharUjIiJqA) | 707K | Devotional/miracle topic. |
| [खाटूश्याम बाबा का चमत्कार](https://www.youtube.com/watch?v=TuIj24-ZB_0) | 670K | Devotional/miracle topic. |
| [महादेव और नटखट बालक](https://www.youtube.com/watch?v=F0zIz_hT6fQ) | 648K | Mythic/comedy tale, not a horror Short. |

### Bloody Satya

Source: [vidIQ Bloody Satya stats/top videos](https://vidiq.com/youtube-stats/channel/@bloodysatya/)

| Video | Views shown | Category note |
|---|---:|---|
| [मरने के बाद ज़िन्दा हुआ आदमी](https://www.youtube.com/watch?v=hquKUbTKzGo) | 4.31M | Death/afterlife curiosity framing. |
| [Neem Karoli Baba miracles](https://www.youtube.com/watch?v=5W7WI3s3YQs) | 3.72M | Devotional/paranormal claim, not a conventional ghost-fiction Short. |
| [Nidhivan camera claim](https://www.youtube.com/watch?v=dAtrsEK9Bzw) | 3.18M | “What did the camera reveal?” curiosity framing. |
| [7 Alive Proof of Mahabharat](https://www.youtube.com/watch?v=LBq9a5mIRZw) | 3.05M | Numbered evidence/claim package. |
| [5 Alive Proof of Shri Krishna](https://www.youtube.com/watch?v=z8gn33-C0Gw) | 2.83M | Numbered curiosity/evidence package. |

These tables show that several channels' highest-count uploads are **not** the same genre or duration as Platform Two. In the relevant horror-story subset, searchable ingredients worth testing are a familiar location/object, a one-sentence supernatural rule, escalating evidence, and one concrete reveal. This is a working creative hypothesis—not an explanation of the view counts.

## 4. Rights-safe “viral attempt” format—not a guarantee

Use broad structural principles, not another creator's script, footage, image, voice, character, logo, distinctive scene, or near-identical title. Keep Platform Two's Chhattisgarh night-shift setting and its “impossible platform” rule original.

| Time | Beat | Audience question to answer |
|---|---|---|
| 0–1.5 s | Show the anomaly before a slow establishing shot; one short hook line. | “What is wrong here?” |
| 1.5–7 s | Identify the person, local setting, and time in one compact setup. | “Who is trapped, where, and when?” |
| 7–14 s | State one supernatural rule / contradiction. | “What should not be possible?” |
| 14–31 s | Deliver 3–4 pieces of evidence; change framing/subject every few seconds, while keeping each beat readable. | “Is the first clue repeating or getting worse?” |
| 31–42 s | Reveal the physical proof that changes the meaning of earlier shots. | “What did the viewer miss?” |
| 42–48 s | End on a specific question tied to the clue; optionally return to the first image for a loop. | “Did you spot it before the reveal?” |

Production guardrails: use clear, authored Devanagari captions with tested fonts; avoid unsupported punctuation glyphs; let voice lead the mix; use a few synchronized original effects rather than a constant sting; keep safe margins; and deliver at 1080×1920/30 fps or better. For an image-led approach, use a new original image for each distinct story fact, then add controlled camera motion and occasional close reframes. Do not magnify small source images excessively: a 1080p output can still look soft if the source plate is smaller. Reusable original environments can keep output cadence, but the story must still supply new evidence and visual action. Full animation or live action takes more asset/production work; don't claim equal motion quality from stills alone.

To learn what works for this channel rather than promising “viral,” make two original first-second hook variants, publish/compare under consistent conditions, then use retention, rewatch/loop, completion, shares, and comments to decide what to retain. Views alone confound topic, audience size, upload timing, title/cover, and recommendation distribution.

## 5. Applied to Platform Two: format-test export

The new export is separate from the previous master so it can be reviewed without losing the baseline:

- **File:** `docs/deliverables/platform-no2-short-format-test.mp4`
- **Source/render:** `tools/render_platform_two_short.cjs`; run `npm run video:platform-two` after `npm ci`.
- **Story:** same original fictional Platform Two / Chhattisgarh story, narration, and synthesized ambience. No reference frames, music, scripts, logos, or creator likenesses were reused.
- **Format changes:** first-frame anomaly hook; 11 timed visual beats made from six original still plates; more frequent reframing of the train/register/map; a restrained frame around the handwritten “2” at the reveal; return to the empty station; final “क्या आपने नक़्शे में २ पहले देखा” question.
- **Caption pass:** captions now write actual line breaks to FFmpeg, use the Devanagari font's text shaping, and avoid the unsupported em-dash/comma/question-mark glyphs found in sampled frames. Sampled frames at 6, 41, and 47 seconds showed no fallback squares; this is a manual spot-check, not OCR of every caption.
- **Visual QA:** OpenCV decoded all 1,455 frames at 30 fps, 1080×1920, 48.5 seconds. The script defines 11 story beats (3.0, 4.0, 6.0, 3.5, 5.0, 3.5, 5.5, 3.0, 6.0, 4.0, 5.0 seconds); automatic thresholding marked the strongest candidates at 3.0, 7.0, 16.5, 21.5, 25.0, 33.5, and 43.5 seconds. The repeated-image reframes are not all detected as hard cuts. Contact sheets and frame metrics are in ignored `.cache/platform-two-short-format-test/`.
- **Audio QA:** FFmpeg EBU R128 scan measured −15.0 LUFS integrated, 3.0 LU loudness range, and −1.4 dBFS true peak. Voice and all effects/ambience are original/synthesized in this project.
- **Resolution note:** each source still plate is 768×1376 and is upscaled to the 1080×1920 delivery frame. The new edit keeps the previous export's output dimensions, frame rate, and encoding class, so it does not reduce delivery specs. It does not create extra source detail; regenerate the plates at 1080×1920 or larger for a genuine sharpness improvement.

## 6. Remaining to complete the audiovisual comparison

No reference channel has yet been classified by actual frame cadence or audio mix. The report's top-viewed videos are research leads, not the 25–30 visual samples. Once an authorized first batch of 5–6 playable reference files is supplied, I can perform the planned scan and compare every sample's beat timing, image-motion type, caption use, dialogue pace, SFX/music, reveal, and ending against the new Platform Two cut.
