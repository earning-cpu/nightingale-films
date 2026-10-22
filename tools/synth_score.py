#!/usr/bin/env python3
"""synth_score.py — a composed score and a designed sound-effects library,
synthesised from scratch with numpy. No samples, no licensing, no library.

Why synthesise rather than license: a licensed cue cannot be shipped inside
this repo, and a stock "cinematic" pack sounds like every other video. Every
sound here is generated from oscillators and noise, so it is ours and it can be
tuned to the picture exactly.

The score follows the trailer three-act structure that every scoring guide
describes (setup / escalation / climax):

    act 1  0-22 s   drone, sparse bell motif, no pulse          (setup)
    act 2 22-62 s   ostinato enters, kick, tension              (escalation)
    act 3 62-96 s   full: taiko, braam, climax at the last line (climax)

Key: D minor. Tempo: 100 BPM -> one beat is exactly 18 frames at 30 fps, so
every cut can land on a beat instead of beside one.

Sound design follows the five-layer convention: ambience, SFX, foley, music,
dialogue — generated as separate stems so the mix can duck them independently.

    python tools/synth_score.py --out public/wow/audio --seconds 96.3
"""
from __future__ import annotations
import argparse, os
import numpy as np

SR = 48000
BPM = 100.0
BEAT = 60.0 / BPM                      # 0.6 s == 18 frames
BAR = 4 * BEAT


# ----------------------------------------------------------------- primitives
def t(sec):
    return np.arange(int(sec * SR), dtype=np.float32) / SR


def env(n, a=0.01, d=0.1, s=0.7, r=0.2, sustain=None):
    """ADSR-ish envelope in samples."""
    total = n
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, total - a_n - d_n - r_n)
    parts = [np.linspace(0, 1, a_n, dtype=np.float32) if a_n else np.array([], np.float32),
             np.linspace(1, s, d_n, dtype=np.float32) if d_n else np.array([], np.float32),
             np.full(s_n, s, dtype=np.float32),
             np.linspace(s, 0, r_n, dtype=np.float32) if r_n else np.array([], np.float32)]
    e = np.concatenate(parts)
    if len(e) < total:
        e = np.pad(e, (0, total - len(e)))
    return e[:total]


def saw(freq, sec, detune=0.0, phase=0.0):
    x = t(sec)
    ph = (freq * (1 + detune) * x + phase) % 1.0
    return (2 * ph - 1).astype(np.float32)


def sine(freq, sec, phase=0.0):
    return np.sin(2 * np.pi * freq * t(sec) + phase).astype(np.float32)


def noise(sec, seed=0):
    return np.random.default_rng(seed).normal(0, 1, int(sec * SR)).astype(np.float32)


def onepole_lp(x, cutoff):
    """Simple one-pole lowpass; cutoff in Hz, can be an array for sweeps."""
    c = np.atleast_1d(np.asarray(cutoff, np.float32))
    if c.size == 1:
        c = np.full(len(x), c[0], np.float32)
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a[i] * acc + (1 - a[i]) * x[i]
        y[i] = acc
    return y


def hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


def bp(x, lo, hi):
    return hp(onepole_lp(x, hi), lo)


def note(name):
    """'D2' -> Hz, equal temperament A4=440."""
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6,
             "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    n, octv = name[:-1], int(name[-1])
    midi = 12 * (octv + 1) + names[n]
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(buf, x, at_sec, gain=1.0):
    i = int(at_sec * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[:j - i] * gain


# ----------------------------------------------------------------- score
# D minor: D F A C (i), Bb D F (VI), F A C (III), A C# E (V)
CHORDS = {
    "i":   ["D3", "F3", "A3"],
    "VI":  ["A#2", "D3", "F3"],
    "III": ["F3", "A3", "C4"],
    "V":   ["A2", "C#3", "E3"],
}
PROG = ["i", "VI", "III", "V"]


def music(total_s, climax_s):
    n = int(total_s * SR)
    out = np.zeros(n, np.float32)
    bars = int(np.ceil(total_s / BAR))

    # ---- pad: three detuned saws per chord tone, lowpassed
    for b in range(bars):
        at = b * BAR
        ch = CHORDS[PROG[b % 4]]
        for v in ch:
            f = note(v)
            seg = 2.4
            x = (saw(f * 2, seg, -0.004) + saw(f * 2, seg, 0.004) +
                 saw(f * 2, seg, 0.0015)) / 3.0
            x = onepole_lp(x, 900 if at < climax_s else 1600)
            x *= env(len(x), 0.6, 0.5, 0.55, 1.2)
            place(out, x, at, 0.055)

    # ---- sub drone: D1 throughout, A1 after the midpoint
    d1 = sine(note("D1"), total_s)
    out += d1 * 0.10 * env(n, 2.0, 1.0, 0.85, 2.0)
    half = int(n / 2)
    a1 = sine(note("A1"), total_s - half / SR)
    out[half:half + len(a1)] += a1 * 0.06 * env(len(a1), 2.0, 1.0, 0.8, 2.0)

    # ---- bell motif (act 1): D5, F5, A5, F5 - sparse
    motif = ["D5", "F5", "A5", "F5"]
    for k in range(8):
        at = 2.4 + k * BAR * 1.6
        if at > climax_s - 14:
            break
        f = note(motif[k % 4])
        seg = 1.5
        x = sine(f, seg) + 0.35 * sine(f * 2.01, seg) + 0.15 * sine(f * 3.02, seg)
        x *= env(len(x), 0.004, 0.5, 0.25, 0.9)
        place(out, x, at, 0.075)

    # ---- ostinato (act 2+): 8th notes on chord tones, 3-3-2 feel
    shift = 22.0
    if total_s > shift:
        e8 = BEAT / 2
        i = 0
        while True:
            at = shift + i * e8
            if at > total_s - 3:
                break
            bar_i = int((at - shift) // BAR)
            ch = CHORDS[PROG[bar_i % 4]]
            # 3-3-2 grouping across 8 eighths
            order = [0, 1, 2, 0, 1, 2, 0, 1]
            f = note(ch[order[i % 8]])
            seg = min(0.30, total_s - at)
            x = saw(f * 4, seg, 0.002) * env(len(saw(f * 4, seg)), 0.004, 0.06, 0.35, 0.10)
            x = onepole_lp(x, 2600)
            place(out, x, at, 0.05)
            i += 1

    # ---- kick: sine sweep 120->45 Hz with click
    for i in range(int((total_s - shift) / BEAT)):
        at = shift + i * BEAT * 2                        # half-time
        if at > total_s - 2:
            break
        seg = 0.42
        x = t(seg)
        f = 120 * np.exp(-14 * x) + 44
        ph = 2 * np.pi * np.cumsum(f) / SR
        k = np.sin(ph).astype(np.float32) * env(len(ph), 0.002, 0.10, 0.45, 0.30)
        k += hp(noise(seg, i), 2000) * env(len(ph), 0.001, 0.02, 0.0, 0.01) * 0.25
        place(out, k.astype(np.float32), at, 0.30)

    # ---- taiko (act 3): noise body + low tone
    t0 = 62.0
    for i in range(int((total_s - t0) / BAR)):
        at = t0 + i * BAR + (0 if i % 2 == 0 else BAR * 0.5)
        if at > total_s - 1.5:
            break
        seg = 0.9
        x = noise(seg, 500 + i)
        x = onepole_lp(x, 2200)
        x = x * env(len(x), 0.003, 0.10, 0.30, 0.75)
        x += 0.5 * sine(70, seg) * env(int(seg * SR), 0.004, 0.15, 0.2, 0.6)
        place(out, x.astype(np.float32), at, 0.20)

    # ---- braam on the act change and the climax
    for at, gain in ((21.6, 0.30), (climax_s - 0.1, 0.42), (climax_s + 12, 0.26)):
        if at + 3 > total_s:
            continue
        seg = 3.0
        x = np.zeros(int(seg * SR), np.float32)
        for f, g in ((note("D2"), 1.0), (note("D2") * 1.5, 0.6), (note("D2") * 2, 0.5),
                     (note("D2") * 1.06, 0.5)):
            x += (saw(f, seg, -0.006) + saw(f, seg, 0.006)) * g * 0.5
        sweep = np.linspace(260, 2200, len(x))
        x = onepole_lp(x, sweep)
        x *= env(len(x), 0.06, 0.5, 0.55, 1.6)
        place(out, x, at, gain)

    # ---- silence before the last line: the cheapest, strongest trick there is
    cut_at = climax_s + 6.0
    if cut_at < total_s:
        s0, s1 = int((cut_at - 0.55) * SR), int(cut_at * SR)
        out[s0:s1] *= np.linspace(1, 0.05, s1 - s0, dtype=np.float32)

    return np.tanh(out * 1.4) * 0.9


# ----------------------------------------------------------------- ambience
def roomtone(total_s):
    """Electrical hum + tape hiss + a distant wind. This is what stops a mix
    sounding like a series of separate clips."""
    n = int(total_s * SR)
    x = np.zeros(n, np.float32)
    x += sine(50, total_s) * 0.012                     # mains hum
    x += sine(100, total_s) * 0.006
    x += sine(150, total_s) * 0.003
    hiss = hp(noise(total_s, 7), 3000) * 0.010         # tape hiss
    x += hiss
    wind = onepole_lp(noise(total_s, 11), 420) * 0.05
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t(total_s))
    x += wind * lfo.astype(np.float32)
    return np.tanh(x * 1.2) * 0.55


# ----------------------------------------------------------------- sfx library
def sfx_impact(seed=1, low=52, dur=1.1):
    """Transient + body + tail — the three layers every trailer hit needs."""
    n = int(dur * SR)
    x = np.zeros(n, np.float32)
    trans = bp(noise(0.06, seed), 1800, 9000) * env(int(0.06 * SR), 0.0005, 0.02, 0.0, 0.03)
    place(x, trans.astype(np.float32), 0, 0.9)
    body = sine(low, dur) * env(n, 0.004, 0.10, 0.35, dur - 0.2)
    place(x, body.astype(np.float32), 0, 0.85)
    tail = onepole_lp(noise(dur, seed + 5), 900) * env(n, 0.02, 0.3, 0.20, dur - 0.4)
    place(x, tail.astype(np.float32), 0.01, 0.30)
    return np.tanh(x * 1.3)


def sfx_whoosh(dur=0.55, up=True, seed=3):
    n = int(dur * SR)
    x = noise(dur, seed)
    sweep = np.linspace(400, 6000, n) if up else np.linspace(6000, 400, n)
    x = onepole_lp(x, sweep)
    x = bp(x, 300, 9000)
    return (x * env(n, 0.12, 0.1, 0.6, dur * 0.5)).astype(np.float32) * 0.9


def sfx_riser(dur=2.4, seed=9):
    n = int(dur * SR)
    x = noise(dur, seed)
    sweep = np.geomspace(250, 9000, n)
    x = onepole_lp(x, sweep) - onepole_lp(x, sweep / 6)
    tone = saw(220, dur) * np.linspace(0, 1, n, dtype=np.float32)
    tone = onepole_lp(tone, np.geomspace(300, 5000, n))
    x = x * 0.7 + tone * 0.3
    return (x * (np.linspace(0, 1, n, dtype=np.float32) ** 2)).astype(np.float32)


def sfx_printer(dur=0.9, seed=21):
    """Dot-matrix: a burst of sharp ticks + motor whine."""
    n = int(dur * SR)
    x = (onepole_lp(noise(dur, seed), 900) * 0.25).astype(np.float32)
    ticks = np.zeros(n, np.float32)
    rng = np.random.default_rng(seed)
    tt = 0.0
    while tt < dur:
        k = int(0.012 * SR)
        tick = bp(noise(0.012, int(tt * 1000)), 2500, 9000) * env(k, 0.0005, 0.003, 0.0, 0.004)
        place(ticks, tick.astype(np.float32), tt, 0.9)
        tt += 0.035 + rng.uniform(-0.008, 0.008)
    whine = sine(880, dur) * 0.02 * env(n, 0.05, 0.1, 0.7, 0.2)
    return np.tanh((ticks + x + whine.astype(np.float32)) * 1.2) * 0.8


def sfx_paper(dur=0.5, seed=31):
    n = int(dur * SR)
    x = bp(noise(dur, seed), 1200, 12000)
    crinkle = x * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 17 * t(dur))))
    return (crinkle * env(n, 0.01, 0.15, 0.3, 0.3)).astype(np.float32) * 0.7


def sfx_click(dur=0.08, seed=41, f=1800):
    n = int(dur * SR)
    x = bp(noise(dur, seed), f * 0.6, f * 3) * env(n, 0.0005, 0.01, 0.0, 0.02)
    x += 0.4 * sine(f, dur) * env(n, 0.0005, 0.005, 0.0, 0.01)
    return x.astype(np.float32) * 0.8


def sfx_tape(dur=1.2, seed=51):
    """Tape spool-up: a wobbling tone + flutter."""
    n = int(dur * SR)
    f = np.linspace(120, 320, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * 0.4
    x += 0.2 * np.sin(ph * 2.01)
    flutter = 1 + 0.02 * np.sin(2 * np.pi * 6 * t(dur))
    x = (x * flutter).astype(np.float32)
    x += onepole_lp(noise(dur, seed), 2000) * 0.15
    return (x * env(n, 0.05, 0.2, 0.5, 0.6)).astype(np.float32) * 0.7


def sfx_static(dur=0.8, seed=61):
    x = bp(noise(dur, seed), 800, 9000)
    gate = (np.abs(np.sin(2 * np.pi * 9 * t(dur))) > 0.3).astype(np.float32)
    return (x * gate * env(int(dur * SR), 0.005, 0.05, 0.6, 0.3)).astype(np.float32) * 0.6


def sfx_sub_drop(dur=1.6, seed=71):
    n = int(dur * SR)
    f = np.geomspace(110, 28, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * env(n, 0.004, 0.4, 0.6, dur - 0.5)).astype(np.float32) * 0.9


def sfx_stinger(dur=1.4, seed=81):
    """A short musical accent: two detuned fifths, fast decay."""
    n = int(dur * SR)
    x = (saw(note("D5"), dur, 0.003) + saw(note("A5"), dur, -0.003)) * 0.5
    x = onepole_lp(x, np.linspace(5000, 800, n))
    x *= env(n, 0.002, 0.15, 0.15, 0.9)
    return x.astype(np.float32) * 0.6


def save(path, x, gain=1.0):
    import wave
    y = np.clip(x * gain, -1, 1)
    y = (y * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/wow/audio")
    ap.add_argument("--seconds", type=float, default=96.3)
    ap.add_argument("--climax", type=float, default=82.0)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    os.makedirs(os.path.join(a.out, "sfx"), exist_ok=True)

    print("score ...", flush=True)
    save(os.path.join(a.out, "music.wav"), music(a.seconds, a.climax), 0.8)
    print("room tone ...", flush=True)
    save(os.path.join(a.out, "roomtone.wav"), roomtone(a.seconds), 0.9)

    s = os.path.join(a.out, "sfx")
    print("sfx ...", flush=True)
    save(os.path.join(s, "impact.wav"), sfx_impact(), 1.0)
    save(os.path.join(s, "impact_deep.wav"), sfx_impact(seed=2, low=38, dur=1.6), 1.0)
    save(os.path.join(s, "whoosh_up.wav"), sfx_whoosh(0.55, True), 0.9)
    save(os.path.join(s, "whoosh_down.wav"), sfx_whoosh(0.55, False, 4), 0.9)
    save(os.path.join(s, "riser.wav"), sfx_riser(), 0.8)
    save(os.path.join(s, "printer.wav"), sfx_printer(), 0.9)
    save(os.path.join(s, "paper.wav"), sfx_paper(), 0.9)
    save(os.path.join(s, "click.wav"), sfx_click(), 0.9)
    save(os.path.join(s, "click_low.wav"), sfx_click(f=700), 0.9)
    save(os.path.join(s, "tape.wav"), sfx_tape(), 0.9)
    save(os.path.join(s, "static.wav"), sfx_static(), 0.9)
    save(os.path.join(s, "subdrop.wav"), sfx_sub_drop(), 0.9)
    save(os.path.join(s, "stinger.wav"), sfx_stinger(), 0.9)
    print("done ->", a.out)


if __name__ == "__main__":
    main()
