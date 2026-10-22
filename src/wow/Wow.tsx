import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, F, clamp01, easeInOutCubic, easeOutCubic, easeOutExpo, prand} from '../theme';
import TL from './timeline.json';

/* ============================ types ============================ */
type Word = {w: string; f: number};
type Shot = {
  kind: 'img' | 'vid' | 'layer'; src: string; move: string;
  start?: number; from: number; dur: number; b?: number; sep?: number;
};
type Scene = {id: string; text: string; from: number; dur: number;
  voStart: number; voDur: number; words: Word[]; shots: Shot[]};

const SC: Record<string, Scene> = Object.fromEntries((TL.scenes as Scene[]).map((s) => [s.id, s]));
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
      backgroundRepeat: 'repeat', backgroundPosition: `${ox}px ${oy}px`,
    }} />
  );
};

/** Moving light: a soft anamorphic sweep that crosses the frame slowly, plus a
 *  halation bloom on highlights. Keeps the frame alive even when the plate is
 *  nearly still, without being a visible "effect". */
const LightPlay: React.FC = () => {
  const f = useCurrentFrame();
  const x = ((f / TOTAL) * 260 - 60) % 200;
  const flare = 0.06 + 0.04 * Math.sin(f / 47);
  return (
    <>
      <AbsoluteFill style={{
        pointerEvents: 'none', mixBlendMode: 'screen', opacity: flare,
        background: `linear-gradient(105deg, rgba(255,214,150,0) ${x - 18}%, rgba(255,214,150,0.75) ${x}%, rgba(255,214,150,0) ${x + 16}%)`,
      }} />
      <AbsoluteFill style={{
        pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.10,
        background: 'radial-gradient(120% 70% at 50% 8%, rgba(255,196,120,0.5) 0%, rgba(255,196,120,0) 60%)',
      }} />
    </>
  );
};

const Dust: React.FC<{count?: number}> = ({count = 22}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <svg width="100%" height="100%">
        {Array.from({length: count}).map((_, i) => {
          const x = (prand(i * 3.1) * 100 + f * (0.010 + 0.02 * prand(i))) % 100;
          const y = (prand(i * 7.7) * 100 - f * (0.008 + 0.014 * prand(i + 2)) + 200) % 100;
          return <circle key={i} cx={`${x}%`} cy={`${y}%`}
            r={0.5 + prand(i * 5.3) * 1.4} fill="#E8DFC8"
            opacity={0.05 + prand(i * 2.2) * 0.10} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Scanlines: React.FC<{opacity?: number}> = ({opacity = 0.05}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity,
    background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.55) 0 1px, rgba(0,0,0,0) 1px 3px)'}} />
);

const Vignette: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 46%, rgba(2,4,8,0.48) 100%)'}} />
);

/* ============================ camera helpers ============================ */

/** Ease + a slow breathing scale so no frame is ever mathematically static. */
const moveParams = (frame: number, from: number, dur: number, move: string) => {
  const p = easeInOutCubic(clamp01((frame - from) / Math.max(1, dur)));
  const ease = easeOutCubic(p);
  switch (move) {
    case 'push-in':   return {s0: 1.06, s1: 1.20, dx: 0, dy: 0};
    case 'pull-out':  return {s0: 1.20, s1: 1.07, dx: 0, dy: 0};
    case 'drift-left':return {s0: 1.16, s1: 1.16, dx: 2.2, dy: 0};
    case 'drift-right':return {s0: 1.16, s1: 1.16, dx: -2.2, dy: 0};
    case 'tilt-up':   return {s0: 1.14, s1: 1.18, dx: 0, dy: 1.6};
    case 'tilt-down': return {s0: 1.14, s1: 1.18, dx: 0, dy: -1.6};
    case 'rack':      return {s0: 1.08, s1: 1.17, dx: 0.4, dy: 0.5};
    default:          return {s0: 1.10, s1: 1.15, dx: 0, dy: 0};
  }
};

/** A still plate under a clamped, motivated camera move. */
const StillShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const {s0, s1, dx, dy} = moveParams(f, shot.from, shot.dur, shot.move);
  const p = easeInOutCubic(clamp01((f - shot.from) / shot.dur));
  const s = s0 + (s1 - s0) * p + 0.004 * Math.sin(f * 0.045);
  // pan budget: never let the plate edge enter frame
  const budget = ((s - 1) / 2) * 100;
  const px = Math.max(-budget, Math.min(budget, dx * (p * 2 - 1)));
  const py = Math.max(-budget, Math.min(budget, dy * (p * 2 - 1)));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(shot.src)} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${s}) translate(${px}%, ${py}%)`,
        filter: `brightness(${(shot.b ?? 1) * 0.96}) saturate(0.86) contrast(1.08) sepia(${shot.sep ?? 0.04})`,
      }} />
    </AbsoluteFill>
  );
};

/** Three real depth planes from cut_layers.py. Far moves 15 %, mid 45 %, near
 *  100 % of the move — and because near/mid are cutouts over a *painted*
 *  backdrop, no edge is ever stretched and no hole is ever revealed. */
const LayerShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const {s0, s1, dx, dy} = moveParams(f, shot.from, shot.dur, shot.move);
  const p = easeInOutCubic(clamp01((f - shot.from) / shot.dur));
  const s = s0 + (s1 - s0) * p + 0.004 * Math.sin(f * 0.045);
  const stem = shot.src.replace('wow/img/', 'wow/layers/').replace('.png', '');
  // overscan so the planes can slide without exposing an edge
  const plane = (amount: number) => {
    const budget = 1.6 * amount;
    const tx = Math.max(-budget, Math.min(budget, dx * (p * 2 - 1) * amount));
    const ty = Math.max(-budget, Math.min(budget, dy * (p * 2 - 1) * amount));
    return `scale(${s}) translate(${tx}%, ${ty}%)`;
  };
  const filt = `brightness(${(shot.b ?? 1) * 0.96}) saturate(0.86) contrast(1.08) sepia(${shot.sep ?? 0.04})`;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(stem + '_far.png')} style={{width: '100%', height: '100%',
        objectFit: 'cover', transform: plane(0.15), filter: filt}} />
      <Img src={staticFile(stem + '_mid.png')} style={{position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'cover', transform: plane(0.45), filter: filt}} />
      <Img src={staticFile(stem + '_near.png')} style={{position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'cover', transform: plane(1.0), filter: filt}} />
    </AbsoluteFill>
  );
};

const VidShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const off = Math.round(((shot.start ?? 0) * 30) + (f - shot.from));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile(shot.src)} startFrom={off} muted
        style={{width: '100%', height: '100%', objectFit: 'cover',
          filter: 'brightness(0.93) saturate(0.8) contrast(1.06)'}} />
    </AbsoluteFill>
  );
};

/* ============================ captions ============================ */

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const scene = (TL.scenes as Scene[]).find((s) => f >= s.from && f < s.from + s.dur);
  if (!scene || !scene.words.length) return null;
  const words = scene.words;
  let idx = -1;
  for (let i = 0; i < words.length; i += 3) {
    const start = words[i].f;
    const end = i + 3 < words.length ? words[i + 3].f : scene.from + scene.dur;
    if (f >= start - 2 && f < end + 2) { idx = i; break; }
  }
  if (idx < 0) return null;
  const group = words.slice(idx, idx + 3);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 208}}>
      <div style={{display: 'flex', gap: '0.32em', fontFamily: F.sans, fontWeight: 800,
        fontSize: 48, background: 'rgba(4,6,10,0.62)', padding: '9px 20px 11px', borderRadius: 3,
        textShadow: '0 2px 16px rgba(0,0,0,0.95)'}}>
        {group.map((w, k) => {
          const on = f >= w.f;
          const a = easeOutCubic(clamp01((f - w.f + 4) / 6));
          return <span key={idx + k} style={{color: C.white,
            opacity: (on ? 1 : 0.40) * (0.6 + 0.4 * a)}}>{w.w.replace(/[.,;:]$/, '')}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ============================ graphics / motion design ============================ */

/** Darkens whatever is behind a graphic so type stays legible on a busy plate. */
const Scrim: React.FC<{strength?: number}> = ({strength = 0.72}) => (
  <AbsoluteFill style={{pointerEvents: 'none',
    background: `radial-gradient(ellipse 70% 55% at 50% 50%, rgba(4,6,10,${strength}) 0%, rgba(4,6,10,${strength * 0.55}) 62%, rgba(4,6,10,0) 100%)`}} />
);

const Slug: React.FC<{text: string; at: number}> = ({text, at}) => {
  const f = useCurrentFrame();
  const o = easeOutCubic(clamp01((f - at) / 9));
  if (o <= 0 || !text) return null;
  return <div style={{position: 'absolute', left: 108, top: 112, fontFamily: F.mono,
    fontSize: 16, letterSpacing: '0.40em', color: 'rgba(233,226,210,0.52)', opacity: o}}>{text}</div>;
};

/** The six characters as physical paper tiles, dropping in one per spoken letter. */
const Tiles: React.FC<{at: number[]}> = ({at}) => {
  const f = useCurrentFrame();
  const CH = ['6', 'E', 'Q', 'U', 'J', '5'];
  const MUL = ['6x', '14x', '26x', '30x', '19x', '5x'];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Scrim strength={0.78} />
      <div style={{display: 'flex', gap: 22}}>
        {CH.map((ch, i) => {
          const t = at[i] ?? at[0];
          const o = easeOutExpo(clamp01((f - t) / 7));
          if (o <= 0) return <div key={ch} style={{width: 150, height: 196}} />;
          const hot = ch === 'U';
          return (
            <div key={ch} style={{width: 150, height: 196, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', borderRadius: 4,
              background: hot ? '#C4382B' : '#E9E2D2', color: hot ? '#F4F1EA' : '#141118',
              boxShadow: '0 14px 34px rgba(0,0,0,0.7)',
              transform: `translateY(${(1 - o) * -26}px) rotate(${(1 - o) * -8 + (i - 2.5) * 0.5}deg) scale(${0.9 + 0.1 * o})`,
              opacity: o}}>
              <div style={{fontFamily: F.mono, fontSize: 104, fontWeight: 700, lineHeight: 1}}>{ch}</div>
              <div style={{fontFamily: F.mono, fontSize: 19, letterSpacing: '0.1em', opacity: 0.65}}>{MUL[i]}</div>
            </div>);
        })}
      </div>
    </AbsoluteFill>
  );
};

/** The frequency, counting up, with the spectrum behind it. */
const Frequency: React.FC<{scene: Scene}> = ({scene}) => {
  const f = useCurrentFrame();
  const lock = scene.words.find((w) => /thousand|twenty/i.test(w.w))?.f ?? scene.voStart + 30;
  const p = easeInOutCubic(clamp01((f - scene.voStart) / Math.max(1, lock - scene.voStart)));
  const val = 1380 + 40.4556 * p;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Scrim strength={0.8} />
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.5}}>
        {Array.from({length: 96}).map((_, i) => {
          const h = 8 + prand(i * 3.1) * 48 * (1 + 2.4 * Math.exp(-Math.pow((i - 68) / 6, 2)));
          return <rect key={i} x={`${i * 1.045}%`} y={700 - h} width="0.4%" height={h}
            fill={Math.abs(i - 68) < 4 ? '#D9A441' : 'rgba(233,226,210,0.18)'} />;
        })}
      </svg>
      <div style={{fontFamily: F.mono, fontSize: 138, fontWeight: 600, color: C.white,
        letterSpacing: '-0.02em', textShadow: '0 8px 50px rgba(0,0,0,0.9)'}}>{val.toFixed(4)}</div>
      <div style={{fontFamily: F.mono, fontSize: 30, letterSpacing: '0.6em', color: C.amber}}>MHz</div>
      <div style={{fontFamily: F.type, fontSize: 30, color: C.paper, marginTop: 26,
        opacity: clamp01((f - lock - 4) / 8)}}>the hydrogen line</div>
    </AbsoluteFill>
  );
};

/** The logbook page, with the red circle drawn on it. */
const BookCard: React.FC<{scene: Scene}> = ({scene}) => {
  const f = useCurrentFrame();
  const t0 = scene.from + 6;
  const draw = easeInOutCubic(clamp01((f - t0 - 22) / 34));
  const rise = easeOutExpo(clamp01((f - t0) / 14));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <Scrim strength={0.82} />
      <div style={{position: 'relative', width: 900, padding: '38px 46px', background: '#E9E2D2',
        boxShadow: '0 34px 90px rgba(0,0,0,0.82)', transform: `rotate(-1.1deg) translateY(${(1 - rise) * 26}px)`,
        opacity: rise}}>
        <div style={{fontFamily: F.mono, fontSize: 13, letterSpacing: '0.3em', color: '#6B5D42'}}>
          OHIO STATE · BIG EAR · 15 AUG 1977 · CH 2
        </div>
        <div style={{fontFamily: F.mono, fontSize: 70, fontWeight: 700, letterSpacing: '0.1em',
          color: '#141118', marginTop: 12}}>6EQUJ5</div>
        <svg width="820" height="180" style={{position: 'absolute', left: 10, top: 26, pointerEvents: 'none'}}>
          <ellipse cx="410" cy="90" rx="392" ry="72" fill="none" stroke="#B5342A" strokeWidth="5"
            strokeDasharray="1560" strokeDashoffset={1560 * (1 - draw)} transform="rotate(-2 410 90)" />
        </svg>
        <div style={{position: 'absolute', right: -40, top: -76, fontFamily: F.type, fontSize: 132,
          color: '#B5342A', opacity: clamp01((f - t0 - 40) / 8), transform: 'rotate(-9deg)',
          textShadow: '0 2px 0 rgba(0,0,0,0.15)'}}>Wow!</div>
      </div>
    </AbsoluteFill>
  );
};

/** The number itself, punching in on the spoken word. Only in the hook. */
const Stamp72: React.FC<{scene: Scene}> = ({scene}) => {
  const f = useCurrentFrame();
  const at = scene.words.find((w) => /72|seventy/i.test(w.w))?.f ?? scene.from + 18;
  const p = easeOutExpo(clamp01((f - at) / 8));
  const out = 1 - clamp01((f - (scene.from + scene.dur - 12)) / 10);
  if (p <= 0) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 300px 112px'}}>
      <div style={{opacity: p * out, transform: `translateY(${(1 - p) * 22}px)`}}>
        <div style={{fontFamily: F.mono, fontSize: 176, fontWeight: 700, color: C.white,
          letterSpacing: '-0.05em', lineHeight: 0.84, textShadow: '0 14px 70px rgba(0,0,0,0.95)'}}>72</div>
        <div style={{fontFamily: F.mono, fontSize: 24, letterSpacing: '0.6em', color: C.amber,
          marginTop: 10, paddingLeft: 8}}>SECONDS</div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{scene: Scene}> = ({scene}) => {
  const f = useCurrentFrame();
  const a = easeOutExpo(clamp01((f - scene.from - 6) / 16));
  const b = clamp01((f - scene.from - 44) / 14);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center',
      background: 'rgba(5,7,11,0.86)'}}>
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(217,164,65,0.28) 0%, rgba(6,8,12,0) 52%)'}} />
      <div style={{fontFamily: F.mono, fontSize: 104, letterSpacing: '0.14em', color: C.white,
        opacity: a}}>6EQUJ5</div>
      <div style={{height: 2, width: 520, marginTop: 20, background: 'rgba(233,226,210,0.24)'}} />
      <div style={{fontFamily: F.sans, fontSize: 40, fontWeight: 800, letterSpacing: '0.2em',
        color: C.amber, marginTop: 24, opacity: b}}>UNEXPLAINED</div>
    </AbsoluteFill>
  );
};

const SLUG: Record<string, string> = {
  hook: '15 AUG 1977', hook2: '72 SECONDS', a: 'DELAWARE, OHIO', b: 'DRIFT SCAN',
  c: 'THE BEAM', d: '22:16 EST', e: 'NIGHT SHIFT', f: 'PRINTOUT',
  g: 'RECEIVER B', h: 'HYDROGEN LINE', i: 'CHANNEL 2', j: 'THE MARGIN',
  k: 'THE SEARCH', l: 'NO REPEAT', m: '2024', n: 'CANDIDATE',
  o: 'NATURAL MASER', p: 'UNPROVEN', q: 'EITHER WAY', r: '72 SECONDS',
};

/* ============================ scene assembly ============================ */

const ShotView: React.FC<{shot: Shot}> = ({shot}) =>
  shot.kind === 'layer' ? <LayerShot shot={shot} />
    : shot.kind === 'vid' ? <VidShot shot={shot} />
      : <StillShot shot={shot} />;

const SceneLayer: React.FC<{id: string}> = ({id}) => {
  const s = SC[id];
  const f = useCurrentFrame();
  if (f < s.from || f >= s.from + s.dur) return null;
  const shot = s.shots.find((q) => f >= q.from && f < q.from + q.dur);
  return (
    <AbsoluteFill>
      {shot ? <ShotView shot={shot} /> : null}
      <AbsoluteFill style={{background:
        'linear-gradient(to top, rgba(5,7,11,0.86) 0%, rgba(5,7,11,0.24) 30%, rgba(5,7,11,0) 58%)'}} />
      <Slug text={SLUG[id] ?? ''} at={s.from + 4} />
      {id === 'hook2' && <Stamp72 scene={s} />}
      {id === 'g' && <Frequency scene={s} />}
      {id === 'i' && <Tiles at={[s.words.find((w) => w.w === '6')?.f ?? s.voStart,
        ...['E', 'Q', 'U', 'J', '5'].map((ch, k) =>
          (s.words.find((w) => w.w.toUpperCase() === ch)?.f) ?? s.voStart + 20 + k * 12)]} />}
      {id === 'j' && <BookCard scene={s} />}
      {id === 'r' && <EndCard scene={s} />}
    </AbsoluteFill>
  );
};

export const Wow: React.FC = () => (
  <AbsoluteFill style={{background: '#05070A'}}>
    <Audio src={staticFile('wow_mix_v3_norm.mp3')} />
    {Object.keys(SC).map((id) => <SceneLayer key={id} id={id} />)}
    <LightPlay />
    <Dust count={18} />
    <Vignette />
    <Scanlines opacity={0.05} />
    <FilmGrain opacity={0.17} />
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 84, background: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 84, background: '#000'}} />
    </AbsoluteFill>
    <Captions />
  </AbsoluteFill>
);

export const WOW_TOTAL = TOTAL;
