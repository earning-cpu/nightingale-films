#!/usr/bin/env python3
"""make_hindi_horror.py — Autonomous Production Engine for Hindi Horror Film.
Film: "बेगुनकोदर: 42 साल का सन्नाटा" (Begunkodar: 42 Years of Silence)
Fully automated: Score synthesis -> Voice mux -> Video grading -> Multi-res ladder.
"""
import os, sys, subprocess, numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
SR = 48000
FPS = 30
TOTAL_DUR = 38.0
TOTAL_SAMPLES = int(TOTAL_DUR * SR)

def t_vec(sec):
    return np.arange(int(sec * SR), dtype=np.float32) / SR

def sine_wave(freq, sec, phase=0.0):
    return np.sin(2 * np.pi * freq * t_vec(sec) + phase).astype(np.float32)

def saw_wave(freq, sec, detune=0.0):
    x = t_vec(sec)
    ph = (freq * (1 + detune) * x) % 1.0
    return (2 * ph - 1).astype(np.float32)

def lowpass(x, cutoff_hz):
    a = np.exp(-2 * np.pi * cutoff_hz / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a * acc + (1 - a) * x[i]
        y[i] = acc
    return y

def envelope(n, a_s=0.05, d_s=0.2, s_lvl=0.6, r_s=0.5):
    a_n = int(a_s * SR)
    d_n = int(d_s * SR)
    r_n = int(r_s * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    parts = [
        np.linspace(0, 1, a_n, dtype=np.float32) if a_n else np.array([], np.float32),
        np.linspace(1, s_lvl, d_n, dtype=np.float32) if d_n else np.array([], np.float32),
        np.full(s_n, s_lvl, dtype=np.float32),
        np.linspace(s_lvl, 0, r_n, dtype=np.float32) if r_n else np.array([], np.float32)
    ]
    e = np.concatenate(parts)
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]

def synthesize_score():
    print("Synthesizing horror score and sound design...")
    score = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    # 1. 42 Hz Sub-Bass Dread Drone (0s to 34s)
    drone_dur = 34.0
    drone_n = int(drone_dur * SR)
    d1 = sine_wave(42.0, drone_dur) * 0.22
    d2 = saw_wave(42.0, drone_dur, detune=0.005) * 0.08
    sub = lowpass(d1 + d2, 110.0)
    # Slow tremolo modulation
    tremolo = 0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * t_vec(drone_dur))
    sub *= tremolo
    score[:drone_n] += sub * envelope(drone_n, a_s=1.5, d_s=0.5, s_lvl=0.8, r_s=2.0)
    
    # 2. Heartbeat pulses (starts at 8.0s, accelerates from 55 bpm to 90 bpm)
    for hb_time in [8.5, 9.6, 10.7, 11.8, 12.8, 13.7, 14.6, 15.4, 16.2, 17.0, 
                   17.7, 18.4, 19.1, 19.8, 20.4, 21.0, 21.6, 22.2, 22.7, 23.2,
                   23.7, 24.2, 24.7, 25.1, 25.5, 25.9, 26.3, 26.7, 27.1, 27.5,
                   28.0, 28.5, 29.0, 29.5, 30.0, 30.5, 31.0, 31.5, 32.0, 32.5, 33.0]:
        idx = int(hb_time * SR)
        pulse_dur = 0.18
        pulse = sine_wave(50.0, pulse_dur) * np.exp(-18 * t_vec(pulse_dur)) * 0.28
        end_idx = min(TOTAL_SAMPLES, idx + len(pulse))
        score[idx:end_idx] += pulse[:end_idx - idx]

    # 3. Ambient Metallic Pad (D Minor / G# tritone tension)
    for at_s, freq in [(0.5, 146.83), (8.8, 155.56), (17.5, 130.81), (26.0, 110.0)]:
        pad_dur = 8.5
        pad = (saw_wave(freq, pad_dur, -0.004) + saw_wave(freq, pad_dur, 0.004)) * 0.07
        pad = lowpass(pad, 750.0) * envelope(int(pad_dur * SR), a_s=1.2, d_s=1.0, s_lvl=0.5, r_s=1.8)
        idx = int(at_s * SR)
        end_idx = min(TOTAL_SAMPLES, idx + len(pad))
        score[idx:end_idx] += pad[:end_idx - idx]

    # 4. Tension Riser (28.0s to 34.0s)
    riser_dur = 6.0
    r_t = t_vec(riser_dur)
    sweep_freq = 180.0 + 400.0 * (r_t / riser_dur)**2
    riser = np.sin(2 * np.pi * sweep_freq * r_t) * (r_t / riser_dur) * 0.16
    idx_r = int(28.0 * SR)
    score[idx_r:idx_r + len(riser)] += riser

    # 5. NEGATIVE SPACE: 34.0s to 34.8s is DEAD SILENCE (The Subtraction)
    score[int(34.0 * SR):int(34.8 * SR)] = 0.0

    # 6. CLIMACTIC JUMP STINGER at 34.8s
    stinger_idx = int(34.8 * SR)
    stinger_dur = 3.2
    s_t = t_vec(stinger_dur)
    # Heavy sub drop (80 Hz down to 25 Hz)
    sub_drop = np.sin(2 * np.pi * (80.0 * np.exp(-3 * s_t)) * s_t) * 0.45
    # Metallic clang / crash
    noise_burst = np.random.normal(0, 1, int(stinger_dur * SR)).astype(np.float32)
    noise_burst = lowpass(noise_burst, 4000.0) * np.exp(-4 * s_t) * 0.35
    screech = (saw_wave(440.0, stinger_dur) + saw_wave(466.0, stinger_dur)) * np.exp(-2.5 * s_t) * 0.25
    stinger = (sub_drop + noise_burst + screech) * np.exp(-1.2 * s_t)
    end_s = min(TOTAL_SAMPLES, stinger_idx + len(stinger))
    score[stinger_idx:end_s] += stinger[:end_s - stinger_idx]

    # Normalize score
    peak = np.max(np.abs(score))
    if peak > 0:
        score = score / peak * 0.70

    os.makedirs("audio/hindi_horror", exist_ok=True)
    raw_score_path = "audio/hindi_horror/score_raw.wav"
    import wave
    with wave.open(raw_score_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((score * 32767).astype(np.int16).tobytes())
    print("Horror score generated successfully.")
    return raw_score_path

def build_audio_mix(raw_score):
    print("Building mastered audio mix with dialogue ducking and loudnorm...")
    # Cues:
    # vo_01: starts at 0.5s
    # vo_02: starts at 8.8s
    # vo_03: starts at 17.2s
    # vo_04: starts at 27.2s
    master_mix_path = "audio/hindi_horror/master_mix.m4a"
    mix_cmd = [
        "ffmpeg", "-y",
        "-i", raw_score,
        "-i", "audio/hindi_horror/vo_01.mp3",
        "-i", "audio/hindi_horror/vo_02.mp3",
        "-i", "audio/hindi_horror/vo_03.mp3",
        "-i", "audio/hindi_horror/vo_04.mp3",
        "-filter_complex",
        "[1:a]adelay=500:all=1[v1];"
        "[2:a]adelay=8800:all=1[v2];"
        "[3:a]adelay=17200:all=1[v3];"
        "[4:a]adelay=27200:all=1[v4];"
        "[v1][v2][v3][v4]amix=inputs=4:normalize=0[vo_all];"
        "[0:a]volume=0.35[sc_ducked];"
        "[sc_ducked][vo_all]amix=inputs=2:duration=first:normalize=0[mixed];"
        "[mixed]loudnorm=I=-14.0:TP=-1.5:LRA=9.0[aout]",
        "-map", "[aout]",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        master_mix_path
    ]
    subprocess.run(mix_cmd, check=True)
    print("Audio mix mastered:", master_mix_path)
    return master_mix_path

def render_video(master_audio):
    print("Rendering cinematic visuals, motion typography, and halation finish...")
    # 4 Scenes:
    # Scene 1 (0.0 to 8.8s, 264 frames): Station overview + Hook
    # Scene 2 (8.8 to 17.2s, 252 frames): Tracks + Silhouette + Sighting
    # Scene 3 (17.2 to 27.2s, 300 frames): Semaphore Signal + Escalation
    # Scene 4 (27.2 to 38.0s, 324 frames): Warning Board + Climax + Jump Stinger
    
    font = "assets/NotoSansDevanagari-Bold.ttf"
    
    # Scene 1:
    s1_filter = (
        f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        f"zoompan=z='min(zoom+0.0006,1.10)':d=264:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,"
        f"curves=all='0/0.02 0.5/0.48 1/0.95':blue='0/0.04 0.5/0.55 1/1.0':red='0/0.0 0.5/0.44 1/0.88',"
        f"drawbox=x=0:y=0:w=iw:h=84:color=black:t=fill,"
        f"drawbox=x=0:y=ih-84:w=iw:h=84:color=black:t=fill,"
        f"drawtext=fontfile={font}:text='स्थान\\: पुरुलिया, पश्चिम बंगाल  |  1967':fontsize=32:fontcolor='#D9A441':x=(w-text_w)/2:y=110:enable='between(t,0.5,8.5)',"
        f"drawtext=fontfile={font}:text='1967. पुरुलिया जिला।':fontsize=52:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,0.5,4.2)',"
        f"drawtext=fontfile={font}:text='भारतीय रेलवे ने एक स्टेशन को 42 साल के लिए बंद कर दिया।':fontsize=44:fontcolor='#FF4B36':borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,4.3,8.7)'"
    )
    
    s2_filter = (
        f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        f"zoompan=z='min(zoom+0.0007,1.12)':d=252:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,"
        f"curves=all='0/0.01 0.5/0.46 1/0.92':green='0/0.02 0.5/0.52 1/0.95':red='0/0.0 0.5/0.42 1/0.85',"
        f"drawbox=x=0:y=0:w=iw:h=84:color=black:t=fill,"
        f"drawbox=x=0:y=ih-84:w=iw:h=84:color=black:t=fill,"
        f"drawtext=fontfile={font}:text='रात का घना कोहरा  |  पटरियों पर साया':fontsize=32:fontcolor='#D9A441':x=(w-text_w)/2:y=110:enable='between(t,0.2,8.0)',"
        f"drawtext=fontfile={font}:text='स्टेशन मास्टर ने पटरियों पर एक सफेद साया देखा।':fontsize=48:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,0.2,4.0)',"
        f"drawtext=fontfile={font}:text='अगली सुबह... रेलवे क्वार्टर में उसकी लाश मिली।':fontsize=48:fontcolor='#FF4B36':borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,4.1,8.2)'"
    )

    s3_filter = (
        f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        f"zoompan=z='min(zoom+0.0006,1.10)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,"
        f"curves=all='0/0.02 0.5/0.47 1/0.96':red='0/0.05 0.5/0.58 1/1.0':blue='0/0.0 0.5/0.40 1/0.82',"
        f"drawbox=x=0:y=0:w=iw:h=84:color=black:t=fill,"
        f"drawbox=x=0:y=ih-84:w=iw:h=84:color=black:t=fill,"
        f"drawtext=fontfile={font}:text='42 साल का सन्नाटा  |  अमावस की रात':fontsize=32:fontcolor='#D9A441':x=(w-text_w)/2:y=110:enable='between(t,0.2,9.6)',"
        f"drawtext=fontfile={font}:text='उसके बाद कोई ट्रेन वहाँ नहीं रुकी।':fontsize=50:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,0.2,3.8)',"
        f"drawtext=fontfile={font}:text='सिग्नल अपने आप लाल हो जाता था... और पटरियों से चीखें आती थीं।':fontsize=42:fontcolor='#FF4B36':borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,4.0,9.7)'"
    )

    # Scene 4 has the climax and jump flash at t=7.6s (34.8s overall)
    s4_filter = (
        f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        f"zoompan=z='min(zoom+0.0008,1.15)':d=324:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,"
        f"curves=all='0/0.01 0.5/0.45 1/0.92',"
        f"drawbox=x=0:y=0:w=iw:h=84:color=black:t=fill,"
        f"drawbox=x=0:y=ih-84:w=iw:h=84:color=black:t=fill,"
        f"drawtext=fontfile={font}:text='चेतावनी  |  BEGUNKODAR':fontsize=32:fontcolor='#D9A441':x=(w-text_w)/2:y=110:enable='between(t,0.2,7.2)',"
        f"drawtext=fontfile={font}:text='बेगुनकोदर। वो नाम जिसे नक्शे से मिटा दिया गया।':fontsize=46:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,0.2,4.0)',"
        f"drawtext=fontfile={font}:text='अगर ट्रेन वहाँ धीमी हो जाए... तो खिड़की से बाहर मत देखना।':fontsize=42:fontcolor='#FF4B36':borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-170:enable='between(t,4.2,7.5)',"
        # Negative space flash frame at t=7.6
        f"drawbox=x=0:y=0:w=iw:h=ih:color=white:t=fill:enable='between(t,7.60,7.67)',"
        # Climax Title Card (t=7.68 to 10.8)
        f"drawbox=x=0:y=0:w=iw:h=ih:color=black@0.85:t=fill:enable='gte(t,7.68)',"
        f"drawtext=fontfile={font}:text='बेगुनकोदर':fontsize=86:fontcolor='#FF2200':borderw=5:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2-60:enable='gte(t,7.68)',"
        f"drawtext=fontfile={font}:text='42 YEARS OF SILENCE':fontsize=44:fontcolor='#D9A441':borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2+40:enable='gte(t,7.68)',"
        f"drawtext=fontfile={font}:text='पश्चिम बंगाल का शापित रेलवे स्टेशन':fontsize=30:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+110:enable='gte(t,7.85)'"
    )

    os.makedirs("qa_hindi", exist_ok=True)
    c1 = "qa_hindi/s1.mp4"
    c2 = "qa_hindi/s2.mp4"
    c3 = "qa_hindi/s3.mp4"
    c4 = "qa_hindi/s4.mp4"

    print("Rendering Scene 1...")
    subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", "public/img/begunkodar_station.jpg",
                    "-vf", s1_filter, "-t", "8.8", "-r", "30", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "19", c1], check=True)
    
    print("Rendering Scene 2...")
    subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", "public/img/begunkodar_tracks.jpg",
                    "-vf", s2_filter, "-t", "8.4", "-r", "30", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "19", c2], check=True)

    print("Rendering Scene 3...")
    subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", "public/img/begunkodar_signal.jpg",
                    "-vf", s3_filter, "-t", "10.0", "-r", "30", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "19", c3], check=True)

    print("Rendering Scene 4...")
    subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", "public/img/begunkodar_sign.jpg",
                    "-vf", s4_filter, "-t", "10.8", "-r", "30", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "19", c4], check=True)

    # Concat scenes together
    list_file = "qa_hindi/concat.txt"
    with open(list_file, "w") as f:
        f.write(f"file '{os.path.abspath(c1)}'\n")
        f.write(f"file '{os.path.abspath(c2)}'\n")
        f.write(f"file '{os.path.abspath(c3)}'\n")
        f.write(f"file '{os.path.abspath(c4)}'\n")

    raw_video = "qa_hindi/raw_combined.mp4"
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file, "-c", "copy", raw_video], check=True)

    # Final Master Mux with Audio + Halation + Film Grain
    print("Muxing final 1080p master with BT.709 color tags and film grain...")
    master_1080 = "docs/begunkodar_1080.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", master_audio,
        "-vf", "noise=alls=6:allf=t+u,format=yuv420p",
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "slow", "-crf", "20",
        "-maxrate", "6000k", "-bufsize", "12000k",
        "-profile:v", "high", "-level", "4.1",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
        "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart",
        master_1080
    ], check=True)

    # Render downscale ladder (720p, 480p, 9:16 Vertical, Poster)
    print("Building multi-resolution delivery ladder...")
    master_720 = "docs/begunkodar_720.mp4"
    subprocess.run(["ffmpeg", "-y", "-i", master_1080, "-vf", "scale=1280:720:flags=lanczos",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-c:a", "copy", "-movflags", "+faststart", master_720], check=True)

    master_480 = "docs/begunkodar_480.mp4"
    subprocess.run(["ffmpeg", "-y", "-i", master_1080, "-vf", "scale=854:480:flags=lanczos",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-c:a", "copy", "-movflags", "+faststart", master_480], check=True)

    # 9:16 Vertical Cut (Shorts / Reels)
    print("Building 9:16 vertical cut for YouTube Shorts...")
    vertical_720 = "docs/begunkodar_vertical_720.mp4"
    vf_vert = "[0:v]crop=1920:912:0:84,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=40:2,eq=brightness=0.08:saturation=1.3[bg];[0:v]crop=1920:912:0:84,scale=720:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
    subprocess.run(["ffmpeg", "-y", "-i", master_1080, "-filter_complex", vf_vert, "-map", "[v]", "-map", "0:a",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-c:a", "copy", "-movflags", "+faststart", vertical_720], check=True)

    # Poster thumbnail frame
    poster_jpg = "docs/begunkodar_poster.jpg"
    subprocess.run(["ffmpeg", "-y", "-ss", "35.2", "-i", master_1080, "-frames:v", "1", "-q:v", "2", poster_jpg], check=True)
    
    print("Multi-resolution finish complete.")
    return master_1080, master_720

if __name__ == "__main__":
    score_file = synthesize_score()
    mix_file = build_audio_mix(score_file)
    master_1080, master_720 = render_video(mix_file)
    print("ALL DONE! Master video ready at:", master_1080)
