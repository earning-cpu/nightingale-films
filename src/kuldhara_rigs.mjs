// kuldhara_rigs.mjs - 100% Vector 2D Character Rigs for Kuldhara Story
// Hand-drawn vector cartoon characters with articulated limbs, facial rigs, and costumes.
import { clamp, lerp, rad, ellipse, stroke, fill, line, poly, smooth, rrect, INK } from "./anim/core.mjs";

const SKIN_LIGHT = "#FCDCB2";
const SKIN_WARM = "#E6AC78";
const SKIN_ELDER = "#D9A273";
const GOLD = "#E5B842";
const RUBY = "#C22A22";
const RAJASTHANI_RED = "#D83428";
const ROYAL_NAVY = "#1E2640";
const WHITE = "#F7F5EE";
const DARK_INK = "#1A1423";

/** Draw animated flickering torch with flame particles */
export function drawTorch(ctx, x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Wooden shaft
  poly(ctx, [[-5, 0], [5, 0], [3, 80], [-3, 80]]);
  fill(ctx, "#624028");
  stroke(ctx, 2.5, DARK_INK);

  // Wrapped cloth head
  poly(ctx, [[-9, -15], [9, -15], [7, 5], [-7, 5]]);
  fill(ctx, "#3D3126");
  stroke(ctx, 2.5, DARK_INK);

  // Procedural flame licks (outer orange, middle yellow, inner white)
  const wobble1 = Math.sin(t * 18) * 4;
  const wobble2 = Math.cos(t * 22) * 5;
  const wobble3 = Math.sin(t * 27) * 3;

  // Outer orange flame
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.quadraticCurveTo(-15 + wobble1, -40, 0 + wobble2, -65);
  ctx.quadraticCurveTo(15 + wobble3, -40, 10, -10);
  ctx.closePath();
  fill(ctx, "#FF5A1E");

  // Mid yellow flame
  ctx.beginPath();
  ctx.moveTo(-7, -10);
  ctx.quadraticCurveTo(-10 + wobble2, -30, 0 + wobble1, -50);
  ctx.quadraticCurveTo(10 + wobble1, -30, 7, -10);
  ctx.closePath();
  fill(ctx, "#FFB82E");

  // Inner bright core
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.quadraticCurveTo(-5, -22, 0, -35);
  ctx.quadraticCurveTo(5, -22, 4, -10);
  ctx.closePath();
  fill(ctx, "#FFF4D0");

  // Sparks / flying embers
  for (let i = 0; i < 4; i++) {
    const sparkPhase = (t * 4 + i * 0.25) % 1;
    const sx = Math.sin(t * 10 + i * 1.5) * (15 + i * 8);
    const sy = -65 - sparkPhase * 40 - i * 10;
    ellipse(ctx, sx, sy, 2.2 * (1 - sparkPhase), 2.2 * (1 - sparkPhase));
    fill(ctx, "#FFC840");
  }

  ctx.restore();
}

/** Draw swinging brass lantern */
export function drawLantern(ctx, x, y, scale = 1, swing = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  ctx.scale(scale, scale);

  // Chain / handle
  ctx.beginPath();
  ctx.arc(0, -25, 14, Math.PI, 0);
  stroke(ctx, 3, "#8C6A28");

  // Brass cap
  poly(ctx, [[-12, -25], [12, -25], [16, -15], [-16, -15]]);
  fill(ctx, "#B88E36");
  stroke(ctx, 2.5, DARK_INK);

  // Glass chamber with warm glow
  poly(ctx, [[-14, -15], [14, -15], [11, 20], [-11, 20]]);
  fill(ctx, "#FFE082");
  stroke(ctx, 2.5, DARK_INK);

  // Flame inside glass
  ellipse(ctx, 0, 5, 4, 7);
  fill(ctx, "#FF6B22");

  // Brass base
  poly(ctx, [[-14, 20], [14, 20], [16, 28], [-16, 28]]);
  fill(ctx, "#8C6A28");
  stroke(ctx, 2.5, DARK_INK);

  ctx.restore();
}

/** Diwan Salim Singh - Sinister Rajasthani Villain Rig */
export function drawSalimSingh(ctx, x, y, scale = 1, p = {}) {
  const t = p.t || 0;
  const breathe = Math.sin(t * 3) * 2;
  ctx.save();
  ctx.translate(x, y + breathe);
  ctx.scale(scale * (p.flip ? -1 : 1), scale);

  // Ground shadow
  ellipse(ctx, 0, 0, 80, 14);
  fill(ctx, "rgba(20, 15, 30, 0.35)");

  // 1. Legs & Royal Mojaris (curled shoes)
  for (const side of [-1, 1]) {
    const lx = side * 22;
    poly(ctx, [[lx - 12, -90], [lx + 12, -90], [lx + 10, -10], [lx - 10, -10]]);
    fill(ctx, "#E0D8C8");
    stroke(ctx, 3, DARK_INK);

    // Curled pointed mojari shoe
    ctx.beginPath();
    ctx.moveTo(lx - 10, -10);
    ctx.lineTo(lx + 24, -10);
    ctx.quadraticCurveTo(lx + 38, -18, lx + 42, -24);
    ctx.quadraticCurveTo(lx + 34, -12, lx + 20, -5);
    ctx.lineTo(lx - 10, -5);
    ctx.closePath();
    fill(ctx, RUBY);
    stroke(ctx, 2.5, DARK_INK);
  }

  // 2. Royal Angrakha Tunic & Belt
  const tunic = [
    [-45, -220], [45, -220],
    [58, -140], [65, -85],
    [-65, -85], [-58, -140]
  ];
  smooth(ctx, tunic);
  fill(ctx, ROYAL_NAVY);
  stroke(ctx, 4, DARK_INK);

  // Golden Kamarbandh (Sash / Waist Belt)
  poly(ctx, [[-58, -120], [58, -120], [62, -98], [-62, -98]]);
  fill(ctx, GOLD);
  stroke(ctx, 3, DARK_INK);

  // Gold embroidery along chest
  line(ctx, [[-40, -215], [0, -140], [-2, -120]], 3.5, GOLD);
  line(ctx, [[40, -215], [0, -140]], 3.5, GOLD);

  // 3. Head & Menacing Face
  const hy = -260;
  // Neck
  poly(ctx, [[-16, -225], [16, -225], [14, -200], [-14, -200]]);
  fill(ctx, SKIN_WARM);
  stroke(ctx, 3, DARK_INK);

  // Bean Head (superellipse jaw)
  ellipse(ctx, 0, hy, 44, 48);
  fill(ctx, SKIN_WARM);
  stroke(ctx, 4, DARK_INK);

  // Ears with gold earrings
  for (const es of [-1, 1]) {
    ellipse(ctx, es * 44, hy, 7, 11);
    fill(ctx, SKIN_WARM);
    stroke(ctx, 2.5, DARK_INK);
    ellipse(ctx, es * 45, hy + 9, 3.5, 3.5);
    fill(ctx, GOLD);
  }

  // Menacing Eyes (Stern, narrowed eyelids)
  const eyeShift = p.lookX || 0;
  for (const side of [-1, 1]) {
    const ex = side * 18 + eyeShift;
    // Eye slit
    ctx.beginPath();
    ctx.arc(ex, hy - 4, 11, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.closePath();
    fill(ctx, WHITE);
    stroke(ctx, 2.2, DARK_INK);

    // Dark pupil looking down/forward
    ellipse(ctx, ex + 2, hy - 2, 4.5, 4.5);
    fill(ctx, DARK_INK);

    // Angry angled eyebrow
    line(ctx, [[ex - side * 14, hy - 18], [ex + side * 12, hy - 11]], 4.5, DARK_INK);
  }

  // Pointed nose
  line(ctx, [[0, hy - 8], [6, hy + 8], [-1, hy + 11]], 3, DARK_INK);

  // Signature Curled Moustache
  ctx.beginPath();
  ctx.moveTo(-38, hy + 14);
  ctx.quadraticCurveTo(-15, hy + 22, 0, hy + 18);
  ctx.quadraticCurveTo(15, hy + 22, 38, hy + 14);
  ctx.quadraticCurveTo(46, hy + 6, 44, hy - 2);
  ctx.quadraticCurveTo(40, hy + 8, 25, hy + 18);
  ctx.lineTo(-25, hy + 18);
  ctx.quadraticCurveTo(-40, hy + 8, -44, hy - 2);
  ctx.quadraticCurveTo(-46, hy + 6, -38, hy + 14);
  ctx.closePath();
  fill(ctx, DARK_INK);

  // Menacing Mouth (sneer / smirk / speech)
  const isTalking = p.talking || false;
  if (isTalking) {
    const mouthOpen = Math.abs(Math.sin(t * 12)) * 8;
    ctx.beginPath();
    ctx.ellipse(0, hy + 28, 12, 4 + mouthOpen, 0, 0, Math.PI * 2);
    fill(ctx, "#5A1E28");
    stroke(ctx, 2.5, DARK_INK);
  } else {
    // Sneering smirk
    ctx.beginPath();
    ctx.arc(4, hy + 23, 14, 0.2 * Math.PI, 0.9 * Math.PI, false);
    stroke(ctx, 3, DARK_INK);
  }

  // 4. Grand Rajasthani Royal Turban (Deep Red & Gold)
  const turbanFolds = [
    [[-52, hy - 24], [-40, hy - 72], [38, hy - 78], [54, hy - 28], [38, hy - 12], [-42, hy - 12]],
    [[-48, hy - 40], [-25, hy - 82], [32, hy - 82], [48, hy - 44]],
    [[-42, hy - 58], [0, hy - 90], [38, hy - 64]]
  ];
  for (const fold of turbanFolds) {
    smooth(ctx, fold);
    fill(ctx, RAJASTHANI_RED);
    stroke(ctx, 3.5, DARK_INK);
  }

  // Gold Brocade Band on Turban
  line(ctx, [[-48, hy - 32], [0, hy - 26], [48, hy - 32]], 5, GOLD);

  // Jeweled Royal Kalgi Plume (Aigrette)
  ellipse(ctx, 0, hy - 75, 8, 10);
  fill(ctx, GOLD);
  stroke(ctx, 2.5, DARK_INK);
  ellipse(ctx, 0, hy - 75, 4, 5);
  fill(ctx, RUBY);

  // Tall white plume feather
  ctx.beginPath();
  ctx.moveTo(0, hy - 85);
  ctx.quadraticCurveTo(-14, hy - 120, -5, hy - 138);
  ctx.quadraticCurveTo(12, hy - 110, 0, hy - 85);
  ctx.closePath();
  fill(ctx, WHITE);
  stroke(ctx, 2.2, DARK_INK);

  // 5. Arms & Menacing Jeweled Dagger
  const armRaise = p.daggerRaise ? Math.min(1, p.daggerRaise) : 0;
  // Left arm (on hip)
  line(ctx, [[-45, -215], [-72, -160], [-50, -125]], 24, ROYAL_NAVY);
  ellipse(ctx, -50, -125, 12, 12);
  fill(ctx, SKIN_WARM);
  stroke(ctx, 3, DARK_INK);

  // Right arm (holding & pointing dagger)
  const shX = 45, shY = -215;
  const elbX = lerp(68, 75, armRaise);
  const elbY = lerp(-165, -220, armRaise);
  const handX = lerp(60, 110, armRaise);
  const handY = lerp(-120, -225, armRaise);

  line(ctx, [[shX, shY], [elbX, elbY], [handX, handY]], 24, ROYAL_NAVY);
  ellipse(ctx, handX, handY, 13, 13);
  fill(ctx, SKIN_WARM);
  stroke(ctx, 3, DARK_INK);

  // The Jeweled Curved Dagger (Khanjar)
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(lerp(0.3, -0.6, armRaise));
  // Dagger hilt
  poly(ctx, [[-5, -12], [5, -12], [4, 12], [-4, 12]]);
  fill(ctx, GOLD);
  stroke(ctx, 2.2, DARK_INK);
  // Curved steel blade
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(4, -12);
  ctx.quadraticCurveTo(8, -45, 18, -62);
  ctx.quadraticCurveTo(2, -48, -4, -12);
  ctx.closePath();
  fill(ctx, "#E0E8F0");
  stroke(ctx, 2.5, DARK_INK);
  ctx.restore();

  ctx.restore();
}

/** Paliwal Village Chief / Elder Rig */
export function drawVillageChief(ctx, x, y, scale = 1, p = {}) {
  const t = p.t || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (p.flip ? -1 : 1), scale);

  // Shadow
  ellipse(ctx, 0, 0, 75, 12);
  fill(ctx, "rgba(20, 15, 30, 0.3)");

  // Dhoti & Mojaris
  for (const side of [-1, 1]) {
    const lx = side * 18;
    poly(ctx, [[lx - 12, -80], [lx + 12, -80], [lx + 10, -5], [lx - 10, -5]]);
    fill(ctx, "#EAE5D8");
    stroke(ctx, 2.8, DARK_INK);
  }

  // Khadi Kurta & Saffron Shawl (Angavastram)
  const kurta = [[-40, -200], [40, -200], [48, -80], [-48, -80]];
  smooth(ctx, kurta);
  fill(ctx, WHITE);
  stroke(ctx, 3.5, DARK_INK);

  // Saffron Shawl draped over shoulder
  poly(ctx, [[-42, -195], [-15, -200], [42, -110], [25, -95], [-45, -160]]);
  fill(ctx, "#E87C28");
  stroke(ctx, 2.8, DARK_INK);

  // Head & Wise Elder Face
  const hy = -245;
  ellipse(ctx, 0, hy, 40, 44);
  fill(ctx, SKIN_ELDER);
  stroke(ctx, 3.5, DARK_INK);

  // Flowing White Beard
  ctx.beginPath();
  ctx.moveTo(-32, hy + 8);
  ctx.quadraticCurveTo(-38, hy + 45, -15, hy + 65);
  ctx.lineTo(0, hy + 75);
  ctx.lineTo(15, hy + 65);
  ctx.quadraticCurveTo(38, hy + 45, 32, hy + 8);
  ctx.closePath();
  fill(ctx, WHITE);
  stroke(ctx, 3, DARK_INK);

  // Eyes & Eyebrows
  for (const side of [-1, 1]) {
    const ex = side * 15;
    ellipse(ctx, ex, hy - 4, 5, 4);
    fill(ctx, DARK_INK);

    // Concerned / Wrathful Eyebrow
    if (p.wrath) {
      line(ctx, [[ex - side * 12, hy - 16], [ex + side * 10, hy - 10]], 3.5, WHITE);
    } else {
      line(ctx, [[ex - side * 12, hy - 11], [ex + side * 10, hy - 14]], 3.5, WHITE);
    }
  }

  // Mouth (talking/shouting curse)
  if (p.shouting) {
    const mouthW = 14 + Math.sin(t * 14) * 4;
    const mouthH = 16 + Math.sin(t * 14) * 5;
    ellipse(ctx, 0, hy + 18, mouthW, mouthH);
    fill(ctx, "#4A1820");
    stroke(ctx, 2.5, DARK_INK);
  } else if (p.talking) {
    ellipse(ctx, 0, hy + 18, 10, 6 + Math.sin(t * 10) * 4);
    fill(ctx, "#4A1820");
    stroke(ctx, 2.5, DARK_INK);
  } else {
    line(ctx, [[-10, hy + 18], [10, hy + 18]], 2.5, DARK_INK);
  }

  // White Pagri (Turban of respect)
  const pagriFolds = [
    [[-48, hy - 20], [-36, hy - 65], [34, hy - 68], [48, hy - 22], [-42, hy - 10]],
    [[-42, hy - 35], [-20, hy - 75], [30, hy - 72], [42, hy - 38]]
  ];
  for (const fold of pagriFolds) {
    smooth(ctx, fold);
    fill(ctx, "#F0EDE2");
    stroke(ctx, 3.2, DARK_INK);
  }

  // Arm poses: Raising torch OR consoling
  if (p.raisingTorch) {
    // Right arm raised high with flaming torch
    line(ctx, [[38, -195], [65, -260], [80, -320]], 20, WHITE);
    ellipse(ctx, 80, -320, 11, 11);
    fill(ctx, SKIN_ELDER);
    stroke(ctx, 2.8, DARK_INK);
    drawTorch(ctx, 80, -325, 1.2, t);

    // Left arm clenched or gesturing
    line(ctx, [[-38, -195], [-65, -220], [-70, -180]], 20, WHITE);
  } else if (p.consoling) {
    // Right arm wrapped gently over daughter
    line(ctx, [[35, -195], [60, -185], [85, -190]], 18, WHITE);
    ellipse(ctx, 85, -190, 10, 10);
    fill(ctx, SKIN_ELDER);
    stroke(ctx, 2.5, DARK_INK);

    line(ctx, [[-38, -195], [-55, -150], [-40, -120]], 18, WHITE);
  } else {
    // Normal standing
    line(ctx, [[-38, -195], [-55, -145], [-45, -100]], 18, WHITE);
    line(ctx, [[38, -195], [55, -145], [45, -100]], 18, WHITE);
  }

  ctx.restore();
}

/** Chief's Daughter Rig (Weeping, Expressive 2D character) */
export function drawDaughter(ctx, x, y, scale = 1, p = {}) {
  const t = p.t || 0;
  const sobbing = Math.sin(t * 14) * 2.5;
  ctx.save();
  ctx.translate(x, y + sobbing);
  ctx.scale(scale * (p.flip ? -1 : 1), scale);

  // Shadow
  ellipse(ctx, 0, 0, 50, 10);
  fill(ctx, "rgba(20, 15, 30, 0.25)");

  // Rajasthani Ghagra (Skirt)
  poly(ctx, [[-22, -110], [22, -110], [42, -5], [-42, -5]]);
  fill(ctx, "#E05A32");
  stroke(ctx, 3, DARK_INK);
  // Gold hem border
  line(ctx, [[-40, -15], [40, -15]], 4, GOLD);

  // Choli (Blouse)
  poly(ctx, [[-24, -165], [24, -165], [22, -110], [-22, -110]]);
  fill(ctx, "#D02C45");
  stroke(ctx, 2.8, DARK_INK);

  // Head
  const hy = -195;
  ellipse(ctx, 0, hy, 30, 34);
  fill(ctx, SKIN_LIGHT);
  stroke(ctx, 3, DARK_INK);

  // Red Odhna (Dupatta / Veil draped over head)
  ctx.beginPath();
  ctx.moveTo(-36, hy + 25);
  ctx.quadraticCurveTo(-42, hy - 40, 0, hy - 48);
  ctx.quadraticCurveTo(42, hy - 40, 36, hy + 25);
  ctx.lineTo(26, hy + 65);
  ctx.lineTo(-26, hy + 65);
  ctx.closePath();
  fill(ctx, RAJASTHANI_RED);
  stroke(ctx, 3.2, DARK_INK);

  // Weeping Face: Closed crying eyes + streaming cartoon tears
  for (const side of [-1, 1]) {
    const ex = side * 11;
    // Closed weeping eye arc
    ctx.beginPath();
    ctx.arc(ex, hy - 2, 7, 0.15 * Math.PI, 0.85 * Math.PI, true);
    stroke(ctx, 2.6, DARK_INK);

    // Streaming teardrops
    const tearY = hy + 6 + ((t * 2 + (side > 0 ? 0.3 : 0)) % 1) * 22;
    ellipse(ctx, ex, tearY, 2.8, 4.5);
    fill(ctx, "#72C6FF");
  }

  // Quivering mouth
  ctx.beginPath();
  ctx.arc(0, hy + 18, 6, 0.2 * Math.PI, 0.8 * Math.PI, true);
  stroke(ctx, 2.2, DARK_INK);

  // Arms held up to face / chest in grief
  line(ctx, [[-22, -160], [-15, -140], [-6, -165]], 14, "#D02C45");
  ellipse(ctx, -6, -165, 7, 7);
  fill(ctx, SKIN_LIGHT);
  stroke(ctx, 2.2, DARK_INK);

  line(ctx, [[22, -160], [15, -140], [6, -165]], 14, "#D02C45");
  ellipse(ctx, 6, -165, 7, 7);
  fill(ctx, SKIN_LIGHT);
  stroke(ctx, 2.2, DARK_INK);

  ctx.restore();
}

/** Walking Villager Caravan Rig */
export function drawVillager(ctx, x, y, scale = 1, p = {}) {
  const t = p.t || 0;
  const walkPhase = p.walkPhase || t * 6;
  const legSwing = Math.sin(walkPhase) * 22;
  const bob = -Math.abs(Math.cos(walkPhase)) * 5;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale * (p.flip ? -1 : 1), scale);

  // Shadow
  ellipse(ctx, 0, -bob, 45, 8);
  fill(ctx, "rgba(20, 15, 30, 0.25)");

  // Walking legs
  for (const [side, ang] of [[-1, legSwing], [1, -legSwing]]) {
    const lx = side * 10;
    const fx = lx + Math.sin(rad(ang)) * 40;
    const fy = Math.cos(rad(ang)) * 40;
    line(ctx, [[lx, -45], [fx, -fy]], 11, "#E6DFD0");
  }

  // Torso / Kurta
  poly(ctx, [[-18, -120], [18, -120], [22, -45], [-22, -45]]);
  fill(ctx, p.shirtColor || "#D8C5A2");
  stroke(ctx, 2.5, DARK_INK);

  // Head & Turban
  const hy = -145;
  ellipse(ctx, 0, hy, 18, 20);
  fill(ctx, SKIN_WARM);
  stroke(ctx, 2.2, DARK_INK);

  ellipse(ctx, 0, hy - 12, 22, 14);
  fill(ctx, p.turbanColor || "#E86A38");
  stroke(ctx, 2.2, DARK_INK);

  // Bundle on head or lantern in hand
  if (p.bundle) {
    ellipse(ctx, 0, hy - 32, 26, 16);
    fill(ctx, "#B28C56");
    stroke(ctx, 2.5, DARK_INK);
  }

  if (p.lantern) {
    const lanternSwing = Math.sin(walkPhase) * 0.25;
    line(ctx, [[18, -115], [30, -85]], 9, p.shirtColor || "#D8C5A2");
    drawLantern(ctx, 30, -80, 0.65, lanternSwing);
  }

  ctx.restore();
}
