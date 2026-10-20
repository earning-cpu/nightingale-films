# GOOGLE AI STUDIO — key steps + the honest answer on video

**Date:** 2026-10-20 · **Companion to:** `ACCESS_PLAYBOOK.md`, `CLOUDFLARE_SETUP.md`

---

## 0. The straight answer first

| Question | Answer |
|---|---|
| Can a free AI Studio key generate **video**? | **No.** Veo 3.1 is **"Not available"** on the free tier — all three variants (Standard, Fast, Lite). |
| Can it generate **images**? | **No.** Every image model (Nano Banana 2.1, 2, 2 Lite, Pro, Gemini 2.5 Flash Image) is paid-only since 2026. |
| What *is* free? | Gemini 3.x **Flash / Flash-Lite**, Gemini 2.5 Flash, **Gemma 4**, Live/TTS/transcription/embeddings — 23 of 35 pricing entries. |
| So what does the key buy us? | **Better eyes.** Vision reasoning a generation ahead of Llama 3.2 — exactly the weak link in yesterday's audit. Plus free TTS for scratch VO. |
| Where does free video come from instead? | **Kaggle + Wan 2.2** (`tools/kaggle_wan_broll.py`), already written. $0. |

> If you want Veo specifically, the cheapest legitimate route is **Google AI Pro** (~$20/mo → 1,000 Flow credits ≈ 100 Veo 3.1 Lite clips), or the **student offer** — Google has run free AI Pro for students in India; worth checking if you're eligible. The API route starts at **$0.05/second**.

---

## 1. Create the API key — step by step

### Step 1 — open AI Studio
Go to **https://aistudio.google.com/**
Sign in with your Google account. Any normal Gmail account works; no billing, no card.

### Step 2 — accept the terms
First visit shows the Gemini API / AI Studio terms. Scroll and accept. (Free-tier note: Google may use free-tier prompts to improve their products. Nothing confidential goes here — it's a public film.)

### Step 3 — open the key page
Direct link: **https://aistudio.google.com/apikey**
*(or in the left sidebar: **Get API key**)*

### Step 4 — create the key
1. Click **Create API key**
2. A dialog asks which Google Cloud project to attach it to.
   - Choose **"Create API key in new project"** — simplest, and it keeps this key isolated.
   - If you already have a project you want to use, pick it from the list instead.
3. Wait ~5 seconds while the project is provisioned.

### Step 5 — copy it
The key appears in a list. Click the copy icon. It looks like:

```
AIzaSyD-1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
```

**Treat it like a password.** Anyone with it can spend your quota.

### Step 6 — send it
Either paste it in chat, or add it yourself to `nightingale/.env.local` (gitignored):

```
GEMINI_API_KEY=AIzaSy...
```

Then I verify with:

```bash
python3 tools/verify_keys.py --only "google ai studio"
```

### Step 7 (optional but smart) — lock the key down
The key can be restricted to only the Gemini API, so a leak can't touch anything else:
1. Go to **https://console.cloud.google.com/apis/credentials**
2. Find the key you just made → click it
3. Under **API restrictions** → **Restrict key** → tick **Generative Language API** → **Save**

Mine was created seconds ago; if you don't see it, refresh once.

---

## 2. What I run the moment the key lands

`tools/gemini_audit.py` is written and waiting — same job as the Cloudflare audit, better eyes.

```bash
# single-model pass
python3 tools/gemini_audit.py docs/film_720.mp4 --narr src/narration.json --fps 3

# two-model agreement: flag a frame only if Llama AND Gemini both score it 0
python3 tools/gemini_audit.py docs/film_720.mp4 --narr src/narration.json --fps 3 \
        --compare qa/semantic_v9.json
```

The `--compare` mode is the important one. Yesterday Llama flagged **6 frames** — and I verified all
six were *its* mistakes (it missed a blazing light beam at 42.33 s and misread burned-in type at
49.33 s). An intersection of two independent models is the only version of this check worth
trusting.

It also handles the paid-only trap: if you ever point it at a Nano Banana / Veo model, Google returns
`429` with a limit of `0`. The script skips and reports instead of dying.

### Also free with this key
- **Gemini TTS** — a scratch narration track in a different voice, useful for pacing tests before committing to the real VO.
- **Long context** — the entire script plus 280 frame descriptions in one prompt: "does this film make sense as a whole?"
- **Gemma 4** — free, for bulk text tasks (titles, variants, descriptions).

---

## 3. Video generation — the real price list

| Option | Cost | What you get |
|---|---|---|
| **Kaggle + Wan 2.2 TI2V-5B** | **$0** | 720p/24 fps, 5 s clips, Apache 2.0 (commercial OK), ~10–20 min per clip on a T4 |
| **Colab + LTX-2.3** | **$0** | 12–16 GB VRAM fits, native synced audio |
| fal.ai / Replicate trials | $2–5 credit | hosted Wan / LTX, no notebook |
| **Veo 3.1 Lite** (API, paid) | **$0.05/s** 720p | ≈ $0.25 per 5 s clip |
| Veo 3.1 Fast | $0.10/s 720p | ≈ $0.50 per 5 s clip |
| Veo 3.1 Standard | $0.40/s 720p | ≈ $2.00 per 5 s clip |
| **Google AI Pro** | ~$20/mo | 1,000 Flow credits ≈ 100 Lite / 50 Fast / 10 Quality clips |

**For a 30-clip b-roll pack:** Kaggle = **$0** · Veo Lite API = **$7.50** · Veo Standard = **$60**.

And the craft reminder that matters more than the price: for *this* film, generated footage of real
events is fabrication. Atmosphere only — fog, dust, projector light. The real motion upgrade is
**Depth-Anything parallax on the 18 stills you already own**, and that costs nothing either.

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `429` with "limit: 0" | You called a **paid-only** model (image/Veo/Pro) | Use a Flash model — the script does this automatically |
| `429` on Flash | Free-tier RPD exhausted (resets midnight Pacific) | Wait, or switch `--model gemini-3.5-flash-lite` |
| `API key not valid` | Copy included a space, or key is deleted | Re-copy from https://aistudio.google.com/apikey |
| `403 SERVICE_DISABLED` | Key restricted to the wrong API | Cloud Console → Credentials → tick *Generative Language API* |
| Key works in AI Studio but not in code | It was created in a different project than the restricted one | Make a fresh key in the project you're using |

Free-tier limits are **not published** any more — Google shows them per project in AI Studio. If a
run dies partway, that's quota, not a bug; the script reports it as HTTP 429 rather than silently
scoring frames as zero.

---

## 5. Revoke

**https://aistudio.google.com/apikey** → the key → **Delete key**.
Nothing else in your Google account is touched. Keys can also be rotated without recreating the
Google Cloud project.
