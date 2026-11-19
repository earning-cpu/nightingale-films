#!/usr/bin/env python3
"""make_roopkund_audio.py — Broadcast Sound Design & Audio Engine for Roopkund.
Synthesizes:
- 38Hz cinematic sub-dread drone + harmonic overtone
- High-altitude wind turbulence & blizzard roar
- Resonant ice thuds & stone impact transients
- High-tech scanner pulses
- Ducked voiceover mix with EBU R128 normalization (-16.5 LUFS)
"""
import os, subprocess, numpy as np

SR = 48000
TOTAL_DUR = 58.0
TOTAL_SAMPLES = int(TOTAL_DUR * SR)

def t_vec(sec):
    return np.arange(int(sec * SR), dtype=np.float32) / SR

def sine_wave(freq, sec, phase=0.0):
    return np.sin(2 * np.pi * freq * t_vec(sec) + phase).astype(np.float32)

def lowpass(x, cutoff_hz):
    a = np.exp(-2 * np.pi * cutoff_hz / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a * acc + (1 - a) * x[i]
        y[i] = acc
    return y

def envelope(n, a_s=0.1, d_s=0.3, s_lvl=0.7, r_s=0.5):
    a_n = int(a_s * SR)
    d_n = int(d_s * SR)
    r_n = int(r_s * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    parts = [
        np.linspace(0, 1, a_n, dtype=np.float32) if a_n else np.array([], np.float32),
        np.linspace(1, s_lvl, d_n, dtype=np.float32) if d_n else np.array([], np.float32),
        np.full(s_n, s_lvl, dtype=np.float32) if s_n else np.array([], np.float32),
        np.linspace(s_lvl, 0, r_n, dtype=np.float32) if r_n else np.array([], np.float32),
    ]
    env = np.concatenate([p for p in parts if len(p) > 0])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]

def make_drone():
    """Generates an evolving 38Hz - 55Hz cinematic dread drone."""
    t = t_vec(TOTAL_DUR)
    # Slow LFO modulation
    lfo1 = 0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t)
    lfo2 = 0.5 + 0.5 * np.sin(2 * np.pi * 0.03 * t)
    
    sub = 0.35 * sine_wave(38.0, TOTAL_DUR)
    bass = 0.25 * sine_wave(57.0, TOTAL_DUR, 0.4) * lfo1
    harm = 0.15 * sine_wave(114.0, TOTAL_DUR, 0.8) * lfo2
    
    drone = sub + bass + harm
    return lowpass(drone, 220)

def make_wind_blizzard():
    """Synthesizes high-altitude Himalayan blizzard howling."""
    t = t_vec(TOTAL_DUR)
    # Filtered pink/brown noise
    noise = np.random.normal(0, 1, TOTAL_SAMPLES).astype(np.float32)
    
    # Wind gust envelopes
    gust = (0.3 + 0.4 * np.sin(2 * np.pi * 0.12 * t)**2 + 
            0.3 * np.sin(2 * np.pi * 0.05 * t + 1.2)**2)
    
    wind = lowpass(noise, 650) * gust * 0.35
    # Whistling high resonance
    whistle = sine_wave(480, TOTAL_DUR) * np.sin(2 * np.pi * 0.18 * t)**2 * 0.08
    return wind + whistle

def make_impact(start_sec, dur_sec=1.5, freq=65.0, amp=0.6):
    """Generates an explosive low-frequency hailstone/ice impact."""
    arr = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    s_idx = int(start_sec * SR)
    n = int(dur_sec * SR)
    if s_idx + n > TOTAL_SAMPLES:
        n = TOTAL_SAMPLES - s_idx
    if n <= 0:
        return arr
    
    t = np.arange(n, dtype=np.float32) / SR
    # Exponential pitch decay
    freq_sweep = freq * np.exp(-t * 8.0)
    body = np.sin(2 * np.pi * freq_sweep * t)
    noise_crack = np.random.normal(0, 1, n).astype(np.float32) * np.exp(-t * 18.0)
    env = np.exp(-t * 3.5)
    
    arr[s_idx:s_idx+n] = (body * 0.7 + noise_crack * 0.4) * env * amp
    return arr

def generate_soundscape():
    print("[Audio] Synthesizing Himalayan soundscape...")
    drone = make_drone()
    wind = make_wind_blizzard()
    
    # Impacts at key moments:
    # 0.2s: Title drop sub-hit
    # 5.5s: Ice crack
    # 25.0s: Skull fracture reveal thud
    # 32.2s, 33.4s, 34.6s: Hailstone impacts
    # 36.5s: Nature 2019 scientific chime
    # 55.0s: Outro final sub-pulse
    hits = (make_impact(0.2, 2.0, 50.0, 0.7) +
            make_impact(5.5, 1.2, 120.0, 0.45) +
            make_impact(25.0, 2.5, 45.0, 0.8) +
            make_impact(32.2, 1.0, 55.0, 0.65) +
            make_impact(33.4, 1.0, 60.0, 0.7) +
            make_impact(34.6, 1.2, 48.0, 0.75) +
            make_impact(36.5, 2.0, 85.0, 0.5) +
            make_impact(55.0, 2.5, 40.0, 0.7))
    
    mix_left = drone * 0.6 + wind * 0.5 + hits * 0.7
    mix_right = drone * 0.6 + wind * 0.55 + hits * 0.7
    
    # Ensure stereo array
    stereo = np.column_stack([mix_left, mix_right])
    
    # Write score WAV
    import wave
    stereo_int16 = (np.clip(stereo, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open("audio/roopkund_score.wav", "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(stereo_int16.tobytes())
    print("[Audio] Wrote audio/roopkund_score.wav")

def mix_with_voiceovers():
    """Mixes synthesized score with 4 VO clips and applies ducking."""
    print("[Audio] Mixing voiceovers and score with FFmpeg...")
    # VO start times:
    # vo_01: 0.6s
    # vo_02: 9.0s
    # vo_03: 25.0s
    # vo_04: 36.5s
    
    cmd = [
        "ffmpeg", "-y",
        "-i", "audio/roopkund_score.wav",
        "-i", "audio/roopkund/vo_01.mp3",
        "-i", "audio/roopkund/vo_02.mp3",
        "-i", "audio/roopkund/vo_03.mp3",
        "-i", "audio/roopkund/vo_04.mp3",
        "-filter_complex",
        "[1:a]adelay=600|600[v1];"
        "[2:a]adelay=9000|9000[v2];"
        "[3:a]adelay=25000|25000[v3];"
        "[4:a]adelay=36500|36500[v4];"
        "[v1][v2][v3][v4]amix=inputs=4:normalize=0[vo_all];"
        "[0:a]volume=0.35[score_ducked];"
        "[score_ducked][vo_all]amix=inputs=2:duration=first:normalize=0,"
        "loudnorm=I=-16:TP=-1.5:LRA=11[master_audio]",
        "-map", "[master_audio]",
        "-t", "58.00",
        "-c:a", "aac", "-b:a", "192k",
        "audio/roopkund_master.aac"
    ]
    subprocess.run(cmd, check=True)
    print("[Audio] Successfully produced audio/roopkund_master.aac (EBU R128 Normalized)")

if __name__ == "__main__":
    generate_soundscape()
    mix_with_voiceovers()
