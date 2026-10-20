#!/usr/bin/env python3
"""style_profile.py — measure an edit, don't vibe about it.

Runs the same instrument over any clip and prints numbers you can compare:

    shots, cuts per minute, average shot length, motion energy,
    saturation, hue, luma, loudness (LUFS), true peak.

    python3 tools/style_profile.py clip.mp4
    python3 tools/style_profile.py a.mp4 b.mp4 c.mp4 --json qa/style.json

Why: "his editing is professional" is not a spec. Cut rate, shot length and
contrast measured on the same scale are. Once you have the numbers you can
copy the technique without copying the wrong film's look.
"""
from __future__ import annotations
import argparse, json, os, re, shutil, subprocess, sys

SCENE_THRESHOLD = 0.30      # ffmpeg scene score that counts as a cut


def need_ffmpeg() -> None:
    if shutil.which("ffmpeg"):
        return
    try:
        import imageio_ffmpeg
        p = imageio_ffmpeg.get_ffmpeg_exe()
        os.makedirs("/usr/local/bin", exist_ok=True)
        dst = "/usr/local/bin/ffmpeg"
        if not os.path.exists(dst):
            shutil.copy(p, dst)
            os.chmod(dst, 0o755)
    except Exception:                                        # noqa: BLE001
        sys.exit("ffmpeg not found — pip install -q imageio-ffmpeg")


def probe(path: str) -> dict:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-print_format", "json",
         "-show_format", "-show_streams", path], text=True)
    d = json.loads(out)
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), {})
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    num, den = (v.get("r_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    return {
        "duration": float(d["format"].get("duration") or 0),
        "width": v.get("width"), "height": v.get("height"),
        "fps": round(fps, 3),
        "video_kbps": round(int(v.get("bit_rate") or 0) / 1000),
        "has_audio": a is not None,
        "audio_kbps": round(int(a.get("bit_rate") or 0) / 1000) if a else 0,
        "pix_fmt": v.get("pix_fmt"),
        "size_mb": round(int(d["format"].get("size") or 0) / 1e6, 2),
    }


def cuts(path: str) -> tuple[int, list[float]]:
    """Scene-change detection. Returns cut count and cut timestamps."""
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path,
         "-vf", "select='gt(scene,%.2f)',showinfo" % SCENE_THRESHOLD,
         "-an", "-f", "null", "-"],
        capture_output=True, text=True)
    times = [float(m) for m in re.findall(r"pts_time:([0-9.]+)", p.stderr)]
    return len(times), times


def motion(path: str) -> float:
    """Mean per-frame change, 0-1. Low = locked-off stills, high = busy cuts."""
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path,
         "-vf", "select='gte(scene,0)',metadata=print:key=lavfi.scene_score",
         "-an", "-f", "null", "-"],
        capture_output=True, text=True)
    vals = [float(x) for x in re.findall(r"lavfi\.scene_score=([0-9.]+)", p.stderr)]
    return round(sum(vals) / len(vals), 4) if vals else 0.0


def colour(path: str) -> dict:
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path,
         "-vf", "signalstats,metadata=print:file=-",
         "-an", "-f", "null", "-"],
        capture_output=True, text=True)
    def avg(key: str) -> float | None:
        v = [float(x) for x in re.findall(key + r"=([0-9.]+)", p.stdout)]
        return round(sum(v) / len(v), 1) if v else None
    return {"yavg": avg("lavfi.signalstats.YAVG"),
            "satavg": avg("lavfi.signalstats.SATAVG"),
            "hueavg": avg("lavfi.signalstats.HUEAVG")}


def loudness(path: str) -> dict:
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path,
         "-af", "loudnorm=print_format=json", "-f", "null", "-"],
        capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S)
    if not m:
        return {}
    try:
        d = json.loads(m.group(0))
        return {"lufs": float(d["input_i"]), "true_peak_db": float(d["input_tp"]),
                "lra": float(d["input_lra"])}
    except Exception:                                        # noqa: BLE001
        return {}


def profile(path: str) -> dict:
    pinfo = probe(path)
    n, times = cuts(path)
    dur = pinfo["duration"] or 1e-6
    pm = pinfo.copy()
    pm.update({
        "file": os.path.basename(path),
        "shots": n + 1,
        "cuts_per_min": round((n / dur) * 60, 1),
        "avg_shot_s": round(dur / (n + 1), 2),
        "motion": motion(path),
        "colour": colour(path),
        "audio": loudness(path),
        "cut_times": [round(t, 2) for t in times[:60]],
    })
    return pm


def fmt(p: dict) -> str:
    c = p.get("colour") or {}
    a = p.get("audio") or {}
    lines = [
        "%-34s %sx%s @ %.0f fps  %6.1fs  %5.1f MB" % (
            p["file"][:34] if "file" in p else p.get("file", "?"),
            p.get("width"), p.get("height"), p.get("fps", 0),
            p.get("duration", 0), p.get("size_mb", 0)),
        "   shots %-4s  cuts/min %-6s  avg shot %-5ss  motion %.3f" % (
            p["shots"], p["cuts_per_min"], p["avg_shot_s"], p["motion"]),
    ]
    if c:
        lines.append("   colour  luma %s  sat %s  hue %s" % (c.get("yavg"), c.get("satavg"), c.get("hueavg")))
    if a:
        lines.append("   audio   %s LUFS  peak %s dBTP  LRA %s" % (a.get("lufs"), a.get("true_peak_db"), a.get("lra")))
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="Measure the style of an edit.")
    ap.add_argument("files", nargs="+")
    ap.add_argument("--json", default=None, help="write the full profile here")
    a = ap.parse_args()
    need_ffmpeg()

    out = []
    print("=" * 78)
    for f in a.files:
        if not os.path.isfile(f):
            print("skip (missing):", f)
            continue
        p = profile(f)
        print(fmt(p))
        print("-" * 78)
        out.append(p)

    if out:
        rows = [("file", "dur", "fps", "shots", "cuts/min", "avg shot", "motion", "sat", "LUFS")]
        for p in out:
            rows.append((p["file"][:28], p["duration"], p["fps"], p["shots"],
                         p["cuts_per_min"], p["avg_shot_s"], p["motion"],
                         (p.get("colour") or {}).get("satavg"),
                         (p.get("audio") or {}).get("lufs")))
        widths = [max(len(str(r[i])) for r in rows) for i in range(len(rows[0]))]
        print()
        for r in rows:
            print("  ".join(str(c).ljust(w) for c, w in zip(r, widths)))

    if a.json:
        os.makedirs(os.path.dirname(os.path.abspath(a.json)) or ".", exist_ok=True)
        with open(a.json, "w") as fh:
            json.dump(out, fh, indent=1)
        print("\nwrote", a.json)


if __name__ == "__main__":
    main()
