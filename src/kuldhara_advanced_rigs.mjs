// kuldhara_advanced_rigs.mjs - Broadcast-Grade Anatomical Rigs for Kuldhara Animation
// Pure code vector illustration with cel-shading, anatomy, expressive faces, and secondary motion.
import { rad, lerp, ellipse, stroke, fill, line, poly, smooth, rrect } from "./anim/core.mjs";

const DARK_INK = "#140B18";
const GOLD_LIGHT = "#F4D068";
const GOLD_MID = "#E5B842";
const GOLD_DARK = "#B88628";
const RUBY = "#C81E2B";
const EMERALD = "#1B7A4E";
const RAJASTHANI_RED = "#D8281E";

/** Helper: Draw cel-shaded curved tube (limbs, fingers, folds) */
export function drawShadedLimb(ctx, x1, y1, x2, y2, r, baseCol, shadowCol, highlightCol) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const nx = -dy / len, ny = dx / len;

  ctx.save();
  // Base shadow
  ctx.beginPath();
  ctx.moveTo(x1 - nx * r, y1 - ny * r);
  ctx.lineTo(x2 - nx * r, y2 - ny * r);
  ctx.lineTo(x2 + nx * r, y2 + ny * r);
  ctx.lineTo(x1 + nx * r, y1 + ny * r);
  ctx.closePath();
  ctx.fillStyle = shadowCol;
  ctx.fill();

  // Midtone body
  ctx.beginPath();
  ctx.moveTo(x1 - nx * (r * 0.4), y1 - ny * (r * 0.4));
  ctx.lineTo(x2 - nx * (r * 0.4), y2 - ny * (r * 0.4));
  ctx.lineTo(x2 + nx * r, y2 + ny * r);
  ctx.lineTo(x1 + nx * r, y1 + ny * r);
  ctx.closePath();
  ctx.fillStyle = baseCol;
  ctx.fill();

  // Rim highlight
  if (highlightCol) {
    ctx.strokeStyle = highlightCol;
    ctx.lineWidth = r * 0.35;
    ctx.lineCap = "round";
    line(ctx, [[x1 + nx * (r * 0.65), y1 + ny * (r * 0.65)], [x2 + nx * (r * 0.65), y2 + ny * (r * 0.65)]], r * 0.35, highlightCol);
  }

  // Ink outline
  ctx.strokeStyle = DARK_INK;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1 - nx * r, y1 - ny * r);
  ctx.lineTo(x2 - nx * r, y2 - ny * r);
  ctx.moveTo(x1 + nx * r, y1 + ny * r);
  ctx.lineTo(x2 + nx * r, y2 + ny * r);
  ctx.stroke();

  // Joint caps
  ellipse(ctx, x1, y1, r, r);
  ctx.fillStyle = baseCol;
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  ellipse(ctx, x2, y2, r, r);
  ctx.fillStyle = baseCol;
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  ctx.restore();
}

/** 1. ADVANCED SALIM SINGH RIG */
export function drawAdvancedSalimSingh(ctx, x, y, scale = 1, t = 0, daggerProgress = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft contact drop shadow
  const shadowG = ctx.createRadialGradient(0, 0, 10, 0, 0, 140);
  shadowG.addColorStop(0, "rgba(10, 5, 15, 0.7)");
  shadowG.addColorStop(1, "rgba(10, 5, 15, 0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath();
  ctx.ellipse(0, 5, 140, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- LOWER BODY: Dhoti & Churidar with Royal Mojari Shoes ---
  for (const side of [-1, 1]) {
    const lx = side * 38;
    // Leg with fabric folds
    poly(ctx, [[lx - 18, -120], [lx + 18, -120], [lx + 14, 0], [lx - 14, 0]]);
    ctx.fillStyle = "#EAE6D8";
    ctx.fill();
    stroke(ctx, 3.5, DARK_INK);

    // Churidar horizontal wrinkle bands
    for (let wy = -100; wy < -10; wy += 22) {
      line(ctx, [[lx - 14, wy], [lx + 14, wy + 2]], 2, "rgba(40,30,20,0.25)");
    }

    // Embroidered Royal Mojari Shoe with pointed curled toe
    ctx.save();
    ctx.translate(lx, 0);
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(24, -10);
    ctx.quadraticCurveTo(48, -18, 54, -32); // Curled tip
    ctx.quadraticCurveTo(44, -18, 22, -2);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fillStyle = "#8E1824";
    ctx.fill();
    stroke(ctx, 3, DARK_INK);

    // Gold zari shoe embroidery
    line(ctx, [[-12, -6], [28, -6]], 2.5, GOLD_LIGHT);
    ellipse(ctx, 6, -6, 3, 3);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fill();
    ctx.restore();
  }

  // --- COAT SKIRT (Angrakha Flared Skirt) ---
  const skirtG = ctx.createLinearGradient(-110, -280, 110, -280);
  skirtG.addColorStop(0, "#161D32");
  skirtG.addColorStop(0.3, "#283864");
  skirtG.addColorStop(0.7, "#283864");
  skirtG.addColorStop(1, "#121828");

  poly(ctx, [[-78, -280], [78, -280], [128, -65], [-128, -65]]);
  ctx.fillStyle = skirtG;
  ctx.fill();
  stroke(ctx, 4.5, DARK_INK);

  // Vertical pleat shadows
  for (const px of [-60, -20, 20, 60]) {
    line(ctx, [[px * 0.7, -280], [px * 1.5, -68]], 2.5, "rgba(10, 15, 30, 0.45)");
  }

  // Gold Brocade Hem with Jewel Dots
  poly(ctx, [[-126, -65], [126, -65], [124, -48], [-124, -48]]);
  ctx.fillStyle = GOLD_MID;
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  for (let jx = -110; jx <= 110; jx += 22) {
    ellipse(ctx, jx, -56, 3.5, 3.5);
    ctx.fillStyle = RUBY;
    ctx.fill();
  }

  // --- WAIST: Ornate Kamarbandh (Silk Sash) with Emerald Buckle ---
  poly(ctx, [[-84, -185], [84, -185], [88, -145], [-88, -145]]);
  ctx.fillStyle = GOLD_MID;
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  // Sash fabric folds
  line(ctx, [[-80, -165], [80, -165]], 2, GOLD_LIGHT);

  // Emerald & Ruby buckle medallion
  ellipse(ctx, 0, -165, 20, 20);
  ctx.fillStyle = GOLD_DARK;
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  ellipse(ctx, 0, -165, 14, 14);
  ctx.fillStyle = EMERALD;
  ctx.fill();
  stroke(ctx, 2, DARK_INK);

  ellipse(ctx, -2, -168, 4, 4);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();

  // Hanging sash tails with gold fringe
  poly(ctx, [[-18, -145], [18, -145], [26, -80], [-26, -80]]);
  ctx.fillStyle = RAJASTHANI_RED;
  ctx.fill();
  stroke(ctx, 3, DARK_INK);
  line(ctx, [[-24, -82], [24, -82]], 4, GOLD_LIGHT);

  // --- UPPER TORSO: Royal Angrakha Chest with Gold Zari Cross-Bands ---
  const chestG = ctx.createLinearGradient(-95, -420, 95, -420);
  chestG.addColorStop(0, "#161D32");
  chestG.addColorStop(0.35, "#2C3D6E");
  chestG.addColorStop(0.7, "#2C3D6E");
  chestG.addColorStop(1, "#121828");

  poly(ctx, [[-88, -420], [88, -420], [80, -280], [-80, -280]]);
  ctx.fillStyle = chestG;
  ctx.fill();
  stroke(ctx, 4.5, DARK_INK);

  // Crossed Gold Zari Bands with Embroidered Buttons
  ctx.lineWidth = 8;
  ctx.strokeStyle = GOLD_MID;
  line(ctx, [[-82, -410], [30, -280]], 8, GOLD_MID);
  stroke(ctx, 2.5, DARK_INK);

  line(ctx, [[82, -410], [-30, -280]], 8, GOLD_MID);
  stroke(ctx, 2.5, DARK_INK);

  // Gold buttons
  for (let b = 0; b < 4; b++) {
    const by = -390 + b * 32;
    ellipse(ctx, 0, by, 5, 5);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fill();
    stroke(ctx, 2, DARK_INK);
  }

  // Broad Shoulders & Epaulettes
  for (const s of [-1, 1]) {
    ellipse(ctx, s * 84, -415, 22, 14);
    ctx.fillStyle = GOLD_MID;
    ctx.fill();
    stroke(ctx, 3, DARK_INK);
  }

  // --- NECK & COLLAR ---
  poly(ctx, [[-26, -450], [26, -450], [24, -420], [-24, -420]]);
  ctx.fillStyle = "#E4A872";
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  // Pearl Necklace (Kanthi)
  for (let p = -4; p <= 4; p++) {
    const px = p * 6;
    const py = -422 + Math.abs(p) * 2;
    ellipse(ctx, px, py, 4, 4);
    ctx.fillStyle = "#FAF8F2";
    ctx.fill();
    stroke(ctx, 1.5, DARK_INK);
  }

  // --- HEAD & MENACING FACE ---
  const hy = -485;
  // Face contour with jawline
  ctx.beginPath();
  ctx.moveTo(-44, hy - 25);
  ctx.quadraticCurveTo(-46, hy + 20, -28, hy + 45);
  ctx.quadraticCurveTo(0, hy + 58, 28, hy + 45);
  ctx.quadraticCurveTo(46, hy + 20, 44, hy - 25);
  ctx.closePath();
  ctx.fillStyle = "#E4A872";
  ctx.fill();
  stroke(ctx, 4, DARK_INK);

  // Ears with gold kundal earrings
  for (const side of [-1, 1]) {
    ellipse(ctx, side * 44, hy + 2, 8, 14);
    ctx.fillStyle = "#E4A872";
    ctx.fill();
    stroke(ctx, 3, DARK_INK);

    // Kundal ring
    ellipse(ctx, side * 44, hy + 12, 5, 5);
    ctx.fillStyle = GOLD_MID;
    ctx.fill();
    stroke(ctx, 2, DARK_INK);
  }

  // Eyes with Upper Eyelid, Cornea, Iris & Dual Specular Highlights
  for (const side of [-1, 1]) {
    const ex = side * 18;
    const ey = hy - 4;

    // Sclera (White of eye)
    ctx.beginPath();
    ctx.moveTo(ex - 14, ey);
    ctx.quadraticCurveTo(ex, ey - 9, ex + 14, ey);
    ctx.quadraticCurveTo(ex, ey + 8, ex - 14, ey);
    ctx.closePath();
    ctx.fillStyle = "#FFF9F0";
    ctx.fill();
    stroke(ctx, 2.5, DARK_INK);

    // Dark Amber Iris
    ellipse(ctx, ex + 1, ey, 6.5, 6.5);
    ctx.fillStyle = "#4A2412";
    ctx.fill();

    // Pupil
    ellipse(ctx, ex + 1, ey, 3.5, 3.5);
    ctx.fillStyle = DARK_INK;
    ctx.fill();

    // Dual Specular Highlights
    ellipse(ctx, ex - 1, ey - 2, 2.2, 2.2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ellipse(ctx, ex + 3, ey + 1, 1.2, 1.2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Sharp Menacing Eyebrow
    ctx.beginPath();
    ctx.moveTo(ex - side * 16, ey - 18);
    ctx.quadraticCurveTo(ex, ey - 22, ex + side * 16, ey - 14);
    ctx.lineTo(ex + side * 14, ey - 10);
    ctx.quadraticCurveTo(ex, ey - 17, ex - side * 14, ey - 14);
    ctx.closePath();
    ctx.fillStyle = DARK_INK;
    ctx.fill();
  }

  // Aquiline Nose with shading
  ctx.beginPath();
  ctx.moveTo(0, hy - 14);
  ctx.lineTo(-4, hy + 12);
  ctx.quadraticCurveTo(0, hy + 18, 5, hy + 14);
  stroke(ctx, 3, DARK_INK);

  // Grand Curled Royal Rajput Moustache
  ctx.beginPath();
  ctx.moveTo(-56, hy + 14);
  ctx.quadraticCurveTo(-22, hy + 28, 0, hy + 22);
  ctx.quadraticCurveTo(22, hy + 28, 56, hy + 14);
  ctx.quadraticCurveTo(68, hy + 4, 64, hy - 6);
  ctx.quadraticCurveTo(56, hy + 4, 34, hy + 18);
  ctx.lineTo(-34, hy + 18);
  ctx.quadraticCurveTo(-56, hy + 4, -64, hy - 6);
  ctx.quadraticCurveTo(-68, hy + 4, -56, hy + 14);
  ctx.closePath();
  ctx.fillStyle = DARK_INK;
  ctx.fill();

  // Shouting Menacing Mouth
  const mouthOpen = 4 + Math.abs(Math.sin(t * 12)) * 12;
  ctx.beginPath();
  ctx.ellipse(0, hy + 36, 14, mouthOpen, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#4A1218";
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);

  // Upper white teeth line
  ctx.beginPath();
  ctx.arc(0, hy + 36 - mouthOpen * 0.4, 10, 0, Math.PI);
  ctx.fillStyle = "#FFFBF4";
  ctx.fill();

  // --- ROYAL RAJPUT PAGRI TURBAN WITH BROCADE & PLUME ---
  for (let f = 0; f < 4; f++) {
    const ty = hy - 25 - f * 20;
    const tw = 62 - f * 4;
    ellipse(ctx, 0, ty, tw, 22);
    ctx.fillStyle = f % 2 === 0 ? RAJASTHANI_RED : "#BE2018";
    ctx.fill();
    stroke(ctx, 3.5, DARK_INK);

    // Gold brocade band
    if (f === 1) {
      line(ctx, [[-tw + 6, ty], [tw - 6, ty]], 5, GOLD_MID);
    }
  }

  // Jeweled Sarpech (Turban Brooch) with Ruby
  ellipse(ctx, 0, hy - 96, 12, 12);
  ctx.fillStyle = GOLD_MID;
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);

  ellipse(ctx, 0, hy - 96, 6, 6);
  ctx.fillStyle = RUBY;
  ctx.fill();

  // Kalgi Feather Plume (White Swan Feather)
  ctx.beginPath();
  ctx.moveTo(0, hy - 105);
  ctx.quadraticCurveTo(-22, hy - 160, -8, hy - 195);
  ctx.quadraticCurveTo(18, hy - 150, 0, hy - 105);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);
  line(ctx, [[0, hy - 105], [-8, hy - 192]], 2, "#D8D4C8");

  // --- LEFT ARM (Resting on Hilt / Hip) ---
  drawShadedLimb(ctx, -82, -410, -135, -310, 18, "#283864", "#161D32", "#4862A8");
  drawShadedLimb(ctx, -135, -310, -90, -250, 16, "#283864", "#161D32", "#4862A8");
  // Left Hand
  ellipse(ctx, -90, -250, 15, 15);
  ctx.fillStyle = "#E4A872";
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  // --- RIGHT ARM & KHANJAR (CURVED DAGGER) ---
  const elbowX = lerp(130, 155, daggerProgress);
  const elbowY = lerp(-370, -420, daggerProgress);
  const handX = lerp(100, 195, daggerProgress);
  const handY = lerp(-310, -395, daggerProgress);

  drawShadedLimb(ctx, 82, -410, elbowX, elbowY, 18, "#283864", "#161D32", "#4862A8");
  drawShadedLimb(ctx, elbowX, elbowY, handX, handY, 16, "#283864", "#161D32", "#4862A8");

  // Hand gripping dagger hilt
  ellipse(ctx, handX, handY, 16, 16);
  ctx.fillStyle = "#E4A872";
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  // Knuckles and thumb gripping
  for (let k = 0; k < 4; k++) {
    ellipse(ctx, handX + 10, handY - 10 + k * 7, 5, 4);
    ctx.fillStyle = "#D49460";
    ctx.fill();
    stroke(ctx, 2, DARK_INK);
  }

  // Curved Damascus Steel Khanjar Dagger
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(lerp(0.2, -0.4, daggerProgress));

  // Hilt (Jade & Gold)
  poly(ctx, [[-8, -22], [8, -22], [7, 22], [-7, 22]]);
  ctx.fillStyle = GOLD_MID;
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  // Pommel & Guard
  ellipse(ctx, 0, 24, 11, 7);
  ctx.fillStyle = EMERALD;
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);

  poly(ctx, [[-16, -22], [16, -22], [14, -14], [-14, -14]]);
  ctx.fillStyle = GOLD_DARK;
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);

  // Curved Razor-Sharp Damascus Steel Blade
  ctx.beginPath();
  ctx.moveTo(-7, -22);
  ctx.lineTo(7, -22);
  ctx.quadraticCurveTo(18, -80, 42, -135); // Sharp forward curve
  ctx.quadraticCurveTo(12, -95, -7, -22);
  ctx.closePath();
  ctx.fillStyle = "#E2E8F0";
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  // Blade Fuller Groove & Specular Glint
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.quadraticCurveTo(12, -75, 28, -120);
  ctx.stroke();

  // Glint star on tip
  const tipGlint = Math.abs(Math.sin(t * 8));
  if (tipGlint > 0.4) {
    ctx.fillStyle = "#FFFFFF";
    ellipse(ctx, 38, -128, 4 * tipGlint, 4 * tipGlint);
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

/** 2. ADVANCED VILLAGE CHIEF RIG */
export function drawAdvancedChief(ctx, x, y, scale = 1, t = 0, p = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (p.flip ? -1 : 1), scale);

  // Drop shadow
  const shadowG = ctx.createRadialGradient(0, 0, 10, 0, 0, 110);
  shadowG.addColorStop(0, "rgba(10, 5, 15, 0.6)");
  shadowG.addColorStop(1, "rgba(10, 5, 15, 0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath();
  ctx.ellipse(0, 5, 110, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // White Dhoti Legs
  for (const side of [-1, 1]) {
    const lx = side * 28;
    poly(ctx, [[lx - 18, -110], [lx + 18, -110], [lx + 14, 0], [lx - 14, 0]]);
    ctx.fillStyle = "#ECE7DA";
    ctx.fill();
    stroke(ctx, 3.5, DARK_INK);

    // Leather Mojari
    ellipse(ctx, lx + 4, 0, 14, 7);
    ctx.fillStyle = "#7A4A28";
    ctx.fill();
    stroke(ctx, 2.5, DARK_INK);
  }

  // Khadi Kurta Torso with fabric shading
  const kurtaG = ctx.createLinearGradient(-60, -260, 60, -260);
  kurtaG.addColorStop(0, "#E2DDD0");
  kurtaG.addColorStop(0.3, "#F8F5EE");
  kurtaG.addColorStop(0.7, "#F8F5EE");
  kurtaG.addColorStop(1, "#D6D0C2");

  poly(ctx, [[-58, -260], [58, -260], [68, -100], [-68, -100]]);
  ctx.fillStyle = kurtaG;
  ctx.fill();
  stroke(ctx, 4, DARK_INK);

  // Fabric pleats
  for (const fx of [-35, 0, 35]) {
    line(ctx, [[fx * 0.8, -250], [fx * 1.2, -105]], 2, "rgba(60,50,40,0.2)");
  }

  // Saffron Angavastram Shawl draped diagonally with Gold Zari Border
  poly(ctx, [[-62, -255], [-18, -262], [62, -130], [38, -105], [-64, -200]]);
  ctx.fillStyle = "#EA7224";
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  // Gold zari border on shawl
  line(ctx, [[-60, -252], [42, -110]], 4.5, GOLD_MID);
  stroke(ctx, 1.5, DARK_INK);

  // Neck & Weathered Skin
  poly(ctx, [[-22, -280], [22, -280], [20, -255], [-20, -255]]);
  ctx.fillStyle = "#D69A68";
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  // Head & Weathered Elder Face
  const hy = -315;
  ctx.beginPath();
  ctx.moveTo(-38, hy - 20);
  ctx.quadraticCurveTo(-42, hy + 15, -24, hy + 40);
  ctx.quadraticCurveTo(0, hy + 52, 24, hy + 40);
  ctx.quadraticCurveTo(42, hy + 15, 38, hy - 20);
  ctx.closePath();
  ctx.fillStyle = "#D69A68";
  ctx.fill();
  stroke(ctx, 4, DARK_INK);

  // Ears
  for (const s of [-1, 1]) {
    ellipse(ctx, s * 38, hy + 4, 7, 12);
    ctx.fillStyle = "#D69A68";
    ctx.fill();
    stroke(ctx, 2.5, DARK_INK);
  }

  // Forehead wrinkles of dignity and wisdom
  line(ctx, [[-22, hy - 22], [22, hy - 22]], 2, "rgba(70,40,20,0.35)");
  line(ctx, [[-18, hy - 16], [18, hy - 16]], 2, "rgba(70,40,20,0.35)");

  // Expressive Elder Eyes with Crows Feet
  for (const side of [-1, 1]) {
    const ex = side * 16;
    const ey = hy - 4;

    ctx.beginPath();
    ctx.moveTo(ex - 12, ey);
    ctx.quadraticCurveTo(ex, ey - 7, ex + 12, ey);
    ctx.quadraticCurveTo(ex, ey + 6, ex - 12, ey);
    ctx.closePath();
    ctx.fillStyle = "#FFF8EE";
    ctx.fill();
    stroke(ctx, 2.5, DARK_INK);

    // Dark Iris & Pupil
    ellipse(ctx, ex + 1, ey, 5, 5);
    ctx.fillStyle = "#341E12";
    ctx.fill();
    ellipse(ctx, ex + 1, ey, 2.5, 2.5);
    ctx.fillStyle = DARK_INK;
    ctx.fill();

    // White bushy eyebrows
    ctx.beginPath();
    ctx.moveTo(ex - side * 14, ey - 14);
    ctx.quadraticCurveTo(ex, ey - 18, ex + side * 14, ey - 12);
    ctx.lineTo(ex + side * 12, ey - 9);
    ctx.quadraticCurveTo(ex, ey - 14, ex - side * 12, ey - 11);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    stroke(ctx, 2, DARK_INK);
  }

  // Nose
  ctx.beginPath();
  ctx.moveTo(0, hy - 10);
  ctx.lineTo(-4, hy + 12);
  ctx.quadraticCurveTo(0, hy + 17, 5, hy + 13);
  stroke(ctx, 3, DARK_INK);

  // Grand Flowing Multi-Layered White Beard
  ctx.beginPath();
  ctx.moveTo(-34, hy + 10);
  ctx.quadraticCurveTo(-48, hy + 50, -22, hy + 90);
  ctx.quadraticCurveTo(0, hy + 115, 22, hy + 90);
  ctx.quadraticCurveTo(48, hy + 50, 34, hy + 10);
  ctx.quadraticCurveTo(20, hy + 22, 0, hy + 22);
  ctx.quadraticCurveTo(-20, hy + 22, -34, hy + 10);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  // Beard strand lines
  for (const bx of [-18, -6, 6, 18]) {
    line(ctx, [[bx * 0.8, hy + 28], [bx * 1.1, hy + 85]], 2, "#D8D4C8");
  }

  // Shouting Mouth for the Curse scene
  if (p.shouting) {
    const mo = 8 + Math.abs(Math.sin(t * 14)) * 14;
    ellipse(ctx, 0, hy + 22, 14, mo);
    ctx.fillStyle = "#381014";
    ctx.fill();
    stroke(ctx, 2.5, DARK_INK);

    // Upper teeth
    ctx.beginPath();
    ctx.arc(0, hy + 22 - mo * 0.4, 9, 0, Math.PI);
    ctx.fillStyle = "#FFFBF2";
    ctx.fill();
  }

  // White Cotton Pagri Turban with Authentic Folds
  for (let f = 0; f < 3; f++) {
    const ty = hy - 22 - f * 18;
    const tw = 54 - f * 3;
    ellipse(ctx, 0, ty, tw, 20);
    ctx.fillStyle = f % 2 === 0 ? "#F8F5EE" : "#ECE7DA";
    ctx.fill();
    stroke(ctx, 3.5, DARK_INK);
  }

  // Arm Poses
  if (p.raisingTorch) {
    // Right arm holding flaming torch high into stormy sky
    drawShadedLimb(ctx, 52, -250, 88, -340, 18, "#F8F5EE", "#D6D0C2", "#FFFFFF");
    drawShadedLimb(ctx, 88, -340, 108, -430, 16, "#F8F5EE", "#D6D0C2", "#FFFFFF");

    // Hand gripping torch
    ellipse(ctx, 108, -430, 15, 15);
    ctx.fillStyle = "#D69A68";
    ctx.fill();
    stroke(ctx, 3, DARK_INK);

    // Torso Flaming Torch
    drawAdvancedTorchRealistic(ctx, 108, -440, 1.4, t);

    // Left arm clenched in defiance
    drawShadedLimb(ctx, -52, -250, -85, -230, 18, "#F8F5EE", "#D6D0C2", "#FFFFFF");
    drawShadedLimb(ctx, -85, -230, -78, -170, 16, "#F8F5EE", "#D6D0C2", "#FFFFFF");
    // Clenched fist
    ellipse(ctx, -78, -170, 15, 15);
    ctx.fillStyle = "#D69A68";
    ctx.fill();
    stroke(ctx, 3, DARK_INK);
  } else if (p.consoling) {
    // Gentle consoling arm around daughter
    drawShadedLimb(ctx, 50, -250, 85, -230, 17, "#F8F5EE", "#D6D0C2", "#FFFFFF");
    drawShadedLimb(ctx, 85, -230, 118, -235, 15, "#F8F5EE", "#D6D0C2", "#FFFFFF");
    ellipse(ctx, 118, -235, 14, 14);
    ctx.fillStyle = "#D69A68";
    ctx.fill();
    stroke(ctx, 2.5, DARK_INK);

    drawShadedLimb(ctx, -50, -250, -75, -190, 17, "#F8F5EE", "#D6D0C2", "#FFFFFF");
    drawShadedLimb(ctx, -75, -190, -58, -145, 15, "#F8F5EE", "#D6D0C2", "#FFFFFF");
  }

  ctx.restore();
}

/** 3. ADVANCED WEEPING DAUGHTER RIG */
export function drawAdvancedDaughter(ctx, x, y, scale = 1, t = 0) {
  const sobbing = Math.sin(t * 14) * 3.5;
  ctx.save();
  ctx.translate(x, y + sobbing);
  ctx.scale(scale, scale);

  // Contact shadow
  const shadowG = ctx.createRadialGradient(0, 0, 10, 0, 0, 90);
  shadowG.addColorStop(0, "rgba(10, 5, 15, 0.55)");
  shadowG.addColorStop(1, "rgba(10, 5, 15, 0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath();
  ctx.ellipse(0, 5, 90, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rajasthani Flared Ghagra Skirt (Orange & Gold Bandhani)
  const ghagraG = ctx.createLinearGradient(-75, -160, 75, -160);
  ghagraG.addColorStop(0, "#D04424");
  ghagraG.addColorStop(0.5, "#E86230");
  ghagraG.addColorStop(1, "#BA3418");

  poly(ctx, [[-42, -160], [42, -160], [80, -10], [-80, -10]]);
  ctx.fillStyle = ghagraG;
  ctx.fill();
  stroke(ctx, 4, DARK_INK);

  // Bandhani White & Gold Polka-Dot Pattern
  for (let row = -140; row < -15; row += 24) {
    const span = lerp(45, 75, (row + 160) / 150);
    for (let col = -span + 12; col < span; col += 24) {
      ellipse(ctx, col, row, 2.5, 2.5);
      ctx.fillStyle = GOLD_LIGHT;
      ctx.fill();
    }
  }

  // Broad Golden Embroidered Border with Jewel Insets
  poly(ctx, [[-78, -15], [78, -15], [76, -2], [-76, -2]]);
  ctx.fillStyle = GOLD_MID;
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  // Choli Blouse (Deep Crimson)
  poly(ctx, [[-38, -235], [38, -235], [34, -160], [-34, -160]]);
  ctx.fillStyle = "#A81E2E";
  ctx.fill();
  stroke(ctx, 4, DARK_INK);

  // Delicate Slender Neck
  poly(ctx, [[-16, -255], [16, -255], [14, -232], [-14, -232]]);
  ctx.fillStyle = "#F8D4AE";
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  // Gold Necklace (Haar)
  ctx.strokeStyle = GOLD_MID;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -235, 14, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Head & Sorrowful Face
  const hy = -282;
  ctx.beginPath();
  ctx.moveTo(-32, hy - 15);
  ctx.quadraticCurveTo(-34, hy + 15, -18, hy + 35);
  ctx.quadraticCurveTo(0, hy + 45, 18, hy + 35);
  ctx.quadraticCurveTo(34, hy + 15, 32, hy - 15);
  ctx.closePath();
  ctx.fillStyle = "#F8D4AE";
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  // Red Bandhani Odhna (Veil) Draped over Head and Shoulders
  ctx.beginPath();
  ctx.moveTo(-48, hy + 40);
  ctx.quadraticCurveTo(-58, hy - 45, 0, hy - 62);
  ctx.quadraticCurveTo(58, hy - 45, 48, hy + 40);
  ctx.lineTo(40, hy + 120);
  ctx.lineTo(-40, hy + 120);
  ctx.closePath();
  ctx.fillStyle = RAJASTHANI_RED;
  ctx.fill();
  stroke(ctx, 4, DARK_INK);

  // Gold Zari Border on Odhna
  ctx.strokeStyle = GOLD_MID;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-45, hy + 40);
  ctx.quadraticCurveTo(0, hy - 55, 45, hy + 40);
  ctx.stroke();

  // Maang Tikka (Forehead Pendant)
  line(ctx, [[0, hy - 42], [0, hy - 24]], 2, GOLD_MID);
  ellipse(ctx, 0, hy - 22, 4, 4);
  ctx.fillStyle = RUBY;
  ctx.fill();
  stroke(ctx, 1.5, DARK_INK);

  // Weeping Face: Sorrowful Closed Eyelids & Animated Tears
  for (const side of [-1, 1]) {
    const ex = side * 14;
    const ey = hy - 4;

    // Curved weeping lash line
    ctx.beginPath();
    ctx.arc(ex, ey, 9, 0.15 * Math.PI, 0.85 * Math.PI, true);
    stroke(ctx, 3, DARK_INK);

    // Eyelashes
    line(ctx, [[ex - 6, ey - 3], [ex - 9, ey - 6]], 1.5, DARK_INK);
    line(ctx, [[ex + 6, ey - 3], [ex + 9, ey - 6]], 1.5, DARK_INK);

    // Streaming Tears with blue glint
    const tearY = ey + 6 + ((t * 2.5 + (side > 0 ? 0.35 : 0)) % 1) * 28;
    ellipse(ctx, ex, tearY, 3.5, 6);
    ctx.fillStyle = "#70C8FF";
    ctx.fill();
    ellipse(ctx, ex - 1, tearY - 1, 1.5, 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  }

  // Quivering sorrowful lips
  ctx.beginPath();
  ctx.arc(0, hy + 22, 8, 0.25 * Math.PI, 0.75 * Math.PI, true);
  stroke(ctx, 3, "#8C222E");

  // Delicate Arms Raised to Chest in Heartbreak
  drawShadedLimb(ctx, -34, -225, -22, -180, 13, "#A81E2E", "#6E101C", "#D03248");
  drawShadedLimb(ctx, -22, -180, -10, -215, 11, "#F8D4AE", "#D4A87C", "#FFF0DC");
  ellipse(ctx, -10, -215, 10, 10);
  ctx.fillStyle = "#F8D4AE";
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);

  drawShadedLimb(ctx, 34, -225, 22, -180, 13, "#A81E2E", "#6E101C", "#D03248");
  drawShadedLimb(ctx, 22, -180, 10, -215, 11, "#F8D4AE", "#D4A87C", "#FFF0DC");
  ellipse(ctx, 10, -215, 10, 10);
  ctx.fillStyle = "#F8D4AE";
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);

  // Gold Bangles on Wrists
  for (const bx of [-12, 12]) {
    ellipse(ctx, bx, -202, 6, 3);
    ctx.fillStyle = GOLD_MID;
    ctx.fill();
  }

  ctx.restore();
}

/** 4. ADVANCED DESERT CAMEL RIG */
export function drawAdvancedCamel(ctx, x, y, scale = 1, walkPhase = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const bob = Math.sin(walkPhase * 2) * 6;
  const leg1 = Math.sin(walkPhase) * 24;
  const leg2 = -Math.sin(walkPhase) * 24;

  // Contact shadow on sand
  const shadowG = ctx.createRadialGradient(0, 8, 10, 0, 8, 125);
  shadowG.addColorStop(0, "rgba(20, 10, 10, 0.45)");
  shadowG.addColorStop(1, "rgba(20, 10, 10, 0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath();
  ctx.ellipse(0, 8, 125, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4 Jointed Legs with Kneepads and Double-Toed Hooves
  const legPairs = [
    { hipX: -65, ang: leg1, color: "#BF8C50" }, // Back left
    { hipX: -45, ang: -leg1, color: "#D49E5E" }, // Back right
    { hipX: 52, ang: leg2, color: "#BF8C50" }, // Front left
    { hipX: 72, ang: -leg2, color: "#D49E5E" } // Front right
  ];

  for (const l of legPairs) {
    const kx = l.hipX + Math.sin(rad(l.ang)) * 48;
    const ky = 48;
    const fx = kx + Math.sin(rad(l.ang * 0.7)) * 48;
    const fy = 96;

    // Thigh to Knee
    drawShadedLimb(ctx, l.hipX, 0, kx, ky, 12, l.color, "#9E6E38", "#ECC288");
    // Shin to Hoof
    drawShadedLimb(ctx, kx, ky, fx, fy, 9, l.color, "#9E6E38", "#ECC288");

    // Double-Toed Hoof
    ellipse(ctx, fx + 2, fy, 11, 6);
    ctx.fillStyle = DARK_INK;
    ctx.fill();
  }

  // Camel Muscular Torso & Hump
  ctx.save();
  ctx.translate(0, bob);

  const camelG = ctx.createLinearGradient(-90, -70, 90, 40);
  camelG.addColorStop(0, "#DCA86A");
  camelG.addColorStop(0.5, "#E8B878");
  camelG.addColorStop(1, "#C28C48");

  ctx.fillStyle = camelG;
  ctx.strokeStyle = DARK_INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-92, 0);
  ctx.quadraticCurveTo(-60, -32, -25, -12);
  // Muscular Hump
  ctx.quadraticCurveTo(0, -78, 25, -12);
  ctx.quadraticCurveTo(68, -32, 92, 0);
  ctx.quadraticCurveTo(80, 42, 0, 42);
  ctx.quadraticCurveTo(-80, 42, -92, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Long Graceful Curved S-Neck & Head
  ctx.beginPath();
  ctx.moveTo(78, 12);
  ctx.quadraticCurveTo(118, 18, 134, -50);
  ctx.quadraticCurveTo(140, -84, 156, -92);
  // Head & Muzzle
  ctx.quadraticCurveTo(178, -98, 184, -86);
  ctx.quadraticCurveTo(168, -68, 146, -62);
  ctx.quadraticCurveTo(122, -18, 88, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Camel Eye, Nostril, and Halter
  ellipse(ctx, 162, -88, 4.5, 4.5);
  ctx.fillStyle = DARK_INK;
  ctx.fill();
  ellipse(ctx, 161, -89, 1.5, 1.5);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();

  // Small Ear
  poly(ctx, [[144, -94], [148, -108], [154, -94]]);
  ctx.fillStyle = "#C28C48";
  ctx.fill();
  stroke(ctx, 2.5, DARK_INK);

  // Red Harness & Reins
  line(ctx, [[178, -84], [152, -78], [112, 10]], 3, RAJASTHANI_RED);

  // Traditional Rajasthani Embroidered Ralli Saddle & Cargo
  poly(ctx, [[-40, -18], [40, -18], [46, 25], [-46, 25]]);
  ctx.fillStyle = RAJASTHANI_RED;
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  // Saddle geometric border
  line(ctx, [[-44, 22], [44, 22]], 4, GOLD_MID);

  // Cargo bundles & water pots (Matkas)
  ellipse(ctx, -18, -25, 26, 20);
  ctx.fillStyle = GOLD_MID;
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  ellipse(ctx, 20, -25, 26, 20);
  ctx.fillStyle = "#A85A34";
  ctx.fill();
  stroke(ctx, 3, DARK_INK);

  ctx.restore();
  ctx.restore();
}

/** Realistic Multi-Stage Flame Torch */
export function drawAdvancedTorchRealistic(ctx, x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Wood shaft with bindings
  poly(ctx, [[-7, 0], [7, 0], [5, 110], [-5, 110]]);
  ctx.fillStyle = "#482A16";
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  for (let b = 15; b < 100; b += 18) {
    line(ctx, [[-6, b], [6, b + 5]], 3, "#8C6A48");
  }

  // Wrought Iron Basket
  poly(ctx, [[-15, -20], [15, -20], [10, 8], [-10, 8]]);
  ctx.fillStyle = "#221C18";
  ctx.fill();
  stroke(ctx, 3.5, DARK_INK);

  // Multi-tongue turbulent fire simulation
  const f1 = Math.sin(t * 16) * 8;
  const f2 = Math.cos(t * 22) * 10;
  const f3 = Math.sin(t * 28) * 6;

  // Outer Deep Crimson Flame
  ctx.fillStyle = "#E82C10";
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.quadraticCurveTo(-26 + f1, -60, -5 + f2, -105);
  ctx.quadraticCurveTo(10 + f3, -65, 18, -14);
  ctx.closePath();
  ctx.fill();

  // Mid Vibrant Amber Flame
  ctx.fillStyle = "#FF7A18";
  ctx.beginPath();
  ctx.moveTo(-13, -14);
  ctx.quadraticCurveTo(-16 + f2, -50, 8 + f1, -90);
  ctx.quadraticCurveTo(16 + f1, -45, 11, -14);
  ctx.closePath();
  ctx.fill();

  // Inner Bright Yellow Core
  ctx.fillStyle = "#FFCA28";
  ctx.beginPath();
  ctx.moveTo(-9, -14);
  ctx.quadraticCurveTo(-7 + f3, -40, 0 + f1, -65);
  ctx.quadraticCurveTo(8 + f2, -40, 9, -14);
  ctx.closePath();
  ctx.fill();

  // White-hot Center
  ctx.fillStyle = "#FFFBE8";
  ctx.beginPath();
  ctx.moveTo(-5, -14);
  ctx.quadraticCurveTo(0, -32, 0, -44);
  ctx.quadraticCurveTo(4, -32, 5, -14);
  ctx.closePath();
  ctx.fill();

  // Flying turbulent ember sparks
  for (let i = 0; i < 7; i++) {
    const sp = ((t * 4.5 + i * 0.16) % 1);
    const sx = Math.sin(t * 14 + i * 2.2) * (20 + i * 8);
    const sy = -105 - sp * 80 - i * 10;
    ctx.fillStyle = i % 2 === 0 ? "#FFCA28" : "#E82C10";
    ellipse(ctx, sx, sy, 3.2 * (1 - sp), 3.2 * (1 - sp));
    ctx.fill();
  }

  ctx.restore();
}
