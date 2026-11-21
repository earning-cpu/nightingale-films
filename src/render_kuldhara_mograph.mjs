/**
 * Master Documentary Motion Graphics Renderer for Kuldhara
 * High-retention forensic visual effects, kinetic typography, telemetry HUDs,
 * animated callouts, dynamic radar scans, FLIR thermal UI, and Devanagari HarfBuzz shaping.
 */

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// 1. Register Fonts
GlobalFonts.registerFromPath('assets/NotoSansDevanagari-Bold.ttf', 'NotoDeva');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'DejaVuSansBold');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'DejaVuMono');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 'DejaVuSerif');

export const W = 1920;
export const H = 1080;
export const FPS = 30;

// 2. Scene Specifications (total 71.0s = 2,130 frames)
export const SCENES = [
  { id: 's01', img: 'public/img/kuldhara_night_aerial.jpg', startFrame: 0, endFrame: 95, duration: 3.20 },
  { id: 's02', img: 'public/img/kuldhara_title_bg.jpg', startFrame: 96, endFrame: 155, duration: 2.00 },
  { id: 's03', img: 'public/img/kuldhara_prosperous_1825.jpg', startFrame: 156, endFrame: 329, duration: 5.80 },
  { id: 's04', img: 'public/img/kuldhara_salim_singh.jpg', startFrame: 330, endFrame: 509, duration: 6.00 },
  { id: 's05', img: 'public/img/kuldhara_chief_daughter.jpg', startFrame: 510, endFrame: 749, duration: 8.00 },
  { id: 's06', img: 'public/img/kuldhara_temple_council.jpg', startFrame: 750, endFrame: 1004, duration: 8.50 },
  { id: 's07', img: 'public/img/kuldhara_night_exodus.jpg', startFrame: 1005, endFrame: 1184, duration: 6.00 },
  { id: 's08', img: 'public/img/kuldhara_elder_curse.jpg', startFrame: 1185, endFrame: 1475, duration: 9.70 },
  { id: 's09', img: 'public/img/kuldhara_empty_hearths.jpg', startFrame: 1476, endFrame: 1634, duration: 5.30 },
  { id: 's10', img: 'public/img/kuldhara_desert_empty_tracks.jpg', startFrame: 1635, endFrame: 1754, duration: 4.00 },
  { id: 's11', img: 'public/img/kuldhara_asi_board_final.jpg', startFrame: 1755, endFrame: 1919, duration: 5.50 },
  { id: 's12', img: 'public/img/kuldhara_thermal_anomaly.jpg', startFrame: 1920, endFrame: 1994, duration: 2.50 },
  { id: 's13', img: 'public/img/kuldhara_night_aerial.jpg', startFrame: 1995, endFrame: 2054, duration: 2.00 }, // Pristine night aerial for EMF anomaly
  { id: 's14', img: 'public/img/roopkund_outro_clean_bg.jpg', startFrame: 2055, endFrame: 2129, duration: 2.50 }
];

// 3. Subtitle Cue Definitions (Devanagari HarfBuzz shaped)
export const SUBTITLES = [
  { start: 0.60, end: 8.50, text: 'साल 1825 की एक ही रात में... 84 गांवों के 1500 लोग हवा में गायब हो गए!' },
  { start: 8.50, end: 16.80, text: 'जैसलमेर का कुलधरा... जहां खुशहाली देखकर क्रूर दीवान सलीम सिंह जल भुन गया था!' },
  { start: 17.00, end: 24.80, text: 'सलीम सिंह ने पालीवाल ब्राह्मणों पर असहनीय लगान और जुल्म थोप दिया' },
  { start: 24.80, end: 33.20, text: 'चेतावनी दी कि पूर्णिमा तक झुकें... ग्रामीणों के पास सिर्फ एक रात थी!' },
  { start: 33.50, end: 39.50, text: 'आधी रात को... अपनी दौलत वहीं छोड़कर, 1500 लोग चुपचाप अंधेरे में चल पड़े!' },
  { start: 39.50, end: 49.00, text: "जाने से पहले खौफनाक श्राप दिया—'इस धरती पर अब कभी कोई इंसान नहीं बसेगा!'" },
  { start: 49.20, end: 54.20, text: 'अगली सुबह चूल्हों में आग जल रही थी...' },
  { start: 54.20, end: 58.20, text: '...पर रेगिस्तान में एक भी पैर का निशान नहीं मिला!' },
  { start: 58.50, end: 64.00, text: "200 साल बाद आज भी ASI का बोर्ड है: 'सूरज ढलने के बाद प्रवेश सख्त मना है!'" },
  { start: 64.00, end: 68.50, text: 'वैज्ञानिक जांच में 37.4°C तापमान और काकनी एक्टिव फॉल्ट के प्रमाण मिले हैं!' },
  { start: 68.50, end: 71.00, text: 'आपकी क्या राय है? कमेंट में बताएं... लाइक और सब्सक्राइब करें' }
];

// Pre-load all scene background images
export async function loadAssets() {
  const assets = {};
  for (const sc of SCENES) {
    if (!assets[sc.img]) {
      assets[sc.img] = await loadImage(sc.img);
    }
  }
  return assets;
}

// Draw cinematic Ken Burns zoom/pan on background image
export function drawKenBurns(ctx, img, progress, panX = 0, panY = 0, zoomIn = true) {
  const baseScale = Math.max(W / img.width, H / img.height);
  const zoom = zoomIn ? (1.0 + 0.08 * progress) : (1.08 - 0.08 * progress);
  const scale = baseScale * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (W - dw) / 2 + panX * progress * (dw - W) * 0.4;
  const dy = (H - dh) / 2 + panY * progress * (dh - H) * 0.4;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Draw Global Letterbox & Forensic Telemetry Strip
export function drawGlobalHUD(ctx, globalT, sceneId) {
  // Top metadata strip
  ctx.fillStyle = 'rgba(8, 12, 18, 0.78)';
  ctx.fillRect(0, 0, W, 58);
  ctx.strokeStyle = 'rgba(255, 200, 50, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 58);
  ctx.lineTo(W, 58);
  ctx.stroke();

  // Bottom subtitle & telemetry backing
  ctx.fillStyle = 'rgba(8, 12, 18, 0.75)';
  ctx.fillRect(0, H - 70, W, 70);
  ctx.strokeStyle = 'rgba(100, 130, 160, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, H - 70);
  ctx.lineTo(W, H - 70);
  ctx.stroke();

  // Viewport corner grid ticks
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.5)';
  ctx.lineWidth = 2;
  const corners = [[50, 75], [W - 50, 75], [50, H - 85], [W - 50, H - 85]];
  for (const [cx, cy] of corners) {
    const s = 14;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy);
    ctx.lineTo(cx + s, cy);
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx, cy + s);
    ctx.stroke();
  }

  // Header Left
  ctx.font = '16px DejaVuSansBold';
  ctx.fillStyle = '#00d7ff';
  ctx.fillText('NIGHTINGALE FILMS // FORENSIC INVESTIGATION ARCHIVE', 65, 36);

  // Header Center GPS Drift
  const latDrift = 19.824 + 0.002 * Math.sin(globalT * 10);
  const lonDrift = 54.312 + 0.002 * Math.cos(globalT * 12);
  ctx.font = '14px DejaVuMono';
  ctx.fillStyle = '#d2dde8';
  ctx.fillText(`LOC: 27° ${latDrift.toFixed(3)}' N, 70° ${lonDrift.toFixed(3)}' E // THAR BASIN, RJ`, W - 820, 36);

  // Pulsing REC Dot & Timecode
  const pulse = (Math.sin(globalT * 7) + 1) / 2;
  ctx.fillStyle = `rgb(${Math.floor(190 + 65 * pulse)}, 10, 10)`;
  ctx.beginPath();
  ctx.arc(W - 845, 31, 6, 0, Math.PI * 2);
  ctx.fill();

  const sec = Math.floor(globalT);
  const ms = Math.floor((globalT % 1) * 100);
  const tcStr = `REC 00:${sec < 10 ? '0' : ''}${sec}:${ms < 10 ? '0' : ''}${ms}`;
  ctx.font = '14px DejaVuMono';
  ctx.fillStyle = '#ff4444';
  ctx.fillText(tcStr, W - 220, 36);

  // Bottom Left & Right Metadata
  ctx.font = '13px DejaVuMono';
  ctx.fillStyle = '#9cb0c4';
  ctx.fillText('AUDIO: 96 kHz / 24-BIT MASTER STEREO', 65, H - 32);
  ctx.fillStyle = '#00d7ff';
  ctx.fillText('CASEFILE: #1825-KULDHARA // JAI-EXP-084', W - 360, H - 32);
}

// Draw Audio Waveform Spectrum Bars (Bottom of Scene 1)
export function drawWaveformBars(ctx, t) {
  const nBars = 48;
  const barW = 12;
  const gap = 8;
  const totalW = nBars * (barW + gap);
  const startX = (W - totalW) / 2;
  const baseY = H - 22;

  for (let i = 0; i < nBars; i++) {
    const hVal = Math.floor(10 + 38 * Math.abs(Math.sin(t * 7 + i * 0.4) * Math.cos(t * 3.5 + i * 0.25)));
    const bx = startX + i * (barW + gap);
    const grad = ctx.createLinearGradient(bx, baseY - hVal, bx, baseY);
    grad.addColorStop(0, '#00e1ff');
    grad.addColorStop(1, '#0055ff');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, baseY - hVal, barW, hVal);
  }
}

// Draw HarfBuzz-shaped Devanagari Subtitle at SMPTE title-safe position
export function drawSubtitle(ctx, globalT) {
  const sub = SUBTITLES.find(s => globalT >= s.start && globalT <= s.end);
  if (!sub) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '36px NotoDeva';

  const x = W / 2;
  const y = H - 110;

  // Background blur scrim behind subtitle
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  const textWidth = ctx.measureText(sub.text).width;
  ctx.fillRect(x - textWidth / 2 - 25, y - 28, textWidth + 50, 56);

  // Deep shadow + Crisp Outline
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#05080e';
  ctx.strokeText(sub.text, x, y);

  // Gradient text fill for cinematic pop
  const grad = ctx.createLinearGradient(x - textWidth / 2, y, x + textWidth / 2, y);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#fff6cc');
  grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = grad;
  ctx.fillText(sub.text, x, y);

  ctx.restore();
}

// Draw Scene-Specific Motion Graphics Overlays
export function drawSceneMotionGraphics(ctx, sc, frameInScene, globalT) {
  const prog = frameInScene / (sc.endFrame - sc.startFrame);
  const t = frameInScene / FPS;

  switch (sc.id) {
    case 's01': {
      // ----------------- SCENE 1: THE RETENTION VIRAL HOOK (0.0s - 3.2s) -----------------
      drawWaveformBars(ctx, t);

      // Center Ruins Target Reticle
      const rx = W * 0.58;
      const ry = H * 0.48;
      const rRad = 52 + 8 * Math.sin(t * 6);
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(rx - rRad - 15, ry); ctx.lineTo(rx - rRad + 12, ry);
      ctx.moveTo(rx + rRad - 12, ry); ctx.lineTo(rx + rRad + 15, ry);
      ctx.moveTo(rx, ry - rRad - 15); ctx.lineTo(rx, ry - rRad + 12);
      ctx.moveTo(rx, ry + rRad - 12); ctx.lineTo(rx, ry + rRad + 15);
      ctx.stroke();

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('[SITE: KULDHARA CORE // 1291 CE]', rx - 100, ry - rRad - 16);

      // THE HOOK SLAM CARDS
      if (t < 1.6) {
        // CARD 1: 1,500 CITIZENS • 84 VILLAGES
        const alpha = Math.min(1.0, t * 4);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bx = 80, by = 110, bw = 780, bh = 160;

        ctx.fillStyle = 'rgba(12, 18, 28, 0.90)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#00d7ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);

        // Caution Stripes on left edge
        ctx.strokeStyle = '#00d7ff';
        ctx.lineWidth = 3;
        for (let sy = by + 5; sy < by + bh - 15; sy += 18) {
          ctx.beginPath();
          ctx.moveTo(bx + 8, sy);
          ctx.lineTo(bx + 26, sy + 15);
          ctx.stroke();
        }

        ctx.font = '16px DejaVuMono';
        ctx.fillStyle = '#00d7ff';
        ctx.fillText('[CLASSIFIED COLD CASE // THAR DESERT]', bx + 45, by + 42);

        ctx.font = '34px DejaVuSansBold';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('1,500 CITIZENS . 84 VILLAGES', bx + 45, by + 94);

        ctx.font = '18px DejaVuSansBold';
        ctx.fillStyle = '#32dc64';
        ctx.fillText('POPULATION: 100% UNACCOUNTED', bx + 45, by + 138);

        ctx.restore();
      } else {
        // CARD 2: VANISHED IN A SINGLE NIGHT
        const alpha = Math.min(1.0, (t - 1.6) * 4);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bx = 80, by = 110, bw = 840, bh = 160;

        ctx.fillStyle = 'rgba(18, 12, 24, 0.92)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);

        // Red danger stripes
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 3;
        for (let sy = by + 5; sy < by + bh - 15; sy += 18) {
          ctx.beginPath();
          ctx.moveTo(bx + 8, sy);
          ctx.lineTo(bx + 26, sy + 15);
          ctx.stroke();
        }

        ctx.font = '16px DejaVuMono';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('⚠️ CRITICAL FORENSIC ANOMALY', bx + 45, by + 42);

        ctx.font = '34px DejaVuSansBold';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('VANISHED IN A SINGLE NIGHT', bx + 45, by + 94);

        ctx.font = '17px DejaVuSansBold';
        ctx.fillStyle = '#00d7ff';
        ctx.fillText('EVIDENCE: 0 FOOTPRINTS . HEARTHS STILL BURNING', bx + 45, by + 138);

        ctx.restore();
      }
      break;
    }

    case 's02': {
      // ----------------- SCENE 2: CINEMATIC TITLE CARD & HIGHWAY (3.2s - 5.2s) -----------------
      const bx = W / 2 - 460;
      const by = 240;
      const bw = 920;
      const bh = 260;

      ctx.save();
      ctx.fillStyle = 'rgba(10, 14, 22, 0.82)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = 'rgba(255, 204, 51, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.strokeStyle = 'rgba(255, 204, 51, 0.35)';
      ctx.strokeRect(bx + 8, by + 8, bw - 16, bh - 16);

      ctx.textAlign = 'center';
      ctx.font = '15px DejaVuMono';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('// NIGHTINGALE FILMS INVESTIGATIVE ARCHIVE //', W / 2, by + 42);

      ctx.font = '64px DejaVuSerif';
      ctx.fillStyle = '#ffcc33';
      ctx.shadowColor = 'rgba(255, 200, 50, 0.6)';
      ctx.shadowBlur = 15;
      ctx.fillText('KULDHARA', W / 2, by + 120);
      ctx.shadowBlur = 0;

      ctx.font = '32px NotoDeva';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('कुलधरा: 200 साल पुराना शापित गांव', W / 2, by + 180);

      ctx.font = '15px DejaVuSansBold';
      ctx.fillStyle = '#d0d8e2';
      ctx.fillText('84 VILLAGES • 1,500 CITIZENS • ZERO SURVIVORS FOUND', W / 2, by + 225);

      // Heading telemetry
      ctx.font = '14px DejaVuMono';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('APPROACHING RESTRICTED PERIMETER // VEL: 45 KM/H // HDG: 312° NW', W - 80, 110);

      ctx.restore();
      break;
    }

    case 's03': {
      // ----------------- SCENE 3: PROSPEROUS 1825 BAZAAR (5.2s - 11.0s) -----------------
      // Top Era Slider
      ctx.fillStyle = 'rgba(12, 18, 26, 0.88)';
      ctx.fillRect(80, 80, 820, 54);
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 80, 820, 54);

      ctx.font = '15px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('[ERA: 1825 CE] • [PALIWAL BRAHMIN CLAN] • [SILK & SPICE TRADE CAPITAL]', 98, 114);

      // Callout 1: Lead Camel Caravan
      const cx1 = 440, cy1 = 520;
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx1, cy1, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#00d7ff';
      ctx.beginPath();
      ctx.arc(cx1, cy1, 4, 0, Math.PI * 2);
      ctx.fill();

      // Tracking Line to Box
      ctx.beginPath();
      ctx.moveTo(cx1 + 10, cy1);
      ctx.lineTo(cx1 + 80, cy1 - 70);
      ctx.lineTo(cx1 + 320, cy1 - 70);
      ctx.stroke();

      ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
      ctx.fillRect(cx1 + 80, cy1 - 115, 270, 45);
      ctx.font = '13px DejaVuSansBold';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('[PALIWAL TRADE CARAVAN]', cx1 + 92, cy1 - 95);
      ctx.font = '12px DejaVuMono';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SILK & SPICE ROUTE WEALTH', cx1 + 92, cy1 - 78);

      // Callout 2: Kadhan Agriculture
      const cx2 = 1420, cy2 = 620;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx2, cy2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx2 - 10, cy2);
      ctx.lineTo(cx2 - 80, cy2 - 70);
      ctx.lineTo(cx2 - 320, cy2 - 70);
      ctx.stroke();

      ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
      ctx.fillRect(cx2 - 320, cy2 - 115, 240, 45);
      ctx.font = '13px DejaVuSansBold';
      ctx.fillStyle = '#32dc64';
      ctx.fillText('[KADHAN SOIL IRRIGATION]', cx2 - 308, cy2 - 95);
      ctx.font = '12px DejaVuMono';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('RECORD WHEAT & GRAIN YIELD', cx2 - 308, cy2 - 78);

      // Metric Badge (Top-Right)
      ctx.fillStyle = 'rgba(12, 18, 26, 0.88)';
      ctx.fillRect(W - 480, 80, 400, 54);
      ctx.strokeStyle = '#32dc64';
      ctx.lineWidth = 2;
      ctx.strokeRect(W - 480, 80, 400, 54);
      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#32dc64';
      ctx.fillText('REVENUE: HIGHEST IN JAISALMER', W - 460, 114);
      break;
    }

    case 's04': {
      // ----------------- SCENE 4: DIWAN SALIM SINGH TARGET ACQUISITION (11.0s - 17.0s) -----------------
      const redPulse = 0.15 + 0.08 * Math.sin(t * 8);
      ctx.fillStyle = `rgba(180, 10, 20, ${redPulse})`;
      ctx.fillRect(0, 0, W, H);

      // Target Lock Brackets around Salim Singh's face
      const tx = 960, ty = 360, tw = 220, th = 260;
      ctx.strokeStyle = '#ff2222';
      ctx.lineWidth = 3.5;
      const bLen = 30;

      ctx.beginPath();
      ctx.moveTo(tx - tw / 2, ty - th / 2 + bLen); ctx.lineTo(tx - tw / 2, ty - th / 2); ctx.lineTo(tx - tw / 2 + bLen, ty - th / 2);
      ctx.moveTo(tx + tw / 2 - bLen, ty - th / 2); ctx.lineTo(tx + tw / 2, ty - th / 2); ctx.lineTo(tx + tw / 2, ty - th / 2 + bLen);
      ctx.moveTo(tx - tw / 2, ty + th / 2 - bLen); ctx.lineTo(tx - tw / 2, ty + th / 2); ctx.lineTo(tx - tw / 2 + bLen, ty + th / 2);
      ctx.moveTo(tx + tw / 2 - bLen, ty + th / 2); ctx.lineTo(tx + tw / 2, ty + th / 2); ctx.lineTo(tx + tw / 2, ty + th / 2 - bLen);
      ctx.stroke();

      // Target Dossier Box
      const dx = 80, dy = 100, dw = 620, dh = 150;
      ctx.fillStyle = 'rgba(16, 10, 14, 0.90)';
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = '#ff2222';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(dx, dy, dw, dh);

      ctx.font = '16px DejaVuMono';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('[TARGET IDENTIFIED: DIWAN SALIM SINGH]', dx + 30, dy + 38);

      ctx.font = '22px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PRIME MINISTER OF JAISALMER', dx + 30, dy + 76);

      ctx.font = '15px DejaVuMono';
      ctx.fillStyle = '#ffbb33';
      ctx.fillText('CRIME: 300% EXTORTIONATE TAX + ULTIMATUM', dx + 30, dy + 115);

      // Threat Level Pill
      ctx.fillStyle = 'rgba(220, 20, 30, 0.85)';
      ctx.fillRect(W - 360, 100, 280, 50);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(W - 360, 100, 280, 50);
      ctx.font = '16px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('⚠️ THREAT LEVEL: MAXIMUM', W - 340, 132);
      break;
    }

    case 's05': {
      // ----------------- SCENE 5: ULTIMATUM & DILEMMA OF HONOR (17.0s - 25.0s) -----------------
      // Urgent Ticking Countdown Timer (Top-Right)
      const tRemaining = Math.max(0, 12 - (t / 8.0) * 8);
      const hrs = Math.floor(tRemaining);
      const mins = Math.floor((tRemaining % 1) * 60);
      const secs = Math.floor(((tRemaining * 60) % 1) * 60);

      const cx = W - 520, cy = 90, cw = 440, ch = 90;
      ctx.fillStyle = 'rgba(18, 12, 16, 0.92)';
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cx, cy, cw, ch);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('⚠️ DEADLINE: FULL MOON NIGHT // PURNIMA', cx + 25, cy + 32);

      const timeStr = `0${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
      ctx.font = '28px DejaVuMono';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`COUNTDOWN: ${timeStr}`, cx + 25, cy + 70);

      // Target Bracket directly over Daughter (tx = 710, ty = 540)
      const tx = 710, ty = 540;
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(tx - 110, ty - 160, 220, 280);
      ctx.font = '13px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('[TARGET OF ULTIMATUM: CHIEF\'S DAUGHTER]', tx - 120, ty - 175);

      // Dilemma Graphic (Bottom-Left)
      const lx = 80, ly = H - 320, lw = 580, lh = 130;
      ctx.fillStyle = 'rgba(12, 16, 24, 0.90)';
      ctx.fillRect(lx, ly, lw, lh);
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, ly, lw, lh);

      ctx.font = '15px DejaVuSansBold';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('[THE DILEMMA OF HONOR & SURVIVAL]', lx + 25, ly + 34);

      ctx.font = '13px DejaVuMono';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• SURRENDER DAUGHTER: ETERNAL DISHONOR', lx + 25, ly + 68);
      ctx.fillText('• RESIST MILITARILY: TOTAL CLAN ANNIHILATION', lx + 25, ly + 96);
      break;
    }

    case 's06': {
      // ----------------- SCENE 6: COUNCIL OF 84 & NETWORK MAP (25.0s - 33.5s) -----------------
      // Tactical Defense Network Map (Top-Right)
      const mx = W - 460, my = 90, mw = 380, mh = 220;
      ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, mw, mh);

      ctx.font = '13px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('PALIWAL ALLIED CLAN NETWORK (84)', mx + 20, my + 30);

      // 84 Nodes organic territory map
      const nodeCount = 36;
      for (let i = 0; i < nodeCount; i++) {
        const nx = mx + 40 + (Math.sin(i * 1.7) * 0.5 + 0.5) * (mw - 80);
        const ny = my + 55 + (Math.cos(i * 2.3) * 0.5 + 0.5) * (mh - 95);

        ctx.fillStyle = '#ffcc33';
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fill();

        if (i > 0 && i % 2 === 0) {
          const px = mx + 40 + (Math.sin((i - 1) * 1.7) * 0.5 + 0.5) * (mw - 80);
          const py = my + 55 + (Math.cos((i - 1) * 2.3) * 0.5 + 0.5) * (mh - 95);
          ctx.strokeStyle = 'rgba(255, 204, 51, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }

      ctx.font = '14px DejaVuSansBold';
      ctx.fillStyle = '#32dc64';
      ctx.fillText('COUNCIL QUORUM: 84 / 84 (100%)', mx + 20, my + mh - 18);

      // Resolution Card (Left)
      const rx = 80, ry = 100, rw = 580, rh = 130;
      ctx.fillStyle = 'rgba(10, 14, 22, 0.92)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, ry, rw, rh);

      ctx.font = '15px DejaVuSansBold';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('[HISTORIC PANCHAYAT RESOLUTION]', rx + 30, ry + 36);

      ctx.font = '20px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('UNANIMOUS DECISION: TOTAL EVACUATION', rx + 30, ry + 74);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('LEAVE BEFORE SUNRISE • ABANDON ALL WEALTH', rx + 30, ry + 108);
      break;
    }

    case 's07': {
      // ----------------- SCENE 7: SECRET MIDNIGHT EXODUS (33.5s - 39.5s) -----------------
      // Floating Tactical Evacuation Waypoint Beacon above the caravan
      const wx = W - 520, wy = 100, ww = 440, wh = 100;
      ctx.fillStyle = 'rgba(10, 14, 22, 0.92)';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2;
      ctx.strokeRect(wx, wy, ww, wh);

      ctx.font = '13px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('► EVACUATION ROUTE: HEADING 145° SE', wx + 20, wy + 34);
      ctx.font = '18px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('200+ KM CARAVAN TOWARD PALI', wx + 20, wy + 68);

      // Exodus Telemetry Box (Left)
      const ex = 80, ey = 100, ew = 660, eh = 140;
      ctx.fillStyle = 'rgba(10, 14, 22, 0.92)';
      ctx.fillRect(ex, ey, ew, eh);
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ex, ey, ew, eh);

      ctx.font = '15px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('[SECRET EVACUATION PROTOCOL // MARCH 1825]', ex + 30, ey + 36);

      ctx.font = '22px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('1,500 CITIZENS MOVING UNDER FULL MOON', ex + 30, ey + 76);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#32dc64';
      ctx.fillText('STATUS: 84 VILLAGES EVACUATED IN SILENCE', ex + 30, ey + 115);
      break;
    }

    case 's08': {
      // ----------------- SCENE 8: CLIMAX - THE SACRED CURSE (39.5s - 49.2s) -----------------
      // Beat drop screen flash at t = 2.0s - 2.5s
      if (t >= 2.0 && t <= 2.5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(0, 0, W, H);
      }

      // Mystic Sanskrit Curse Inscription in Upper-Right Sky Card (avoiding torch on left)
      const sx = W - 780, sy = 100, sw = 700, sh = 150;
      ctx.fillStyle = 'rgba(12, 10, 16, 0.88)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#ffc832';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx, sy, sw, sh);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '36px NotoDeva';
      ctx.fillStyle = '#ffc832';
      ctx.shadowColor = 'rgba(255, 180, 50, 0.9)';
      ctx.shadowBlur = 20;
      ctx.fillText('॥ यह भूमि हमेशा के लिए निर्जन और शापित रहेगी ॥', sx + sw / 2, sy + 65);
      ctx.shadowBlur = 0;

      ctx.font = '18px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('"NO SOUL SHALL EVER SETTLE HERE AGAIN"', sx + sw / 2, sy + 115);
      ctx.restore();

      // Forensic Curse Seal Badge (Bottom-Right)
      const cx = W - 520, cy = H - 280, cw = 440, ch = 90;
      ctx.fillStyle = 'rgba(22, 10, 12, 0.92)';
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cx, cy, cw, ch);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('[THE PALIWAL ANATHEMA // SEALED IN STONE]', cx + 25, cy + 34);

      ctx.font = '16px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('STATUS: UNBROKEN FOR 200 YEARS', cx + 25, cy + 68);
      break;
    }

    case 's09': {
      // ----------------- SCENE 9: CRIME SCENE TIME CAPSULE (49.2s - 54.5s) -----------------
      // Evidence Circle 1: Chulha Stove & Smoking Embers (x = 1240, y = 700)
      const ex1 = 1240, ey1 = 700;
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ex1, ey1, 65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ex1 - 65, ey1);
      ctx.lineTo(ex1 - 140, ey1 - 70);
      ctx.lineTo(ex1 - 420, ey1 - 70);
      ctx.stroke();

      ctx.fillStyle = 'rgba(12, 16, 24, 0.92)';
      ctx.fillRect(ex1 - 420, ey1 - 115, 280, 48);
      ctx.font = '13px DejaVuSansBold';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('[FORENSIC EVIDENCE A: CLAY CHULHA]', ex1 - 405, ey1 - 95);
      ctx.font = '12px DejaVuMono';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('EMBERS STILL SMOKING ON ARRIVAL', ex1 - 405, ey1 - 78);

      // Evidence Circle 2: Untouched Fresh Roti & Food (x = 1680, y = 840)
      const ex2 = 1680, ey2 = 840;
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ex2, ey2, 55, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ex2 - 55, ey2);
      ctx.lineTo(ex2 - 120, ey2 - 70);
      ctx.lineTo(ex2 - 380, ey2 - 70);
      ctx.stroke();

      ctx.fillStyle = 'rgba(12, 16, 24, 0.92)';
      ctx.fillRect(ex2 - 380, ey2 - 115, 260, 48);
      ctx.font = '13px DejaVuSansBold';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('[FORENSIC EVIDENCE B: FRESH FOOD]', ex2 - 365, ey2 - 95);
      ctx.font = '12px DejaVuMono';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ZERO SIGNS OF STRUGGLE OR THEFT', ex2 - 365, ey2 - 78);
      break;
    }

    case 's10': {
      // ----------------- SCENE 10: 360° RADAR SWEEP & FOOTPRINT PARADOX (54.5s - 58.5s) -----------------
      const rCenter = [W - 240, H - 280];
      const rMax = 140;

      ctx.save();
      ctx.fillStyle = 'rgba(8, 20, 24, 0.88)';
      ctx.beginPath();
      ctx.arc(rCenter[0], rCenter[1], rMax, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 215, 255, 0.35)';
      for (const r of [45, 90, 135]) {
        ctx.beginPath();
        ctx.arc(rCenter[0], rCenter[1], r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const angle = (t * Math.PI * 1.8) % (Math.PI * 2);
      const grad = ctx.createRadialGradient(rCenter[0], rCenter[1], 10, rCenter[0], rCenter[1], rMax);
      grad.addColorStop(0, 'rgba(0, 255, 220, 0.45)');
      grad.addColorStop(1, 'rgba(0, 255, 220, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rCenter[0], rCenter[1]);
      ctx.arc(rCenter[0], rCenter[1], rMax, angle - 0.5, angle);
      ctx.closePath();
      ctx.fill();

      ctx.font = '11px DejaVuMono';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('RADAR SCAN: 15 KM RADIUS', rCenter[0] - 70, rCenter[1] + rMax + 24);
      ctx.restore();

      // Telemetry Box (Left)
      const px = 80, py = 100, pw = 680, ph = 140;
      ctx.fillStyle = 'rgba(10, 16, 24, 0.92)';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(px, py, pw, ph);

      ctx.font = '15px DejaVuMono';
      ctx.fillStyle = '#00d7ff';
      ctx.fillText('[PERIMETER RADAR TELEMETRY // THAR DUNES]', px + 30, py + 36);

      ctx.font = '22px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('FOOTPRINT TRACK RESIDUE: 0 FOUND', px + 30, py + 76);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('CURRENT SCIENCE 2017: ACTIVE KAKNI FAULT ZONE', px + 30, py + 115);
      break;
    }

    case 's11': {
      // ----------------- SCENE 11: ASI WARNING BOARD (58.5s - 64.0s) -----------------
      const bx = W / 2 - 420, by = 260, bw = 840, bh = 340;
      const bAlpha = 0.5 + 0.5 * Math.sin(t * 8);

      ctx.strokeStyle = `rgba(255, 50, 50, ${bAlpha})`;
      ctx.lineWidth = 3.5;
      ctx.strokeRect(bx, by, bw, bh);

      const fx = bx + (bw + 200) * (prog % 1.0) - 100;
      const fGrad = ctx.createRadialGradient(fx, by + bh / 2, 20, fx, by + bh / 2, 260);
      fGrad.addColorStop(0, 'rgba(255, 255, 220, 0.35)');
      fGrad.addColorStop(1, 'rgba(255, 255, 220, 0.0)');
      ctx.fillStyle = fGrad;
      ctx.fillRect(bx, by, bw, bh);

      const wx = 80, wy = 90, ww = 640, wh = 120;
      ctx.fillStyle = 'rgba(20, 10, 12, 0.92)';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(wx, wy, ww, wh);

      ctx.font = '15px DejaVuMono';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('[ARCHAEOLOGICAL SURVEY OF INDIA (ASI)]', wx + 25, wy + 34);

      ctx.font = '20px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('RESTRICTION: ENTRY PROHIBITED AFTER DUSK', wx + 25, wy + 70);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('STATUTORY REASON: AUDITORY & PARANORMAL RISKS', wx + 25, wy + 102);
      break;
    }

    case 's12': {
      // ----------------- SCENE 12: FLIR THERMAL CAMERA HUD (64.0s - 66.5s) -----------------
      // Note: The plate already has calibrated IR scale on the right and center reticle.
      // We overlay the forensic dossier telemetry box on the upper left.
      const tx = 80, ty = 100, tw = 620, th = 130;
      ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(tx, ty, tw, th);

      ctx.font = '15px DejaVuMono';
      ctx.fillStyle = '#00ff66';
      ctx.fillText('[FLIR T650sc LONGWAVE IR SENSOR]', tx + 25, ty + 34);

      ctx.font = '22px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('TARGET: +37.4°C [HUMANOID BODY HEAT]', tx + 25, ty + 72);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('AMBIENT TEMP: 12.1°C // DELTA T: +25.3°C', tx + 25, ty + 106);
      break;
    }

    case 's13': {
      // ----------------- SCENE 13: PARANORMAL EMF ANOMALY & FAULT (66.5s - 68.5s) -----------------
      // Cyan/Blue EMF Scanning Field Pulse over Ruins
      const emfPulse = 0.15 + 0.10 * Math.sin(t * 12);
      ctx.fillStyle = `rgba(0, 180, 255, ${emfPulse})`;
      ctx.fillRect(0, 0, W, H);

      // Oscilloscope EMF Graph (Bottom)
      const ox = 80, oy = H - 240, ow = W - 160, oh = 80;
      ctx.fillStyle = 'rgba(10, 14, 22, 0.88)';
      ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#00d7ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, oy, ow, oh);

      ctx.strokeStyle = '#32dc64';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < ow; x += 4) {
        const yOffset = Math.sin(x * 0.04 + t * 14) * 25 * Math.sin(x * 0.01 + t * 4);
        const y = oy + oh / 2 + yOffset;
        if (x === 0) ctx.moveTo(ox + x, y);
        else ctx.lineTo(ox + x, y);
      }
      ctx.stroke();

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#32dc64';
      ctx.fillText('EMF FLUX: 4.8 mG [ANOMALOUS SPIKE DETECTED]', ox + 25, oy + 26);

      // Geological Reference Badge
      const gx = 80, gy = 90, gw = 660, gh = 100;
      ctx.fillStyle = 'rgba(10, 14, 22, 0.90)';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, gw, gh);

      ctx.font = '14px DejaVuMono';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('[CURRENT SCIENCE 2017: GEOLOGICAL STUDY]', gx + 25, gy + 32);

      ctx.font = '18px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ACTIVE KAKNI FAULT DISPLACEMENT & SEISMICITY', gx + 25, gy + 68);
      break;
    }

    case 's14': {
      // ----------------- SCENE 14: BRANDED OUTRO & ENGAGEMENT CTA (68.5s - 71.0s) -----------------
      const cx = W / 2, cy = 340;

      ctx.save();
      ctx.textAlign = 'center';

      const sheenX = -200 + (W + 400) * (prog % 1.0);
      const sheenGrad = ctx.createLinearGradient(sheenX, cy - 80, sheenX + 150, cy + 80);
      sheenGrad.addColorStop(0, '#ffcc33');
      sheenGrad.addColorStop(0.5, '#ffffff');
      sheenGrad.addColorStop(1, '#ffcc33');

      ctx.font = '62px DejaVuSerif';
      ctx.fillStyle = sheenGrad;
      ctx.shadowColor = 'rgba(255, 204, 51, 0.7)';
      ctx.shadowBlur = 20;
      ctx.fillText('NIGHTINGALE FILMS', cx, cy);
      ctx.shadowBlur = 0;

      ctx.font = '18px DejaVuSansBold';
      ctx.fillStyle = '#d0d8e2';
      ctx.fillText('UNSOLVED INVESTIGATIONS • 100% FACT-CHECKED MYSTERIES', cx, cy + 50);

      // Engagement Question Hook
      const qx = cx - 380, qy = cy + 100, qw = 760, qh = 130;
      ctx.fillStyle = 'rgba(12, 16, 24, 0.92)';
      ctx.fillRect(qx, qy, qw, qh);
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2;
      ctx.strokeRect(qx, qy, qw, qh);

      ctx.font = '24px DejaVuSansBold';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('WHAT REALLY HAPPENED AT KULDHARA?', cx, qy + 44);

      ctx.font = '20px NotoDeva';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('► अपनी राय कमेंट में बताएं • लाइक और सब्सक्राइब करें', cx, qy + 92);

      ctx.restore();
      break;
    }
  }
}

// Render a single composite frame
export function renderCompositeFrame(ctx, assets, frameIndex) {
  const globalT = frameIndex / FPS;
  const sc = SCENES.find(s => frameIndex >= s.startFrame && frameIndex <= s.endFrame) || SCENES[SCENES.length - 1];
  const frameInScene = frameIndex - sc.startFrame;
  const sceneProg = frameInScene / (sc.endFrame - sc.startFrame);

  // 1. Draw Ken Burns cinematic background plate
  const img = assets[sc.img];
  const zoomIn = sc.id !== 's01'; // shot 1 slow push
  drawKenBurns(ctx, img, sceneProg, 0.1, 0, zoomIn);

  // 2. Draw Global HUD
  drawGlobalHUD(ctx, globalT, sc.id);

  // 3. Draw Scene-Specific Motion Graphics Overlays
  drawSceneMotionGraphics(ctx, sc, frameInScene, globalT);

  // 4. Draw HarfBuzz-shaped Devanagari Subtitle
  drawSubtitle(ctx, globalT);
}
