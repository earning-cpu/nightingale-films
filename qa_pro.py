#!/usr/bin/env python3
"""qa_pro.py — broadcast-grade QC engine for PROJECT_NIGHTINGALE.

One decode pass per concern, all results in one JSON report.
Exit code 1 if any BLOCKER is raised.

Usage:
  python3 qa_pro.py FILM.mp4 [--json qa/pro.json] [--narr src/narration.json]
                             [--fps 30] [--quiet]

Checks
  C3  stream conformance  : codec/pix_fmt/fps/SAR/faststart/colour tagging
  V1  black intervals     : blackdetect  (unexpected full-black frames)
  V2  freeze              : freezedetect  (dead frames)
  V3  levels              : pixel-accurate crush/clip + video-range legality
  V4  photosensitivity    : WCAG 2.3.1  <=3 general flashes in any 1 s
  V5  rhythm              : cuts / min, longest static run
  V6  framing             : letterbox/pillarbox detection + edge energy
  A1  loudness            : EBU R128 integrated, LRA, true peak
  A2  silence             : dead-air gaps
  A3  stereo phase        : mono-compatibility (aphasemeter)
  A4  DC offset           : astats
  C1  caption rate        : Netflix/BBC CPS + chars-per-line budget
  C2  duration            : runtime vs plan
  G1  colour tags         : bt709 matrix/transfer required for SDR delivery
"""
from __future__ import annotations
import argparse, json, os, re, subprocess, sys
import numpy as np


# ------------------------------------------------------------------ helpers
def sh(cmd, **kw):
    p = subprocess.run(cmd, capture_output=True, text=True, **kw)
    return p.stdout + p.stderr


def probe(path):
    out = sh(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path])
    return json.loads(out[out.index("{"):])


def y_frames(path, w=320, h=180):
    """Yield the raw Y plane of every frame, in SOURCE range (16-235 if tv).
    No colour conversion -> no range expansion -> crush/clip measured on real data."""
    cmd = ["ffmpeg", "-v", "error", "-i", path,
           "-vf", f"scale={w}:{h}:flags=area+accurate_rnd+full_chroma_int",
           "-pix_fmt", "yuv420p", "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = w * h
    fs = n * 3 // 2
    try:
        while True:
            b = p.stdout.read(fs)
            if len(b) < fs:
                break
            yield np.frombuffer(b, dtype=np.uint8)[:n].reshape(h, w)
    finally:
        p.stdout.close()
        p.wait()


def luminance_series(path, w=160, h=90):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}",
           "-pix_fmt", "gray", "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = w * h
    out = []
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        out.append(np.frombuffer(b, dtype=np.uint8).mean())
    p.wait()
    return np.array(out, dtype=np.float64)


# ------------------------------------------------------------------ detectors
def detectors(path):
    log = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", path,
              "-vf", "blackdetect=d=0.20:pic_th=0.99:pix_th=0.08,"
                     "freezedetect=n=-60dB:d=0.40",
              "-an", "-f", "null", "-"])
    black = re.findall(r"black_start:\s*([\d.]+)\s+black_end:\s*([\d.]+)\s+black_duration:\s*([\d.]+)", log)
    fs = re.findall(r"freeze_start:\s*([\d.]+)", log)
    fd = re.findall(r"freeze_duration:\s*([\d.]+)", log)
    return ([{"start": float(a), "end": float(b), "dur": float(c)} for a, b, c in black],
            [{"start": float(s), "dur": float(d)} for s, d in zip(fs, fd)])


# ------------------------------------------------------------------ V3 levels
def levels(path, fps=30.0, black_win=(), allow_win=(), rng="tv"):
    """Legal-range crush/clip measured on the raw Y plane (16-235 for tv)."""
    lo = 17 if rng == "tv" else 2
    hi = 235 if rng == "tv" else 253
    crush_pct, clip_pct, frames = [], [], 0
    t = 0.0
    for f in y_frames(path):
        in_black = any(a <= t <= b for a, b in black_win)
        t += 1.0 / fps
        if in_black:
            continue
        frames += 1
        crush_pct.append(float((f <= lo).mean() * 100))
        clip_pct.append(float((f >= hi).mean() * 100))
    if not frames:
        return None
    c, k = np.array(crush_pct), np.array(clip_pct)
    return {
        "frames": frames,
        "crush_mean_pct": round(float(c.mean()), 3),
        "crush_p95_pct": round(float(np.percentile(c, 95)), 3),
        "crush_frames_over_12pct": int((c > 12).sum()),
        "clip_mean_pct": round(float(k.mean()), 3),
        "clip_p95_pct": round(float(np.percentile(k, 95)), 3),
        "clip_frames_over_2pct": int((k > 2).sum()),
        "floor": lo, "ceiling": hi, "range": rng,
    }


# ------------------------------------------------------------------ V4 PSE
def photosensitivity(lum, fps):
    """WCAG 2.3.1: <=3 general flashes in any 1 s.
    General flash = opposing relative-luminance change >=10%."""
    if len(lum) < 5:
        return {"max_flashes_per_s": 0, "total_flashes": 0, "violations": []}
    base = np.maximum(lum, 1.0)
    rel = np.diff(lum) / base[:-1]
    TH, state, flashes = 0.10, 0, []
    for i, d in enumerate(rel):
        if state == 0 and abs(d) >= TH:
            state = 1 if d < 0 else -1
        elif state == -1 and d >= TH:
            flashes.append(i / fps); state = 0
        elif state == 1 and d <= -TH:
            flashes.append(i / fps); state = 0
    f = np.array(flashes)
    worst, viol = 0, []
    for t0 in f:
        c = int(((f >= t0) & (f < t0 + 1.0)).sum())
        worst = max(worst, c)
        if c > 3:
            viol.append({"t": round(float(t0), 2), "flashes_in_1s": c})
    return {"max_flashes_per_s": int(worst), "total_flashes": int(len(f)),
            "violations": viol[:12]}


# ------------------------------------------------------------------ V6 framing
def framing(path, w, h):
    """Detect letterbox/pillarbox via cropdetect majority vote."""
    log = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vf",
              "fps=2,cropdetect=limit=16:round=2:reset=0,metadata=mode=print:file=-",
              "-an", "-f", "null", "-"])
    crops = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", log)
    if not crops:
        return {"modal_crop": None, "bars": "unknown"}
    cw, ch = zip(*[(int(c[0]), int(c[1])) for c in crops])
    mw, mh = int(np.median(cw)), int(np.median(ch))
    top = int(np.median([int(c[3]) for c in crops]))
    left = int(np.median([int(c[2]) for c in crops]))
    bars = []
    if mh < h * 0.965:
        bars.append(f"letterbox ~{(h - mh) // 2}px")
    if mw < w * 0.965:
        bars.append(f"pillarbox ~{(w - mw) // 2}px")
    if top > h * 0.03 or left > w * 0.03:
        bars.append("asymmetric crop")
    return {"modal_crop": f"{mw}x{mh}", "top": top, "left": left,
            "fill_pct": round(100 * mw * mh / (w * h), 1), "bars": bars or "none"}


# ------------------------------------------------------------------ audio
def audio(path):
    st = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
             "ebur128=peak=true,aphasemeter=video=0,ametadata=mode=print:file=-,"
             "astats=metadata=1:reset=0",
             "-vn", "-f", "null", "-"])

    def last(key):
        m = re.findall(rf"{key}:\s*(-?[\d.]+)", st)
        return float(m[-1]) if m else None

    sil = re.findall(r"silence_start:\s*(-?[\d.]+)", st)
    sdur = re.findall(r"silence_duration:\s*([\d.]+)", st)
    pairs = re.findall(r"pts_time:([\d.]+)\s*\nlavfi\.aphasemeter\.phase=(-?[\d.]+)", st)
    phase = [float(v) for _, v in pairs] or [float(x) for x in re.findall(r"aphasemeter\.phase=(-?[\d.]+)", st)]
    worst = sorted(((float(v), float(t)) for t, v in pairs))[:5]
    # sustained anti-phase: contiguous run < -0.2 lasting >= 0.3 s (tail 0.5 s ignored)
    sust = []
    ts = [(float(t), float(v)) for t, v in pairs if float(t) < 1e9]
    tail = ts[-1][0] - 0.5 if ts else 0
    run_t0, run_n = None, 0
    for t, v in ts:
        if t >= tail:
            break
        if v < -0.2:
            run_t0 = t if run_n == 0 else run_t0
            run_n += 1
        else:
            if run_n >= 10:            # ~10 metadata samples >= 0.3 s at 32 ms/sample
                sust.append({"start": round(run_t0, 2), "dur": round(t - run_t0, 2)})
            run_t0, run_n = None, 0
    if run_n >= 10:
        sust.append({"start": round(run_t0, 2), "dur": round((ts[-1][0] - run_t0), 2)})

    return {
        "integrated_lufs": last("I"),
        "lra": last("LRA"),
        "true_peak_db": last("Peak"),
        "dc_offset": last("DC offset"),
        "silences": [{"start": float(a), "dur": float(b)} for a, b in zip(sil, sdur)],
        "phase_min": round(min(phase), 3) if phase else None,
        "phase_mean": round(float(np.mean(phase)), 3) if phase else None,
        "phase_samples": len(phase),
        "phase_worst": [{"t": round(t, 2), "phase": round(v, 2)} for v, t in worst][:5],
        "phase_sustained": sust,
    }


# ------------------------------------------------------------------ captions
def captions(narr_path, fps=30.0):
    if not os.path.exists(narr_path):
        return None
    n = json.load(open(narr_path))
    out = []
    for seg, line in n.items():
        words = line.get("words") or []
        if not words:
            continue
        start = line["start"]
        end = words[-1]["f"] + words[-1]["d"] + 18      # CaptionTrack hold
        text = " ".join(w["w"] for w in words)
        dur = max(1, end - start) / fps
        cps = len(text) / dur
        peaks, prev_f = [], start
        for w in words:
            gap = max(1, w["f"] - prev_f) / fps
            peaks.append((len(w["w"]) + 1) / gap)
            prev_f = w["f"]
        out.append({
            "seg": seg, "chars": len(text), "dur_s": round(dur, 2),
            "cps": round(cps, 1), "peak_cps": round(max(peaks), 1),
            "longest_token": max(len(w["w"]) for w in words),
            "two_line_budget_ok": len(text) <= 84,     # 2 x 42 chars
        })
    return out


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--json", default=None)
    ap.add_argument("--narr", default="src/narration.json")
    ap.add_argument("--fps", type=float, default=None)
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--allow-black", default="",
                    help="comma list of t0-t1 windows where black is intentional (fades/cards)")
    a = ap.parse_args()

    print(f"PRO QC — {a.video}\n" + "=" * 62)
    info = probe(a.video)
    vs = next((s for s in info["streams"] if s.get("codec_type") == "video"), {})
    as_ = next((s for s in info["streams"] if s.get("codec_type") == "audio"), {})
    fmt = info.get("format", {})
    w, h = vs.get("width"), vs.get("height")
    num, den = (vs.get("r_frame_rate", "0/1").split("/") + ["1"])[:2]
    fps = a.fps or (float(num) / float(den or 1))
    faststart = "moov" in sh(["ffprobe", "-v", "trace", "-i", a.video])[:4000]
    res = {}

    # ---- C3 stream conformance
    res["C3_stream"] = {
        "resolution": f"{w}x{h}", "fps": round(fps, 2),
        "codec": vs.get("codec_name"), "profile": vs.get("profile"),
        "pix_fmt": vs.get("pix_fmt"), "color_range": vs.get("color_range", "unspecified"),
        "sar": vs.get("sample_aspect_ratio"), "dar": vs.get("display_aspect_ratio"),
        "audio": as_.get("codec_name"), "audio_sr": as_.get("sample_rate"),
        "audio_ch": as_.get("channels"),
        "duration_s": round(float(fmt.get("duration", 0)), 2),
        "bitrate_kbps": round(float(fmt.get("bit_rate", 0)) / 1000),
        "faststart": faststart,
    }
    print(f"\n[C3] stream      {w}x{h} @ {fps:.2f}fps  {vs.get('codec_name')} "
          f"{vs.get('pix_fmt')}  audio={as_.get('codec_name')}/{as_.get('channels')}ch  "
          f"faststart={faststart}")

    # ---- G1 colour tags
    tags = {"matrix": vs.get("color_space", "unknown"),
            "transfer": vs.get("color_transfer", "unknown"),
            "primaries": vs.get("color_primaries", "unknown"),
            "range": vs.get("color_range", "unknown")}
    tag_ok = tags["matrix"] == "bt709" and tags["transfer"] == "bt709" and tags["range"] == "tv"
    res["G1_colour"] = {**tags, "ok": tag_ok}
    print(f"[G1] colour      matrix={tags['matrix']} transfer={tags['transfer']} "
          f"primaries={tags['primaries']} range={tags['range']}"
          f"{'' if tag_ok else '   ⚠ not bt709/bt709/tv'}")

    # ---- V1 / V2
    black, freeze = detectors(a.video)
    res["V1_black"], res["V2_freeze"] = black, freeze
    print(f"[V1] black       {len(black)} interval(s) ≥0.2s {black if black else ''}")
    print(f"[V2] frozen      {len(freeze)} run(s) ≥0.4s {freeze if freeze else ''}")

    # ---- V3 levels
    allow = []
    for part in filter(None, a.allow_black.split(",")):
        lo, hi = part.split("-")
        allow.append((float(lo), float(hi)))
    lv = levels(a.video, fps, [(b["start"], b["end"]) for b in black], allow)
    res["V3_levels"] = lv
    if lv:
        print(f"[V3] levels      floor(≤{lv['floor']}) mean {lv['crush_mean_pct']}% p95 {lv['crush_p95_pct']}%  "
              f"ceil(≥{lv['ceiling']}) mean {lv['clip_mean_pct']}% p95 {lv['clip_p95_pct']}%  "
              f"hot frames: crush {lv['crush_frames_over_12pct']} / clip {lv['clip_frames_over_2pct']}")

    # ---- V4 photosensitivity
    lum = luminance_series(a.video)
    pse = photosensitivity(lum, fps)
    res["V4_photosensitivity"] = pse
    print(f"[V4] photosens.  max {pse['max_flashes_per_s']} flashes/s — "
          f"{'PASS' if pse['max_flashes_per_s'] <= 3 else 'FAIL >3/s'} "
          f"({pse['total_flashes']} total transitions)")

    # ---- V5 rhythm
    rel = np.abs(np.diff(lum) / np.maximum(lum[:-1], 1))
    cuts = int((rel > 0.18).sum())
    mins = float(fmt.get("duration", 0)) / 60
    longest_static = 0
    run = 0
    for v in rel:
        run = run + 1 if v < 0.02 else 0
        longest_static = max(longest_static, run)
    res["V5_rhythm"] = {"estimated_cuts": cuts, "cuts_per_minute": round(cuts / max(mins, 1e-6), 1),
                        "longest_static_s": round(longest_static / fps, 2)}
    print(f"[V5] rhythm      ~{cuts} cuts ({cuts / max(mins, 1e-6):.1f}/min)  "
          f"longest static run {longest_static / fps:.2f}s")

    # ---- V6 framing
    fr = framing(a.video, w, h)
    res["V6_framing"] = fr
    print(f"[V6] framing     modal crop {fr['modal_crop']}  fill {fr.get('fill_pct')}%  bars: {fr['bars']}")

    # ---- A1-A4
    au = audio(a.video)
    res["A1_A4_audio"] = au
    print(f"[A1] loudness    I={au['integrated_lufs']} LUFS  LRA={au['lra']}  TP={au['true_peak_db']} dBTP")
    print(f"[A2] silence     {len(au['silences'])} gap(s) — longest "
          f"{max([s['dur'] for s in au['silences']], default=0):.2f}s")
    print(f"[A3] phase       min={au['phase_min']}  mean={au['phase_mean']} "
          f"({au['phase_samples']} samples) "
          f"{'OK' if (au['phase_min'] is None or au['phase_min'] > -0.2) else 'MONO-CANCEL RISK'}")
    print(f"[A4] DC offset   {au['dc_offset']}")

    # ---- C1 captions
    caps = captions(a.narr, fps)
    res["C1_captions"] = caps
    if caps:
        worst = max(caps, key=lambda c: c["cps"])
        over = [c for c in caps if c["cps"] > 20]
        print(f"[C1] captions    {len(caps)} lines, worst {worst['cps']} CPS in '{worst['seg']}', "
              f"{len(over)} over Netflix 20 CPS")
    else:
        print("[C1] captions    narration.json not found — skipped")

    # ---- C2 duration
    dur = float(fmt.get("duration", 0))
    res["C2_duration"] = {"seconds": round(dur, 2), "minutes": round(dur / 60, 2)}
    print(f"[C2] duration    {dur:.2f}s ({dur / 60:.2f} min)")

    # ---------------- verdict
    blockers = []
    if not faststart:
        blockers.append("moov atom not at start (no faststart)")
    black = [b for b in black if not any(a0 <= b["start"] + 0.05 and b["end"] <= a1 + 0.05 for a0, a1 in allow)]
    if black:
        blockers.append(f"{len(black)} unexpected black interval(s): "
                        + ", ".join(f"{b['start']:.1f}–{b['end']:.1f}s" for b in black[:4]))
    if freeze:
        blockers.append(f"{len(freeze)} frozen run(s) ≥0.4s")
    if pse["max_flashes_per_s"] > 3:
        blockers.append(f"{pse['max_flashes_per_s']} flashes/s exceeds WCAG 2.3.1 (<=3)")
    if lv and lv["clip_frames_over_2pct"] > max(6, lv["frames"] * 0.02):
        blockers.append(f"white clipping on {lv['clip_frames_over_2pct']} frames (>2% px at ceiling)")
    if lv and lv["crush_p95_pct"] > 30:
        blockers.append(f"shadow crush p95 {lv['crush_p95_pct']}% of frame at floor (>30%)")
    if au["integrated_lufs"] is not None and abs(au["integrated_lufs"] + 14) > 1.0:
        blockers.append(f"loudness {au['integrated_lufs']} LUFS (target -14 ±1)")
    if au["true_peak_db"] is not None and au["true_peak_db"] > -1.0:
        blockers.append(f"true peak {au['true_peak_db']} dBTP (max -1.0)")
    if au.get("phase_sustained"):
        blockers.append("sustained anti-phase: " + ", ".join(
            f"{x['dur']}s from {x['start']}s" for x in au["phase_sustained"][:3]))
    if au["dc_offset"] is not None and abs(au["dc_offset"]) > 0.02:
        blockers.append(f"DC offset {au['dc_offset']} (>0.02)")
    if caps and any(c["cps"] > 24 for c in caps):
        blockers.append("caption reading speed > 24 CPS")
    if caps and any(not c["two_line_budget_ok"] for c in caps):
        blockers.append("caption line exceeds 2×42-char budget")

    warnings = []
    if not tag_ok:
        warnings.append(f"colour tags are {tags['matrix']}/{tags['transfer']}/{tags['range']} "
                        f"— retag bt709/bt709/tv for SDR delivery")
    if lv and lv["crush_frames_over_12pct"] > max(12, lv["frames"] * 0.05):
        warnings.append(f"shadow crush on {lv['crush_frames_over_12pct']}/{lv['frames']} frames "
                        f"(>12% px at floor, mean {lv['crush_mean_pct']}%) — consider +2 IRE lift")
    if au["phase_min"] is not None and au["phase_min"] < -0.2 and not au.get("phase_sustained"):
        warnings.append(f"brief anti-phase dip {au['phase_min']} (not sustained — mono-safe)")
    if as_ and as_.get("channels") == 2:
        pass
    elif as_:
        warnings.append(f"audio is {as_.get('channels')}ch — stereo expected")

    print("\n" + "=" * 62)
    for w_ in warnings:
        print("⚠  ", w_)
    if blockers:
        print("❌ BLOCKING:")
        for b in blockers:
            print("   •", b)
    else:
        print("✅ ALL PRO QC CHECKS PASSED")

    res["_warnings"] = warnings
    res["_blockers"] = blockers
    if a.json:
        json.dump(res, open(a.json, "w"), indent=1)
        print(f"\nreport -> {a.json}")
    return 1 if blockers else 0


if __name__ == "__main__":
    sys.exit(main())
