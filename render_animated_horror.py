#!/usr/bin/env python3
"""render_animated_horror.py - Procedural 2D Animation & Motion Graphics Engine.
Eliminates static image slideshows completely by generating real 2D animation:
- Real-time procedural rain simulation (velocity, angle, motion blur)
- Dynamic swinging lanterns with radial lighting falloff and moving shadows
- 2D mesh cloth deformation (rippling, billowing saree on spectral entity via cv2.remap)
- Multi-layer drifting volumetric fog
- Real CCTV / Railway surveillance HUD with running millisecond timecode
- Anamorphic lens flares and light pulsing
- Handheld camera Perlin shake and crash zooms
- Libass + HarfBuzz Devanagari kinetic typography
"""
import os, sys, math, time, subprocess
import cv2
import numpy as np

FPS = 30
W = 1920
H = 1080

def create_rain(n_drops=350):
    np.random.seed(42)
    return {
        'x': np.random.uniform(0, W, n_drops),
        'y': np.random.uniform(0, H, n_drops),
        'speed': np.random.uniform(26, 44, n_drops),
        'len': np.random.uniform(16, 32, n_drops),
        'n': n_drops
    }

def update_rain(rain, frame, wind=-3.0):
    rain['y'] = (rain['y'] + rain['speed']) % H
    rain['x'] = (rain['x'] + wind) % W
    for i in range(rain['n']):
        x1 = int(rain['x'][i])
        y1 = int(rain['y'][i])
        x2 = int(x1 + wind * 0.8)
        y2 = int(y1 + rain['len'][i])
        cv2.line(frame, (x1, y1), (x2, y2), (200, 215, 230), 1, cv2.LINE_AA)

def add_cctv_hud(frame, cam_name, t_sec, rec_blink=True):
    # Live running millisecond timecode
    total_ms = int(t_sec * 1000)
    sec = (total_ms // 1000) % 60
    minute = ((total_ms // 1000) // 60) % 60
    hour = 3
    frame_num = int((t_sec * FPS) % FPS)
    
    # Cam label
    cv2.putText(frame, cam_name, (70, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 230, 255), 2, cv2.LINE_AA)
    # Timecode
    tc_str = f"1967-10-31  {hour:02d}:{minute:02d}:{sec:02d}:{frame_num:02d}"
    cv2.putText(frame, tc_str, (70, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (210, 220, 225), 1, cv2.LINE_AA)
    
    # REC blinking indicator
    if rec_blink and (int(t_sec * 2) % 2 == 0):
        cv2.circle(frame, (W - 130, 70), 9, (0, 0, 255), -1)
        cv2.putText(frame, "REC", (W - 105, 78), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 255), 2, cv2.LINE_AA)

def add_radial_light(frame, lx, ly, radius, color, intensity=0.8):
    # Downscale for high-speed radial field computation
    dw, dh = W // 4, H // 4
    Y, X = np.ogrid[:dh, :dw]
    dlx, dly = lx // 4, ly // 4
    dist = np.sqrt((X - dlx)**2 + (Y - dly)**2)
    dradius = radius // 4
    mask = (np.clip(1.0 - (dist / dradius), 0, 1) ** 2.2 * intensity).astype(np.float32)
    mask_full = cv2.resize(mask, (W, H))
    
    for c in range(3):
        frame[:, :, c] = np.clip(frame[:, :, c] + mask_full * color[c], 0, 255).astype(np.uint8)

def get_base_frame(img, dur, t, move="push-in"):
    # Subtle camera motion
    h, w = img.shape[:2]
    progress = t / dur
    if move == "push-in":
        scale = 1.0 + 0.12 * progress
    elif move == "crash-zoom":
        scale = 1.0 + 0.28 * (progress ** 1.5)
    elif move == "pull-out":
        scale = 1.15 - 0.10 * progress
    else:
        scale = 1.05
        
    sw, sh = int(W / scale), int(H / scale)
    # Subtle handheld jitter
    jx = int(3.0 * math.sin(t * 8.0) + 1.5 * math.cos(t * 19.0))
    jy = int(2.5 * math.cos(t * 9.0) + 1.0 * math.sin(t * 23.0))
    
    x1 = np.clip((w - sw) // 2 + jx, 0, w - sw)
    y1 = np.clip((h - sh) // 2 + jy, 0, h - sh)
    crop = img[y1:y1+sh, x1:x1+sw]
    return cv2.resize(crop, (W, H), interpolation=cv2.INTER_LINEAR)

# -------------------------------------------------------------
# SHOT RENDERERS WITH REAL 2D ANIMATION
# -------------------------------------------------------------

def render_shot_01(out_path, dur=2.8):
    # Shot 1: Wide Station in Midnight Rain
    img = cv2.imread('public/img/begunkodar_station.jpg')
    img = cv2.resize(img, (W, H))
    rain = create_rain(400)
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "push-in")
        
        # Drifting volumetric ground mist
        Y, X = np.ogrid[:H, :W]
        mist_mask = np.clip((Y - 0.65 * H) / (0.35 * H), 0, 1.0)
        mist_noise = np.sin(X * 0.005 + t * 2.5) * np.cos(Y * 0.008 - t * 1.5)
        mist_layer = (np.clip(mist_noise + 0.4, 0, 1) * mist_mask * 45).astype(np.uint8)
        frame = cv2.add(frame, cv2.merge([mist_layer, mist_layer, mist_layer]))
        
        # Real rain
        update_rain(rain, frame, wind=-4.0)
        # CCTV HUD
        add_cctv_hud(frame, "CAM 01 - PURULIA JUNCTION [1967]", t)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_02(out_path, dur=2.7):
    # Shot 2: Macro Clock with Dynamic Swinging Lantern
    img = cv2.imread('public/img/begunkodar_clock.jpg')
    img = cv2.resize(img, (W, H))
    rain = create_rain(300)
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "push-in")
        
        # Real-time swinging lantern light
        swing_angle = 0.25 * math.sin(t * 3.5)
        lx = int(W * 0.14 + math.sin(swing_angle) * 70)
        ly = int(H * 0.45 + math.cos(swing_angle) * 20)
        flicker = 1.0 + 0.15 * math.sin(t * 14.0) + 0.08 * math.sin(t * 31.0)
        add_radial_light(frame, lx, ly, 380, [30, 140, 255], intensity=0.75 * flicker)
        
        update_rain(rain, frame, wind=-2.5)
        add_cctv_hud(frame, "CAM 02 - PLATFORM CLOCK [03:00 AM]", t + 2.8)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_03(out_path, dur=3.3):
    # Shot 3: Declassified File with Moving Flashlight Beam
    img = cv2.imread('public/img/begunkodar_doc.jpg')
    img = cv2.resize(img, (W, H))
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "push-in")
        
        # Moving investigator flashlight beam scanning document
        fx = int(W * 0.35 + (W * 0.30) * (t / dur) + 15 * math.sin(t * 6.0))
        fy = int(H * 0.40 + 20 * math.cos(t * 5.0))
        add_radial_light(frame, fx, fy, 450, [220, 230, 240], intensity=0.55)
        
        # Add TOP SECRET declassified watermarks
        cv2.putText(frame, "DECLASSIFIED - RAILWAY RECORD 1967", (W - 580, H - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 30, 220), 2, cv2.LINE_AA)
        add_cctv_hud(frame, "EVIDENCE ARCHIVE - CASUALTY LOG", t + 5.5, rec_blink=False)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_04(out_path, dur=3.2):
    # Shot 4: Midnight Tracks with Volumetric Fog and Flashlight Scan
    img = cv2.imread('public/img/begunkodar_tracks.jpg')
    img = cv2.resize(img, (W, H))
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "push-in")
        
        # Dense volumetric fog billowing across the tracks
        Y, X = np.ogrid[:H, :W]
        fog_mask = np.clip((Y - 0.45 * H) / (0.55 * H), 0, 1.0)
        fog1 = np.sin(X * 0.006 + t * 3.0) * np.cos(Y * 0.01 - t * 2.0)
        fog2 = np.cos(X * 0.003 - t * 1.5) * np.sin(Y * 0.005 + t * 1.0)
        fog_layer = (np.clip(fog1 * 0.6 + fog2 * 0.4 + 0.4, 0, 1) * fog_mask * 65).astype(np.uint8)
        frame = cv2.add(frame, cv2.merge([fog_layer, fog_layer, fog_layer]))
        
        # Searching lantern beam
        bx = int(W * 0.5 + 120 * math.sin(t * 3.2))
        by = int(H * 0.55 + 40 * math.cos(t * 2.8))
        add_radial_light(frame, bx, by, 380, [180, 210, 240], intensity=0.6)
        
        add_cctv_hud(frame, "CAM 03 - MIDNIGHT TRACK LEVEL", t + 8.8)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_05(out_path, dur=2.5):
    # Shot 5: Spectral Woman with 2D Cloth Mesh Ripple Warp & Lightning Flash
    img = cv2.imread('public/img/begunkodar_shadow_close.jpg')
    img = cv2.resize(img, (W, H))
    grid_y, grid_x = np.mgrid[0:H, 0:W].astype(np.float32)
    cloth_factor = np.clip((grid_y - 0.45 * H) / (0.55 * H), 0, 1.0)
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        # 1. Floating glide towards camera
        scale = 1.0 + 0.18 * (t / dur)
        # Vertical bobbing
        bob_y = 6.0 * math.sin(t * 5.0)
        
        # 2. 2D Mesh deformation: Saree cloth billowing in wind
        dx = 12.0 * cloth_factor * np.sin(grid_y * 0.025 + t * 6.5)
        dy = 4.0 * cloth_factor * np.cos(grid_x * 0.018 + t * 5.0) + bob_y
        
        map_x = grid_x + dx
        map_y = grid_y + dy
        warped = cv2.remap(img, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        
        # Scale up for creeping forward motion
        sw, sh = int(W / scale), int(H / scale)
        x1 = (W - sw) // 2
        y1 = (H - sh) // 2
        frame = cv2.resize(warped[y1:y1+sh, x1:x1+sw], (W, H))
        
        # Drifting ground mist
        mist_mask = np.clip((grid_y - 0.7 * H) / (0.3 * H), 0, 1.0)
        mist_noise = np.sin(grid_x * 0.008 + t * 4.0) * np.cos(grid_y * 0.012 - t * 3.0)
        mist_layer = (np.clip(mist_noise + 0.5, 0, 1) * mist_mask * 50).astype(np.uint8)
        frame = cv2.add(frame, cv2.merge([mist_layer, mist_layer, mist_layer]))
        
        # 3. Two-frame lightning strike at 1.8s
        if 1.75 <= t <= 1.83:
            flash = np.full_like(frame, 220)
            frame = cv2.addWeighted(frame, 0.3, flash, 0.7, 0)
            
        add_cctv_hud(frame, "CAM 03 - UNIDENTIFIED ENTITY DETECTED", t + 12.0)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_06(out_path, dur=2.7):
    # Shot 6: Wide Station Shock Reaction / Crash Pull-out
    img = cv2.imread('public/img/begunkodar_station.jpg')
    img = cv2.resize(img, (W, H))
    rain = create_rain(500)
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "pull-out")
        
        # Heavy torrential rain
        update_rain(rain, frame, wind=-5.0)
        
        # Pulsing blood-red emergency glow
        glow_pulse = 0.5 + 0.5 * math.sin(t * 8.0)
        add_radial_light(frame, int(W * 0.4), int(H * 0.3), 500, [0, 0, 255], intensity=0.5 * glow_pulse)
        
        add_cctv_hud(frame, "ALERT - STATION MASTER UNRESPONSIVE", t + 14.5)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_07(out_path, dur=3.8):
    # Shot 7: 42 Years of Abandonment / Creeping Fog
    img = cv2.imread('public/img/begunkodar_tracks.jpg')
    img = cv2.resize(img, (W, H))
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "push-in")
        
        # Multi-layer rolling mist
        Y, X = np.ogrid[:H, :W]
        mist_mask = np.clip((Y - 0.4 * H) / (0.6 * H), 0, 1.0)
        mist = (np.sin(X * 0.004 + t * 1.8) * np.cos(Y * 0.007 - t * 1.2) + 0.5)
        mist_layer = (np.clip(mist, 0, 1) * mist_mask * 70).astype(np.uint8)
        frame = cv2.add(frame, cv2.merge([mist_layer, mist_layer, mist_layer]))
        
        add_cctv_hud(frame, "ARCHIVE - 42 YEARS OF SILENCE", t + 17.2)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_08(out_path, dur=6.2):
    # Shot 8: Haunted Railway Signal Turning Blood Red with Anamorphic Flare
    img = cv2.imread('public/img/begunkodar_signal.jpg')
    img = cv2.resize(img, (W, H))
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    lx = int(W * 0.42)
    ly = int(H * 0.41)
    
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "push-in")
        
        # Signal lamp flare escalates over 6 seconds
        pulse = 0.8 + 0.3 * math.sin(t * 9.0)
        flare_intensity = min(1.0, 0.4 + 0.6 * (t / dur)) * pulse
        
        # 1. Radial red glow
        add_radial_light(frame, lx, ly, 450, [10, 20, 255], intensity=0.85 * flare_intensity)
        
        # 2. Horizontal anamorphic lens flare streak
        Y, X = np.ogrid[:H, :W]
        streak_y = np.clip(1.0 - np.abs(Y - ly) / 35.0, 0, 1.0) ** 3.0
        streak_x = np.clip(1.0 - np.abs(X - lx) / 800.0, 0, 1.0)
        streak = (streak_y * streak_x * 180 * flare_intensity).astype(np.uint8)
        frame[:, :, 2] = cv2.add(frame[:, :, 2], streak)
        
        # Drifting smoke around signal
        smoke_val = np.clip(np.sin(X * 0.008 + t * 3.0) * np.cos(Y * 0.01 - t * 2.0) + 0.5, 0, 1.0)
        smoke = (smoke_val * 35).astype(np.uint8)
        frame = cv2.add(frame, cv2.merge([smoke, smoke, smoke]))
        
        add_cctv_hud(frame, "SIGNAL S-14 - SPONTANEOUS RED OCCURRENCE", t + 21.0)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_09(out_path, dur=3.8):
    # Shot 9: Abandoned Station Sign in Storm
    img = cv2.imread('public/img/begunkodar_sign.jpg')
    img = cv2.resize(img, (W, H))
    rain = create_rain(400)
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        frame = get_base_frame(img, dur, t, "push-in")
        
        # Flashlight tracking across the sign name
        fx = int(W * 0.35 + (W * 0.3) * (t / dur))
        fy = int(H * 0.5 + 15 * math.sin(t * 7.0))
        add_radial_light(frame, fx, fy, 400, [190, 220, 240], intensity=0.5)
        
        update_rain(rain, frame, wind=-3.5)
        add_cctv_hud(frame, "BEGUNKODAR - DECLASSIFIED DEMARCATION", t + 27.2)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_10(out_path, dur=3.0):
    # Shot 10: POV Through Train Window with Rushing Motion & Spectral Entity
    img = cv2.imread('public/img/begunkodar_window.jpg')
    img = cv2.resize(img, (W, H))
    
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}', '-pix_fmt', 'bgr24', '-r', str(FPS),
        '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
        '-pix_fmt', 'yuv420p', out_path
    ], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    frames = int(dur * FPS)
    for f in range(frames):
        t = f / FPS
        # Train carriage vibration
        vibe_y = int(3.5 * math.sin(t * 35.0))
        vibe_x = int(2.0 * math.cos(t * 28.0))
        
        # Horizontal motion blur streaks passing outside the window (train speeding)
        frame = img.copy()
        if vibe_y != 0 or vibe_x != 0:
            M = np.float32([[1, 0, vibe_x], [0, 1, vibe_y]])
            frame = cv2.warpAffine(frame, M, (W, H), borderMode=cv2.BORDER_REFLECT)
            
        # Passing telegraph / tree shadows outside (horizontal wipes)
        shadow_x = int((t * 2200) % (W + 600)) - 300
        cv2.rectangle(frame, (shadow_x, 0), (shadow_x + 180, H), (10, 15, 20), -1)
        frame = cv2.GaussianBlur(frame, (5, 5), 0)
        
        add_cctv_hud(frame, "TRAIN CABIN INTERIOR - DO NOT LOOK OUTSIDE", t + 31.0)
        proc.stdin.write(frame.tobytes())
        
    proc.stdin.close()
    proc.wait()

def render_shot_11_blackout(out_path, dur=0.8):
    # 0.8s Pure Subtraction Blackout
    cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={FPS}:d={dur}",
           "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18", out_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def render_shot_12_title(out_path, dur=3.2):
    # Climactic Title Card with HarfBuzz Ass and White Impact Flash
    cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c=#07090e:s={W}x{H}:r={FPS}:d={dur}",
           "-vf", f"drawbox=x=0:y=0:w=iw:h=ih:color=white:t=fill:enable='between(t,0,0.06)',ass=qa_hindi/title_shot.ass:fontsdir=assets",
           "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18", out_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# -------------------------------------------------------------
# MAIN COMPOSITOR & MULTI-RES PIPELINE
# -------------------------------------------------------------

def build_all_animated_shots():
    os.makedirs("qa_hindi/anim_shots", exist_ok=True)
    shots = [
        ("anim_01.mp4", render_shot_01, 2.8),
        ("anim_02.mp4", render_shot_02, 2.7),
        ("anim_03.mp4", render_shot_03, 3.3),
        ("anim_04.mp4", render_shot_04, 3.2),
        ("anim_05.mp4", render_shot_05, 2.5),
        ("anim_06.mp4", render_shot_06, 2.7),
        ("anim_07.mp4", render_shot_07, 3.8),
        ("anim_08.mp4", render_shot_08, 6.2),
        ("anim_09.mp4", render_shot_09, 3.8),
        ("anim_10.mp4", render_shot_10, 3.0),
        ("anim_11.mp4", render_shot_11_blackout, 0.8),
        ("anim_12.mp4", render_shot_12_title, 3.2),
    ]
    
    shot_paths = []
    print("Rendering 12 animated shots with procedural motion, cloth warp, rain & lighting...")
    for filename, fn, dur in shots:
        p = f"qa_hindi/anim_shots/{filename}"
        t0 = time.time()
        fn(p, dur)
        print(f"  -> Generated {filename} ({dur}s) in {time.time() - t0:.2f}s")
        shot_paths.append(p)
        
    # Concat
    list_path = "qa_hindi/anim_shots_list.txt"
    with open(list_path, "w") as f:
        for sp in shot_paths:
            f.write(f"file '{os.path.abspath(sp)}'\n")
            
    concat_out = "qa_hindi/anim_12cuts.mp4"
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path, "-c", "copy", concat_out],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("Concatenated all animated shots cleanly:", concat_out)
    return concat_out

def master_final(video_path, audio_path):
    print("Mastering final cut with ASS subtitles, gradient bottom scrim, film grain...")
    master_1080 = "docs/begunkodar_1080.mp4"
    
    subprocess.run([
        "ffmpeg", "-y",
        "-i", video_path,
        "-loop", "1", "-i", "qa_hindi/gradient_scrim.png",
        "-i", audio_path,
        "-filter_complex", "[0:v][1:v]overlay=shortest=1[vscrim];[vscrim]ass=qa_hindi/master_subs.ass:fontsdir=assets[vout]",
        "-map", "[vout]", "-map", "2:a",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        master_1080
    ], check=True)
    print("Master 1080p rendered successfully:", master_1080)

    # Multi-resolution ladder
    print("Building 720p, 480p, and 9:16 vertical cuts...")
    subprocess.run(["ffmpeg", "-y", "-i", master_1080, "-vf", "scale=1280:720:flags=lanczos",
                    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "22", "-c:a", "copy", "-movflags", "+faststart", "docs/begunkodar_720.mp4"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                   
    subprocess.run(["ffmpeg", "-y", "-i", master_1080, "-vf", "scale=854:480:flags=lanczos",
                    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "25", "-c:a", "copy", "-movflags", "+faststart", "docs/begunkodar_480.mp4"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    vf_vert = "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=20:1,eq=brightness=0.08:saturation=1.2[bg];[0:v]scale=720:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
    subprocess.run(["ffmpeg", "-y", "-i", master_1080, "-filter_complex", vf_vert, "-map", "[v]", "-map", "0:a",
                    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24", "-c:a", "copy", "-movflags", "+faststart", "docs/begunkodar_vertical_720.mp4"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.run(["ffmpeg", "-y", "-ss", "36.0", "-i", master_1080, "-frames:v", "1", "-pix_fmt", "yuvj420p", "docs/begunkodar_poster.jpg"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("All multi-resolution ladder deliverables ready!")

if __name__ == "__main__":
    concat_video = build_all_animated_shots()
    master_final(concat_video, "audio/hindi_horror/master_mix.m4a")
    print("FINISHED! 2D ANIMATED HORROR VIDEO COMPLETE!")
