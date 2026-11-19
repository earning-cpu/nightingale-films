"""
Procedural Sound Design & Audio Engine for Kuldhara Short Film.
Generates:
1. Low-frequency 36Hz / 48Hz Sub-bass Dread Drone (synthesized)
2. Thar Desert Howling Wind & Sand Whistle (bandpass noise)
3. Impact Stingers & Reveal Bass Drops
4. Muxes with Hindi Voiceover tracks (vo_01 to vo_04)
5. EBU R128 Broadcast Normalization (-16.0 LUFS, -1.5 dBFS True Peak)
"""

import numpy as np
import subprocess
import os

SR = 48000
TOTAL_DUR = 71.00

def make_sine(freq, dur, amp=0.5):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    return amp * np.sin(2 * np.pi * freq * t)

def make_dread_drone(dur):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    # Fundamental 36Hz sub-drone with 72Hz octave and slow pulsing LFO
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t)
    sub = 0.45 * np.sin(2 * np.pi * 36.0 * t) * lfo
    harm1 = 0.25 * np.sin(2 * np.pi * 72.0 * t) * (0.7 + 0.3 * np.cos(2 * np.pi * 0.22 * t))
    harm2 = 0.12 * np.sin(2 * np.pi * 108.0 * t)
    # Pitch bend tension at climax (around 58-64s)
    tension_env = np.clip((t - 58.0) / 6.0, 0, 1.0)
    tension_pitch = 0.18 * np.sin(2 * np.pi * (36.0 + tension_env * 24.0) * t) * tension_env
    
    return sub + harm1 + harm2 + tension_pitch

def make_desert_wind(dur):
    np.random.seed(1825)
    samples = int(SR * dur)
    # White noise base
    noise = np.random.normal(0, 1.0, samples)
    
    # 2-pole simple resonant filter simulation
    t = np.linspace(0, dur, samples, endpoint=False)
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t + np.sin(2 * np.pi * 0.03 * t))
    
    # Simple cumulative moving average for low/mid rumble
    kernel_size = 64
    kernel = np.ones(kernel_size) / kernel_size
    smoothed = np.convolve(noise, kernel, mode='same')
    
    # Howling gusts
    gust_env = (np.sin(2 * np.pi * 0.12 * t)**2) * 0.4 + 0.3
    wind = smoothed * gust_env * 0.65
    return wind

def make_impact(hit_time, dur=2.0, freq=55.0, amp=0.7):
    total_samples = int(SR * TOTAL_DUR)
    out = np.zeros(total_samples, dtype=np.float32)
    start_idx = int(SR * hit_time)
    hit_samples = int(SR * dur)
    if start_idx >= total_samples:
        return out
    actual_samples = min(hit_samples, total_samples - start_idx)
    
    t = np.linspace(0, actual_samples / SR, actual_samples, endpoint=False)
    # Pitch drop
    freq_sweep = freq * np.exp(-t * 3.5)
    phase = 2 * np.pi * np.cumsum(freq_sweep) / SR
    env = np.exp(-t * 2.2) * amp
    out[start_idx:start_idx + actual_samples] = env * np.sin(phase)
    return out

def generate_soundscape():
    os.makedirs("audio/kuldhara", exist_ok=True)
    print(f"[Audio] Synthesizing {TOTAL_DUR}s high-fidelity atmospheric soundscape...")
    
    drone = make_dread_drone(TOTAL_DUR)
    wind = make_desert_wind(TOTAL_DUR)
    
    # Impact stingers:
    # 0.2s: Title drop hit
    # 3.8s: Reveal snap
    # 11.2s: Diwan Salim Singh reveal hit
    # 17.0s: Ultimatum impact
    # 25.0s: Secret council gavel/gong
    # 33.5s: Midnight exodus drone swell
    # 39.5s: The Curse pronouncement thunder hit
    # 56.5s: ASI Warning Board dramatic hit
    # 61.5s: FLIR Thermal Anomaly frequency stinger
    # 64.0s: Climax pulse
    # 66.5s: Outro final sub-pulse
    hits = (make_impact(0.2, 2.0, 48.0, 0.7) +
            make_impact(3.8, 1.5, 65.0, 0.55) +
            make_impact(11.2, 2.0, 52.0, 0.65) +
            make_impact(17.0, 2.0, 50.0, 0.6) +
            make_impact(25.0, 2.5, 45.0, 0.7) +
            make_impact(33.5, 2.5, 42.0, 0.75) +
            make_impact(39.5, 3.0, 40.0, 0.8) +
            make_impact(56.5, 2.0, 52.0, 0.7) +
            make_impact(61.5, 2.0, 68.0, 0.75) +
            make_impact(64.0, 2.0, 46.0, 0.7) +
            make_impact(66.5, 2.5, 38.0, 0.75))
    
    mix_left = drone * 0.6 + wind * 0.5 + hits * 0.7
    mix_right = drone * 0.6 + wind * 0.55 + hits * 0.7
    
    stereo = np.column_stack([mix_left, mix_right])
    
    import wave
    stereo_int16 = (np.clip(stereo, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open("audio/kuldhara/kuldhara_score.wav", "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(stereo_int16.tobytes())
    print("[Audio] Wrote audio/kuldhara/kuldhara_score.wav")

def mix_with_voiceovers():
    print("[Audio] Mixing voiceovers and score with FFmpeg...")
    # Timing:
    # vo_01: 0.6s (ends at ~16.8s)
    # vo_02: 17.0s (ends at ~33.1s)
    # vo_03: 33.5s (ends at ~48.9s)
    # vo_04: 49.2s (ends at ~64.0s)
    
    cmd = [
        "ffmpeg", "-y",
        "-i", "audio/kuldhara/kuldhara_score.wav",
        "-i", "audio/kuldhara/vo_01.mp3",
        "-i", "audio/kuldhara/vo_02.mp3",
        "-i", "audio/kuldhara/vo_03.mp3",
        "-i", "audio/kuldhara/vo_04.mp3",
        "-filter_complex",
        "[1:a]adelay=600|600[v1];"
        "[2:a]adelay=17000|17000[v2];"
        "[3:a]adelay=33500|33500[v3];"
        "[4:a]adelay=49200|49200[v4];"
        "[v1][v2][v3][v4]amix=inputs=4:normalize=0[vo_all];"
        "[0:a]volume=0.32[score_ducked];"
        "[score_ducked][vo_all]amix=inputs=2:duration=first:normalize=0,"
        "loudnorm=I=-16:TP=-1.5:LRA=10[master_audio]",
        "-map", "[master_audio]",
        "-t", str(TOTAL_DUR),
        "-c:a", "aac", "-b:a", "192k",
        "audio/kuldhara/kuldhara_master.aac"
    ]
    subprocess.run(cmd, check=True)
    print("[Audio] Successfully produced audio/kuldhara/kuldhara_master.aac (EBU R128 Normalized)")

if __name__ == "__main__":
    generate_soundscape()
    mix_with_voiceovers()
