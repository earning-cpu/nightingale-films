#!/usr/bin/env python3
"""
PROJECT NIGHTINGALE — sound design.
Dark documentary score + frame-locked SFX. 90 BPM grid (1 beat = 20 frames @30fps).
Cue map mirrors the Remotion timeline in src/theme.ts (T.*).
"""
import numpy as np
from scipy import signal
from scipy.io import wavfile
import json, os, math

SR = 48000; FPS = 30.0; BPM = 90.0
DUR = 72.5
N = int(SR * DUR)
rng = np.random.default_rng(19790714)

def f2s(fr): return fr / FPS
def s2n(t): return int(round(t * SR))

# ----------------------------- primitives -----------------------------
def env_ad(n, a, d, curve=2.0):
    e = np.zeros(n); na = min(n, max(1, int(a * SR)))
    e[:na] = np.linspace(0, 1, na) ** 0.7
    nd = min(n - na, max(1, int(d * SR)))
    if nd > 0: e[na:na + nd] = np.linspace(1, 0, nd) ** curve
    return e

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [max(20, lo), min(SR * 0.49, hi)], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)

def lp(x, fc, order=2):
    sos = signal.butter(order, min(SR * 0.49, fc), btype='low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)

def hp(x, fc, order=2):
    sos = signal.butter(order, max(20, fc), btype='high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)

def svf_sweep(x, fc_arr, q=1.4, mode='band'):
    n = len(x); out = np.zeros(n); lo = ba = 0.0
    f = 2.0 * np.sin(np.pi * np.clip(fc_arr, 25, SR * 0.42) / SR); qq = 1.0 / q
    for i in range(n):
        h = x[i] - lo - qq * ba
        ba = ba + f[i] * h; lo = lo + f[i] * ba
        out[i] = ba if mode == 'band' else (lo if mode == 'low' else h)
    return out

def make_ir(decay, predelay, damp, seed):
    r = np.random.default_rng(seed); n = int(SR * decay)
    ir = r.standard_normal((n, 2)); t = np.arange(n) / SR
    ir *= np.exp(-t * (5.0 / decay))[:, None]
    ir[:int(predelay * SR)] = 0
    ir = hp(lp(ir, damp), 110)
    ir /= (np.max(np.abs(ir)) + 1e-9)
    return ir * 0.55

IR_S = make_ir(0.5, 0.006, 6500, 11)
IR_M = make_ir(1.3, 0.015, 4000, 22)
IR_L = make_ir(2.8, 0.03, 2800, 33)

def reverb(x, ir, mix=0.25):
    mono = x.ndim == 1
    xs = x[:, None] if mono else x
    wet = np.zeros_like(xs)
    for c in range(xs.shape[1]):
        wet[:, c] = signal.fftconvolve(xs[:, c], ir[:, min(c, ir.shape[1] - 1)])[:len(xs)]
    out = (1 - mix) * xs + mix * wet
    return out[:, 0] if mono else out

def sat(x, drive=1.5): return np.tanh(x * drive) / np.tanh(drive)

# ----------------------------- sfx layers -----------------------------
def whoosh(dur=0.9, f0=260, f1=3200, peak=0.32, pan=0.0, pre=0.12):
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.zeros((n, 2))
    for side in range(2):
        nz = rng.standard_normal(n)
        fc = f0 * (f1 / f0) ** (t / dur) ** 0.85
        body[:, side] = svf_sweep(nz, fc, q=1.15) * np.sin(np.pi * t / dur) ** 1.4
    pre_n = int(pre * SR)
    if pre_n > 0:
        ps = bp(rng.standard_normal((pre_n, 2)), 500, 2400) * (np.linspace(0, 1, pre_n) ** 3)[:, None] * 0.55
        body = np.concatenate([ps, body], axis=0)
    gl = math.cos((pan + 1) * math.pi / 4) * 1.35; gr = math.sin((pan + 1) * math.pi / 4) * 1.35
    body *= np.array([gl, gr])
    body = reverb(body, IR_M, 0.16)
    body *= peak / (np.max(np.abs(body)) + 1e-9)
    return body

def impact(size=1.0, peak=0.7, bright=1.0):
    dur = 1.1 * size; n = int(dur * SR); t = np.arange(n) / SR
    f = 58 * np.exp(-t * 2.6) + 32
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (2.6 / size))
    fb = 112 * np.exp(-t * 5.0) + 65
    body = sat(np.sin(2 * np.pi * np.cumsum(fb) / SR + 1.1 * np.sin(2 * np.pi * fb * 2 * t) * np.exp(-t * 22)), 1.8) * np.exp(-t * 6.0) * 0.5
    crack = hp(rng.standard_normal(n), 1500) * np.exp(-t * 85) * 0.42 * bright
    y = hp(sub * 0.95 + body + crack, 22)
    st = reverb(np.stack([y, y], axis=1), IR_L, 0.28)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def boom(peak=0.8, dur=3.2):
    """Blackout sub-boom: very low, long, slight pitch fall."""
    n = int(dur * SR); t = np.arange(n) / SR
    f = 42 * np.exp(-t * 0.55) + 24
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 0.9)
    y += 0.3 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    rumble = lp(rng.standard_normal(n), 90) * np.exp(-t * 1.1) * 0.35
    st = reverb(np.stack([y + rumble, y + rumble], axis=1), IR_L, 0.35)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def static_burst(dur=0.5, peak=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    y = bp(nz, 800, 6500) * np.exp(-t * 9)
    y += bp(nz, 180, 900) * np.exp(-t * 5) * 0.6
    st = np.stack([y, y * 0.92], axis=1)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def radio_voice_gate(dur=1.2, peak=0.14):
    """Squawk-ish filtered static bursts (radio chatter texture)."""
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for k, (t0, dd) in enumerate([(0.05, 0.16), (0.32, 0.1), (0.55, 0.22), (0.92, 0.12)]):
        i0 = int(t0 * SR); i1 = min(n, i0 + int(dd * SR))
        tt = np.arange(i1 - i0) / SR
        nz = rng.standard_normal(i1 - i0)
        y[i0:i1] += svf_sweep(nz, np.full(i1 - i0, 1300 + 250 * k), q=2.2) * np.exp(-tt * 14)
    st = np.stack([y, y], axis=1)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def klaxon(cycles=3, peak=0.24):
    """Two-tone containment alarm, filtered to sit under the mix."""
    dur = cycles * 0.72; n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for c in range(cycles):
        i0 = int(c * 0.72 * SR); i1 = min(n, i0 + int(0.36 * SR))
        tt = np.arange(i1 - i0) / SR
        tone = signal.square(2 * np.pi * 466 * tt, duty=0.5) * 0.5 + signal.square(2 * np.pi * 349 * tt, duty=0.5) * 0.5
        y[i0:i1] += tone * env_ad(i1 - i0, 0.02, 0.34, 1.2)
        i2 = min(n, i0 + int(0.36 * SR)); i3 = min(n, i2 + int(0.32 * SR))
        if i3 > i2:
            tt2 = np.arange(i3 - i2) / SR
            y[i2:i3] += signal.square(2 * np.pi * 554 * tt2, duty=0.5) * env_ad(i3 - i2, 0.02, 0.3, 1.2) * 0.9
    y = bp(y, 320, 2400)
    st = reverb(np.stack([y, y], axis=1), IR_M, 0.18)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def heartbeat(n_b=2, peak=0.3, rate=0.85):
    dur = n_b * rate + 0.4; n = int(dur * SR)
    y = np.zeros(n)
    for b in range(n_b):
        for off, amp in [(0.0, 1.0), (0.34, 0.62)]:
            i0 = int((b * rate + off) * SR)
            ln = int(0.22 * SR); tt = np.arange(ln) / SR
            f = 78 * np.exp(-tt * 12) + 42
            y[i0:i0 + ln] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 11) * amp
    st = np.stack([y, y], axis=1)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def ping(peak=0.16, f=1180):
    """Radar ping with echo tail."""
    dur = 0.55; n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 26)
    i0 = int(0.14 * SR); tt = np.arange(n - i0) / SR
    y[i0:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) * 0.4
    st = reverb(np.stack([y, y], axis=1), IR_M, 0.35)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def tick(peak=0.08, f=2400, dur=0.03):
    n = int(dur * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), f * 0.6, f * 2.0) * np.exp(-t * 150)
    st = np.stack([y, y * 0.9], axis=1)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def stamp_thud(peak=0.34):
    dur = 0.28; n = int(dur * SR); t = np.arange(n) / SR
    f = 150 * np.exp(-t * 24) + 70
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 17)
    y += bp(rng.standard_normal(n), 900, 5200) * np.exp(-t * 60) * 0.55
    st = reverb(np.stack([y, y], axis=1), IR_S, 0.16)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def paper(peak=0.12):
    dur = 0.3; n = int(dur * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 1600, 5600) * np.exp(-t * 16) * (1 + 0.5 * np.sin(2 * np.pi * 9 * t))
    st = np.stack([y, y * 0.85], axis=1)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def tape_click(peak=0.2):
    dur = 0.22; n = int(dur * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 2500, 9000) * np.exp(-t * 90)
    y += np.sin(2 * np.pi * 120 * t) * np.exp(-t * 50) * 0.5
    st = np.stack([y, y], axis=1)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def riser(dur=1.4, peak=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros((n, 2))
    for lo, hi, amp, skew in [(200, 800, 0.5, 1.6), (800, 2000, 0.32, 1.2), (2000, 4800, 0.3, 0.9)]:
        for side in range(2):
            nz = rng.standard_normal(n)
            fc = lo * (hi / lo) ** (t / dur) ** skew
            y[:, side] += svf_sweep(nz, fc, q=1.9) * amp
    f = 150 * 2 ** (2 * (t / dur))
    y += (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.1 * (t / dur) ** 2)[:, None]
    y *= ((t / dur) ** 1.8)[:, None]
    y = hp(y, 180)
    y *= peak / (np.max(np.abs(y)) + 1e-9)
    return y

def chime(peak=0.14, freqs=(440, 659.3, 880), dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for i, f in enumerate(freqs):
        y += np.sin(2 * np.pi * f * t) * np.exp(-t * (1.6 + i * 0.9)) / (i + 1)
    st = reverb(np.stack([y, y], axis=1), IR_L, 0.4)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

def glitch_stutter(peak=0.16):
    dur = 0.35; n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    step = int(0.02 * SR)
    for i in range(0, n - step, step):
        if (i // step) % 2 == 0:
            y[i:i + step] = bp(rng.standard_normal(step), 1200, 7000) * np.exp(-np.arange(step) / SR * 60)
    st = np.stack([y, y], axis=1)
    st *= peak / (np.max(np.abs(st)) + 1e-9)
    return st

# ----------------------------- cue map -----------------------------
CUES = []
def cue(fr, name, sig, duck=0.0):
    CUES.append({'frame': float(fr), 'name': name, 'audio': sig, 'duck': duck})

# --- Title (0-140) ---
cue(0,   'static_open', static_burst(0.6, 0.18), 0.3)
cue(6,   'title_slam', impact(0.6, 0.42, 1.2), 0.5)
cue(22,  'title_w1', whoosh(0.55, 300, 2200, 0.16, -0.2))
cue(31,  'title_w2', whoosh(0.55, 320, 2400, 0.18, 0.2))
cue(56,  'sub_type', tick(0.06, 2000))
cue(74,  'title_date', tick(0.055, 2200))               # MISSED BEFORE: date line (600ms gap)
cue(98,  'STAMP_eyes', stamp_thud(0.36), 0.4)

# --- S1 (140-320) approach ---
cue(140, 'S1_cut', impact(0.85, 0.55), 0.55)
cue(162, 'S1_noradio', radio_voice_gate(1.1, 0.13))
cue(170, 'S1_words', tick(0.07, 1800))
cue(184, 'S1_warn', tick(0.06, 2400))                   # MISSED BEFORE: warn line (467ms gap)
cue(198, 'S1_cap', tick(0.05, 1600))
cue(210, 'S1_coord', tick(0.05, 2100))

# --- S2 (320-485) checkpoint ---
cue(320, 'S2_cut', impact(0.8, 0.5), 0.5)
cue(338, 'S2_seclvl', stamp_thud(0.26))
cue(372, 'S2_cap', tick(0.05, 1500))
cue(394, 'S2_stamp', stamp_thud(0.32), 0.35)   # RETIMED to visual stamp T.s2+74

# --- S3 (485-695) hangar ---
cue(485, 'S3_cut', impact(0.85, 0.52), 0.5)
cue(503, 'S3_head', tick(0.06, 1700))
cue(539, 'S3_cap', tick(0.05, 1500))
cue(248, 'S1_INSERT_notes', paper(0.13), 0.25)          # prop cutaway: case notebook
cue(581, 'S3_tw_head', tick(0.05, 2300))                # typewriter block opens
cue(601, 'S3_1977_tape', tape_click(0.22), 0.3)         # RETIMED: J-cut 2f before flash
cue(603, 'S3_1977_static', static_burst(0.45, 0.12))    # RETIMED to visual flash T.s3+118
cue(635, 'S3_stamp', stamp_thud(0.3), 0.3)

# --- S4 (695-875) control / radar ---
cue(695, 'S4_cut', impact(0.8, 0.5), 0.5)
for k, pf in enumerate([705, 739, 773, 807, 841]):
    cue(pf, f'S4_ping_{k}', ping(0.13 if k % 2 == 0 else 0.09))
cue(800, 'S4_INSERT_radio', tape_click(0.20), 0.25)    # prop cutaway: reel-to-reel
cue(711, 'S4_head', tick(0.06, 1700))
cue(721, 'S4_freq', tick(0.05, 2800))                 # freq readout appears
cue(747, 'S4_cap', tick(0.05, 1500))
cue(779, 'S4_glitch', glitch_stutter(0.14), 0.25)

# --- S5 (875-1055) lab ---
cue(875, 'S5_cut', impact(0.8, 0.48), 0.5)
cue(1150, 'S6_INSERT_thermal', glitch_stutter(0.12), 0.2)   # prop cutaway: thermal scan
cue(891, 'S5_head', tick(0.06, 1900))
cue(925, 'S5_cap', tick(0.05, 1500))
cue(905, 'S5_temp', tick(0.05, 3000))                 # temp counter appears (visual t+30)
cue(915, 'S5_temp2', tick(0.04, 3120))
cue(967, 'S5_stamp', stamp_thud(0.22))                # RETIMED to visual stamp T.s5+92

# --- S6 (1055-1250) breach ---
cue(1041, 'S6_riser', riser(0.5, 0.22), 0.5)
cue(1055, 'S6_cut', impact(1.15, 0.75, 1.2), 0.75)
cue(1058, 'S6_klaxon', klaxon(3, 0.2), 0.35)
cue(1071, 'S6_head', tick(0.06, 1700))
cue(1077, 'S6_breach_stamp', stamp_thud(0.38), 0.45)
cue(1085, 'S6_alarm', klaxon(1, 0.12))                  # MISSED BEFORE: alarm text
cue(1107, 'S6_cap', tick(0.05, 1500))
cue(1120, 'S6_hb', heartbeat(2, 0.26, 0.8))
cue(1151, 'S6_glitch', glitch_stutter(0.18), 0.3)
cue(1195, 'S6_hb2', heartbeat(2, 0.22, 0.75))

# --- S7 (1250-1430) signal / blackout ---
cue(1242, 'S7_BOOM', boom(0.85, 3.4), 0.85)            # RETIMED to blackout cut-in
cue(1246, 'S7_glitch', glitch_stutter(0.2), 0.3)
cue(1266, 'S7_head', tick(0.06, 1700))
cue(1302, 'S7_cap', tick(0.05, 1500))
cue(1258, 'S7_beam_shimmer', chime(0.13, (880, 1174.7, 1568, 2093), 2.6))   # RETIMED to beam glow t+8

# --- S8 (1430-1595) evacuation ---
cue(1430, 'S8_cut', impact(0.85, 0.55), 0.55)
cue(1446, 'S8_head', tick(0.06, 1800))
cue(1482, 'S8_cap', tick(0.05, 1500))
cue(1534, 'S8_INSERT_watch', tick(0.09, 900, 0.05), 0.15)  # prop cutaway: stopped watch
cue(1500, 'S8_hb', heartbeat(2, 0.2, 0.9))
cue(1558, 'S8_stamp', stamp_thud(0.34), 0.4)            # MISSED BEFORE: 1.2s gap (visual T.s8+128)

# --- S9 (1595-1775) morning after ---
cue(1595, 'S9_cut', impact(0.7, 0.42), 0.45)
for k in range(8):
    cue(1617 + k * 13, f'S9_typewriter_{k}', tick(0.06 if k % 2 == 0 else 0.045, 2600 + k * 60, 0.022))
cue(1687, 'S9_reassigned', stamp_thud(0.3), 0.3)
cue(1723, 'S9_stamp', paper(0.14))

# --- S10 (1775-1985) the file ---
cue(1775, 'S10_cut', impact(0.8, 0.5), 0.5)
cue(1791, 'S10_head', tick(0.06, 1700))
cue(1833, 'S10_cap', tick(0.05, 1500))
cue(1925, 'S10_INSERT_news', paper(0.14), 0.2)          # prop cutaway: press clipping
cue(1863, 'S10_redact1', paper(0.13))
cue(1869, 'S10_redact2', paper(0.11))
cue(1875, 'S10_redact3', paper(0.1))
cue(1905, 'S10_DECLASS', stamp_thud(0.42), 0.5)

# --- End (1985-2090) ---
cue(1985, 'END_note', chime(0.2, (220, 277.2, 329.6, 440), 3.4), 0.3)
cue(1993, 'END_w1', tick(0.05, 1600))
cue(2017, 'END_w2', tick(0.05, 1600))
cue(2047, 'END_final', chime(0.16, (110, 164.8, 220, 329.6), 3.0))

# --- Typewriter tick clusters (text appearing/writing = audible typing) ---
for k, tf in enumerate(range(585, 613, 4)):   # S3 typewriter note (visual t+96)
    cue(tf, f'S3_tw_{k}', tick(0.035 if k % 2 else 0.05, 2500 + (k % 3) * 180, 0.018))
for k, tf in enumerate(range(811, 835, 4)):   # S4 typewriter insert (visual t+112)
    cue(tf, f'S4_tw_{k}', tick(0.035 if k % 2 else 0.05, 2600 + (k % 3) * 160, 0.018))
for k, tf in enumerate(range(2012, 2032, 4)): # END typing line
    cue(tf, f'END_tw_{k}', tick(0.04 if k % 2 else 0.055, 2200 + (k % 3) * 200, 0.02))

# ----------------------------- place cues -----------------------------
sfx = np.zeros((N, 2))
duck_env = np.ones(N)
for c in CUES:
    i0 = s2n(f2s(c['frame']))
    sig = c['audio']
    if sig.ndim == 1: sig = np.stack([sig, sig], axis=1)
    i1 = min(N, i0 + len(sig))
    if i0 < N: sfx[i0:i1] += sig[:i1 - i0]
    if c['duck'] > 0:
        pre, post = int(0.06 * SR), int(0.3 * SR)
        d0, d1 = max(0, i0 - pre), min(N, i0 + post)
        depth = 1.0 - c['duck'] * 0.5
        shape = np.ones(d1 - d0); mid = i0 - d0
        shape[:mid] = np.linspace(1, depth, mid)
        shape[mid:] = np.linspace(depth, 1, d1 - i0)
        duck_env[d0:d1] = np.minimum(duck_env[d0:d1], shape)

# ----------------------------- BGM bed -----------------------------
t_all = np.arange(N) / SR
bgm = np.zeros((N, 2))

# 1) Wind / desert air — continuous, slowly modulated
wind = bp(rng.standard_normal(N), 120, 700) * 0.06
wind *= 1 + 0.55 * np.sin(2 * np.pi * 0.05 * t_all) + 0.3 * np.sin(2 * np.pi * 0.023 * t_all + 1.7)
bgm += np.stack([wind, np.concatenate([np.zeros(400), wind[:-400]])], axis=1)

# 2) Drone pad with per-section chord/energy (frames from T.*)
SECTIONS = [
    (0,    140,  [55.0, 110.0, 164.8],           0.50),   # title: A minor open
    (140,  485,  [55.0, 110.0, 130.8, 164.8],    0.65),   # approach/checkpoint
    (485,  695,  [58.3, 116.5, 174.6, 233.1],    0.72),   # hangar mystery (Bb)
    (695,  875,  [55.0, 82.4, 110.0, 164.8],     0.78),   # control (E sub)
    (875,  1055, [61.7, 123.5, 185.0, 246.9],    0.70),   # lab (B)
    (1055, 1250, [43.7, 87.3, 130.8, 155.6],     0.95),   # breach (F dissonance)
    (1250, 1430, [41.2, 82.4, 123.5, 207.7],     1.05),   # signal (E+ tritone shimmer)
    (1430, 1595, [43.7, 87.3, 130.8],            0.62),   # evac
    (1595, 1775, [55.0, 110.0, 146.8, 164.8],    0.55),   # morning (soft Dm)
    (1775, 1985, [55.0, 110.0, 164.8, 220.0],    0.60),   # file (A minor resolve)
    (1985, 2130, [55.0, 110.0, 164.8, 261.6],    0.55),   # end
]
for (f0, f1, chord, energy) in SECTIONS:
    n0 = s2n(f2s(f0)); n1 = min(N, s2n(f2s(f1 + 1.5)))
    seg_n = n1 - n0
    if seg_n <= 0: continue
    st = np.arange(seg_n) / SR
    seg = np.zeros((seg_n, 2))
    for i, f in enumerate(chord):
        det = 1 + 0.0016 * np.sin(2 * np.pi * 0.19 * st + i * 2.1)
        v = np.sin(2 * np.pi * f * det * st)
        v += 0.35 * np.sin(2 * np.pi * f * 2 * det * st)
        v += 0.12 * np.sin(2 * np.pi * f * 3 * det * st)
        v *= env_ad(seg_n, 0.9, 0.001) * 0  # placeholder replaced below
        seg[:, 0] += (np.sin(2 * np.pi * f * det * st) + 0.35 * np.sin(2 * np.pi * f * 2 * det * st) +
                      0.12 * np.sin(2 * np.pi * f * 3 * det * st)) * (0.045 * energy) * (1 - 0.25 * (i / max(1, len(chord) - 1)))
        seg[:, 1] += (np.sin(2 * np.pi * f * (det + 0.0012) * st) + 0.35 * np.sin(2 * np.pi * f * 2 * (det + 0.0012) * st) +
                      0.12 * np.sin(2 * np.pi * f * 3 * (det + 0.0012) * st)) * (0.045 * energy) * (1 - 0.25 * (i / max(1, len(chord) - 1)))
    # section envelope (fade edges)
    fe = np.ones(seg_n)
    nf = int(0.8 * SR)
    fe[:nf] = np.linspace(0, 1, nf); fe[-nf:] = np.linspace(1, 0, nf)
    seg *= fe[:, None]
    seg = lp(seg, 900 + 700 * energy)
    bgm[n0:n1] += seg

# 3) Section pulses: tech heartbeat in S4 grid, tension pulse S6, sub sustains S7
for pf in range(705, 875, 34):  # radar cadence
    i0 = s2n(f2s(pf))
    ln = int(0.18 * SR); tt = np.arange(ln) / SR
    th = np.sin(2 * np.pi * (60 * np.exp(-tt * 12) + 36) * tt) * np.exp(-tt * 13) * 0.10
    bgm[i0:i0 + ln] += th[:, None]
for pf in range(1055, 1250, 20):  # breach pulse every 20 frames (90bpm beat)
    i0 = s2n(f2s(pf))
    ln = int(0.14 * SR); tt = np.arange(ln) / SR
    th = np.sin(2 * np.pi * (52 * np.exp(-tt * 14) + 33) * tt) * np.exp(-tt * 15) * 0.12
    bgm[i0:i0 + ln] += th[:, None]
# S7 sustained sub under beam
i0, i1 = s2n(f2s(1250)), min(N, s2n(f2s(1430)))
st = np.arange(i1 - i0) / SR
sub = np.sin(2 * np.pi * 41.2 * st) * 0.10 * (1 + 0.2 * np.sin(2 * np.pi * 0.5 * st))
bgm[i0:i1] += sub[:, None]

# fade tail
fade0 = s2n(f2s(2090)) + int(0.2 * SR)
fl = min(N - fade0, int(2.2 * SR))
if fl > 0:
    bgm[fade0:fade0 + fl] *= np.linspace(1, 0, fl)[:, None]
    bgm[fade0 + fl:] = 0

# ----------------------------- mix -----------------------------
bgm *= duck_env[:, None]
# ----------------------------- narration (VO) mix -----------------------------
vo = np.zeros((N, 2))
vo_hits = []
if os.path.exists('src/narration.json'):
    narr = json.load(open('src/narration.json'))
    for seg, data in narr.items():
        wavp = f'audio/vo/{seg}.wav'
        if not os.path.exists(wavp):
            continue
        sr2, pcm = wavfile.read(wavp)
        v = pcm.astype(np.float64) / 32768.0
        if v.ndim == 1:
            v = np.stack([v, v], axis=1)
        i0 = s2n(f2s(data['start']))
        i1 = min(N, i0 + len(v))
        if i1 > i0:
            vo[i0:i1] += v[:i1 - i0] * 1.5
            vo_hits.append((i0, i1))
# duck BGM hard under voice, SFX mildly (keep the frame-locked hits audible)
duck2 = np.ones(N)
for (a, b) in vo_hits:
    pre, post = int(0.12 * SR), int(0.22 * SR)
    a2, b2 = max(0, a - pre), min(N, b + post)
    if b2 <= a2:
        continue
    sh = np.full(b2 - a2, 0.38)
    nf = int(0.09 * SR)
    sh[:nf] = np.linspace(1.0, 0.38, min(nf, len(sh)))
    sh[-nf:] = np.linspace(0.38, 1.0, min(nf, len(sh)))
    duck2[a2:b2] = np.minimum(duck2[a2:b2], sh)
bgm *= duck2[:, None]
sfx_duck = duck2 * 0.45 + 0.55   # shallower duck on SFX
sfx *= sfx_duck[:, None]
mix = bgm * 1.0 + sfx * 1.05 + vo * 1.0
mix = hp(mix, 26, order=2)

def comp(x, thresh=0.26, ratio=2.8, atk=0.006, rel=0.16):
    mono = np.max(np.abs(x), axis=1)
    envf = np.zeros_like(mono)
    a = np.exp(-1 / (atk * SR)); r = np.exp(-1 / (rel * SR)); acc = 0.0
    for i in range(len(mono)):
        v = mono[i]; coef = a if v > acc else r
        acc = coef * acc + (1 - coef) * v; envf[i] = acc
    over = np.maximum(envf / thresh, 1.0)
    return x * (over ** (1 / ratio - 1))[:, None]

mix = comp(mix)
mix = sat(mix, 1.05)
peak = np.max(np.abs(mix))
if peak > 0: mix = mix / peak * 0.95

def limit(x, ceiling=0.89):
    mono = np.max(np.abs(x), axis=1)
    peak_a = np.maximum.accumulate(mono[::-1])[::-1]
    g = np.minimum(1.0, ceiling / (peak_a + 1e-9))
    gs = np.zeros_like(g); acc = 1.0
    for i in range(len(g)):
        acc = min(g[i], acc * 0.9996 + g[i] * 0.0004); gs[i] = acc
    return x * gs[:, None]

mix = limit(mix)

os.makedirs('audio', exist_ok=True)
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
wavfile.write('audio/nightingale_mix.wav', SR, pcm)
wavfile.write('audio/nightingale_sfx.wav', SR, (np.clip(sfx * 0.9, -1, 1) * 32767).astype(np.int16))
wavfile.write('audio/nightingale_bgm.wav', SR, (np.clip(bgm * 0.9, -1, 1) * 32767).astype(np.int16))

beatmap = [{'frame': c['frame'], 'seconds': round(f2s(c['frame']), 4),
            'beat': round(c['frame'] / 20.0, 2), 'event': c['name']}
           for c in sorted(CUES, key=lambda x: x['frame'])]
json.dump({'fps': FPS, 'bpm': BPM, 'frame_per_beat': 20, 'cues': beatmap},
          open('audio/nightingale_beats.json', 'w'), indent=1)
print(f'nightingale_mix.wav {N / SR:.2f}s, {len(CUES)} cues, peak={np.max(np.abs(mix)):.3f}')
