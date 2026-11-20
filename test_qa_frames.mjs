// test_qa_frames.mjs - Render and test all 12 scenes
import { createCanvas } from "@napi-rs/canvas";
import fs from "node:fs";
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

const W = 1920, H = 1080;
const scenes = [
  { name: "01_Night_Ruins", fn: drawSceneNightRuins, t: 2.5 },
  { name: "02_Prosperous_1825", fn: drawSceneProsperous1825, t: 8.0 },
  { name: "03_Salim_Singh", fn: drawSceneSalimSingh, t: 14.0 },
  { name: "04_Chief_Daughter", fn: drawSceneChiefAndDaughter, t: 21.0 },
  { name: "05_Temple_Council", fn: drawSceneTempleCouncil, t: 29.0 },
  { name: "06_Night_Exodus", fn: drawSceneNightExodus, t: 36.0 },
  { name: "07_Elder_Curse", fn: drawSceneElderCurse, t: 44.0 },
  { name: "08_Abandoned_Kitchen", fn: drawSceneAbandonedKitchen, t: 51.0 },
  { name: "09_Footprint_Paradox", fn: drawSceneFootprintParadox, t: 56.5 },
  { name: "10_ASI_Gate", fn: drawSceneASIGate, t: 61.0 },
  { name: "11_Thermal_Anomaly", fn: drawSceneThermalAnomaly, t: 66.0 },
  { name: "12_Studio_Outro", fn: drawSceneOutro, t: 70.0 }
];

fs.mkdirSync("qa_kuldhara/v2_stills", { recursive: true });

for (const sc of scenes) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  sc.fn(ctx, W, H, sc.t);
  const buf = canvas.toBuffer("image/jpeg");
  fs.writeFileSync(`qa_kuldhara/v2_stills/${sc.name}.jpg`, buf);
  console.log(`Saved qa_kuldhara/v2_stills/${sc.name}.jpg`);
}
