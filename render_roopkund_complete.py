#!/usr/bin/env python3
"""render_roopkund_complete.py — Full Autonomous Production Pipeline for Roopkund Film.
Generates:
1. 15 procedural 2D animated shots (snow physics, laser scanlines, light sweeps, HUDs, zoom/pans)
2. Concatenation and subtitle burn with HarfBuzz
3. Multi-resolution ladder (1080p, 720p, 480p, 9:16 Vertical Shorts 1080p & 720p)
"""
import os, sys, subprocess, cv2, numpy as np

W = 1920
H = 1080
FPS = 30
OUTPUT_DIR = "qa_roopkund"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs("docs", exist_ok=True)

# ----------------- Procedural FX Engine -----------------

class SnowEngine:
    def __init__(self, count=350):
        rng = np.random.default_rng(101)
        self.x = rng.uniform(0, W, count)
        self.y = rng.uniform(0, H, count)
        self.vx = rng.uniform(-5.0, -1.5, count) # High-altitude leftward blizzard
        self.vy = rng.uniform(5.0, 14.0, count)  # Downward velocity
        self.sz = rng.integers(1, 4, count)
        self.alpha = rng.uniform(0.4, 0.95, count)

    def update_and_render(self, frame, frame_idx, intensity=1.0):
        turb = np.sin(frame_idx * 0.12) * 2.0
        self.x += (self.vx + turb) * intensity
        self.y += self.vy * intensity
        self.x = np.where(self.x < 0, W + self.x, self.x)
        self.x = np.where(self.x >= W, self.x - W, self.x)
        self.y = np.where(self.y >= H, self.y - H, self.y)
        
        overlay = frame.copy()
        for i in range(len(self.x)):
            px, py = int(self.x[i]), int(self.y[i])
            sz = int(self.sz[i])
            # Draw streak
            cv2.line(overlay, (px, py), 
                     (int(px - self.vx[i]*1.8), int(py - self.vy[i]*1.8)),
                     (245, 248, 255), sz)
        return cv2.addWeighted(overlay, 0.85, frame, 0.15, 0)

def draw_tactical_hud(frame, frame_idx, time_sec, alt_str="ALT: 5,029m (16,500 FT)", 
                      coords="30.2622° N, 79.7317° E", tag="EXPEDITION ARCHIVE"):
    h, w = frame.shape[:2]
    # Header
    pulse = int(128 + 127 * np.sin(frame_idx * 0.2))
    cv2.circle(frame, (50, 65), 8, (0, 0, pulse), -1)
    cv2.putText(frame, "REC [SENSOR 01]", (70, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (220, 220, 220), 2, cv2.LINE_AA)
    cv2.putText(frame, f"LOC: ROOPKUND | {coords}", (350, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (180, 210, 210), 1, cv2.LINE_AA)
    cv2.putText(frame, alt_str, (w - 480, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 210, 255), 2, cv2.LINE_AA)
    
    # Running timecode
    mins = int(time_sec // 60)
    secs = int(time_sec % 60)
    frames = int((time_sec - int(time_sec)) * FPS)
    tc_str = f"TC: 00:{mins:02d}:{secs:02d}:{frames:02d}"
    cv2.putText(frame, tc_str, (50, h - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (220, 220, 220), 2, cv2.LINE_AA)
    cv2.putText(frame, f"SPECIMEN ARCHIVE | {tag}", (w - 580, h - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 200, 255), 1, cv2.LINE_AA)
    
    # Corner brackets
    blen, col = 35, (100, 150, 180)
    for cx, cy in [(35, 35), (w - 35, 35), (35, h - 35), (w - 35, h - 35)]:
        dx = blen if cx < w//2 else -blen
        dy = blen if cy < h//2 else -blen
        cv2.line(frame, (cx, cy), (cx + dx, cy), col, 2)
        cv2.line(frame, (cx, cy), (cx, cy + dy), col, 2)
    return frame

def apply_zoom_pan(img, progress, z_start=1.0, z_end=1.08, dx=0, dy=0):
    scale = z_start + (z_end - z_start) * progress
    nh, nw = int(H * scale), int(W * scale)
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
    
    # Crop to W x H
    start_x = int((nw - W) / 2 + dx * progress)
    start_y = int((nh - H) / 2 + dy * progress)
    start_x = np.clip(start_x, 0, nw - W)
    start_y = np.clip(start_y, 0, nh - H)
    return resized[start_y:start_y+H, start_x:start_x+W]

# ----------------- Shot Rendering Logic -----------------

def render_all_shots():
    snow = SnowEngine(350)
    
    # 15 Shot definitions: (img_path, num_frames, shot_name, fx_type, tag_str)
    shots_def = [
        # 1. 0.0s - 3.8s (114f): Lake Aerial Drone
        ("public/img/roopkund_lake_aerial.jpg", 114, "shot_01", "aerial_zoom", "HIGH ALTITUDE SATELLITE"),
        # 2. 3.8s - 5.5s (51f): Title Card Punch
        ("public/img/roopkund_title_card.jpg", 51, "shot_02", "title_punch", "CLASSIFIED DOSSIER"),
        # 3. 5.5s - 9.0s (105f): Ribs and Skull in Ice
        ("public/img/roopkund_skeletons_ice.jpg", 105, "shot_03", "ice_shimmer", "SPECIMEN SKELETAL CLUSTER"),
        # 4. 9.0s - 12.5s (105f): 1942 British Ranger
        ("public/img/roopkund_ranger_1942.jpg", 105, "shot_04", "archival_grain", "1942 BRITISH FOREST PATROL"),
        # 5. 12.5s - 16.5s (120f): WWII Secret Dossier
        ("public/img/roopkund_ww2_dossier.jpg", 120, "shot_05", "tactical_map", "WAR OFFICE INTELLIGENCE"),
        # 6. 16.5s - 20.5s (120f): Forensic UV Lab
        ("public/img/roopkund_forensic_lab.jpg", 120, "shot_06", "laser_scan", "ANTHROPOLOGY FORENSIC LAB"),
        # 7. 20.5s - 25.0s (135f): 9th Century Pilgrims
        ("public/img/roopkund_pilgrims_blizzard.jpg", 135, "shot_07", "blizzard_pan", "850 CE PILGRIMAGE ROUTE"),
        # 8. 25.0s - 28.5s (105f): Skull Fracture Macro
        ("public/img/roopkund_skull_fracture.jpg", 105, "shot_08", "light_sweep", "CRANIAL TRAUMA ANALYSIS"),
        # 9. 28.5s - 32.0s (105f): 3D Mesh HUD Calipers
        ("public/img/roopkund_skull_scan_hud.jpg", 105, "shot_09", "hud_pulse", "BLUNT FORCE SPHERICAL IMPACT"),
        # 10. 32.0s - 36.5s (135f): Lethal Hailstorm
        ("public/img/roopkund_hailstorm_lethal.jpg", 135, "shot_10", "hail_impact", "METEOROLOGICAL SUPERCELL"),
        # 11. 36.5s - 41.5s (150f): DNA Discovery Map
        ("public/img/roopkund_dna_discovery.jpg", 150, "shot_11", "dna_pan", "NATURE 2019 GENOMIC STUDY"),
        # 12. 41.5s - 46.5s (150f): Timeline Graph
        ("public/img/roopkund_timeline_graph.jpg", 150, "shot_12", "graph_scan", "1,000 YEAR TIME GAP"),
        # 13. 46.5s - 52.0s (165f): Mediterranean Travelers
        ("public/img/roopkund_mediterranean_travelers.jpg", 165, "shot_13", "traveler_zoom", "EASTERN MEDITERRANEAN ORIGIN"),
        # 14. 52.0s - 55.0s (90f): Lake Aerial Twilight
        ("public/img/roopkund_lake_aerial.jpg", 90, "shot_14", "reverse_pull", "UNSOLVED HIMALAYAN MYSTERY"),
        # 15. 55.0s - 58.0s (90f): Outro Card
        ("public/img/roopkund_outro_card.jpg", 90, "shot_15", "brand_pulse", "NIGHTINGALE FILMS VERIFIED")
    ]
    
    shot_files = []
    current_time_sec = 0.0
    
    for idx, (path, n_frames, name, fx, tag) in enumerate(shots_def):
        out_mp4 = f"{OUTPUT_DIR}/{name}.mp4"
        shot_files.append(out_mp4)
        print(f"[{idx+1}/15] Rendering {name} ({n_frames} frames)...")
        
        base_img = cv2.imread(path)
        base_img = cv2.resize(base_img, (W, H))
        
        # Open FFmpeg pipe
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "bgr24",
            "-s", f"{W}x{H}", "-r", str(FPS),
            "-i", "-",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p",
            out_mp4
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        
        for f in range(n_frames):
            prog = f / max(1, n_frames - 1)
            time_now = current_time_sec + (f / FPS)
            
            # 1. Base motion
            if fx == "aerial_zoom":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.08)
                frame = snow.update_and_render(frame, f, 1.0)
            elif fx == "title_punch":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.04)
                # Red pulse
                red_val = int(25 * np.sin(prog * np.pi))
                frame[:, :, 2] = np.clip(frame[:, :, 2].astype(np.int16) + red_val, 0, 255).astype(np.uint8)
            elif fx == "ice_shimmer":
                frame = apply_zoom_pan(base_img, prog, 1.05, 1.0, dy=-30)
                # Shimmer wave
                shimmer = (np.sin(np.linspace(0, 10, H)[:, None] + f * 0.15) * 15).astype(np.int16)
                b = np.clip(frame[:, :, 0].astype(np.int16) + shimmer, 0, 255).astype(np.uint8)
                frame[:, :, 0] = b
                frame = snow.update_and_render(frame, f, 0.7)
            elif fx == "archival_grain":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.06)
                # 16mm grain
                grain = np.random.normal(0, 18, (H, W, 3)).astype(np.int16)
                frame = np.clip(frame.astype(np.int16) + grain, 0, 255).astype(np.uint8)
                frame = snow.update_and_render(frame, f, 1.2)
            elif fx == "tactical_map":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.10)
                # Red tactical sonar ring
                cx, cy = W//2, H//2
                radius = int((f % 30) * 8) + 10
                cv2.circle(frame, (cx, cy), radius, (0, 0, 255), 2)
                cv2.circle(frame, (cx, cy), 6, (0, 0, 255), -1)
            elif fx == "laser_scan":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.05)
                # Vertical laser scanline
                scan_y = int((f * 9) % H)
                cv2.line(frame, (0, scan_y), (W, scan_y), (255, 255, 0), 2)
                cv2.line(frame, (0, max(0, scan_y - 2)), (W, max(0, scan_y - 2)), (255, 150, 0), 1)
            elif fx == "blizzard_pan":
                frame = apply_zoom_pan(base_img, prog, 1.06, 1.06, dx=int(60 * prog))
                frame = snow.update_and_render(frame, f, 1.8)
            elif fx == "light_sweep":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.08)
                # Moving flashlight radial mask
                mask = np.zeros((H, W), dtype=np.float32)
                lx = int(W * 0.35 + W * 0.3 * np.sin(prog * np.pi))
                ly = int(H * 0.45)
                cv2.circle(mask, (lx, ly), 450, 1.0, -1)
                mask = cv2.GaussianBlur(mask, (101, 101), 0)
                frame = (frame * (0.4 + 0.6 * mask[:, :, None])).astype(np.uint8)
            elif fx == "hud_pulse":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.05)
                # Reticle pulse
                reticle_pulse = int(15 * np.sin(f * 0.3))
                cv2.circle(frame, (W//2, H//2 - 40), 120 + reticle_pulse, (0, 255, 255), 2)
            elif fx == "hail_impact":
                # Camera shake on hail thuds
                shake_x = int(np.random.uniform(-8, 8)) if (f % 15 < 4) else 0
                shake_y = int(np.random.uniform(-8, 8)) if (f % 15 < 4) else 0
                frame = apply_zoom_pan(base_img, prog, 1.05, 1.10, dx=shake_x, dy=shake_y)
                # Falling hail ice chunks
                for _ in range(6):
                    hx = int(np.random.uniform(100, W - 100))
                    hy = int((f * 35 + np.random.uniform(0, H)) % H)
                    cv2.circle(frame, (hx, hy), int(np.random.uniform(8, 16)), (250, 250, 255), -1)
            elif fx == "dna_pan":
                frame = apply_zoom_pan(base_img, prog, 1.04, 1.04, dx=int(-40 * prog))
                # Pulse nodes
                pulse_a = int(128 + 127 * np.sin(f * 0.2))
                cv2.circle(frame, (int(W * 0.3), int(H * 0.5)), 12, (0, 220, pulse_a), -1)
                cv2.circle(frame, (int(W * 0.72), int(H * 0.42)), 12, (0, pulse_a, 255), -1)
            elif fx == "graph_scan":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.03)
                # Scan bar
                bar_y = int(320 + (f * 5) % 400)
                cv2.line(frame, (250, bar_y), (850, bar_y), (0, 255, 100), 2)
                cv2.line(frame, (1070, bar_y), (1670, bar_y), (0, 200, 255), 2)
            elif fx == "traveler_zoom":
                frame = apply_zoom_pan(base_img, prog, 1.10, 1.0)
                frame = snow.update_and_render(frame, f, 0.9)
            elif fx == "reverse_pull":
                frame = apply_zoom_pan(base_img, prog, 1.08, 1.0)
                # Dusk blue grade
                frame[:, :, 0] = np.clip(frame[:, :, 0].astype(np.int16) + 18, 0, 255).astype(np.uint8)
                frame = snow.update_and_render(frame, f, 0.5)
            elif fx == "brand_pulse":
                frame = apply_zoom_pan(base_img, prog, 1.0, 1.04)
            else:
                frame = base_img.copy()
            
            # Tactical HUD (on cinematic shots)
            if fx not in ["title_punch", "graph_scan", "brand_pulse"]:
                frame = draw_tactical_hud(frame, f, time_now, tag=tag)
            
            proc.stdin.write(frame.tobytes())
            
        proc.stdin.close()
        proc.wait()
        current_time_sec += (n_frames / FPS)
        
    print(f"All 15 shots rendered. Total runtime: {current_time_sec:.2f}s")
    return shot_files

def concatenate_and_master():
    print("[Mastering] Concatenating 15 shots...")
    concat_list = f"{OUTPUT_DIR}/shots_concat.txt"
    with open(concat_list, "w") as f:
        for i in range(1, 16):
            f.write(f"file 'shot_{i:02d}.mp4'\n")
            
    raw_video = f"{OUTPUT_DIR}/roopkund_raw_video.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c", "copy", raw_video
    ], check=True)
    
    print("[Mastering] Burning Devanagari subtitles & muxing broadcast audio...")
    # Master 1080p 16:9
    master_1080 = "docs/roopkund_1080.mp4"
    sub_filter = "subtitles=audio/roopkund_subs.ass:fontsdir=assets"
    
    cmd_1080 = [
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", "audio/roopkund_master.aac",
        "-vf", sub_filter,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        "-movflags", "+faststart",
        master_1080
    ]
    subprocess.run(cmd_1080, check=True)
    print(f"[Mastering] Created {master_1080}")
    
    # 720p 16:9
    print("[Mastering] Rendering 720p version...")
    master_720 = "docs/roopkund_720.mp4"
    cmd_720 = [
        "ffmpeg", "-y",
        "-i", master_1080,
        "-vf", "scale=1280:720:flags=lanczos",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "copy",
        "-movflags", "+faststart",
        master_720
    ]
    subprocess.run(cmd_720, check=True)
    
    # 480p 16:9
    print("[Mastering] Rendering 480p version...")
    master_480 = "docs/roopkund_480.mp4"
    cmd_480 = [
        "ffmpeg", "-y",
        "-i", master_1080,
        "-vf", "scale=854:480:flags=lanczos",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "copy",
        "-movflags", "+faststart",
        master_480
    ]
    subprocess.run(cmd_480, check=True)
    
    # 9:16 Vertical Shorts 720x1280
    print("[Mastering] Rendering 9:16 Vertical Shorts cut...")
    master_vert = "docs/roopkund_vertical_720.mp4"
    filter_vert = (
        "[0:v]split=2[fg][bg];"
        "[bg]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=25:5[blurred];"
        "[fg]scale=720:1280:force_original_aspect_ratio=decrease[scaled];"
        "[blurred][scaled]overlay=(W-w)/2:(H-h)/2[v]"
    )
    cmd_vert = [
        "ffmpeg", "-y",
        "-i", master_1080,
        "-filter_complex", filter_vert,
        "-map", "[v]", "-map", "0:a",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "copy",
        "-movflags", "+faststart",
        master_vert
    ]
    subprocess.run(cmd_vert, check=True)
    
    # Poster frame at 03.5s
    subprocess.run([
        "ffmpeg", "-y", "-ss", "00:00:04.500",
        "-i", master_1080,
        "-vframes", "1", "-q:v", "2",
        "docs/roopkund_poster.jpg"
    ], check=True)
    print("Mastering pipeline complete!")

if __name__ == "__main__":
    render_all_shots()
    concatenate_and_master()
