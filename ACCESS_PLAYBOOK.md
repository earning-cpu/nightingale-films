# ACCESS PLAYBOOK
### What each account actually buys us · free compute & models · the exact keys to create

**Date:** 2026-10-20 · **Companion to:** `QUALITY_SYSTEM_V2.md`
**Purpose:** every free tier worth having, what it unlocks for the film, and the literal click-path to hand me the key.

---

## 0. The 60-second answer

1. **Apify cannot run a video generator.** No GPUs anywhere on the platform, and a run is a Docker container capped at 16 GB RAM / 4 cores / 2× disk, billed by the GB-hour. Your whole $5 monthly credit buys **≈1 h 34 min of a maxed-out 16 GB actor** — not a server, and not a GPU. What it *can* do is scrape research and drive a browser. That is genuinely useful for the script, not for the picture.
2. **The right place to run a video generator is Kaggle.** Free, ~30 GPU-hours/week, 2× T4 16 GB, 12-hour sessions, no card. Wan 2.2 TI2V-5B runs 720p on 8–16 GB. I have written the script for you (`tools/kaggle_wan_broll.py`).
3. **The single most valuable free account is Cloudflare** — not for hosting, but for Workers AI: Llama vision (semantic frame audit), Whisper (caption sync proof), FLUX/SDXL stills, 10,000 neurons/day, no card.
4. **Supabase and Notion do not improve the film. Vercel barely does.** They improve the *pipeline* and the *watch page*. I'll say exactly what each is worth below — no hype.
5. **Ad-ons status right now:** Supabase, Notion and Vercel connectors exist in this conversation but are **off**. GitHub, Cloudflare, Apify, Figma and Hugging Face **aren't offered as connectors at all** — for those, an API key is the only route, which is fine because I can call their REST APIs directly from this workspace.

---

## 1. Apify — what it really is

| Claim | Reality |
|---|---|
| "Server access" | You get a **Docker container per run**, 128 MB → 16,384 MB RAM, memory must be a power of two, disk = 2× RAM. There is no SSH, no persistent process, no root box you keep. |
| "Browser access" | Real, and it's the good part: Playwright/Puppeteer + Apify Proxy (5 datacenter IPs free, residential $8/GB). This is an *anti-blocking scraping* browser, not a rendering farm. |
| "Install a video generator" | **No GPU.** Wan/LTX/Hunyuan need CUDA. ComfyUI on CPU would take hours per second of footage. |
| "Install an image generator" | Same — SDXL/FLUX on 4 CPU cores is ~10–20 min per 1024² image, and the disk is ephemeral between runs. |
| Cost | 1 CU = 1 GB of RAM for 1 hour = $0.20. Free plan = **$5/mo = 25 CU**. 16 GB actor → 1.56 h/month. 8 GB → 3.1 h/month. |

**What it is actually world-class at:** 6,000+ prebuilt scrapers, residential-proxy browser automation, and scheduled jobs. For a documentary pipeline that means **research**, and research is where a film is won or lost before a frame is rendered.

### What I'd actually do with an Apify token

| Task | Actor | Cost | Output |
|---|---|---|---|
| Competitor retention-shaped analysis | YouTube Scraper (metadata: views, likes, length, publish date) | ~$4 / 1,000 videos | which lengths/patterns win in this niche |
| Hook mining | YouTube Transcript Scraper Pro | ~$1 / 1,000 | the first 8 seconds of 300 winners, clustered |
| Audience language | YouTube Comments Scraper | ~$2 / 1,000 | the exact words people use — feeds the script |
| Story detail | Reddit Scraper | ~$1–3 / 1,000 | first-person texture that reads human |
| Fact provenance | Website Content Crawler | ~$2–5 / 1,000 pages | sourced quotes for the Nightingale story |
| Trend timing | Google News Scraper | ~$1–4 / 1,000 | the "why now" line in the cold open |

A full pre-production brief costs **≈$4.70** of the $5. That is the entire value of the account.

> **Also true and worth saying:** scraping YouTube is against its ToS. Use it to study *patterns* (lengths, phrases, themes) — never republish transcripts as script.

---

## 2. Where to actually run a video generator

### 2.1 Free GPU — the honest table

| Provider | What you get | Catch | Sign up | Verdict |
|---|---|---|---|---|
| **Kaggle** | ~30 GPU-h/week, 2× T4 16 GB or P100, 12 h sessions, 30 h/week CPU | Quota not published, floats | kaggle.com | ⭐ **best free GPU** |
| **Google Colab** free | T4, ~12 h sessions, 15–30 h/wk typical | Idle timeouts; no web UIs/SSH | colab.research.google.com | ⭐ easy, flaky |
| **Lightning AI** | 15 free credits/mo (sources translate this to ≈75 T4-h, others say 80 GPU-h), 1 Studio, 4 h restarts | Phone verification | lightning.ai | ⭐ best persistent workspace |
| **Modal** | **$30/mo compute credits**, serverless GPU from T4 → B300 | Card usually required on file | modal.com/signup | ⭐ best for batch jobs |
| **HF Spaces ZeroGPU** | RTX Pro 6000 Blackwell, 5 min/day free (PRO $9 = 40 min) | Gradio Spaces only, 60 s per call; creating a compute Space now needs PRO **except** 2 free ZeroGPU Spaces for accounts >30 days | huggingface.co/join | ⭐ good for a public demo, not for bulk |
| **Groq / Cerebras / OpenRouter free** | fast text + some vision | rate limits | console.groq.com | ✅ for script/VLM |
| **Oracle Cloud Always Free** | ARM VM **2 OCPU / 12 GB** (halved from 4/24 in Jun 2026), 200 GB disk, 10 TB egress | No GPU; **idle instances get reclaimed** (<20 % CPU/mem over 7 days) | signup.cloud.oracle.com | ✅ a real free server — for n8n, ffmpeg, watch-page API |
| **Google Cloud free** | e2-micro always free (0.25 vCPU) | No GPU | cloud.google.com/free | ⚠ too small |
| **Render / Fly / Railway / Koyeb** | small free web services | sleep, no GPU, build minutes | — | ⚠ hosting only |
| ~~SageMaker Studio Lab~~ | — | **closed to new customers 30 Jul 2026** | — | ❌ don't bother |
| **RunPod / Vast.ai / Thunder Compute** | real GPUs, **paid** | 4090 ≈ $0.35/h | — | 💰 if you ever spend money, spend it here |

**Bottom line:** between Kaggle (30 h/wk) + Colab (15–30 h/wk) + Lightning (≈75 T4-h) + Modal ($30 credits) you have **more free GPU than a $1,000 graphics card**, if you're willing to wait in sessions.

### 2.2 Free video-generation APIs (no GPU of your own)

| Service | Free offer | Cost after | Sign up |
|---|---|---|---|
| **fal.ai** | Sandbox/Playground credits; MiniMax H3 Max **5 free videos/24 h** on the web tier | $0.02–0.08/s typical | fal.ai/dashboard/keys |
| **Replicate** | ~$5 free credits on new accounts; some models free briefly | per-second | replicate.com/account/api-tokens |
| **Runware** | $2 free credit w/ business email, doesn't expire | usage | runware.ai |
| **Runway** | 125 one-time credits, **watermarked** export | $12/mo | app.runwayml.com |
| **Kling AI** | 66 credits/day (≈6 × 5 s clips) | $6.99+/mo | app.klingai.com |
| **Hailuo (MiniMax)** | ~3 clips/day, watermark | subscription | hailuoai.video |
| **Luma Dream Machine** | daily credits, **no commercial use on free** | $29.99/mo | lumalabs.ai |

### 2.3 What the models actually need (so we buy the right GPU time)

| Model | Min VRAM (practical) | Max out | Native audio | Licence | Best for |
|---|---|---|---|---|---|
| **Wan 2.2 TI2V-5B** | **8 GB** (GGUF), 16 GB comfortable | 720p / 24 fps, 5 s | no | Apache 2.0 | ⭐ our pick — commercial-safe, fits a T4 |
| **Wan 2.2 T2V/I2V-A14B** | 12 GB (Q3–Q4 GGUF), 24 GB clean | 720p, 5 s | no | Apache 2.0 | best realism when we have an A100 |
| **LTX-2.3** | **12 GB** (Q3 GGUF), 16 GB FP8 | up to 4K, 50 fps | **yes** | free below $10M revenue | ⭐ speed + synced audio |
| **HunyuanVideo 1.5** | 14 GB offloaded, 24 GB clean | 720p (1080p via SR) | no | Tencent custom | legacy |
| **FramePack** | **6 GB** | long clips, 30 fps | no | Apache 2.0 | weakest hardware |

**Time per 5 s clip on a T4/P100 (16 GB):** Wan 5B at 480p ≈ 3–6 min; at 720p ≈ 10–20 min. A 30-clip b-roll pack is one Kaggle session.

---

## 3. The craft question nobody asks: *should* we use AI video here?

Nightingale is an archival-documentary film. Generated footage of *real historical events* is fabrication — and it is visible: warped faces, melting type, impossible physics, wrong film grain. One fake second destroys the credibility the whole film is built on.

**Where generative motion genuinely earns its place in this film:**

| Use | Why it works | Model |
|---|---|---|
| **Atmosphere plates** — dust in a lamp beam, fog drifting, film-grain flicker, projector light | no claims about reality; pure texture; sells the period | Wan 2.2 5B, LTX-2.3 |
| **Cold-open motion** — a slow push into a dark forest with drifting particles | attention in the first 3 s, and it can't be "wrong" | Wan 2.2 5B |
| **Connective tissue** between chapters — drifting smoke, ink in water, light through blinds | covers a cut, adds cinema | LTX-2.3 (fast) |
| **Title backgrounds** | typography gets real depth | Wan 2.2 / FLUX stills + parallax |
| **Vertical b-roll** for the 9:16 cut | native portrait generation beats cropping | Wan 2.2 at 704×1280 |

**Where it must never go:** fake photographs of the UFO sightings, fake 1977 audio recordings, fake newspaper front pages, fake witnesses. Those are the film's factual spine — they get *real* archives, *real* stills, and *motion* (parallax), not generation.

**The cheapest real upgrade isn't generative at all.** Feed the 18 existing stills through **Depth Anything V2** and split them into 4–6 depth planes; each plane moves at its own rate. That produces true parallax — foreground newspaper sliding past background desk — from images we already licenced, with zero fabrication. It runs on a free Kaggle T4 and costs about 2 minutes per still. **This is the single biggest motion upgrade available to us and it changes nothing about the film's truth.** I'd do this before generating a single AI clip.

---

## 4. Every free key worth creating

### 4.1 Compute & generation

| Service | Free tier | Create key at | Key type | What I do with it |
|---|---|---|---|---|
| **Cloudflare** | Workers AI 10k neurons/day; Pages unlimited bandwidth; R2 10 GB | dash.cloudflare.com/profile/api-tokens | API Token → template *Workers AI* + *Cloudflare Pages: Edit* | VLM frame audit, Whisper caption proof, FLUX stills, host the watch page |
| **Hugging Face** | ZeroGPU 5 min/day, model hosting, datasets | huggingface.co/settings/tokens | **Read** (+ Write if we push a Space) | Depth-Anything parallax, upscaling, Space demo |
| **Kaggle** | ~30 GPU-h/week | kaggle.com/settings → *Create New Token* → `kaggle.json` | API token file | Wan 2.2 b-roll, parallax, real-ESRGAN upscale |
| **Modal** | $30/mo compute | modal.com → Settings → API Tokens | token id + secret | batch renders, video gen when a notebook isn't enough |
| **fal.ai** | sandbox credits + 5 free videos/day | fal.ai/dashboard/keys | API key | quick LTX/Wan clips without a notebook |
| **Replicate** | ~$5 credits | replicate.com/account/api-tokens | API token | one-off models (upscale, matting, video) |
| **Runware** | $2 credit | runware.ai dashboard | API key | cheap FLUX/SDXL batch stills |

### 4.2 Text, vision, speech

| Service | Free tier | Create key at | What I do with it |
|---|---|---|---|
| **Groq** | generous free rate limits | console.groq.com/keys | script variants, hook A/B, fast summarisation |
| **Google AI Studio** | Gemini free tier | aistudio.google.com/apikey | vision reasoning, "does this frame match the line" |
| **OpenRouter** | free model pool | openrouter.ai/keys | fallback LLM routing, $0 |
| **ElevenLabs** | ~10k chars/mo | elevenlabs.io → Profile → API key | VO alt takes (**check licence before shipping**) |
| **Deepgram / AssemblyAI** | $200 / $50 credits | deepgram.com, assemblyai.com | word-level timing for caption proof |

### 4.3 Research & data

| Service | Free tier | Create key at | What I do with it |
|---|---|---|---|
| **Apify** | $5/mo credits, 5 concurrent | console.apify.com/account/integrations | the research brief in §1 |
| **YouTube Data API** | 10,000 units/day | console.cloud.google.com | public stats without scraping (legal, generous) |
| **Airtable** | 1,000 records/base | airtable.com/create/tokens | shot/asset tracking if we outgrow JSON |
| **Notion** | unlimited personal pages | notion.so/my-integrations | script + asset DB with comments |

### 4.4 Delivery & media

| Service | Free tier | Create key at | What I do with it |
|---|---|---|---|
| **Cloudinary** | 25 credits/mo (~25 GB) | cloudinary.com/console → *API Keys* | **adaptive HLS streaming** so the film plays instantly, no download |
| **Remove.bg** | 50 calls/mo | remove.bg/dashboard#api-key | cut subjects → 2.5D parallax layers |
| **Supabase** | 500 MB DB, 1 GB storage, 5 GB egress | supabase.com → Project → Settings → API | watch-through analytics, caption store, feedback |
| **Vercel** | 100 GB transfer, 1M fn calls | vercel.com/account/tokens | watch page + OG image generator (**non-commercial only**) |
| **Figma** | free | figma.com → Settings → Security → personal access token | extract lower-third/title SVG specs into Remotion |
| **GitHub** | unlimited public repos, Releases | see §5 | everything |

---

## 5. Fine-grained PAT — click-by-click

**You need this because** the current token can push code but **cannot enable GitHub Pages** — that's the last blocker between us and a link that plays in the browser with zero download.

### Step 1 — open the creator
Go to **https://github.com/settings/personal-access-tokens/new**
(Manual path: avatar → *Settings* → *Developer settings* (bottom left) → *Personal access tokens* → *Fine-grained tokens* → **Generate new token**.)

### Step 2 — identity
| Field | Value |
|---|---|
| Token name | `nightingale-ci` |
| Expiration | 90 days (or custom; shorter is safer) |
| Resource owner | **`earning-cpu`** ← must be the account that owns `nightingale-films`, not an org you don't control |
| Description | `Nightingale render + Pages` |

### Step 3 — repository access
Select **Only select repositories** → choose **`nightingale-films`** only. (Never "All repositories".)

### Step 4 — permissions (Repository permissions)
Tick exactly these:

| Permission | Level | Why it is needed |
|---|---|---|
| **Contents** | **Read and write** | push commits, upload Release assets |
| **Actions** | **Read and write** | trigger/inspect workflow runs |
| **Workflows** | **Read and write** | **required** — without it GitHub rejects any push that touches `.github/workflows/` |
| **Pages** | **Read and write** | **the whole point** — enable and update the Pages site via API |
| **Administration** | **Read and write** | optional; lets me flip repo settings (branch protection, Pages source) without you clicking |
| **Metadata** | Read-only | auto-selected, cannot be removed |

Leave **Account permissions** empty. Leave everything else at *No access*.

### Step 5 — generate
Click **Generate token** → copy the `github_pat_…` string **immediately** (it is shown once).

### Step 6 — make sure Pages exists to write to
Repo → **Settings** → **Pages** → *Build and deployment* → Source: **Deploy from a branch** → Branch **`main`**, folder **`/docs`** → **Save**.
(If the Pages permission is greyed out for you, the repo needs you to be an admin on `earning-cpu` — you are, so it will be there.)

### Step 7 — hand it over
Paste it in chat, or better: put it in `nightingale/.env.local` yourself. That file is gitignored — it never enters a commit, and it does not appear in any Release.

**Revoke any time:** https://github.com/settings/tokens?type=beta → the token → *Delete*.

---

## 6. Supabase / Notion / Vercel — what they're actually worth

### Verdict table

| Tool | Improves the film? | Improves delivery? | Improves the pipeline? | Worth it? |
|---|---|---|---|---|
| **Cloudflare** | indirectly (VLM QA, FLUX stills) | **yes — unlimited-bandwidth Pages + R2** | yes | ⭐⭐⭐ **yes, first** |
| **Cloudinary** | no | **yes — HLS adaptive streaming, instant playback** | no | ⭐⭐⭐ yes |
| **Kaggle** | **yes — parallax + b-roll** | no | no | ⭐⭐⭐ yes |
| **Hugging Face** | yes — models | no | no | ⭐⭐ yes |
| **Supabase** | **no** | some — watch analytics | yes | ⭐⭐ only if we host natively |
| **Notion** | no | no | **yes — script/asset DB, review** | ⭐⭐ nice-to-have |
| **Vercel** | no | yes, but Cloudflare Pages is better and commercial-OK | no | ⭐ optional |
| **Figma** | small — design system | no | some | ⭐ optional |
| **Remove.bg** | **yes — real parallax cutouts** | no | no | ⭐⭐ yes (50/mo free) |
| **Airtable** | no | no | yes (≤1,000 records) | ⭐ replaces nothing |
| **Make / Zapier** | no | no | yes | ⭐ n8n self-hosted is better |
| **Clerk / Auth0 / Firebase Auth** | no | no | no — we have no users | ❌ |
| **Mongo / Neon / PlanetScale / Turso / PocketBase / Appwrite / Firebase** | no | no | duplicates Supabase | ❌ pick one, not seven |
| **Framer / Webflow / Wix / WP / Super / Typedream** | no | ok | no | ❌ hand-written HTML wins |
| **Canva / Undraw / Icons8** | no — wrong visual language for noir documentary | no | no | ❌ |
| **Gitpod / Replit / StackBlitz / CodeSandbox** | no | no | marginal (Replit can run Remotion slowly) | ❌ GitHub Actions already renders |

### The blunt answer to "will Supabase + Notion + Vercel make the videos better?"

**No — not one pixel.** What they do:

- **Supabase** = if we host the film ourselves, I can log every 5 seconds of playback and then *know* where people leave — the same data YouTube gives you for free in Studio. Worth it **only** if we're streaming natively; otherwise YouTube Analytics is better and free.
- **Notion** = a living script/asset/shot database with comments. It replaces JSON files with something you can read and edit. Real workflow value, zero film value.
- **Vercel** = a nice URL for the watch page. But the Hobby plan is **personal, non-commercial only**, and Cloudflare Pages gives unmetered bandwidth *and* allows commercial use. So Vercel is the weaker choice for exactly this job.

**What actually makes the videos better**, in order: Kaggle GPU (real parallax motion) → Cloudflare Workers AI (semantic QA + stills) → Cloudinary (instant playback) → Remove.bg (cutouts) → fal/Replicate (targeted b-roll). Everything else is admin.

---

## 7. What I'd build, in order

| # | Build | Needs | Time | Effect |
|---|---|---|---|---|
| 1 | **v10** — retag bt709, +2 IRE shadow lift, kill the 0.77 s black hole, tail phase | nothing | 1 render | fixes the 3 defects `qa_pro.py` found |

> **Colour fix verified today.** `-color_primaries/-color_trc` are silently dropped by libx264. The flags that actually write the VUI are
> `-x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv"` — tested, `ffprobe` then reports all four tags correctly.
> One line on the mux, and Q03 goes green.
| 2 | **Pages watch page** live | **PAT with Pages: R/W** | 10 min | the film plays in-browser, no download |
| 3 | **9:16 vertical cut** | nothing | 1 render | Shorts/Reels distribution |
| 4 | **2.5D parallax on 6 key stills** | Kaggle T4 (Depth-Anything V2) | 1 session | real motion, no fabrication — the biggest craft jump |
| 5 | **Semantic frame audit** | Cloudflare token | 20 min | catches "right frame, wrong line" |
| 6 | **Atmosphere b-roll pack** (fog, dust, projector light) | Kaggle T4 (Wan 2.2 5B) | 1 session | cinema texture between chapters |
| 7 | **Research brief** | Apify $5 | 1 h | next film's hook from data, not taste |
| 8 | **HLS watch page + retention logging** | Cloudinary + (Supabase) | 2 h | instant start, real drop-off data |

---

## 8. What I need from you — minimum viable set

**Do these four and nothing else blocks us:**

1. **GitHub PAT** (§5) — 2 minutes.
2. **Cloudflare account + API token** — Workers AI + Pages. Free, no card.
3. **Kaggle account** — download `kaggle.json`. This is our GPU.
4. **One screenshot of YouTube Studio → Analytics → Retention** for the last film. It costs $0 and tells me more than every paid tool in this document.

Then, as you feel like it: Hugging Face → Groq → Cloudinary → Apify → Remove.bg → Supabase/Notion/Vercel.

---

## 9. Cost summary

| Item | Monthly cost |
|---|---|
| Kaggle GPU (30 h/wk) | $0 |
| Colab GPU | $0 |
| Lightning AI credits | $0 |
| Modal credits | $0 (card may be required) |
| Cloudflare Workers AI (10k neurons/day) | $0 |
| HF ZeroGPU (5 min/day) | $0 |
| fal / Replicate / Runware trial credits | $0 |
| Cloudinary (25 credits) | $0 |
| Supabase free | $0 |
| Oracle ARM VM (2 OCPU/12 GB) | $0 |
| Apify research | $0 (inside the $5) |
| GitHub + Actions + Releases | $0 |
| **Total** | **$0 / month** |

That is roughly **$0.35/h × 120 GPU-hours ≈ $42/month of equivalent paid compute**, plus hosting and a research budget, for nothing — paywalled only by session limits and queue time.

---

*Every number here was checked on 2026-10-20. Free tiers move; anything marked ⚠ should be re-verified before you rely on it for a paid job.*
