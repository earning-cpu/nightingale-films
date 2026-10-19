# 🎬 PROJECT NIGHTINGALE — Film Studio

A cinematic motion-graphics film pipeline built with **Remotion** (React video).

> *"There's a file nobody was supposed to open."*
> Area 51, 2026 — one surviving fragment. One recovery that never happened. 70 seconds of evidence.

## 🍿 Watch the film

Every render publishes automatically to a **permanent GitHub Release link** below →
**[Releases](../../releases)** — download `PROJECT_NIGHTINGALE_full.mp4`, watch, share. That link never expires.

## ⚙️ How it works

| Piece | What it does |
|---|---|
| `src/` | The 12-segment film (title, 10 scenes, end card) — kinetic type, HUD radar, glitch, stamps |
| `public/img/` | The core footage (user-provided shots + generated archive inserts) |
| `audio/nightingale_norm.wav` | 75 cue-locked score hits, broadcast loudness −14 LUFS |
| `.github/workflows/render.yml` | Cloud render → audio mux → **permanent Release publish** |

## 🚀 Render a video

- **Automatic:** every push to `main` triggers a full render
- **Manual:** Actions tab → *Render Nightingale* → *Run workflow* (choose `high` or `compact`)
- **Local:** `npm install && npx remotion browser ensure && npx remotion render src/index.ts Nightingale out/video.mp4`

Timeline: 2090 frames @ 30fps = 69.67s · 1920×1080 · H.264 + AAC · faststart

---
*Rendered in the cloud — so no video is ever lost again.* ✨
