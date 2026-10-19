#!/usr/bin/env python3
"""PROJECT NIGHTINGALE — frame-by-frame video QA.

Detects, without watching:
  1. hard cuts (shot boundaries)
  2. FROZEN runs (identical consecutive frames = stalled render)
  3. dead-black / blown-white frames
  4. A->B->A "return" patterns  (the "image repeats later" glitch)
  5. cuts that land INSIDE an in-flight animation (odd keyframe jumps)
     -> checked against qa_windows.json (every text/stamp/graphic animation window)
  6. container / stream / loudness health via ffprobe + astats

Usage: python3 qa_video.py VIDEO.mp4 [--json qa_report.json]
Exit code 1 if any blocking issue is found.
"""
import subprocess, sys, json, os
import numpy as np

W, H, FPS = 192, 108, 30.0
FROZEN_MIN = 5          # consecutive identical frames to call it frozen
CUT_HIST = 0.20         # histogram L1 distance for a shot change (soft, catches fades)
CUT_MOTION = 0.030      # mean abs pixel delta for a shot change
SCENE_CUTS = [0, 140, 320, 485, 695, 875, 1055, 1250, 1430, 1595, 1775, 1985, 2090]
DEDUPE = 5              # merge detections this close into one transition
RETURN_WINDOW = 300     # frames (10 s) to look for an A->B->A return
ANIM_MARGIN = 6         # frames of grace around animation windows


def decode(path):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}",
           "-pix_fmt", "rgb24", "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    out = []
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        out.append(np.frombuffer(b, dtype=np.uint8).reshape(H, W, 3))
    p.wait()
    return out


def hist(f):
    h = []
    for c in range(3):
        v = np.histogram(f[:, :, c], bins=16, range=(0, 256))[0].astype(np.float64)
        h.append(v / max(1.0, v.sum()))
    return np.concatenate(h)


def dhash(f):
    g = f.mean(axis=2).astype(np.float64)
    g = g[::H // 8, ::W // 8][:8, :8] if g.shape[0] >= 8 else g[:8, :8]
    g = np.array(g).reshape(8, 8)
    return (g[:, 1:] > g[:, :-1]).flatten()


def main(path):
    print(f"QA: {path}")
    frames = decode(path)
    n = len(frames)
    print(f"  decoded {n} frames ({n / FPS:.2f}s @ {FPS}fps)")
    hs = [hist(f) for f in frames]
    means = np.array([f.mean() for f in frames])
    motion = np.zeros(n)
    for i in range(1, n):
        motion[i] = np.abs(frames[i].astype(np.int16) - frames[i - 1].astype(np.int16)).mean() / 255.0

    # ---------- 1. cuts ----------
    raw = []
    for i in range(1, n):
        hd = np.abs(hs[i] - hs[i - 1]).sum()
        if (hd > CUT_HIST and motion[i] > CUT_MOTION) or motion[i] > 0.18:
            raw.append(i)
    cuts, last = [], -99
    for c in raw:
        if c - last > DEDUPE:
            cuts.append(c)
        last = c
    # ignore genuine scene boundaries (those are supposed to be hard cuts)
    scene_set = set(SCENE_CUTS)
    cuts_soft = [c for c in cuts if not any(abs(c - sc) <= 2 for sc in scene_set)]

    # ---------- 2. frozen ----------
    frozen = []
    run = 1
    for i in range(1, n):
        if motion[i] < 1e-6 and means[i] == means[i - 1]:
            run += 1
        else:
            if run >= FROZEN_MIN:
                frozen.append({"start": i - run, "end": i - 1, "len": run})
            run = 1
    if run >= FROZEN_MIN:
        frozen.append({"start": n - run, "end": n - 1, "len": run})

    # ---------- 3. black / white ----------
    black = [i for i in range(n) if means[i] < 4.0]
    white = [i for i in range(n) if means[i] > 250.0]

    # ---------- 3b. dark flashes at scene boundaries ----------
    # A real "blink" is a V-shape: the boundary frame must be darker than BOTH
    # its immediate neighbours. A merely darker next scene is a step change and
    # is perfectly fine (dim interiors follow bright exteriors by design).
    INTENTIONAL_DARK = {1250: "S7 opens on 11s of blackout (story beat)",
                        1985: "End card is black by design"}
    flashes = []
    for b in SCENE_CUTS:
        if b <= 1 or b >= n - 2:
            continue
        here, prev, nxt = means[b], means[b - 1], means[b + 1]
        floor = min(prev, nxt)
        if floor > 10 and here < floor * 0.72:
            flashes.append({"frame": b, "mean": round(float(here), 1),
                            "prev": round(float(prev), 1), "next": round(float(nxt), 1),
                            "intentional": INTENTIONAL_DARK.get(b)})

    # ---------- 4. A->B->A returns ----------
    bounds = [0] + cuts + [n]
    shots = [(bounds[k], bounds[k + 1] - 1) for k in range(len(bounds) - 1) if bounds[k + 1] - bounds[k] > 3]
    sig = []
    for (a, b) in shots:
        mid = frames[(a + b) // 2].mean(axis=2).astype(np.float64)
        sig.append(mid)
    returns = []
    for k in range(len(shots) - 2):
        a, b = shots[k], shots[k + 2]
        if b[0] - a[0] > RETURN_WINDOW:
            continue
        d = np.abs(sig[k] - sig[k + 2]).mean() / 255.0
        if d < 0.045:
            returns.append({"before": [a[0], a[1]], "middle": [shots[k + 1][0], shots[k + 1][1]],
                            "back": [b[0], b[1]], "diff": round(float(d), 4)})

    # ---------- 5. cuts inside animations ----------
    win_path = os.path.join(os.path.dirname(path), "qa_windows.json")
    if not os.path.exists(win_path):
        win_path = "qa_windows.json"
    anim_hits = []
    if os.path.exists(win_path):
        windows = json.load(open(win_path))
        for c in cuts_soft:
            for w in windows:
                if w["start"] - ANIM_MARGIN <= c <= w["end"]:
                    anim_hits.append({"cut": c, "inside": w["name"], "window": [w["start"], w["end"]]})
                    break

    # ---------- 6. stream health ----------
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                            "stream=codec_name,width,height,r_frame_rate,duration,bit_rate",
                            "-show_entries", "format=duration,size,bit_rate",
                            "-of", "json", path], capture_output=True, text=True)
    try:
        pinfo = json.loads(probe.stdout)
    except Exception:
        pinfo = {}
    loud = subprocess.run(["ffmpeg", "-i", path, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True)
    li = {}
    if "input_i" in loud.stderr:
        for line in loud.stderr.splitlines():
            s = line.strip().strip(",")
            for k in ("input_i", "input_tp", "input_lra"):
                if s.startswith(f'"{k}"'):
                    li[k] = s.split(":")[1].strip().strip('"')

    report = {
        "file": os.path.basename(path),
        "frames": n, "duration_s": round(n / FPS, 3),
        "cuts": cuts,
        "shot_count": len(shots),
        "frozen_runs": frozen,
        "black_frames": {"count": len(black), "sample": black[:12]},
        "white_frames": {"count": len(white), "sample": white[:12]},
        "boundary_flashes": flashes,
        "returns": returns,
        "cut_inside_animation": anim_hits,
        "stream": pinfo,
        "loudness": li,
    }

    print(f"\n  shots: {len(shots)}  cuts: {len(cuts)} (scene cuts excluded from animation check)")
    print(f"  cut frames: {cuts_soft}")
    print(f"  frozen runs: {len(frozen)}   black frames: {len(black)}   white frames: {len(white)}")
    real_flashes = [f for f in flashes if not f.get("intentional")]
    print(f"  boundary blinks: {len(real_flashes)}" + (f" (+{len(flashes)-len(real_flashes)} intentional)" if len(flashes) != len(real_flashes) else ""))
    for fl in flashes:
        tag = f"  [INTENTIONAL: {fl['intentional']}]" if fl.get("intentional") else ""
        print(f"    BLINK @ {fl['frame']} mean {fl['mean']} (prev {fl['prev']} / next {fl['next']}){tag}")
    print(f"  A->B->A returns: {len(returns)}")
    for r in returns:
        print(f"    frames {r['before'][0]}-{r['before'][1]} -> {r['middle'][0]}-{r['middle'][1]} "
              f"-> back {r['back'][0]}-{r['back'][1]}  (diff {r['diff']})")
    print(f"  cuts inside animation windows: {len(anim_hits)}")
    for a in anim_hits:
        print(f"    CUT @ {a['cut']} ({a['cut']/FPS:.2f}s) lands inside '{a['inside']}' {a['window']}")
    if li:
        print(f"  loudness: I={li.get('input_i')} LUFS  TP={li.get('input_tp')} dBTP  LRA={li.get('input_lra')}")

    out = path.rsplit(".", 1)[0] + "_qa.json"
    json.dump(report, open(out, "w"), indent=1)
    print(f"\n  report -> {out}")
    blocking = len(frozen) + len(anim_hits) + len(returns) + len(real_flashes)
    print(f"\n  {'✅ PASS — no blocking issues' if blocking == 0 else f'❌ {blocking} blocking issue(s)'}")
    return 0 if blocking == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
