#!/usr/bin/env python3
"""ig_profile.py — read an Instagram account's public grid, no login, no API key.

    python3 tools/ig_profile.py miftahul_islam_efaz
    python3 tools/ig_profile.py miftahul_islam_efaz --download qa/ig
    python3 tools/ig_profile.py someone --json qa/ig/someone.json

The endpoint it uses is Instagram's own web app endpoint:

    https://i.instagram.com/api/v1/users/web_profile_info/?username=NAME
    header: x-ig-app-id: 936619743392459        (Instagram's public web app id)
    header: a normal desktop User-Agent

That returns the profile plus a direct `video_url` for every post — no auth, no cookies.
`instagram.com/<user>/` and `api.instagram.com/oembed` both 302 to a login wall; this one
does not. It is a read-only request against public data, one call per profile.

Be a decent citizen: this makes ONE request. Do not loop it.

**It rate-limits fast.** A second call from the same IP within a few minutes returns
HTTP 429. That is not a bug in the script — it is Instagram protecting itself. The script
therefore caches nothing and refuses to retry; it tells you to wait. If you need to work on a
grid you already fetched, save it with `--json` and reopen it with `--from-json`.

What you get back per post: shortcode, permalink, view count, like count, caption, and for
videos a direct mp4 URL you can hand to ffmpeg or `style_profile.py`.
"""
from __future__ import annotations
import argparse, json, os, subprocess, sys, urllib.request, urllib.error

APP_ID = "936619743392459"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")


def fetch(username: str) -> dict:
    url = ("https://i.instagram.com/api/v1/users/web_profile_info/?username="
           + urllib.parse.quote(username))
    req = urllib.request.Request(url, headers={
        "x-ig-app-id": APP_ID,
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.instagram.com/",
    })
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def cap(node: dict) -> str:
    edges = (node.get("edge_media_to_caption") or {}).get("edges") or []
    return edges[0]["node"]["text"] if edges else ""


def main() -> None:
    ap = argparse.ArgumentParser(description="Read a public Instagram grid.")
    ap.add_argument("username")
    ap.add_argument("--download", default=None, help="save videos into this folder")
    ap.add_argument("--json", default=None, help="save the parsed profile here")
    ap.add_argument("--limit", type=int, default=24)
    ap.add_argument("--from-json", default=None,
                    help="work from a previously saved profile JSON instead of the network")
    a = ap.parse_args()

    if a.from_json:
        raw = json.load(open(a.from_json))
    else:
        try:
            raw = fetch(a.username)
        except urllib.error.HTTPError as e:
            hint = ("HTTP 429 means you already called it recently — wait 10+ minutes."
                    if e.code == 429 else
                    "HTTP 404 means the account is private, renamed or gone.")
            sys.exit("HTTP %s — %s Do not retry in a loop." % (e.code, hint))
        except Exception as e:                                # noqa: BLE001
            sys.exit("request failed: %r" % e)

    user = ((raw.get("data") or {}).get("user") or {})
    if not user:
        sys.exit("no user in the response (private, renamed, or blocked)")

    edges = ((user.get("edge_owner_to_timeline_media") or {}).get("edges") or [])[: a.limit]

    print("@" + str(user.get("username")), "·", user.get("full_name"))
    print("followers %s · posts %s · private %s · business %s"
          % ((user.get("edge_followed_by") or {}).get("count"),
             (user.get("edge_owner_to_timeline_media") or {}).get("count"),
             user.get("is_private"), user.get("is_business_account")))
    print("bio:", (user.get("biography") or "").replace("\n", " / "))
    print("=" * 78)

    posts = []
    if a.download:
        os.makedirs(a.download, exist_ok=True)

    for i, e in enumerate(edges):
        n = e.get("node") or {}
        sc = n.get("shortcode")
        vid = n.get("is_video")
        row = {
            "index": i,
            "shortcode": sc,
            "url": "https://www.instagram.com/p/%s/" % sc,
            "kind": "video" if vid else "image",
            "views": n.get("video_view_count"),
            "likes": (n.get("edge_liked_by") or {}).get("count"),
            "comments": (n.get("edge_media_to_comment") or {}).get("count"),
            "taken_at": n.get("taken_at_timestamp"),
            "caption": cap(n)[:400],
            "video_url": n.get("video_url") if vid else None,
        }
        posts.append(row)
        print("[%02d] %-5s views=%-8s likes=%-6s %s"
              % (i, row["kind"], row["views"], row["likes"], row["url"]))
        if row["caption"]:
            print("      " + row["caption"][:150].replace("\n", " | "))

        if a.download and vid and row["video_url"]:
            out = os.path.join(a.download, "%02d_%s.mp4" % (i, sc))
            if os.path.exists(out) and os.path.getsize(out) > 50000:
                print("      (already have %s)" % out)
                continue
            r = subprocess.run(["curl", "-s", "-m", "240", "-A", "Mozilla/5.0",
                                "-o", out, row["video_url"]])
            size = os.path.getsize(out) if os.path.exists(out) else 0
            print("      -> %s %.1f MB" % (out, size / 1e6) if size > 50000
                  else "      -> download failed")

    if a.json:
        os.makedirs(os.path.dirname(os.path.abspath(a.json)) or ".", exist_ok=True)
        json.dump({"user": user.get("username"), "posts": posts}, open(a.json, "w"), indent=1)
        raw_path = os.path.splitext(a.json)[0] + "_raw.json"
        json.dump(raw, open(raw_path, "w"))
        print("wrote", raw_path, "(reopen with --from-json)")
        print("\nwrote", a.json)

    print("\nnext: python3 tools/style_profile.py %s/*.mp4"
          % (a.download or "<folder>"))


if __name__ == "__main__":
    import urllib.parse                                        # noqa: E402
    main()
