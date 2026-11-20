// render_kuldhara_pure_2d.mjs - 100% Pure Vector 2D Animation Engine for Kuldhara
// Zero AI-generated images. Pure canvas drawing piped to FFmpeg.
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  drawSceneNightRuins,
  drawSceneProsperous1825,
  drawSceneSalimSingh,
  drawSceneChiefAndDaughter,
  drawSceneTempleCouncil,
  drawSceneNightExodus,
  drawSceneElderCurse,
  drawSceneAbandonedKitchen,
  drawSceneFootprintParadox,
  drawSceneASIGate,
  drawSceneThermalAnomaly,
  drawSceneOutro
} from "./src/kuldhara_scenes.mjs";

try {
  GlobalFonts.registerFromPath("./assets/NotoSansDevanagari-Bold.ttf", "Noto Sans Devanagari");
} catch (e) {}

const FPS = 30;
const DURATION = 71.0;
const TOTAL_FRAMES = Math.round(FPS * DURATION); // 2130 frames

// Shot Timeline Definitions
const SHOTS = [
  { id: "shot01_night_ruins",       start: 0.0,  end: 5.2,  render: drawSceneNightRuins },
  { id: "shot02_prosperous_1825",   start: 5.2,  end: 11.0, render: drawSceneProsperous1825 },
  { id: "shot03_salim_singh",       start: 11.0, end: 17.0, render: drawSceneSalimSingh },
  { id: "shot04_chief_daughter",    start: 17.0, end: 25.0, render: drawSceneChiefAndDaughter },
  { id: "shot05_temple_council",    start: 25.0, end: 33.5, render: drawSceneTempleCouncil },
  { id: "shot06_night_exodus",      start: 33.5, end: 39.5, render: drawSceneNightExodus },
  { id: "shot07_elder_curse",       start: 39.5, end: 49.2, render: drawSceneElderCurse },
  { id: "shot08_abandoned_kitchen", start: 49.2, end: 54.5, render: drawSceneAbandonedKitchen },
  { id: "shot09_footprint_paradox", start: 54.5, end: 58.5, render: drawSceneFootprintParadox },
  { id: "shot10_asi_gate",          start: 58.5, end: 64.0, render: drawSceneASIGate },
  { id: "shot11_thermal_anomaly",   start: 64.0, end: 68.5, render: drawSceneThermalAnomaly },
  { id: "shot12_outro",             start: 68.5, end: 71.0, render: drawSceneOutro }
];

function getShotForTime(t) {
  for (const shot of SHOTS) {
    if (t >= shot.start && t < shot.end) return shot;
  }
  return SHOTS[SHOTS.length - 1];
}

async function renderPure2DVideo(W, H, outRawMp4) {
  console.log(`Starting Pure 2D Render (${W}x${H}, ${FPS} fps, ${TOTAL_FRAMES} frames) -> ${outRawMp4}...`);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const ffmpegArgs = [
    "-v", "error", "-y",
    "-f", "rawvideo",
    "-pix_fmt", "rgba",
    "-s", `${W}x${H}`,
    "-r", String(FPS),
    "-i", "-",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "17",
    "-pix_fmt", "yuv420p",
    outRawMp4
  ];

  const ff = spawn("ffmpeg", ffmpegArgs, { stdio: ["pipe", "inherit", "inherit"] });

  const tStart = Date.now();
  for (let frameIdx = 0; frameIdx < TOTAL_FRAMES; frameIdx++) {
    const t = frameIdx / FPS;
    const shot = getShotForTime(t);
    const shotTime = t - shot.start;

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    shot.render(ctx, W, H, shotTime);
    ctx.restore();

    const imgData = ctx.getImageData(0, 0, W, H);
    const buf = Buffer.from(imgData.data.buffer, imgData.data.byteOffset, imgData.data.byteLength);

    if (!ff.stdin.write(buf)) {
      await new Promise(r => ff.stdin.once("drain", r));
    }

    if (frameIdx % (FPS * 5) === 0 || frameIdx === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
      const pct = ((frameIdx / TOTAL_FRAMES) * 100).toFixed(1);
      process.stdout.write(`  Rendered frame ${frameIdx}/${TOTAL_FRAMES} (${pct}%) in ${elapsed}s\n`);
    }
  }

  ff.stdin.end();
  const exitCode = await new Promise(r => ff.on("close", r));
  if (exitCode !== 0) throw new Error(`FFmpeg exited with error code ${exitCode}`);
  console.log(`Raw render completed successfully: ${outRawMp4}`);
}

async function main() {
  fs.mkdirSync("docs", { recursive: true });
  fs.mkdirSync("qa_kuldhara", { recursive: true });

  const raw1080 = "qa_kuldhara/kuldhara_raw_1080.mp4";
  await renderPure2DVideo(1920, 1080, raw1080);

  // Mux with Master Audio and HarfBuzz Subtitles
  console.log("Muxing 1080p Master with Master Audio & Libass HarfBuzz kinetic subtitles...");
  execSync(
    `ffmpeg -y -i ${raw1080} -i audio/kuldhara/kuldhara_master.aac ` +
    `-vf "subtitles=audio/kuldhara_subs.ass:fontsdir=assets" ` +
    `-c:v libx264 -preset veryfast -crf 18 -c:a aac -b:a 192k -shortest docs/kuldhara_1080.mp4`,
    { stdio: "inherit" }
  );
  console.log("Generated docs/kuldhara_1080.mp4");

  // Export 720p HD
  console.log("Encoding 720p HD...");
  execSync(
    `ffmpeg -y -i docs/kuldhara_1080.mp4 -vf "scale=1280:720" -c:v libx264 -preset veryfast -crf 20 -c:a copy docs/kuldhara_720.mp4`,
    { stdio: "inherit" }
  );

  // Export 480p SD Mobile
  console.log("Encoding 480p SD Mobile...");
  execSync(
    `ffmpeg -y -i docs/kuldhara_1080.mp4 -vf "scale=854:480" -c:v libx264 -preset veryfast -crf 22 -c:a copy docs/kuldhara_480.mp4`,
    { stdio: "inherit" }
  );

  // Export 9:16 Vertical Shorts
  console.log("Encoding 9:16 Vertical Shorts Cut (720x1280)...");
  execSync(
    `ffmpeg -y -i docs/kuldhara_1080.mp4 -filter_complex "` +
    `[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=25:5[bg];` +
    `[0:v]scale=720:405[fg];` +
    `[bg][fg]overlay=0:(H-h)/2[v]" ` +
    `-map "[v]" -map 0:a -c:v libx264 -preset veryfast -crf 20 -c:a copy docs/kuldhara_vertical_720.mp4`,
    { stdio: "inherit" }
  );

  // Generate Poster Frame
  console.log("Generating 1080p Poster Keyframe...");
  execSync(
    `ffmpeg -y -ss 00:00:14.000 -i docs/kuldhara_1080.mp4 -vframes 1 -q:v 2 docs/kuldhara_poster.jpg`,
    { stdio: "inherit" }
  );

  console.log("All Pure 2D Animated Master deliverables generated successfully!");
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
