import { createCanvas } from '@napi-rs/canvas';
import { loadAssets, renderCompositeFrame, SCENES } from './src/render_kuldhara_mograph.mjs';
import fs from 'fs';

async function main() {
  fs.mkdirSync('qa_kuldhara/v3_mograph_stills', { recursive: true });
  console.log('Loading assets...');
  const assets = await loadAssets();
  console.log('Assets loaded.');

  const testFrames = [
    { frame: 30, name: '01_hook_card1.jpg' },
    { frame: 75, name: '02_hook_card2.jpg' },
    { frame: 120, name: '03_title_card.jpg' },
    { frame: 240, name: '04_prosperous_bazaar.jpg' },
    { frame: 420, name: '05_salim_singh_target.jpg' },
    { frame: 630, name: '06_chief_daughter_timer.jpg' },
    { frame: 870, name: '07_council_network_map.jpg' },
    { frame: 1100, name: '08_exodus_route.jpg' },
    { frame: 1260, name: '09_sacred_curse_climax.jpg' },
    { frame: 1550, name: '10_chulha_evidence.jpg' },
    { frame: 1700, name: '11_radar_sweep_paradox.jpg' },
    { frame: 1830, name: '12_asi_warning_board.jpg' },
    { frame: 1950, name: '13_flir_thermal_hud.jpg' },
    { frame: 2020, name: '14_emf_oscilloscope.jpg' },
    { frame: 2090, name: '15_outro_retention_cta.jpg' },
  ];

  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  for (const { frame, name } of testFrames) {
    ctx.clearRect(0, 0, 1920, 1080);
    renderCompositeFrame(ctx, assets, frame);
    const buf = canvas.toBuffer('image/jpeg', { quality: 92 });
    fs.writeFileSync(`qa_kuldhara/v3_mograph_stills/${name}`, buf);
    console.log(`Rendered frame ${frame} -> ${name}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
