// Generate an original 52.2-second stereo suspense bed for PlatformTwo.
// No samples or sound recordings are used: all elements are synthesized here.
const fs = require('node:fs');
const path = require('node:path');

const sr = 48000;
const seconds = 52.2;
const frames = Math.round(sr * seconds);
const out = path.resolve('public/horror/ambience.wav');
fs.mkdirSync(path.dirname(out), {recursive: true});
const pcm = Buffer.alloc(44 + frames * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + frames * 4, 4); pcm.write('WAVE', 8);
pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
pcm.write('data', 36); pcm.writeUInt32LE(frames * 4, 40);

let seed = 0x51a7c0de;
const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967295 * 2 - 1; };
let lowNoise = 0;
const bells = [
  {at: 11.95, f: 660, amp: 0.026},
  {at: 22.4, f: 784, amp: 0.036},
  {at: 31.1, f: 494, amp: 0.022},
  {at: 40.65, f: 880, amp: 0.032},
  {at: 44.32, f: 523, amp: 0.045},
];
const write = (offset, x) => pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x * 32767))), offset);

for (let i = 0; i < frames; i++) {
  const t = i / sr;
  const fadeIn = Math.min(1, t / 1.8);
  const tail = Math.min(1, Math.max(0, (seconds - t) / 1.8));
  const atmosphere = fadeIn * tail;
  const slow = Math.sin(2 * Math.PI * 0.045 * t);
  lowNoise += (random() - lowNoise) * 0.018;
  const airy = random();

  let left = atmosphere * (
    Math.sin(2 * Math.PI * (41.5 + slow * 1.2) * t) * 0.024 +
    Math.sin(2 * Math.PI * 55.25 * t + slow * 0.5) * 0.009 +
    Math.sin(2 * Math.PI * 82.4 * t) * 0.004 +
    lowNoise * 0.25 + airy * 0.004
  );
  let right = atmosphere * (
    Math.sin(2 * Math.PI * (42.2 + slow * 1.0) * t + 0.4) * 0.022 +
    Math.sin(2 * Math.PI * 56.1 * t + 1.1 + slow * 0.5) * 0.008 +
    Math.sin(2 * Math.PI * 83.8 * t + 0.6) * 0.004 +
    lowNoise * 0.23 + airy * 0.0035
  );

  // Low rail/engine rumble grows as the train appears, then recedes.
  const train = Math.max(0, Math.min(1, (t - 12.8) / 3.5)) * Math.max(0, Math.min(1, (29.0 - t) / 5.5));
  const pulse = 0.78 + 0.22 * Math.sin(2 * Math.PI * 0.72 * t);
  left += train * pulse * (Math.sin(2 * Math.PI * 34.7 * t) * 0.024 + Math.sin(2 * Math.PI * 68.3 * t) * 0.008);
  right += train * pulse * (Math.sin(2 * Math.PI * 35.1 * t + 0.25) * 0.022 + Math.sin(2 * Math.PI * 69.1 * t) * 0.007);

  // A soft clock tick every second; no sampled field recording.
  const tickPhase = t % 1;
  if (tickPhase < 0.032) {
    const tick = Math.exp(-tickPhase * 125) * 0.015;
    left += tick;
    right += Math.exp(-Math.max(0, tickPhase - 0.002) * 125) * 0.013;
  }

  // Small, distant, inharmonic glass/rail tones only at narrative reveals.
  for (const bell of bells) {
    const age = t - bell.at;
    if (age >= 0 && age < 1.65) {
      const env = Math.exp(-age * 3.1) * Math.min(1, age * 50) * bell.amp;
      const tone = Math.sin(2 * Math.PI * bell.f * age) + 0.42 * Math.sin(2 * Math.PI * bell.f * 1.51 * age + 0.5) + 0.18 * Math.sin(2 * Math.PI * bell.f * 2.03 * age);
      left += env * tone;
      right += env * (Math.sin(2 * Math.PI * bell.f * age + 0.2) + 0.40 * Math.sin(2 * Math.PI * bell.f * 1.51 * age + 0.8));
    }
  }

  // A restrained low impact under the final line.
  const impactAge = t - 44.28;
  if (impactAge >= 0 && impactAge < 0.62) {
    const thump = Math.exp(-impactAge * 11) * 0.085 * Math.sin(2 * Math.PI * (48 - 18 * impactAge) * impactAge);
    left += thump;
    right += thump * 0.9;
  }

  const p = 44 + i * 4;
  write(p, left);
  write(p + 2, right);
}
fs.writeFileSync(out, pcm);
console.log(`Wrote ${out} (${seconds}s, 48 kHz stereo, synthesized only)`);
