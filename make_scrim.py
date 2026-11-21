#!/usr/bin/env python3
import cv2, numpy as np

H, W = 1080, 1920
scrim = np.zeros((H, W, 4), dtype=np.uint8)

# Transparent down to y = 720 (top 67%)
# Smooth cosine ramp from y = 720 to y = 1080
for y in range(720, H):
    prog = (y - 720) / (H - 720)
    # Cosine ease-in ease-out
    alpha = int(190 * (1 - np.cos(prog * np.pi * 0.5)))
    scrim[y, :, 3] = alpha # Alpha channel
    scrim[y, :, :3] = 5    # Very dark navy/black

cv2.imwrite("assets/gradient_scrim.png", scrim)
print("Created assets/gradient_scrim.png")
