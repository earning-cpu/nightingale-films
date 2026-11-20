// kuldhara_scenes.mjs - Broadcast-Grade 2D Vector Animation Engine for Kuldhara
// High-definition SVG vector rendering + Skia canvas, multiplane parallax, dynamic radial lighting, and anatomical character rigs.
import { GlobalFonts, Image } from "@napi-rs/canvas";
import { clamp, lerp, rad, ellipse, stroke, fill, line, poly, smooth, rrect, INK } from "./anim/core.mjs";

try {
  GlobalFonts.registerFromPath("./assets/NotoSansDevanagari-Bold.ttf", "Noto Sans Devanagari");
} catch (e) {}

const DARK_INK = "#100A16";
const GOLD = "#E5B842";
const RAJASTHANI_RED = "#D8281E";

/** Helper: Render SVG string onto canvas */
export function drawSvgToCanvas(ctx, svgString, x = 0, y = 0, w = 1920, h = 1080) {
  const img = new Image();
  img.src = Buffer.from(svgString);
  ctx.drawImage(img, x, y, w, h);
}

/** Helper: Radial lighting glow */
export function addRadialGlow(ctx, x, y, radius, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============================================================================
// 1. SCENE 01: Ruined Midnight Havelis & Crescent Moon (0.0s - 5.2s)
// ============================================================================
export function drawSceneNightRuins(ctx, W, H, t) {
  const zoom = 1.0 + t * 0.025;
  const moonWobble = Math.sin(t * 3) * 2;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#04060F"/>
      <stop offset="50%" stop-color="#0E1426"/>
      <stop offset="85%" stop-color="#1B172A"/>
      <stop offset="100%" stop-color="#281A28"/>
    </linearGradient>

    <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFF8E0" stop-opacity="0.9"/>
      <stop offset="25%" stop-color="#FFEAA8" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#FFEAA8" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#FFEAA8" stop-opacity="0"/>
    </radialGradient>

    <pattern id="brickDark" width="60" height="24" patternUnits="userSpaceOnUse">
      <rect width="60" height="24" fill="#22283E"/>
      <line x1="0" y1="0" x2="60" y2="0" stroke="#121624" stroke-width="1.5"/>
      <line x1="0" y1="12" x2="60" y2="12" stroke="#121624" stroke-width="1.5"/>
      <line x1="0" y1="0" x2="0" y2="12" stroke="#121624" stroke-width="1.5"/>
      <line x1="30" y1="12" x2="30" y2="24" stroke="#121624" stroke-width="1.5"/>
    </pattern>

    <pattern id="brickForeground" width="70" height="28" patternUnits="userSpaceOnUse">
      <rect width="70" height="28" fill="#2C263A"/>
      <line x1="0" y1="0" x2="70" y2="0" stroke="#140F1E" stroke-width="2"/>
      <line x1="0" y1="14" x2="70" y2="14" stroke="#140F1E" stroke-width="2"/>
      <line x1="0" y1="0" x2="0" y2="14" stroke="#140F1E" stroke-width="2"/>
      <line x1="35" y1="14" x2="35" y2="28" stroke="#140F1E" stroke-width="2"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#skyGrad)"/>

  <!-- Crescent Moon -->
  <circle cx="1480" cy="${220 + moonWobble}" r="240" fill="url(#moonGlow)"/>
  <circle cx="1480" cy="${220 + moonWobble}" r="68" fill="#FFF6DE"/>
  <circle cx="1512" cy="${204 + moonWobble}" r="60" fill="#0E1426"/>

  <!-- Distant Dunes -->
  <path d="M0,${H * 0.62} Q${W * 0.25},${H * 0.58} ${W * 0.55},${H * 0.63} T${W},${H * 0.59} L${W},${H} L0,${H} Z" fill="#141829"/>

  <!-- Midground Ruined Havelis with Broken Silhouettes -->
  <g id="midground-ruins">
    <path d="M120,${H * 0.78} L120,440 L160,440 L160,410 L220,410 L220,460 L280,430 L320,430 L320,400 L380,400 L380,450 L440,420 L440,${H * 0.78} Z" fill="url(#brickDark)" stroke="#0E121E" stroke-width="3"/>
    <path d="M180,560 L180,510 Q180,480 210,480 Q240,480 240,510 L240,560 Z" fill="#0A0C16" stroke="#0E121E" stroke-width="2.5"/>
    <rect x="170" y="555" width="80" height="24" fill="#323854" stroke="#0E121E" stroke-width="2"/>
    <path d="M300,540 L300,490 Q300,460 330,460 Q360,460 360,490 L360,540 Z" fill="#0A0C16" stroke="#0E121E" stroke-width="2.5"/>
    <rect x="290" y="535" width="80" height="24" fill="#323854" stroke="#0E121E" stroke-width="2"/>

    <path d="M1240,${H * 0.78} L1240,380 L1310,380 L1310,350 L1370,350 L1370,410 L1430,370 L1490,370 L1490,340 L1560,340 L1560,${H * 0.78} Z" fill="url(#brickDark)" stroke="#0E121E" stroke-width="3"/>
    <path d="M1320,350 Q1340,310 1340,290 Q1340,310 1360,350 Z" fill="#323854" stroke="#0E121E" stroke-width="2.5"/>
    <path d="M1380,510 L1380,450 Q1380,420 1415,420 Q1450,420 1450,450 L1450,510 Z" fill="#0A0C16" stroke="#0E121E" stroke-width="2.5"/>
    <rect x="1365" y="505" width="100" height="28" fill="#323854" stroke="#0E121E" stroke-width="2"/>
  </g>

  <!-- Mid Dune -->
  <path d="M0,${H * 0.76} Q${W * 0.35},${H * 0.7} ${W * 0.7},${H * 0.77} T${W},${H * 0.73} L${W},${H} L0,${H} Z" fill="#1C2136"/>

  <!-- Foreground Gateway Arch -->
  <g id="foreground-arch">
    <rect x="360" y="180" width="180" height="${H - 180}" fill="url(#brickForeground)" stroke="#0E0A16" stroke-width="4.5"/>
    <rect x="340" y="320" width="220" height="24" fill="#3D3550" stroke="#0E0A16" stroke-width="3"/>

    <rect x="1040" y="180" width="180" height="${H - 180}" fill="url(#brickForeground)" stroke="#0E0A16" stroke-width="4.5"/>
    <rect x="1020" y="320" width="220" height="24" fill="#3D3550" stroke="#0E0A16" stroke-width="3"/>

    <path d="M360,180 L1220,180 L1220,280 Q1140,360 1040,440 Q940,290 790,320 Q640,290 540,440 Q440,360 360,280 Z" fill="#443A58" stroke="#0E0A16" stroke-width="5"/>
    <circle cx="480" cy="240" r="28" fill="#584C72" stroke="#0E0A16" stroke-width="2.5"/>
    <circle cx="1100" cy="240" r="28" fill="#584C72" stroke="#0E0A16" stroke-width="2.5"/>
  </g>

  <!-- Foreground Sand Dune & Fallen Stone Blocks -->
  <path d="M0,${H * 0.86} Q${W * 0.4},${H * 0.82} ${W * 0.78},${H * 0.88} L${W},${H} L0,${H} Z" fill="#242232"/>
  <polygon points="560,${H * 0.89} 620,${H * 0.87} 640,${H * 0.94} 570,${H * 0.96}" fill="#3C344C" stroke="#0E0A16" stroke-width="2.5"/>
  <polygon points="650,${H * 0.92} 710,${H * 0.9} 725,${H * 0.97} 660,${H * 0.98}" fill="#322B40" stroke="#0E0A16" stroke-width="2.5"/>
  <polygon points="980,${H * 0.88} 1040,${H * 0.85} 1060,${H * 0.93} 995,${H * 0.95}" fill="#3C344C" stroke="#0E0A16" stroke-width="2.5"/>
</svg>
`;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -H / 2);
  drawSvgToCanvas(ctx, svg);

  // Twinkling stars
  for (let i = 0; i < 45; i++) {
    const sx = (i * 149.3) % W;
    const sy = (i * 87.7) % (H * 0.58);
    const tw = 0.4 + 0.6 * Math.sin(t * 3.5 + i);
    ellipse(ctx, sx, sy, 2.0 * tw, 2.0 * tw);
    ctx.fillStyle = "#EDE8FF";
    ctx.fill();
  }

  // Drifting Thar desert dust
  for (let p = 0; p < 35; p++) {
    const px = (t * 220 + p * 67) % W;
    const py = H * 0.82 + Math.sin(t * 4 + p) * 15 - (p % 6) * 12;
    ellipse(ctx, px, py, 2.5, 1.5);
    ctx.fillStyle = "rgba(220, 190, 140, 0.45)";
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================================
// 2. SCENE 02: 1825 Prosperous Paliwal Trade Kingdom (5.2s - 11.0s)
// ============================================================================
export function drawSceneProsperous1825(ctx, W, H, t) {
  const st = t >= 5.2 ? t - 5.2 : t; // Handles both local shot time and global time
  const camelProgress = (st % 6) / 6;
  const camelX = -120 + camelProgress * 2160;
  const legCycle = st * 6;
  const f1 = Math.sin(legCycle) * 20;
  const f2 = -Math.sin(legCycle) * 20;
  const b1 = Math.sin(legCycle + Math.PI * 0.5) * 20;
  const b2 = -Math.sin(legCycle + Math.PI * 0.5) * 20;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="daySky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E65C6"/>
      <stop offset="50%" stop-color="#64A2E6"/>
      <stop offset="85%" stop-color="#E8CE98"/>
      <stop offset="100%" stop-color="#F5DDB0"/>
    </linearGradient>

    <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFFDF5" stop-opacity="1"/>
      <stop offset="25%" stop-color="#FFE898" stop-opacity="0.5"/>
      <stop offset="60%" stop-color="#FFE898" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#FFE898" stop-opacity="0"/>
    </radialGradient>

    <pattern id="sandstoneBrick" width="70" height="28" patternUnits="userSpaceOnUse">
      <rect width="70" height="28" fill="#E2A654"/>
      <line x1="0" y1="0" x2="70" y2="0" stroke="#9A652E" stroke-width="1.5"/>
      <line x1="0" y1="14" x2="70" y2="14" stroke="#9A652E" stroke-width="1.5"/>
      <line x1="0" y1="0" x2="0" y2="14" stroke="#9A652E" stroke-width="1.5"/>
      <line x1="35" y1="14" x2="35" y2="28" stroke="#9A652E" stroke-width="1.5"/>
    </pattern>

    <pattern id="streetCobble" width="90" height="36" patternUnits="userSpaceOnUse">
      <rect width="90" height="36" fill="#D29850"/>
      <line x1="0" y1="0" x2="90" y2="0" stroke="#8E5E28" stroke-width="2"/>
      <line x1="0" y1="18" x2="90" y2="18" stroke="#8E5E28" stroke-width="2"/>
      <line x1="0" y1="0" x2="0" y2="18" stroke="#8E5E28" stroke-width="2"/>
      <line x1="45" y1="18" x2="45" y2="36" stroke="#8E5E28" stroke-width="2"/>
    </pattern>

    <linearGradient id="awningRed" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C82018"/>
      <stop offset="100%" stop-color="#8C1410"/>
    </linearGradient>

    <linearGradient id="awningGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E8B038"/>
      <stop offset="100%" stop-color="#B88018"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#daySky)"/>
  <circle cx="1580" cy="160" r="300" fill="url(#sunGlow)"/>
  <circle cx="1580" cy="160" r="50" fill="#FFF9E0"/>

  <g id="haveli-row">
    <rect x="0" y="160" width="460" height="600" fill="url(#sandstoneBrick)" stroke="#110A14" stroke-width="4"/>
    <path d="M120,160 L120,110 Q120,70 170,70 Q220,70 220,110 L220,160 Z" fill="#E8B262" stroke="#110A14" stroke-width="3"/>
    <rect x="80" y="240" width="180" height="180" fill="#C88E3E" stroke="#110A14" stroke-width="3.5"/>
    <path d="M110,380 L110,300 Q110,260 170,260 Q230,260 230,300 L230,380 Z" fill="#180E08" stroke="#110A14" stroke-width="3"/>
    <polygon points="60,420 280,420 260,450 80,450" fill="#A86E28" stroke="#110A14" stroke-width="3"/>

    <rect x="460" y="120" width="500" height="640" fill="url(#sandstoneBrick)" stroke="#110A14" stroke-width="4"/>
    <path d="M640,120 L640,70 Q640,30 710,30 Q780,30 780,70 L780,120 Z" fill="#E8B262" stroke="#110A14" stroke-width="3.5"/>
    <circle cx="710" cy="20" r="8" fill="#E5B842" stroke="#110A14" stroke-width="2"/>
    <rect x="560" y="220" width="300" height="200" fill="#C88E3E" stroke="#110A14" stroke-width="3.5"/>
    <path d="M610,370 L610,280 Q610,240 710,240 Q810,240 810,280 L810,370 Z" fill="#180E08" stroke="#110A14" stroke-width="3"/>
    <polygon points="530,420 890,420 860,455 560,455" fill="#A86E28" stroke="#110A14" stroke-width="3"/>

    <rect x="960" y="150" width="480" height="610" fill="url(#sandstoneBrick)" stroke="#110A14" stroke-width="4"/>
    <rect x="1080" y="250" width="240" height="180" fill="#C88E3E" stroke="#110A14" stroke-width="3.5"/>
    <path d="M1130,380 L1130,300 Q1130,260 1200,260 Q1270,260 1270,300 L1270,380 Z" fill="#180E08" stroke="#110A14" stroke-width="3"/>
    <polygon points="1050,430 1350,430 1320,465 1080,465" fill="#A86E28" stroke="#110A14" stroke-width="3"/>

    <rect x="1440" y="100" width="480" height="660" fill="url(#sandstoneBrick)" stroke="#110A14" stroke-width="4"/>
    <path d="M1620,100 L1620,50 Q1620,10 1690,10 Q1760,10 1760,50 L1760,100 Z" fill="#E8B262" stroke="#110A14" stroke-width="3.5"/>
    <circle cx="1690" cy="2" r="8" fill="#E5B842" stroke="#110A14" stroke-width="2"/>
    <rect x="1540" y="220" width="280" height="190" fill="#C88E3E" stroke="#110A14" stroke-width="3.5"/>
    <path d="M1590,360 L1590,270 Q1590,230 1680,230 Q1770,230 1770,270 L1770,360 Z" fill="#180E08" stroke="#110A14" stroke-width="3"/>
    <polygon points="1510,410 1850,410 1820,445 1540,445" fill="#A86E28" stroke="#110A14" stroke-width="3"/>
  </g>

  <g id="market-stalls">
    <polygon points="50,560 380,560 410,680 20,680" fill="url(#awningRed)" stroke="#110A14" stroke-width="4"/>
    <line x1="40" y1="680" x2="40" y2="760" stroke="#482A14" stroke-width="7"/>
    <line x1="390" y1="680" x2="390" y2="760" stroke="#482A14" stroke-width="7"/>

    <polygon points="520,540 880,540 910,670 490,670" fill="url(#awningGold)" stroke="#110A14" stroke-width="4"/>
    <line x1="510" y1="670" x2="510" y2="760" stroke="#482A14" stroke-width="7"/>
    <line x1="890" y1="670" x2="890" y2="760" stroke="#482A14" stroke-width="7"/>

    <polygon points="1020,550 1380,550 1410,680 990,680" fill="url(#awningRed)" stroke="#110A14" stroke-width="4"/>
    <line x1="1010" y1="680" x2="1010" y2="760" stroke="#482A14" stroke-width="7"/>
    <line x1="1390" y1="680" x2="1390" y2="760" stroke="#482A14" stroke-width="7"/>

    <polygon points="1500,540 1860,540 1890,670 1470,670" fill="url(#awningGold)" stroke="#110A14" stroke-width="4"/>
    <line x1="1490" y1="670" x2="1490" y2="760" stroke="#482A14" stroke-width="7"/>
    <line x1="1870" y1="670" x2="1870" y2="760" stroke="#482A14" stroke-width="7"/>
  </g>

  <rect x="0" y="750" width="${W}" height="330" fill="url(#streetCobble)" stroke="#110A14" stroke-width="5"/>

  <g id="market-props">
    <ellipse cx="140" cy="770" rx="36" ry="24" fill="#8C5824" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="140" cy="762" rx="28" ry="14" fill="#F4B818"/>
    <ellipse cx="200" cy="780" rx="32" ry="22" fill="#8C5824" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="200" cy="773" rx="24" ry="12" fill="#D42018"/>
    <ellipse cx="260" cy="765" rx="24" ry="26" fill="#A84E28" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="260" cy="742" rx="14" ry="6" fill="#C4683C" stroke="#110A14" stroke-width="2.5"/>

    <ellipse cx="1440" cy="775" rx="35" ry="23" fill="#8C5824" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="1440" cy="768" rx="27" ry="13" fill="#8C6E28"/>
    <ellipse cx="1510" cy="765" rx="26" ry="28" fill="#E5B842" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="1510" cy="740" rx="15" ry="7" fill="#F8D468" stroke="#110A14" stroke-width="2.5"/>
    <ellipse cx="1570" cy="780" rx="25" ry="26" fill="#A84E28" stroke="#110A14" stroke-width="3"/>
  </g>

  <!-- Grand Anatomical Desert Camel Rig -->
  <g id="camel" transform="translate(${camelX}, 690) scale(2.1)">
    <ellipse cx="0" cy="115" rx="150" ry="18" fill="rgba(60,35,15,0.35)"/>

    <g id="far-rear-leg" transform="translate(-85, -60)">
      <path d="M-20,-30 Q-28,20 -15,55 L5,50 Q18,10 10,-30 Z" fill="#B88046" stroke="#110A14" stroke-width="2.5"/>
      <line x1="-5" y1="50" x2="${-5 + Math.sin(rad(b1)) * 26}" y2="175" stroke="#B88046" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="${-5 + Math.sin(rad(b1)) * 26}" cy="175" rx="11" ry="6" fill="#422416"/>
    </g>

    <g id="far-front-leg" transform="translate(85, -60)">
      <path d="M-15,-30 Q-22,20 -10,50 L10,45 Q18,10 10,-30 Z" fill="#B88046" stroke="#110A14" stroke-width="2.5"/>
      <line x1="0" y1="45" x2="${0 + Math.sin(rad(f1)) * 26}" y2="175" stroke="#B88046" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="${0 + Math.sin(rad(f1)) * 26}" cy="175" rx="11" ry="6" fill="#422416"/>
    </g>

    <path d="M-115,-70 Q-135,-30 -80,-15 Q0,-10 90,-20 Q130,-40 120,-75 Q100,-105 50,-95 Q15,-155 -30,-150 Q-65,-120 -115,-70 Z" fill="#DCA86A" stroke="#110A14" stroke-width="4"/>
    <path d="M-110,-55 Q-120,-25 -75,-16 Q0,-10 85,-20 Q115,-35 110,-55 Q60,-35 0,-30 Q-60,-35 -110,-55 Z" fill="#C89254"/>

    <path d="M75,-65 Q105,-45 130,-75 Q155,-115 170,-165 L215,-150 Q195,-95 160,-55 Q125,-15 85,-30 Z" fill="#DCA86A" stroke="#110A14" stroke-width="4"/>

    <g transform="translate(195, -165) rotate(-15)">
      <path d="M-25,-15 L25,-15 Q38,-10 40,5 Q38,20 18,18 L-20,10 Z" fill="#DCA86A" stroke="#110A14" stroke-width="3"/>
      <ellipse cx="36" cy="4" rx="7" ry="5" fill="#C89254"/>
      <ellipse cx="34" cy="2" rx="2.5" ry="1.5" fill="#110A14"/>
      <ellipse cx="6" cy="-4" rx="5" ry="4" fill="#110A14"/>
      <circle cx="8" cy="-5" r="1.5" fill="#FFFFFF"/>
      <path d="M-2,-10 Q8,-12 16,-8" fill="none" stroke="#68421E" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="-16" cy="-20" rx="6" ry="12" fill="#DCA86A" stroke="#110A14" stroke-width="2.5" transform="rotate(-25 -16 -20)"/>
    </g>

    <path d="M-115,-65 Q-135,-40 -125,0" fill="none" stroke="#DCA86A" stroke-width="6"/>
    <ellipse cx="-125" cy="5" rx="7" ry="14" fill="#422416"/>

    <g id="near-rear-leg" transform="translate(-70, -55)">
      <path d="M-24,-30 Q-34,25 -18,60 L12,55 Q24,15 14,-30 Z" fill="#DCA86A" stroke="#110A14" stroke-width="3"/>
      <line x1="-5" y1="55" x2="${-5 + Math.sin(rad(b2)) * 26}" y2="175" stroke="#DCA86A" stroke-width="14" stroke-linecap="round"/>
      <line x1="-5" y1="55" x2="${-5 + Math.sin(rad(b2)) * 26}" y2="175" stroke="#110A14" stroke-width="2.5"/>
      <ellipse cx="${-5 + Math.sin(rad(b2)) * 26}" cy="175" rx="12" ry="6.5" fill="#422416"/>
    </g>

    <g id="near-front-leg" transform="translate(100, -55)">
      <path d="M-18,-30 Q-26,25 -12,55 L14,50 Q24,15 16,-30 Z" fill="#DCA86A" stroke="#110A14" stroke-width="3"/>
      <line x1="0" y1="50" x2="${0 + Math.sin(rad(f2)) * 26}" y2="175" stroke="#DCA86A" stroke-width="14" stroke-linecap="round"/>
      <line x1="0" y1="50" x2="${0 + Math.sin(rad(f2)) * 26}" y2="175" stroke="#110A14" stroke-width="2.5"/>
      <ellipse cx="${0 + Math.sin(rad(f2)) * 26}" cy="175" rx="12" ry="6.5" fill="#422416"/>
    </g>

    <polygon points="-45,-125 35,-125 45,-60 -55,-60" fill="#D8281E" stroke="#110A14" stroke-width="3.5"/>
    <line x1="-45" y1="-125" x2="35" y2="-125" stroke="#E5B842" stroke-width="6"/>
    <line x1="-55" y1="-60" x2="45" y2="-60" stroke="#E5B842" stroke-width="6"/>

    <ellipse cx="-15" cy="-135" rx="30" ry="20" fill="#E5B842" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="20" cy="-135" rx="28" ry="19" fill="#8C5824" stroke="#110A14" stroke-width="3"/>

    <line x1="205" y1="-165" x2="160" y2="-120" stroke="#D8281E" stroke-width="2.5"/>
    <circle cx="190" cy="-150" r="4.5" fill="#D8281E"/>
    <circle cx="175" cy="-135" r="4.5" fill="#D8281E"/>
    <circle cx="160" cy="-120" r="4.5" fill="#E5B842"/>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);
}

// ============================================================================
// 3. SCENE 03: Diwan Salim Singh In Palace (11.0s - 17.0s)
// ============================================================================
export function drawSceneSalimSingh(ctx, W, H, t) {
  const gleamPulse = 0.8 + 0.2 * Math.sin(t * 8);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="palaceBg" cx="0.5" cy="0.45" r="0.65">
      <stop offset="0%" stop-color="#32141E"/>
      <stop offset="55%" stop-color="#180810"/>
      <stop offset="100%" stop-color="#080206"/>
    </radialGradient>

    <linearGradient id="pillarG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#180C08"/>
      <stop offset="30%" stop-color="#462216"/>
      <stop offset="70%" stop-color="#582C1C"/>
      <stop offset="100%" stop-color="#1E0E08"/>
    </linearGradient>

    <linearGradient id="velvetDrape" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4A0E18"/>
      <stop offset="45%" stop-color="#7E1828"/>
      <stop offset="100%" stop-color="#340810"/>
    </linearGradient>

    <linearGradient id="robeG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#141C30"/>
      <stop offset="35%" stop-color="#24345C"/>
      <stop offset="70%" stop-color="#24345C"/>
      <stop offset="100%" stop-color="#101626"/>
    </linearGradient>

    <linearGradient id="steelG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#CBD5E1"/>
      <stop offset="50%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>

    <radialGradient id="torchGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FF9A28" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="#FF6A18" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#FF6A18" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="starGlint" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="${gleamPulse}"/>
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="${gleamPulse * 0.8}"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#palaceBg)"/>

  <rect x="140" y="0" width="200" height="${H}" fill="url(#pillarG)" stroke="#0E0806" stroke-width="4"/>
  <line x1="180" y1="0" x2="180" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <line x1="220" y1="0" x2="220" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <line x1="260" y1="0" x2="260" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <line x1="300" y1="0" x2="300" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <circle cx="240" cy="460" r="320" fill="url(#torchGlow)"/>

  <rect x="1580" y="0" width="200" height="${H}" fill="url(#pillarG)" stroke="#0E0806" stroke-width="4"/>
  <line x1="1620" y1="0" x2="1620" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <line x1="1660" y1="0" x2="1660" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <line x1="1700" y1="0" x2="1700" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <line x1="1740" y1="0" x2="1740" y2="${H}" stroke="rgba(255,180,120,0.15)" stroke-width="2"/>
  <circle cx="1680" cy="460" r="320" fill="url(#torchGlow)"/>

  <path d="M0,0 L360,0 Q320,480 345,820 Q180,720 0,820 Z" fill="url(#velvetDrape)" stroke="#0E0806" stroke-width="4"/>
  <path d="M0,820 Q180,720 345,820" fill="none" stroke="#E5B842" stroke-width="7"/>

  <path d="M1560,0 L1920,0 L1920,820 Q1740,720 1575,820 Q1600,480 1560,0 Z" fill="url(#velvetDrape)" stroke="#0E0806" stroke-width="4"/>
  <path d="M1575,820 Q1740,720 1920,820" fill="none" stroke="#E5B842" stroke-width="7"/>

  <g id="salim-singh" transform="translate(960, 520)">
    <path d="M-110,60 Q-260,80 -440,190 L-480,560 L480,560 L440,190 Q260,80 110,60 Z" fill="url(#robeG)" stroke="#0E121E" stroke-width="5"/>

    <ellipse cx="-420" cy="200" rx="42" ry="24" fill="#E5B842" stroke="#0E121E" stroke-width="3.5" transform="rotate(-25 -420 200)"/>
    <ellipse cx="420" cy="200" rx="42" ry="24" fill="#E5B842" stroke="#0E121E" stroke-width="3.5" transform="rotate(25 420 200)"/>

    <path d="M-62,-30 Q-68,25 -95,65 L95,65 Q68,25 62,-30 Z" fill="#E4A872" stroke="#0E121E" stroke-width="4"/>
    <path d="M-62,-25 Q0,25 62,-25 Q0,45 -62,-25 Z" fill="rgba(30,12,10,0.3)"/>

    <path d="M-95,65 Q0,135 95,65 L80,92 Q0,162 -80,92 Z" fill="#E5B842" stroke="#0E121E" stroke-width="3.5"/>

    <line x1="-380" y1="210" x2="140" y2="560" stroke="#E5B842" stroke-width="16"/>
    <line x1="-380" y1="210" x2="140" y2="560" stroke="#0E121E" stroke-width="2.5"/>
    <line x1="380" y1="210" x2="-140" y2="560" stroke="#E5B842" stroke-width="16"/>
    <line x1="380" y1="210" x2="-140" y2="560" stroke="#0E121E" stroke-width="2.5"/>

    <circle cx="0" cy="180" r="11" fill="#FCE38A" stroke="#0E121E" stroke-width="2.5"/>
    <circle cx="0" cy="180" r="5" fill="#C81E2B"/>
    <circle cx="0" cy="245" r="11" fill="#FCE38A" stroke="#0E121E" stroke-width="2.5"/>
    <circle cx="0" cy="245" r="5" fill="#C81E2B"/>
    <circle cx="0" cy="310" r="11" fill="#FCE38A" stroke="#0E121E" stroke-width="2.5"/>
    <circle cx="0" cy="310" r="5" fill="#C81E2B"/>

    <path d="M-82,-120 Q-92,-55 -60,-8 Q0,25 60,-8 Q92,-55 82,-120 Z" fill="#E8AC76" stroke="#0E121E" stroke-width="4.5"/>

    <ellipse cx="-86" cy="-70" rx="14" ry="24" fill="#E8AC76" stroke="#0E121E" stroke-width="3.5"/>
    <circle cx="-86" cy="-52" r="9" fill="#E5B842" stroke="#0E121E" stroke-width="2.5"/>
    <ellipse cx="86" cy="-70" rx="14" ry="24" fill="#E8AC76" stroke="#0E121E" stroke-width="3.5"/>
    <circle cx="86" cy="-52" r="9" fill="#E5B842" stroke="#0E121E" stroke-width="2.5"/>

    <path d="M-64,-82 Q-38,-96 -12,-82 Q-38,-68 -64,-82 Z" fill="#FFF9F2" stroke="#0E121E" stroke-width="3"/>
    <circle cx="-36" cy="-82" r="10" fill="#421E0E"/>
    <circle cx="-36" cy="-82" r="5" fill="#0E121E"/>
    <circle cx="-40" cy="-85" r="3" fill="#FFF"/>
    <path d="M-66,-98 Q-38,-106 -14,-92 L-16,-88 Q-40,-100 -64,-94 Z" fill="#0E121E"/>

    <path d="M12,-82 Q38,-96 64,-82 Q38,-68 12,-82 Z" fill="#FFF9F2" stroke="#0E121E" stroke-width="3"/>
    <circle cx="40" cy="-82" r="10" fill="#421E0E"/>
    <circle cx="40" cy="-82" r="5" fill="#0E121E"/>
    <circle cx="36" cy="-85" r="3" fill="#FFF"/>
    <path d="M14,-92 Q38,-106 66,-98 L64,-94 Q40,-100 16,-88 Z" fill="#0E121E"/>

    <path d="M0,-92 L-7,-52 Q0,-42 8,-50" fill="none" stroke="#0E121E" stroke-width="4" stroke-linecap="round"/>

    <path d="M-98,-48 Q-40,-25 0,-34 Q40,-25 98,-48 Q122,-64 116,-82 Q102,-64 62,-44 L-62,-44 Q-102,-64 -116,-82 Q-122,-64 -98,-48 Z" fill="#0E121E"/>

    <ellipse cx="0" cy="-14" rx="20" ry="${8 + Math.abs(Math.sin(t * 12)) * 6}" fill="#441014" stroke="#0E121E" stroke-width="2.5"/>
    <path d="M-14,-18 Q0,-12 14,-18 Q10,-12 -14,-12 Z" fill="#FFFBF4"/>

    <ellipse cx="0" cy="-125" rx="114" ry="34" fill="#D8281E" stroke="#0E121E" stroke-width="4.5"/>
    <ellipse cx="0" cy="-158" rx="108" ry="32" fill="#B81E16" stroke="#0E121E" stroke-width="4.5"/>
    <ellipse cx="0" cy="-158" rx="100" ry="12" fill="none" stroke="#E5B842" stroke-width="8"/>
    <ellipse cx="0" cy="-190" rx="102" ry="30" fill="#D8281E" stroke="#0E121E" stroke-width="4.5"/>
    <ellipse cx="0" cy="-220" rx="92" ry="26" fill="#B81E16" stroke="#0E121E" stroke-width="4.5"/>

    <circle cx="0" cy="-242" r="18" fill="#E5B842" stroke="#0E121E" stroke-width="3"/>
    <circle cx="0" cy="-242" r="10" fill="#C81E2B"/>

    <path d="M0,-256 Q-32,-330 -10,-390 Q25,-320 0,-256 Z" fill="#FFFFFF" stroke="#0E121E" stroke-width="3.5"/>
    <line x1="0" y1="-256" x2="-10" y2="-385" stroke="#CBD5E1" stroke-width="2.5"/>

    <g transform="translate(420, 240) rotate(-14)">
      <path d="M-120,-80 L-10,0 L-40,80 L-160,20 Z" fill="#24345C" stroke="#0E121E" stroke-width="4.5"/>
      <path d="M-45,-25 L-10,0 L-25,45 L-60,20 Z" fill="#E5B842" stroke="#0E121E" stroke-width="3"/>

      <ellipse cx="0" cy="0" rx="36" ry="32" fill="#E8AC76" stroke="#0E121E" stroke-width="4"/>
      <ellipse cx="22" cy="-22" rx="12" ry="8" fill="#D69460" stroke="#0E121E" stroke-width="2.5" transform="rotate(12 22 -22)"/>
      <ellipse cx="25" cy="-7" rx="12" ry="8" fill="#D69460" stroke="#0E121E" stroke-width="2.5" transform="rotate(12 25 -7)"/>
      <ellipse cx="24" cy="8" rx="12" ry="8" fill="#D69460" stroke="#0E121E" stroke-width="2.5" transform="rotate(12 24 8)"/>
      <ellipse cx="21" cy="22" rx="12" ry="8" fill="#D69460" stroke="#0E121E" stroke-width="2.5" transform="rotate(12 21 22)"/>

      <rect x="-14" y="-45" width="28" height="90" fill="#E5B842" stroke="#0E121E" stroke-width="4"/>
      <circle cx="0" cy="52" r="18" fill="#1B7A4E" stroke="#0E121E" stroke-width="3"/>
      <ellipse cx="0" cy="-48" rx="34" ry="11" fill="#E5B842" stroke="#0E121E" stroke-width="3"/>

      <path d="M-12,-48 L12,-48 Q28,-180 72,-310 Q18,-210 -12,-48 Z" fill="url(#steelG)" stroke="#0E121E" stroke-width="4.5"/>
      <path d="M0,-55 Q18,-170 48,-270" fill="none" stroke="#94A3B8" stroke-width="4"/>

      <circle cx="68" cy="-305" r="48" fill="url(#starGlint)"/>
      <circle cx="68" cy="-305" r="7" fill="#FFFFFF"/>
    </g>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);
}

// ============================================================================
// 4. SCENE 04: Haveli Interior - Chief & Weeping Daughter (17.0s - 25.0s)
// ============================================================================
export function drawSceneChiefAndDaughter(ctx, W, H, t) {
  const tearDrop = (t * 1.8) % 1;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="chamberBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A1020"/>
      <stop offset="60%" stop-color="#120816"/>
      <stop offset="100%" stop-color="#08030A"/>
    </linearGradient>

    <linearGradient id="sunsetG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6E1838"/>
      <stop offset="45%" stop-color="#E05022"/>
      <stop offset="85%" stop-color="#F8AC38"/>
      <stop offset="100%" stop-color="#FFE07A"/>
    </linearGradient>

    <radialGradient id="diyaGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFB842" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#FF7A18" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FF7A18" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="kurtaG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E8E2D4"/>
      <stop offset="35%" stop-color="#FAF8F2"/>
      <stop offset="70%" stop-color="#FAF8F2"/>
      <stop offset="100%" stop-color="#DDD6C4"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#chamberBg)"/>

  <g id="window" transform="translate(960, 420)">
    <path d="M-280,380 L-280,-80 A280,280 0 0,1 280,-80 L280,380 Z" fill="url(#sunsetG)"/>
    <path d="M-280,240 Q-80,180 80,260 Q180,310 280,230 L280,380 L-280,380 Z" fill="#9E3A1A"/>
    <path d="M-280,380 L-280,-80 A280,280 0 0,1 280,-80 L280,380" fill="none" stroke="#483226" stroke-width="18"/>
  </g>

  <g id="diyas">
    <line x1="240" y1="0" x2="240" y2="400" stroke="#E5B842" stroke-width="3"/>
    <ellipse cx="240" cy="415" rx="26" ry="14" fill="#E5B842" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="240" cy="402" rx="7" ry="14" fill="#FFA828"/>
    <circle cx="240" cy="402" r="340" fill="url(#diyaGlow)"/>

    <line x1="1680" y1="0" x2="1680" y2="400" stroke="#E5B842" stroke-width="3"/>
    <ellipse cx="1680" cy="415" rx="26" ry="14" fill="#E5B842" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="1680" cy="402" rx="7" ry="14" fill="#FFA828"/>
    <circle cx="1680" cy="402" r="340" fill="url(#diyaGlow)"/>
  </g>

  <rect x="0" y="860" width="${W}" height="220" fill="#241B18"/>
  <line x1="0" y1="860" x2="${W}" y2="860" stroke="#110A14" stroke-width="4"/>

  <!-- Village Chief (Father - Left) -->
  <g id="chief" transform="translate(680, 560)">
    <path d="M-65,30 Q-140,45 -220,110 L-250,520 L180,520 L160,110 Q100,45 65,30 Z" fill="url(#kurtaG)" stroke="#110A14" stroke-width="4.5"/>
    <path d="M-150,95 L-50,-10 L70,200 L-40,240 Z" fill="#E86E1C" stroke="#110A14" stroke-width="3.5"/>
    <line x1="-50" y1="-10" x2="70" y2="200" stroke="#E5B842" stroke-width="6"/>

    <path d="M140,80 Q200,120 280,180 L255,220 Q180,160 120,120 Z" fill="url(#kurtaG)" stroke="#110A14" stroke-width="4"/>
    <ellipse cx="280" cy="190" rx="20" ry="16" fill="#D69864" stroke="#110A14" stroke-width="3.5" transform="rotate(25 280 190)"/>

    <path d="M-50,-40 L-55,30 L55,30 L50,-40 Z" fill="#D69864" stroke="#110A14" stroke-width="4"/>
    <ellipse cx="0" cy="-80" rx="55" ry="65" fill="#D69864" stroke="#110A14" stroke-width="4.5"/>

    <path d="M-45,-55 Q-65,20 -28,95 Q0,135 28,95 Q65,20 45,-55 Z" fill="#FFFFFF" stroke="#110A14" stroke-width="4"/>
    <path d="M-15,-10 Q-20,40 -12,80" fill="none" stroke="#DDD8CC" stroke-width="2.5"/>
    <path d="M15,-10 Q20,40 12,80" fill="none" stroke="#DDD8CC" stroke-width="2.5"/>

    <path d="M-35,-85 Q-18,-95 -2,-85 Q-18,-75 -35,-85 Z" fill="#FFF8EE" stroke="#110A14" stroke-width="2.5"/>
    <circle cx="-18" cy="-85" r="5.5" fill="#2E160C"/>
    <path d="M-36,-98 Q-18,-108 0,-94" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>

    <path d="M2,-85 Q18,-95 35,-85 Q18,-75 2,-85 Z" fill="#FFF8EE" stroke="#110A14" stroke-width="2.5"/>
    <circle cx="18" cy="-85" r="5.5" fill="#2E160C"/>
    <path d="M0,-94 Q18,-108 36,-98" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>

    <ellipse cx="0" cy="-125" rx="72" ry="26" fill="#FAF8F2" stroke="#110A14" stroke-width="4"/>
    <ellipse cx="0" cy="-152" rx="68" ry="24" fill="#EDE8DC" stroke="#110A14" stroke-width="4"/>
    <ellipse cx="0" cy="-178" rx="60" ry="22" fill="#FAF8F2" stroke="#110A14" stroke-width="4"/>
  </g>

  <!-- Weeping Daughter (Right) -->
  <g id="daughter" transform="translate(1240, 580)">
    <path d="M-55,30 Q-120,45 -180,110 L-200,500 L200,500 L180,110 Q120,45 55,30 Z" fill="#D8281E" stroke="#110A14" stroke-width="4.5"/>
    <path d="M-170,110 Q-110,40 0,20 Q110,40 170,110" fill="none" stroke="#E5B842" stroke-width="8"/>

    <path d="M-22,-40 L-24,30 L24,30 L22,-40 Z" fill="#F8D4AE" stroke="#110A14" stroke-width="3.5"/>
    <ellipse cx="0" cy="-75" rx="46" ry="54" fill="#F8D4AE" stroke="#110A14" stroke-width="3.5"/>

    <path d="M-56,-45 Q-68,-140 0,-155 Q68,-140 56,-45 Z" fill="#D8281E" stroke="#110A14" stroke-width="4"/>
    <path d="M-54,-45 Q0,-150 54,-45" fill="none" stroke="#E5B842" stroke-width="4"/>

    <line x1="0" y1="-145" x2="0" y2="-112" stroke="#E5B842" stroke-width="2.5"/>
    <circle cx="0" cy="-110" r="5" fill="#C81E2B" stroke="#110A14" stroke-width="1.5"/>

    <path d="M-26,-78 A10,10 0 0,0 -4,-78" fill="none" stroke="#110A14" stroke-width="3.5"/>
    <line x1="-22" y1="-82" x2="-26" y2="-86" stroke="#110A14" stroke-width="2"/>
    <line x1="-8" y1="-82" x2="-4" y2="-86" stroke="#110A14" stroke-width="2"/>
    <ellipse cx="-15" cy="${-68 + tearDrop * 28}" rx="3.5" ry="7" fill="#72CAFF"/>

    <path d="M4,-78 A10,10 0 0,0 26,-78" fill="none" stroke="#110A14" stroke-width="3.5"/>
    <line x1="8" y1="-82" x2="4" y2="-86" stroke="#110A14" stroke-width="2"/>
    <line x1="22" y1="-82" x2="26" y2="-86" stroke="#110A14" stroke-width="2"/>
    <ellipse cx="15" cy="${-68 + tearDrop * 28}" rx="3.5" ry="7" fill="#72CAFF"/>

    <path d="M-8,-44 Q0,-48 8,-44 Q0,-40 -8,-44 Z" fill="#8C1E2A"/>

    <path d="M-150,110 L-60,220 L-20,180 L-100,90 Z" fill="#D02C45" stroke="#110A14" stroke-width="3.5"/>
    <path d="M150,110 L60,220 L20,180 L100,90 Z" fill="#D02C45" stroke="#110A14" stroke-width="3.5"/>

    <circle cx="0" cy="185" r="18" fill="#F8D4AE" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="-12" cy="205" rx="8" ry="4" fill="#E5B842"/>
    <ellipse cx="12" cy="205" rx="8" ry="4" fill="#E5B842"/>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);
}

// ============================================================================
// 5. SCENE 05: Midnight Shiva Temple Council of 84 Chiefs (25.0s - 33.5s)
// ============================================================================
export function drawSceneTempleCouncil(ctx, W, H, t) {
  const fw1 = Math.sin(t * 14) * 10;
  const fw2 = Math.cos(t * 20) * 12;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="templeChamber" cx="0.5" cy="0.6" r="0.65">
      <stop offset="0%" stop-color="#3A1412"/>
      <stop offset="40%" stop-color="#200A14"/>
      <stop offset="75%" stop-color="#0E040A"/>
      <stop offset="100%" stop-color="#050106"/>
    </radialGradient>

    <radialGradient id="fireGlow" cx="0.5" cy="0.75" r="0.6">
      <stop offset="0%" stop-color="#FFA828" stop-opacity="1"/>
      <stop offset="30%" stop-color="#FF5A10" stop-opacity="0.6"/>
      <stop offset="65%" stop-color="#B81E0A" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#B81E0A" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="chiefKurta" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E8DFD0"/>
      <stop offset="35%" stop-color="#FAF8F2"/>
      <stop offset="70%" stop-color="#FAF8F2"/>
      <stop offset="100%" stop-color="#DDD4C0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#templeChamber)"/>

  <g id="bg-relief" opacity="0.45">
    <rect x="0" y="0" width="${W}" height="480" fill="#1A0A10"/>
    <path d="M160,320 L160,180 Q240,120 320,180 Q400,120 480,180 L480,320 Z" fill="#240E16" stroke="#0E0408" stroke-width="3"/>
    <path d="M720,320 L720,180 Q800,120 880,180 Q960,120 1040,180 L1040,320 Z" fill="#240E16" stroke="#0E0408" stroke-width="3"/>
    <path d="M1280,320 L1280,180 Q1360,120 1440,180 Q1520,120 1600,180 L1600,320 Z" fill="#240E16" stroke="#0E0408" stroke-width="3"/>
  </g>

  <circle cx="960" cy="850" r="750" fill="url(#fireGlow)"/>

  <!-- Left Chief -->
  <g id="chief-left" transform="translate(480, 480)">
    <path d="M-60,50 Q-150,70 -260,160 L-290,600 L120,600 L110,160 Q60,70 -60,50 Z" fill="url(#chiefKurta)" stroke="#0E0408" stroke-width="5"/>
    <path d="M-220,130 L-80,20 L40,240 L-100,290 Z" fill="#1E7A4A" stroke="#0E0408" stroke-width="4"/>
    <line x1="-80" y1="20" x2="40" y2="240" stroke="#E5B842" stroke-width="6"/>

    <ellipse cx="-20" cy="-60" rx="58" ry="68" fill="#D69864" stroke="#0E0408" stroke-width="4.5"/>
    <path d="M-65,-30 Q-80,40 -40,105 Q-15,135 15,105 Q55,40 40,-30 Z" fill="#CCCCCC" stroke="#0E0408" stroke-width="4"/>
    <ellipse cx="5" cy="-68" rx="8" ry="6" fill="#FFF9F2" stroke="#0E0408" stroke-width="2"/>
    <circle cx="7" cy="-68" r="4" fill="#0E0408"/>
    <path d="M-8,-80 L22,-74" stroke="#0E0408" stroke-width="4" stroke-linecap="round"/>

    <ellipse cx="-20" cy="-105" rx="76" ry="28" fill="#D8281E" stroke="#0E0408" stroke-width="4.5"/>
    <ellipse cx="-20" cy="-135" rx="72" ry="26" fill="#B81E16" stroke="#0E0408" stroke-width="4.5"/>
    <ellipse cx="-20" cy="-162" rx="64" ry="24" fill="#D8281E" stroke="#0E0408" stroke-width="4.5"/>
  </g>

  <!-- Right Chief -->
  <g id="chief-right" transform="translate(1440, 480)">
    <path d="M60,50 Q150,70 260,160 L290,600 L-120,600 L-110,160 Q-60,70 60,50 Z" fill="url(#chiefKurta)" stroke="#0E0408" stroke-width="5"/>
    <path d="M220,130 L80,20 L-40,240 L100,290 Z" fill="#8C1828" stroke="#0E0408" stroke-width="4"/>
    <line x1="80" y1="20" x2="-40" y2="240" stroke="#E5B842" stroke-width="6"/>

    <ellipse cx="20" cy="-60" rx="58" ry="68" fill="#D69864" stroke="#0E0408" stroke-width="4.5"/>
    <path d="M-40,-30 Q-55,40 -15,105 Q15,135 40,105 Q80,40 65,-30 Z" fill="#888888" stroke="#0E0408" stroke-width="4"/>
    <ellipse cx="-5" cy="-68" rx="8" ry="6" fill="#FFF9F2" stroke="#0E0408" stroke-width="2"/>
    <circle cx="-7" cy="-68" r="4" fill="#0E0408"/>
    <path d="M-22,-74 L8,-80" stroke="#0E0408" stroke-width="4" stroke-linecap="round"/>

    <ellipse cx="20" cy="-105" rx="76" ry="28" fill="#E5B842" stroke="#0E0408" stroke-width="4.5"/>
    <ellipse cx="20" cy="-135" rx="72" ry="26" fill="#C89A2E" stroke="#0E0408" stroke-width="4.5"/>
    <ellipse cx="20" cy="-162" rx="64" ry="24" fill="#E5B842" stroke="#0E0408" stroke-width="4.5"/>
  </g>

  <!-- Central Patriarch Chief in Defiance -->
  <g id="head-chief" transform="translate(960, 420)">
    <path d="M-80,40 Q-200,65 -340,160 L-370,660 L370,660 L340,160 Q200,65 80,40 Z" fill="url(#chiefKurta)" stroke="#0E0408" stroke-width="5"/>
    <path d="M-260,150 L-90,-10 L80,260 L-70,310 Z" fill="#E86E1C" stroke="#0E0408" stroke-width="4.5"/>
    <line x1="-90" y1="-10" x2="80" y2="260" stroke="#E5B842" stroke-width="8"/>

    <path d="M-55,-40 L-60,40 L60,40 L55,-40 Z" fill="#D69864" stroke="#0E0408" stroke-width="4"/>
    <ellipse cx="0" cy="-85" rx="72" ry="84" fill="#D69864" stroke="#0E0408" stroke-width="5"/>

    <path d="M-60,-50 Q-85,35 -38,135 Q0,185 38,135 Q85,35 60,-50 Z" fill="#FFFFFF" stroke="#0E0408" stroke-width="4.5"/>
    <path d="M-20,0 Q-25,60 -15,115" fill="none" stroke="#DCD6C8" stroke-width="3"/>
    <path d="M20,0 Q25,60 15,115" fill="none" stroke="#DCD6C8" stroke-width="3"/>

    <rect x="-5" y="-140" width="10" height="28" rx="4" fill="#D8281E"/>
    <circle cx="0" cy="-105" r="4" fill="#E5B842"/>

    <path d="M-45,-90 Q-24,-102 -4,-90 Q-24,-80 -45,-90 Z" fill="#FFF8EE" stroke="#0E0408" stroke-width="3"/>
    <circle cx="-24" cy="-90" r="7" fill="#2E160C"/>
    <circle cx="-26" cy="-92" r="2.5" fill="#FFFFFF"/>
    <path d="M-48,-106 Q-24,-116 -2,-100" fill="none" stroke="#0E0408" stroke-width="5" stroke-linecap="round"/>

    <path d="M4,-90 Q24,-102 45,-90 Q24,-80 4,-90 Z" fill="#FFF8EE" stroke="#0E0408" stroke-width="3"/>
    <circle cx="24" cy="-90" r="7" fill="#2E160C"/>
    <circle cx="22" cy="-92" r="2.5" fill="#FFFFFF"/>
    <path d="M2,-100 Q24,-116 48,-106" fill="none" stroke="#0E0408" stroke-width="5" stroke-linecap="round"/>

    <path d="M0,-95 L-6,-55 Q0,-45 8,-52" fill="none" stroke="#0E0408" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M-14,-32 Q0,-26 14,-32" fill="none" stroke="#4A1810" stroke-width="4" stroke-linecap="round"/>

    <ellipse cx="0" cy="-135" rx="98" ry="34" fill="#F26E20" stroke="#0E0408" stroke-width="5"/>
    <ellipse cx="0" cy="-170" rx="92" ry="32" fill="#E05510" stroke="#0E0408" stroke-width="5"/>
    <ellipse cx="0" cy="-205" rx="82" ry="28" fill="#F26E20" stroke="#0E0408" stroke-width="5"/>
  </g>

  <!-- Foreground Roaring Sacred Havan Fire -->
  <g id="fg-fire" transform="translate(960, 940)">
    <polygon points="-480,140 480,140 540,240 -540,240" fill="#32120C" stroke="#0E0408" stroke-width="6"/>
    <polygon points="-400,140 400,140 440,200 -440,200" fill="#1E0A06" stroke="#0E0408" stroke-width="4"/>

    <path d="M-220,140 Q${-110 + fw1},-120 ${0 + fw2},-340 Q${110 - fw1},-120 220,140 Z" fill="#D41E0E"/>
    <path d="M-160,140 Q${-75 + fw2},-90 ${0 + fw1},-260 Q${75 - fw2},-90 160,140 Z" fill="#FF5E10"/>
    <path d="M-100,140 Q${-35 + fw1},-50 0,-180 Q${35 - fw1},-50 100,140 Z" fill="#FFAE18"/>
    <path d="M-50,140 Q0,-20 0,-100 Q0,-20 50,140 Z" fill="#FFFDE0"/>

    <circle cx="${-60 + fw1}" cy="-360" r="6" fill="#FFAE18"/>
    <circle cx="${45 + fw2}" cy="-400" r="5" fill="#FF5E10"/>
    <circle cx="${-15 + fw2}" cy="-450" r="4.5" fill="#FFAE18"/>
    <circle cx="${80 - fw1}" cy="-480" r="4" fill="#FFFDE0"/>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);
}

// ============================================================================
// 6. SCENE 06: Thar Desert Midnight Silent Exodus (33.5s - 39.5s)
// ============================================================================
export function drawSceneNightExodus(ctx, W, H, t) {
  const st = t >= 33.5 ? t - 33.5 : t; // Handles both local shot time and global time
  const walkPhase = st * 5;
  const leg1 = Math.sin(walkPhase) * 22;
  const leg2 = -Math.sin(walkPhase) * 22;

  const caravanX = W * 0.75 - (st / 6.0) * 600;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="exodusSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#04060E"/>
      <stop offset="45%" stop-color="#0B1226"/>
      <stop offset="75%" stop-color="#161C36"/>
      <stop offset="100%" stop-color="#241E34"/>
    </linearGradient>

    <radialGradient id="fullMoonGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFFDF0" stop-opacity="1"/>
      <stop offset="25%" stop-color="#FFEAA8" stop-opacity="0.45"/>
      <stop offset="65%" stop-color="#FFEAA8" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#FFEAA8" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="lanternGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFB842" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#FF7A18" stop-opacity="0.4"/>
      <stop offset="80%" stop-color="#FF7A18" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#FF7A18" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#exodusSky)"/>

  <circle cx="1450" cy="240" r="320" fill="url(#fullMoonGlow)"/>
  <circle cx="1450" cy="240" r="75" fill="#FFF8E2"/>

  <path d="M0,${H * 0.58} Q${W * 0.3},${H * 0.52} ${W * 0.65},${H * 0.59} T${W},${H * 0.55} L${W},${H} L0,${H} Z" fill="#0D1424"/>
  <path d="M0,${H * 0.68} Q${W * 0.45},${H * 0.72} ${W * 0.8},${H * 0.66} L${W},${H} L0,${H} Z" fill="#151C30"/>
  <path d="M0,${H * 0.8} Q${W * 0.4},${H * 0.72} ${W},${H * 0.76} L${W},${H} L0,${H} Z" fill="#1C223A" stroke="#0E121E" stroke-width="3"/>
  <path d="M0,${H * 0.88} Q${W * 0.5},${H * 0.84} ${W},${H * 0.9} L${W},${H} L0,${H} Z" fill="#121626"/>

  <g id="caravan" transform="translate(${caravanX}, 0)">
    <!-- Camel 1 -->
    <g transform="translate(0, 770) scale(1.6)">
      <ellipse cx="0" cy="5" rx="80" ry="12" fill="rgba(8,10,18,0.5)"/>

      <line x1="-40" y1="-70" x2="${-40 + Math.sin(rad(leg1)) * 26}" y2="-35" stroke="#080C16" stroke-width="11" stroke-linecap="round"/>
      <line x1="${-40 + Math.sin(rad(leg1)) * 26}" y1="-35" x2="${-40 + Math.sin(rad(leg1 * 0.7)) * 26}" y2="0" stroke="#080C16" stroke-width="9" stroke-linecap="round"/>

      <line x1="-25" y1="-70" x2="${-25 - Math.sin(rad(leg1)) * 26}" y2="-35" stroke="#0E1422" stroke-width="11" stroke-linecap="round"/>
      <line x1="${-25 - Math.sin(rad(leg1)) * 26}" y1="-35" x2="${-25 - Math.sin(rad(leg1 * 0.7)) * 26}" y2="0" stroke="#0E1422" stroke-width="9" stroke-linecap="round"/>

      <line x1="35" y1="-70" x2="${35 + Math.sin(rad(leg2)) * 26}" y2="-35" stroke="#080C16" stroke-width="11" stroke-linecap="round"/>
      <line x1="${35 + Math.sin(rad(leg2)) * 26}" y1="-35" x2="${35 + Math.sin(rad(leg2 * 0.7)) * 26}" y2="0" stroke="#080C16" stroke-width="9" stroke-linecap="round"/>

      <line x1="50" y1="-70" x2="${50 - Math.sin(rad(leg2)) * 26}" y2="-35" stroke="#0E1422" stroke-width="11" stroke-linecap="round"/>
      <line x1="${50 - Math.sin(rad(leg2)) * 26}" y1="-35" x2="${50 - Math.sin(rad(leg2 * 0.7)) * 26}" y2="0" stroke="#0E1422" stroke-width="9" stroke-linecap="round"/>

      <path d="M60,-70 Q45,-90 20,-80 Q0,-120 -15,-80 Q-45,-90 -65,-70 Q-55,-40 0,-40 Q55,-40 60,-70 Z" fill="#080C16"/>
      <path d="M-50,-65 Q-80,-60 -95,-105 Q-100,-135 -112,-140 Q-128,-145 -132,-135 Q-120,-120 -105,-115 Q-90,-75 -60,-50 Z" fill="#080C16"/>
      <ellipse cx="-118" cy="-140" rx="14" ry="10" fill="#080C16" transform="rotate(15 -118 -140)"/>
      <ellipse cx="-106" cy="-150" rx="4" ry="8" fill="#080C16" transform="rotate(18 -106 -150)"/>

      <ellipse cx="-10" cy="-90" rx="20" ry="15" fill="#0E1422"/>
      <ellipse cx="14" cy="-90" rx="20" ry="15" fill="#0E1422"/>
      <rect x="-24" y="-82" width="48" height="24" fill="#080C16"/>
    </g>

    <path d="M100,680 Q230,730 360,680" fill="none" stroke="#080C16" stroke-width="3.5"/>

    <!-- Camel 2 -->
    <g transform="translate(450, 780) scale(1.6)">
      <ellipse cx="0" cy="5" rx="80" ry="12" fill="rgba(8,10,18,0.5)"/>

      <line x1="-40" y1="-70" x2="${-40 + Math.sin(rad(leg2)) * 26}" y2="-35" stroke="#080C16" stroke-width="11" stroke-linecap="round"/>
      <line x1="${-40 + Math.sin(rad(leg2)) * 26}" y1="-35" x2="${-40 + Math.sin(rad(leg2 * 0.7)) * 26}" y2="0" stroke="#080C16" stroke-width="9" stroke-linecap="round"/>

      <line x1="-25" y1="-70" x2="${-25 - Math.sin(rad(leg2)) * 26}" y2="-35" stroke="#0E1422" stroke-width="11" stroke-linecap="round"/>
      <line x1="${-25 - Math.sin(rad(leg2)) * 26}" y1="-35" x2="${-25 - Math.sin(rad(leg2 * 0.7)) * 26}" y2="0" stroke="#0E1422" stroke-width="9" stroke-linecap="round"/>

      <line x1="35" y1="-70" x2="${35 + Math.sin(rad(leg1)) * 26}" y2="-35" stroke="#080C16" stroke-width="11" stroke-linecap="round"/>
      <line x1="${35 + Math.sin(rad(leg1)) * 26}" y1="-35" x2="${35 + Math.sin(rad(leg1 * 0.7)) * 26}" y2="0" stroke="#080C16" stroke-width="9" stroke-linecap="round"/>

      <line x1="50" y1="-70" x2="${50 - Math.sin(rad(leg1)) * 26}" y2="-35" stroke="#0E1422" stroke-width="11" stroke-linecap="round"/>
      <line x1="${50 - Math.sin(rad(leg1)) * 26}" y1="-35" x2="${50 - Math.sin(rad(leg1 * 0.7)) * 26}" y2="0" stroke="#0E1422" stroke-width="9" stroke-linecap="round"/>

      <path d="M60,-70 Q45,-90 20,-80 Q0,-120 -15,-80 Q-45,-90 -65,-70 Q-55,-40 0,-40 Q55,-40 60,-70 Z" fill="#080C16"/>
      <path d="M-50,-65 Q-80,-60 -95,-105 Q-100,-135 -112,-140 Q-128,-145 -132,-135 Q-120,-120 -105,-115 Q-90,-75 -60,-50 Z" fill="#080C16"/>
      <ellipse cx="-118" cy="-140" rx="14" ry="10" fill="#080C16" transform="rotate(15 -118 -140)"/>
      <ellipse cx="-106" cy="-150" rx="4" ry="8" fill="#080C16" transform="rotate(18 -106 -150)"/>

      <ellipse cx="-10" cy="-90" rx="22" ry="16" fill="#0E1422"/>
      <ellipse cx="14" cy="-90" rx="22" ry="16" fill="#0E1422"/>
    </g>

    <!-- Caravan Leader with Lantern -->
    <g transform="translate(-260, 780) scale(1.3)">
      <ellipse cx="0" cy="5" rx="35" ry="10" fill="rgba(8,10,18,0.5)"/>
      <line x1="-12" y1="-65" x2="${-12 + Math.sin(rad(leg1)) * 18}" y2="0" stroke="#080C16" stroke-width="12" stroke-linecap="round"/>
      <line x1="12" y1="-65" x2="${12 - Math.sin(rad(leg1)) * 18}" y2="0" stroke="#080C16" stroke-width="12" stroke-linecap="round"/>

      <path d="M-22,-145 L22,-145 L26,-65 L-26,-65 Z" fill="#080C16"/>
      <ellipse cx="0" cy="-170" rx="20" ry="24" fill="#080C16"/>
      <ellipse cx="0" cy="-184" rx="26" ry="14" fill="#080C16"/>

      <line x1="28" y1="-140" x2="38" y2="0" stroke="#080C16" stroke-width="4.5"/>

      <line x1="-18" y1="-135" x2="-45" y2="-100" stroke="#080C16" stroke-width="7" stroke-linecap="round"/>
      <line x1="-45" y1="-100" x2="-45" y2="-75" stroke="#E5B842" stroke-width="2.5"/>
      <rect x="-54" y="-75" width="18" height="26" rx="4" fill="#080C16"/>
      <rect x="-51" y="-71" width="12" height="18" fill="#FFF2AA"/>

      <circle cx="-45" cy="-62" r="160" fill="url(#lanternGlow)"/>
    </g>

    <!-- Woman carrying water pot -->
    <g transform="translate(-420, 790) scale(1.25)">
      <ellipse cx="0" cy="5" rx="30" ry="8" fill="rgba(8,10,18,0.5)"/>
      <line x1="-10" y1="-60" x2="${-10 + Math.sin(rad(leg2)) * 16}" y2="0" stroke="#080C16" stroke-width="10" stroke-linecap="round"/>
      <line x1="10" y1="-60" x2="${10 - Math.sin(rad(leg2)) * 16}" y2="0" stroke="#080C16" stroke-width="10" stroke-linecap="round"/>

      <polygon points="-24,-50 24,-50 16,-125 -16,-125" fill="#080C16"/>
      <path d="M-18,-125 Q-26,-150 0,-165 Q26,-150 18,-125 Z" fill="#080C16"/>

      <ellipse cx="0" cy="-182" rx="20" ry="18" fill="#080C16"/>
      <ellipse cx="0" cy="-196" rx="10" ry="5" fill="#080C16"/>

      <path d="M-16,-125 L-22,-165 L-14,-180" fill="none" stroke="#080C16" stroke-width="5" stroke-linecap="round"/>
      <path d="M16,-125 L22,-165 L14,-180" fill="none" stroke="#080C16" stroke-width="5" stroke-linecap="round"/>
    </g>

    <!-- Second Lantern Bearer -->
    <g transform="translate(240, 775) scale(1.2)">
      <ellipse cx="0" cy="5" rx="30" ry="8" fill="rgba(8,10,18,0.5)"/>
      <line x1="-10" y1="-65" x2="${-10 + Math.sin(rad(leg1)) * 16}" y2="0" stroke="#080C16" stroke-width="11" stroke-linecap="round"/>
      <line x1="10" y1="-65" x2="${10 - Math.sin(rad(leg1)) * 16}" y2="0" stroke="#080C16" stroke-width="11" stroke-linecap="round"/>
      <polygon points="-20,-60 20,-60 18,-140 -18,-140" fill="#080C16"/>
      <ellipse cx="0" cy="-160" rx="18" ry="22" fill="#080C16"/>
      <ellipse cx="0" cy="-172" rx="24" ry="12" fill="#080C16"/>

      <line x1="-15" y1="-130" x2="-35" y2="-90" stroke="#080C16" stroke-width="6" stroke-linecap="round"/>
      <line x1="-35" y1="-90" x2="-35" y2="-70" stroke="#E5B842" stroke-width="2.5"/>
      <rect x="-42" y="-70" width="14" height="20" rx="3" fill="#080C16"/>
      <rect x="-40" y="-67" width="10" height="14" fill="#FFF2AA"/>
      <circle cx="-35" cy="-60" r="140" fill="url(#lanternGlow)"/>
    </g>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);
}

// ============================================================================
// 7. SCENE 07: Village Elder Flaming Torch & Kamandalu Curse (39.5s - 49.2s)
// ============================================================================
export function drawSceneElderCurse(ctx, W, H, t) {
  const st = t >= 39.5 ? t - 39.5 : t;
  const fw1 = Math.sin(st * 18) * 12;
  const fw2 = Math.cos(st * 24) * 16;
  const windCloth = Math.sin(st * 10) * 14;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="curseSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#140208"/>
      <stop offset="35%" stop-color="#380818"/>
      <stop offset="70%" stop-color="#5A1028"/>
      <stop offset="100%" stop-color="#240610"/>
    </linearGradient>

    <radialGradient id="torchFireGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFA828" stop-opacity="1"/>
      <stop offset="30%" stop-color="#FF5A10" stop-opacity="0.6"/>
      <stop offset="70%" stop-color="#C8180E" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#C8180E" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="robeShading" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#DDD6C6"/>
      <stop offset="35%" stop-color="#FAF8F2"/>
      <stop offset="75%" stop-color="#FAF8F2"/>
      <stop offset="100%" stop-color="#C8C0AE"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#curseSky)"/>

  <!-- Jagged Lightning Bolts -->
  <g id="lightning" stroke="#FFE2E8" stroke-linecap="round">
    <path d="M420,0 L450,140 L380,240 L440,380 L390,480" fill="none" stroke-width="4.5"/>
    <path d="M450,140 L520,220 L490,290" fill="none" stroke-width="2.5" stroke-opacity="0.7"/>
    <path d="M1520,0 L1480,160 L1560,260 L1510,400" fill="none" stroke-width="4"/>
  </g>

  <!-- Distant Kuldhara Fortress Battlements -->
  <rect x="0" y="700" width="${W}" height="380" fill="#200A12" stroke="#0E0408" stroke-width="5"/>
  <path d="M0,700 L0,630 L90,630 L90,700 L160,700 L160,630 L250,630 L250,700 L320,700 L320,630 L410,630 L410,700 L480,700 L480,630 L570,630 L570,700 L640,700 L640,630 L730,630 L730,700 L800,700 L800,630 L890,630 L890,700 L960,700 L960,630 L1050,630 L1050,700 L1120,700 L1120,630 L1210,630 L1210,700 L1280,700 L1280,630 L1370,630 L1370,700 L1440,700 L1440,630 L1530,630 L1530,700 L1600,700 L1600,630 L1690,630 L1690,700 L1760,700 L1760,630 L1850,630 L1850,700 L1920,700 L1920,1080 L0,1080 Z" fill="#280E16" stroke="#0E0408" stroke-width="4"/>

  <!-- Village Elder Heroic Figure -->
  <g id="elder" transform="translate(960, 500)">
    <path d="M-90,60 Q-240,90 -420,240 L${-440 + windCloth},620 L440,620 L400,200 Q260,80 90,60 Z" fill="url(#robeShading)" stroke="#0E0408" stroke-width="5"/>
    <path d="M-300,210 L-90,-10 L80,260 L${-90 + windCloth},350 Z" fill="#E86E1C" stroke="#0E0408" stroke-width="4.5"/>
    <line x1="-90" y1="-10" x2="80" y2="260" stroke="#E5B842" stroke-width="8"/>

    <!-- Left Arm & Kamandalu -->
    <path d="M-220,170 Q-260,260 -290,340 L-235,355 Q-210,270 -170,195 Z" fill="url(#robeShading)" stroke="#0E0408" stroke-width="4.5"/>
    <path d="M-280,335 L-310,430 L-270,440 L-245,350 Z" fill="#D69864" stroke="#0E0408" stroke-width="4"/>
    <ellipse cx="-290" cy="435" rx="18" ry="16" fill="#D69864" stroke="#0E0408" stroke-width="3"/>

    <g transform="translate(-290, 460)">
      <path d="M-20,-15 Q0,-35 20,-15" fill="none" stroke="#E5B842" stroke-width="5"/>
      <path d="M-24,5 L-42,12 L-40,20 L-22,12 Z" fill="#C89A2E" stroke="#0E0408" stroke-width="2.5"/>
      <ellipse cx="0" cy="20" rx="32" ry="28" fill="#E5B842" stroke="#0E0408" stroke-width="3.5"/>
      <ellipse cx="0" cy="18" rx="26" ry="20" fill="#F8E298"/>
      <path d="M-42,16 Q-65,90 -55,180" fill="none" stroke="#72CAFF" stroke-width="4.5" stroke-linecap="round"/>
      <ellipse cx="-55" cy="180" rx="12" ry="6" fill="#72CAFF"/>
    </g>

    <!-- Right Arm & Torch -->
    <path d="M190,140 Q280,90 350,30 L380,85 Q300,150 210,195 Z" fill="url(#robeShading)" stroke="#0E0408" stroke-width="4.5"/>
    <path d="M335,45 L380,-85 L425,-75 L375,55 Z" fill="#D69864" stroke="#0E0408" stroke-width="4"/>
    <ellipse cx="400" cy="-85" rx="24" ry="20" fill="#D69864" stroke="#0E0408" stroke-width="3.5" transform="rotate(-20 400 -85)"/>

    <rect x="390" y="-230" width="18" height="190" fill="#422416" stroke="#0E0408" stroke-width="3.5" transform="rotate(-10 400 -130)"/>
    <polygon points="365,-230 425,-230 415,-205 375,-205" fill="#221C18" stroke="#0E0408" stroke-width="3.5"/>

    <circle cx="395" cy="-330" r="540" fill="url(#torchFireGlow)"/>
    <path d="M370,-225 Q${310 + fw1},-350 ${395 + fw2},-480 Q${495 - fw1},-350 420,-225 Z" fill="#D41E0E"/>
    <path d="M377,-225 Q${330 + fw2},-320 ${395 + fw1},-430 Q${465 - fw2},-320 413,-225 Z" fill="#FF5E10"/>
    <path d="M385,-225 Q${360 + fw1},-285 395,-365 Q${430 - fw1},-285 405,-225 Z" fill="#FFAE18"/>
    <path d="M390,-225 Q393,-260 395,-300 Q397,-260 400,-225 Z" fill="#FFFDE0"/>

    <circle cx="${340 + fw1}" cy="-470" r="5.5" fill="#FFAE18"/>
    <circle cx="${450 + fw2}" cy="-520" r="5" fill="#FF5E10"/>
    <circle cx="${300 + fw2}" cy="-560" r="4" fill="#FFAE18"/>

    <path d="M-55,-40 L-60,40 L60,40 L55,-40 Z" fill="#D69864" stroke="#0E0408" stroke-width="4"/>
    <ellipse cx="0" cy="-80" rx="72" ry="82" fill="#D69864" stroke="#0E0408" stroke-width="5"/>
    <path d="M-55,-45 Q${-90 + windCloth},40 ${-50 + windCloth},155 Q${0 + windCloth},205 ${50 + windCloth},155 Q80,40 55,-45 Z" fill="#FFFFFF" stroke="#0E0408" stroke-width="4.5"/>

    <ellipse cx="0" cy="-30" rx="20" ry="${18 + Math.abs(Math.sin(st * 12)) * 7}" fill="#320C12" stroke="#0E0408" stroke-width="3.5"/>
    <path d="M-14,-42 Q0,-35 14,-42 Q10,-35 -14,-35 Z" fill="#FFFBF4"/>

    <path d="M-45,-85 Q-24,-98 -4,-85 Q-24,-74 -45,-85 Z" fill="#FFF8EE" stroke="#0E0408" stroke-width="3"/>
    <circle cx="-24" cy="-85" r="7" fill="#2E160C"/>
    <circle cx="-26" cy="-87" r="2.5" fill="#FFFFFF"/>
    <path d="M-48,-102 Q-24,-112 -2,-96" fill="none" stroke="#0E0408" stroke-width="5.5" stroke-linecap="round"/>

    <path d="M4,-85 Q24,-98 45,-85 Q24,-74 4,-85 Z" fill="#FFF8EE" stroke="#0E0408" stroke-width="3"/>
    <circle cx="24" cy="-85" r="7" fill="#2E160C"/>
    <circle cx="22" cy="-87" r="2.5" fill="#FFFFFF"/>
    <path d="M2,-96 Q24,-112 48,-102" fill="none" stroke="#0E0408" stroke-width="5.5" stroke-linecap="round"/>

    <ellipse cx="0" cy="-130" rx="96" ry="34" fill="#FAF8F2" stroke="#0E0408" stroke-width="5"/>
    <ellipse cx="0" cy="-165" rx="90" ry="32" fill="#EDE8DC" stroke="#0E0408" stroke-width="5"/>
    <ellipse cx="0" cy="-198" rx="80" ry="28" fill="#FAF8F2" stroke="#0E0408" stroke-width="5"/>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);

  // Directly render HarfBuzz Devanagari text on Canvas
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFC838";
  ctx.font = "bold 34px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("॥ यह भूमि हमेशा के लिए निर्जन और शापित रहेगी ॥", W * 0.5, 160);

  ctx.fillStyle = "#FFAE28";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText('"NO SOUL SHALL EVER SETTLE HERE AGAIN"', W * 0.5, 205);
  ctx.restore();
}

// ============================================================================
// 8. SCENE 08: Abandoned Morning Kitchen (49.2s - 54.5s)
// ============================================================================
export function drawSceneAbandonedKitchen(ctx, W, H, t) {
  const smokeWobble = Math.sin(t * 3) * 15;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="mudWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C89662"/>
      <stop offset="60%" stop-color="#A87242"/>
      <stop offset="100%" stop-color="#8A5832"/>
    </linearGradient>

    <linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF8E0" stop-opacity="0.6"/>
      <stop offset="40%" stop-color="#FFDE90" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#FFDE90" stop-opacity="0"/>
    </linearGradient>

    <radialGradient id="emberGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FF4818" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#FF8A24" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#FF8A24" stop-opacity="0"/>
    </radialGradient>

    <pattern id="mudPlaster" width="80" height="40" patternUnits="userSpaceOnUse">
      <rect width="80" height="40" fill="#B6804E"/>
      <line x1="0" y1="0" x2="80" y2="0" stroke="#9A6638" stroke-width="1.5"/>
      <line x1="0" y1="20" x2="80" y2="20" stroke="#9A6638" stroke-width="1.5"/>
      <circle cx="20" cy="10" r="2" fill="#88552C"/>
      <circle cx="60" cy="30" r="2" fill="#88552C"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#mudWall)"/>
  <rect width="${W}" height="${H * 0.8}" fill="url(#mudPlaster)" opacity="0.3"/>

  <path d="M180,480 L180,260 Q260,200 340,260 L340,480 Z" fill="#6A4222" stroke="#4A2A12" stroke-width="4"/>
  <ellipse cx="260" cy="460" rx="42" ry="16" fill="#8C5832" stroke="#4A2A12" stroke-width="2.5"/>
  <ellipse cx="260" cy="425" rx="34" ry="14" fill="#A87042" stroke="#4A2A12" stroke-width="2.5"/>
  <ellipse cx="260" cy="395" rx="26" ry="12" fill="#C28652" stroke="#4A2A12" stroke-width="2.5"/>

  <path d="M1540,460 L1540,280 Q1610,230 1680,280 L1680,460 Z" fill="#6A4222" stroke="#4A2A12" stroke-width="4"/>
  <ellipse cx="1610" cy="445" rx="28" ry="12" fill="#E5B842" stroke="#4A2A12" stroke-width="2"/>
  <ellipse cx="1610" cy="435" rx="6" ry="12" fill="#FF8A18"/>

  <path d="M520,${H * 0.82} L520,240 Q680,140 840,240 L840,${H * 0.82} Z" fill="#FFF2CC" stroke="#3A1E0E" stroke-width="6"/>
  <path d="M520,680 Q680,620 840,660 L840,${H * 0.82} L520,${H * 0.82} Z" fill="#E8A654"/>
  <circle cx="680" cy="420" r="140" fill="#FFFBF0"/>

  <polygon points="520,240 840,240 1480,${H} 0,${H}" fill="url(#sunbeam)"/>

  <rect x="0" y="${H * 0.82}" width="${W}" height="${H * 0.18}" fill="#784A28" stroke="#3A1E0E" stroke-width="5"/>

  <g id="chulha" transform="translate(1260, ${H * 0.82})">
    <path d="M-130,20 Q-150,-60 0,-70 Q150,-60 130,20 Z" fill="#8C522E" stroke="#3A1E0E" stroke-width="4.5"/>
    <ellipse cx="0" cy="-68" rx="85" ry="24" fill="#221C18" stroke="#110A14" stroke-width="3"/>
    <ellipse cx="-15" cy="-70" rx="55" ry="16" fill="#F4DCA8" stroke="#684A2C" stroke-width="2.5"/>
    <ellipse cx="8" cy="-72" rx="14" ry="4" fill="#8C5E32"/>

    <path d="M-75,15 Q0,-35 75,15 Z" fill="#240E06"/>
    <circle cx="0" cy="5" r="90" fill="url(#emberGlow)"/>
    <ellipse cx="0" cy="5" rx="42" ry="14" fill="#FF5214"/>
    <ellipse cx="0" cy="5" rx="22" ry="7" fill="#FFAE28"/>

    <path d="M-10,-90 Q${-25 + smokeWobble},-160 -5,-240 Q${15 - smokeWobble},-320 -15,-400" fill="none" stroke="rgba(255,245,230,0.35)" stroke-width="12" stroke-linecap="round"/>
    <path d="M10,-85 Q${35 - smokeWobble},-150 15,-230 Q${-5 + smokeWobble},-310 20,-390" fill="none" stroke="rgba(255,245,230,0.25)" stroke-width="8" stroke-linecap="round"/>
  </g>

  <g id="brass-vessels" transform="translate(940, ${H * 0.87})">
    <ellipse cx="0" cy="0" rx="90" ry="32" fill="#E5B842" stroke="#3A1E0E" stroke-width="4"/>
    <ellipse cx="0" cy="-2" rx="72" ry="24" fill="#F6D678"/>
    <circle cx="-35" cy="-6" r="18" fill="#C88E28" stroke="#3A1E0E" stroke-width="2"/>
    <circle cx="-35" cy="-6" r="14" fill="#E86E18"/>
    <circle cx="25" cy="-8" r="16" fill="#C88E28" stroke="#3A1E0E" stroke-width="2"/>
    <circle cx="25" cy="-8" r="12" fill="#F8E8C8"/>

    <g transform="translate(130, -10)">
      <ellipse cx="0" cy="15" rx="34" ry="12" fill="#C89A2E" stroke="#3A1E0E" stroke-width="3"/>
      <path d="M-30,12 Q-42,-20 -20,-45 L20,-45 Q42,-20 30,12 Z" fill="#E5B842" stroke="#3A1E0E" stroke-width="3"/>
      <ellipse cx="0" cy="-45" rx="24" ry="8" fill="#F8E298" stroke="#3A1E0E" stroke-width="2.5"/>
    </g>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);

  // Floating dust motes in sunbeam
  for (let m = 0; m < 30; m++) {
    const mx = 600 + (m * 23.7) % 650;
    const my = 280 + ((t * 40 + m * 55) % (H * 0.55));
    ellipse(ctx, mx, my, 2, 2);
    ctx.fillStyle = "rgba(255, 245, 210, 0.65)";
    ctx.fill();
  }
}

// ============================================================================
// 9. SCENE 09: Desert Dunes Footprint Paradox (54.5s - 58.5s)
// ============================================================================
export function drawSceneFootprintParadox(ctx, W, H, t) {
  const skyG = ctx.createLinearGradient(0, 0, 0, H);
  skyG.addColorStop(0, "#3668A6");
  skyG.addColorStop(0.5, "#E88856");
  skyG.addColorStop(1, "#F8CA76");
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, W, H);

  poly(ctx, [[0, H * 0.52], [W * 0.45, H * 0.46], [W, H * 0.56], [W, H], [0, H]]);
  ctx.fillStyle = "#E89646";
  ctx.fill();

  poly(ctx, [[0, H * 0.68], [W * 0.6, H * 0.64], [W, H * 0.72], [W, H], [0, H]]);
  ctx.fillStyle = "#F2AB52";
  ctx.fill();

  for (let r = 0; r < 14; r++) {
    const ry = H * 0.7 + r * 24;
    line(ctx, [[W * 0.08, ry], [W * 0.42, ry + 8], [W * 0.88, ry - 6]], 2.5, "#D27E30");
  }

  const scanX = W * 0.5 + Math.sin(t * 2.2) * (W * 0.2);
  const scanY = H * 0.78;

  ctx.save();
  ctx.strokeStyle = "#00E5FF";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(scanX, scanY, 80, 0, Math.PI * 2);
  ctx.stroke();

  line(ctx, [[scanX - 100, scanY], [scanX + 100, scanY]], 2, "#00E5FF");
  line(ctx, [[scanX, scanY - 100], [scanX, scanY + 100]], 2, "#00E5FF");

  ctx.fillStyle = "#00E5FF";
  ctx.font = "bold 26px monospace";
  ctx.fillText("[0 FOOTPRINTS // PRISTINE SAND DUNES]", scanX - 220, scanY - 115);
  ctx.font = "20px monospace";
  ctx.fillText("LAT: 27.18° N  LON: 70.79° E", scanX - 160, scanY + 125);
  ctx.restore();
}

// ============================================================================
// 10. SCENE 10: Official ASI Warning Board at Ruins Gate (58.5s - 64.0s)
// ============================================================================
export function drawSceneASIGate(ctx, W, H, t) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#161424");
  bgGrad.addColorStop(0.7, "#281E2E");
  bgGrad.addColorStop(1, "#362824");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  for (const px of [W * 0.16, W * 0.84]) {
    ctx.fillStyle = "#3C2E24";
    ctx.fillRect(px - 60, H * 0.2, 120, H * 0.8);
    stroke(ctx, 4.5, DARK_INK);
  }

  for (let b = 0; b < 11; b++) {
    const by = H * 0.42 + b * 46;
    line(ctx, [[W * 0.18, by], [W * 0.82, by]], 5.5, "#221A16");
  }
  for (let gx = W * 0.22; gx < W * 0.8; gx += 55) {
    line(ctx, [[gx, H * 0.38], [gx, H * 0.94]], 6.5, "#221A16");
  }

  const bx = W * 0.5, by = H * 0.54;
  const bw = 740, bh = 320;

  poly(ctx, [[bx - bw / 2, by - bh / 2], [bx + bw / 2, by - bh / 2], [bx + bw / 2, by + bh / 2], [bx - bw / 2, by + bh / 2]]);
  ctx.fillStyle = "#103E78";
  ctx.fill();
  stroke(ctx, 6, "#FFFFFF");

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px 'Noto Sans Devanagari', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("भारतीय पुरातत्व सर्वेक्षण (ASI)", bx, by - bh * 0.28);
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("ARCHAEOLOGICAL SURVEY OF INDIA", bx, by - bh * 0.14);

  line(ctx, [[bx - bw * 0.42, by - bh * 0.05], [bx + bw * 0.42, by - bh * 0.05]], 3.5, GOLD);

  ctx.fillStyle = GOLD;
  ctx.font = "bold 30px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("चेतावनी: सूर्यास्त के बाद प्रवेश सख्त मना है", bx, by + bh * 0.13);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("ENTRY STRICTLY PROHIBITED AFTER SUNSET", bx, by + bh * 0.28);
  ctx.textAlign = "left";
}

// ============================================================================
// 11. SCENE 11: Night FLIR Thermal Camera & Paranormal Phantom (64.0s - 68.5s)
// ============================================================================
export function drawSceneThermalAnomaly(ctx, W, H, t) {
  const pulse = Math.sin(t * 8) * 8;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="flirBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#080618"/>
      <stop offset="60%" stop-color="#100C30"/>
      <stop offset="100%" stop-color="#1A1248"/>
    </linearGradient>

    <radialGradient id="heatAura" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
      <stop offset="25%" stop-color="#FFE838" stop-opacity="0.9"/>
      <stop offset="55%" stop-color="#FF3818" stop-opacity="0.75"/>
      <stop offset="80%" stop-color="#9C1088" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#100C30" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="tempBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="20%" stop-color="#FFE838"/>
      <stop offset="45%" stop-color="#FF4818"/>
      <stop offset="70%" stop-color="#9C1088"/>
      <stop offset="100%" stop-color="#141042"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#flirBg)"/>

  <g id="cold-ruins">
    <rect x="240" y="220" width="220" height="700" fill="#182458" stroke="#2CE8C4" stroke-width="2.5"/>
    <line x1="240" y1="340" x2="460" y2="340" stroke="#249CA8" stroke-width="1.5"/>
    <line x1="240" y1="460" x2="460" y2="460" stroke="#249CA8" stroke-width="1.5"/>
    <line x1="240" y1="580" x2="460" y2="580" stroke="#249CA8" stroke-width="1.5"/>
    <line x1="240" y1="700" x2="460" y2="700" stroke="#249CA8" stroke-width="1.5"/>

    <rect x="1460" y="220" width="220" height="700" fill="#182458" stroke="#2CE8C4" stroke-width="2.5"/>
    <line x1="1460" y1="340" x2="1680" y2="340" stroke="#249CA8" stroke-width="1.5"/>
    <line x1="1460" y1="460" x2="1680" y2="460" stroke="#249CA8" stroke-width="1.5"/>
    <line x1="1460" y1="580" x2="1680" y2="580" stroke="#249CA8" stroke-width="1.5"/>
    <line x1="1460" y1="700" x2="1680" y2="700" stroke="#249CA8" stroke-width="1.5"/>

    <path d="M240,220 L1680,220 L1680,340 Q1460,480 1200,480 Q960,320 720,480 Q460,480 240,340 Z" fill="#203072" stroke="#2CE8C4" stroke-width="3"/>
    <rect x="0" y="860" width="${W}" height="220" fill="#141038" stroke="#2CE8C4" stroke-width="2.5"/>
  </g>

  <!-- Humanoid Thermal Anomaly -->
  <g id="humanoid-heat-signature" transform="translate(960, 560)">
    <circle cx="0" cy="60" r="${340 + pulse}" fill="url(#heatAura)"/>
    <ellipse cx="0" cy="-120" rx="42" ry="50" fill="#FFFFFF"/>
    <ellipse cx="0" cy="-120" rx="46" ry="54" fill="none" stroke="#FFE838" stroke-width="4"/>

    <path d="M-20,-70 L20,-70 L85,0 L-85,0 Z" fill="#FFFFFF"/>
    <path d="M-85,0 Q-95,140 -65,280 L65,280 Q95,140 85,0 Z" fill="#FFE838"/>
    <path d="M-55,20 Q-65,130 -40,240 L40,240 Q65,130 55,20 Z" fill="#FFFFFF"/>
    <path d="M-65,280 Q-85,380 -30,420 Q0,400 30,420 Q85,380 65,280 Z" fill="#FF4818"/>
  </g>

  <g id="flir-crosshairs" stroke="#2CE8C4" stroke-width="2.5">
    <rect x="830" y="380" width="260" height="520" fill="none" stroke="#FF2828" stroke-width="3.5" stroke-dasharray="14,8"/>
    <path d="M800,420 L800,350 L870,350" fill="none" stroke="#FF2828" stroke-width="4"/>
    <path d="M1120,350 L1190,350 L1190,420" fill="none" stroke="#FF2828" stroke-width="4"/>
    <path d="M800,860 L800,930 L870,930" fill="none" stroke="#FF2828" stroke-width="4"/>
    <path d="M1120,930 L1190,930 L1190,860" fill="none" stroke="#FF2828" stroke-width="4"/>

    <circle cx="960" cy="580" r="14" fill="none"/>
    <line x1="930" y1="580" x2="945" y2="580"/>
    <line x1="975" y1="580" x2="990" y2="580"/>
    <line x1="960" y1="550" x2="960" y2="565"/>
    <line x1="960" y1="595" x2="960" y2="610"/>
  </g>

  <g id="temp-calibration" transform="translate(1820, 260)">
    <rect x="0" y="0" width="30" height="520" fill="url(#tempBar)" stroke="#2CE8C4" stroke-width="2"/>
    <text x="-15" y="15" fill="#FFFFFF" font-size="18" font-family="monospace" text-anchor="end">+42.0°C</text>
    <text x="-15" y="140" fill="#FFE838" font-size="18" font-family="monospace" text-anchor="end">+37.4°C</text>
    <text x="-15" y="270" fill="#FF4818" font-size="18" font-family="monospace" text-anchor="end">+28.0°C</text>
    <text x="-15" y="400" fill="#9C1088" font-size="18" font-family="monospace" text-anchor="end">+18.0°C</text>
    <text x="-15" y="515" fill="#2CE8C4" font-size="18" font-family="monospace" text-anchor="end">+10.2°C</text>
  </g>

  <g id="hud-text" font-family="monospace" font-weight="bold">
    <text x="80" y="90" fill="#FF2828" font-size="28">● REC [FLIR THERMAL IR-PRO]</text>
    <text x="80" y="135" fill="#2CE8C4" font-size="22">GPS: 27°11'48.2"N 70°47'24.8"E</text>
    <text x="80" y="172" fill="#2CE8C4" font-size="22">EMF DETECT: 4.8 mG [HIGH FLUCTUATION]</text>
    <text x="80" y="210" fill="#FFE838" font-size="24">TARGET: +37.4 °C [HUMANOID ANOMALY DETECTED]</text>
  </g>
</svg>
`;

  drawSvgToCanvas(ctx, svg);
}

// ============================================================================
// 12. SCENE 12: Studio Outro (68.5s - 71.0s)
// ============================================================================
export function drawSceneOutro(ctx, W, H, t) {
  ctx.fillStyle = "#07090E";
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.5, cy = H * 0.45;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.6);
  ellipse(ctx, 0, 0, 95, 95);
  stroke(ctx, 7, "#FF3344");
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ellipse(ctx, Math.cos(a) * 52, Math.sin(a) * 52, 19, 19);
    stroke(ctx, 4, "#E2E8F0");
  }
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText("NIGHTINGALE FILMS", cx, cy + 155);

  ctx.fillStyle = "#FF3344";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("UNSOLVED REALITIES • FACT-CHECKED INVESTIGATIONS", cx, cy + 200);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "20px sans-serif";
  ctx.fillText("Subscribe for more unsolved historical mysteries", cx, cy + 245);
  ctx.textAlign = "left";
}
