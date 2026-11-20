// kuldhara_scenes.mjs - 100% Vector 2D Scene Backgrounds for Kuldhara
// Clean, atmospheric 2D vector illustrations drawn directly in canvas without any AI images.
import { GlobalFonts } from "@napi-rs/canvas";
import { clamp, lerp, rad, ellipse, stroke, fill, line, poly, smooth, rrect, INK } from "./anim/core.mjs";
import { drawSalimSingh, drawVillageChief, drawDaughter, drawVillager, drawTorch, drawLantern } from "./kuldhara_rigs.mjs";

try {
  GlobalFonts.registerFromPath("./assets/NotoSansDevanagari-Bold.ttf", "Noto Sans Devanagari");
} catch (e) {}

const DARK_INK = "#1A1423";

/** Helper: Draw carved Rajasthani Jharokha (stone balcony) */
export function drawJharokha(ctx, x, y, w = 80, h = 110) {
  ctx.save();
  ctx.translate(x, y);

  // Outer stone frame
  poly(ctx, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]);
  fill(ctx, "#E0A858");
  stroke(ctx, 3, DARK_INK);

  // Cusped Arch opening (dark interior)
  ctx.beginPath();
  ctx.moveTo(-w * 0.35, h * 0.4);
  ctx.lineTo(-w * 0.35, -h * 0.1);
  ctx.quadraticCurveTo(-w * 0.35, -h * 0.45, 0, -h * 0.45);
  ctx.quadraticCurveTo(w * 0.35, -h * 0.45, w * 0.35, -h * 0.1);
  ctx.lineTo(w * 0.35, h * 0.4);
  ctx.closePath();
  fill(ctx, "#261A12");
  stroke(ctx, 2.5, DARK_INK);

  // Balcony railing
  poly(ctx, [[-w * 0.45, h * 0.2], [w * 0.45, h * 0.2], [w * 0.4, h * 0.55], [-w * 0.4, h * 0.55]]);
  fill(ctx, "#CCA048");
  stroke(ctx, 2.8, DARK_INK);

  // Bracket supports
  for (const bx of [-w * 0.3, 0, w * 0.3]) {
    poly(ctx, [[bx - 5, h * 0.55], [bx + 5, h * 0.55], [bx, h * 0.72]]);
    fill(ctx, "#A88035");
    stroke(ctx, 2, DARK_INK);
  }

  ctx.restore();
}

/** Helper: Draw Rajasthani Chhatri (domed pavilion) */
export function drawChhatri(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 4 Stone Pillars
  for (const px of [-35, -12, 12, 35]) {
    poly(ctx, [[px - 4, 0], [px + 4, 0], [px + 3, 50], [-px - 3, 50]]);
    fill(ctx, "#DCA050");
    stroke(ctx, 2, DARK_INK);
  }

  // Curved Dome Roof
  ctx.beginPath();
  ctx.moveTo(-45, 0);
  ctx.quadraticCurveTo(-25, -35, 0, -42);
  ctx.quadraticCurveTo(25, -35, 45, 0);
  ctx.closePath();
  fill(ctx, "#E8B265");
  stroke(ctx, 3, DARK_INK);

  // Kalash Finial on top
  ellipse(ctx, 0, -48, 5, 7);
  fill(ctx, "#E5B842");
  stroke(ctx, 2, DARK_INK);
  line(ctx, [[0, -55], [0, -62]], 2.5, DARK_INK);

  ctx.restore();
}

/** Scene 1: Ruined Midnight Havelis & Crescent Moon Hook */
export function drawSceneNightRuins(ctx, W, H, t) {
  // Deep night gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#080C18");
  g.addColorStop(0.65, "#151B2E");
  g.addColorStop(1, "#261D2B");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 45; i++) {
    const sx = ((i * 137.5) % W);
    const sy = ((i * 89.3) % (H * 0.65));
    const twinkle = 0.5 + 0.5 * Math.sin(t * 4 + i);
    ellipse(ctx, sx, sy, 1.8 * twinkle, 1.8 * twinkle);
    fill(ctx, "#EDEBFF");
  }

  // Giant Glowing Crescent Moon
  const mx = W * 0.82, my = H * 0.22, mr = 68;
  const mGlow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.8);
  mGlow.addColorStop(0, "rgba(255, 240, 200, 0.22)");
  mGlow.addColorStop(1, "rgba(255, 240, 200, 0)");
  ctx.fillStyle = mGlow;
  ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);

  ellipse(ctx, mx, my, mr, mr);
  fill(ctx, "#FFF2D2");
  // Moon shadow cutout for crescent
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.clip();
  ellipse(ctx, mx + mr * 0.45, my - mr * 0.2, mr * 0.88, mr * 0.88);
  fill(ctx, "#0C1222");
  ctx.restore();

  // Distant Sand Dunes
  poly(ctx, [[0, H * 0.68], [W * 0.35, H * 0.62], [W * 0.7, H * 0.66], [W, H * 0.58], [W, H], [0, H]]);
  fill(ctx, "#181D2C");

  // Midground Ruined Havelis Silhouettes
  poly(ctx, [
    [W * 0.08, H * 0.72], [W * 0.08, H * 0.42], [W * 0.22, H * 0.42], [W * 0.22, H * 0.72]
  ]);
  fill(ctx, "#222538");
  stroke(ctx, 3, DARK_INK);
  drawJharokha(ctx, W * 0.15, H * 0.52, 55, 75);

  poly(ctx, [
    [W * 0.62, H * 0.75], [W * 0.62, H * 0.38], [W * 0.82, H * 0.38], [W * 0.82, H * 0.75]
  ]);
  fill(ctx, "#1D2132");
  stroke(ctx, 3, DARK_INK);
  drawJharokha(ctx, W * 0.72, H * 0.48, 65, 85);
  drawChhatri(ctx, W * 0.72, H * 0.38, 0.9);

  // Foreground Stone Archway
  const archW = W * 0.44;
  const archH = H * 0.75;
  const ax = W * 0.5, ay = H * 0.65;

  ctx.save();
  ctx.translate(ax, ay);
  // Left pillar
  poly(ctx, [[-archW * 0.5, -archH * 0.5], [-archW * 0.32, -archH * 0.5], [-archW * 0.32, archH * 0.5], [-archW * 0.5, archH * 0.5]]);
  fill(ctx, "#2B283A");
  stroke(ctx, 4, DARK_INK);

  // Right pillar
  poly(ctx, [[archW * 0.32, -archH * 0.5], [archW * 0.5, -archH * 0.5], [archW * 0.5, archH * 0.5], [archW * 0.32, archH * 0.5]]);
  fill(ctx, "#2B283A");
  stroke(ctx, 4, DARK_INK);

  // Arch span
  ctx.beginPath();
  ctx.moveTo(-archW * 0.5, -archH * 0.5);
  ctx.lineTo(archW * 0.5, -archH * 0.5);
  ctx.lineTo(archW * 0.32, -archH * 0.32);
  ctx.quadraticCurveTo(0, -archH * 0.48, -archW * 0.32, -archH * 0.32);
  ctx.closePath();
  fill(ctx, "#343048");
  stroke(ctx, 4, DARK_INK);
  ctx.restore();

  // Foreground Sand Dune
  poly(ctx, [[0, H * 0.82], [W * 0.45, H * 0.78], [W, H * 0.85], [W, H], [0, H]]);
  fill(ctx, "#111420");
}

/** Scene 2: 1825 Prosperous Paliwal Trade Kingdom */
export function drawSceneProsperous1825(ctx, W, H, t) {
  // Saturated Rajasthani Day Sky
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#3E82D6");
  g.addColorStop(0.6, "#A4CEF4");
  g.addColorStop(1, "#F4D8A8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Blazing Desert Sun
  ellipse(ctx, W * 0.8, H * 0.2, 50, 50);
  fill(ctx, "#FFF4D0");

  // Golden Sandstone Havelis Street
  const haveliColors = ["#E8B265", "#DCA050", "#E4AA5A"];

  // Background havelis
  for (let i = 0; i < 4; i++) {
    const hx = i * (W * 0.28);
    const hy = H * 0.32;
    const hw = W * 0.28;
    const hh = H * 0.45;

    poly(ctx, [[hx, hy], [hx + hw, hy], [hx + hw, H * 0.75], [hx, H * 0.75]]);
    fill(ctx, haveliColors[i % haveliColors.length]);
    stroke(ctx, 3.5, DARK_INK);

    drawJharokha(ctx, hx + hw * 0.5, hy + hh * 0.4, 70, 95);
    drawChhatri(ctx, hx + hw * 0.5, hy, 1.1);
  }

  // Market Awnings (Striped Red & White)
  for (let j = 0; j < 3; j++) {
    const ax = W * 0.12 + j * (W * 0.32);
    poly(ctx, [[ax - 60, H * 0.62], [ax + 60, H * 0.62], [ax + 75, H * 0.7], [ax - 75, H * 0.7]]);
    fill(ctx, j % 2 === 0 ? "#D83428" : "#E5B842");
    stroke(ctx, 2.8, DARK_INK);
  }

  // Golden Street Floor
  poly(ctx, [[0, H * 0.75], [W, H * 0.75], [W, H], [0, H]]);
  fill(ctx, "#E0BE78");

  // 2D Animated Paliwal Villagers Walking in Market
  const v1X = (W * 0.25 + (t * 40) % (W * 0.8));
  drawVillager(ctx, v1X, H * 0.88, 1.25, { t, walkPhase: t * 7, shirtColor: "#FFFFFF", turbanColor: "#E86A38", bundle: true });

  const v2X = (W * 0.75 - (t * 35) % (W * 0.8));
  drawVillager(ctx, v2X, H * 0.9, 1.3, { t, flip: true, walkPhase: t * 6.5, shirtColor: "#E8B265", turbanColor: "#2A7855" });
}

/** Scene 3: Diwan Salim Singh with Dagger */
export function drawSceneSalimSingh(ctx, W, H, t) {
  // Rich Royal Jaisalmer Palace Interior (Crimson & Gold)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#280A12");
  g.addColorStop(1, "#140408");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Ornate Palace Stone Pillars
  for (const px of [W * 0.12, W * 0.88]) {
    poly(ctx, [[px - 50, 0], [px + 50, 0], [px + 45, H], [px - 45, H]]);
    fill(ctx, "#4A2218");
    stroke(ctx, 4, DARK_INK);
    drawJharokha(ctx, px, H * 0.35, 75, 100);
  }

  // Palace Torches on Pillars
  drawTorch(ctx, W * 0.18, H * 0.42, 1.1, t);
  drawTorch(ctx, W * 0.82, H * 0.42, 1.1, t + 0.5);

  // Salim Singh Front & Center
  const daggerProgress = Math.min(1, Math.max(0, (t - 0.5) * 1.5));
  drawSalimSingh(ctx, W * 0.5, H * 0.88, 1.85, {
    t,
    talking: true,
    daggerRaise: daggerProgress,
    lookX: Math.sin(t * 2) * 3
  });
}

/** Scene 4: Chief Consoling Weeping Daughter (The Ultimatum) */
export function drawSceneChiefAndDaughter(ctx, W, H, t) {
  // Quiet Haveli Interior at Dusk
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1F1A2C");
  g.addColorStop(1, "#120E1A");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stone Arched Window showing Thar Desert Sunset
  const wx = W * 0.5, wy = H * 0.32;
  ctx.save();
  ctx.beginPath();
  ctx.arc(wx, wy, 160, Math.PI, 0);
  ctx.lineTo(wx + 160, wy + 200);
  ctx.lineTo(wx - 160, wy + 200);
  ctx.closePath();
  ctx.clip();

  // Sunset outside window
  const sunG = ctx.createLinearGradient(0, wy - 160, 0, wy + 200);
  sunG.addColorStop(0, "#7E2A4A");
  sunG.addColorStop(0.6, "#E86A38");
  sunG.addColorStop(1, "#F8B852");
  ctx.fillStyle = sunG;
  ctx.fillRect(wx - 180, wy - 180, 360, 400);
  // Desert dunes outside
  poly(ctx, [[wx - 180, wy + 120], [wx, wy + 90], [wx + 180, wy + 130], [wx + 180, wy + 250], [wx - 180, wy + 250]]);
  fill(ctx, "#B85828");
  ctx.restore();

  // Window frame stroke
  ctx.beginPath();
  ctx.arc(wx, wy, 160, Math.PI, 0);
  ctx.lineTo(wx + 160, wy + 200);
  ctx.lineTo(wx - 160, wy + 200);
  ctx.closePath();
  stroke(ctx, 8, "#3E3228");

  // Cast characters: Chief (left) consoling Daughter (right)
  drawVillageChief(ctx, W * 0.38, H * 0.9, 1.65, { t, consoling: true });
  drawDaughter(ctx, W * 0.58, H * 0.9, 1.45, { t });
}

/** Scene 5: Clandestine Temple Council of 84 Chiefs */
export function drawSceneTempleCouncil(ctx, W, H, t) {
  // Midnight Temple Stone Interior
  ctx.fillStyle = "#0C0E18";
  ctx.fillRect(0, 0, W, H);

  // Carved Pillars
  for (const px of [W * 0.15, W * 0.32, W * 0.68, W * 0.85]) {
    poly(ctx, [[px - 35, 0], [px + 35, 0], [px + 30, H * 0.85], [px - 30, H * 0.85]]);
    fill(ctx, "#1C2032");
    stroke(ctx, 3, DARK_INK);
  }

  // Central Sacred Havan Kunda (Fire Altar)
  const fx = W * 0.5, fy = H * 0.78;
  poly(ctx, [[fx - 110, fy + 25], [fx + 110, fy + 25], [fx + 85, fy + 70], [fx - 85, fy + 70]]);
  fill(ctx, "#8C4A28");
  stroke(ctx, 4, DARK_INK);

  // Sacred Fire in Altar
  drawTorch(ctx, fx - 30, fy + 20, 1.5, t);
  drawTorch(ctx, fx, fy + 15, 1.8, t + 0.3);
  drawTorch(ctx, fx + 30, fy + 20, 1.5, t + 0.7);

  // Assembly of Village Chiefs in a Circle
  const chiefConfigs = [
    { x: W * 0.18, s: 1.15, tColor: "#E86A38", wrath: true },
    { x: W * 0.32, s: 1.35, tColor: "#FFFFFF", wrath: true },
    { x: W * 0.68, s: 1.35, tColor: "#E5B842", wrath: true, flip: true },
    { x: W * 0.82, s: 1.15, tColor: "#2A7855", wrath: true, flip: true },
  ];

  for (const c of chiefConfigs) {
    drawVillageChief(ctx, c.x, H * 0.88, c.s, {
      t,
      flip: c.flip || false,
      talking: true,
      wrath: true
    });
  }
}

/** Scene 6: Silent Mass Exodus into Thar Dunes */
export function drawSceneNightExodus(ctx, W, H, t) {
  // Midnight desert sky with huge moon
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#080B14");
  g.addColorStop(0.7, "#141B2C");
  g.addColorStop(1, "#261C2C");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 141) % W);
    const sy = ((i * 97) % (H * 0.6));
    ellipse(ctx, sx, sy, 1.5, 1.5);
    fill(ctx, "#EDEBFF");
  }

  // Moon
  ellipse(ctx, W * 0.22, H * 0.22, 60, 60);
  fill(ctx, "#FFF4D2");

  // Multiplane Desert Dunes
  poly(ctx, [[0, H * 0.62], [W * 0.45, H * 0.58], [W, H * 0.64], [W, H], [0, H]]);
  fill(ctx, "#181E30");

  poly(ctx, [[0, H * 0.72], [W * 0.55, H * 0.76], [W, H * 0.7], [W, H], [0, H]]);
  fill(ctx, "#222940");

  // Caravan of 1500 Villagers marching in line from right to left
  for (let k = 0; k < 7; k++) {
    const vx = ((W * 0.95 - (k * 130) - (t * 55)) % (W * 1.2)) - 100;
    const vy = H * 0.85 + Math.sin(vx * 0.005) * 15;
    drawVillager(ctx, vx, vy, 1.15, {
      t,
      flip: true,
      walkPhase: t * 6 + k * 1.2,
      shirtColor: k % 2 === 0 ? "#F0ECE1" : "#D4B888",
      turbanColor: ["#D83428", "#E86A38", "#FFFFFF", "#2A7855"][k % 4],
      lantern: k % 2 === 1,
      bundle: k % 2 === 0
    });
  }
}

/** Scene 7: Village Elder Flaming Torch Curse */
export function drawSceneElderCurse(ctx, W, H, t) {
  // Dramatic Stormy / Cursed Night Sky
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1A0610");
  g.addColorStop(0.6, "#2E101E");
  g.addColorStop(1, "#3E1E12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Flying fiery sparks in the gale
  for (let i = 0; i < 28; i++) {
    const sx = (t * 300 + i * 73) % W;
    const sy = (H * 0.8 - ((t * 220 + i * 47) % (H * 0.75)));
    ellipse(ctx, sx, sy, 3.5, 2);
    fill(ctx, "#FFB82E");
  }

  // Stone Rampart / Gate Wall
  poly(ctx, [[0, H * 0.72], [W, H * 0.72], [W, H], [0, H]]);
  fill(ctx, "#261A18");
  stroke(ctx, 4, DARK_INK);

  // Parapet battlements
  for (let b = 0; b < W; b += 120) {
    poly(ctx, [[b, H * 0.65], [b + 70, H * 0.65], [b + 70, H * 0.72], [b, H * 0.72]]);
    fill(ctx, "#362422");
    stroke(ctx, 3, DARK_INK);
  }

  // The Elder Chief standing on rampart raising the flaming torch high!
  drawVillageChief(ctx, W * 0.5, H * 0.88, 1.85, {
    t,
    raisingTorch: true,
    shouting: true,
    wrath: true
  });
}

/** Scene 8: Abandoned Morning Kitchen */
export function drawSceneAbandonedKitchen(ctx, W, H, t) {
  // Morning light filling empty haveli
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#E8D0A8");
  g.addColorStop(1, "#C29A68");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Open doorway to Thar Desert
  poly(ctx, [[W * 0.15, H * 0.2], [W * 0.42, H * 0.2], [W * 0.42, H * 0.82], [W * 0.15, H * 0.82]]);
  fill(ctx, "#F4BE72");
  stroke(ctx, 4, DARK_INK);

  // Stone Floor
  poly(ctx, [[0, H * 0.82], [W, H * 0.82], [W, H], [0, H]]);
  fill(ctx, "#B28854");

  // Earthen Chulha (Clay Hearth)
  const cx = W * 0.68, cy = H * 0.82;
  poly(ctx, [[cx - 80, cy - 35], [cx + 80, cy - 35], [cx + 90, cy + 15], [cx - 90, cy + 15]]);
  fill(ctx, "#8C4A28");
  stroke(ctx, 3.5, DARK_INK);

  // Smoldering Embers inside chulha
  ellipse(ctx, cx, cy - 10, 45, 14);
  fill(ctx, "#E04818");

  // Thin wisps of smoke rising
  for (let s = 0; s < 3; s++) {
    const smokeY = cy - 40 - ((t * 40 + s * 30) % 180);
    const smokeX = cx + Math.sin(t * 3 + s) * 22;
    ellipse(ctx, smokeX, smokeY, 12 + s * 5, 8 + s * 4);
    fill(ctx, "rgba(220, 210, 200, 0.45)");
  }

  // Untouched Brass Thali with Food / Roti
  ellipse(ctx, W * 0.48, H * 0.86, 45, 16);
  fill(ctx, "#E5B842");
  stroke(ctx, 2.5, DARK_INK);
  // Roti flatbreads
  ellipse(ctx, W * 0.48, H * 0.85, 28, 10);
  fill(ctx, "#EAD2A8");
  stroke(ctx, 2, DARK_INK);
}

/** Scene 9: Desert Dunes Footprint Paradox */
export function drawSceneFootprintParadox(ctx, W, H, t) {
  // Sunrise Thar Desert Sky
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#3A68A8");
  g.addColorStop(0.5, "#E88A58");
  g.addColorStop(1, "#F8CA78");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Vast pristine sand dunes
  poly(ctx, [[0, H * 0.55], [W * 0.45, H * 0.48], [W, H * 0.58], [W, H], [0, H]]);
  fill(ctx, "#E89A48");

  poly(ctx, [[0, H * 0.7], [W * 0.6, H * 0.65], [W, H * 0.74], [W, H], [0, H]]);
  fill(ctx, "#F2AC54");

  // Wind ripples on pristine sand
  for (let r = 0; r < 12; r++) {
    const ry = H * 0.72 + r * 22;
    line(ctx, [[W * 0.1, ry], [W * 0.4, ry + 6], [W * 0.8, ry - 4]], 2, "#D48232");
  }

  // Investigative Scanning HUD: "0 FOOTPRINTS DETECTED"
  const scanX = W * 0.5 + Math.sin(t * 2) * (W * 0.18);
  const scanY = H * 0.78;

  // Reticle circle
  ctx.save();
  ctx.strokeStyle = "#00E5FF";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(scanX, scanY, 70, 0, Math.PI * 2);
  ctx.stroke();

  line(ctx, [[scanX - 85, scanY], [scanX + 85, scanY]], 2, "#00E5FF");
  line(ctx, [[scanX, scanY - 85], [scanX, scanY + 85]], 2, "#00E5FF");

  // HUD Text
  ctx.fillStyle = "#00E5FF";
  ctx.font = "bold 24px monospace";
  ctx.fillText("[0 FOOTPRINTS / PRISTINE DUNES]", scanX - 180, scanY - 95);
  ctx.restore();
}

/** Scene 10: Official ASI Warning Board at Ruins Gate */
export function drawSceneASIGate(ctx, W, H, t) {
  // Dusk Ruins Background
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1A1828");
  g.addColorStop(0.7, "#2E2432");
  g.addColorStop(1, "#3E302A");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Desert gate stone pillars
  for (const px of [W * 0.18, W * 0.82]) {
    poly(ctx, [[px - 50, H * 0.25], [px + 50, H * 0.25], [px + 45, H], [px - 45, H]]);
    fill(ctx, "#3E3228");
    stroke(ctx, 4, DARK_INK);
  }

  // Rusted Iron Gate with Chains
  for (let b = 0; b < 10; b++) {
    const by = H * 0.45 + b * 45;
    line(ctx, [[W * 0.2, by], [W * 0.8, by]], 5, "#221A16");
  }
  for (let gx = W * 0.25; gx < W * 0.78; gx += 55) {
    line(ctx, [[gx, H * 0.42], [gx, H * 0.92]], 6, "#221A16");
  }

  // Official ASI Blue Warning Signboard
  const bx = W * 0.5, by = H * 0.55;
  const bw = 640, bh = 280;

  // Board background
  poly(ctx, [[bx - bw / 2, by - bh / 2], [bx + bw / 2, by - bh / 2], [bx + bw / 2, by + bh / 2], [bx - bw / 2, by + bh / 2]]);
  fill(ctx, "#103E78");
  stroke(ctx, 5, "#FFFFFF");

  // Header banner
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px 'Noto Sans Devanagari', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("भारतीय पुरातत्व सर्वेक्षण (ASI)", bx, by - bh * 0.28);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("ARCHAEOLOGICAL SURVEY OF INDIA", bx, by - bh * 0.14);

  line(ctx, [[bx - bw * 0.42, by - bh * 0.05], [bx + bw * 0.42, by - bh * 0.05]], 3, "#FFD230");

  // Warning text in Hindi & English
  ctx.fillStyle = "#FFD230";
  ctx.font = "bold 28px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("चेतावनी: सूर्यास्त के बाद प्रवेश सख्त मना है", bx, by + bh * 0.12);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("ENTRY STRICTLY PROHIBITED AFTER SUNSET", bx, by + bh * 0.28);

  ctx.textAlign = "left";
}

/** Scene 11: Night FLIR Thermal Camera & Ghostly Phantom */
export function drawSceneThermalAnomaly(ctx, W, H, t) {
  // FLIR Thermal Palette background (deep blue / indigo)
  ctx.fillStyle = "#0A1028";
  ctx.fillRect(0, 0, W, H);

  // Thermal stone archway (cyan/green heat contour)
  const ax = W * 0.5, ay = H * 0.6;
  ctx.save();
  ctx.translate(ax, ay);
  poly(ctx, [[-260, -280], [-180, -280], [-180, 200], [-260, 200]]);
  fill(ctx, "#185848");
  stroke(ctx, 3, "#28E0A0");

  poly(ctx, [[180, -280], [260, -280], [260, 200], [180, 200]]);
  fill(ctx, "#185848");
  stroke(ctx, 3, "#28E0A0");

  // Arch span
  poly(ctx, [[-260, -280], [260, -280], [180, -180], [-180, -180]]);
  fill(ctx, "#227058");
  stroke(ctx, 3, "#28E0A0");
  ctx.restore();

  // Translucent 2D Ghostly Silhouette (+37.4°C Humanoid Heat Anomaly)
  const px = W * 0.5 + Math.sin(t * 2) * 10;
  const py = H * 0.55;

  ctx.save();
  ctx.translate(px, py);
  const glow = 0.75 + 0.25 * Math.sin(t * 8);
  ctx.globalAlpha = glow;

  // Thermal heat body (Red/Orange hot core)
  ellipse(ctx, 0, -85, 30, 36);
  fill(ctx, "#FF3220");

  // Drifting robes
  ctx.beginPath();
  ctx.moveTo(-35, -55);
  ctx.quadraticCurveTo(-50 + Math.sin(t * 6) * 12, 40, -40, 110);
  ctx.lineTo(40, 110);
  ctx.quadraticCurveTo(50 + Math.cos(t * 6) * 12, 40, 35, -55);
  ctx.closePath();
  fill(ctx, "#FFA020");

  // Piercing glowing thermal eyes
  ellipse(ctx, -10, -88, 5, 5);
  fill(ctx, "#FFFFFF");
  ellipse(ctx, 10, -88, 5, 5);
  fill(ctx, "#FFFFFF");
  ctx.restore();

  // FLIR Telemetry HUD
  ctx.fillStyle = "#28E0A0";
  ctx.font = "bold 22px monospace";
  ctx.fillText("FLIR THERMAL IR-90  ● REC", 60, 80);
  ctx.fillText("TEMP TARGET: +37.4 °C [HUMANOID ANOMALY]", 60, 115);
  ctx.fillText("EMF FLUX: 3.4 GHz [ALERT]", 60, 150);

  // Reticle box
  ctx.strokeStyle = "#FF3220";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(px - 65, py - 130, 130, 260);
}

/** Scene 12: Studio Outro */
export function drawSceneOutro(ctx, W, H, t) {
  ctx.fillStyle = "#07090E";
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.5, cy = H * 0.45;

  // Animated Film Reel circle
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.5);
  ellipse(ctx, 0, 0, 90, 90);
  stroke(ctx, 6, "#FF3344");
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    ellipse(ctx, Math.cos(a) * 50, Math.sin(a) * 50, 18, 18);
    stroke(ctx, 3.5, "#E2E8F0");
  }
  ctx.restore();

  // Studio Typography
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("NIGHTINGALE FILMS", cx, cy + 150);

  ctx.fillStyle = "#FF3344";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("UNSOLVED REALITIES • FACT-CHECKED INVESTIGATIONS", cx, cy + 195);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "20px sans-serif";
  ctx.fillText("Subscribe for more unsolved historical mysteries", cx, cy + 240);
  ctx.textAlign = "left";
}
