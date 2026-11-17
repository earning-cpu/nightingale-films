// Render the vertical Platform Two format-test Short (original story, assets, and sound).
// Adapted from broad short-form principles: immediate anomaly, fast proof beats,
// escalating evidence, clean reveal, and a story-native end question. No reference footage is used.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ffmpeg = path.join(root, 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg');
const output = path.join(root, 'docs', 'deliverables', 'platform-no2-short-format-test.mp4');
const fps = 30;
const voiceDuration = 44.24;
const totalDuration = 48.5;
const framesTotal = Math.round(totalDuration * fps);

// 11 authored beats from six original high-resolution still plates. Reframing the
// register/map and returning to the station creates visual progression without
// importing reference frames or stretching a single still over the whole reveal.
const scenes = [
  {file: 'short-platform.png', frames: 90,  z: 1.025, endZ: 1.090, pan: 7},
  {file: 'short-panel.png',    frames: 120, z: 1.030, endZ: 1.105, pan: -9},
  {file: 'short-train.png',    frames: 180, z: 1.025, endZ: 1.095, pan: 10},
  {file: 'short-train.png',    frames: 105, z: 1.075, endZ: 1.135, pan: -5},
  {file: 'short-clock.png',    frames: 150, z: 1.030, endZ: 1.110, pan: -7},
  {file: 'short-panel.png',    frames: 105, z: 1.070, endZ: 1.130, pan: 8},
  {file: 'short-register.png',frames: 165, z: 1.025, endZ: 1.095, pan: 8},
  {file: 'short-register.png',frames: 90,  z: 1.075, endZ: 1.135, pan: -6},
  {file: 'short-map.png',      frames: 180, z: 1.025, endZ: 1.090, pan: -7},
  {file: 'short-map.png',      frames: 120, z: 1.070, endZ: 1.130, pan: 6},
  {file: 'short-platform.png', frames: 150, z: 1.045, endZ: 1.100, pan: -6},
];

const capLines = [
  'इस स्टेशन पर दूसरा प्लेटफ़ॉर्म था\\nपर नक़्शे में नहीं।',
  'यह कहानी काल्पनिक है।',
  'रात बारह बजकर सत्रह मिनट पर\\nछत्तीसगढ़ के एक छोटे स्टेशन में',
  'सिग्नलमैन राघव अकेला था।',
  'बिना आवाज़ एक ट्रेन आकर रुकी।',
  'आख़िरी डिब्बे की खिड़की पर धुंध में लिखा था\\nघर चलो।',
  'राघव ने कंट्रोल पैनल देखा\\nकोई ट्रेन दर्ज नहीं थी।',
  'तभी उसकी घड़ी उलटी चलने लगी।',
  'सुबह ड्यूटी रजिस्टर में लिखा था',
  'यात्री एक। वापसी नहीं।',
  'नीचे राघव के हस्ताक्षर थे।',
  'वह पूरी रात कमरे से बाहर नहीं निकला था।',
  'उसने पुराना नक़्शा खोला।',
  'पटरियों के पीछे किसी ने पेंसिल से\\nलिख रखा था प्लेटफ़ॉर्म नंबर दो।',
];

if (scenes.reduce((sum, scene) => sum + scene.frames, 0) !== framesTotal) {
  throw new Error('Scene frame total does not equal the 48.5-second master duration.');
}
const narrationFrames = framesTotal - Math.round((totalDuration - voiceDuration) * fps);
const actualVoiceEnd = narrationFrames / fps;
if (Math.abs(actualVoiceEnd - voiceDuration) > 0.2) {
  throw new Error(`Timeline mismatch: narration ${actualVoiceEnd.toFixed(2)}s vs ${voiceDuration}s.`);
}
if (!fs.existsSync(ffmpeg)) throw new Error(`FFmpeg not installed at ${ffmpeg}; run npm ci.`);
for (const scene of scenes) {
  if (!fs.existsSync(path.join(root, 'public/horror', scene.file))) throw new Error(`Missing still: ${scene.file}`);
}
for (const file of [
  'public/horror/NotoSansDevanagari-bold.ttf',
  'public/horror/NotoSansDevanagari-extrabold.ttf',
  'public/horror/DejaVuSansMono.ttf',
  'public/horror/ambience.wav',
  'audio/horror/short-voice.mp3',
]) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing source asset: ${file}`);
}

const cache = path.join(root, '.cache', 'platform-two-short-format-test');
fs.mkdirSync(cache, {recursive: true});
const writeText = (name, text) => {
  const file = path.join(cache, `${name}.txt`);
  fs.writeFileSync(file, text, 'utf8');
  return file;
};
const capWeight = capLines.map((line) => Array.from(line.replaceAll('\\n', '')).length + 9);
const capTotal = capWeight.reduce((a, b) => a + b, 0);
let capCursor = 0;
const bold = path.join(root, 'public/horror/NotoSansDevanagari-bold.ttf');
const extra = path.join(root, 'public/horror/NotoSansDevanagari-extrabold.ttf');
const mono = path.join(root, 'public/horror/DejaVuSansMono.ttf');
const textFile = (name, text) => writeText(name, text);
const capFilters = capLines.map((text, i) => {
  const start = capCursor;
  capCursor += voiceDuration * capWeight[i] / capTotal;
  const end = capCursor;
  // drawtext reads literal newlines from text files; convert our readable \n markers first.
  const file = writeText(`caption-${String(i + 1).padStart(2, '0')}`, text.replaceAll('\\n', '\n'));
  const enable = `between(t\\,${start.toFixed(3)}\\,${end.toFixed(3)})`;
  return `drawtext=fontfile=${bold}:textfile=${file}:expansion=none:text_shaping=1:fontcolor=0xF5F1E7:fontsize=36:borderw=1:bordercolor=0x08090B:box=1:boxcolor=0x05070A@0.82:boxborderw=16:x=(w-250-text_w)/2:y=1455:enable='${enable}'`;
});

const textFilters = [
  // Minimal case-file frame retained as a consistent identity system.
  'drawbox=x=48:y=68:w=984:h=2:color=0xD6A95E@0.82:t=fill',
  `drawtext=fontfile=${mono}:text='NIGHT SHIFT  /  FICTION':expansion=none:fontcolor=0xE5D7BB:fontsize=19:x=54:y=90`,
  `drawtext=fontfile=${mono}:textfile=${textFile('clock', '12:17 AM')}:expansion=none:fontcolor=0xF0E7D8:fontsize=18:x=w-text_w-56:y=90`,
  // Immediate anomaly: state the impossible detail over the relevant station image.
  `drawtext=fontfile=${extra}:textfile=${textFile('hook-a', 'दूसरा प्लेटफ़ॉर्म')}:expansion=none:text_shaping=1:fontcolor=0xF7F2E8:fontsize=72:shadowcolor=black@0.9:shadowx=3:shadowy=4:x=(w-text_w)/2:y=445:enable='between(t\\,0.18\\,3.05)'`,
  `drawtext=fontfile=${bold}:textfile=${textFile('hook-b', 'नक़्शे में नहीं था')}:expansion=none:text_shaping=1:fontcolor=0xD8A852:fontsize=42:shadowcolor=black@0.9:shadowx=2:shadowy=3:x=(w-text_w)/2:y=560:enable='between(t\\,0.45\\,3.05)'`,
  // Briefly frame the handwritten 2 as the visual clue rather than adding fake map labels.
  `drawbox=x=575:y=900:w=155:h=185:color=0xE0B25F@0.92:t=5:enable='between(t\\,39.65\\,43.40)'`,
  // Closing question is tied to the visual clue, not an unrelated like/subscribe CTA.
  'drawbox=x=70:y=640:w=940:h=500:color=black@0.48:t=fill:enable=\'between(t\\,44.20\\,48.50)\'',
  `drawtext=fontfile=${mono}:textfile=${textFile('end-kicker', 'CASE FILE  /  00:17')}:expansion=none:fontcolor=0xD9A34F:fontsize=18:x=(w-text_w)/2:y=690:enable='between(t\\,44.65\\,48.15)'`,
  `drawtext=fontfile=${extra}:textfile=${textFile('end-title', 'प्लेटफ़ॉर्म नंबर दो')}:expansion=none:text_shaping=1:fontcolor=0xF5F0E5:fontsize=64:shadowcolor=black@0.9:shadowx=3:shadowy=4:x=(w-text_w)/2:y=770:enable='between(t\\,44.65\\,48.15)'`,
  `drawtext=fontfile=${bold}:textfile=${textFile('fiction', 'कहानी पूरी तरह काल्पनिक है')}:expansion=none:text_shaping=1:fontcolor=0xD9D1C1:fontsize=27:x=(w-text_w)/2:y=880:enable='between(t\\,44.65\\,48.15)'`,
  `drawtext=fontfile=${bold}:textfile=${textFile('question', 'क्या आपने नक़्शे में २ पहले देखा')}:expansion=none:text_shaping=1:fontcolor=0xF1C36F:fontsize=30:x=(w-text_w)/2:y=1010:enable='between(t\\,46.05\\,48.15)'`,
  `drawtext=fontfile=${mono}:text='NIGHTINGALE FILMS  /  SHORT 01':expansion=none:fontcolor=0xC4B8A0:fontsize=14:x=(w-text_w)/2:y=1740:enable='between(t\\,44.65\\,48.15)'`,
].concat(capFilters).join(',');

const videoParts = scenes.map((scene, i) => {
  const zoom = `zoompan=z='min(${scene.z}+(${scene.endZ - scene.z})*on/${scene.frames - 1}\\,${scene.endZ})':x='iw/2-(iw/zoom/2)+${scene.pan}*sin(on/70)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=${fps}`;
  return `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,${zoom},trim=end_frame=${scene.frames},setpts=PTS-STARTPTS,eq=saturation=0.76:contrast=1.08:brightness=-0.025,vignette=PI/4,format=yuv420p[s${i}]`;
});
const concatInputs = scenes.map((_, i) => `[s${i}]`).join('');
const graph = `${videoParts.join(';')};${concatInputs}concat=n=${scenes.length}:v=1:a=0[base];[base]noise=alls=2:allf=t+u,${textFilters},fade=t=out:st=47.75:d=0.75,format=yuv420p[vout];[${scenes.length}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1[voice];[${scenes.length + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.65,afade=t=in:st=0:d=1.2,afade=t=out:st=46.3:d=2.0[bed];[voice][bed]amix=inputs=2:duration=longest:dropout_transition=0,loudnorm=I=-14:TP=-1.5:LRA=7[aout]`;
const inputArgs = scenes.flatMap((scene) => ['-loop', '1', '-framerate', String(fps), '-i', path.join(root, 'public/horror', scene.file)]);
inputArgs.push('-i', path.join(root, 'audio/horror/short-voice.mp3'));
inputArgs.push('-i', path.join(root, 'public/horror/ambience.wav'));
fs.mkdirSync(path.dirname(output), {recursive: true});
const args = [
  '-y', '-hide_banner', '-loglevel', 'warning', ...inputArgs,
  '-filter_complex', graph, '-map', '[vout]', '-map', '[aout]', '-t', String(totalDuration),
  '-r', String(fps), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-threads', '4',
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', output,
];
console.log(`Rendering ${totalDuration}s 1080x1920 format-test Short to ${output}`);
const result = spawnSync(ffmpeg, args, {cwd: root, stdio: 'inherit'});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log(`Finished: ${(fs.statSync(output).size / 1024 / 1024).toFixed(1)} MB`);
