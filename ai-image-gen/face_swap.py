#!/usr/bin/env python3
"""Transplant the real model's face (donor) onto the champagne body's head.
Rigid similarity transform from eye centers + feathered oval mask + color match.
Restores the maang tikka afterwards. Saves face_swap_stage.png."""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import math

donor = Image.open("ref_element-1-FRONT_(1).png").convert("RGB")   # 629x629
body = Image.open("current_body.png").convert("RGB")               # 1536x2752

# --- landmark estimates (eye centers) ---
# donor (629 space)
dL, dR = (305.0, 210.0), (418.0, 205.0)
# target (body space)
tL, tR = (745.0, 510.0), (870.0, 502.0)

dm = ((dL[0]+dR[0])/2, (dL[1]+dR[1])/2)
tm = ((tL[0]+tR[0])/2, (tL[1]+tR[1])/2)
d_dist = math.dist(dL, dR); t_dist = math.dist(tL, tR)
scale = t_dist / d_dist
d_ang = math.atan2(dR[1]-dL[1], dR[0]-dL[0])
t_ang = math.atan2(tR[1]-tL[1], tR[0]-tL[0])
rot = t_ang - d_ang
print(f"scale={scale:.3f} rot={math.degrees(rot):.1f}deg")

# affine: donor->target  (PIL AffineTransform maps OUTPUT->INPUT)
cos, sin = math.cos(rot), math.sin(rot)
a = cos/scale; b = sin/scale; c = dm[0] - (a*tm[0] + b*tm[1])
d_ = -sin/scale; e = cos/scale; f = dm[1] - (d_*tm[0] + e*tm[1])
tfm = (a, b, c, d_, e, f)

warped = donor.transform(body.size, Image.AFFINE, tfm, resample=Image.BICUBIC)

# --- feathered oval mask in donor space ---
mask = Image.new("L", donor.size, 0)
dr = ImageDraw.Draw(mask)
dr.ellipse((212, 95, 512, 475), fill=255)          # face oval (temples..chin)
mask = mask.filter(ImageFilter.GaussianBlur(22))
wmask = mask.transform(body.size, Image.AFFINE, tfm, resample=Image.BILINEAR)

wa = np.asarray(warped).astype(np.float32)
ba = np.asarray(body).astype(np.float32)
m = (np.asarray(wmask).astype(np.float32) / 255.0)[:, :, None]

# color match: donor pasted mean -> target region mean (warm golden hour)
sel = m[:, :, 0] > 0.6
if sel.sum() > 100:
    src_mean = wa[sel].mean(0); dst_mean = ba[sel].mean(0)
    gain = np.clip(dst_mean / np.maximum(src_mean, 1e-3), 0.6, 1.5)
    print("skin gain:", [round(float(g), 3) for g in gain])
    wa = np.clip(wa * gain[None, None, :], 0, 255)

comp = ba*(1 - m) + wa*m

# --- restore maang tikka from original body ---
tik = np.zeros(body.size[::-1], np.float32)   # HxW
ty1, ty2, tx1, tx2 = 325, 520, 715, 865
yy, xx = np.mgrid[0:ty2-ty1, 0:tx2-tx1]
fade = np.clip(np.minimum(np.minimum(xx, tx2-tx1-1-xx), np.minimum(yy, ty2-ty1-1-yy)) / 16.0, 0, 1)
tik[ty1:ty2, tx1:tx2] = fade
tik = np.asarray(Image.fromarray((tik*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)[:, :, None]/255.0
comp = comp*(1 - tik) + ba*tik

Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).save("face_swap_stage.png")
out = Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8))
out.crop((560, 330, 1060, 830)).save("/home/user/fs_face.jpg", quality=94)
print("face_swap_stage.png saved")
