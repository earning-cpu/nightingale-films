#!/usr/bin/env python3
"""verify_keys.py — ping every key you've given me and report what works.

Reads .env.local (or environment) and tests each service with the cheapest
possible call. Prints OK / FAIL / SKIP per key with the reason.

    python3 tools/verify_keys.py
    python3 tools/verify_keys.py --only github,cloudflare

Nothing here writes, uploads, renders or deletes. Read-only checks.
"""
from __future__ import annotations
import argparse, base64, json, os, sys, urllib.request, urllib.error

ENV = {}
def load_env(path=".env.local"):
    if not os.path.exists(path):
        path = ".env"
    if os.path.exists(path):
        for line in open(path):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            ENV[k.strip()] = v.strip().strip('"').strip("'")
    ENV.update({k: v for k, v in os.environ.items() if k in ENV or k.endswith("_TOKEN")})

def req(url, headers=None, data=None, method=None, timeout=25):
    h = {"User-Agent": "nightingale-verify/1.0"}
    h.update(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return resp.status, resp.read().decode("utf-8", "replace")

RED, GRN, YEL, DIM, OFF = "\033[31m", "\033[32m", "\033[33m", "\033[2m", "\033[0m"
rows = []

def record(name, key, fn):
    val = ENV.get(key, "")
    if not val:
        rows.append((name, "SKIP", f"{key} not set")); return
    try:
        msg = fn(val)
        rows.append((name, "OK", msg or ""))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:160].replace("\n", " ")
        rows.append((name, "FAIL", f"HTTP {e.code} · {body}"))
    except Exception as e:                                   # noqa: BLE001
        rows.append((name, "FAIL", f"{type(e).__name__}: {str(e)[:160]}"))

# ------------------------------------------------------------------ checks
def c_github(t):
    st, body = req("https://api.github.com/user", {"Authorization": f"Bearer {t}"})
    who = json.loads(body).get("login")
    st2, _ = req("https://api.github.com/repos/earning-cpu/nightingale-films", {"Authorization": f"Bearer {t}"})
    # PUT /pages is the discriminator: 403 = permission missing, 404 = permission OK but
    # no site yet, 2xx = site live. Idempotent when it does exist (same source).
    pages, detail = "unknown", ""
    try:
        req("https://api.github.com/repos/earning-cpu/nightingale-films/pages",
            {"Authorization": f"Bearer {t}"},
            data={"source": {"branch": "main", "path": "/docs"}}, method="PUT")
        pages = "pages ✓ site LIVE"
    except urllib.error.HTTPError as e:
        acc = e.headers.get("x-accepted-github-permissions", "")
        if e.code == 403:
            pages, detail = "pages ✗", f" needs {acc or 'pages=write,administration=write'}"
        elif e.code == 404:
            pages = "pages ✓ (not enabled yet)"
        else:
            pages, detail = f"pages ? HTTP {e.code}", ""
    return f"{who} · repo {st2} · {pages}{detail}"

def c_cloudflare(t):
    st, body = req("https://api.cloudflare.com/client/v4/user/tokens/verify", {"Authorization": f"Bearer {t}"})
    d = json.loads(body)
    status = d.get("result", {}).get("status")
    acct = ENV.get("CLOUDFLARE_ACCOUNT_ID", "")
    if not acct:
        return f"token {status} · CLOUDFLARE_ACCOUNT_ID missing"
    # does this token actually have Workers AI? a 1-token text call is the cheapest proof
    try:
        st2, b2 = req(f"https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/@cf/meta/llama-3.2-1b-instruct",
                      {"Authorization": f"Bearer {t}"},
                      data={"messages": [{"role": "user", "content": "hi"}], "max_tokens": 1})
        d2 = json.loads(b2)
        ai = "workers-ai ✓" if d2.get("success", True) else f"workers-ai ✗ {str(d2.get('errors'))[:80]}"
    except urllib.error.HTTPError as e:
        body2 = e.read().decode("utf-8", "replace")[:120]
        ai = f"workers-ai ✗ HTTP {e.code}"
        if e.code == 403:
            ai += " (licence or scope)"
    return f"token {status} · account {acct[:8]}… · {ai}"

def c_hf(t):
    st, body = req("https://huggingface.co/api/whoami-v2", {"Authorization": f"Bearer {t}"})
    d = json.loads(body)
    return f"{d.get('name')} · {d.get('type')}"

def c_kaggle(_):
    user, key = ENV.get("KAGGLE_USERNAME", ""), ENV.get("KAGGLE_KEY", "")
    if not user or not key:
        raise RuntimeError("need KAGGLE_USERNAME + KAGGLE_KEY")
    auth = base64.b64encode(f"{user}:{key}".encode()).decode()
    st, body = req("https://www.kaggle.com/api/v1/datasets/list?pageSize=1", {"Authorization": f"Basic {auth}"})
    return f"{user} · API reachable"

def c_groq(t):
    st, body = req("https://api.groq.com/openai/v1/models", {"Authorization": f"Bearer {t}"})
    return f"{len(json.loads(body).get('data',[]))} models"

def c_gemini(t):
    st, body = req(f"https://generativelanguage.googleapis.com/v1beta/models?key={t}")
    ms = json.loads(body).get("models", [])
    return f"{len(ms)} models"

def c_openrouter(t):
    st, body = req("https://openrouter.ai/api/v1/key", {"Authorization": f"Bearer {t}"})
    d = json.loads(body).get("data", {})
    return f"limit={d.get('limit')} usage={d.get('usage')}"

def c_apify(t):
    st, body = req("https://api.apify.com/v2/users/me", {"Authorization": f"Bearer {t}"})
    d = json.loads(body).get("data", {})
    return f"{d.get('username')} · plan {d.get('plan',{}).get('id','?') if isinstance(d.get('plan'),dict) else d.get('plan')}"

def c_replicate(t):
    st, body = req("https://api.replicate.com/v1/account", {"Authorization": f"Bearer {t}"})
    d = json.loads(body)
    return f"{d.get('username')} · {d.get('type')}"

def c_removebg(t):
    st, body = req("https://api.remove.bg/v1.0/account", {"X-Api-Key": t})
    d = json.loads(body).get("data", {}).get("attributes", {})
    return f"credits {d.get('credits',{}).get('total','?')}/{d.get('credits',{}).get('total','?')} · free {d.get('credits',{}).get('free','?')}"

def c_cloudinary(_):
    url = ENV.get("CLOUDINARY_URL", "")
    if not url:
        raise RuntimeError("CLOUDINARY_URL not set")
    cloud = url.split("@")[-1]
    st, body = req(f"https://res.cloudinary.com/{cloud}/image/list/nonexistent.json")
    return f"cloud '{cloud}' reachable"

def c_notion(t):
    st, body = req("https://api.notion.com/v1/users/me", {"Authorization": f"Bearer {t}", "Notion-Version": "2022-06-28"})
    d = json.loads(body)
    return f"{d.get('name') or d.get('bot',{}).get('owner',{}).get('type','bot')}"

def c_vercel(t):
    st, body = req("https://api.vercel.com/v2/user", {"Authorization": f"Bearer {t}"})
    return json.loads(body).get("user", {}).get("username", "ok")

def c_figma(t):
    st, body = req("https://api.figma.com/v1/me", {"X-Figma-Token": t})
    return json.loads(body).get("email", "ok")

def c_supabase(_):
    url = ENV.get("SUPABASE_URL", ""); key = ENV.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise RuntimeError("need SUPABASE_URL + SUPABASE_SERVICE_KEY")
    st, body = req(f"{url}/rest/v1/", {"apikey": key, "Authorization": f"Bearer {key}"})
    return "REST reachable"

CHECKS = [
    ("GitHub",            "GITHUB_TOKEN",          c_github),
    ("Cloudflare",        "CLOUDFLARE_API_TOKEN",  c_cloudflare),
    ("Kaggle",            "KAGGLE_KEY",            c_kaggle),
    ("Hugging Face",      "HF_TOKEN",              c_hf),
    ("Google AI Studio",  "GEMINI_API_KEY",        c_gemini),
    ("Groq",              "GROQ_API_KEY",          c_groq),
    ("OpenRouter",        "OPENROUTER_API_KEY",    c_openrouter),
    ("Cloudinary",        "CLOUDINARY_URL",        c_cloudinary),
    ("Apify",             "APIFY_TOKEN",           c_apify),
    ("Replicate",         "REPLICATE_API_TOKEN",   c_replicate),
    ("Remove.bg",         "REMOVEBG_API_KEY",      c_removebg),
    ("Supabase",          "SUPABASE_URL",          c_supabase),
    ("Notion",            "NOTION_TOKEN",          c_notion),
    ("Vercel",            "VERCEL_TOKEN",          c_vercel),
    ("Figma",             "FIGMA_TOKEN",           c_figma),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="", help="comma list of service names, case-insensitive")
    ap.add_argument("--env", default=".env.local")
    a = ap.parse_args()
    load_env(a.env)
    want = [w.strip().lower() for w in a.only.split(",") if w.strip()]
    print(f"\nverifying keys from {a.env}\n" + "=" * 66)
    for name, key, fn in CHECKS:
        if want and name.lower() not in want and key.lower() not in want:
            continue
        record(name, key, fn)
    ok = fail = skip = 0
    for name, state, msg in rows:
        color = GRN if state == "OK" else (RED if state == "FAIL" else YEL)
        print(f"{color}{state:4}{OFF}  {name:18} {DIM}{msg}{OFF}")
        ok += state == "OK"; fail += state == "FAIL"; skip += state == "SKIP"
    print("=" * 66)
    print(f"{GRN}{ok} ok{OFF} · {RED}{fail} failed{OFF} · {YEL}{skip} not set{OFF}")
    if fail:
        print("\nThe FAIL rows tell us exactly what is mis-scoped — paste the message back and I'll fix the request or the scope.")
    return 0 if not fail else 1

if __name__ == "__main__":
    sys.exit(main())
