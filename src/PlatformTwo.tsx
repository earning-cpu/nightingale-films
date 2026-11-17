import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/noto-sans-devanagari/devanagari-400.css';
import '@fontsource/noto-sans-devanagari/devanagari-700.css';
import '@fontsource/noto-sans-devanagari/devanagari-800.css';

const FPS = 30;
export const PLATFORM_TWO_FRAMES = 1566; // 52.2 seconds

const lines = [
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

const captions = (() => {
  const weights = lines.map((line) => line.length + 9);
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return lines.map((text, i) => {
    const start = cursor;
    cursor += (weights[i] / total) * 44.45;
    return {text, start, end: cursor};
  });
})();

const plates = [
  {src: 'horror/platform.png', from: 0, to: 460, x: -0.35, y: 0.1},
  {src: 'horror/train.png', from: 424, to: 966, x: 0.25, y: -0.12},
  {src: 'horror/register.png', from: 930, to: PLATFORM_TWO_FRAMES, x: -0.2, y: -0.08},
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const ease = (v: number) => {
  const x = clamp(v, 0, 1);
  return x * x * (3 - 2 * x);
};

export const PlatformTwo: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / FPS;
  const outro = ease((frame - 1350) / 48);
  const fadeOut = 1 - ease((frame - 1510) / 56);
  const caption = captions.find((item) => t >= item.start && t < item.end);
  const finalCard = ease((frame - 1368) / 28);

  return (
    <AbsoluteFill style={{backgroundColor: '#050608', color: '#eee7d9', overflow: 'hidden'}}>
      {plates.map((plate) => {
        const visible = interpolate(frame, [plate.from, plate.from + 24, plate.to - 24, plate.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const p = clamp((frame - plate.from) / Math.max(1, plate.to - plate.from), 0, 1);
        const scale = 1.045 + p * 0.065;
        const translateX = plate.x * p * 30;
        const translateY = plate.y * p * 20;
        return (
          <AbsoluteFill key={plate.src} style={{opacity: visible}}>
            <Img src={staticFile(plate.src)} style={{
              width, height, objectFit: 'cover',
              transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
              filter: 'saturate(.62) contrast(1.08) brightness(.74)',
            }} />
          </AbsoluteFill>
        );
      })}

      {/* Vignette, archive gate weave and fine-grain texture */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,5,8,.28), transparent 30%, rgba(2,3,5,.7)), radial-gradient(ellipse at 52% 44%, transparent 34%, rgba(1,2,4,.72) 100%)'}} />
      <AbsoluteFill style={{opacity: 0.17, mixBlendMode: 'screen', backgroundImage: `url(${staticFile('wow/grain.png')})`, backgroundSize: '320px 180px'}} />
      <AbsoluteFill style={{opacity: 0.12, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.1) 0px, rgba(255,255,255,.1) 1px, transparent 1px, transparent 5px)'}} />
      <AbsoluteFill style={{opacity: frame % 17 === 0 ? 0.08 : 0, backgroundColor: '#d5c9ad'}} />

      {/* Field report frame */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 17, letterSpacing: '0.22em', color: 'rgba(237,226,203,.69)'}}>
        <span>रात्रि ड्यूटी // काल्पनिक केस फ़ाइल ०२</span>
        <span style={{color: frame > 630 && frame < 1370 ? '#e6ad55' : 'rgba(237,226,203,.55)'}}>{frame < 900 ? '00:17 AM' : 'LOG // 01:17 AM'}</span>
      </div>
      <div style={{position: 'absolute', left: 70, top: 92, width: 60, height: 2, backgroundColor: '#c49752', opacity: 0.82}} />
      <div style={{position: 'absolute', right: 70, top: 88, fontFamily: 'ui-monospace, monospace', fontSize: 13, letterSpacing: '.28em', color: 'rgba(237,226,203,.48)'}}>CHHATTISGARH · FICTION</div>

      {/* Opening title */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 90px 28px', opacity: 1 - ease((frame - 96) / 25)}}>
        <div style={{fontFamily: 'ui-monospace, monospace', color: '#dfb56d', fontSize: 18, letterSpacing: '.42em', marginBottom: 26}}>NIGHT SHIFT / ORIGINAL STORY</div>
        <div style={{fontFamily: 'Noto Sans Devanagari, sans-serif', fontWeight: 800, fontSize: 92, lineHeight: 1.22, letterSpacing: '.01em', textShadow: '0 4px 32px rgba(0,0,0,.8)'}}>
          प्लेटफ़ॉर्म <span style={{color: '#d9a34f'}}>नंबर दो</span>
        </div>
        <div style={{fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: 24, color: 'rgba(237,226,203,.7)', marginTop: 20}}>एक कल्पित रेलवे रहस्य</div>
      </AbsoluteFill>

      {/* Hindi caption track. Timings are weighted to narration length. */}
      {caption && frame < 1378 && (
        <div style={{position: 'absolute', left: 150, right: 150, bottom: 108, textAlign: 'center', opacity: Math.min(ease((t - caption.start) / 0.18), ease((caption.end - t) / 0.2)), transform: `translateY(${(1 - ease((t - caption.start) / 0.18)) * 12}px)`}}>
          <span style={{display: 'inline-block', maxWidth: 1580, padding: '14px 28px 17px', background: 'rgba(4,6,9,.77)', borderLeft: '3px solid #d9a34f', fontFamily: 'Noto Sans Devanagari, sans-serif', fontWeight: 700, fontSize: 31, lineHeight: 1.55, color: '#f2eddf', textShadow: '0 2px 12px #000'}}>{caption.text}</span>
        </div>
      )}

      {/* The final reveal lands after the narration, then holds for a clean end frame. */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: finalCard * fadeOut, background: `rgba(2,3,5,${outro * 0.56})`, padding: 80}}>
        <div style={{fontFamily: 'ui-monospace, monospace', fontSize: 16, letterSpacing: '.4em', color: '#d9a34f', marginBottom: 24}}>LOG ENTRY // 00:17</div>
        <div style={{fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: 72, fontWeight: 800, lineHeight: 1.32, color: '#f2eddf'}}>प्लेटफ़ॉर्म <span style={{color: '#d9a34f'}}>नंबर दो</span></div>
        <div style={{fontFamily: 'Noto Sans Devanagari, sans-serif', fontSize: 23, color: 'rgba(237,226,203,.68)', marginTop: 20}}>कहानी पूरी तरह काल्पनिक है</div>
      </AbsoluteFill>

      {/* Audio is original: one licensed synthetic narration take and a generated score bed. */}
      <Audio src={staticFile('audio/horror/voice.mp3')} />
      <Audio src={staticFile('audio/horror/ambience.wav')} volume={0.42} />

      <AbsoluteFill style={{backgroundColor: '#000', opacity: 1 - fadeOut}} />
    </AbsoluteFill>
  );
};
