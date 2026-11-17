# Indian Hindi-horror YouTube: format research and production choice

**Prepared:** 17 November 2026 (UTC)
**Scope:** publicly surfaced channel/video metadata, descriptions, and some transcripts. Counts are snapshots and will change. This is format research—not a claim that stories presented as “real” are verified events. See the Short-form addendum for what we could and could not inspect.

## Executive decision

Hindi horror spans animated stories, folklore narration, and live-action short films. The finished deliverable is now a **vertical 9:16 YouTube Short**, using original Hindi voice-led suspense, six original cinematic stills with slow camera movement, burned-in captions, and a generated sound bed. The compact structure uses an immediate mystery hook, escalating clues, a final reveal, and a short hold on the end card. This is a practical high-level horror-Short convention—not a claim that the exact audiovisual structure of reference videos was measured.

**Platform Two / प्लेटफ़ॉर्म नंबर दो** is a fictional Chhattisgarh night-shift mystery. Its story, synthetic narration, six visual plates, sound bed, and Nightingale Films branding are original; no reference video frames, audio, voice, characters, or logos are reused.

## Channel landscape

| Channel | Observable lane | Audience snapshot / caveat |
|---|---|---|
| [Khooni Monday](https://www.youtube.com/@KhooniMonday) | Hindi animated story episodes, web-series arcs, plus long-form horror podcast/audio | vidIQ listed 6.58M subscribers and 1.356B channel views on 30 Oct 2026; third-party tracker, not a YouTube analytics export. |
| [Scary Pumpkin](https://www.youtube.com/@ScaryPumpkin) | Cinematic animated Hindi horror; haunted places, train stories, supernatural serials | A Sep 2026 category roundup cited roughly 3.72M subscribers. |
| [Scary Town Hindi](https://www.youtube.com/@scarytownhindi) | Animation-led episodes and multi-part story arcs | The same roundup cited roughly 3.52M subscribers; vidIQ's Dec 2025 snapshot showed 3.5M and 1.26B views. |
| [Chacha Ke Facts](https://www.youtube.com/@ChachaKeFacts) | Host-led, long-form Hindi folklore / audience-story narration | A distinctively conversational, community-submission format; do not treat “real story” claims as independently proven. |
| [Bloody Satya](https://www.youtube.com/@BloodySatya) | Mix of narration, paranormal stories, and live-action original short films | The sample below shows the higher-effort short-film lane, rather than a representative average upload. |

**Scale note:** “Top” is not a universal ranking: the sources track different dates and methodologies. Khooni Monday, Scary Pumpkin and Scary Town appear among the largest Hindi-horror/animation properties in the public 2026 comparisons. The other two are useful format references, not a claim that they outrank them by subscribers.

## Five-video sample: what the format does

Views/likes below are the public page counters observed on 17 Nov 2026; they are not permanent and do not measure quality. Notes derive from public descriptions/transcripts and metadata, not from downloading the media.

| Channel / video | Public metadata observed | Format observation | Transferable lesson (not a copy target) |
|---|---|---|---|
| [Khooni Monday — The Clown, E01](https://www.youtube.com/watch?v=IZ_RtqSBVk0) | 8:55; uploaded 17 Oct 2022; 5,988,984 views / 112,201 likes. | Animated, voice-led episode; a strong object hook (the clown doll), a personal change, a town-wide threat, and an explicit next-episode promise. | Lead with one memorable impossible object; establish the character’s normal life before the scare; use a serial payoff only if making a series. Full character animation is not the quick route. |
| [Scary Pumpkin — Begampur Railway Station Horror Story](https://www.youtube.com/watch?v=Z71SOf-veoU) | 17:39; uploaded 28 Jun 2025; 2,123,514 views / 33,135 likes. | Animated location mystery; a specific station/forbidden platform, a past incident, a skeptical employee, then escalating night-shift evidence. The channel explicitly labels its stories fictional entertainment. | One contained location and one repeatable visual motif are efficient for a short. Mark fiction plainly; do not dress a made-up incident as a verified railway event. |
| [Scary Town Hindi — Mangalsutra, Part 1](https://www.youtube.com/watch?v=hkbd5l_22J8) | 9:48; uploaded 10 Jun 2025; 255,192 views / 2,611 likes. | Animated supernatural serial: an old curse, a present-day relationship/marriage problem, a visible supernatural rule, and a chapter break. | A simple rule (“this object/ritual binds the story”) gives viewers a clear question to follow. Use an original rule and character design; avoid borrowing plot beats or proprietary creatures. |
| [Chacha Ke Facts — Bindiya…](https://www.youtube.com/watch?v=WGFiNowW_z8) | 34:55; uploaded 30 Jul 2024; 102,798 views / 5,373 likes. | Host-led long narration. The transcript opens with familiar family storytelling, then grows a village/tree legend through a grandfather’s warning. The description disclaims verification and frames it as entertainment. | The lowest-cost structure is a good narrator, a culturally grounded premise, and a few original visual inserts. The trade-off is a much longer voice performance and less visual variety. |
| [Bloody Satya — Sona Mana Hai](https://www.youtube.com/watch?v=WOAiUxYzWm4) | 16:27; uploaded 30 Mar 2025; 214,233 views / 5,751 likes. | Live-action short film with dialogue, actors, locations, performance, and a supernatural sleep-curse premise. Its title says “based on true events”; the page does not independently verify that claim. | Performance and sound can carry a short film, but casting, coverage, locations, continuity, and sound capture make it the most labor-intensive of these production routes. |

### Cross-sample pattern

1. **Hook first:** a forbidden place, an uncanny object, a dangerous rule, or a specific night-shift anomaly.
2. **Ground it in ordinary Indian life:** family, work, village memory, train travel, ritual, or a familiar location—then disturb one thing.
3. **Escalate through evidence:** rumor → a small anomaly → a direct encounter → an unsettling record/reveal.
4. **Audio does the heavy lifting:** narration/dialogue plus quiet atmosphere and a few purposeful cues. Sustained loud stings would flatten the suspense.
5. **A promise at the end:** a twist, unresolved image, or next episode. A short should still resolve its own central question.
6. **Clearly distinguish fiction from fact:** creator disclaimers vary. “Real/true” wording in titles is not proof. The new film is disclosed as fiction on-screen and in the narration.

## What is easiest to make here?

| Route | Relative effort here | Reason |
|---|---:|---|
| Voice-led original story + 3–8 stills with camera movement, captions and custom sound | **Lowest; chosen** | Fits the existing Remotion/FFmpeg workflow. One narration take and authored stills give cinematic coverage without building a character-animation rig. |
| Long conversational podcast/narration | Low visual effort, high VO/runtime | Minimal pictures, but requires a strong sustained performance and much longer audio. |
| Full 2D/3D animated episode | High | Character sheets, consistent poses, lip-sync, scene blocking, and many more shots/assets. |
| Live-action short film | Highest | People, locations, lighting, coverage, continuity, production audio, and reshoots. |

**Production choice:** a self-contained vertical 9:16 Short, not the earlier landscape prototype. The repository's Remotion/FFmpeg tooling and original assets support a quick-turn voice-led story without attempting a costly full animation or live-action shoot.

## Short-form addendum: public page sample

These are public Shorts surfaced during research. The figures are what the pages displayed at the time and are not current performance guarantees.

| Public Short | Page metadata surfaced | What can responsibly be inferred |
|---|---|---|
| [Khooni Monday — Haunted Aarey Colony Mumbai!](https://www.youtube.com/shorts/gT_lrolo4UY) | 9 Feb 2025; 660K views / 25K likes | Place-led, immediately legible premise from title and channel context only. |
| [Khooni Monday — Mukesh Mills Horror](https://m.youtube.com/shorts/EchJiIC44uE) | 23 Jul 2024; 281K views / 11K likes | Specific haunted-location framing from title/metadata only. |
| [Bloody Satya — Real Ghost on Honeymoon](https://www.youtube.com/shorts/s3UOsP9wgZw) | 10 Jun 2024; 371K views / 17K likes | High-concept relationship-plus-supernatural hook from title/metadata only. |
| [Scary Pumpkin — Falgun Horror story](https://www.youtube.com/shorts/mTgH8Efn8w8) | 9 Feb 2026; 105K views / 2.4K likes | Regional/cultural framing from title/metadata only. |

**Important limitation:** these Shorts were not downloaded or watched frame-by-frame in this session. We do not have verified timings, shot counts, sound design, narration cadence, or full transcripts for them. Earlier work relied on surfaced page metadata; a YouTube page fetch for a different long-form video exposed a transcript, but that is not audiovisual analysis of the reference Shorts. Accordingly, the deliverable follows broad genre conventions and an original hook/escalation/reveal structure; it must not be described as a close format match to those particular videos. If exact comparative audiovisual analysis is still required, provide authorized source files or access to a permitted video-review workflow.

## Rights and analysis boundary

No reference audio, frames, or video files were used in the deliverable. The export uses a new story, synthetic narration, six generated images, and an original synthesized score. No creator logos, scenes, voices, music, or characters are reused.

## Sources

- Channel comparison / 2026 audience snapshots: [Hindi Horror Storytellers in India 2026](https://www.parikshitkhanna.com/post/top-hindi-horror-storytellers-on-youtube-in-india-2026).
- Khooni Monday public channel tracking: [vidIQ](https://vidiq.com/youtube-stats/channel/UCz67TNWBqU38S8VRvjDO2wg/).
- Scary Town Hindi public channel tracking: [vidIQ](https://vidiq.com/youtube-stats/channel/UCesf_Ttdmim4ATL-mFrhcdg/).
- Five linked video pages in the sample table; counters and transcripts are as served on the observation date.
