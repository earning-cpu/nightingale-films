// PROJECT NIGHTINGALE — design tokens
export const C = {
  black: '#07090D',
  ink: '#0C1016',
  paper: '#E9E2D2',
  paperDim: 'rgba(233,226,210,0.55)',
  amber: '#D9A441',
  warn: '#C4382B',
  warnGlow: '#FF4B36',
  plasma: '#7FD9FF',
  plasmaDeep: '#2E8FC9',
  phosphor: '#8CE89B',
  hud: 'rgba(140,232,155,0.85)',
  hudDim: 'rgba(140,232,155,0.35)',
  white: '#F4F1EA',
};

export const F = {
  mono: '"IBM Plex Mono", "Courier New", monospace',
  type: '"Special Elite", "Courier New", monospace',
  sans: 'Inter, "Helvetica Neue", Arial, sans-serif',
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const win = (frame: number, start: number, dur: number) =>
  clamp01((frame - start) / dur);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// deterministic pseudo-random from frame (no Math.random in renders)
export const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Timeline — single source of truth (30fps)
export const T = {
  fps: 30,
  title: {from: 0, dur: 140},
  s1: {from: 140, dur: 180},
  s2: {from: 320, dur: 165},
  s3: {from: 485, dur: 210},
  s4: {from: 695, dur: 180},
  s5: {from: 875, dur: 180},
  s6: {from: 1055, dur: 195},
  s7: {from: 1250, dur: 180},
  s8: {from: 1430, dur: 165},
  s9: {from: 1595, dur: 180},
  s10: {from: 1775, dur: 210},
  end: {from: 1985, dur: 105},
  total: 2090,
};
