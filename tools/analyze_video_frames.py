#!/usr/bin/env python3
"""Frame-by-frame visual audit for locally available reference or house videos.

Scans every decoded frame, writes per-frame brightness/change metrics, extracts
sampled/cut frames, and assembles contact sheets. Requires opencv-python-headless.
"""
import argparse
import csv
import json
import math
from pathlib import Path

import cv2
import numpy as np


def ts(seconds: float) -> str:
    ms = round(seconds * 1000)
    h, rem = divmod(ms, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def contact_sheets(items, out_dir: Path, cols: int, thumb_w: int, thumb_h: int):
    rows_per_sheet = 4
    pad, label_h = 10, 24
    for page, start in enumerate(range(0, len(items), cols * rows_per_sheet), 1):
        batch = items[start:start + cols * rows_per_sheet]
        rows = math.ceil(len(batch) / cols)
        canvas = np.full((pad + rows * (thumb_h + label_h + pad), pad + cols * (thumb_w + pad), 3), 18, np.uint8)
        for i, (seconds, frame, kind) in enumerate(batch):
            r, c = divmod(i, cols)
            x, y = pad + c * (thumb_w + pad), pad + r * (thumb_h + label_h + pad)
            thumb = cv2.resize(frame, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)
            canvas[y:y + thumb_h, x:x + thumb_w] = thumb
            label = f"{ts(seconds)} {kind}"
            cv2.putText(canvas, label, (x + 2, y + thumb_h + 17), cv2.FONT_HERSHEY_SIMPLEX, .42, (235, 235, 235), 1, cv2.LINE_AA)
        cv2.imwrite(str(out_dir / f"contact-{page:02d}.jpg"), canvas, [cv2.IMWRITE_JPEG_QUALITY, 88])


def analyze(video: Path, out_dir: Path, every_s: float, threshold: float, hist_threshold: float, cols: int):
    out_dir.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(video))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot decode video: {video}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    declared_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if fps <= 0:
        raise RuntimeError("Video reports an invalid frame rate")

    frame_idx, prev, prev_hist, next_sample = 0, None, None, 0.0
    cut_samples, timeline_samples = [], []
    differences, brightness = [], []
    min_gap = max(1, round(fps * .35))
    last_cut = -min_gap
    frames_dir = out_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    with (out_dir / "frame-metrics.csv").open("w", newline="", encoding="utf-8") as fcsv:
        writer = csv.writer(fcsv)
        writer.writerow(["frame", "time_seconds", "timecode", "mean_luma_0_255", "mean_abs_change_0_1", "hist_bhattacharyya", "cut_candidate"])
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            seconds = frame_idx / fps
            small = cv2.resize(frame, (96, 160), interpolation=cv2.INTER_AREA)
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            luma = float(gray.mean())
            hist = cv2.calcHist([gray], [0], None, [32], [0, 256])
            cv2.normalize(hist, hist)
            change = 0.0 if prev is None else float(cv2.absdiff(gray, prev).mean() / 255.0)
            hist_change = 0.0 if prev_hist is None else float(cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA))
            is_cut = bool(prev is not None and (change >= threshold or hist_change >= hist_threshold) and frame_idx - last_cut >= min_gap)
            writer.writerow([frame_idx, f"{seconds:.4f}", ts(seconds), f"{luma:.3f}", f"{change:.5f}", f"{hist_change:.5f}", int(is_cut)])
            brightness.append(luma)
            differences.append(change)
            if seconds + 1e-6 >= next_sample:
                timeline_samples.append((seconds, frame.copy(), "sample"))
                next_sample += every_s
            if is_cut:
                last_cut = frame_idx
                cut_samples.append((seconds, frame.copy(), "cut"))
                cv2.imwrite(str(frames_dir / f"cut-{frame_idx:08d}-{seconds:08.3f}s.jpg"), frame, [cv2.IMWRITE_JPEG_QUALITY, 93])
            prev = gray
            prev_hist = hist
            frame_idx += 1
    cap.release()

    # Keep sampled frames as the main overview, adding cut candidates that are not
    # already within 0.5 s of a sampled frame.
    combined = list(timeline_samples)
    for cut in cut_samples:
        if all(abs(cut[0] - sample[0]) > .5 for sample in timeline_samples):
            combined.append(cut)
    combined.sort(key=lambda item: item[0])
    contact_sheets(combined, out_dir, cols, 162, 288)
    duration = frame_idx / fps
    result = {
        "video": str(video),
        "frames_decoded": frame_idx,
        "container_frame_count": declared_frames,
        "fps": fps,
        "width": width,
        "height": height,
        "duration_seconds": duration,
        "cut_threshold_mean_abs_change": threshold,
        "cut_threshold_hist_bhattacharyya": hist_threshold,
        "cut_candidates": [{"time_seconds": round(t, 3), "timecode": ts(t)} for t, _, _ in cut_samples],
        "mean_luma": round(float(np.mean(brightness)), 3) if brightness else None,
        "mean_frame_change": round(float(np.mean(differences)), 6) if differences else None,
        "outputs": ["frame-metrics.csv", "contact-*.jpg", "frames/cut-*.jpg"],
        "note": "Cut candidates are algorithmic; manually review contact sheets. A visual-change scan is not by itself an interpretation of narrative or sound.",
    }
    (out_dir / "summary.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--every-seconds", type=float, default=1.0, help="Contact-sheet sample spacing; all frames are still scanned")
    parser.add_argument("--cut-threshold", type=float, default=.05, help="Mean normalized pixel change for cut candidates")
    parser.add_argument("--cut-hist-threshold", type=float, default=.30, help="Grayscale histogram Bhattacharyya distance for cut candidates")
    parser.add_argument("--cols", type=int, default=5)
    args = parser.parse_args()
    target = args.out or Path(".cache/video-audit") / args.video.stem
    result = analyze(args.video, target, args.every_seconds, args.cut_threshold, args.cut_hist_threshold, args.cols)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
