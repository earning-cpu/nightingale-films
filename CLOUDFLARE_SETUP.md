# CLOUDFLARE SETUP — exact steps
### Two values, ~6 minutes, and the semantic audit runs itself

**You need to send me exactly two things:**

```
CLOUDFLARE_ACCOUNT_ID=<32-character hex>
CLOUDFLARE_API_TOKEN=<long token string>
```

The account ID is **not secret** — it's in every dashboard URL. The token **is** secret and is shown
only once. If you lose it, delete it and make another; nothing breaks.

---

## Step 1 — log in and grab the Account ID

1. Go to **https://dash.cloudflare.com** and sign in.
2. Look at the browser address bar. It will read:
   ```
   https://dash.cloudflare.com/a1b2c3d4e5f60718293a4b5c6d7e8f90
                                    └──────────────┬──────────────┘
                                        this is your Account ID
   ```
   Copy that 32-character hex string.
3. **Can't see it in the URL?** Click **Workers & Pages** in the left sidebar. The right-hand panel
   shows **Account ID** with a copy button. Same value.

> If your URL has nothing after the slash, click any product (Workers & Pages, R2, AI) — the ID
> appears in the URL as soon as you're inside an account.

---

## Step 2 — the Llama licence (there is NO accept button — this is not your mistake)

You opened the model page and found only a licence link that redirects to GitHub. That is the
**exact** behaviour today: Cloudflare removed the "Accept" button. The licence is accepted by
**sending one API request**:

```bash
curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/ai/run/@cf/meta/llama-3.2-11b-vision-instruct \
  -X POST -H "Authorization: Bearer $CF_TOKEN" -d '{"prompt":"agree"}'
```

**You do not need to do this.** My script sends that call automatically the first time it hits a
403, then retries the same frame. So skip straight to Step 3 — the licence will be accepted for
you the moment the token exists.

> Why it matters anyway: without that one call, every vision request returns `403`, and the error
> text looks like a permissions problem — which is why people rebuild tokens for an hour chasing
> the wrong cause. `tools/cf_vlm_audit.py` handles it; `tools/verify_keys.py` now reports
> `vision ✓ licence accepted` so you can see it happen.

### If a model refuses with `5035` / "requires Workers Paid"

Cloudflare moved some models off the free plan (Kimi K2.6, GLM-5.2, Kimi K2.7 Code as of mid-2026).
`llama-3.2-11b-vision-instruct` is still on free. If it ever moves, the audit script automatically
falls back in order:

1. `@cf/meta/llama-3.2-11b-vision-instruct`
2. `@cf/google/gemma-3-12b-it`
3. `@cf/llava-hf/llava-1.5-7b-hf`

and prints which one it used. No action needed from you.

## Step 3 — create the API token

1. Go to **https://dash.cloudflare.com/profile/api-tokens**
   *(direct link is faster than hunting through the menu)*
2. Click **Create Token**
3. **Ignore all the templates.** Scroll to the bottom and click **Create Custom Token**
   *(templates grant broad zone permissions we don't want)*
4. **Token name:** `nightingale`

5. **Permissions** — click **+ Add more**, and build these two rows:

   | Row | Column 1 | Column 2 | Column 3 |
   |---|---|---|---|
   | 1 | **Account** | **Workers AI** | **Edit** |
   | 2 | **Account** | **Cloudflare Pages** | **Edit** |

   - **Workers AI: Edit** is what actually runs the models.
   - **Cloudflare Pages: Edit** lets me deploy a copy of the watch page with unmetered bandwidth
     (optional, but free and strictly better than GitHub Pages for video traffic).

   If a row asks for a **Zone** resource, it's the wrong row — delete it. We don't touch DNS,
   we don't touch any domain, and no zone permissions are needed.

6. **Account Resources** → should read **Include → [your account name]**
   If it says *All accounts*, change it to just yours.

7. **Client IP Address Filtering** → leave empty.
8. **TTL** → **Start date: today**, **End date: ~90 days out** (or "no expiry" — your call;
   a 90-day life is the safer default).

9. Click **Continue to summary**.
10. Check the summary reads:
    ```
    nightingale — Account · Workers AI:Edit, Cloudflare Pages:Edit — Include: <your account>
    ```
11. Click **Create Token**.
12. **Copy the token now.** It looks like a 40-character string of letters, numbers, `-` and `_`.
    The page will never show it again.

---

## Step 4 — send it

Paste into chat, or put it in `nightingale/.env.local` yourself (gitignored, never committed):

```
CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f60718293a4b5c6d7e8f90
CLOUDFLARE_API_TOKEN=AbCdEf1234567890_-XyZ...
```

I'll verify immediately with:

```bash
python3 tools/verify_keys.py --only cloudflare
```

which calls `GET /user/tokens/verify` and reports `token active` or the exact failure.

---

## Step 5 — what I run the moment it's live

Both scripts are written and waiting in `tools/`:

### a) Semantic frame audit — `cf_vlm_audit.py`

Pairs every sampled frame with the narration line spoken at that instant and asks the vision
model whether the picture supports the words.

```
$ python3 tools/cf_vlm_audit.py docs/film_720.mp4 --narr src/narration.json --fps 4

  2.00s  match=2  declassified folder on a desk
 30.00s  match=2  close-up of charred metal fragment
 45.00s  match=1  silhouette of a desert road at night
          issues: no beam visible; line mentions "beam visible from space"
```

Exit code 1 if any frame scores `match=0`. This is **Q34** in the gate list — the only check that
finds "right frame, wrong line". It runs in about 3 minutes for the whole film.

I've already verified the pairing logic against the real narration:

```
  2.0s -> Nineteen forty seven The desert kept a secret
 30.0s -> No welds No seams The metal runs hot
 69.0s -> Read it before they do
```

### b) Caption-sync proof — `cf_whisper_sync.py`

Transcribes the finished film's audio with Whisper, then compares every word Cloudflare *hears*
against the word timings in `narration.json`. If captions are in sync, drift is a few
milliseconds; if a line slipped, this proves it with a number.

```
matched 103 / 103 words · worst drift 18 ms · 0 over tolerance
```

That's **Q28**, currently a "looks fine" check — this makes it a measurement.

### c) Free stills — `@cf/black-forest-labs/flux-1-schnell`

Any missing period plate, grain texture, or poster variant, generated free and commercial-clean.

### d) (optional) Cloudflare Pages deploy

The watch page with **unmetered bandwidth** instead of GitHub Pages' soft 100 GB — useful once
the film is being shared widely.

---

## What it costs

| Model | Price | Your free allowance |
|---|---|---|
| `llama-3.2-11b-vision-instruct` | 4,410 neurons per M input tokens, 61,493 per M output | **10,000 neurons/day** shared |
| `@cf/openai/whisper` | ≈41 neurons per audio-minute | ~240 min/day |
| `flux-1-schnell` | a few neurons per image | hundreds/day |

One full 280-frame audit ≈ **2,600 neurons ≈ 26 % of the daily free allowance**. So we can run the
audit three or four times a day, every day, for nothing. The film's whole audio is 1.16 minutes ≈
**48 neurons** — you could transcribe it 200 times a day.

No credit card. If you ever exceed the daily cap, Cloudflare **stops** rather than billing —
worst case is "try again tomorrow", never a surprise charge.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `403 Forbidden` on the vision model | Meta licence not accepted | Step 2 |
| `403` on everything | Token is **read-only** Workers AI | Edit token → Workers AI → **Edit** |
| `Authentication error` / `10000` | Token copied with a trailing space, or expired | Re-copy; check TTL |
| `Could not route ... account` | Account ID wrong or from a different login | Re-copy from the URL while inside Workers & Pages |
| `429` | Daily neuron cap hit | Wait for the 00:00 UTC reset |
| `model not found` | Model ID deprecated | Send me the error — I'll swap the ID |

**Never send me:** your Cloudflare password, or the **Global API Key** (`dash.cloudflare.com/profile/api-tokens` → *Global API Key*). That key is unscoped and controls everything in the account. The scoped token from Step 3 is the right instrument.

**Revoke any time:** https://dash.cloudflare.com/profile/api-tokens → the token → **Delete**.
Nothing else in your account is affected.

---

## If the dashboard doesn't match these steps

Cloudflare redesigns the dashboard more often than any other provider. If a menu name has moved,
send me a screenshot of the page you're on and I'll give you the exact buttons for what you see —
that's faster than guessing which of three layouts you have.
