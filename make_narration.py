#!/usr/bin/env python3
"""PROJECT NIGHTINGALE — narration generator v2.
- Measures every segment's real duration from edge-tts word boundaries.
- AUTO-FITS each line into its scene window (speeds the rate up if needed)
  so NO two lines can ever overlap (fixes the "two voices" bug).
- Writes src/narration.json (absolute word frames) + audio/vo/*.wav
"""
import asyncio, json, os, subprocess, glob
import edge_tts

VOICE = "en-US-ChristopherNeural"
RATES = ["-6%", "-2%", "+4%", "+10%", "+16%"]   # try slow first, speed up only if it must fit
FPS = 30.0

# seg: (scene_start, scene_end_exclusive, text, zoom_words)
SCRIPT = {
    "title": (6,    140, "Nineteen forty seven. The desert kept a secret.", "desert secret"),
    "s1":    (146,  320, "A silent craft comes down on Highway three seventy five.", "craft highway"),
    "s2":    (330,  485, "Checkpoint Zulu. Level four. Orders to shoot.", "checkpoint shoot"),
    "s3":    (494,  695, "Hangar six. And the fragment is not ours. It never was.", "fragment hangar"),
    "s4":    (704,  875, "Then a signal. One point seven gigahertz. Repeating.", "signal gigahertz"),
    "s5":    (884,  1055, "No welds. No seams. The metal runs hot.", "metal"),
    "s6":    (1064, 1250, "Then it wakes. It puts itself back together. Every night.", "wakes together"),
    "s7":    (1258, 1430, "Eleven seconds of blackout. And a beam visible from space.", "blackout beam"),
    "s8":    (1440, 1595, "Every watch in the building loses the same eleven minutes.", "watch minutes"),
    "s9":    (1605, 1775, "By morning, the desert is clean. Too clean.", "desert clean"),
    "s10":   (1786, 1985, "They classified everything. But someone kept a copy.", "classified copy"),
    "end":   (1994, 2082, "Read it before they do.", "read"),
}
GAP = 10   # frames of air required after a line before the next scene's line may start


async def synth(text, rate, mp3, wav):
    com = edge_tts.Communicate(text, VOICE, rate=rate, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"w": ch["text"],
                              "t": ch["offset"] / 1e7,
                              "d": max(1, round(ch["duration"] / 1e7 * FPS))})
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3,
                    "-ar", "48000", "-ac", "2", wav], check=True)
    return words


async def main():
    for f in glob.glob("audio/vo/*"):
        os.remove(f)
    os.makedirs("audio/vo", exist_ok=True)
    out, prev_end = {}, -999
    for seg, (s_start, s_end, text, zooms) in SCRIPT.items():
        start = max(s_start, prev_end + GAP)
        chosen = None
        for rate in RATES:
            words = await synth(text, rate, f"audio/vo/{seg}.mp3", f"audio/vo/{seg}.wav")
            first, last = words[0]["t"], words[-1]["t"] + words[-1]["d"] / FPS
            dur_f = round(last * FPS)
            if start + dur_f <= s_end - 4 and start >= s_start:
                chosen = (rate, words, dur_f)
                break
        if not chosen:
            rate, words, dur_f = rate, words, round((words[-1]["t"] + words[-1]["d"] / FPS) * FPS)
            chosen = (rate, words, dur_f)
            print(f"  !! {seg} still tight: needs {dur_f}f window {s_end-start}f")
        rate, words, dur_f = chosen
        absw = [{"w": w["w"], "f": round(start + w["t"] * FPS), "d": w["d"]} for w in words]
        out[seg] = {"start": start, "text": text, "rate": rate,
                    "words": absw, "zoom_words": zooms.split()}
        prev_end = start + dur_f
        print(f"{seg:6s} start={start:4d} end={prev_end:4d} ({rate:>4s}) "
              f"words={len(words):2d}  next_window={SCRIPT.get(list(SCRIPT)[list(SCRIPT).index(seg)+1], (9999,))[0] if seg != 'end' else '-'}")
    json.dump(out, open("src/narration.json", "w"), indent=1)
    # hard verification: zero overlap
    segs = list(out.values())
    bad = 0
    for a, b in zip(segs, segs[1:]):
        a_end = a["words"][-1]["f"] + a["words"][-1]["d"]
        if a_end > b["start"]:
            print(f"OVERLAP {a_end} > {b['start']}"); bad += 1
    print(f"\nOVERLAP CHECK: {'PASS - no overlaps' if bad == 0 else f'FAIL ({bad})'}")
    print("wrote src/narration.json")

asyncio.run(main())
