#!/usr/bin/env python3
"""make_wow_v4.py — "72 SECONDS" v4.

Three structural changes over v3:

1. ONE TAKE OF NARRATION.
   v3 synthesised each line separately, so every scene began with a fresh
   breath and ended with a pad of silence. That is why the voice sounded like
   it stopped after every caption. v4 sends the whole script to TTS once, so
   the only pauses are the ones the punctuation asks for, and the voice carries
   straight through picture cuts — which is what a J-cut / L-cut actually is.

2. A SCORE, NOT BACKGROUND NOISE.
   tools/synth_score.py composes a D-minor cue at 100 BPM (one beat = exactly
   18 frames) in three acts, with an ostinato, braams, taiko and a bar of
   near-silence before the last line.

3. PICTURE CUTS ON THE WORD, DELIBERATELY.
   Every scene boundary is a word index. The picture may cut up to 6 frames
   before or after that word, which turns each cut into a J-cut or an L-cut
   instead of a hard butt-join.

    python make_wow_v4.py
"""
from __future__ import annotations
import asyncio, json, os, re, subprocess, sys

import numpy as np

import edge_tts

ROOT = os.path.dirname(os.path.abspath(__file__))
VOICE = "en-US-ChristopherNeural"
RATE = "+4%"
FPS = 30
WOW = os.path.join(ROOT, "audio", "wow")
OUT = os.path.join(ROOT, "src", "wow")

# ---------------------------------------------------------------- the script
# One string. Sentence breaks only where the read should breathe.
SCRIPT = (
    "Nineteen seventy seven. Something called out. "
    "Seventy two seconds of it. Then nothing, ever again. "
    "A radio telescope in Ohio. It could not steer. "
    "The Earth turned, and dragged the sky across its beam. "
    "For seventy two seconds, something was inside it. "
    "August fifteenth. Ten sixteen at night. "
    "One man on the night shift, and a printer. "
    "Paper came out of the machine. Six characters. "
    "One thousand four hundred twenty point four five five six megahertz. "
    "The hydrogen line. The frequency of cold gas. "
    "Six. E. Q. U. J. Five. Thirty times above the noise. "
    "He circled it in red, and wrote one word in the margin. Wow. "
    "They looked again. And again. For fifty years. Nothing. Not one repeat. "
    "Then in twenty twenty four, a candidate. "
    "A magnetar flare, hitting a cold cloud of hydrogen. "
    "A natural laser. Not a voice. "
    "It is still not proven. That is the problem. "
    "The best evidence that we are not alone, and the best evidence that we are. "
    "Seventy two seconds. Fifty years of silence."
)

L = lambda p, move, **k: ("layer", p, move, k)
I = lambda p, move, **k: ("img", p, move, k)

# id, first word index, shots, cut offset (frames; negative = picture leads
# the word = L-cut, positive = picture trails the word = J-cut)
SCENES = [
    ("hook",   0, [I("wow/img/c_10.png", "push-in", b=1.12, sep=0),
                   L("wow/img/c_01.png", "push-in", b=1.12),
                   I("wow/img/d_01.png", "push-in", b=1.05, sep=0)], -4),
    ("hook2",  9, [I("wow/img/d_04.png", "tilt-up", b=1.05, sep=0),
                   I("wow/img/d_10.png", "push-in", b=1.15, sep=0),
                   I("wow/img/d_13.png", "drift-left", b=0.9, sep=0)], +3),
    ("a",     15, [L("wow/img/c_09.png", "tilt-up", b=1.0),
                   I("wow/img/d_07.png", "push-in", b=1.0, sep=0)], -3),
    ("b",     22, [I("wow/img/b_07.png", "drift-left", b=1.0, sep=0),
                   L("wow/img/b_01.png", "drift-right", b=1.0),
                   I("wow/img/d_05.png", "push-in", b=1.0, sep=0)], +4),
    ("c",     34, [L("wow/img/c_01.png", "push-in", b=1.0),
                   I("wow/img/c_10.png", "rack", b=1.0, sep=0)], -5),
    ("d",     42, [I("wow/img/c_07.png", "push-in", b=1.0, sep=0),
                   I("wow/img/b_04.png", "drift-right", b=1.0, sep=0),
                   I("wow/img/c_03.png", "pull-out", b=1.0, sep=0)], +3),
    ("e",     50, [L("wow/img/c_02.png", "push-in", b=1.0),
                   I("wow/img/c_14.png", "pull-out", b=1.0, sep=0)], -4),
    ("f",     58, [L("wow/img/b_06.png", "pull-out", b=1.0, sat=0.5),
                   I("wow/img/c_12.png", "drift-left", b=1.0, sep=0)], +2),
    ("g",     64, [I("wow/img/d_09.png", "drift-right", b=0.9, sep=0),
                   I("wow/img/c_05.png", "drift-left", b=0.9, sep=0)], -3),
    ("h",     76, [L("wow/img/d_04.png", "push-in", b=1.0),
                   I("wow/img/b_11.png", "tilt-up", b=1.0, sep=0)], +4),
    ("i",     84, [I("wow/img/c_12.png", "pull-out", b=0.8, sep=0),
                   I("wow/img/d_01.png", "push-in", b=0.75, sep=0)], -4),
    ("j",     95, [I("wow/img/d_03.png", "push-in", b=0.85, sep=0),
                   I("wow/img/c_04.png", "rack", b=0.55)], +2),
    ("k",    105, [I("wow/img/c_06.png", "push-in", b=1.0, sep=0),
                   I("wow/img/d_15.png", "drift-left", b=1.0, sep=0),
                   I("wow/img/d_02.png", "pull-out", b=1.0, sep=0)], -3),
    ("l",    116, [I("wow/img/d_06.png", "drift-right", b=1.0, sep=0),
                   I("wow/img/c_13.png", "push-in", b=0.72, sep=0)], +3),
    ("m",    125, [I("wow/img/c_15.png", "push-in", b=1.0, sep=0),
                   I("wow/img/c_11.png", "drift-right", b=1.0, sep=0)], -4),
    ("n",    134, [I("wow/img/d_05.png", "push-in", b=1.0, sep=0),
                   I("wow/img/d_14.png", "push-in", b=1.0, sep=0, sat=0.05)], +3),
    ("o",    143, [I("wow/img/d_11.png", "push-in", b=0.62, sep=0),
                   I("wow/img/c_08.png", "pull-out", b=1.0, sep=0)], -3),
    ("p",    151, [L("wow/img/c_02.png", "push-in", b=1.0),
                   I("wow/img/d_13.png", "push-in", b=1.0, sep=0)], +4),
    ("q",    160, [L("wow/img/c_01.png", "push-in", b=1.0),
                   I("wow/img/d_12.png", "drift-left", b=1.0, sep=0),
                   I("wow/img/c_03.png", "push-in", b=1.0, sep=0)], -4),
    ("r",    173, [I("wow/img/b_11.png", "tilt-down", b=1.0, sep=0),
                   L("wow/img/d_04.png", "pull-out", b=1.0)], +2),
]

SLUG = {
    "hook": "15 AUG 1977", "hook2": "72 SECONDS", "a": "DELAWARE, OHIO",
    "b": "DRIFT SCAN", "c": "THE BEAM", "d": "22:16 EST", "e": "NIGHT SHIFT",
    "f": "PRINTOUT", "g": "RECEIVER B", "h": "HYDROGEN LINE", "i": "CHANNEL 2",
    "j": "THE MARGIN", "k": "THE SEARCH", "l": "NO REPEAT", "m": "2024",
    "n": "CANDIDATE", "o": "NATURAL MASER", "p": "UNPROVEN", "q": "EITHER WAY",
    "r": "72 SECONDS",
}



def tighten(wav_path, max_gap=0.50, floor_db=-30.0):
    """Edge TTS puts a full second of digital silence after every sentence.
    Left alone, the read sounds like dictation no matter how good the words
    are — this is the actual cause of "pauses after every caption". Every
    internal gap longer than `max_gap` is shortened to `max_gap`, and the word
    timings are remapped so captions and cuts stay on the syllable.
    """
    import wave
    w = wave.open(wav_path, "rb")
    sr, n = w.getframerate(), w.getnframes()
    a = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768.0
    w.close()
    win = int(0.02 * sr)
    m = len(a) // win
    rms = np.sqrt((a[:m * win].reshape(m, win) ** 2).mean(1))
    db = 20 * np.log10(rms + 1e-9)
    speech = db > (db.max() + floor_db)
    idx = np.where(speech)[0]
    if len(idx) < 2:
        return 0.0, []
    keep, cuts, i = [], [], idx[0]
    while i <= idx[-1]:
        if speech[i]:
            keep.append(i); i += 1; continue
        j = i
        while j <= idx[-1] and not speech[j]:
            j += 1
        gap = (j - i) * 0.02
        need = max(2, int(round(max_gap / 0.02))) if gap > max_gap else (j - i)
        for k in range(need):
            keep.append(i + k)
        if gap > max_gap:
            cuts.append((i * 0.02, gap - need * 0.02))
        i = j
    keep = np.array(sorted(set(keep)))
    out = np.concatenate([a[k * win:(k + 1) * win] for k in keep])
    ww = wave.open(wav_path, "wb")
    ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(sr)
    ww.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
    ww.close()
    return len(a) / sr - len(out) / sr, cuts


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("failed: %s\n%s" % (" ".join(cmd[:6]), r.stderr[-800:]))


def dur(p):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", p], text=True).strip())


async def one_take(text, mp3, tries=5):
    last = None
    for attempt in range(tries):
        rate = RATE if attempt < tries - 2 else "-2%"
        try:
            c = edge_tts.Communicate(text, VOICE, rate=rate, boundary="WordBoundary")
            words, n = [], 0
            with open(mp3, "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"]); n += len(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append({"w": ch["text"],
                                      "f": int(round(ch["offset"] / 1e7 * FPS))})
            if n > 200_000 and len(words) > 100:
                return words
            last = "short take (%d bytes, %d words)" % (n, len(words))
        except Exception as e:                                  # noqa: BLE001
            last = repr(e)
        await asyncio.sleep(2 + attempt * 2)
    raise SystemExit("TTS failed: %s" % last)


def main():
    os.makedirs(os.path.join(WOW, "vo4"), exist_ok=True)
    mp3 = os.path.join(WOW, "vo4", "take.mp3")
    wav = os.path.join(WOW, "vo4", "take.wav")
    print("synthesising one take ...", flush=True)
    words = asyncio.run(one_take(SCRIPT, mp3))
    run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ar", "48000", "-ac", "1",
         "-c:a", "pcm_s16le", wav])
    removed, cuts = tighten(wav)
    if cuts:
        print("tightened: %d gaps, %.2fs of dead air removed" % (len(cuts), removed))
        def shift(t):
            return t - sum(d for at, d in cuts if at < t)
        for w_ in words:
            w_["f"] = int(round(shift(w_["f"] / FPS) * FPS))
    total_s = dur(wav)
    total = int(round(total_s * FPS))
    print("narration: %d words, %.2f s, %d frames" % (len(words), total_s, total))

    # ---- scene boundaries from word indices, with J/L-cut offsets
    starts = []
    for sid, widx, shots, off in SCENES:
        if widx >= len(words):
            widx = len(words) - 1
        starts.append(max(0, words[widx]["f"] + off))
    # the picture runs past the last word: an end card needs air, and the score
    # needs somewhere to land its final hit
    tail = 78
    starts.append(total + tail)
    total += tail

    scenes = []
    for i, (sid, widx, shots, off) in enumerate(SCENES):
        a, b = starts[i], starts[i + 1]
        dur_f = max(30, b - a)
        # 30 frames = 1.00 s. A shot shorter than that is a flicker, not a shot.
        while len(shots) > 1 and dur_f < len(shots) * 32:
            shots = shots[:-1]
        n = len(shots)
        w = {1: [1.0], 2: [0.54, 0.46], 3: [0.42, 0.33, 0.25]}[n]
        bounds, s0 = [], 0
        for k, wk in enumerate(w):
            ln = max(30, int(dur_f * wk))
            bounds.append((s0, ln)); s0 += ln
        bounds[-1] = (bounds[-1][0], dur_f - bounds[-1][0])
        lo = words[widx]["f"] if widx < len(words) else a
        hi = words[min(len(words) - 1, starts[i + 1] and widx)] if False else None
        scenes.append({
            "id": sid, "from": a, "dur": dur_f, "slug": SLUG[sid], "cut": off,
            "kind": ("L-cut" if off < 0 else "J-cut" if off > 0 else "butt"),
            "words": [w for w in words if a - 14 <= w["f"] < b + 14],
            "shots": [{"kind": sh[0], "src": sh[1], "move": sh[2], **sh[3],
                       "from": a + bounds[k][0], "dur": bounds[k][1]}
                      for k, sh in enumerate(shots)],
        })

    # ---- captions: 3 words at a time, straight off the take
    # captions respect sentence ends: a group never straddles a full stop,
    # because a caption that runs "candidate A magnetar" reads like a typo
    import re as _re
    sents = [x.split() for x in _re.split(r"(?<=[.!?])\s+", SCRIPT.strip()) if x.split()]
    caps, idx = [], 0
    for sent in sents:
        i = 0
        while i < len(sent):
            n = min(3, len(sent) - i)
            grp = words[idx:idx + n] or words[-1:]
            caps.append({"f0": grp[0]["f"], "f1": grp[-1]["f"],
                         "w": [w["w"] for w in grp]})
            idx += n
            i += n

    cues = {}
    def find(rx, default, nth=1):
        hits = [w["f"] for w in words if re.search(rx, w["w"], re.I)]
        return hits[nth - 1] if len(hits) >= nth else default
    cues["number"] = find(r"thousand", 60)
    cues["hydrogen"] = find(r"hydrogen", 70)
    cues["six"] = find(r"^Six$", 80, nth=3)  # the letters, not "six characters"
    cues["wow"] = find(r"wrote", 90)
    cues["fifty"] = find(r"fifty", 100)
    cues["candidate"] = find(r"candidate", 110)
    cues["notproven"] = find(r"proven", 120)
    cues["silence"] = find(r"silence", 130)
    cues["alone"] = find(r"alone", 125)  # "not alone" — the either/or

    # ---- colour correction before the grade: every plate is measured and
    # normalised toward one exposure, so a bright parchment is not blown out
    # next to a dark room. This is the "match shots" step editors do first.
    try:
        from PIL import Image
        import numpy as np
        cache = {}
        def luma(path):
            if path not in cache:
                im = Image.open(os.path.join(ROOT, "public", path)).convert("L")
                im.thumbnail((160, 160))
                cache[path] = float(np.median(np.asarray(im)))
            return cache[path]
        TARGET = 30.0
        for sc in scenes:
            for sh in sc["shots"]:
                src = sh["src"]
                try:
                    m = luma(src)
                except Exception:
                    continue
                b = TARGET / max(18.0, m)
                b = max(0.72, min(1.30, b))
                sh["b"] = round(b, 3)
                sh["luma"] = round(m, 1)
    except Exception as e:                                          # noqa: BLE001
        print("  (colour correction skipped: %r)" % e)

    missing = []
    for sc in scenes:
        for sh in sc["shots"]:
            if not os.path.exists(os.path.join(ROOT, "public", sh["src"])):
                missing.append(sh["src"])
    if missing:
        raise SystemExit("MISSING PLATES: %s" % sorted(set(missing)))

    tl = {"fps": FPS, "total": total, "scenes": scenes, "words": words,
          "captions": caps, "cues": cues, "script": SCRIPT}
    json.dump(tl, open(os.path.join(OUT, "timeline.json"), "w"), indent=1)
    for s in scenes:
        print("  %-6s %4d-%-4d %5.2fs  %-6s %-40s %s" %
              (s["id"], s["from"], s["from"] + s["dur"], s["dur"] / FPS,
               s["kind"], [q["dur"] for q in s["shots"]],
               " ".join("%s/%.2f" % (q["src"].split("/")[-1][:-4], q["b"]) for q in s["shots"])))
    print("\n%d scenes, %d shots, %.1f s, ASL %.2f s"
          % (len(scenes), sum(len(s["shots"]) for s in scenes), total / FPS,
             total / FPS / sum(len(s["shots"]) for s in scenes)))


if __name__ == "__main__":
    main()
