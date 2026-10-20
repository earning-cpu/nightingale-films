# ACCESS SETUP GUIDE
### Do these in order. First three unblock everything. Total ≈ 65 min, but 20 min gets us live.

**Date:** 2026-10-20 · **Companion to:** `ACCESS_PLAYBOOK.md` (what each tool is worth) and `QUALITY_SYSTEM_V2.md` (the gates)

---

## 0. First — can the old token be edited, or do we need a new one?

**Edited. No new token needed.**

| Token type | Editable? | Value changes? |
|---|---|---|
| **Fine-grained** (`github_pat_…`) — what you have | **Yes.** Name, expiry, description, repository access and every permission can be changed after creation | **No.** The token string stays identical |
| Classic (`ghp_…`) | **No.** Scopes are frozen at creation | Must generate a new one |

I proved the current token's exact state against the live API just now:

```
GET  /repos/earning-cpu/nightingale-films        → 200  ✅ repo access fine
GET  /repos/.../actions/workflows                → 200  ✅ Actions readable
GET  /repos/.../releases                         → 200  ✅ Releases readable
PUT  /repos/.../pages                            → 403  ❌
     x-accepted-github-permissions: pages=write,administration=write
```

So one edit of two permissions and the watch page goes live — with the same key you already gave me. Nothing to re-send.

---

## Priority table

| # | Service | Time | Unblocks | Why here |
|---|---|---|---|---|
| **1** | **GitHub PAT** (edit) | 3 min | Watch page live, deploy automation | the only hard blocker left |
| **2** | **Cloudflare** | 8 min | VLM frame audit, Whisper caption proof, FLUX stills, unlimited-bandwidth hosting | highest quality-per-minute of any account |
| **3** | **Kaggle** | 6 min | **GPU**: parallax, b-roll, upscaling | the only real film-quality jump |
| 4 | Google AI Studio | 2 min | Gemini vision: "does this frame match the line" | cheapest second opinion on frames |
| 5 | Hugging Face | 3 min | Depth-Anything, upscalers, ZeroGPU | the models Kaggle runs |
| 6 | Groq | 2 min | script/hook/variant generation at speed | makes iteration cheap |
| 7 | Cloudinary | 6 min | HLS playback = instant start, no download | delivery quality |
| 8 | Apify | 5 min | competitor + comment research brief | wins the *next* script |
| 9 | Remove.bg | 2 min | 50 cutouts/mo → clean parallax layers | craft, small |
| 10 | fal.ai | 3 min | on-demand LTX/Wan clips, 5 free/day | b-roll without a notebook |
| 11 | Replicate | 3 min | one-off models (upscale, matting) | utility |
| 12 | Runware | 3 min | $2 FLUX stills | utility |
| 13 | Modal | 5 min | $30/mo serverless GPU | when Kaggle sessions run out |
| 14 | Supabase | 6 min | watch analytics if we self-host | optional |
| 15 | Notion | 4 min | editable script/asset DB | optional |
| 16 | Vercel | 3 min | alt hosting (non-commercial only) | optional |
| 17 | Figma | 3 min | pull title/lower-third specs | optional |
| 18 | *No key* | 1 min | YouTube retention screenshot | free, highest signal |

---

## 1. GitHub PAT — EDIT the existing token (3 min) ⭐ START HERE

**Why:** the film currently can only be watched by downloading 50 MB. Pages fixes that permanently, and only `pages:write` stands in the way.

### Steps

1. Open **https://github.com/settings/tokens?type=beta**
   *(manual: avatar → Settings → Developer settings, bottom of left column → Personal access tokens → Fine-grained tokens)*
2. Find the token you already gave me (it will show a "last used" timestamp from today — that's me) and **click its name** — not the delete bin. The name opens the detail page.
3. Click **Edit** (top right).
4. Leave resource owner and repositories alone — it's already `earning-cpu` → `nightingale-films`.
5. Scroll to **Repository permissions**. You will see *only the permissions already granted*
   (Actions, Administration, Contents, Metadata, Workflows). **Pages is missing because it hasn't been added yet.**

   Click **“Add permissions”** — the button at the top-right of that section, above the permission rows.
   A search list opens. Type **`Pages`**. Tick it, set the dropdown to **Read and write**, then confirm.

   Final state should be exactly:

   | Permission | Value |
   |---|---|
   | Actions | Read and write |
   | Contents | Read and write |
   | Workflows | Read and write |
   | **Pages** | **Read and write** ← the one to add |
   | Metadata | Read-only (**required**, cannot be changed — this is normal, ignore it) |
   | Administration | **No access** ← set this back; we do **not** need it |

   > **Correction to what I said earlier:** the API header reads `pages=write,administration=write`,
   > which means *either one* satisfies the endpoint. `Pages: write` alone is enough — and
   > `Administration` also covers repository **deletion**, so we keep it at *No access*. Least privilege.

6. *(Optional but sensible)* set **Expiration** to 90 days instead of none.
7. Click **Update token** / **Save changes** at the bottom.

> **The token string does not change.** Do not copy anything, do not send anything. Tell me "edited" and I'll re-run the verifier — it should flip from `pages ✗` to `pages ✓`.

### What I do the moment it's green

1. `PUT /repos/earning-cpu/nightingale-films/pages` → source `main` / `/docs`
2. Poll the build, then fetch `https://earning-cpu.github.io/nightingale-films/`
3. Add a "Watch" button on the repo README that plays inline
4. Add the Pages deploy step to `.github/workflows/render.yml` so every render publishes itself

### If “Pages” is not in the Add-permissions search at all

Two possible causes, then the escape hatch that makes this moot:

- Wrong **resource owner** — it must be **earning-cpu** (your user), not an organisation.
- Or you're editing a token created before Pages existed as a permission. In that case a new token
  *is* required — same settings, just created fresh.

**The escape hatch (6 clicks, no token at all):**
1. Repo → **Settings** (top bar)
2. Left sidebar → **Pages** (under *Code and automation*)
3. *Build and deployment* → **Source: Deploy from a branch**
4. **Branch: `main`**, **Folder: `/docs`**
5. **Save**
6. Wait ~60 s → **https://earning-cpu.github.io/nightingale-films/**

That is permanent: with *Deploy from a branch*, every `git push` republishes the page by itself —
**no token is needed for future deploys.** The Pages permission only lets *me* flip that switch
for you instead of you clicking five times.

---

## 2. Cloudflare (8 min) — VLM + Whisper + stills + hosting

**Why:** three separate jobs for one free token — Workers AI gives Llama vision (the semantic "should vs is" audit), Whisper (word-level caption sync proof), and FLUX/SDXL (stills). Pages gives unmetered hosting. **10,000 neurons/day, no card.**

### Steps

1. Sign up: **https://dash.cloudflare.com/sign-up** (email + password, no card)
2. After login, the URL becomes `dash.cloudflare.com/<32-char-hex>` — **copy that hex string**, that's your **Account ID**. You'll also see it on the right sidebar of *Workers & Pages*.
3. Go to **https://dash.cloudflare.com/profile/api-tokens**
4. Click **Create Token**
5. Choose **Create Custom Token** (bottom of the list — don't use a template, they're too broad)
6. Name it `nightingale`
7. **Permissions** → add these two rows:

   | Scope | Resource | Level |
   |---|---|---|
   | Account | **Workers AI** | **Edit** |
   | Account | **Cloudflare Pages** | **Edit** |

8. **Account Resources** → Include → **your account**
9. **TTL / expiry** → set an end date ~90 days out (or leave "no expiry"; your call)
10. **Continue to summary → Create token**
11. Copy the token — **shown once**. It starts with a long alphanumeric string.

### What to send me

```
CLOUDFLARE_ACCOUNT_ID=<the 32-char hex>
CLOUDFLARE_API_TOKEN=<the token>
```

### What I'll immediately do

- `POST /accounts/{id}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct` on 280 frames → "does this frame match this narration line?" → the Q34 semantic audit, finally automated
- `@cf/openai/whisper` on the VO → word timings → proves caption sync within 2 frames (Q28)
- `@cf/black-forest-labs/flux-1-schnell` → any missing stills, free, commercial-clean
- Deploy the watch page to Pages as a second copy

**Verify:** Workers AI has a free playground at *Workers & Pages → AI → Models* — you can test a model in the browser before sending me anything.

---

## 3. Kaggle (6 min) — the GPU

**Why:** ~30 GPU-hours/week, 2× T4 16 GB, 12-hour sessions, no card. This is the only thing that makes real motion possible: Depth-Anything parallax and Wan 2.2 b-roll. Nothing else on the list changes the *look* of the film this much.

### Steps

1. Sign up: **https://www.kaggle.com/account/login** (Google/email)
2. **Verify your phone number** — Kaggle requires it before it grants GPU. Profile → *Phone Verification*.
3. Open **https://www.kaggle.com/settings** → scroll to the **API** section
4. Click **Create New Token** → a file named **`kaggle.json`** downloads
5. Open it in a text editor. It looks like:
   ```json
   {"username":"yourname","key":"a1b2c3d4e5f6..."}
   ```
6. Send me the two values (or upload the file itself — it contains only those two values):
   ```
   KAGGLE_USERNAME=yourname
   KAGGLE_KEY=a1b2c3d4e5f6...
   ```
7. *(Optional but worth 30 seconds)* create one notebook so the environment warms up: **https://www.kaggle.com/code** → New Notebook → right panel **Session options** → **Accelerator: GPU T4 ×2** → **Internet: On**.

### What I'll run

| Job | Model | Time on T4 | Output |
|---|---|---|---|
| Parallax on 6 key stills | Depth-Anything-V2 | ~2 min/still | real 2.5D camera moves |
| Archive upscale | Real-ESRGAN | ~1 min/still | crisp 1080p from small plates |
| Atmosphere b-roll ×8 | Wan 2.2 TI2V-5B | ~10–20 min/clip | fog, dust, projector light |
| Vertical b-roll | Wan 2.2 at 704×1280 | same | 9:16 cut footage |

**Note:** the key gives me *notebook* access via API, and I can push/pull notebooks and datasets — but a 10-hour render is better run by you clicking "Run All" once. I'll hand you a ready notebook either way.

---

## 4. Google AI Studio — Gemini vision (2 min)

**Why:** the strongest free vision reasoning available. I use it to catch "right image, wrong moment" — the failure mode no metric can see.

1. **https://aistudio.google.com/apikey**
2. Sign in with a Google account → **Create API key** → *Create API key in new project*
3. Copy the `AIza…` string
4. Send: `GEMINI_API_KEY=AIza…`

Free tier is rate-limited but generous; it resets daily.

---

## 5. Hugging Face (3 min)

**Why:** the model hub everything downloads from; also gives Depth-Anything inference and 5 min/day of ZeroGPU.

1. **https://huggingface.co/join**
2. Verify email (some endpoints require a verified account)
3. **https://huggingface.co/settings/tokens** → **Create new token**
4. Type: **Read** is enough. Pick **Write** only if you want me to publish a public demo Space later.
5. Name `nightingale` → **Create token** → copy `hf_…`
6. Send: `HF_TOKEN=hf_…`

---

## 6. Groq (2 min)

**Why:** absurdly fast text models. Makes A/B testing 20 hook variants cost 40 seconds instead of 20 minutes.

1. **https://console.groq.com**
2. Sign in (Google/GitHub) → accept terms
3. **https://console.groq.com/keys** → **Create API Key** → name `nightingale`
4. Copy `gsk_…` → send: `GROQ_API_KEY=gsk_…`

---

## 7. Cloudinary (6 min)

**Why:** serves **HLS** — the film starts playing in ~1 s and adapts to connection speed, instead of waiting for a 50 MB download. This is literally the "watch without downloading" requirement.

1. **https://cloudinary.com/users/register_free** — free plan, 25 credits/mo (≈25 GB)
2. Verify email → land on the **Dashboard**
3. At the top of the dashboard you'll see three values: **Cloud name**, **API Key**, **API Secret**
4. Send me the one-line URL form (it's the same three values):
   ```
   CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
   ```
5. **Settings → Upload → Upload presets** → *Add upload preset* → Signing mode **Unsigned** → name `nightingale` → Save. (Only needed if you want the browser to upload; not required for me.)

### What I'll build

An `hls/` folder + `master.m3u8` + a player page. GitHub Releases can't stream HLS, which is why this matters. Note: 25 credits/mo means the master stays in the repo and only the 60-second cut lives on Cloudinary.

---

## 8. Apify (5 min)

**Why:** the research brief — what wins in this niche, in words, before I write the next script.

1. **https://console.apify.com/sign-up** (Google/GitHub; no card)
2. **https://console.apify.com/account/integrations**
3. Scroll to **Personal API tokens** → **Create new token**
4. Name `nightingale` → **Create** → copy `apify_api_…`
5. Send: `APIFY_TOKEN=apify_api_…`

**How I'll spend the $5** (in this order, stopping when it's gone):
300 competitor videos metadata (~$1.20) → 300 transcripts of the top performers (~$0.30–1.05) → 1,500 comments on the best 20 (~$3.00) → 100 Reddit threads (~$0.20). Output: a written retention brief with the hook phrases that actually work.

---

## 9. Remove.bg (2 min)

**Why:** 50 clean cutouts/month turn flat stills into layered parallax with real separation — the difference between "photo sliding" and "camera moving through a scene".

1. **https://www.remove.bg/api** → **Get API key** (free account, 50 calls/mo)
2. Verify email → dashboard shows **API Key**
3. Send: `REMOVEBG_API_KEY=…`

---

## 10. fal.ai (3 min)

**Why:** call a hosted video model without touching a notebook — LTX-2.3 or Wan at ~$0.02–0.08/s, plus **5 free MiniMax clips per day** on the web tier for testing a look before committing GPU hours.

1. **https://fal.ai/login** → sign in with GitHub/Google
2. **https://fal.ai/dashboard/keys** → **Add key** → name `nightingale`
3. Copy → send: `FAL_KEY=…` (format `key_id:key_secret`)

---

## 11. Replicate (3 min)

**Why:** one-off utilities — matting, upscaling, frame interpolation, "topaz-like" denoise — without installing anything. ~$5 of trial credit.

1. **https://replicate.com/signin** (GitHub)
2. **https://replicate.com/account/api-tokens** → **Create token**
3. Copy `r8_…` → send: `REPLICATE_API_TOKEN=r8_…`

---

## 12. Runware (3 min)

**Why:** cheap FLUX/SDXL stills, $2 credit that never expires.

1. **https://runware.ai** → Sign up (business email gets the $2)
2. Dashboard → **API Keys** → Create
3. Send: `RUNWARE_API_KEY=…`

---

## 13. Modal (5 min)

**Why:** $30/month of serverless GPU. When a Kaggle 12-hour session dies at 90 %, Modal finishes the job in one command.

1. **https://modal.com/signup** (GitHub)
2. **https://modal.com/settings/tokens** → **New token**
3. Copy both **Token ID** and **Token Secret** — and note the **workspace name** shown at the top
4. Send:
   ```
   MODAL_TOKEN_ID=ak-…
   MODAL_TOKEN_SECRET=as-…
   ```
5. *(Heads-up)* Modal's billing docs say a payment method is normally on file. If it asks for a card, **stop** — we have Kaggle, Lightning and Colab for free GPU; this one is a convenience, not a requirement.

---

## 14. Supabase (6 min) — optional

**Why:** only if we self-host and want our own retention data. Otherwise YouTube Studio gives it free.

1. **https://supabase.com/dashboard/sign-up** → new project, free plan
2. Pick region **Mumbai (ap-south-1)** — closest to you
3. Wait ~2 min for provisioning
4. **Project Settings (gear) → API** → copy **Project URL**, **anon public**, **service_role**
5. Send only what's needed:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=<service_role>
   ```
6. **Security note:** `service_role` bypasses row-level security. If you'd rather not hand that over, send `anon` instead and I'll write policies around it.

---

## 15. Notion (4 min) — optional

**Why:** a script/asset/shot database you can read and comment on, instead of JSON.

**Option A — connect the app (better):** in this conversation, open the app connector panel and switch **Notion** on. I then get proper tools, no key handling.

**Option B — integration token:**
1. **https://www.notion.so/profile/integrations** → **New integration** → name `nightingale` → workspace → **Save**
2. Copy the `secret_…` token → send `NOTION_TOKEN=secret_…`
3. **Critical step people miss:** open the page you want me to touch → **⋯ menu → Connections → Connect to → nightingale**. Without this the token sees nothing.
4. Copy the page ID from the URL (32 chars before `?`)

---

## 16. Vercel (3 min) — optional

**Why:** an alternative watch URL. **Read the caveat: Hobby is personal, non-commercial only, 100 GB/month.** Cloudflare Pages is better for us — but if you want Vercel anyway:

1. **https://vercel.com/signup** (GitHub)
2. **https://vercel.com/account/tokens** → **Create Token** → scope: your account → expiry 90 days
3. Send: `VERCEL_TOKEN=…`

---

## 17. Figma (3 min) — optional

**Why:** pull title cards and lower-thirds as design specs so Remotion reproduces them exactly instead of me approximating.

1. **https://www.figma.com/signup**
2. **https://www.figma.com/settings** → **Security** tab → scroll to **Personal access tokens** → **Generate new token**
3. Scopes: **File content: Read-only** is enough
4. Copy `figd_…` → send: `FIGMA_TOKEN=figd_…`

---

## 18. No key needed — the highest-signal thing you can give me (1 min)

Open **YouTube Studio → Analytics → Content → (last video) → Engagement → Retention**, screenshot the curve, drop it in chat.

It tells me the exact second people leave — something no tool in this guide can infer. One screenshot beats $50 of tooling.

---

## 19. Verify everything (30 s)

Put all keys into **`nightingale/.env.local`** (I created it; it's gitignored — it will never be committed or uploaded). Then:

```bash
cd nightingale && python3 tools/verify_keys.py
```

Output is a table of OK / FAIL / SKIP with the exact error for each:

```
OK    GitHub             earning-cpu · repo 200 · pages ✗ needs pages=write,administration=write
SKIP  Cloudflare         CLOUDFLARE_API_TOKEN not set
...
1 ok · 0 failed · 14 not set
```

You can also just paste keys into the chat — I'll put them in `.env.local` myself. Both work; the file is tidier.

---

## 20. Key hygiene

| Rule | Why |
|---|---|
| Never send your **account password** — keys only | a password can't be scoped or revoked |
| Prefer **read** where read is enough | the verifier proves it works before I need write |
| Put an **expiry** on everything (~90 days) | a leaked key has a shelf life |
| **Revoke anytime**: GitHub `settings/tokens?type=beta` · Cloudflare `profile/api-tokens` · HuggingFace `settings/tokens` · HF/Figma/Vercel all have a one-click delete | no lock-in |
| `.env.local` is gitignored — confirmed with `git check-ignore` | it never enters a commit or a Release |
| The token already in this chat should be **rotated** when the project pauses | it's been in a chat log; rotating is free |

---

## 21. What happens after each one lands

| When you finish | I do this | You see |
|---|---|---|
| **GitHub** | enable Pages, wire the deploy step, add the Watch button | **a URL that plays the film in-browser** |
| **Cloudflare** | run the 280-frame VLM audit + Whisper sync proof | a semantic QA report, `qa/semantic_v9.json` |
| **Kaggle** | parallax on 6 stills → new cuts → render **v10** | the first film with real depth motion |
| **AISTUDIO / Groq** | 20 hook variants, ranked | a sharper cold open |
| **Cloudinary** | HLS ladder + player | instant playback, mobile-adaptive |
| **Apify** | research brief | the next script written from data |
| **YouTube screenshot** | drop-off map → re-cut the slow beat | fewer people leaving |

---

*Everything above is free. Nothing needs a card. The first three are the difference between "a file you download" and "a film you watch".*
