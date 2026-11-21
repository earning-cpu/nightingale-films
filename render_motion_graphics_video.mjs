/**
 * Full Pipeline Master Video Renderer:
 * Pipes 2,130 frames (71.0s @ 30fps) from Canvas directly into FFmpeg with x264 CRF 18
 * and mixes master stereo audio track.
 */

import { createCanvas } from '@napi-rs/canvas';
import { loadAssets, renderCompositeFrame, W, H, FPS } from './src/render_kuldhara_mograph.mjs';
import { spawn } from 'child_process';
import fs from 'fs';

const TOTAL_FRAMES = 2130; // 71.0s * 30fps

async function main() {
  console.log('Loading high-resolution stock plates...');
  const assets = await loadAssets();
  console.log('Assets successfully loaded into memory.');

  fs.mkdirSync('docs', { recursive: true });

  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-i', 'audio/kuldhara/kuldhara_master.aac',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-shortest',
    'docs/kuldhara_1080.mp4'
  ];

  console.log('Starting FFmpeg process...');
  const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  let currentFrame = 0;
  const startTime = Date.now();

  function renderNext() {
    if (currentFrame >= TOTAL_FRAMES) {
      ffmpeg.stdin.end();
      return;
    }

    ctx.clearRect(0, 0, W, H);
    renderCompositeFrame(ctx, assets, currentFrame);

    // Save poster frame at frame 120 (Scene 2 Title Card)
    if (currentFrame === 120) {
      const posterBuf = canvas.toBuffer('image/jpeg', { quality: 95 });
      fs.writeFileSync('docs/kuldhara_poster.jpg', posterBuf);
      console.log('Saved docs/kuldhara_poster.jpg');
    }

    const jpegBuf = canvas.toBuffer('image/jpeg', { quality: 90 });
    const canContinue = ffmpeg.stdin.write(jpegBuf);
    currentFrame++;

    if (currentFrame % 150 === 0 || currentFrame === TOTAL_FRAMES) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const fps = (currentFrame / elapsed).toFixed(1);
      const pct = ((currentFrame / TOTAL_FRAMES) * 100).toFixed(1);
      console.log(`Rendered frame ${currentFrame}/${TOTAL_FRAMES} (${pct}%) - ${fps} fps - Elapsed: ${elapsed}s`);
    }

    if (canContinue) {
      setImmediate(renderNext);
    } else {
      ffmpeg.stdin.once('drain', renderNext);
    }
  }

  ffmpeg.on('close', (code) => {
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nMaster video rendering complete in ${totalElapsed}s with exit code ${code}!`);
    process.exit(code || 0);
  });

  renderNext();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
