import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {Camera, Letterbox, Vignette} from '../lib';
import {C, F, clamp01, easeInOutCubic, easeOutCubic, easeOutExpo, prand} from '../theme';
import TL from './timeline.json';

/* ============================ types ============================ */

type Word = {w: string; f: number};
type Shot = {
  kind: 'img' | 'vid'; src: string;
  start?: number; from: number; dur: number;
  focusFrom?: [number, number]; focusTo?: [number, number];
  scale?: [number, number]; b?: number; sep?: number;
};
type Scene = {id: string; text: string; from: number; dur: number;
  voStart: number; voDur: number; words: Word[]; shots: Shot[]};

const SC: Record<string, Scene> = Object.fromEntries(
  (TL.scenes as Scene[]).map((s) => [s.id, s]));
const TOTAL = TL.total as number;

/* ============================ texture ============================ */

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

const Scanlines: React.FC<{opacity?: number}> = ({opacity = 0.10}) => (
  <AbsoluteFill style={{
    pointerEvents: 'none', opacity,
    background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.55) 0 1px, rgba(0,0,0,0) 1px 3px)',
  }} />
);

/* ============================ captions ============================ */

/** Three words at a time, word-accurate, lower third, inside the safe zone. */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const scene = (TL.scenes as Scene[]).find((s) => f >= s.from && f < s.from + s.dur);
  if (!scene) return null;
  const words = scene.words;
  if (!words.length) return null;

  const GROUPS = 3;
  let idx = -1;
  for (let i = 0; i < words.length; i += GROUPS) {
    const start = words[i].f;
    const end = i + GROUPS < words.length ? words[i + GROUPS].f : scene.from + scene.dur;
    if (f >= start - 3 && f < end + 2) { idx = i; break; }
  }
  if (idx < 0) return null;

  const group = words.slice(idx, idx + GROUPS);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 214}}>
      <div style={{
        display: 'flex', gap: '0.34em', fontFamily: F.sans, fontWeight: 800,
        fontSize: 50, letterSpacing: '0.005em',
        background: 'rgba(4,6,10,0.42)', padding: '10px 22px 12px', borderRadius: 3,
        textShadow: '0 2px 16px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.75)',
      }}>
        {group.map((w, k) => {
          const on = f >= w.f;
          const a = easeOutCubic(clamp01((f - w.f + 4) / 6));
          return (
            <span key={idx + k} style={{
              color: C.white,
              opacity: (on ? 1 : 0.42) * (0.55 + 0.45 * a),
            }}>{w.w.replace(/[.,;:]$/, '')}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ============================ shots ============================ */

const StillShot: React.FC<{shot: Shot; scene: Scene}> = ({shot, scene}) => {
  const [fx0, fy0] = shot.focusFrom ?? [50, 50];
  const [fx1, fy1] = shot.focusTo ?? [50, 50];
  const [s0, s1] = shot.scale ?? [1.04, 1.10];
  return (
    <Camera
      src={shot.src} from={shot.from} dur={shot.dur}
      focusFrom={[fx0, fy0]} focusTo={[fx1, fy1]}
      scaleFrom={s0} scaleTo={s1} ease="inOut" handheld={0.16}
      brightness={shot.b ?? 0.9} sepia={shot.sep ?? 0.08}
    />
  );
};

/** A real 2.5D parallax clip: depth-warped from one plate, not a pan-and-zoom. */
const VidShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const local = f - shot.from;
  const off = Math.round(((shot.start ?? 0) * 30 + local));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <OffthreadVideo
        src={staticFile(shot.src)}
        startFrom={off}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover',
          filter: 'brightness(0.94) saturate(0.8) contrast(1.06)'}}
      />
    </AbsoluteFill>
  );
};

const Shots: React.FC<{scene: Scene}> = ({scene}) => {
  const f = useCurrentFrame();
  const shot = scene.shots.find((s) => f >= s.from && f < s.from + s.dur);
  if (!shot) return null;
  return (
    <AbsoluteFill>
      {shot.kind === 'vid' ? <VidShot shot={shot} /> : <StillShot shot={shot} scene={scene} />}
      <AbsoluteFill style={{
        background: 'linear-gradient(to top, rgba(5,7,11,0.88) 0%, rgba(5,7,11,0.28) 30%, rgba(5,7,11,0) 58%)',
      }} />
    </AbsoluteFill>
  );
};

/* ============================ graphics ============================ */

const Slug: React.FC<{text: string; at: number; color?: string}> = ({text, at, color = 'rgba(233,226,210,0.55)'}) => {
  const f = useCurrentFrame();
  const o = easeOutCubic(clamp01((f - at) / 10));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 112, top: 116, fontFamily: F.mono,
      fontSize: 17, letterSpacing: '0.40em', color, opacity: o * 0.92}}>{text}</div>
  );
};

/* ---- the hook: three bars that slam in on the words ---- */
const HookBars: React.FC = () => {
  const s = SC.hook;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const w72 = s.words.find((w) => /72|seventy/i.test(w.w));
  const at = w72 ? w72.f : s.from + 60;
  const p = easeOutExpo(clamp01((f - at) / 9));
  const rule = easeOutCubic(clamp01((f - s.from - 2) / 12));
  return (
    <AbsoluteFill style={{padding: '132px 0 0 112px'}}>
      <div style={{opacity: p, transform: `translateY(${(1 - p) * 18}px)`}}>
        <div style={{
          fontFamily: F.mono, fontSize: 148, fontWeight: 700, color: C.white,
          letterSpacing: '-0.045em', lineHeight: 0.86,
          textShadow: '0 12px 70px rgba(0,0,0,0.95)',
        }}>72</div>
        <div style={{
          fontFamily: F.mono, fontSize: 22, letterSpacing: '0.66em',
          color: C.amber, marginTop: 12, paddingLeft: 6,
        }}>SECONDS</div>
        <div style={{
          height: 3, width: 128, marginTop: 16, background: C.warn,
          transform: `scaleX(${rule})`, transformOrigin: 'left center',
        }} />
      </div>
    </AbsoluteFill>
  );
};

/* ---- d: the frequency ---- */
const Frequency: React.FC = () => {
  const s = SC.d;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const lock = s.words.find((w) => /megahertz/i.test(w.w))?.f ?? s.voStart + 70;
  const p = easeInOutCubic(clamp01((f - s.voStart) / Math.max(1, lock - s.voStart)));
  const val = 1300 + 120.4556 * p;
  const sweep = clamp01((f - s.voStart) / s.voDur);
  return (
    <AbsoluteFill style={{background: 'rgba(5,7,10,0.72)'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.55}}>
        {Array.from({length: 96}).map((_, i) => {
          const h = 8 + prand(i * 3.1) * 52 * (1 + 2.6 * Math.exp(-Math.pow((i - 68) / 6.5, 2)));
          return <rect key={i} x={`${i * 1.045}%`} y={676 - h} width="0.42%" height={h}
            fill={Math.abs(i - 68) < 4 ? '#D9A441' : 'rgba(233,226,210,0.20)'} />;
        })}
      </svg>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: F.mono, fontSize: 150, fontWeight: 600, color: C.white,
          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
          textShadow: '0 8px 50px rgba(0,0,0,0.9)'}}>
          {val.toFixed(4)}
        </div>
        <div style={{fontFamily: F.mono, fontSize: 32, letterSpacing: '0.62em', color: C.amber, marginTop: 4}}>MHz</div>
        <div style={{height: 2, width: 760, marginTop: 26,
          background: `linear-gradient(to right, rgba(217,164,65,0) 0 ${sweep * 46}%, ${C.amber} ${sweep * 46}%, rgba(217,164,65,0) ${sweep * 46 + 3}%, rgba(233,226,210,0.10) ${sweep * 46 + 3}% 100%)`}} />
        <div style={{fontFamily: F.type, fontSize: 34, color: C.paper, marginTop: 30,
          opacity: clamp01((f - lock - 6) / 10)}}>the hydrogen line</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---- e: the six characters ---- */
const CHARS = ['6', 'E', 'Q', 'U', 'J', '5'];
const MEANING = ['6x', '14x', '26x', '30x', '19x', '5x'];

const Printout: React.FC = () => {
  const s = SC.e;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const first = s.words.find((w) => w.w === '6')?.f ?? s.voStart + 60;
  const step = Math.max(8, Math.round((s.voDur * 0.42) / 6));
  const bg = easeOutCubic(clamp01((f - s.from) / 16));
  const slide = easeInOutCubic(clamp01((f - s.from) / s.dur));
  return (
    <AbsoluteFill style={{background: 'rgba(6,8,12,0.90)'}}>
      <div style={{position: 'absolute', right: '7%', top: '50%', transform: 'translateY(-50%)', width: '55%'}}>
        <div style={{display: 'flex', gap: 22, justifyContent: 'flex-end'}}>
          {CHARS.map((ch, i) => {
            const at = first + i * step;
            const o = easeOutExpo(clamp01((f - at) / 7));
            const hot = ch === 'U';
            return (
              <div key={ch} style={{
                width: 116, height: 150, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: o > 0 ? (hot ? '#C4382B' : '#E9E2D2') : 'transparent',
                border: `2px solid ${hot ? '#C4382B' : '#E9E2D2'}`, borderRadius: 5,
                opacity: o, transform: `translateY(${(1 - o) * 22}px) scale(${0.92 + 0.08 * o})`,
              }}>
                <div style={{fontFamily: F.mono, fontSize: 82, fontWeight: 700,
                  color: hot ? '#F4F1EA' : '#141118', lineHeight: 1}}>{ch}</div>
                <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.14em',
                  color: hot ? 'rgba(244,241,234,0.85)' : 'rgba(20,17,24,0.62)', marginTop: 5}}>
                  {MEANING[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---- f: the card ---- */
const WowCard: React.FC = () => {
  const s = SC.f;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const wowAt = s.words.find((w) => /wow/i.test(w.w))?.f ?? s.voStart + 60;
  const circleP = easeInOutCubic(clamp01((f - wowAt + 12) / 24));
  const inkP = easeOutExpo(clamp01((f - wowAt) / 8));
  const rise = easeOutExpo(clamp01((f - s.from) / 15));
  const push = 1 + 0.05 * clamp01((f - s.from) / s.dur);
  return (
    <AbsoluteFill style={{background: 'rgba(7,9,13,0.92)', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{
        position: 'relative', width: 1240, padding: '50px 60px 58px', marginBottom: 96,
        background: '#E9E2D2', boxShadow: '0 40px 110px rgba(0,0,0,0.8)',
        transform: `rotate(-0.7deg) translateY(${(1 - rise) * 24}px) scale(${push})`, opacity: rise,
      }}>
        <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.34em', color: '#6B5D42'}}>
          OHIO STATE UNIVERSITY · BIG EAR · 15 AUG 1977
        </div>
        <div style={{fontFamily: F.mono, fontSize: 32, color: '#141118', marginTop: 22, letterSpacing: '0.16em'}}>
          CHANNEL 2 · RECEIVER B
        </div>
        <div style={{position: 'relative', marginTop: 26, display: 'inline-block'}}>
          <div style={{fontFamily: F.mono, fontSize: 176, fontWeight: 700, letterSpacing: '0.10em',
            color: '#141118', lineHeight: 1}}>6EQUJ5</div>
          <svg width="820" height="320" style={{position: 'absolute', left: -52, top: -78, pointerEvents: 'none'}}>
            <ellipse cx="410" cy="160" rx="382" ry="132" fill="none" stroke="#B5342A" strokeWidth="5"
              strokeLinecap="round" strokeDasharray="1700" strokeDashoffset={1700 * (1 - circleP)}
              transform="rotate(-3 410 160)" />
          </svg>
        </div>
        <div style={{position: 'absolute', right: 44, top: 24, fontFamily: F.type, fontSize: 128,
          color: '#B5342A', opacity: inkP, transform: `rotate(-8deg) scale(${0.84 + 0.16 * inkP})`,
          transformOrigin: 'top right'}}>Wow!</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---- k: end ---- */
const EndCard: React.FC = () => {
  const s = SC.k;
  const f = useCurrentFrame();
  if (f < s.from || f > s.from + s.dur) return null;
  const a = easeOutExpo(clamp01((f - s.from - 4) / 18));
  const b = clamp01((f - s.from - 52) / 16);
  const c = clamp01((f - s.from - 92) / 16);
  return (
    <AbsoluteFill style={{background: 'rgba(6,8,12,0.94)', justifyContent: 'center', alignItems: 'center'}}>
      <AbsoluteFill style={{background:
        'linear-gradient(to top, rgba(217,164,65,0.30) 0%, rgba(160,118,58,0.12) 18%, rgba(6,8,12,0) 54%)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: F.mono, fontSize: 118, letterSpacing: '0.14em', color: C.white,
          opacity: a, transform: `translateY(${(1 - a) * 14}px)`}}>6EQUJ5</div>
        <div style={{height: 2, width: 560, marginTop: 24, background: 'rgba(233,226,210,0.26)'}} />
        <div style={{fontFamily: F.sans, fontSize: 44, fontWeight: 700, letterSpacing: '0.18em',
          color: C.amber, marginTop: 28, opacity: b}}>UNEXPLAINED</div>
        <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.24em',
          color: 'rgba(233,226,210,0.50)', marginTop: 44, opacity: c, textAlign: 'center', lineHeight: 1.95}}>
          BIG EAR RADIO OBSERVATORY · DELAWARE, OHIO<br />
          ARECIBO / PLANETARY HABITABILITY LAB ANALYSIS, 2024<br />
          SOURCES: ARXIV 2408.08513 · WIKIPEDIA · NASA
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ============================ composition ============================ */

const SceneLayer: React.FC<{id: string}> = ({id}) => {
  const s = SC[id];
  const f = useCurrentFrame();
  if (f < s.from || f >= s.from + s.dur) return null;
  return (
    <AbsoluteFill>
      <Shots scene={s} />
      {id === 'hook' && <HookBars />}
      {id === 'd' && <Frequency />}
      {id === 'e' && <Printout />}
      {id === 'f' && <WowCard />}
      {id === 'k' && <EndCard />}
      {id !== 'hook' && <Slug text={SLUG[id] ?? ''} at={s.from + 6} />}
    </AbsoluteFill>
  );
};

const SLUG: Record<string, string> = {
  a: 'NEVER HEARD AGAIN',
  b: 'DELAWARE, OHIO · DRIFT SCAN',
  c: 'NO TRACKING · 72 SECONDS OF BEAM',
  d: 'RECEIVER B · 1420 MHz',
  e: 'PRINTOUT · CHANNEL 2',
  f: 'THE MARGIN',
  g: '51 YEARS OF SILENCE',
  hook: '15 AUG 1977 · BIG EAR · OHIO',
  h: 'CANDIDATE · 2024',
  i: 'HYPOTHESIS · HYDROGEN MASER',
  j: 'STILL UNEXPLAINED',
  k: '72 SECONDS',
};

export const Wow: React.FC = () => (
  <AbsoluteFill style={{background: '#05070A'}}>
    <Audio src={staticFile('wow_mix_v2_norm.mp3')} />
    {Object.keys(SC).map((id) => <SceneLayer key={id} id={id} />)}
    <Vignette />
    <Scanlines opacity={0.05} />
    <FilmGrain opacity={0.19} />
    <Letterbox />
    <Captions />
  </AbsoluteFill>
);

export const WOW_TOTAL = TOTAL;
