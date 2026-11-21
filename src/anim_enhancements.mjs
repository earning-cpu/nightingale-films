// anim_enhancements.mjs — Advanced Motion Graphics & Documentary Styling Engine
// Inspired by modern documentary animation (Kurzgesagt, Vox, Lemmino) and Claude animation skills.
import { createCanvas } from "@napi-rs/canvas";

// 1. Precomputed high-speed procedural film grain canvas (avoids per-frame per-pixel overhead)
let cachedGrainCanvas = null;
function getGrainPattern(ctx, W, H) {
  if (!cachedGrainCanvas) {
    const size = 256;
    cachedGrainCanvas = createCanvas(size, size);
    const gctx = cachedGrainCanvas.getContext("2d");
    const imgData = gctx.createImageData(size, size);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 50) | 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 30 + ((Math.random() * 40) | 0);
    }
    gctx.putImageData(imgData, 0, 0);
  }
  return ctx.createPattern(cachedGrainCanvas, "repeat");
}

export function applyCinematicFilmLook(ctx, W, H, t, { vignette = 0.35, grainAlpha = 0.06 } = {}) {
  ctx.save();
  // Procedural film grain
  const pat = getGrainPattern(ctx, W, H);
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = grainAlpha;
  ctx.translate((t * 37) % 64, (t * 53) % 64);
  ctx.fillStyle = pat;
  ctx.fillRect(-64, -64, W + 128, H + 128);
  ctx.restore();

  // Cinematic edge vignette
  if (vignette > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const radG = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    radG.addColorStop(0, "rgba(0,0,0,0)");
    radG.addColorStop(1, `rgba(4, 6, 12, ${vignette})`);
    ctx.fillStyle = radG;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// 2. Sleek Modern Documentary HUD & Telemetry Overlay (Vox / Lemmino / Netflix style)
export function drawDocumentaryHUD(ctx, W, H, t, {
  location = "27° 19′ N, 70° 54′ E · THAR DESERT, JAISALMER",
  era = "CIRCA 1825 CE · PALIWAL HERITAGE SITE",
  chapter = "CASE STUDY 01",
  accentColor = "#E5A93C",
  radar = false,
  alpha = 0.92
} = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const margin = 80;

  // Top Minimalist Header
  ctx.textAlign = "left";
  ctx.font = "bold 13px 'Inter', sans-serif";
  ctx.fillStyle = accentColor;
  ctx.fillText("NIGHTINGALE FILMS", margin, 48);

  const brandW = ctx.measureText("NIGHTINGALE FILMS").width;
  ctx.font = "12px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
  ctx.fillText("•  INVESTIGATION ARCHIVE", margin + brandW + 12, 48);

  // Top-Right Telemetry
  ctx.textAlign = "right";
  ctx.font = "500 12px 'Inter', monospace";
  ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
  ctx.fillText(location, W - margin, 48);

  // Subtle separator line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, 60);
  ctx.lineTo(W - margin, 60);
  ctx.stroke();

  // Top-Left Chapter Pill
  if (chapter) {
    const pillX = margin;
    const pillY = 72;
    ctx.font = "bold 11px 'Inter', sans-serif";
    const textW = ctx.measureText(chapter).width;
    const pillW = Math.max(120, textW + 36);

    ctx.fillStyle = "rgba(10, 16, 28, 0.85)";
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, 24, 4);
    ctx.fill();
    ctx.stroke();

    // Pulsing REC dot
    const pulse = 0.5 + Math.sin(t * 6) * 0.5;
    ctx.fillStyle = `rgba(255, 51, 68, ${pulse})`;
    ctx.beginPath();
    ctx.arc(pillX + 14, pillY + 12, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(chapter, pillX + 26, pillY + 16);

    // Era / Historical Subtitle
    if (era) {
      ctx.font = "600 12px 'Inter', sans-serif";
      ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
      ctx.fillText(era, pillX + pillW + 16, pillY + 16);
    }
  }

  ctx.restore();
}

// 3. Volumetric God Rays & Light Shafts
export function drawVolumetricBeam(ctx, x1, y1, x2, y2, spreadTop, spreadBottom, color = "rgba(255, 230, 160, 0.18)") {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.65, color.replace(/[\d.]+\)$/, "0.08)"));
  grad.addColorStop(1, "rgba(255, 230, 160, 0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x1 - spreadTop / 2, y1);
  ctx.lineTo(x1 + spreadTop / 2, y1);
  ctx.lineTo(x2 + spreadBottom / 2, y2);
  ctx.lineTo(x2 - spreadBottom / 2, y2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 4. Floating Atmospheric Dust Motes
export function drawFloatingDust(ctx, W, H, t, { count = 35, seed = 42, color = "rgba(255, 240, 200, 0.75)" } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random movement based on seed and time
    const s = seed + i * 197.3;
    const baseX = ((s * 9301 + 49297) % 233280) / 233280 * W;
    const baseY = ((s * 49297 + 9301) % 233280) / 233280 * H;
    const speed = 12 + (i % 7) * 4;
    const driftX = Math.sin(t * 0.8 + i) * 35;
    const curY = (baseY - t * speed) % H;
    const finalY = curY < 0 ? curY + H : curY;
    const finalX = (baseX + driftX + W) % W;
    const radius = 1.0 + (i % 3) * 0.8;
    const alpha = 0.2 + Math.sin(t * 2 + i) * 0.25;

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.beginPath();
    ctx.arc(finalX, finalY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 5. Dynamic Procedural Flames & Rising Embers
export function drawDynamicFlame(ctx, x, y, size, t, { colorInner = "#FFF2A8", colorMid = "#FF9922", colorOuter = "#D9381E" } = {}) {
  ctx.save();
  const flick1 = Math.sin(t * 18) * 0.15 + Math.cos(t * 27) * 0.1;
  const flick2 = Math.cos(t * 22) * 0.2;
  const h = size * (1.0 + flick1);
  const w = size * 0.45 * (1.0 + flick2 * 0.5);

  // Outer glow
  const gOuter = ctx.createRadialGradient(x, y - h * 0.4, 0, x, y - h * 0.4, size * 1.5);
  gOuter.addColorStop(0, "rgba(255, 140, 30, 0.35)");
  gOuter.addColorStop(1, "rgba(255, 80, 0, 0)");
  ctx.fillStyle = gOuter;
  ctx.beginPath();
  ctx.arc(x, y - h * 0.4, size * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Outer Flame Tongue
  ctx.fillStyle = colorOuter;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w * 1.2, y - h * 0.6, x + flick2 * 10, y - h);
  ctx.quadraticCurveTo(x + w * 1.2, y - h * 0.6, x + w, y);
  ctx.closePath();
  ctx.fill();

  // Mid Flame
  ctx.fillStyle = colorMid;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.65, y);
  ctx.quadraticCurveTo(x - w * 0.7, y - h * 0.5, x - flick2 * 5, y - h * 0.85);
  ctx.quadraticCurveTo(x + w * 0.7, y - h * 0.5, x + w * 0.65, y);
  ctx.closePath();
  ctx.fill();

  // Hot Core
  ctx.fillStyle = colorInner;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.3, y);
  ctx.quadraticCurveTo(x - w * 0.35, y - h * 0.35, x, y - h * 0.55);
  ctx.quadraticCurveTo(x + w * 0.35, y - h * 0.35, x + w * 0.3, y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 6. Branching Lightning Strike Generator (Deterministic for any t)
export function drawBranchingLightning(ctx, startX, startY, endX, endY, t, { intensity = 1.0, color = "#FFF6FD", glow = "#A872FF" } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const segments = 12;
  const points = [[startX, startY]];
  for (let i = 1; i < segments; i++) {
    const progress = i / segments;
    const px = startX + (endX - startX) * progress;
    const py = startY + (endY - startY) * progress;
    const seed = Math.sin(t * 100 + i * 17) * 45;
    points.push([px + seed, py]);
  }
  points.push([endX, endY]);

  // Wide purple glow
  ctx.strokeStyle = glow;
  ctx.lineWidth = 14 * intensity;
  ctx.globalAlpha = 0.45 * intensity;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();

  // Hot core bolt
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5 * intensity;
  ctx.globalAlpha = 0.95 * intensity;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();

  // Branch
  if (points.length > 6) {
    const bp = points[5];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * intensity;
    ctx.globalAlpha = 0.75 * intensity;
    ctx.beginPath();
    ctx.moveTo(bp[0], bp[1]);
    ctx.lineTo(bp[0] + 60, bp[1] + 50);
    ctx.lineTo(bp[0] + 110, bp[1] + 70);
    ctx.stroke();
  }

  ctx.restore();
}
