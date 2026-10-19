#!/usr/bin/env python3
"""PROJECT NIGHTINGALE — dense vision audit.

Samples the video at N frames per second (default 4 fps = ~280 frames for a
70 s film), then answers the questions a human reviewer would ask:

  1. SHOT LIST      — exact in/out + duration of every shot (PySceneDetect)
  2. TOO SHORT      — any shot under 1.0 s
  3. REPEATED IMAGES— perceptual-hash clusters: the same picture used twice
  4. DEAD GRAPHICS  — graphics already fully placed at the shot's first frame
  5. GRAPHIC <1s    — animation windows visible for less than 1 s
  6. CONTACT SHEETS — labelled 4 fps grids to review visually

Usage: python3 vision_audit.py VIDEO.mp4 [--fps 4] [--sheets 6]
"""
import subprocess, sys, os, json, argparse
import numpy as np
import cv2
import imagehash
from PIL import Image, ImageDraw
from scenedetect import open_video, SceneManager
from scenedetect.detectors import ContentDetector

FPS = 30.0
SCENE_START = dict(title=0, s1=140, s2=320, s3=485, s4=695, s5=875, s6=1055, s7=1250,
                   s8=1430, s9=1595, s10=1775, end=1985)


def parse():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=4.0)
    ap.add_argument("--sheets", type=int, default=6)
    ap.add_argument("--min-shot", type=float, default=1.0)
    return ap.parse_args()


def shot_list(path):
    video = open_video(path)
    sm = SceneManager()
    sm.add_detector(ContentDetector(threshold=32, min_scene_len=15))
    sm.detect_scenes(video, show_progress=False)
    scenes = sm.get_scene_list()
    out = []
    for i, (a, b) in enumerate(scenes):
        s, e = a.get_frames(), b.get_frames()
        out.append({"i": i, "start": s, "end": max(s, e - 1), "frames": max(1, e - s),
                    "sec": round(max(1, e - s) / FPS, 2)})
    return out


def sample_frames(path, rate):
    """Decode every frame at `rate` fps into RGB arrays + their frame numbers."""
    step = max(1, int(round(FPS / rate)))
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vf", f"select='not(mod(n\\,{step}))'",
           "-vsync", "0", "-pix_fmt", "rgb24", "-f", "rawvideo", "-s", "480x270", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = 480 * 270 * 3
    frames, idx = [], 0
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        frames.append(np.frombuffer(b, dtype=np.uint8).reshape(270, 480, 3))
        idx += 1
    p.wait()
    return frames, step


def phash_of(rgb):
    im = Image.fromarray(rgb).convert("L").resize((32, 32), Image.LANCZOS)
    return imagehash.phash(im, hash_size=8)


def edge_energy(rgb):
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    return float(cv2.Laplacian(g, cv2.CV_32F).var())


def lower_third_edges(rgb):
    """Edge density in the caption / KPI band — proxy for 'graphics on screen'."""
    h = rgb.shape[0]
    band = rgb[int(h * 0.55):, :, :]
    g = cv2.cvtColor(band, cv2.COLOR_RGB2GRAY)
    return float(cv2.Laplacian(g, cv2.CV_32F).var())


def main():
    a = parse()
    print(f"VISION AUDIT — {a.video} @ {a.fps} fps")
    shots = shot_list(a.video)
    frames, step = sample_frames(a.video, a.fps)
    print(f"  sampled {len(frames)} frames (1 every {step} frames = {step/FPS:.2f}s)")
    print(f"  shots detected: {len(shots)}")

    # ---------- 3. repeated images (across shots) ----------
    mids = []
    for s in shots:
        k = min(len(frames) - 1, max(0, (s["start"] + s["end"]) // 2 // step))
        mids.append(phash_of(frames[k]))
    repeats = []
    for i in range(len(shots)):
        for j in range(i + 1, len(shots)):
            d = mids[i] - mids[j]
            if d <= 6:  # very similar picture
                repeats.append({"a": shots[i], "b": shots[j], "hash_distance": int(d)})

    # ---------- 2. too-short shots ----------
    short = [s for s in shots if s["sec"] < a.min_shot]

    # ---------- 4. graphics already placed at shot start ----------
    dead = []
    for s in shots:
        if s["frames"] < 20:
            continue
        i0 = s["start"] // step
        i1 = min(len(frames) - 1, (s["start"] + 6) // step)
        i2 = min(len(frames) - 1, (s["start"] + 25) // step)
        if i1 >= len(frames) or i2 >= len(frames):
            continue
        start_e = lower_third_edges(frames[i1])
        later_e = lower_third_edges(frames[i2])
        if later_e > 40 and start_e > later_e * 0.85:
            dead.append({"shot": s["i"], "start": s["start"], "start_edges": round(start_e, 1),
                         "later_edges": round(later_e, 1)})

    # ---------- 5. animation windows visible < 1 s / truncated ----------
    # Screen life = from when the animation STARTS until the next cut or the next
    # full-screen insert hides it. (Measuring the entrance animation alone is
    # meaningless: a 0.5 s fade-in that stays 3 s is perfectly fine.)
    tiny = []
    if os.path.exists("qa_windows.json"):
        wins = json.load(open("qa_windows.json"))
        insert_starts = []
        try:
            import re as _re
            _src = open("src/Nightingale.tsx").read()
            for _m in _re.finditer(r'<InsertShot[^>]*from=\{T\.(\w+)\.from \+ (\d+)\}', _src):
                insert_starts.append(SCENE_START.get(_m.group(1), 0) + int(_m.group(2)))
        except Exception:
            pass
        for w in wins:
            end = None
            for s in shots:
                if s["start"] <= w["start"] <= s["end"]:
                    end = s["end"]
                    break
            if end is None:
                continue
            for ins in insert_starts:
                if w["start"] < ins < end:
                    end = ins
            life = end - w["start"]
            if 0 < life < 30:
                tiny.append({"name": w["name"], "window": [w["start"], w["end"]],
                             "screen_life_frames": life, "screen_life_sec": round(life / FPS, 2)})

    # ---------- contact sheets ----------
    os.makedirs("vision", exist_ok=True)
    per = max(1, int(np.ceil(len(frames) / a.sheets)))
    cols, tw, th = 5, 384, 216
    sheets = []
    for si in range(0, len(frames), per):
        chunk = list(range(si, min(len(frames), si + per)))
        rows = int(np.ceil(len(chunk) / cols))
        sheet = Image.new("RGB", (tw * cols, th * rows), "black")
        d = ImageDraw.Draw(sheet)
        for k, fi in enumerate(chunk):
            im = Image.fromarray(frames[fi]).resize((tw, th))
            x, y = (k % cols) * tw, (k // cols) * th
            sheet.paste(im, (x, y))
            d.rectangle([x + 3, y + 3, x + 104, y + 22], fill="black")
            d.text((x + 7, y + 6), f"{(fi*step)/FPS:.2f}s", fill="yellow")
        fn = f"vision/sheet_{si//per + 1}.jpg"
        sheet.save(fn, quality=82)
        sheets.append(fn)

    report = {"file": os.path.basename(a.video), "sampled_fps": a.fps,
              "frames_sampled": len(frames), "shots": shots,
              "short_shots": short, "repeated_images": repeats,
              "graphics_already_placed": dead,
              "graphics_under_1s": tiny, "contact_sheets": sheets}
    out = os.path.splitext(a.video)[0] + "_vision.json"
    json.dump(report, open(out, "w"), indent=1)

    print("\n  SHOT LIST")
    for s in shots:
        flag = "  ← UNDER 1s" if s["sec"] < a.min_shot else ""
        print(f"    {s['i']:2d}  {s['start']:5d}-{s['end']:5d}  {s['sec']:5.2f}s{flag}")
    print(f"\n  shots under {a.min_shot}s : {len(short)}")
    print(f"  repeated images        : {len(repeats)}")
    for r in repeats:
        print(f"    shot {r['a']['i']} ({r['a']['start']}-{r['a']['end']}) ~ shot "
              f"{r['b']['i']} ({r['b']['start']}-{r['b']['end']})  d={r['hash_distance']}")
    print(f"  graphics already on screen at cut (informational): {len(dead)}")
    for x in dead:
        print(f"    shot {x['shot']} @ {x['start']}: edges {x['start_edges']} vs later {x['later_edges']}")
    print(f"  graphics on screen < 1s : {len(tiny)}")
    for t in tiny:
        print(f"    {t['name']}: {t['screen_life_frames']}f ({t['screen_life_sec']}s)")
    print(f"\n  contact sheets: {', '.join(sheets)}")
    print(f"  report -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
