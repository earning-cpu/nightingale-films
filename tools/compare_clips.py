#!/usr/bin/env python3
"""compare_clips.py — put every generated clip side by side, honestly.

Normalises clips to the same height and frame rate, labels each one, and writes:

    <out>.mp4    tiled comparison video (all clips playing at once)
    <out>.png    contact strip — one frame from each, for quick eyeballing

    python3 tools/compare_clips.py qa/clips
    python3 tools/compare_clips.py qa/clips --out qa/cmp --height 640
    python3 tools/compare_clips.py wan.mp4 ltx.mp4 --labels "Wan 2.2","LTX-Video"

Labels default to the file stem; underscores become spaces.

Why tile instead of cutting between them: you cannot remember a colour across a
cut, but you can compare two frames shown at the same instant. Tiling makes a
teal cast obvious in one glance.

Labels are drawn with PIL, not ffmpeg's drawtext, because the bundled static
ffmpeg build has no libfreetype.
"""
from __future__ import annotations
import argparse, os, shutil, subprocess, sys, glob

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]


def die(msg: str) -> None:
    sys.exit("compare_clips: " + msg)


def ffprobe(path: str, entries: str, stream: bool = True) -> str:
    sel = ["-select_streams", "v:0"] if stream else []
    return subprocess.check_output(
        ["ffprobe", "-v", "error"] + sel + ["-show_entries", entries,
                                            "-of", "default=nw=1:nk=1", path],
        text=True).strip().splitlines()[0]


def duration(path: str) -> float:
    try:
        return float(ffprobe(path, "format=duration", stream=False))
    except Exception:
        return 0.0


def find_font() -> str | None:
    for f in FONT_CANDIDATES:
        if os.path.exists(f):
            return f
    return None


def label_tile(text: str, w: int, h: int, font_path: str | None, out: str) -> str | None:
    """Transparent overlay PNG, tile-sized, with a readable label in the corner."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return None
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    px = max(14, h // 26)
    font = None
    if font_path:
        try:
            font = ImageFont.truetype(font_path, px)
        except Exception:
            font = None
    if font is None:
        font = ImageFont.load_default()
    bb = d.textbbox((0, 0), text, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    pad = max(6, px // 2)
    x0, y0 = 12, 12
    d.rounded_rectangle([x0, y0, x0 + tw + 2 * pad, y0 + th + 2 * pad],
                        radius=6, fill=(0, 0, 0, 170))
    d.text((x0 + pad - bb[0], y0 + pad - bb[1]), text, font=font, fill=(255, 255, 255, 255))
    img.save(out)
    return out


def collect(paths: list[str]) -> list[str]:
    files: list[str] = []
    for a in paths:
        if os.path.isdir(a):
            files += sorted(glob.glob(os.path.join(a, "**", "*.mp4"), recursive=True))
        elif os.path.isfile(a):
            files.append(a)
        else:
            die("no such file or directory: " + a)
    files = [f for f in files if os.path.getsize(f) > 20000]
    if not files:
        die("no usable clips found")
    return files


def main() -> None:
    ap = argparse.ArgumentParser(description="Side-by-side comparison of clips.")
    ap.add_argument("inputs", nargs="+", help="video files and/or directories")
    ap.add_argument("--out", default="qa/compare", help="output basename")
    ap.add_argument("--height", type=int, default=720, help="tile height in px")
    ap.add_argument("--columns", type=int, default=2, help="tiles per row")
    ap.add_argument("--labels", default=None, help='comma separated, e.g. "Wan 2.2","LTX"')
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--crf", type=int, default=20)
    args = ap.parse_args()

    if not shutil.which("ffmpeg"):
        die("ffmpeg not found — run: pip install -q imageio-ffmpeg")

    files = collect(args.inputs)
    if len(files) > 6:
        print("compare: %d clips is a lot; using the first 6" % len(files))
        files = files[:6]

    if args.labels:
        labels = [l.strip() for l in args.labels.split(",")]
        while len(labels) < len(files):
            labels.append(os.path.splitext(os.path.basename(files[len(labels)]))[0])
    else:
        labels = [os.path.splitext(os.path.basename(f))[0].replace("_", " ") for f in files]

    H = args.height
    cols = max(1, min(args.columns, len(files)))
    rows = (len(files) + cols - 1) // cols
    font = find_font()

    widths = []
    for f in files:
        try:
            w, h = [int(x) for x in ffprobe(f, "stream=width,height").split(",")[:2]]
            widths.append(round(H * w / h))
        except Exception:
            widths.append(round(H * 9 / 16))
    TW = max(widths) // 2 * 2

    out = args.out
    outdir = os.path.dirname(os.path.abspath(out))
    os.makedirs(outdir, exist_ok=True)
    mp4, png = out + ".mp4", out + ".png"

    label_pngs, chains, tiles, layouts = [], [], [], []
    for i, (f, lab, tw) in enumerate(zip(files, labels, widths)):
        lp = os.path.join(outdir, "_lab_%d.png" % i)
        label_pngs.append(label_tile(lab, TW, H, font, lp))
        pad = (TW - tw) // 2
        base = ("[%d:v]fps=%d,scale=%d:%d:force_original_aspect_ratio=decrease,"
                "pad=%d:%d:%d:%d:color=black,setsar=1,format=yuv420p[b%d]"
                % (i, args.fps, tw, H, TW, H, pad, 0, i))
        if label_pngs[-1]:
            base += ";[b%d][%d:v]overlay=0:0,format=yuv420p[v%d]" % (i, len(files) + i, i)
        else:
            base += ";[b%d]null[v%d]" % (i, i)
        chains.append(base)
        tiles.append("[v%d]" % i)
        layouts.append("%d_%d" % ((i % cols) * TW, (i // cols) * H))

    if len(files) == 1:
        fc = ";".join(chains) + ";%snull[out]" % tiles[0]
    else:
        fc = (";".join(chains) + ";%sxstack=inputs=%d:layout=%s:shortest=1,format=yuv420p[out]"
              % ("".join(tiles), len(files), "|".join(layouts)))

    dur = min([d for d in (duration(f) for f in files) if d > 0] or [3.0])
    print("compare: %d clip(s)  %d col x %d row  %dx%d  %.2f s -> %s"
          % (len(files), cols, rows, TW * cols, H * rows, dur, mp4))

    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for f in files:
        cmd += ["-i", f]
    for lp in label_pngs:
        if lp:
            cmd += ["-i", lp]
    cmd += ["-filter_complex", fc, "-map", "[out]", "-t", "%.3f" % dur,
            "-c:v", "libx264", "-preset", "medium", "-crf", str(args.crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
            "-color_range", "tv", "-colorspace", "bt709",
            "-color_primaries", "bt709", "-color_trc", "bt709", mp4]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-2500:])
        die("ffmpeg failed")

    # ---- contact strip, drawn with PIL so it is one clean image
    mid = dur * 0.5
    frames = []
    for i, f in enumerate(files):
        t = os.path.join(outdir, "_fr_%d.png" % i)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "%.3f" % mid,
                        "-i", f, "-frames:v", "1", t], check=False)
        if os.path.exists(t):
            frames.append(t)
    if frames and len(frames) == len(files):
        try:
            from PIL import Image, ImageDraw, ImageFont
            ims = [Image.open(t).convert("RGB").resize((widths[i], H)) for i, t in enumerate(frames)]
            strip = Image.new("RGB", (TW * cols, H * rows), (0, 0, 0))
            for i, im in enumerate(ims):
                cx, cy = (i % cols) * TW, (i // cols) * H
                strip.paste(im, (cx + (TW - im.width) // 2, cy))
            d = ImageDraw.Draw(strip)
            px = max(14, H // 26)
            try:
                font2 = ImageFont.truetype(font, px) if font else ImageFont.load_default()
            except Exception:
                font2 = ImageFont.load_default()
            for i, lab in enumerate(labels):
                bb = d.textbbox((0, 0), lab, font=font2)
                tw2, th2 = bb[2] - bb[0], bb[3] - bb[1]
                pad = max(6, px // 2)
                x0, y0 = (i % cols) * TW + 12, (i // cols) * H + 12
                d.rounded_rectangle([x0, y0, x0 + tw2 + 2 * pad, y0 + th2 + 2 * pad],
                                    radius=6, fill=(0, 0, 0))
                d.text((x0 + pad - bb[0], y0 + pad - bb[1]), lab, font=font2, fill=(255, 255, 255))
            strip.save(png)
        except Exception as e:
            print("  (contact strip skipped: %s)" % e)
    for t in glob.glob(os.path.join(outdir, "_fr_*.png")) + glob.glob(os.path.join(outdir, "_lab_*.png")):
        try:
            os.remove(t)
        except OSError:
            pass

    print("ok:", mp4)
    if os.path.exists(png):
        print("ok:", png)
    print("\nRead it like this: same instant, same subject. Whichever tile keeps its "
          "blacks black and its grain alive is the one that belongs in the film.")


if __name__ == "__main__":
    main()
