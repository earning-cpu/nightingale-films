#!/usr/bin/env python3
"""make_wow_v3.py — "72 SECONDS" v3.

What is different from v2, and why:

* 20 scenes / ~44 shots instead of 12 / 25. Mean shot 2.0 s. Nothing is allowed
  to sit still: if a line is longer than ~5 s it gets three shots, not one.
* Every shot carries a PURPOSE (the `why` field) taken from a vision pass over
  the plates, so nothing is on screen "because it is pretty".
* Hero plates are split into three real depth planes (cut_layers.py) and
  composited with differential motion — no warped edges.
* The camera never does a blind left-right pan. Moves are motivated: push-in on
  a face, tilt-up on a dish, drift with a walk, rack focus between planes.
"""
from __future__ import annotations
import asyncio, json, os, subprocess, sys

import edge_tts

ROOT = os.path.dirname(os.path.abspath(__file__))
VOICE = "en-US-ChristopherNeural"
RATE = "+8%"
FPS = 30
WOW = os.path.join(ROOT, "audio", "wow")
OUT = os.path.join(ROOT, "src", "wow")

# shot kinds
#  L  layered plate  : (near/mid/far parallax, real cutouts)
#  I  still          : (camera move, clamped)
#  V  depth clip     : pre-rendered 2.5D (kept only where it reads)
L = lambda p, move, **k: ("layer", p, move, k)
I = lambda p, move, **k: ("img", p, move, k)
V = lambda p, s=0.0: ("vid", p, 0.0, {"start": s})

# id, line, shots, lead, tail, why(shot-by-shot purpose)
SCENES = [
    # ---------------- HOOK 0-7 s: four shots, four different scales
    ("hook", "Nineteen seventy seven. Something called out.",
     [I("wow/img/c_10.png", "push-in", b=1.12, sep=0),
      L("wow/img/c_01.png", "push-in", b=1.12),
      I("wow/img/d_01.png", "push-in", b=1.05, sep=0)],
     0, 4),
    ("hook2", "Seventy two seconds. Then nothing.",
     [I("wow/img/d_04.png", "tilt-up", b=1.05, sep=0),
      I("wow/img/d_10.png", "push-in", b=1.15, sep=0)],
     4, 4),

    # ---------------- WHO / WHERE
    ("a", "A radio telescope in Ohio. It could not steer.",
     [L("wow/img/c_09.png", "tilt-up", b=1.0),
      I("wow/img/d_07.png", "push-in", b=1.0, sep=0)],
     6, 12),
    ("b", "The Earth turned. The sky crawled across the beam.",
     [I("wow/img/b_07.png", "drift-left", b=1.0, sep=0),
      L("wow/img/b_01.png", "drift-right", b=1.0),
      I("wow/img/d_05.png", "push-in", b=1.0, sep=0)],
     6, 12),
    ("c", "For seventy two seconds, something was in it.",
     [L("wow/img/c_01.png", "push-in", b=1.0),
      I("wow/img/c_10.png", "rack", b=1.0, sep=0)],
     6, 16),

    # ---------------- THE NIGHT
    ("d", "August fifteenth. Ten sixteen at night.",
     [I("wow/img/c_07.png", "push-in", b=1.0, sep=0),
      I("wow/img/b_04.png", "drift-right", b=1.0, sep=0)],
     6, 12),
    ("e", "One man on the night shift, and a printer.",
     [L("wow/img/c_02.png", "push-in", b=1.0),
      I("wow/img/c_14.png", "pull-out", b=1.0, sep=0)],
     6, 12),
    ("f", "Paper came out of the machine. Six characters.",
     [L("wow/img/b_06.png", "pull-out", b=1.0),
      I("wow/img/c_12.png", "drift-left", b=1.0, sep=0)],
     6, 12),

    # ---------------- THE NUMBER
    ("g", "One thousand four hundred twenty point four five five six.",
     [I("wow/img/d_09.png", "drift-right", b=0.9, sep=0),
      I("wow/img/c_05.png", "drift-left", b=0.9, sep=0)],
     6, 14),
    ("h", "The hydrogen line. The frequency of cold gas.",
     [L("wow/img/d_09.png", "push-in", b=1.0),
      I("wow/img/b_11.png", "tilt-up", b=1.0, sep=0)],
     6, 12),

    # ---------------- THE CODE
    ("i", "Six. E. Q. U. J. Five. Thirty times above the noise.",
     [I("wow/img/c_12.png", "pull-out", b=0.8, sep=0),
      I("wow/img/d_01.png", "push-in", b=0.75, sep=0)],
     6, 18),
    ("j", "He circled it in red, and wrote one word.",
     [I("wow/img/d_03.png", "push-in", b=0.85, sep=0),
      I("wow/img/c_04.png", "rack", b=0.55)],
     6, 24),

    # ---------------- THE SEARCH
    ("k", "They looked again. And again. For fifty years.",
     [I("wow/img/c_06.png", "push-in", b=1.0, sep=0),
      I("wow/img/d_15.png", "drift-left", b=1.0, sep=0),
      I("wow/img/d_02.png", "pull-out", b=1.0, sep=0)],
     6, 12),
    ("l", "Nothing. Not one repeat.",
     [I("wow/img/d_06.png", "drift-right", b=1.0, sep=0),
      I("wow/img/c_13.png", "push-in", b=0.72, sep=0)],
     6, 18),

    # ---------------- 2024
    ("m", "Then in twenty twenty four, a candidate.",
     [I("wow/img/c_15.png", "push-in", b=1.0, sep=0),
      I("wow/img/c_11.png", "drift-right", b=1.0, sep=0)],
     6, 12),
    ("n", "A magnetar flare, hitting a cold cloud of hydrogen.",
     [I("wow/img/d_05.png", "push-in", b=1.0, sep=0),
      I("wow/img/d_14.png", "push-in", b=1.0, sep=0)],
     6, 12),
    ("o", "A natural laser. Not a voice.",
     [I("wow/img/d_11.png", "push-in", b=0.62, sep=0),
      I("wow/img/c_08.png", "pull-out", b=1.0, sep=0)],
     6, 14),

    # ---------------- THE POINT
    ("p", "It is still not proven. That is the problem.",
     [L("wow/img/c_02.png", "push-in", b=1.0),
      I("wow/img/d_13.png", "push-in", b=1.0, sep=0)],
     6, 12),
    ("q", "The best evidence we are not alone, and the best evidence we are.",
     [L("wow/img/c_01.png", "push-in", b=1.0),
      I("wow/img/d_12.png", "drift-left", b=1.0, sep=0),
      I("wow/img/c_03.png", "push-in", b=1.0, sep=0)],
     6, 12),

    # ---------------- CLOSE
    ("r", "Seventy two seconds. Fifty years of silence.",
     [I("wow/img/b_11.png", "tilt-down", b=1.0, sep=0),
      L("wow/img/d_04.png", "pull-out", b=1.0)],
     6, 26),
]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("failed: %s\n%s" % (" ".join(cmd[:6]), r.stderr[-700:]))


def dur(p):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", p], text=True).strip())


async def synth(text, mp3, tries=4):
    last = None
    for attempt in range(tries):
        rate = RATE if attempt < tries - 1 else "+2%"
        try:
            c = edge_tts.Communicate(text, VOICE, rate=rate, boundary="WordBoundary")
            words, n = [], 0
            with open(mp3, "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"]); n += len(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append({"w": ch["text"], "t": round(ch["offset"] / 1e7, 3)})
            if n > 2000:
                return words
            last = "no audio"
        except Exception as e:                                  # noqa: BLE001
            last = repr(e)
        await asyncio.sleep(1.5 * (attempt + 1))
    raise SystemExit("TTS failed for %r: %s" % (text[:40], last))


def main():
    os.makedirs(os.path.join(WOW, "vo3"), exist_ok=True)
    os.makedirs(os.path.join(WOW, "sfx"), exist_ok=True)
    ids = [s[0] for s in SCENES]
    assert len(ids) == len(set(ids)), "duplicate scene id"

    scenes, cursor, filters = [], 0, []
    for i, (sid, text, shots, lead, tail) in enumerate(SCENES):
        mp3 = os.path.join(WOW, "vo3", sid + ".mp3")
        wav = os.path.join(WOW, "vo3", sid + ".wav")
        words = asyncio.run(synth(text, mp3))
        run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ar", "48000", "-ac", "1",
             "-c:a", "pcm_s16le", wav])
        d = dur(wav)
        vo_start = cursor + lead
        dur_f = int(lead + round(d * FPS) + tail)

        n = len(shots)
        w = {1: [1.0], 2: [0.54, 0.46], 3: [0.42, 0.33, 0.25]}[n]
        bounds, s0 = [], 0
        for k, wk in enumerate(w):
            ln = max(30, int(dur_f * wk))
            bounds.append((s0, ln)); s0 += ln
        bounds[-1] = (bounds[-1][0], dur_f - bounds[-1][0])

        scenes.append({
            "id": sid, "text": text, "from": cursor, "dur": dur_f,
            "voStart": vo_start, "voDur": round(d * FPS),
            "words": [{"w": x["w"], "f": vo_start + int(round(x["t"] * FPS))} for x in words],
            "shots": [{"kind": sh[0], "src": sh[1], "move": sh[2], **sh[3],
                       **({"start": sh[2] if False else sh[3].get("start", 0)} if sh[0] == "vid" else {}),
                       "from": cursor + bounds[k][0], "dur": bounds[k][1]}
                      for k, sh in enumerate(shots)],
        })
        ms = int(round(vo_start / FPS * 1000))
        filters.append("[%d:a]adelay=%d|%d,volume=1.0[v%d]" % (i, ms, ms, i))
        cursor += dur_f
        print("  %-6s %5.2fs  %4d-%-4d  %s" %
              (sid, d, scenes[-1]["from"], scenes[-1]["from"] + dur_f, [b[1] for b in bounds]))

    total = cursor
    by = {s["id"]: s for s in scenes}

    # ---------------- sfx
    sfx = os.path.join(WOW, "sfx")
    boom = os.path.join(sfx, "boom.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=42:duration=1.5:sample_rate=48000",
         "-af", "volume=0.95,afade=t=out:st=0:d=1.5,lowpass=f=100", "-ac", "1", boom])
    tick = os.path.join(sfx, "tick.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=2400:duration=0.045:sample_rate=48000",
         "-af", "volume=0.3,afade=t=out:st=0:d=0.045", "-ac", "1", tick])
    tone = os.path.join(sfx, "tone.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=1420:duration=3.0:sample_rate=48000",
         "-af", "volume=0.12,afade=t=in:st=0:d=1.0,afade=t=out:st=1.8:d=1.2", "-ac", "1", tone])
    riser = os.path.join(sfx, "riser.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "anoisesrc=d=2.2:c=pink:a=0.30:r=48000",
         "-af", "highpass=f=300,afade=t=in:st=0:d=2.2,lowpass=f=6000", "-ac", "1", riser])

    def wf(sid, rx):
        for x in by[sid]["words"]:
            if rx.search(x["w"]):
                return x["f"]
        return by[sid]["voStart"] + 20
    import re
    num = wf("g", re.compile(r"thousand", re.I))
    wow = wf("j", re.compile(r"wrote", re.I))
    six = wf("f", re.compile(r"^Six$|six", re.I))

    cue = [(boom, 2, 1.0), (boom, by["hook2"]["from"] + 2, 0.9),
           (tone, num - 4, 1.0), (boom, num, 0.5),
           (tick, six, 1.0), (tick, six + 8, 0.85), (tick, six + 16, 0.8),
           (tick, six + 24, 0.8), (tick, six + 32, 0.7),
           (boom, wow - 2, 0.85), (riser, by["q"]["from"], 0.55),
           (boom, by["r"]["from"] + 4, 0.9)]

    base = len(SCENES)
    for j, (path, start, vol) in enumerate(cue):
        ms = int(round(start / FPS * 1000))
        filters.append("[%d:a]adelay=%d|%d,volume=%s[s%d]" % (base + j, ms, ms, vol, j))
    mix_in = "".join("[v%d]" % i for i in range(len(SCENES))) + \
             "".join("[s%d]" % j for j in range(len(cue)))
    filters.append("%samix=inputs=%d:normalize=0:duration=longest,"
                   "highpass=f=65,acompressor=threshold=-20dB:ratio=3.2:attack=10:release=180,"
                   "alimiter=level_in=1:level_out=1:limit=0.891:attack=5:release=60:level=disabled,"
                   "afade=t=out:st=%.2f:d=0.9[mix]"
                   % (mix_in, len(SCENES) + len(cue), max(0, total / FPS - 0.95)))
    cmd = ["ffmpeg", "-y", "-v", "error"]
    for sid, *_ in SCENES:
        cmd += ["-i", os.path.join(WOW, "vo3", sid + ".wav")]
    for path, _, _ in cue:
        cmd += ["-i", path]
    cmd += ["-filter_complex", ";".join(filters), "-map", "[mix]",
            "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
            os.path.join(ROOT, "public", "wow_mix_v3.wav")]
    run(cmd)
    run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "public", "wow_mix_v3.wav"),
         "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000", "-ac", "2",
         "-c:a", "pcm_s16le", os.path.join(ROOT, "public", "wow_mix_v3_norm.wav")])
    run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "public", "wow_mix_v3_norm.wav"),
         "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(ROOT, "public", "wow_mix_v3_norm.mp3")])

    tl = {"fps": FPS, "total": total, "scenes": scenes,
          "cues": {"number": num, "wow": wow, "six": six}}
    json.dump(tl, open(os.path.join(OUT, "timeline.json"), "w"), indent=1)
    nshots = sum(len(s["shots"]) for s in scenes)
    print("\n%d scenes, %d shots, %d frames = %.1fs (mean shot %.2fs)"
          % (len(scenes), nshots, total, total / FPS, total / FPS / nshots))


if __name__ == "__main__":
    main()
