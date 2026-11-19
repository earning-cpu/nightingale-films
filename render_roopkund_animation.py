#!/usr/bin/env python3
"""render_roopkund_animation.py — Procedural 2D Animation Engine for Roopkund Skeleton Lake.
Generates 12 high-retention cinematic cuts with snow particle physics, scanning HUD,
cranial trauma highlights, and Devanagari typography.
"""
import os, sys, cv2, numpy as np

WIDTH = 1920
HEIGHT = 1080
FPS = 30

def create_snow_particles(num_particles=300):
    """Initializes high-altitude snow particles with velocities and drift."""
    rng = np.random.default_rng(42)
    x = rng.uniform(0, WIDTH, num_particles)
    y = rng.uniform(0, HEIGHT, num_particles)
    vx = rng.uniform(-4, -1, num_particles) # strong leftward blizzard drift
    vy = rng.uniform(4, 12, num_particles)  # downward velocity
    size = rng.integers(1, 4, num_particles)
    alpha = rng.uniform(0.3, 0.9, num_particles)
    return {"x": x, "y": y, "vx": vx, "vy": vy, "size": size, "alpha": alpha}

def update_snow_particles(snow, frame_idx):
    """Updates snow particle positions with wind turbulence."""
    turbulence = np.sin(frame_idx * 0.1) * 1.5
    snow["x"] += snow["vx"] + turbulence
    snow["y"] += snow["vy"]
    # Wrap around screen
    snow["x"] = np.where(snow["x"] < 0, WIDTH + snow["x"], snow["x"])
    snow["x"] = np.where(snow["x"] >= WIDTH, snow["x"] - WIDTH, snow["x"])
    snow["y"] = np.where(snow["y"] >= HEIGHT, snow["y"] - HEIGHT, snow["y"])

def render_snow_overlay(frame, snow):
    """Renders fast-moving snow streaks onto the frame."""
    overlay = frame.copy()
    for i in range(len(snow["x"])):
        px, py = int(snow["x"][i]), int(snow["y"][i])
        sz = int(snow["size"][i])
        a = float(snow["alpha"][i])
        # Draw motion streak
        cv2.line(overlay, (px, py), (px - int(snow["vx"][i]*1.5), py - int(snow["vy"][i]*1.5)), 
                 (240, 245, 255), sz)
    return cv2.addWeighted(overlay, 0.85, frame, 0.15, 0)

def draw_hud(frame, timecode_str, alt_str="ALT: 5,029m (16,500 FT)", coords="30.2622° N, 79.7317° E", tag="EXPEDITION ARCHIVE"):
    """Draws authentic archaeological / expedition telemetry HUD."""
    h, w = frame.shape[:2]
    # Top header bar
    cv2.putText(frame, "● REC [RAW SENSOR]", (60, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
    cv2.putText(frame, f"LOC: ROOPKUND BASIN | {coords}", (350, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 220, 220), 1, cv2.LINE_AA)
    cv2.putText(frame, alt_str, (w - 450, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 200, 255), 2, cv2.LINE_AA)
    
    # Bottom telemetry
    cv2.putText(frame, f"TC: {timecode_str}", (60, h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (220, 220, 220), 2, cv2.LINE_AA)
    cv2.putText(frame, f"TAG: {tag}", (w - 550, h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (150, 200, 255), 1, cv2.LINE_AA)
    
    # Corner tactical brackets
    bracket_len = 35
    col = (100, 150, 180)
    # TL
    cv2.line(frame, (40, 40), (40 + bracket_len, 40), col, 2)
    cv2.line(frame, (40, 40), (40, 40 + bracket_len), col, 2)
    # TR
    cv2.line(frame, (w - 40, 40), (w - 40 - bracket_len, 40), col, 2)
    cv2.line(frame, (w - 40, 40), (w - 40, 40 + bracket_len), col, 2)
    # BL
    cv2.line(frame, (40, h - 40), (40 + bracket_len, h - 40), col, 2)
    cv2.line(frame, (40, h - 40), (40, h - 40 - bracket_len), col, 2)
    # BR
    cv2.line(frame, (w - 40, h - 40), (w - 40 - bracket_len, h - 40), col, 2)
    cv2.line(frame, (w - 40, h - 40), (w - 40, h - 40 - bracket_len), col, 2)
    return frame

print("Procedural engine utilities loaded.")
