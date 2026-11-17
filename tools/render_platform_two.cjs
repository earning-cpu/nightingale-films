// Render the finished, original Platform Two short with full-featured FFmpeg.
// The main Remotion renderer normally needs Remotion's browser download host;
// this offline-friendly master uses the npm-distributed FFmpeg binary instead.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ffmpeg = path.join(root, 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg');
const output = path.join(root, 'deliverables', 'platform-no2-1080.mp4');
const fps = 30;
const seconds = 52.2;
const totalFrames = Math.round(fps * seconds);
const captionDuration = 44.45;
const capLines = [
  'यह एक कल्पित रहस्य-कथा है।',
  'छत्तीसगढ़ के एक छोटे रेलवे स्टेशन पर',
  'रात की ड्यूटी कर रहे राघव ने',
  'पटरियों के पार एक रोशन प्लेटफ़ॉर्म देखा।',
  'स्टेशन के नक़्शे में वहाँ कोई प्लेटफ़ॉर्म नहीं था।',
  'एक ट्रेन धीरे से आकर रुकी।',
  'आख़िरी डिब्बे की खिड़की पर किसी ने',
  'धुंध में दो शब्द लिखे: घर चलो।',
  'राघव ने कंट्रोल पैनल देखा। कोई ट्रेन दर्ज नहीं थी।',
  'उसने घड़ी देखी। समय पीछे जा रहा था।',
  'सुबह, ड्यूटी रजिस्टर में एक नई पंक्ति थी:',
  'यात्री एक। वापसी नहीं।',
  'नीचे राघव के हस्ताक्षर थे।',
  'वह पूरी रात स्टेशन के कमरे में ही रहा था।',
  'फिर उसने पुराना नक़्शा खोला।',
  'पीछे एक छोटी-सी पेंसिल लकीर थी: प्लेटफ़ॉर्म नंबर दो।',
];

if (!fs.existsSync(ffmpeg)) throw new Error(`FFmpeg not installed at ${ffmpeg}; run npm ci.`);
for (const file of ['public/horror/platform.png', 'public/horror/train.png', 'public/horror/register.png', 'public/horror/NotoSansDevanagari-bold.ttf', 'public/horror/NotoSansDevanagari-extrabold.ttf', 'public/horror/DejaVuSansMono.ttf', 'public/horror/ambience.wav', 'audio/horror/voice.mp3']) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Required source asset is missing: ${file}`);
}

const work = path.join(root, '.cache', 'platform-two-captions');
fs.mkdirSync(work, {recursive: true});
const writeText = (name, text) => {
  const target = path.join(work, `${name}.txt`);
  fs.writeFileSync(target, text, 'utf8');
  return target;
};
const capWeights = capLines.map((s) => Array.from(s).length + 9);
const capWeightSum = capWeights.reduce((a, b) => a + b, 0);
let capCursor = 0;
const capFilters = capLines.map((text, i) => {
  const start = capCursor;
  capCursor += captionDuration * capWeights[i] / capWeightSum;
  const end = capCursor;
  const file = writeText(`caption-${String(i + 1).padStart(2, '0')}`, text);
  const en = `between(t\\,${start.toFixed(3)}\\,${end.toFixed(3)})`;
  return `drawtext=fontfile=${path.join(root, 'public/horror/NotoSansDevanagari-bold.ttf')}:textfile=${file}:expansion=none:fontcolor=0xF1EBDD:fontsize=42:borderw=1:bordercolor=0x080A0C:box=1:boxcolor=0x05070A@0.78:boxborderw=18:x=(w-text_w)/2:y=h-190:enable='${en}'`;
});

const txt = (name, text) => writeText(name, text);
const titleOverlays = [
  `drawbox=x=72:y=51:w=1776:h=2:color=0xD1A55F@0.75:t=fill`,
  `drawtext=fontfile=${path.join(root, 'public/horror/DejaVuSansMono.ttf')}:text='NIGHT SHIFT / ORIGINAL STORY':expansion=none:fontcolor=0xE4C488:fontsize=19:x=72:y=69:enable='between(t\\,0\\,3.8)'`,
  `drawtext=fontfile=${path.join(root, 'public/horror/DejaVuSansMono.ttf')}:textfile=${txt('clock', '12:17 AM')}:expansion=none:fontcolor=0xE7DECF:fontsize=18:x=w-text_w-75:y=69`,
  `drawtext=fontfile=${path.join(root, 'public/horror/DejaVuSansMono.ttf')}:text='CHHATTISGARH  /  FICTION':expansion=none:fontcolor=0xD0C4AC:fontsize=15:x=w-text_w-75:y=104`,
  `drawtext=fontfile=${path.join(root, 'public/horror/NotoSansDevanagari-extrabold.ttf')}:textfile=${txt('title', 'प्लेटफ़ॉर्म नंबर दो')}:expansion=none:fontcolor=0xF5F0E5:fontsize=92:borderw=2:bordercolor=0x0A0B0D@0.85:shadowcolor=0x000000@0.85:shadowx=2:shadowy=4:x=(w-text_w)/2:y=405:enable='between(t\\,0.7\\,3.8)'`,
  `drawtext=fontfile=${path.join(root, 'public/horror/NotoSansDevanagari-bold.ttf')}:textfile=${txt('subtitle', 'एक कल्पित रेलवे रहस्य')}:expansion=none:fontcolor=0xE0D7C6:fontsize=29:shadowcolor=0x000000@0.8:shadowx=2:shadowy=2:x=(w-text_w)/2:y=525:enable='between(t\\,1.3\\,3.8)'`,
  `drawbox=x=0:y=0:w=iw:h=ih:color=black@0.42:t=fill:enable='between(t\\,45.1\\,52.2)'`,
  `drawtext=fontfile=${path.join(root, 'public/horror/DejaVuSansMono.ttf')}:textfile=${txt('log-entry', 'LOG ENTRY  /  00:17')}:expansion=none:fontcolor=0xD9A34F:fontsize=18:x=(w-text_w)/2:y=366:enable='between(t\\,45.65\\,51.55)'`,
  `drawtext=fontfile=${path.join(root, 'public/horror/NotoSansDevanagari-extrabold.ttf')}:textfile=${txt('end-title', 'प्लेटफ़ॉर्म नंबर दो')}:expansion=none:fontcolor=0xF5F0E5:fontsize=76:shadowcolor=black@0.9:shadowx=3:shadowy=4:x=(w-text_w)/2:y=422:enable='between(t\\,45.65\\,51.55)'`,
  `drawtext=fontfile=${path.join(root, 'public/horror/NotoSansDevanagari-bold.ttf')}:textfile=${txt('fiction-disclaimer', 'कहानी पूरी तरह काल्पनिक है')}:expansion=none:fontcolor=0xD9D1C1:fontsize=26:x=(w-text_w)/2:y=535:enable='between(t\\,45.65\\,51.55)'`,
  `drawtext=fontfile=${path.join(root, 'public/horror/DejaVuSansMono.ttf')}:text='NIGHTINGALE FILMS  /  SHORT NO. 01':expansion=none:fontcolor=0xC4B8A0:fontsize=14:x=(w-text_w)/2:y=h-88:enable='between(t\\,45.65\\,51.55)'`,
];

const move = (z0, dz, xpan) =>
  `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
  `zoompan=z='min(${z0}+${dz}*on\\,1.095)':x='iw/2-(iw/zoom/2)+${xpan}*sin(on/115)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=${fps},` +
  `trim=end_frame=${totalFrames},setpts=PTS-STARTPTS,eq=saturation=0.72:contrast=1.06:brightness=-0.045,vignette=PI/4,format=yuv420p`;
const alpha = (at, duration) => `clip((T-${at})/${duration}\\,0\\,1)`;
const visual = [
  `[0:v]${move('1.025', '0.000043', '10')}[p0]`,
  `[1:v]${move('1.035', '0.000041', '17')}[p1]`,
  `[2:v]${move('1.020', '0.000038', '-11')}[p2]`,
  `[p0][p1]blend=all_expr='A*(1-${alpha(13.65, 0.85)})+B*${alpha(13.65, 0.85)}':shortest=1[m1]`,
  `[m1][p2]blend=all_expr='A*(1-${alpha(31.45, 0.9)})+B*${alpha(31.45, 0.9)}':shortest=1[vbase]`,
].join(';');
const overlays = titleOverlays.concat(capFilters).join(',');
const graph = `${visual};[vbase]noise=alls=2:allf=t+u,${overlays},fade=t=in:st=0:d=0.28,fade=t=out:st=51.45:d=0.75,format=yuv420p[vout];[3:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.0[voice];[4:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.65,afade=t=in:st=0:d=1.5,afade=t=out:st=50.2:d=2.0[bed];[voice][bed]amix=inputs=2:duration=longest:dropout_transition=0,loudnorm=I=-14:TP=-1.5:LRA=7[aout]`;

const inputs = [
  '-loop', '1', '-framerate', String(fps), '-i', path.join(root, 'public/horror/platform.png'),
  '-loop', '1', '-framerate', String(fps), '-i', path.join(root, 'public/horror/train.png'),
  '-loop', '1', '-framerate', String(fps), '-i', path.join(root, 'public/horror/register.png'),
  '-i', path.join(root, 'audio/horror/voice.mp3'),
  '-i', path.join(root, 'public/horror/ambience.wav'),
];
fs.mkdirSync(path.dirname(output), {recursive: true});
const args = [
  '-y', '-hide_banner', '-loglevel', 'warning', ...inputs,
  '-filter_complex', graph, '-map', '[vout]', '-map', '[aout]', '-t', String(seconds),
  '-r', String(fps), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-threads', '4',
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', output,
];
console.log(`Rendering ${(seconds).toFixed(1)}s 1920x1080 H.264 master to ${output}`);
const result = spawnSync(ffmpeg, args, {cwd: root, stdio: 'inherit'});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log(`Finished: ${(fs.statSync(output).size / 1024 / 1024).toFixed(1)} MB`);
