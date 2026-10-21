#!/usr/bin/env python3
"""make_wow.py — build the audio bed and the timeline for "72 Seconds".

    python3 make_wow.py            # voice + sfx + full mix + src/wow/timeline.json

Everything is derived from measured audio, never from guessed timings:
each line is synthesised, probed for its real duration, and the scene is
sized to it. Word offsets from edge-tts are converted to absolute frames so
every on-screen beat can be locked to a spoken word.
"""
from __future__ import annotations
import asyncio, json, os, subprocess, sys

import edge_tts

ROOT = os.path.dirname(os.path.abspath(__file__))
VOICE = "en-US-ChristopherNeural"      # calm documentary read
RATE = "-6%"
FPS = 30
WOW = os.path.join(ROOT, "audio", "wow")
OUT = os.path.join(ROOT, "src", "wow")

# id, narration, plate, lead frames before the line, tail frames after
SCENES = [
    ("a", "On the fifteenth of August, nineteen seventy seven, a radio telescope in Delaware, Ohio, heard something it had never heard before.",
     "wow/img/w_04.png", 40, 34),
    ("b", "It lasted seventy two seconds. Then it was gone.",
     "wow/img/radio_01.png", 12, 30),
    ("c", "The telescope could not steer. The turning Earth carried the sky across its beam, and whatever it was passed through, and set.",
     "wow/img/w_07.png", 12, 26),
    ("d", "It arrived at one thousand four hundred twenty megahertz. The hydrogen line. The frequency physicists had argued any civilisation would choose.",
     None, 10, 30),
    ("e", "Six characters came off the printer. Six. E. Q. U. J. Five. Intensity climbing thirty times above the noise, then falling away.",
     None, 14, 34),
    ("f", "Jerry Ehman circled them in red pen, and wrote one word in the margin. Wow.",
     None, 12, 46),
    ("g", "It was never heard again. Not in fifty years of listening.",
     "wow/img/w_02.png", 12, 34),
    ("h", "In twenty twenty four, astronomers found a candidate. A sudden flare of radiation striking a cold cloud of hydrogen, making it blaze at exactly that frequency.",
     "wow/img/w_03.png", 12, 34),
    ("i", "A natural maser. Not a message. A coincidence of physics, arriving on the one channel we happened to be listening to.",
     "wow/img/w_05.png", 12, 40),
    ("j", "But it is not proven. The Wow signal is still unexplained. The best evidence we have that we might not be alone, and the best evidence that we are only hearing our own universe.",
     "wow/img/w_01.png", 12, 50),
    ("k", "Seventy two seconds. Fifty years of silence.",
     None, 16, 44),
]


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("failed: %s\n%s" % (" ".join(cmd[:6]), r.stderr[-800:]))


def dur(path: str) -> float:
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path], text=True).strip())


async def synth(text: str, mp3: str) -> list[dict]:
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"w": ch["text"], "t": round(ch["offset"] / 1e7, 3)})
    return words


def main() -> None:
    os.makedirs(os.path.join(WOW, "vo"), exist_ok=True)
    os.makedirs(os.path.join(WOW, "sfx"), exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    scenes, cursor, n_mix, filters = [], 0, 0, []

    for sid, text, plate, lead, tail in SCENES:
        mp3 = os.path.join(WOW, "vo", sid + ".mp3")
        wav = os.path.join(WOW, "vo", sid + ".wav")
        words = asyncio.run(synth(text, mp3))
        run(["ffmpeg", "-y", "-v", "error", "-i", mp3,
             "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav])
        d = dur(wav)
        vo_start = cursor + lead
        dur_f = int(lead + round(d * FPS) + tail)

        scenes.append({
            "id": sid, "text": text, "plate": plate,
            "from": cursor, "dur": dur_f,
            "voStart": vo_start, "voDur": round(d * FPS),
            "words": [{"w": w["w"], "f": vo_start + int(round(w["t"] * FPS))} for w in words],
        })

        delay_ms = int(round(vo_start / FPS * 1000))
        filters.append("[%d:a]adelay=%d|%d,volume=1.0[v%d]" % (n_mix, delay_ms, delay_ms, n_mix))
        n_mix += 1
        cursor += dur_f
        print("  %s  %5.2fs  scene %4d-%4d" % (sid, d, scenes[-1]["from"], scenes[-1]["from"] + dur_f))

    total = cursor

    # ---------------- sfx: the 1420 Hz tone is the subject, so it is the only 'music'
    tone = os.path.join(WOW, "sfx", "tone1420.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=1420:duration=3.2:sample_rate=48000",
         "-af", "volume=0.16,afade=t=in:st=0:d=1.1,afade=t=out:st=1.9:d=1.3",
         "-ac", "1", tone])
    hit = os.path.join(WOW, "sfx", "hit.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", "sine=frequency=52:duration=0.9:sample_rate=48000",
         "-af", "volume=0.5,afade=t=out:st=0:d=0.9,lowpass=f=120",
         "-ac", "1", hit])

    # beat: the tone under the frequency line, the hit on the printout and on "Wow"
    by = {s["id"]: s for s in scenes}
    cue_tone = by["d"]["voStart"] + int(by["d"]["voDur"] * 0.45)
    cue_hit1 = by["e"]["voStart"] - 2
    cue_hit2 = [w for w in by["f"]["words"] if w["w"].lower().startswith("wow")]
    cue_hit2 = cue_hit2[0]["f"] - 3 if cue_hit2 else by["f"]["voStart"]

    inputs = sum(1 for _ in SCENES)
    extra = [tone, hit, hit]
    for i, (path, start) in enumerate(zip(extra, [cue_tone, cue_hit1, cue_hit2])):
        ms = int(round(start / FPS * 1000))
        filters.append("[%d:a]adelay=%d|%d,volume=%s[s%d]" % (inputs + i, ms, ms,
                                                              "1.0" if i == 0 else "0.55", i))
        n_mix += 1

    mix_in = "".join("[v%d]" % i for i in range(len(SCENES))) + "".join("[s%d]" % i for i in range(3))
    filters.append("%samix=inputs=%d:normalize=0:duration=longest,"
                   "highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=12:release=180,"
                   "alimiter=level_in=1:level_out=1:limit=0.891:attack=5:release=60:level=disabled,"
                   "afade=t=out:st=%.2f:d=0.9[mix]" % (mix_in, n_mix, max(0, total / FPS - 0.95)))

    cmd = ["ffmpeg", "-y", "-v", "error"]
    for sid, *_ in SCENES:
        cmd += ["-i", os.path.join(WOW, "vo", sid + ".wav")]
    for path in extra:
        cmd += ["-i", path]
    cmd += ["-filter_complex", ";".join(filters), "-map", "[mix]",
            "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
            os.path.join(ROOT, "public", "wow_mix.wav")]
    run(cmd)

    tl = {"fps": FPS, "total": total, "scenes": scenes,
          "cues": {"tone": cue_tone, "hit1": cue_hit1, "hit2": cue_hit2}}
    with open(os.path.join(OUT, "timeline.json"), "w") as fh:
        json.dump(tl, fh, indent=1)

    print("\ntotal %d frames = %.1fs" % (total, total / FPS))
    print("wrote src/wow/timeline.json and public/wow_mix.wav")


if __name__ == "__main__":
    main()
