#!/usr/bin/env python3
"""mix_v4.py — the five-layer mix, in order of priority.

  1 dialogue   the master take, compressed and levelled
  2 ambience   room tone at a subliminal bed (this is what glues cuts together)
  3 SFX        designed hits, whooshes, printer, paper, clicks, risers
  4 music      sidechain-ducked under the voice by ~7 dB
  5 transitions audio bridges (whooshes that cross the picture cut)

Everything is placed on absolute frames taken from timeline.json, so every
sound is on the action rather than near it.

    python mix_v4.py
"""
from __future__ import annotations
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(ROOT, "public", "wow", "audio")
SR = 48000
FPS = 30


def run(cmd, label=""):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("failed %s: %s" % (label, r.stderr[-900:]))
    return r


def main():
    tl = json.load(open(os.path.join(ROOT, "src", "wow", "timeline.json")))
    c = tl["cues"]
    total = tl["total"]
    secs = total / FPS

    # ---- SFX cue sheet: (file, frame, gain)
    S = lambda n: os.path.join(A, "sfx", n)
    cue = [
        # the hook — the sound has to arrive with the first frame
        (S("impact_deep.wav"), 0, 0.95),
        (S("riser.wav"), 0, 0.55),
        (S("whoosh_up.wav"), 28, 0.5),
        (S("tape.wav"), 40, 0.35),
        # the number
        (S("click_low.wav"), c["number"] - 24, 0.5),
        (S("static.wav"), c["number"] - 6, 0.45),
        (S("stinger.wav"), c["number"], 0.6),
        (S("impact.wav"), c["hydrogen"], 0.5),
        # the six characters, one tick each
        (S("click.wav"), c["six"], 0.55),
        (S("click.wav"), c["six"] + 8, 0.5),
        (S("click.wav"), c["six"] + 16, 0.45),
        (S("click.wav"), c["six"] + 24, 0.45),
        (S("click.wav"), c["six"] + 32, 0.4),
        (S("printer.wav"), c["six"] - 18, 0.35),
        # the margin
        (S("paper.wav"), c["wow"] - 30, 0.5),
        (S("static.wav"), c["wow"] - 4, 0.3),
        (S("impact.wav"), c["wow"], 0.85),
        # the search — a clock that keeps ticking
        (S("click.wav"), c["fifty"], 0.35),
        (S("whoosh_down.wav"), c["fifty"] + 40, 0.35),
        # 2024 candidate
        (S("riser.wav"), c["candidate"] - 60, 0.4),
        (S("whoosh_up.wav"), c["candidate"], 0.5),
        (S("tape.wav"), c["notproven"], 0.3),
        # the point
        (S("impact_deep.wav"), c["alone"], 0.7),
        (S("subdrop.wav"), c["alone"] + 10, 0.5),
        # the close
        (S("impact_deep.wav"), c["silence"] - 6, 0.9),
    ]
    # a whoosh on every picture cut, quieter than the designed hits
    for s in tl["scenes"][1:]:
        cue.append((S("whoosh_up.wav" if s["cut"] > 0 else "whoosh_down.wav"),
                    s["from"] - 8, 0.20))

    vo = os.path.join(ROOT, "audio", "wow", "vo4", "take.wav")
    music = os.path.join(A, "music.wav")
    room = os.path.join(A, "roomtone.wav")

    n = len(cue)
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-i", vo, "-i", music, "-i", room]
    for path, _, _ in cue:
        cmd += ["-i", path]

    f = []
    # 1 dialogue: gentle consant compression, high-passed, slightly brightened
    f.append("[0:a]highpass=f=80,"
             "acompressor=threshold=-18dB:ratio=2.6:attack=8:release=160:makeup=2,"
             "equalizer=f=3200:t=q:w=1.2:g=1.5,"
             "equalizer=f=250:t=q:w=1.0:g=-1.2,"
             "volume=1.0[vo]")
    # 2 ambience bed
    f.append("[2:a]volume=0.55[amb]")
    # 3 sfx
    for j, (_, fr, g) in enumerate(cue):
        ms = int(round(fr / FPS * 1000))
        f.append("[%d:a]adelay=%d|%d,volume=%s[x%d]" % (3 + j, ms, ms, g, j))
    sfx_in = "".join("[x%d]" % j for j in range(n))
    f.append("%svolume=1.0[sfx]" % ("%samix=inputs=%d:normalize=0:duration=longest," % (sfx_in, n)))

    # 4 music sidechained to the voice: the score steps back when he speaks
    f.append("[1:a]volume=0.42[mus]")
    f.append("[mus][vo]sidechaincompress=threshold=0.035:ratio=6:attack=15:release=420:"
             "makeup=1[musd]")

    # 5 sum + master
    f.append("[vo][amb][sfx][musd]amix=inputs=4:normalize=0:duration=longest,"
             "alimiter=level_in=1:level_out=1:limit=0.85:attack=5:release=80,"
             "afade=t=out:st=%.2f:d=1.4[mix]" % max(0, secs - 1.5))

    cmd += ["-filter_complex", ";".join(f), "-map", "[mix]",
            "-t", "%.3f" % secs, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le",
            os.path.join(ROOT, "public", "wow_mix_v4.wav")]
    print("mixing %d sfx cues ..." % n, flush=True)
    run(cmd, "mix")

    # two-pass loudnorm: measure, then correct. One pass always undershoots.
    probe = run(["ffmpeg", "-hide_banner", "-i", os.path.join(ROOT, "public", "wow_mix_v4.wav"),
                 "-af", "loudnorm=I=-14:TP=-3.0:LRA=9:print_format=json", "-f", "null", "-"],
                "probe").stderr
    js = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
    ln = ("loudnorm=I=-14:TP=-3.0:LRA=9:measured_I=%s:measured_TP=%s:"
          "measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true" %
          (js["input_i"], js["input_tp"], js["input_lra"], js["input_thresh"], js["target_offset"]))
    run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "public", "wow_mix_v4.wav"),
         "-af", ln, "-ar", str(SR), "-ac", "2",
         "-c:a", "pcm_s16le", os.path.join(ROOT, "public", "wow_mix_v4_norm.wav")], "norm")
    run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "public", "wow_mix_v4_norm.wav"),
         "-c:a", "libmp3lame", "-b:a", "320k",
         os.path.join(ROOT, "public", "wow_mix_v4_norm.mp3")], "mp3")

    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i",
               os.path.join(ROOT, "public", "wow_mix_v4_norm.wav"),
               "-af", "ebur128=peak=true", "-f", "null", "-"], "measure").stderr
    for line in out.splitlines():
        if "I:" in line or "Peak:" in line or "LRA:" in line:
            print(line.strip())


if __name__ == "__main__":
    main()
