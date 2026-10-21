#!/usr/bin/env python3
"""make_wow_v2.py — "72 SECONDS" v2: hook, captions, and moving plates.

What changed from v1, and why:

* HOOK. The first 3 seconds now carry the whole promise — "1977. Something
  broadcast at us for 72 seconds. Nobody has ever heard it again." — over a
  fast 3-shot montage with an impact on "72". A viewer who skips at 0:03 was
  never going to stay.
* NO SHOT LONGER THAN ~6 s. v1 held single stills for 10-13 s, which is what
  made it skippable. Every line is now cut into 2-3 shots, and the moving
  plates (real 2.5D parallax clips) are interleaved with stills so the frame
  is never static.
* BURNED CAPTIONS. Word-level, three words at a time, lower third, inside the
  safe zone. Built from the same word offsets that drive the animation.
* IMPACT SFX. A low boom on the hook, the number, and the "Wow!".

Output: src/wow/timeline.json (v2) + public/wow_mix_v2.wav
"""
from __future__ import annotations
import asyncio, json, os, subprocess, sys

import edge_tts

ROOT = os.path.dirname(os.path.abspath(__file__))
VOICE = "en-US-ChristopherNeural"
RATE = "+6%"
FPS = 30
WOW = os.path.join(ROOT, "audio", "wow")
OUT = os.path.join(ROOT, "src", "wow")

# id, voice line, [shots], lead, tail
# a shot is ("img", path, focusFrom, focusTo, scaleFrom, scaleTo, brightness, sepia)
#          or ("vid", path, start_seconds)   start_seconds lets one 3 s clip be reused
I = lambda p, **k: ("img", p, k)
V = lambda p, s=0.0: ("vid", p, s)

SCENES = [
    # ---------------- HOOK — 3 hard cuts in 6.4 s, the promise in the first frame
    ("hook", "Nineteen seventy seven. Something called out. Seventy two seconds.",
     [I("wow/img/b_01.png", focusFrom=(50, 54), focusTo=(43, 45), scale=(1.15, 1.24), b=1.02, sep=0),
      I("wow/img/b_07.png", focusFrom=(50, 62), focusTo=(52, 44), scale=(1.12, 1.20), b=1.05, sep=0),
      V("wow/clip/par_b_07.mp4")],
     0, 18),

    ("a", "And nobody ever heard it again.",
     [I("wow/img/b_11.png", focusFrom=(46, 58), focusTo=(54, 48), scale=(1.14, 1.22), b=1.0, sep=0),
      V("wow/clip/par_b_01.mp4")],
     12, 16),

    # ---------------- WHAT HAPPENED
    ("b", "August fifteenth. A radio telescope in Delaware, Ohio, sweeping the sky.",
     [I("wow/img/b_05.png", focusFrom=(42, 56), focusTo=(56, 46), scale=(1.16, 1.26), b=0.84, sep=0),
      V("wow/clip/par_b_02.mp4"),
      I("wow/img/b_04.png", focusFrom=(38, 50), focusTo=(58, 52), scale=(1.18, 1.28), b=1.05, sep=0.06)],
     12, 16),

    ("c", "It could not steer. The turning Earth carried the sky across its beam, and whatever it was passed through, and set.",
     [V("wow/clip/par_b_11.mp4"),
      I("wow/img/b_06.png", focusFrom=(50, 44), focusTo=(50, 58), scale=(1.14, 1.24), b=0.88, sep=0),
      I("wow/img/b_01.png", focusFrom=(60, 40), focusTo=(38, 58), scale=(1.20, 1.12), b=0.98, sep=0)],
     10, 16),

    # ---------------- THE NUMBER
    ("d", "One thousand four hundred twenty megahertz. The hydrogen line.",
     [V("wow/clip/par_b_07.mp4", 0.5)],
     10, 16),

    # ---------------- THE CODE
    ("e", "Six characters came off the printer. Six E Q U J five. Thirty times above the noise.",
     [V("wow/clip/par_b_12.mp4"), I("wow/img/b_06.png", focusFrom=(44, 52), focusTo=(58, 50), scale=(1.16, 1.26), b=0.90, sep=0)],
     12, 20),

    ("f", "Jerry Ehman circled them, and wrote one word in the margin. Wow.",
     [V("wow/clip/par_b_06.mp4")],
     10, 24),

    # ---------------- AFTERMATH
    ("g", "It was never heard again. Not in fifty years of listening.",
     [I("wow/img/b_04.png", focusFrom=(56, 46), focusTo=(40, 54), scale=(1.16, 1.26), b=1.0, sep=0.05),
      I("wow/img/b_11.png", focusFrom=(50, 46), focusTo=(50, 60), scale=(1.12, 1.22), b=1.0, sep=0)],
     10, 16),

    ("h", "In twenty twenty four, astronomers found a candidate. A sudden flare striking a cold cloud of hydrogen.",
     [I("wow/img/b_03.png", focusFrom=(44, 52), focusTo=(58, 48), scale=(1.14, 1.24), b=0.94, sep=0),
      V("wow/clip/par_b_08.mp4")],
     12, 16),

    ("i", "A natural maser. Not a message. A coincidence of physics, on the one channel we happened to be listening to.",
     [I("wow/img/b_12.png", focusFrom=(60, 50), focusTo=(42, 52), scale=(1.18, 1.26), b=1.0, sep=0),
      V("wow/clip/par_b_02.mp4", 0.7)],
     12, 16),

    ("j", "But it is not proven. The best evidence we have that we might not be alone, and the best evidence that we are only hearing our own universe.",
     [I("wow/img/b_09.png", focusFrom=(56, 60), focusTo=(44, 46), scale=(1.14, 1.24), b=1.0, sep=0),
      I("wow/img/b_10.png", focusFrom=(44, 50), focusTo=(58, 54), scale=(1.15, 1.25), b=1.0, sep=0),
      V("wow/clip/par_b_06.mp4", 0.6)],
     10, 18),

    ("k", "Seventy two seconds. Fifty years of silence.",
     [V("wow/clip/par_b_11.mp4", 0.4),
      I("wow/img/b_01.png", focusFrom=(50, 52), focusTo=(50, 44), scale=(1.12, 1.20), b=0.95, sep=0)],
     10, 22),
]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("failed: %s\n%s" % (" ".join(cmd[:8]), r.stderr[-900:]))


def dur(p):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", p], text=True).strip())


async def synth(text, mp3, tries=4):
    """edge-tts intermittently returns no audio for a valid line. Retry, then
    fall back to a slower rate — the failure is in the service, not the text."""
    last = None
    for attempt in range(tries):
        rate = RATE if attempt < tries - 1 else "-4%"
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
        except Exception as e:                              # noqa: BLE001
            last = repr(e)
        await asyncio.sleep(1.2 * (attempt + 1))
    raise SystemExit("TTS failed for %r: %s" % (text[:40], last))


def main():
    os.makedirs(os.path.join(WOW, "vo"), exist_ok=True)
    os.makedirs(os.path.join(WOW, "sfx"), exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    ids = [x[0] for x in SCENES]
    assert len(ids) == len(set(ids)), "duplicate scene id: %s" % ids
    scenes, cursor, filters = [], 0, []

    for i, (sid, text, shots, lead, tail) in enumerate(SCENES):
        mp3 = os.path.join(WOW, "vo", "v2_" + sid + ".mp3")
        wav = os.path.join(WOW, "vo", "v2_" + sid + ".wav")
        words = asyncio.run(synth(text, mp3))
        run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ar", "48000", "-ac", "1",
             "-c:a", "pcm_s16le", wav])
        d = dur(wav)
        vo_start = cursor + lead
        dur_f = int(lead + round(d * FPS) + tail)

        # shot boundaries: cut on the voice, never less than 40 frames
        n = len(shots)
        weights = [0.42, 0.33, 0.25][:n] if n == 3 else ([0.55, 0.45][:n] if n == 2 else [1.0])
        s0 = 0
        bounds = []
        for k, w in enumerate(weights):
            ln = max(40, int(dur_f * w))
            bounds.append((s0, ln))
            s0 += ln
        # fix rounding so the last shot reaches the end of the scene
        last_s, last_l = bounds[-1]
        bounds[-1] = (last_s, dur_f - last_s)

        scenes.append({
            "id": sid, "text": text, "from": cursor, "dur": dur_f,
            "voStart": vo_start, "voDur": round(d * FPS),
            "words": [{"w": w["w"], "f": vo_start + int(round(w["t"] * FPS))} for w in words],
            # shot.from must be GLOBAL — scene-relative bounds made every
            # scene except the first render nothing (found the hard way)
            "shots": [{"kind": sh[0], "src": sh[1],
                       **({"start": sh[2]} if sh[0] == "vid" else sh[2]),
                       "from": cursor + bounds[k][0], "dur": bounds[k][1]}
                      for k, sh in enumerate(shots)],
        })

        ms = int(round(vo_start / FPS * 1000))
        filters.append("[%d:a]adelay=%d|%d,volume=1.0[v%d]" % (i, ms, ms, i))
        cursor += dur_f
        print("  %s  %5.2fs  scene %4d-%4d  shots %s" %
              (sid, d, scenes[-1]["from"], scenes[-1]["from"] + dur_f,
               [b[1] for b in bounds]))

    total = cursor
    by = {s["id"]: s for s in scenes}

    # ---- sfx: low boom (hook / number / Wow), typewriter tick (code), riser (end)
    boom = os.path.join(WOW, "sfx", "boom.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=44:duration=1.4:sample_rate=48000",
         "-af", "volume=0.9,afade=t=out:st=0:d=1.4,lowpass=f=110", "-ac", "1", boom])
    tick = os.path.join(WOW, "sfx", "tick.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=2200:duration=0.05:sample_rate=48000",
         "-af", "volume=0.25,afade=t=out:st=0:d=0.05", "-ac", "1", tick])
    tone = os.path.join(WOW, "sfx", "tone.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=1420:duration=2.6:sample_rate=48000",
         "-af", "volume=0.14,afade=t=in:st=0:d=0.9,afade=t=out:st=1.6:d=1.0", "-ac", "1", tone])

    wow_f = next((w["f"] for w in by["f"]["words"] if w["w"].lower().startswith("wow")),
                 by["f"]["voStart"] + 60)
    num_f = next((w["f"] for w in by["d"]["words"] if "mega" in w["w"].lower()),
                 by["d"]["voStart"] + 60)
    code_f = by["e"]["voStart"] + 14

    cue = [(boom, by["h"]["from"] + 4, 1.0), (boom, num_f, 0.55),
           (boom, wow_f - 2, 0.85), (tone, num_f - 6, 1.0),
           (tick, code_f, 1.0), (tick, code_f + 9, 0.9), (tick, code_f + 18, 0.8),
           (tick, code_f + 27, 0.8), (tick, code_f + 36, 0.7), (tick, code_f + 45, 0.7)]

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
        cmd += ["-i", os.path.join(WOW, "vo", "v2_" + sid + ".wav")]
    for path, _, _ in cue:
        cmd += ["-i", path]
    cmd += ["-filter_complex", ";".join(filters), "-map", "[mix]",
            "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
            os.path.join(ROOT, "public", "wow_mix_v2.wav")]
    run(cmd)

    # -14 LUFS / -1.5 dBTP for web delivery (raw mix measured -25 LUFS)
    run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "public", "wow_mix_v2.wav"),
         "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000", "-ac", "2",
         "-c:a", "pcm_s16le", os.path.join(ROOT, "public", "wow_mix_v2_norm.wav")])

    tl = {"fps": FPS, "total": total, "scenes": scenes,
          "cues": {"wow": wow_f, "number": num_f, "code": code_f}}
    json.dump(tl, open(os.path.join(OUT, "timeline.json"), "w"), indent=1)
    print("\ntotal %d frames = %.1fs" % (total, total / FPS))


if __name__ == "__main__":
    main()
