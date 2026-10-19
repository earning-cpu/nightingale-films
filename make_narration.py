#!/usr/bin/env python3
"""PROJECT NIGHTINGALE — narration generator.
edge-tts per segment -> word-boundary timestamps -> src/narration.json + audio/vo/*.wav
Word frames are ABSOLUTE (30fps film timeline) and drive: captions + zoom cues + SFX ducking.
"""
import asyncio, json, os, subprocess
import edge_tts

VOICE = "en-US-ChristopherNeural"   # deep documentary
RATE = "-6%"                        # deliberate trailer pace
FPS = 30.0

# seg -> (start_frame_absolute, text, zoom_words)
SCRIPT = {
    "title": (6,    "In nineteen forty seven, the desert kept a secret.",            ["desert", "secret"]),
    "s1":    (146,  "A silent craft comes down on Highway three seventy five.",      ["craft", "highway"]),
    "s2":    (330,  "Checkpoint Zulu. Security level four. They have orders to shoot.", ["checkpoint", "shoot"]),
    "s3":    (495,  "Hangar six. And the fragment is not ours. It never was.",       ["fragment", "hangar"]),
    "s4":    (705,  "Then, a signal. One point seven gigahertz. Repeating, for seventy nine years.", ["signal", "gigahertz"]),
    "s5":    (885,  "The lab finds no welds. No seams. The metal runs hot by itself.", ["metal", "lab"]),
    "s6":    (1065, "Then it wakes. It puts itself back together. Every single night.", ["wakes", "together"]),
    "s7":    (1258, "Eleven seconds of blackout. And a beam you can see from space.", ["beam", "blackout"]),
    "s8":    (1440, "Every watch in the building loses the same eleven minutes.",    ["watch", "minutes"]),
    "s9":    (1605, "By morning, the desert is clean. Too clean.",                   ["desert", "clean"]),
    "s10":   (1785, "They classified everything. But someone kept a copy.",          ["classified", "copy"]),
    "end":   (1993, "Read it before they do.",                                       ["read"]),
}

async def gen(seg, start, text):
    os.makedirs("audio/vo", exist_ok=True)
    mp3 = f"audio/vo/{seg}.mp3"
    wav = f"audio/vo/{seg}.wav"
    com = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                t = ch["offset"] / 1e7          # seconds from clip start
                d = ch["duration"] / 1e7
                words.append({
                    "w": ch["text"],
                    "f": round(start + t * FPS),
                    "d": max(1, round(d * FPS)),
                })
    # mp3 -> wav 48k stereo (pipeline rate)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3,
                    "-ar", "48000", "-ac", "2", wav], check=True)
    return seg, {"start": start, "text": text, "words": words}

async def main():
    out = {}
    for seg, (start, text, zooms) in SCRIPT.items():
        seg, data = await gen(seg, start, text)
        data["zoom_words"] = zooms
        out[seg] = data
        print(f"{seg:6s} start={start:4d} words={len(data['words']):3d} "
              f"last_word_f={data['words'][-1]['f'] if data['words'] else '-'}")
    json.dump(out, open("src/narration.json", "w"), indent=1)
    print("wrote src/narration.json")

asyncio.run(main())
