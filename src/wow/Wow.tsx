import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Camera, Grain, Letterbox, Vignette} from '../lib';
import {C, F, clamp01, easeInOutCubic, easeOutCubic, easeOutExpo, prand, win} from '../theme';
import TL from './timeline.json';

/* ===================== helpers ===================== */

type Scene = {
  id: string; text: string; plate: string | null;
  from: number; dur: number; voStart: number; voDur: number;
  words: {w: string; f: number}[];
};

const S: Record<string, Scene> = Object.fromEntries(
  (TL.scenes as Scene[]).map((s) => [s.id, s]));

const At: React.FC<{from: number; dur: number; children: React.ReactNode}> = ({from, dur, children}) => {
  const f = useCurrentFrame();
  if (f < from || f >= from + dur) return null;
  return <AbsoluteFill>{children}</AbsoluteFill>;
};

/** Word timing helper: the frame a given word is spoken. */
const wordF = (sid: string, needle: string, fallback = 0): number => {
  const s = S[sid];
  if (!s) return fallback;
  const w = s.words.find((x) => x.w.toLowerCase().replace(/[^a-z0-9]/g, '')
    === needle.toLowerCase().replace(/[^a-z0-9]/g, ''));
  return w ? w.f : fallback;
};

const Slug: React.FC<{text: string; from: number; color?: string}> = ({text, from, color = C.paperDim}) => {
  const f = useCurrentFrame();
  const o = easeOutCubic(clamp01((f - from) / 12));
  return (
    <div style={{
      position: 'absolute', left: 118, top: 118, fontFamily: F.mono, fontSize: 17,
      letterSpacing: '0.40em', color, opacity: o * 0.9,
    }}>{text}</div>
  );
};

/** Fade in and out around a frame window — used for every caption. */
const Fade: React.FC<{start: number; end: number; children: React.ReactNode;
  style?: React.CSSProperties}> = ({start, end, children, style}) => {
  const f = useCurrentFrame();
  const o = clamp01((f - start) / 10) * (1 - clamp01((f - (end - 10)) / 10));
  if (o <= 0) return null;
  return <div style={{opacity: o, ...style}}>{children}</div>;
};



/** Real film grain MOVES frame to frame. A static overlay is what makes a
    still shot read as a frozen image — and it is what freezedetect catches. */
const FilmGrain: React.FC<{opacity?: number}> = ({opacity = 0.20}) => {
  const f = useCurrentFrame();
  const ox = Math.round(prand(f * 1.7) * 512);
  const oy = Math.round(prand(f * 2.3 + 11) * 512);
  return (
    <AbsoluteFill style={{
      pointerEvents: 'none', mixBlendMode: 'overlay', opacity,
      backgroundImage: `url(${staticFile('wow/grain.png')})`,
      backgroundRepeat: 'repeat',
      backgroundPosition: `${ox}px ${oy}px`,
    }} />
  );
};

/** Continuous, sub-perceptual drift so no card is ever a frozen frame. */
const Drift: React.FC<{from: number; dur: number; children: React.ReactNode; amount?: number}> =
  ({from, dur, children, amount = 0.045}) => {
    const f = useCurrentFrame();
    const p = clamp01((f - from) / dur);
    const sc = 1 + amount * p;
    const dy = -14 * p;
    const dx = 8 * Math.sin(p * 3.1);
    return (
      <AbsoluteFill style={{transform: `scale(${sc}) translate(${dx}px, ${dy}px)`}}>
        {children}
      </AbsoluteFill>
    );
  };

/* ===================== scene: still + slug ===================== */
const Still: React.FC<{sid: string; src: string; slug: string; slugAt?: number;
  focusFrom?: [number, number]; focusTo?: [number, number];
  scaleFrom?: number; scaleTo?: number; brightness?: number; sepia?: number}> = ({
  sid, src, slug, slugAt = 0, focusFrom = [50, 50], focusTo = [52, 52],
  scaleFrom = 1.04, scaleTo = 1.09, brightness = 0.9, sepia = 0.1}) => {
  const s = S[sid];
  return (
    <At from={s.from} dur={s.dur}>
      <Camera src={src} from={s.from} dur={s.dur} focusFrom={focusFrom} focusTo={focusTo}
        scaleFrom={scaleFrom} scaleTo={scaleTo} ease="inOut" handheld={0.14}
        brightness={brightness} sepia={sepia} />
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(6,8,12,0.86) 0%, rgba(6,8,12,0.30) 34%, rgba(6,8,12,0) 62%)'}} />
      <Slug text={slug} from={s.from + slugAt} />
      <Vignette />
      <Grain opacity={0.15} />
      <FilmGrain opacity={0.17} />
      <Letterbox />
    </At>
  );
};

/* ===================== d: the frequency ===================== */
const Frequency: React.FC = () => {
  const s = S.d;
  const f = useCurrentFrame();
  const local = f - s.from;
  if (local < 0 || local > s.dur) return null;
  const lock = wordF('d', 'megahertz', s.voStart + 60);
  const p = easeInOutCubic(clamp01((f - s.voStart) / Math.max(1, lock - s.voStart)));
  const val = 1300 + 120.4556 * p;
  const sweep = clamp01((f - s.voStart) / s.voDur);
  return (
    <Drift from={s.from} dur={s.dur}><AbsoluteFill style={{background: '#05070A'}}>
      {/* faint spectral floor */}
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.5}}>
        {Array.from({length: 96}).map((_, i) => {
          const h = 6 + prand(i * 3.1) * 46 * (1 + 2.4 * Math.exp(-Math.pow((i - 68) / 7, 2)));
          return <rect key={i} x={`${i * 1.045}%`} y={640 - h} width="0.42%" height={h}
            fill={Math.abs(i - 68) < 4 ? '#D9A441' : 'rgba(233,226,210,0.20)'} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 118, top: 128, fontFamily: F.mono,
        fontSize: 16, letterSpacing: '0.40em', color: C.paperDim}}>BIG EAR · RECEIVER BAND</div>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: F.mono, fontSize: 132, fontWeight: 600, color: C.white,
          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>
          {val.toFixed(4)}
        </div>
        <div style={{fontFamily: F.mono, fontSize: 30, letterSpacing: '0.62em',
          color: C.amber, marginTop: 6}}>MHz</div>
        <div style={{height: 2, width: 720, marginTop: 30,
          background: `linear-gradient(to right, rgba(217,164,65,0) 0 ${sweep * 46}%, ${C.amber} ${sweep * 46}%, rgba(217,164,65,0) ${sweep * 46 + 4}%, rgba(233,226,210,0.10) ${sweep * 46 + 4}% 100%)`}} />
        <div style={{fontFamily: F.type, fontSize: 30, color: C.paper, marginTop: 34,
          opacity: clamp01((f - lock - 8) / 12)}}>
          the hydrogen line
        </div>
      </AbsoluteFill>
      <FilmGrain opacity={0.22} />
      <Letterbox />
    </AbsoluteFill></Drift>
  );
};

/* ===================== e: the printout ===================== */
const CHARS = ['6', 'E', 'Q', 'U', 'J', '5'];
const MEANING = ['6×', '14×', '26×', '30×', '19×', '5×'];

const Printout: React.FC = () => {
  const s = S.e;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const startChars = s.voStart + 12;
  const step = 9;
  const bg = easeOutCubic(clamp01((f - s.from) / 20));
  const slide = easeInOutCubic(clamp01((f - s.from) / s.dur));
  const ROWS = 90;
  return (
    <Drift from={s.from} dur={s.dur} amount={0.03}><AbsoluteFill style={{background: '#080A0E'}}>
      {/* one column of the printer's output, running past the top and bottom */}
      <div style={{
        position: 'absolute', left: '9%', width: '23%', top: 0, bottom: 0,
        background: 'linear-gradient(#E7DFCD, #D8CEB6)',
        opacity: 0.96 * bg,
        transform: `perspective(1600px) rotateX(${5 - 3 * bg}deg) translateY(${-slide * 260}px)`,
        boxShadow: '0 50px 140px rgba(0,0,0,0.85)',
        overflow: 'hidden',
      }}>
        <div style={{fontFamily: F.mono, fontSize: 15, lineHeight: 1.62,
          color: 'rgba(40,34,24,0.34)', padding: '0 18px', filter: 'blur(1.0px)'}}>
          {Array.from({length: ROWS}).map((_, r) => (
            <div key={r}>{Array.from({length: 3}).map((__, c) => (
              <span key={c} style={{marginRight: 16}}>
                {Array.from({length: 7}).map((___, k) =>
                  `${Math.floor(prand(r * 131 + c * 17 + k) * 9)}`).join('')}
              </span>
            ))}</div>
          ))}
        </div>
      </div>

      {/* the six real characters, revealed on their spoken words */}
      <div style={{position: 'absolute', right: '8%', top: '50%',
        transform: 'translateY(-50%)', width: '52%'}}>
        <div style={{display: 'flex', gap: 22, justifyContent: 'flex-end'}}>
          {CHARS.map((ch, i) => {
            const at = startChars + i * step;
            const o = easeOutExpo(clamp01((f - at) / 8));
            const hot = ch === 'U';
            return (
              <div key={ch} style={{
                width: 118, height: 152, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: o > 0 ? (hot ? '#C4382B' : '#E9E2D2') : 'transparent',
                border: `2px solid ${hot ? '#C4382B' : '#E9E2D2'}`,
                borderRadius: 6, opacity: o, transform: `translateY(${(1 - o) * 18}px)`,
              }}>
                <div style={{fontFamily: F.mono, fontSize: 84, fontWeight: 700,
                  color: hot ? '#F4F1EA' : '#141118', lineHeight: 1}}>{ch}</div>
                <div style={{fontFamily: F.mono, fontSize: 17, letterSpacing: '0.14em',
                  color: hot ? 'rgba(244,241,234,0.85)' : 'rgba(20,17,24,0.62)', marginTop: 6}}>
                  {MEANING[i]}
                </div>
              </div>
            );
          })}
        </div>
        <Fade start={startChars + 54} end={s.from + s.dur}>
          <div style={{fontFamily: F.type, fontSize: 27, color: C.paper,
            marginTop: 34, textAlign: 'right'}}>
            intensity above the noise, per ten seconds
          </div>
        </Fade>
      </div>
      <FilmGrain opacity={0.18} />
      <Letterbox />
    </AbsoluteFill></Drift>
  );
};

/* ===================== f: the card ===================== */
const WowCard: React.FC = () => {
  const s = S.f;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const wowAt = wordF('f', 'wow', s.voStart + 60);
  const circleP = easeInOutCubic(clamp01((f - wowAt + 10) / 26));
  const inkP = easeOutExpo(clamp01((f - wowAt) / 10));
  const rise = easeOutExpo(clamp01((f - s.from) / 18));
  return (
    <Drift from={s.from} dur={s.dur} amount={0.035}><AbsoluteFill style={{background: '#0A0C10', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{
        position: 'relative', width: 1180, padding: '54px 64px 62px',
        background: '#E9E2D2', boxShadow: '0 40px 110px rgba(0,0,0,0.75)',
        transform: `rotate(-0.7deg) translateY(${(1 - rise) * 26}px)`, opacity: rise,
      }}>
        <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.34em', color: '#6B5D42'}}>
          OHIO STATE UNIVERSITY · BIG EAR · 15 AUG 1977
        </div>
        <div style={{fontFamily: F.mono, fontSize: 34, color: '#141118', marginTop: 26,
          letterSpacing: '0.16em'}}>CHANNEL 2 · RECEIVER B</div>

        <div style={{position: 'relative', marginTop: 30, display: 'inline-block'}}>
          <div style={{fontFamily: F.mono, fontSize: 168, fontWeight: 700,
            letterSpacing: '0.10em', color: '#141118', lineHeight: 1}}>6EQUJ5</div>
          <svg width="760" height="300" style={{position: 'absolute', left: -46, top: -74,
            pointerEvents: 'none'}}>
            <ellipse cx="380" cy="150" rx="352" ry="126" fill="none" stroke="#B5342A"
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray="1600" strokeDashoffset={1600 * (1 - circleP)}
              transform="rotate(-3 380 150)" />
          </svg>
        </div>

        <div style={{
          position: 'absolute', right: 74, top: 96, fontFamily: F.type, fontSize: 132,
          color: '#B5342A', opacity: inkP, transform: `rotate(-9deg) scale(${0.86 + 0.14 * inkP})`,
        }}>Wow!</div>

        <div style={{fontFamily: F.type, fontSize: 25, color: '#4A3F2C', marginTop: 34,
          opacity: clamp01((f - wowAt - 22) / 14)}}>
          written in the margin by Jerry R. Ehman, a few days later
        </div>
      </div>
      <FilmGrain opacity={0.20} />
      <Letterbox />
    </AbsoluteFill></Drift>
  );
};

/* ===================== k: end card ===================== */
const EndCard: React.FC = () => {
  const s = S.k;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const a = easeOutExpo(clamp01((f - s.from - 6) / 22));
  const b = clamp01((f - s.from - 70) / 20);
  const c = clamp01((f - s.from - 120) / 20);
  const p = clamp01((f - s.from) / s.dur);
  return (
    <Drift from={s.from} dur={s.dur} amount={0.05}>
    <AbsoluteFill style={{background: '#12151C'}}>
      {/* a low, warm ground — the observatory's horizon, out of focus */}
      <AbsoluteFill style={{background:
        'linear-gradient(to top, rgba(217,164,65,0.30) 0%, rgba(160,118,58,0.14) 18%, rgba(18,21,28,0) 52%)'}} />
      <FilmGrain opacity={0.22} />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: F.mono, fontSize: 112, letterSpacing: '0.14em',
          color: C.white, opacity: a, transform: `translateY(${(1 - a) * 16}px)`}}>6EQUJ5</div>
        <div style={{height: 2, width: 560, marginTop: 26, background: 'rgba(233,226,210,0.26)'}} />
        <div style={{fontFamily: F.sans, fontSize: 42, fontWeight: 700, letterSpacing: '0.18em',
          color: C.amber, marginTop: 30, opacity: b}}>UNEXPLAINED</div>
        <div style={{fontFamily: F.mono, fontSize: 17, letterSpacing: '0.24em',
          color: 'rgba(233,226,210,0.52)', marginTop: 48, opacity: c, textAlign: 'center',
          lineHeight: 1.95}}>
          BIG EAR RADIO OBSERVATORY · DELAWARE, OHIO<br />
          ARECIBO / PLANETARY HABITABILITY LAB ANALYSIS, 2024<br />
          SOURCES: ARXIV 2408.08513 · WIKIPEDIA · NASA
        </div>
      </AbsoluteFill>
      <Letterbox />
    </AbsoluteFill>
    </Drift>
  );
};

/* ===================== composition ===================== */
export const Wow: React.FC = () => (
  <AbsoluteFill style={{background: '#05070A'}}>
    <Audio src={staticFile('wow_mix_norm.wav')} />

    <Still sid="a" src="wow/img/w_04.png" slug="15 AUG 1977 · DELAWARE, OHIO"
      focusFrom={[50, 62]} focusTo={[50, 54]} scaleFrom={1.05} scaleTo={1.01} brightness={0.82} sepia={0.12} />
    <Still sid="b" src="wow/img/radio_01.png" slug="T + 72 SECONDS"
      focusFrom={[38, 58]} focusTo={[62, 52]} scaleFrom={1.02} scaleTo={1.10} brightness={1.0} sepia={0} />
    <Still sid="c" src="wow/img/w_07.png" slug="DRIFT SCAN · NO TRACKING"
      focusFrom={[56, 40]} focusTo={[44, 56]} scaleFrom={1.08} scaleTo={1.02} brightness={1.05} sepia={0} />
    <Frequency />
    <Printout />
    <WowCard />
    <Still sid="g" src="wow/img/w_04.png" slug="51 YEARS OF SILENCE"
      focusFrom={[46, 44]} focusTo={[54, 52]} scaleFrom={1.03} scaleTo={1.11} brightness={0.95} sepia={0.05} />
    <Still sid="h" src="wow/img/w_03.png" slug="2024 · ARECIBO ARCHIVE"
      focusFrom={[52, 50]} focusTo={[46, 54]} scaleFrom={1.02} scaleTo={1.09} brightness={0.9} sepia={0.1} />
    <Still sid="i" src="wow/img/w_06.png" slug="HYPOTHESIS · HYDROGEN MASER"
      focusFrom={[44, 56]} focusTo={[56, 44]} scaleFrom={1.06} scaleTo={1.02} brightness={0.88} sepia={0.18} />
    <Still sid="j" src="wow/img/w_02.png" slug="STILL UNEXPLAINED"
      focusFrom={[50, 48]} focusTo={[50, 56]} scaleFrom={1.02} scaleTo={1.08} brightness={0.72} sepia={0.2} />
    <EndCard />

    <Vignette />
  </AbsoluteFill>
);
