#!/usr/bin/env python3
"""grade_plate.py — force any generated clip into the film's archival register.

The problem this solves: raw model output looks like *model output* — teal glow,
clean digital shadows, smooth gradients. Even a good generation reads as AI next
to a 1979 photograph. This applies the same treatment to every generated frame
that the archival plates already have: monochrome, a filmic S-curve, grain,
vignette, and a touch of halation on the highlights.

    python tools/grade_plate.py in.mp4 out.mp4
    python tools/grade_plate.py in.mp4 out.mp4 --preset noir
    python tools/grade_plate.py in.mp4 out.mp4 --preset warm_archive --grain 18

Presets:
    archive       neutral monochrome, heavy grain        (matches the film's plates)
    noir          deeper blacks, harder contrast          (interrogation / night)
    warm_archive  gentle sepia, softer contrast           (documents, interiors)
    recon         cold monochrome, cyan lift              (aerial / surveillance)
"""
from __future__ import annotations
import argparse, subprocess, sys

PRESETS = {
    # (curve, eq, vignette, grain, extra)
    "archive": ("0/0.02 0.25/0.16 0.5/0.46 0.75/0.80 1/1",
                "contrast=1.12:brightness=-0.02", "PI/5", 14, ""),
    "noir":    ("0/0.00 0.2/0.08 0.5/0.42 0.78/0.86 1/1",
                "contrast=1.30:brightness=-0.05", "PI/4", 16, ""),
    "warm_archive": ("0/0.03 0.25/0.20 0.5/0.52 0.75/0.83 1/1",
                     "contrast=1.05:brightness=0.01", "PI/6", 12,
                     "colorbalance=rs=.10:gs=.04:bs=-.08"),
    "recon":   ("0/0.01 0.25/0.14 0.5/0.44 0.75/0.78 1/1",
                "contrast=1.15:brightness=-0.03", "PI/5", 11,
                "colorbalance=rs=-.06:gs=.02:bs=.10"),
}


def build(preset, grain_override=None, add_halation=True):
    """Return a -filter_complex graph string. Halation needs fan-out, which a
    simple -vf chain cannot express (only linear chains are allowed there)."""
    curve, eq, vig, grain, extra = PRESETS[preset]
    if grain_override is not None:
        grain = grain_override

    base = ["format=gray"]
    if extra:
        base.append(extra)
    base += [f"curves=all='{curve}'",
             f"noise=alls={grain}:allf=t+u",
             f"eq={eq}",
             f"vignette={vig}"]
    if not add_halation:
        base.append("gblur=sigma=0.4")
        return "[0:v]" + ",".join(base) + "[out]"

    head = "[0:v]" + ",".join(base) + ",split[a][b]"
    bloom = ("[b]curves=all='0/0 0.72/0 1/1',gblur=sigma=12[bl]")
    mix = "[a][bl]blend=all_mode=screen:all_opacity=0.22,format=gray,gblur=sigma=0.4[out]"
    return ";".join([head, bloom, mix])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--preset", default="archive", choices=list(PRESETS))
    ap.add_argument("--grain", type=int, default=None)
    ap.add_argument("--no-halation", action="store_true")
    ap.add_argument("--crf", type=int, default=17)
    a = ap.parse_args()

    graph = build(a.preset, a.grain, not a.no_halation)
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", a.src,
           "-filter_complex", graph, "-map", "[out]",
           "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf),
           "-pix_fmt", "yuv420p",
           "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
           "-c:a", "copy", a.dst]
    print("graph:", graph)
    r = subprocess.run(cmd)
    if r.returncode:
        sys.exit("ffmpeg failed")
    print("wrote", a.dst)
    print("next: python3 qa_pro.py " + a.dst)


if __name__ == "__main__":
    sys.exit(main())
