// kuldhara_scenes.mjs - Broadcast-Grade 2D Vector Animation & Modern Documentary Motion Graphics
// 100% Pure Vector 2D (Canvas/Skia + HarfBuzz Devanagari + Procedural Shaders). Zero AI image artifacts.
// Incorporates modern animation trends (Kurzgesagt, Vox, Lemmino) and peer-reviewed historical & palaeoseismic facts.

import { createCanvas, Image, GlobalFonts } from "@napi-rs/canvas";

try {
  GlobalFonts.registerFromPath("./assets/NotoSansDevanagari-Bold.ttf", "Noto Sans Devanagari");
} catch (e) {
  // Ignore if already registered
}

import {
  applyCinematicFilmLook,
  drawDocumentaryHUD,
  drawVolumetricBeam,
  drawFloatingDust,
  drawDynamicFlame,
  drawBranchingLightning
} from "./anim_enhancements.mjs";
import {
  drawAdvancedSalimSingh,
  drawAdvancedChief,
  drawAdvancedDaughter
} from "./kuldhara_advanced_rigs.mjs";

function getSceneTime(t) {
  return (t > 15) ? (t % 15) : t;
}

// ============================================================================
// SCENE 01: MIDNIGHT RUINS (Prologue & Geographic Coordinates)
// ============================================================================
export function drawSceneNightRuins(ctx, W, H, t) {
  const localT = getSceneTime(t);

  // Deep midnight sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#050916");
  sky.addColorStop(0.5, "#0D1632");
  sky.addColorStop(0.85, "#182244");
  sky.addColorStop(1, "#221D38");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = "#E2E8F0";
  for (let i = 0; i < 75; i++) {
    const sx = (i * 137.5 + localT * 4) % W;
    const sy = ((i * 269.3) % (H * 0.65));
    const r = (i % 3 === 0) ? 2.0 : 1.2;
    const alpha = 0.35 + Math.sin(localT * 2 + i) * 0.35;
    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Crescent Moon framed inside arch
  const moonX = 1040;
  const moonY = 320;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 30, moonX, moonY, 280);
  moonGlow.addColorStop(0, "rgba(255, 245, 210, 0.5)");
  moonGlow.addColorStop(0.35, "rgba(255, 230, 160, 0.18)");
  moonGlow.addColorStop(1, "rgba(255, 230, 160, 0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFF7E6";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0D1632";
  ctx.beginPath();
  ctx.arc(moonX + 32, moonY - 14, 60, 0, Math.PI * 2);
  ctx.fill();

  // Distant Sand Dune Horizon
  const duneGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
  duneGrad.addColorStop(0, "#1A223E");
  duneGrad.addColorStop(1, "#10162B");
  ctx.fillStyle = duneGrad;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.68);
  ctx.bezierCurveTo(W * 0.35, H * 0.62, W * 0.65, H * 0.72, W, H * 0.65);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Ruined Haveli Walls in Midground
  const hCol = "#202742";
  const hShadow = "#12172A";

  // Haveli 1 (Left)
  ctx.fillStyle = hCol;
  ctx.fillRect(500, 470, 240, H - 470);
  // Battlements / crenellations
  for (let bx = 500; bx < 740; bx += 40) {
    ctx.fillRect(bx, 440, 25, 30);
  }
  // Windows
  ctx.fillStyle = "#090C18";
  ctx.beginPath(); ctx.arc(620, 550, 30, Math.PI, 0); ctx.lineTo(650, 620); ctx.lineTo(590, 620); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(620, 700, 24, Math.PI, 0); ctx.lineTo(644, 760); ctx.lineTo(596, 760); ctx.closePath(); ctx.fill();
  // Horizontal stone courses
  ctx.strokeStyle = hShadow;
  ctx.lineWidth = 1.5;
  for (let y = 490; y < H; y += 26) {
    ctx.beginPath(); ctx.moveTo(500, y); ctx.lineTo(740, y); ctx.stroke();
  }

  // Chhatri Dome Cenotaph (Right)
  ctx.fillStyle = hCol;
  ctx.beginPath(); ctx.arc(1260, 470, 52, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = hCol; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(1260, 418); ctx.lineTo(1260, 388); ctx.stroke();
  ctx.fillStyle = "#090C18";
  ctx.fillRect(1225, 470, 14, 75);
  ctx.fillRect(1281, 470, 14, 75);
  ctx.fillStyle = hCol;
  ctx.fillRect(1195, 545, 130, H - 545);

  // Foreground Gateway Arch (Massive Sandstone Structure)
  const archCol = "#2A2338";
  const archShadow = "#151020";

  ctx.fillStyle = archCol;
  ctx.fillRect(240, 140, 240, H - 140);
  ctx.fillRect(W - 480, 140, 240, H - 140);

  // Arch Lintel & Span
  ctx.beginPath();
  ctx.moveTo(220, 120);
  ctx.lineTo(W - 220, 120);
  ctx.lineTo(W - 220, 260);
  ctx.lineTo(W - 480, 260);
  ctx.bezierCurveTo(W - 580, 170, 580, 170, 480, 260);
  ctx.lineTo(220, 260);
  ctx.closePath();
  ctx.fill();

  // Arch Moulding
  ctx.fillStyle = "#3D3550";
  ctx.fillRect(220, 250, 260, 20);
  ctx.fillRect(W - 480, 250, 260, 20);

  // Rosettes
  ctx.fillStyle = "#4B4260";
  ctx.beginPath();
  ctx.arc(360, 190, 26, 0, Math.PI * 2);
  ctx.arc(W - 360, 190, 26, 0, Math.PI * 2);
  ctx.fill();

  // Pillar Mortar Lines
  ctx.strokeStyle = archShadow;
  ctx.lineWidth = 2;
  for (let py = 160; py < H; py += 30) {
    ctx.beginPath(); ctx.moveTo(240, py); ctx.lineTo(480, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 480, py); ctx.lineTo(W - 240, py); ctx.stroke();
  }

  // Debris & Fallen blocks
  ctx.fillStyle = archShadow;
  ctx.fillRect(520, H * 0.90, 95, 45);
  ctx.fillRect(W - 620, H * 0.88, 115, 55);

  drawFloatingDust(ctx, W, H, localT, { count: 40, color: "rgba(226, 232, 240, 0.5)" });

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "27° 19′ N, 70° 54′ E · THAR DESERT, JAISALMER",
    era: "CIRCA 1825 CE · 84 ABANDONED SETTLEMENTS",
    chapter: "PROLOGUE: MIDNIGHT RUINS"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.38, grainAlpha: 0.06 });
}

// ============================================================================
// SCENE 02: PROSPEROUS 1825 (The Golden Era & Rajasthani Bazaar)
// ============================================================================
export function drawSceneProsperous1825(ctx, W, H, t) {
  const localT = getSceneTime(t);

  // Golden Morning Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, "#2563EB");
  skyGrad.addColorStop(0.35, "#D97706");
  skyGrad.addColorStop(0.7, "#F59E0B");
  skyGrad.addColorStop(1, "#CA8A04");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Distant Fortified Sandstone Citadel Silhouettes
  ctx.fillStyle = "#854D0E";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.44);
  ctx.lineTo(260, H * 0.44);
  ctx.lineTo(260, H * 0.38);
  ctx.lineTo(340, H * 0.38);
  ctx.lineTo(340, H * 0.44);
  ctx.lineTo(700, H * 0.44);
  ctx.lineTo(750, H * 0.35);
  ctx.lineTo(820, H * 0.35);
  ctx.lineTo(820, H * 0.44);
  ctx.lineTo(1200, H * 0.44);
  ctx.lineTo(1260, H * 0.39);
  ctx.lineTo(1340, H * 0.39);
  ctx.lineTo(1340, H * 0.44);
  ctx.lineTo(W, H * 0.44);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Left Multi-tier Haveli with Chhatris & Masonry Lines
  ctx.fillStyle = "#D99B43";
  ctx.fillRect(60, 200, 520, H - 200);
  ctx.fillStyle = "#B2782A";
  ctx.fillRect(40, 185, 560, 25);

  ctx.strokeStyle = "rgba(110, 60, 20, 0.25)";
  ctx.lineWidth = 1.5;
  for (let by = 210; by < H; by += 24) {
    ctx.beginPath(); ctx.moveTo(60, by); ctx.lineTo(580, by); ctx.stroke();
  }

  // Rooftop Chhatri on Left
  ctx.fillStyle = "#D99B43";
  ctx.beginPath();
  ctx.arc(320, 160, 48, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#854D0E";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#451A03";
  ctx.fillRect(290, 160, 12, 28);
  ctx.fillRect(340, 160, 12, 28);

  // Left Jharokha Balcony
  ctx.fillStyle = "#B2782A";
  ctx.beginPath();
  ctx.moveTo(220, 280);
  ctx.lineTo(420, 280);
  ctx.lineTo(440, 400);
  ctx.lineTo(200, 400);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2D1B08";
  ctx.beginPath();
  ctx.arc(320, 320, 48, Math.PI, 0);
  ctx.lineTo(368, 385);
  ctx.lineTo(272, 385);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#D99B43";
  ctx.lineWidth = 2;
  for (let lx = 285; lx <= 355; lx += 14) {
    ctx.beginPath(); ctx.moveTo(lx, 320); ctx.lineTo(lx, 385); ctx.stroke();
  }

  // Right Multi-tier Haveli
  ctx.fillStyle = "#D99B43";
  ctx.fillRect(W - 580, 200, 520, H - 200);
  ctx.fillStyle = "#B2782A";
  ctx.fillRect(W - 600, 185, 560, 25);
  for (let by = 210; by < H; by += 24) {
    ctx.beginPath(); ctx.moveTo(W - 580, by); ctx.lineTo(W - 60, by); ctx.stroke();
  }
  ctx.fillStyle = "#D99B43";
  ctx.beginPath();
  ctx.arc(W - 320, 160, 48, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#451A03";
  ctx.fillRect(W - 350, 160, 12, 28);
  ctx.fillRect(W - 300, 160, 12, 28);
  ctx.fillStyle = "#B2782A";
  ctx.beginPath();
  ctx.moveTo(W - 420, 280);
  ctx.lineTo(W - 220, 280);
  ctx.lineTo(W - 200, 400);
  ctx.lineTo(W - 440, 400);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2D1B08";
  ctx.beginPath();
  ctx.arc(W - 320, 320, 48, Math.PI, 0);
  ctx.lineTo(W - 272, 385);
  ctx.lineTo(W - 368, 385);
  ctx.closePath();
  ctx.fill();

  // Central Stone-Paved Street
  const streetGrad = ctx.createLinearGradient(0, H * 0.62, 0, H);
  streetGrad.addColorStop(0, "#C99147");
  streetGrad.addColorStop(1, "#8A5820");
  ctx.fillStyle = streetGrad;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);

  // Volumetric Morning Sunbeam
  drawVolumetricBeam(ctx, 960, 0, 500, H * 0.85, 260, 750, "rgba(255, 235, 160, 0.22)");

  // Left Market Stall (Vibrant Spices & Canopies)
  const lsX = 140, lsY = 560;
  ctx.fillStyle = "#B91C1C";
  ctx.fillRect(lsX, lsY, 420, 75);
  for (let s = 0; s < 420; s += 50) {
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(lsX + s, lsY, 25, 75);
  }
  ctx.fillStyle = "#5A3010";
  ctx.fillRect(lsX + 20, lsY + 140, 380, 40);
  const spices = [
    { x: lsX + 70, col: "#EAB308", r: 35 },
    { x: lsX + 150, col: "#DC2626", r: 40 },
    { x: lsX + 230, col: "#2563EB", r: 36 },
    { x: lsX + 310, col: "#16A34A", r: 38 }
  ];
  for (const sp of spices) {
    ctx.fillStyle = sp.col;
    ctx.beginPath();
    ctx.arc(sp.x, lsY + 140, sp.r, Math.PI, 0);
    ctx.fill();
  }

  // Right Market Stall (Brass & Grains)
  const rsX = W - 560, rsY = 560;
  ctx.fillStyle = "#1E3A8A";
  ctx.fillRect(rsX, rsY, 420, 75);
  for (let s = 0; s < 420; s += 50) {
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(rsX + s, rsY, 25, 75);
  }
  ctx.fillStyle = "#5A3010";
  ctx.fillRect(rsX + 20, rsY + 140, 380, 40);
  ctx.fillStyle = "#FBBF24";
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(rsX + 90, rsY + 115, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rsX + 180, rsY + 120, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(rsX + 172, rsY + 65, 16, 40);

  // Grounded Anatomical Camel in Center
  const camelFeetY = 970;
  const camelX = W / 2 - 140;

  ctx.fillStyle = "rgba(45, 25, 10, 0.4)";
  ctx.beginPath();
  ctx.ellipse(camelX + 130, camelFeetY, 240, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  drawMajesticDesertCamel(ctx, camelX, camelFeetY, Math.sin(localT * 3), false);

  drawFloatingDust(ctx, W, H, localT, { count: 35, color: "rgba(255, 240, 180, 0.8)" });

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "27° 19′ N, 70° 54′ E · THAR DESERT, RAJASTHAN",
    era: "CIRCA 1825 CE · 84 PALIWAL SETTLEMENTS · SILK & GRAIN HUB",
    chapter: "CHAPTER I: THE GOLDEN ERA",
    accentColor: "#F59E0B"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.32, grainAlpha: 0.05 });
}

function drawMajesticDesertCamel(ctx, x, feetY, walk, isSilhouette = false) {
  ctx.save();
  ctx.translate(x, feetY - 420);

  const skin = isSilhouette ? "#0D1527" : "#C99863";
  const skinDark = isSilhouette ? "#060A14" : "#A87442";
  const harness = "#DC2626";

  // Back Legs
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 24;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(80, 200);
  ctx.lineTo(70 + walk * 18, 310);
  ctx.lineTo(65 + walk * 28, 415);
  ctx.stroke();
  if (!isSilhouette) {
    ctx.fillStyle = "#3E2718";
    ctx.beginPath();
    ctx.ellipse(65 + walk * 28, 420, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(270, 200);
  ctx.lineTo(280 - walk * 18, 310);
  ctx.lineTo(290 - walk * 28, 415);
  ctx.stroke();
  if (!isSilhouette) {
    ctx.beginPath();
    ctx.ellipse(290 - walk * 28, 420, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso & High Hump
  ctx.fillStyle = skin;
  ctx.strokeStyle = isSilhouette ? "rgba(255, 245, 210, 0.3)" : skinDark;
  ctx.lineWidth = isSilhouette ? 2.5 : 4;
  ctx.beginPath();
  ctx.moveTo(50, 180);
  ctx.bezierCurveTo(50, 60, 160, 50, 175, 120);
  ctx.bezierCurveTo(190, 140, 240, 150, 290, 150);
  ctx.bezierCurveTo(340, 180, 320, 240, 280, 240);
  ctx.bezierCurveTo(210, 250, 120, 240, 50, 220);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Saddle Blanket
  if (!isSilhouette) {
    ctx.fillStyle = "#B91C1C";
    ctx.beginPath();
    ctx.roundRect(100, 95, 120, 95, 8);
    ctx.fill();
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(100, 175, 120, 15);
    for (let tx = 110; tx <= 210; tx += 15) {
      ctx.fillStyle = "#FBBF24";
      ctx.beginPath();
      ctx.arc(tx, 195, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.roundRect(100, 95, 120, 95, 8);
    ctx.fill();
  }

  // Curved Neck & Head
  const nb = Math.sin(walk * 1.5) * 6;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(280, 190);
  ctx.bezierCurveTo(320, 160, 345, 70, 340 + nb, -20);
  ctx.bezierCurveTo(340 + nb, -60, 395 + nb, -65, 410 + nb, -30);
  ctx.bezierCurveTo(430 + nb, -30, 435 + nb, -5, 395 + nb, 10);
  ctx.bezierCurveTo(370 + nb, 20, 335, 80, 315, 215);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!isSilhouette) {
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.ellipse(335 + nb, -45, 8, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1E1208";
    ctx.beginPath();
    ctx.arc(370 + nb, -30, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(372 + nb, -31, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = harness;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(400 + nb, 2);
    ctx.lineTo(365 + nb, -38);
    ctx.lineTo(345 + nb, -22);
    ctx.lineTo(400 + nb, 2);
    ctx.stroke();
  }

  // Front Legs (Foreground)
  ctx.strokeStyle = skin;
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(105, 215);
  ctx.lineTo(110 - walk * 20, 320);
  ctx.lineTo(115 - walk * 32, 415);
  ctx.stroke();
  if (!isSilhouette) {
    ctx.fillStyle = "#3E2718";
    ctx.beginPath();
    ctx.ellipse(115 - walk * 32, 420, 19, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(295, 215);
  ctx.lineTo(300 + walk * 20, 320);
  ctx.lineTo(305 + walk * 32, 415);
  ctx.stroke();
  if (!isSilhouette) {
    ctx.beginPath();
    ctx.ellipse(305 + walk * 32, 420, 19, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!isSilhouette) {
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.quadraticCurveTo(25, 270, 32 + Math.sin(walk * 2) * 12, 310);
    ctx.stroke();
    ctx.fillStyle = "#3E2718";
    ctx.beginPath();
    ctx.ellipse(32 + Math.sin(walk * 2) * 12, 315, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================================
// SCENE 03: DIWAN SALIM SINGH (Menacing Character Rig & Khanjar Dagger)
// ============================================================================
export function drawSceneSalimSingh(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const bgGrad = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, W * 0.7);
  bgGrad.addColorStop(0, "#2D1217");
  bgGrad.addColorStop(0.5, "#170A0F");
  bgGrad.addColorStop(1, "#070406");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Fluted Marble Columns
  const colL = 160, colR = W - 320;
  for (const cx of [colL, colR]) {
    const colGrad = ctx.createLinearGradient(cx, 0, cx + 160, 0);
    colGrad.addColorStop(0, "#543828");
    colGrad.addColorStop(0.3, "#A67A5B");
    colGrad.addColorStop(0.7, "#D9A982");
    colGrad.addColorStop(1, "#4A2F1F");
    ctx.fillStyle = colGrad;
    ctx.fillRect(cx, 0, 160, H);
    ctx.strokeStyle = "rgba(40, 20, 10, 0.4)";
    ctx.lineWidth = 3;
    for (let gx = cx + 20; gx < cx + 160; gx += 24) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
  }

  // Velvet Curtains
  const drapeGrad = ctx.createLinearGradient(0, 0, 350, 0);
  drapeGrad.addColorStop(0, "#580A12");
  drapeGrad.addColorStop(0.5, "#961824");
  drapeGrad.addColorStop(1, "#40070D");
  ctx.fillStyle = drapeGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(340, 0);
  ctx.bezierCurveTo(280, 350, 320, 700, 180, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(W, 0); ctx.lineTo(W - 340, 0);
  ctx.bezierCurveTo(W - 280, 350, W - 320, 700, W - 180, H);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Advanced Salim Singh Rig in center (Grounded)
  const breathing = Math.sin(localT * 2.5) * 4;
  drawAdvancedSalimSingh(ctx, W / 2, 940 + breathing, 1.32, localT, 1.0);

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "DIWAN'S DARBAR · KINGDOM OF JAISALMER",
    era: "CRUEL PRIME MINISTER SALIM SINGH · ATROCITIES & EXTORTION",
    chapter: "ACT I: THE TYRANT'S ULTIMATUM",
    accentColor: "#EF4444"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.05 });
}

// ============================================================================
// SCENE 04: CHIEF & WEEPING DAUGHTER (The Dilemma of Honor)
// ============================================================================
function drawExpressiveChief(ctx, x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const DARK = "#1A1020";

  // Contact shadow
  const shadowG = ctx.createRadialGradient(0, 0, 10, 0, 0, 130);
  shadowG.addColorStop(0, "rgba(20, 10, 25, 0.7)");
  shadowG.addColorStop(1, "rgba(20, 10, 25, 0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath(); ctx.ellipse(0, 5, 130, 25, 0, 0, Math.PI * 2); ctx.fill();

  // White Dhoti & Mojari Shoes
  for (const side of [-1, 1]) {
    const lx = side * 36;
    ctx.beginPath();
    ctx.moveTo(lx - 18, -100); ctx.lineTo(lx + 18, -100); ctx.lineTo(lx + 14, 0); ctx.lineTo(lx - 14, 0);
    ctx.closePath();
    ctx.fillStyle = "#ECE7DA"; ctx.fill();
    ctx.strokeStyle = DARK; ctx.lineWidth = 3; ctx.stroke();

    // Mojari
    ctx.fillStyle = "#7A4A28";
    ctx.beginPath(); ctx.ellipse(lx + 4, 0, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();
  }

  // Khadi Kurta / Flared Angrakha Skirt
  const kurtaG = ctx.createLinearGradient(-100, -320, 100, -320);
  kurtaG.addColorStop(0, "#D8D2C2");
  kurtaG.addColorStop(0.3, "#F8F5EE");
  kurtaG.addColorStop(0.7, "#F8F5EE");
  kurtaG.addColorStop(1, "#CEC7B5");

  ctx.beginPath();
  ctx.moveTo(-65, -310); ctx.lineTo(65, -310); ctx.lineTo(90, -80); ctx.lineTo(-90, -80);
  ctx.closePath();
  ctx.fillStyle = kurtaG; ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 3.5; ctx.stroke();

  // Fabric pleats
  ctx.strokeStyle = "rgba(60, 50, 40, 0.25)"; ctx.lineWidth = 2;
  for (const fx of [-45, -20, 0, 20, 45]) {
    ctx.beginPath(); ctx.moveTo(fx * 0.8, -290); ctx.lineTo(fx * 1.3, -85); ctx.stroke();
  }

  // Saffron Shawl (Angavastram) draped across chest
  const shawlG = ctx.createLinearGradient(-70, -290, 70, -160);
  shawlG.addColorStop(0, "#C2410C"); shawlG.addColorStop(0.5, "#EA580C"); shawlG.addColorStop(1, "#9A3412");
  ctx.beginPath();
  ctx.moveTo(-68, -290); ctx.lineTo(-20, -305); ctx.lineTo(75, -160); ctx.lineTo(45, -125); ctx.lineTo(-70, -230);
  ctx.closePath();
  ctx.fillStyle = shawlG; ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 3; ctx.stroke();

  // Gold Zari border
  ctx.strokeStyle = "#FBBF24"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-66, -286); ctx.lineTo(50, -130); ctx.stroke();

  // Left Arm (Protective posture pointing or folded)
  ctx.fillStyle = "#F8F5EE"; ctx.strokeStyle = DARK; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-65, -290); ctx.lineTo(-105, -210); ctx.lineTo(-90, -140); ctx.lineTo(-68, -150); ctx.lineTo(-78, -215); ctx.lineTo(-50, -270);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Hand
  ctx.fillStyle = "#D69A68";
  ctx.beginPath(); ctx.arc(-80, -135, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Right Arm (Resting on side)
  ctx.fillStyle = "#F8F5EE";
  ctx.beginPath();
  ctx.moveTo(65, -290); ctx.lineTo(100, -220); ctx.lineTo(90, -150); ctx.lineTo(70, -160); ctx.lineTo(78, -220); ctx.lineTo(50, -270);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#D69A68";
  ctx.beginPath(); ctx.arc(80, -145, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Head & Neck
  ctx.fillStyle = "#D69A68"; ctx.strokeStyle = DARK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -330, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Rajasthani White Pagri
  ctx.fillStyle = "#F8FAFC";
  for (let ti = 0; ti < 4; ti++) {
    ctx.beginPath(); ctx.ellipse(0, -365 - ti * 12, 45 - ti * 3, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // Full White Beard
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-30, -325);
  ctx.bezierCurveTo(-45, -250, -15, -170, 0, -155);
  ctx.bezierCurveTo(15, -170, 45, -250, 30, -325);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Tilak
  ctx.fillStyle = "#DC2626"; ctx.fillRect(-3.5, -350, 7, 14);

  // Eyes & Somber Expression
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.ellipse(-14, -335, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(14, -335, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawExpressiveDaughter(ctx, x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const DARK = "#1A1020";

  // Contact shadow
  const shadowG = ctx.createRadialGradient(0, 0, 10, 0, 0, 110);
  shadowG.addColorStop(0, "rgba(20, 10, 25, 0.7)");
  shadowG.addColorStop(1, "rgba(20, 10, 25, 0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath(); ctx.ellipse(0, 5, 110, 22, 0, 0, Math.PI * 2); ctx.fill();

  // Flared Rajasthani Ghagra (Skirt) with Gold Booti
  const ghagraG = ctx.createLinearGradient(-90, -180, 90, -180);
  ghagraG.addColorStop(0, "#991B1B");
  ghagraG.addColorStop(0.5, "#DC2626");
  ghagraG.addColorStop(1, "#7F1D1D");

  ctx.beginPath();
  ctx.moveTo(-45, -200); ctx.lineTo(45, -200); ctx.lineTo(80, 0); ctx.lineTo(-80, 0);
  ctx.closePath();
  ctx.fillStyle = ghagraG; ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 3.5; ctx.stroke();

  // Gold Brocade Border Hem
  ctx.beginPath();
  ctx.moveTo(-80, 0); ctx.lineTo(80, 0); ctx.lineTo(78, -18); ctx.lineTo(-78, -18);
  ctx.closePath();
  ctx.fillStyle = "#F59E0B"; ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 2.5; ctx.stroke();

  // Delicate Gold Booti Dots on Ghagra
  ctx.fillStyle = "#FDE68A";
  for (let r = -170; r < -25; r += 28) {
    const w = 45 + ((r + 200) / 200) * 30;
    for (let bx = -w + 14; bx < w - 10; bx += 22) {
      ctx.beginPath(); ctx.arc(bx, r, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Choli (Blouse)
  ctx.beginPath();
  ctx.moveTo(-38, -255); ctx.lineTo(38, -255); ctx.lineTo(42, -195); ctx.lineTo(-42, -195);
  ctx.closePath();
  ctx.fillStyle = "#B91C1C"; ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 3; ctx.stroke();

  // Arms & Bangles (Chooda) in Supplication / Praying Pose
  for (const s of [-1, 1]) {
    ctx.fillStyle = "#B91C1C";
    ctx.beginPath();
    ctx.moveTo(s * 36, -250); ctx.lineTo(s * 52, -200); ctx.lineTo(s * 38, -180); ctx.lineTo(s * 25, -230);
    ctx.closePath();
    ctx.fill(); ctx.strokeStyle = DARK; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.fillStyle = "#E8B282";
    ctx.beginPath();
    ctx.moveTo(s * 38, -180); ctx.lineTo(s * 10, -160); ctx.lineTo(s * 12, -145); ctx.lineTo(s * 42, -165);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Red and Gold Bangles
    for (let bi = 0; bi < 4; bi++) {
      ctx.fillStyle = (bi % 2 === 0) ? "#DC2626" : "#F59E0B";
      ctx.fillRect(s * 22 - (s === 1 ? 0 : 6), -175 + bi * 4, 8, 3);
    }
  }

  // Hands clasped together
  ctx.fillStyle = "#E8B282";
  ctx.beginPath(); ctx.ellipse(0, -150, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 2; ctx.stroke();

  // Head & Face
  ctx.beginPath(); ctx.arc(0, -280, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Beautiful Royal Rajasthani Odhna (Veil) framing head and shoulders
  const odhnaG = ctx.createLinearGradient(0, -320, 0, -180);
  odhnaG.addColorStop(0, "#EF4444");
  odhnaG.addColorStop(1, "#991B1B");
  ctx.fillStyle = odhnaG;
  ctx.strokeStyle = DARK; ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, -290, 36, Math.PI, 0);
  ctx.lineTo(44, -180);
  ctx.bezierCurveTo(25, -170, -25, -170, -44, -180);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Golden Zari Arch Trim on Odhna
  ctx.strokeStyle = "#F59E0B"; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -290, 36, Math.PI, 0);
  ctx.lineTo(44, -180);
  ctx.moveTo(-36, -290);
  ctx.lineTo(-44, -180);
  ctx.stroke();

  // Bindi & Maang Tikka
  ctx.fillStyle = "#DC2626"; ctx.beginPath(); ctx.arc(0, -292, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#F59E0B"; ctx.beginPath(); ctx.arc(0, -305, 3, 0, Math.PI * 2); ctx.fill();

  // Expressive Weeping Eyes & Falling Tears
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.ellipse(-10, -280, 4.5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(10, -280, 4.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tear streaks
  const tearProg = (t * 2) % 1;
  ctx.fillStyle = "#67E8F9";
  ctx.beginPath(); ctx.arc(10, -272 + tearProg * 35, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-10, -270 + ((tearProg + 0.5) % 1) * 35, 2.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

export function drawSceneChiefAndDaughter(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const sunsetGrad = ctx.createLinearGradient(0, 0, 0, H);
  sunsetGrad.addColorStop(0, "#31103F");
  sunsetGrad.addColorStop(0.35, "#8B1E3F");
  sunsetGrad.addColorStop(0.65, "#E25B2D");
  sunsetGrad.addColorStop(0.85, "#F9A03F");
  sunsetGrad.addColorStop(1, "#EBB059");
  ctx.fillStyle = sunsetGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#8C3224";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.65);
  ctx.quadraticCurveTo(W * 0.5, H * 0.58, W, H * 0.64);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  const wallCol = "#231828";
  ctx.fillStyle = wallCol;
  ctx.fillRect(0, 0, 480, H);
  ctx.fillRect(W - 480, 0, 480, H);
  ctx.beginPath();
  ctx.moveTo(480, 0); ctx.lineTo(W - 480, 0); ctx.lineTo(W - 480, 360);
  ctx.bezierCurveTo(W - 550, 180, 550, 180, 480, 360);
  ctx.closePath();
  ctx.fill();

  for (const dx of [260, W - 260]) {
    ctx.strokeStyle = "#B48628";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, 400); ctx.stroke();
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath(); ctx.arc(dx, 415, 22, 0, Math.PI); ctx.fill();
    drawDynamicFlame(ctx, dx, 405, 30, localT);
  }

  drawExpressiveChief(ctx, 740, 920, 1.25, localT);
  drawExpressiveDaughter(ctx, 1140, 920, 1.25, localT);

  drawFloatingDust(ctx, W, H, localT, { count: 30, color: "rgba(255, 230, 180, 0.6)" });

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "KULDHARA CHIEF HAVELI · PRIVATE SANCTUM",
    era: "DEMAND FOR THE CHIEF'S DAUGHTER · HONOR VS ANNIHILATION",
    chapter: "ACT II: THE DILEMMA OF HONOR",
    accentColor: "#F59E0B"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.05 });
}

// ============================================================================
// SCENE 05: TEMPLE COUNCIL (Emergency Mahapanchayat of 84 Chiefs)
// ============================================================================
export function drawSceneTempleCouncil(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const bg = ctx.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, W * 0.7);
  bg.addColorStop(0, "#2A1208");
  bg.addColorStop(0.45, "#140A07");
  bg.addColorStop(1, "#070404");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#0A0505";
  for (const ax of [320, W / 2, W - 320]) {
    ctx.beginPath(); ctx.arc(ax, 380, 80, Math.PI, 0); ctx.lineTo(ax + 80, 520); ctx.lineTo(ax - 80, 520); ctx.closePath(); ctx.fill();
  }

  ctx.fillStyle = "#1E1815";
  ctx.beginPath(); ctx.arc(W / 2, 430, 42, Math.PI, 0); ctx.lineTo(W / 2 + 42, 510); ctx.lineTo(W / 2 - 42, 510); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 2.5;
  for (const y of [425, 432, 439]) {
    ctx.beginPath(); ctx.moveTo(W / 2 - 22, y); ctx.lineTo(W / 2 + 22, y); ctx.stroke();
  }
  ctx.fillStyle = "#DC2626";
  ctx.beginPath(); ctx.arc(W / 2, 432, 3.5, 0, Math.PI * 2); ctx.fill();

  drawCinematicElder(ctx, 420, 480, 1.15, "#166534", "#DC2626", localT);
  drawCinematicElder(ctx, W - 420, 480, 1.15, "#991B1B", "#EAB308", localT + 0.3);
  drawCinematicElder(ctx, W / 2, 440, 1.35, "#EA580C", "#EA580C", localT + 0.6);

  const altarX = W / 2;
  const altarY = H * 0.75;

  ctx.fillStyle = "#78350F";
  ctx.beginPath();
  ctx.moveTo(altarX - 320, H); ctx.lineTo(altarX - 220, altarY + 80);
  ctx.lineTo(altarX + 220, altarY + 80); ctx.lineTo(altarX + 320, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#9A3412";
  ctx.fillRect(altarX - 210, altarY + 35, 420, 50);

  drawDynamicFlame(ctx, altarX, altarY + 35, 175, localT);

  for (let i = 0; i < 28; i++) {
    const ex = altarX + Math.sin(localT * 3.5 + i * 1.7) * 160;
    const ey = ((altarY - localT * (90 + (i % 6) * 35) - i * 32) % H);
    const finalEY = ey < 0 ? ey + H : ey;
    const er = 2 + (i % 3);
    ctx.fillStyle = (i % 2 === 0) ? "#FDE047" : "#F97316";
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(ex, finalEY, er, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "KULDHARA SHIVA TEMPLE · CENTRAL MANDAPA",
    era: "MIDNIGHT EMERGENCY MAHAPANCHAYAT · 84 VILLAGE HEADS",
    chapter: "ACT III: THE SOLEMN COUNCIL",
    accentColor: "#F97316"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.38, grainAlpha: 0.05 });
}

function drawCinematicElder(ctx, x, y, scale, sashColor, turbanColor, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#F8FAFC";
  ctx.strokeStyle = "#180B07";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-130, 110);
  ctx.bezierCurveTo(-180, 260, -220, 480, -240, 600);
  ctx.lineTo(240, 600);
  ctx.bezierCurveTo(220, 480, 180, 260, 130, 110);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = sashColor;
  ctx.beginPath();
  ctx.moveTo(-110, 120); ctx.lineTo(110, 120); ctx.lineTo(40, 360); ctx.lineTo(-120, 280);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#C89569";
  ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = turbanColor;
  ctx.strokeStyle = "#180B07";
  ctx.lineWidth = 3.5;
  for (let ti = 0; ti < 4; ti++) {
    ctx.beginPath(); ctx.ellipse(0, -55 - ti * 16, 56 - ti * 4, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-40, 5); ctx.bezierCurveTo(-55, 120, -20, 220, 0, 240); ctx.bezierCurveTo(20, 220, 55, 120, 40, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#DC2626";
  ctx.fillRect(-4, -28, 8, 16);
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.ellipse(-16, -14, 6, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(16, -14, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// SCENE 06: THE NIGHT EXODUS (Epic Midnight Caravan Panorama)
// ============================================================================
function getExodusDuneY(x, W, H) {
  const normX = x / W;
  return H * (0.74 - 0.12 * Math.sin(normX * Math.PI) + 0.04 * Math.sin(normX * 2 * Math.PI));
}

function drawSilhouetteCamel(ctx, x, groundY, walkCycle, scale = 0.7) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  const silhouetteCol = "#050810";
  const legCycle = Math.sin(walkCycle);

  // Back legs
  ctx.strokeStyle = "#080C16";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-90, -110); ctx.lineTo(-95 + legCycle * 18, -40); ctx.lineTo(-100 + legCycle * 25, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(60, -110); ctx.lineTo(65 - legCycle * 18, -40); ctx.lineTo(70 - legCycle * 25, 0);
  ctx.stroke();

  // Torso & Hump
  ctx.fillStyle = silhouetteCol;
  ctx.beginPath();
  ctx.moveTo(-110, -120);
  ctx.bezierCurveTo(-115, -190, -30, -210, -20, -150);
  ctx.bezierCurveTo(-10, -135, 40, -135, 75, -130);
  ctx.bezierCurveTo(90, -100, 70, -70, 40, -70);
  ctx.bezierCurveTo(-20, -65, -80, -75, -110, -100);
  ctx.closePath();
  ctx.fill();

  // Saddle pack
  ctx.fillStyle = "#0C1220";
  ctx.beginPath();
  ctx.roundRect(-70, -180, 80, 55, 6);
  ctx.fill();

  // Neck & Head
  const neckBob = Math.sin(walkCycle) * 4;
  ctx.fillStyle = silhouetteCol;
  ctx.beginPath();
  ctx.moveTo(60, -120);
  ctx.bezierCurveTo(80, -145, 95, -200, 95 + neckBob, -250);
  ctx.bezierCurveTo(95 + neckBob, -270, 130 + neckBob, -275, 140 + neckBob, -255);
  ctx.bezierCurveTo(155 + neckBob, -255, 160 + neckBob, -240, 135 + neckBob, -230);
  ctx.bezierCurveTo(120 + neckBob, -225, 95, -170, 85, -110);
  ctx.closePath();
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.ellipse(100 + neckBob, -265, 4, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Front legs
  ctx.strokeStyle = silhouetteCol;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-75, -105); ctx.lineTo(-70 - legCycle * 18, -40); ctx.lineTo(-65 - legCycle * 25, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(75, -105); ctx.lineTo(80 + legCycle * 18, -40); ctx.lineTo(85 + legCycle * 25, 0);
  ctx.stroke();

  // Tail
  ctx.strokeStyle = silhouetteCol;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-110, -110);
  ctx.quadraticCurveTo(-125, -70, -120 + Math.sin(walkCycle) * 8, -40);
  ctx.stroke();

  // Moonlit subtle rim highlight
  ctx.strokeStyle = "rgba(186, 215, 255, 0.4)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-20, -185);
  ctx.bezierCurveTo(-10, -135, 40, -135, 75, -130);
  ctx.moveTo(60, -120);
  ctx.bezierCurveTo(80, -145, 95, -200, 95 + neckBob, -250);
  ctx.stroke();

  ctx.restore();
}

function drawSilhouetteVillager(ctx, x, groundY, walkCycle, hasLantern = true, scale = 0.65) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  const silhouetteCol = "#050810";
  const legCycle = Math.sin(walkCycle);

  // Legs walking
  ctx.strokeStyle = silhouetteCol;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(legCycle * 22, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(-legCycle * 22, 0); ctx.stroke();

  // Draped Robe
  ctx.fillStyle = silhouetteCol;
  ctx.beginPath();
  ctx.moveTo(-22, -160); ctx.lineTo(22, -160); ctx.lineTo(32, -80); ctx.lineTo(-32, -80);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath(); ctx.ellipse(0, -165, 25, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -195, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -205, 24, 14, -0.1, 0, Math.PI * 2); ctx.fill();

  if (hasLantern) {
    const swing = Math.sin(walkCycle) * 0.25;
    ctx.strokeStyle = silhouetteCol;
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(14, -155); ctx.lineTo(38, -120); ctx.stroke();

    ctx.save();
    ctx.translate(38, -120);
    ctx.rotate(swing);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 32); ctx.stroke();

    // Warm radial amber glow
    const lGlow = ctx.createRadialGradient(0, 48, 8, 0, 48, 140);
    lGlow.addColorStop(0, "rgba(255, 185, 45, 0.75)");
    lGlow.addColorStop(0.35, "rgba(255, 140, 20, 0.25)");
    lGlow.addColorStop(0.7, "rgba(255, 100, 10, 0.08)");
    lGlow.addColorStop(1, "rgba(255, 100, 10, 0)");
    ctx.fillStyle = lGlow;
    ctx.beginPath(); ctx.arc(0, 48, 140, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#D97706";
    ctx.fillRect(-10, 32, 20, 28);
    ctx.fillStyle = "#FFFBEB";
    ctx.fillRect(-7, 36, 14, 20);

    ctx.restore();
  } else {
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(22, -210); ctx.lineTo(26, 0); ctx.stroke();
  }

  ctx.restore();
}

export function drawSceneNightExodus(ctx, W, H, t) {
  const localT = getSceneTime(t);

  // Desert midnight sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#050B18");
  sky.addColorStop(0.35, "#0E1A36");
  sky.addColorStop(0.65, "#1B2A52");
  sky.addColorStop(1, "#263B6E");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = "#E2E8F0";
  for (let i = 0; i < 80; i++) {
    const sx = (i * 127.3 + localT * 2) % W;
    const sy = ((i * 311.7) % (H * 0.55));
    const r = (i % 3 === 0) ? 1.8 : 1.1;
    const a = 0.3 + Math.sin(localT * 1.5 + i) * 0.3;
    ctx.globalAlpha = Math.max(0.1, a);
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Thar Desert Full Moon
  const moonX = W * 0.78, moonY = 220;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 30, moonX, moonY, 360);
  moonGlow.addColorStop(0, "rgba(255, 250, 225, 0.65)");
  moonGlow.addColorStop(0.3, "rgba(255, 240, 180, 0.22)");
  moonGlow.addColorStop(0.65, "rgba(255, 230, 150, 0.08)");
  moonGlow.addColorStop(1, "rgba(255, 230, 150, 0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath(); ctx.arc(moonX, moonY, 360, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#FFFBEB";
  ctx.beginPath(); ctx.arc(moonX, moonY, 70, 0, Math.PI * 2); ctx.fill();

  // Distant Sand Dune Layer
  const bgDune = ctx.createLinearGradient(0, H * 0.52, 0, H);
  bgDune.addColorStop(0, "#121C34");
  bgDune.addColorStop(1, "#0A1020");
  ctx.fillStyle = bgDune;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.60);
  ctx.bezierCurveTo(W * 0.35, H * 0.52, W * 0.7, H * 0.65, W, H * 0.57);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Midground Dune with Moonlit Ridge
  const midDune = ctx.createLinearGradient(0, H * 0.65, 0, H);
  midDune.addColorStop(0, "#0E1528");
  midDune.addColorStop(1, "#060A14");
  ctx.fillStyle = midDune;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.74);
  ctx.bezierCurveTo(W * 0.35, H * 0.69, W * 0.75, H * 0.78, W, H * 0.72);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(186, 215, 255, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.74);
  ctx.bezierCurveTo(W * 0.35, H * 0.69, W * 0.75, H * 0.78, W, H * 0.72);
  ctx.stroke();

  // Moving Caravan Line
  const caravanSpeed = 40;
  const loopWidth = 2200;
  const offset = (localT * caravanSpeed) % loopWidth;

  const baseCaravan = [
    { type: "villager", relX: 100, lantern: true },
    { type: "camel",    relX: 300 },
    { type: "villager", relX: 520, lantern: false },
    { type: "camel",    relX: 740 },
    { type: "villager", relX: 960, lantern: true },
    { type: "camel",    relX: 1180 },
    { type: "villager", relX: 1400, lantern: false },
    { type: "camel",    relX: 1620 },
    { type: "villager", relX: 1840, lantern: true }
  ];

  for (let wrap = -1; wrap <= 1; wrap++) {
    for (let i = 0; i < baseCaravan.length; i++) {
      const item = baseCaravan[i];
      const curX = item.relX - offset + wrap * loopWidth;
      if (curX < -300 || curX > W + 300) continue;

      const gy = getExodusDuneY(curX, W, H);
      const walkPhase = localT * 3.2 + i * 0.7;

      if (item.type === "villager") {
        drawSilhouetteVillager(ctx, curX, gy, walkPhase, item.lantern);
      } else {
        drawSilhouetteCamel(ctx, curX, gy, walkPhase, 0.72);
      }

      // Lead tether rope
      if (i < baseCaravan.length - 1 && item.type === "villager" && baseCaravan[i + 1].type === "camel") {
        const nextX = baseCaravan[i + 1].relX - offset + wrap * loopWidth;
        const ngy = getExodusDuneY(nextX, W, H);
        ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(curX + 10, gy - 100);
        ctx.quadraticCurveTo((curX + nextX) / 2, gy - 60, nextX - 70, ngy - 130);
        ctx.stroke();
      }
    }
  }

  // Foreground Dune Layer
  ctx.fillStyle = "#03060C";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.88);
  ctx.bezierCurveTo(W * 0.4, H * 0.82, W * 0.7, H * 0.94, W, H * 0.85);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  drawFloatingDust(ctx, W, H, localT, { count: 35, color: "rgba(226, 232, 240, 0.4)" });

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "THAR DESERT RIDGES · HEADING TOWARDS PALI & JODHPUR",
    era: "MIDNIGHT EVACUATION · 1,588 RESIDENTS · 84 VILLAGES",
    chapter: "ACT IV: THE SECRET EXODUS"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.42, grainAlpha: 0.05 });
}

// ============================================================================
// SCENE 07: THE ELDER'S SACRED CURSE (Ritual Low-Angle Oath)
// ============================================================================
export function drawSceneElderCurse(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#100418");
  sky.addColorStop(0.4, "#260A24");
  sky.addColorStop(0.8, "#180616");
  sky.addColorStop(1, "#0A0208");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const strikeTime = (localT % 1.8) < 0.35;
  if (strikeTime) {
    drawBranchingLightning(ctx, 300, 0, 160, 480, localT, { intensity: 1.2 });
    drawBranchingLightning(ctx, 1650, 0, 1780, 520, localT, { intensity: 0.9 });
  }

  // Fortress Ramparts (Low angle)
  ctx.fillStyle = "#140A18";
  ctx.fillRect(0, H * 0.72, W, H * 0.28);
  for (let bx = 0; bx < W; bx += 140) {
    ctx.fillRect(bx, H * 0.64, 80, H * 0.08);
  }
  ctx.strokeStyle = "#0B040D";
  ctx.lineWidth = 2;
  for (let y = H * 0.72; y < H; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Center Elder Priest
  const ex = W / 2;
  const ey = 520;
  const DARK = "#110815";

  // Robe body
  const robeG = ctx.createLinearGradient(ex - 180, ey, ex + 180, ey);
  robeG.addColorStop(0, "#DDD8CC");
  robeG.addColorStop(0.2, "#F8F6F0");
  robeG.addColorStop(0.8, "#F8F6F0");
  robeG.addColorStop(1, "#CEC7B6");

  // Lower Robe (Flared pleated skirt)
  ctx.fillStyle = robeG;
  ctx.beginPath();
  ctx.moveTo(ex - 90, ey + 40);
  ctx.lineTo(ex + 90, ey + 40);
  ctx.bezierCurveTo(ex + 160, ey + 240, ex + 240, H * 0.88, ex + 280, H);
  ctx.lineTo(ex - 280, H);
  ctx.bezierCurveTo(ex - 240, H * 0.88, ex - 160, ey + 240, ex - 90, ey + 40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Pleats & fold shadows
  ctx.strokeStyle = "rgba(40, 30, 20, 0.22)";
  ctx.lineWidth = 2.5;
  for (const fx of [-180, -120, -60, 0, 60, 120, 180]) {
    ctx.beginPath();
    ctx.moveTo(ex + fx * 0.4, ey + 50);
    ctx.lineTo(ex + fx * 1.3, H);
    ctx.stroke();
  }

  // Upper Torso
  ctx.fillStyle = robeG;
  ctx.beginPath();
  ctx.moveTo(ex - 85, ey - 100);
  ctx.lineTo(ex + 85, ey - 100);
  ctx.lineTo(ex + 95, ey + 45);
  ctx.lineTo(ex - 95, ey + 45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Draped Saffron Angavastram (Shawl with folds and zari trim)
  const shawlG = ctx.createLinearGradient(ex - 90, ey - 95, ex + 90, ey + 80);
  shawlG.addColorStop(0, "#C2410C");
  shawlG.addColorStop(0.5, "#EA580C");
  shawlG.addColorStop(1, "#9A3412");
  ctx.fillStyle = shawlG;
  ctx.beginPath();
  ctx.moveTo(ex - 85, ey - 95);
  ctx.bezierCurveTo(ex - 95, ey - 10, ex - 20, ey + 70, ex + 20, ey + 90);
  ctx.lineTo(ex + 85, ey + 30);
  ctx.bezierCurveTo(ex + 50, ey - 30, ex + 70, ey - 80, ex + 60, ey - 95);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Gold border on shawl
  ctx.strokeStyle = "#FBBF24";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ex - 85, ey - 95);
  ctx.bezierCurveTo(ex - 95, ey - 10, ex - 20, ey + 70, ex + 20, ey + 90);
  ctx.stroke();

  // Head & Face
  ctx.fillStyle = "#C68A56";
  ctx.beginPath(); ctx.arc(ex, ey - 145, 36, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 3; ctx.stroke();

  // White Pagri (Rajasthani folded turban)
  ctx.fillStyle = "#F8FAFC";
  for (let ti = 0; ti < 4; ti++) {
    ctx.beginPath();
    ctx.ellipse(ex, ey - 180 - ti * 13, 46 - ti * 3, 15, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  // Flowing Majestic White Beard
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(ex - 32, ey - 140);
  ctx.bezierCurveTo(ex - 48, ey - 40, ex - 18, ey + 60, ex, ey + 75);
  ctx.bezierCurveTo(ex + 18, ey + 60, ex + 48, ey - 40, ex + 32, ey - 140);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Red Vermilion Tilak
  ctx.fillStyle = "#DC2626";
  ctx.fillRect(ex - 3.5, ey - 165, 7, 16);

  // Expressive Eyes & Open Wrathful Mouth
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.ellipse(ex - 14, ey - 150, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(ex + 14, ey - 150, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3B1208";
  ctx.beginPath(); ctx.arc(ex, ey - 128, 10, 0, Math.PI); ctx.fill();

  // Left Arm (Holding Flaming Torch Raised High)
  ctx.fillStyle = "#F8F6F0";
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(ex + 85, ey - 95);
  ctx.bezierCurveTo(ex + 130, ey - 80, ex + 160, ey - 140, ex + 190, ey - 230);
  ctx.lineTo(ex + 165, ey - 245);
  ctx.bezierCurveTo(ex + 140, ey - 160, ex + 115, ey - 120, ex + 75, ey - 75);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#C68A56";
  ctx.beginPath(); ctx.arc(ex + 180, ey - 245, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.strokeStyle = "#78350F";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(ex + 175, ey - 235); ctx.lineTo(ex + 210, ey - 355); ctx.stroke();
  drawDynamicFlame(ctx, ex + 210, ey - 355, 95, localT);

  // Right Arm (Holding Brass Kamandalu & Pouring)
  ctx.fillStyle = "#F8F6F0";
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(ex - 85, ey - 95);
  ctx.bezierCurveTo(ex - 130, ey - 50, ex - 160, ey + 20, ex - 180, ey + 110);
  ctx.lineTo(ex - 150, ey + 125);
  ctx.bezierCurveTo(ex - 130, ey + 40, ex - 105, ey - 20, ex - 75, ey - 75);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#C68A56";
  ctx.beginPath(); ctx.arc(ex - 165, ey + 120, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Brass Kamandalu
  ctx.save();
  ctx.translate(ex - 185, ey + 140);
  ctx.rotate(0.65);
  ctx.fillStyle = "#F59E0B";
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 12, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-22, -6); ctx.lineTo(-44, 6); ctx.lineTo(-40, 18); ctx.lineTo(-19, 10);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#92400E"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, -10, 18, Math.PI, 0); ctx.stroke();
  ctx.restore();

  // Glowing Holy Water Pouring
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ex - 215, ey + 160);
  ctx.bezierCurveTo(ex - 235, ey + 260, ex - 220, H - 40, ex - 225, H - 10);
  ctx.stroke();

  // Ripple Rings
  ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
  ctx.lineWidth = 2.5;
  for (const rw of [24, 45, 70]) {
    ctx.beginPath(); ctx.ellipse(ex - 225, H - 10, rw, rw * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
  }

  // HarfBuzz Devanagari Sanskrit Oath Typography
  ctx.font = "bold 44px 'Noto Sans Devanagari', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#FDE047";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 12;
  ctx.fillText("॥ यह भूमि हमेशा के लिए निर्जन और शापित रहेगी ॥", W / 2, 175);

  ctx.font = "bold 24px 'Inter', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText('"NO SOUL SHALL EVER SETTLE HERE AGAIN"', W / 2, 220);
  ctx.shadowBlur = 0;

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "KULDHARA SOUTHERN RAMPART · CURSE STONE",
    era: "THE ANCIENT SANSKRIT DEATH CURSE · SEALED WITH SACRED WATER",
    chapter: "ACT V: THE ETERNAL CURSE",
    accentColor: "#EF4444"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.05 });
}

// ============================================================================
// SCENE 08: THE ABANDONED KITCHEN (Frozen Still Life & Smoke Hearth)
// ============================================================================
export function drawSceneAbandonedKitchen(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
  wallGrad.addColorStop(0, "#8C653C");
  wallGrad.addColorStop(0.5, "#6E4E2C");
  wallGrad.addColorStop(1, "#452F19");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#382312";
  ctx.fillRect(0, H * 0.76, W, H * 0.24);

  const winX = 640, winW = 340, winY = 160, winH = H * 0.60;

  ctx.fillStyle = "#4A321E";
  ctx.beginPath();
  ctx.arc(winX + winW / 2, winY + 120, winW / 2 + 30, Math.PI, 0);
  ctx.lineTo(winX + winW + 30, winY + winH);
  ctx.lineTo(winX - 30, winY + winH);
  ctx.closePath();
  ctx.fill();

  const winSky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
  winSky.addColorStop(0, "#FFF7ED");
  winSky.addColorStop(0.5, "#FED7AA");
  winSky.addColorStop(1, "#EA580C");
  ctx.fillStyle = winSky;
  ctx.beginPath();
  ctx.arc(winX + winW / 2, winY + 120, winW / 2, Math.PI, 0);
  ctx.lineTo(winX + winW, winY + winH);
  ctx.lineTo(winX, winY + winH);
  ctx.closePath();
  ctx.fill();

  drawVolumetricBeam(ctx, winX + winW / 2, winY + 120, 260, H * 0.95, 240, 750, "rgba(255, 240, 180, 0.25)");

  ctx.fillStyle = "#2D1B0D";
  ctx.beginPath();
  ctx.arc(260, 320, 70, Math.PI, 0);
  ctx.lineTo(330, 520); ctx.lineTo(190, 520);
  ctx.closePath();
  ctx.fill();

  const potCol = "#B45309", potShade = "#78350F";
  for (let pi = 0; pi < 3; pi++) {
    const py = 480 - pi * 55;
    const pr = 42 - pi * 6;
    ctx.fillStyle = potCol;
    ctx.strokeStyle = potShade;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(260, py, pr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = potShade;
    ctx.fillRect(260 - pr * 0.5, py - pr, pr, 8);
  }

  ctx.fillStyle = "#2D1B0D";
  ctx.beginPath();
  ctx.arc(W - 280, 340, 60, Math.PI, 0);
  ctx.lineTo(W - 220, 480); ctx.lineTo(W - 340, 480);
  ctx.closePath();
  ctx.fill();
  drawDynamicFlame(ctx, W - 280, 460, 25, localT);

  const chulhaX = 1260;
  const chulhaY = H * 0.74;

  ctx.fillStyle = "#5A381E";
  ctx.strokeStyle = "#38200F";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(chulhaX, chulhaY + 50, 95, Math.PI, 0);
  ctx.lineTo(chulhaX + 95, chulhaY + 90);
  ctx.lineTo(chulhaX - 95, chulhaY + 90);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const emberGlow = ctx.createRadialGradient(chulhaX, chulhaY + 60, 10, chulhaX, chulhaY + 60, 60);
  emberGlow.addColorStop(0, "#FF4500");
  emberGlow.addColorStop(0.6, "#EA580C");
  emberGlow.addColorStop(1, "rgba(100, 30, 0, 0)");
  ctx.fillStyle = emberGlow;
  ctx.beginPath(); ctx.arc(chulhaX, chulhaY + 60, 60, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#1F2937";
  ctx.beginPath(); ctx.ellipse(chulhaX, chulhaY + 12, 70, 20, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#FDE68A";
  ctx.strokeStyle = "#D97706";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(chulhaX, chulhaY + 10, 48, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.strokeStyle = "rgba(243, 244, 246, 0.4)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(chulhaX, chulhaY);
  ctx.bezierCurveTo(chulhaX - 25, chulhaY - 90, chulhaX + 35, chulhaY - 180, chulhaX - 10, chulhaY - 260);
  ctx.stroke();

  ctx.fillStyle = "#F59E0B";
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(980, H * 0.86, 75, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(1100, H * 0.84, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  drawFloatingDust(ctx, W, H, localT, { count: 45, color: "rgba(255, 245, 210, 0.85)" });

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "KULDHARA DOMESTIC INTERIOR · KITCHEN HEARTH",
    era: "HALF-COOKED FOOD LEFT ON THE HEARTH · MARCH 1825",
    chapter: "ACT VI: THE FROZEN MOMENT",
    accentColor: "#F59E0B"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.05 });
}

// ============================================================================
// SCENE 09: THE FOOTPRINT PARADOX (Forensic Radar & Fault Line Analysis)
// ============================================================================
export function drawSceneFootprintParadox(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0F172A");
  sky.addColorStop(0.6, "#1E293B");
  sky.addColorStop(1, "#334155");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const duneGrad = ctx.createLinearGradient(0, H * 0.5, 0, H);
  duneGrad.addColorStop(0, "#D97706");
  duneGrad.addColorStop(0.5, "#B45309");
  duneGrad.addColorStop(1, "#78350F");
  ctx.fillStyle = duneGrad;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.58);
  ctx.bezierCurveTo(W * 0.4, H * 0.52, W * 0.7, H * 0.65, W, H * 0.55);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  const radarX = W / 2;
  const radarY = H * 0.58;

  ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
  ctx.lineWidth = 1.5;
  for (const r of [120, 240, 360, 480]) {
    ctx.beginPath(); ctx.arc(radarX, radarY, r, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.strokeStyle = "rgba(6, 182, 212, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(radarX - 520, radarY); ctx.lineTo(radarX + 520, radarY);
  ctx.moveTo(radarX, radarY - 420); ctx.lineTo(radarX, radarY + 320);
  ctx.stroke();

  const sweepAngle = (localT * 2.2) % (Math.PI * 2);
  const sweepGrad = ctx.createRadialGradient(radarX, radarY, 0, radarX, radarY, 480);
  sweepGrad.addColorStop(0, "rgba(6, 182, 212, 0.35)");
  sweepGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
  ctx.fillStyle = sweepGrad;
  ctx.beginPath();
  ctx.moveTo(radarX, radarY);
  ctx.arc(radarX, radarY, 480, sweepAngle - 0.4, sweepAngle);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#F43F5E";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(radarX - 350, radarY + 220);
  ctx.lineTo(radarX - 180, radarY + 120);
  ctx.lineTo(radarX - 50, radarY + 40);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "bold 18px 'Inter', monospace";
  ctx.fillStyle = "#06B6D4";
  ctx.fillText("[ RADAR SCAN: 84 VILLAGE PERIMETERS ]", 120, H * 0.78);
  ctx.fillText("[ RESIDUAL TRACK ARCHIVE: 0 TRACKS DETECTED ]", 120, H * 0.82);
  ctx.fillText("[ CURRENT SCIENCE 2017: KAKNI FAULT ZONE ]", 120, H * 0.86);

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "PERIMETER SURVEY · THAR BASIN FAULT LINE",
    era: "FORENSIC FOOTPRINT PUZZLE · 1,500 REFUGEES VANISHED WITHOUT A TRACE",
    chapter: "ACT VII: THE FOOTPRINT PARADOX",
    accentColor: "#06B6D4"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.05 });
}

// ============================================================================
// SCENE 10: THE ASI WARNING GATE (Official Heritage Restriction)
// ============================================================================
export function drawSceneASIGate(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#080C16");
  bg.addColorStop(0.6, "#111827");
  bg.addColorStop(1, "#1F2937");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const pillarW = 200;
  for (const px of [120, W - 320]) {
    const pGrad = ctx.createLinearGradient(px, 0, px + pillarW, 0);
    pGrad.addColorStop(0, "#4B3621");
    pGrad.addColorStop(0.5, "#8B653E");
    pGrad.addColorStop(1, "#362414");
    ctx.fillStyle = pGrad;
    ctx.fillRect(px, 120, pillarW, H - 120);
    ctx.fillStyle = "#A67C52";
    ctx.fillRect(px - 20, 95, pillarW + 40, 30);
  }

  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 8;
  for (let gx = 340; gx <= W - 340; gx += 55) {
    ctx.beginPath(); ctx.moveTo(gx, 160); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (const gy of [240, 520, 800]) {
    ctx.fillRect(320, gy, W - 640, 22);
  }

  const boardW = 860, boardH = 460;
  const boardX = W / 2 - boardW / 2, boardY = H / 2 - boardH / 2;

  ctx.fillStyle = "#1E3A8A";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 6;
  ctx.fillRect(boardX, boardY, boardW, boardH);
  ctx.strokeRect(boardX, boardY, boardW, boardH);

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.strokeRect(boardX + 16, boardY + 16, boardW - 32, boardH - 32);

  ctx.textAlign = "center";
  ctx.font = "bold 34px 'Noto Sans Devanagari', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("भारतीय पुरातत्व सर्वेक्षण (ASI)", W / 2, boardY + 75);

  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillStyle = "#E0E7FF";
  ctx.fillText("ARCHAEOLOGICAL SURVEY OF INDIA", W / 2, boardY + 115);

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(boardX + 60, boardY + 140); ctx.lineTo(boardX + boardW - 60, boardY + 140);
  ctx.stroke();

  ctx.font = "bold 38px 'Noto Sans Devanagari', sans-serif";
  ctx.fillStyle = "#FBBF24";
  ctx.fillText("चेतावनी: सूर्यास्त के बाद प्रवेश सख्त मना है", W / 2, boardY + 225);

  ctx.font = "bold 26px 'Inter', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("ENTRY STRICTLY PROHIBITED AFTER SUNSET", W / 2, boardY + 275);

  ctx.font = "600 20px 'Noto Sans Devanagari', sans-serif";
  ctx.fillStyle = "#93C5FD";
  ctx.fillText("संरक्षित राष्ट्रीय स्मारक • उल्लंघन करने पर कानूनी कार्रवाई होगी", W / 2, boardY + 340);
  ctx.fillText("PROTECTED NATIONAL MONUMENT • TRESPASSERS WILL BE PROSECUTED", W / 2, boardY + 380);

  const flashX = W * 0.35 + Math.sin(localT * 1.5) * 280;
  const flashY = H * 0.55;
  const flashGlow = ctx.createRadialGradient(flashX, flashY, 50, flashX, flashY, 400);
  flashGlow.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  flashGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
  flashGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = flashGlow;
  ctx.beginPath(); ctx.arc(flashX, flashY, 400, 0, Math.PI * 2); ctx.fill();

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "KULDHARA VILLAGE ENTRANCE PERIMETER",
    era: "GOVERNMENT HERITAGE RESTRICTION · ACTIVE PROTOCOL",
    chapter: "ACT VIII: THE PROHIBITED ZONE",
    accentColor: "#FBBF24"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.05 });
}

// ============================================================================
// SCENE 11: THERMAL ANOMALY (FLIR Infrared Anomaly)
// ============================================================================
export function drawSceneThermalAnomaly(ctx, W, H, t) {
  const localT = getSceneTime(t);

  ctx.fillStyle = "#06071B";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1E1B4B";
  ctx.fillRect(180, 320, 420, H - 320);
  ctx.fillRect(W - 600, 320, 420, H - 320);
  ctx.fillRect(450, 220, W - 900, 160);

  const targetX = W / 2;
  const targetY = 520;

  const auraGrad = ctx.createRadialGradient(targetX, targetY, 40, targetX, targetY, 220);
  auraGrad.addColorStop(0, "rgba(244, 63, 94, 0.8)");
  auraGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.4)");
  auraGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath(); ctx.arc(targetX, targetY, 220, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath(); ctx.arc(targetX, targetY - 140, 34, 0, Math.PI * 2); ctx.fill();

  ctx.beginPath();
  ctx.moveTo(targetX - 55, targetY - 95); ctx.lineTo(targetX + 55, targetY - 95);
  ctx.lineTo(targetX + 45, targetY + 90); ctx.lineTo(targetX - 45, targetY + 90);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 24;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(targetX - 55, targetY - 80); ctx.lineTo(targetX - 85, targetY + 30);
  ctx.moveTo(targetX + 55, targetY - 80); ctx.lineTo(targetX + 85, targetY + 30);
  ctx.stroke();

  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(targetX - 25, targetY + 80); ctx.lineTo(targetX - 35, targetY + 240);
  ctx.moveTo(targetX + 25, targetY + 80); ctx.lineTo(targetX + 35, targetY + 240);
  ctx.stroke();

  ctx.strokeStyle = "#EF4444";
  ctx.lineWidth = 2.5;
  const boxW = 260, boxH = 460;
  const bx = targetX - boxW / 2, by = targetY - boxH / 2 - 20;
  const blen = 35;
  ctx.beginPath();
  ctx.moveTo(bx, by + blen); ctx.lineTo(bx, by); ctx.lineTo(bx + blen, by);
  ctx.moveTo(bx + boxW - blen, by); ctx.lineTo(bx + boxW, by); ctx.lineTo(bx + boxW, by + blen);
  ctx.moveTo(bx, by + boxH - blen); ctx.lineTo(bx, by + boxH); ctx.lineTo(bx + blen, by + boxH);
  ctx.moveTo(bx + boxW - blen, by + boxH); ctx.lineTo(bx + boxW, by + boxH); ctx.lineTo(bx + boxW, by + boxH - blen);
  ctx.stroke();

  ctx.strokeStyle = "#22D3EE";
  ctx.beginPath();
  ctx.arc(targetX, targetY - 60, 18, 0, Math.PI * 2);
  ctx.moveTo(targetX - 30, targetY - 60); ctx.lineTo(targetX + 30, targetY - 60);
  ctx.moveTo(targetX, targetY - 90); ctx.lineTo(targetX, targetY - 30);
  ctx.stroke();

  const barX = W - 140, barY = 220, barW = 32, barH = 580;
  const barGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
  barGrad.addColorStop(0, "#FFFFFF");
  barGrad.addColorStop(0.2, "#FDE047");
  barGrad.addColorStop(0.45, "#F97316");
  barGrad.addColorStop(0.7, "#A855F7");
  barGrad.addColorStop(1, "#1E1B4B");
  ctx.fillStyle = barGrad;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.font = "bold 15px 'Inter', monospace";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("+42.0°C", barX - 70, barY + 15);
  ctx.fillText("+37.4°C", barX - 70, barY + 120);
  ctx.fillText("+25.0°C", barX - 70, barY + 270);
  ctx.fillText("+10.0°C", barX - 70, barY + 420);
  ctx.fillText(" 0.0°C", barX - 70, barY + barH);

  ctx.textAlign = "left";
  ctx.font = "bold 18px 'Inter', monospace";
  ctx.fillStyle = "#22D3EE";
  ctx.fillText("• FLIR THERMAL IR-PRO [CALIBRATED]", 120, 140);
  ctx.fillText("  GPS: 27° 19′ 48.2″ N, 70° 54′ 24.8″ E", 120, 175);
  ctx.fillText("  EMF DETECT: 4.8 mG [HIGH FLUCTUATION]", 120, 210);

  ctx.fillStyle = "#EF4444";
  ctx.font = "bold 22px 'Inter', monospace";
  ctx.fillText("TARGET: +37.4°C [HUMANOID BODY HEAT DETECTED]", 120, 255);

  drawDocumentaryHUD(ctx, W, H, localT, {
    location: "KULDHARA QUADRANGLE · PARANORMAL FIELD EXPEDITION",
    era: "INDIAN PARANORMAL SOCIETY INVESTIGATION · FLIR IMAGING",
    chapter: "ACT IX: THE SCIENTIFIC ANOMALY",
    accentColor: "#22D3EE"
  });

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.07 });
}

// ============================================================================
// SCENE 12: STUDIO OUTRO (Prestigious Gold Title Card)
// ============================================================================
export function drawSceneOutro(ctx, W, H, t) {
  const localT = getSceneTime(t);

  const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.65);
  bg.addColorStop(0, "#1E1738");
  bg.addColorStop(0.5, "#0F0B1E");
  bg.addColorStop(1, "#06040B");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 80, W - 240, H - 160);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(135, 95, W - 270, H - 190);

  const iconY = 320;
  ctx.strokeStyle = "#FBBF24";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(W / 2, iconY, 55, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = "#F59E0B";
  ctx.beginPath();
  ctx.moveTo(W / 2, iconY - 35);
  ctx.lineTo(W / 2 + 10, iconY - 10);
  ctx.lineTo(W / 2 + 35, iconY);
  ctx.lineTo(W / 2 + 10, iconY + 10);
  ctx.lineTo(W / 2, iconY + 35);
  ctx.lineTo(W / 2 - 10, iconY + 10);
  ctx.lineTo(W / 2 - 35, iconY);
  ctx.lineTo(W / 2 - 10, iconY - 10);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = "center";
  ctx.font = "900 68px 'Cinzel', serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("NIGHTINGALE FILMS", W / 2, 480);

  ctx.font = "bold 24px 'Inter', sans-serif";
  ctx.fillStyle = "#F59E0B";
  ctx.fillText("UNSOLVED REALITIES • 100% FACT-CHECKED MYSTERIES", W / 2, 545);

  ctx.font = "600 28px 'Noto Sans Devanagari', sans-serif";
  ctx.fillStyle = "#93C5FD";
  ctx.fillText("आपकी क्या राय है? कमेंट में बताएं • लाइक और सब्सक्राइब करें", W / 2, 640);

  applyCinematicFilmLook(ctx, W, H, localT, { vignette: 0.35, grainAlpha: 0.05 });
}
