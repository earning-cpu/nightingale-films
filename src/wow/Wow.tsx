import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {C, F, clamp01, easeInOutCubic, easeOutCubic, easeOutExpo, prand} from '../theme';
import TL from './timeline.json';

/* ============================================================================
   EASING — the research is unambiguous: linear interpolation is the single
   biggest amateur tell. Entrances decelerate into place (ease-out with a
   little overshoot), exits accelerate away (ease-in), moves that start and end
   on screen are symmetric. Anticipation is 2-3 frames of counter-move, settle
   is 4-6 frames after the overshoot.
   ========================================================================== */

const outBack = (t: number, s = 1.7) => {
  const x = clamp01(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
const inExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * (clamp01(t) - 1)));
const outQuint = (t: number) => 1 - Math.pow(1 - clamp01(t), 5);
const outCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/** frames since `at`, normalised over `dur` */
const P = (f: number, at: number, dur: number) => clamp01((f - at) / Math.max(1, dur));

/* ============================ types ============================ */
type Word = {w: string; f: number};
type Shot = {kind: 'img' | 'vid' | 'layer'; src: string; move: string;
  from: number; dur: number; b?: number; sep?: number; sat?: number};
type Scene = {id: string; from: number; dur: number; slug: string; cut: number;
  kind: string; words: Word[]; shots: Shot[]};
type Cap = {f0: number; f1: number; w: string[]};

const SC: Record<string, Scene> = Object.fromEntries((TL.scenes as Scene[]).map((s) => [s.id, s]));
const TOTAL = TL.total as number;
const CAPS = TL.captions as Cap[];
const CUES = TL.cues as Record<string, number>;

/* ============================ camera ============================ */

const moveParams = (f: number, from: number, dur: number, move: string) => {
  const p = easeInOutCubic(clamp01((f - from) / Math.max(1, dur)));
  const e = outQuint(p);
  switch (move) {
    case 'push-in':    return {s0: 1.06, s1: 1.20, dx: 0, dy: 0, k: e};
    case 'pull-out':   return {s0: 1.20, s1: 1.07, dx: 0, dy: 0, k: e};
    case 'drift-left': return {s0: 1.16, s1: 1.16, dx: 2.4, dy: 0, k: e};
    case 'drift-right':return {s0: 1.16, s1: 1.16, dx: -2.4, dy: 0, k: e};
    case 'tilt-up':    return {s0: 1.14, s1: 1.18, dx: 0, dy: 1.8, k: e};
    case 'tilt-down':  return {s0: 1.14, s1: 1.18, dx: 0, dy: -1.8, k: e};
    case 'rack':       return {s0: 1.06, s1: 1.18, dx: 0.6, dy: 0.7, k: e};
    default:           return {s0: 1.10, s1: 1.15, dx: 0, dy: 0, k: e};
  }
};

const StillShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const m = moveParams(f, shot.from, shot.dur, shot.move);
  const s = m.s0 + (m.s1 - m.s0) * m.k + 0.004 * Math.sin(f * 0.045);
  const budget = ((s - 1) / 2) * 100;
  const cl = (v: number) => Math.max(-budget, Math.min(budget, v));
  const px = cl(m.dx * (m.k * 2 - 1));
  const py = cl(m.dy * (m.k * 2 - 1));
  const t = `scale(${s}) translate(${px}%, ${py}%)`;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(shot.src)} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transform: t,
        filter: `brightness(${(shot.b ?? 1) * 0.96}) saturate(${shot.sat ?? 0.86}) contrast(1.14) sepia(${shot.sep ?? 0.04})`,
      }} />
      <Img src={staticFile(shot.src)} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        transform: t, mixBlendMode: 'screen', opacity: 0.26,
        filter: `brightness(${(shot.b ?? 1) * 1.05}) blur(26px) contrast(1.5) saturate(${shot.sat ?? 0.86})`,
      }} />
    </AbsoluteFill>
  );
};

/** Three real depth planes. The mid and near planes are cutouts over a
 *  painted backdrop, so a move never stretches an edge — it uncovers
 *  background. Each plane gets a drop shadow, which is what makes a cutout
 *  read as paper in front of paper rather than a sliding JPEG. */
const LayerShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const local = f - shot.from;
  const m = moveParams(f, shot.from, shot.dur, shot.move);
  const s = m.s0 + (m.s1 - m.s0) * m.k + 0.004 * Math.sin(f * 0.045);
  const stem = shot.src.replace('wow/img/', 'wow/layers/').replace('.png', '');

  // paper entry: the near plane slides in over the first 14 frames with overshoot
  const enter = outBack(P(f, shot.from, 14));
  const enterX = (1 - enter) * 90;

  const plane = (amount: number, extra = 0) => {
    const budget = 1.8 * amount;
    const tx = Math.max(-budget, Math.min(budget, m.dx * (m.k * 2 - 1) * amount)) + extra;
    const ty = Math.max(-budget, Math.min(budget, m.dy * (m.k * 2 - 1) * amount));
    return `scale(${s}) translate(${tx}%, ${ty}%)`;
  };
  const filt = `brightness(${(shot.b ?? 1) * 0.96}) saturate(${shot.sat ?? 0.86}) contrast(1.08) sepia(${shot.sep ?? 0.04})`;

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(stem + '_far.png')} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transform: plane(0.15), filter: filt}} />
      <Img src={staticFile(stem + '_far.png')} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        transform: plane(0.15), mixBlendMode: 'screen', opacity: 0.24,
        filter: `brightness(${(shot.b ?? 1) * 1.05}) blur(30px) contrast(1.5)`}} />
      <Img src={staticFile(stem + '_mid.png')} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        transform: plane(0.45), filter: `${filt} drop-shadow(0 6px 18px rgba(0,0,0,0.55))`}} />
      <Img src={staticFile(stem + '_near.png')} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        transform: plane(1.0, enterX),
        filter: `${filt} drop-shadow(0 14px 34px rgba(0,0,0,0.72))`,
        opacity: 0.35 + 0.65 * enter}} />
      {local < 14 ? null : null}
    </AbsoluteFill>
  );
};

const VidShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const off = Math.round(f - shot.from);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile(shot.src)} startFrom={off} muted
        style={{width: '100%', height: '100%', objectFit: 'cover',
          filter: 'brightness(0.93) saturate(0.8) contrast(1.06)'}} />
    </AbsoluteFill>
  );
};

/* ============================ texture & light ============================ */

const FilmGrain: React.FC<{opacity?: number}> = ({opacity = 0.17}) => {
  const f = useCurrentFrame();
  const ox = Math.round(prand(f * 1.7) * 512);
  const oy = Math.round(prand(f * 2.3 + 11) * 512);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity,
      backgroundImage: `url(${staticFile('wow/grain.png')})`,
      backgroundRepeat: 'repeat', backgroundPosition: `${ox}px ${oy}px`}} />
  );
};

/** Halation: a reddish bloom that only lives in the highlights, exactly as on
 *  film, plus a travelling anamorphic sweep so nothing on screen is static. */
const LightPlay: React.FC = () => {
  const f = useCurrentFrame();
  const x = ((f / TOTAL) * 280 - 70) % 210;
  return (
    <>
      <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.14,
        background: 'radial-gradient(60% 40% at 50% 42%, rgba(255,190,120,0.35) 0%, rgba(255,190,120,0) 70%)'}} />
      <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.07,
        background: `linear-gradient(104deg, rgba(255,206,140,0) ${x - 16}%, rgba(255,206,140,0.9) ${x}%, rgba(255,206,140,0) ${x + 14}%)`}} />
    </>
  );
};

const Dust: React.FC<{count?: number}> = ({count = 24}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <svg width="100%" height="100%">
        {Array.from({length: count}).map((_, i) => {
          const x = (prand(i * 3.1) * 100 + f * (0.010 + 0.02 * prand(i))) % 100;
          const y = (prand(i * 7.7) * 100 - f * (0.008 + 0.014 * prand(i + 2)) + 200) % 100;
          return <circle key={i} cx={`${x}%`} cy={`${y}%`}
            r={0.5 + prand(i * 5.3) * 1.5} fill="#E8DFC8"
            opacity={0.05 + prand(i * 2.2) * 0.11} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Gate weave + exposure flicker. A real projector never holds a frame dead
 *  still, and neither should a digital one — this is also what keeps QC's
 *  freeze detector quiet during holds on cards and titles. */
const GateWeave: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const wx = (prand(f * 0.7) - 0.5) * 2.4;
  const wy = (prand(f * 1.3 + 5) - 0.5) * 1.8;
  const wl = 1 + (prand(f * 2.1 + 9) - 0.5) * 0.012;
  return (
    <AbsoluteFill style={{transform: `translate(${wx}px, ${wy}px) scale(1.012)`,
      filter: `brightness(${wl})`}}>{children}</AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 44%, rgba(2,4,8,0.52) 100%)'}} />
);

/* ============================ transitions ============================ */

/** A 5-frame tape dropout across a cut: horizontal slices displaced, plus a
 *  white flash frame. Two frames of flash is what makes a cut feel like it
 *  landed instead of drifted. */
const Transition: React.FC<{at: number; seed?: number; kind?: 'tape' | 'leak' | 'flash'}> =
  ({at, seed = 1, kind = 'tape'}) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < -1 || d > 7) return null;
  const k = 1 - clamp01(d / 7);
  if (kind === 'flash') {
    return <AbsoluteFill style={{pointerEvents: 'none',
      background: 'radial-gradient(circle at 50% 46%, #FFF1DE 0%, #FFD9A8 46%, #E9A85F 100%)',
      mixBlendMode: 'screen', opacity: Math.max(0, 0.30 * (1 - Math.abs(d) / 1.7))}} />;
  }
  if (kind === 'leak') {
    return <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen',
      opacity: 0.5 * k,
      background: `linear-gradient(${100 + prand(seed) * 40}deg, rgba(255,160,80,0) 30%, rgba(255,190,120,0.9) 50%, rgba(255,160,80,0) 70%)`}} />;
  }
  // tape dropout: displaced slices
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.30 * k}}>
      <svg width="100%" height="100%">
        {Array.from({length: 7}).map((_, i) => {
          const y = prand(seed * 13 + i) * 100;
          const h = 1.5 + prand(seed * 7 + i) * 8;
          const dx = (prand(seed * 3 + i) - 0.5) * 14;
          return <rect key={i} x={dx} y={`${y}%`} width="100%" height={`${h}%`}
            fill={i % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(120,200,255,0.30)'} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Fires a transition on every scene cut, alternating the flavour. */
const Cuts: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = (TL.scenes as Scene[]).filter((s) => s.from > 0);
  const hit = cuts.find((s) => Math.abs(f - s.from) <= 7);
  if (!hit) return null;
  const i = cuts.indexOf(hit);
  const kind = (['tape', 'leak', 'flash'] as const)[i % 3];
  return <Transition at={hit.from} seed={i + 3} kind={kind} />;
};

/* ============================ graphics ============================ */

const Scrim: React.FC<{strength?: number}> = ({strength = 0.72}) => (
  <AbsoluteFill style={{pointerEvents: 'none', zIndex: 0,
    background: `radial-gradient(ellipse 72% 56% at 50% 50%, rgba(4,6,10,${strength}) 0%, rgba(4,6,10,${strength * 0.5}) 64%, rgba(4,6,10,0) 100%)`}} />
);

/** Academy countdown leader — the cheapest, most legible way to say "film".
 *  Sweep, crosshair, and the number turning over. */
const Leader: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 46) return null;
  const num = 3 - Math.floor(f / 16);
  const sweep = (f % 16) / 16;
  return (
    <AbsoluteFill style={{background: '#0B0C0E', justifyContent: 'center', alignItems: 'center'}}>
      <svg width="100%" height="100%" style={{position: 'absolute'}}>
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(233,226,210,0.18)" strokeWidth="2" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(233,226,210,0.18)" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="300" fill="none" stroke="rgba(233,226,210,0.16)" strokeWidth="2" />
        <circle cx="50%" cy="50%" r="210" fill="none" stroke="rgba(233,226,210,0.10)" strokeWidth="1.5" />
        <path d={`M ${960} ${540} L ${960 + 300 * Math.cos(-Math.PI / 2 + sweep * 2 * Math.PI)} ${540 + 300 * Math.sin(-Math.PI / 2 + sweep * 2 * Math.PI)}`}
          stroke="rgba(217,164,65,0.55)" strokeWidth="3" />
      </svg>
      <div style={{fontFamily: F.mono, fontSize: 300, fontWeight: 700, color: C.paper,
        opacity: 0.92, letterSpacing: '-0.03em'}}>{num > 0 ? num : ''}</div>
      <div style={{position: 'absolute', bottom: 190, fontFamily: F.mono, fontSize: 15,
        letterSpacing: '0.5em', color: 'rgba(233,226,210,0.45)'}}>NIGHTINGALE FILMS · 2026</div>
    </AbsoluteFill>
  );
};

/** A word punched in on a beat, with anticipation and overshoot. */
const Kinetic: React.FC<{text: string; at: number; out: number; size?: number;
  sub?: string; align?: 'left' | 'center'}> = ({text, at, out, size = 150, sub, align = 'left'}) => {
  const f = useCurrentFrame();
  if (f < at - 3 || f > out + 10) return null;
  const p = outBack(P(f, at, 9), 2.2);
  const o = 1 - inExpo(P(f, out, 7));
  return (
    <AbsoluteFill style={{justifyContent: 'center',
      alignItems: align === 'left' ? 'flex-start' : 'center',
      paddingLeft: align === 'left' ? 112 : 0}}>
      <AbsoluteFill style={{left: 0, width: '62%', pointerEvents: 'none',
        background: 'linear-gradient(90deg, rgba(4,6,10,0.86) 0%, rgba(4,6,10,0.62) 46%, rgba(4,6,10,0) 100%)'}} />
      <div style={{opacity: o, transform: `translateY(${(1 - p) * 26}px) scale(${0.86 + 0.14 * p})`}}>
        <div style={{fontFamily: F.mono, fontSize: size, fontWeight: 700, color: C.white,
          letterSpacing: '-0.04em', lineHeight: 0.86,
          textShadow: '0 16px 80px rgba(0,0,0,0.95)'}}>{text}</div>
        {sub ? <div style={{fontFamily: F.mono, fontSize: Math.round(size * 0.155),
          letterSpacing: '0.6em', color: C.amber, marginTop: 12}}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Lower third: bar wipes open from the left, text follows 3 frames later. */
const LowerThird: React.FC<{title: string; sub: string; at: number; out: number}> =
  ({title, sub, at, out}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 8) return null;
  const bar = outQuint(P(f, at, 12));
  const txt = outCubic(P(f, at + 3, 10));
  const o = 1 - P(f, out, 8);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start',
      padding: '0 0 336px 112px', opacity: o}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20,
        background: 'linear-gradient(90deg, rgba(4,6,10,0.90) 0%, rgba(4,6,10,0.78) 62%, rgba(4,6,10,0.0) 100%)',
        padding: '16px 96px 18px 0', borderRadius: 2}}>
        <div style={{width: 6, height: 74 * bar, background: C.amber, marginLeft: -10}} />
        <div style={{opacity: txt, transform: `translateX(${(1 - txt) * -18}px)`}}>
          <div style={{fontFamily: F.sans, fontSize: 38, fontWeight: 800, color: C.white,
            letterSpacing: '0.04em', textShadow: '0 2px 14px rgba(0,0,0,0.9)'}}>{title}</div>
          <div style={{fontFamily: F.mono, fontSize: 15, letterSpacing: '0.24em',
            color: 'rgba(233,226,210,0.78)', marginTop: 6}}>{sub}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A leader line that draws out to a label, aimed at a point in frame. */
const Callout: React.FC<{x: number; y: number; label: string; at: number; out: number}> =
  ({x, y, label, at, out}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 6) return null;
  const d = outQuint(P(f, at, 14));
  const tx = outCubic(P(f, at + 7, 8));
  const o = 1 - P(f, out, 6);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width="100%" height="100%" style={{position: 'absolute'}}>
        <circle cx={`${x}%`} cy={`${y}%`} r={86} fill="none"
          stroke="rgba(217,164,65,0.8)" strokeWidth="2.5" strokeDasharray="560"
          strokeDashoffset={560 * (1 - d)} />
        <circle cx={`${x}%`} cy={`${y}%`} r={3} fill="rgba(217,164,65,0.9)" opacity={d} />
        <line x1={`${x}%`} y1={`${y}%`} x2={`${x + 11}%`} y2={`${y - 9}%`}
          stroke="rgba(217,164,65,0.55)" strokeWidth="1.4"
          strokeDasharray="260" strokeDashoffset={260 * (1 - d)} />
      </svg>
      <div style={{position: 'absolute', left: `${x + 12}%`, top: `${y - 11}%`,
        opacity: tx, transform: `translateX(${(1 - tx) * -10}px)`,
        fontFamily: F.mono, fontSize: 17, letterSpacing: '0.2em', color: C.amber,
        background: 'rgba(4,6,10,0.72)', padding: '6px 12px', borderRadius: 2}}>{label}</div>
    </AbsoluteFill>
  );
};

/** Frequency readout: counts up, overshoots, settles. */
const Frequency: React.FC<{at: number; out: number; lock: number}> = ({at, out, lock}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 8) return null;
  const p = outBack(P(f, at, lock - at), 1.4);
  const val = 1380 + 40.4556 * Math.min(1.02, p);
  const o = 1 - P(f, out, 8);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: o}}>
      <Scrim strength={0.93} />
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.55}}>
        {Array.from({length: 96}).map((_, i) => {
          const h = 10 + prand(i * 3.1) * 54 * (1 + 2.6 * Math.exp(-Math.pow((i - 68) / 6, 2)));
          return <rect key={i} x={`${i * 1.045}%`} y={806 - h} width="0.42%" height={h}
            fill={Math.abs(i - 68) < 4 ? '#D9A441' : 'rgba(233,226,210,0.18)'} />;
        })}
      </svg>
      <div style={{position: 'relative', zIndex: 1, fontFamily: F.mono, fontSize: 126, fontWeight: 600, color: C.white,
        letterSpacing: '-0.01em', textShadow: '0 8px 60px rgba(0,0,0,1)'}}>{val.toFixed(4)}</div>
      <div style={{position: 'relative', zIndex: 1, fontFamily: F.mono, fontSize: 26,
        letterSpacing: '0.6em', color: C.amber, marginTop: 2}}>MHz</div>
      <div style={{position: 'relative', zIndex: 1, fontFamily: F.type, fontSize: 38,
        color: C.paper, marginTop: 30,
        opacity: outCubic(P(f, lock + 34, 10))}}>the hydrogen line</div>
    </AbsoluteFill>
  );
};

/** The six characters as paper tiles, one per spoken letter, with shadow. */
const Tiles: React.FC<{at: number[]; out: number}> = ({at, out}) => {
  const f = useCurrentFrame();
  const CH = ['6', 'E', 'Q', 'U', 'J', '5'];
  const MUL = ['6x', '14x', '26x', '30x', '19x', '5x'];
  if (f < at[0] - 6 || f > out + 10) return null;
  const o = 1 - P(f, out, 8);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: o}}>
      <Scrim strength={0.8} />
      <div style={{position: 'relative', zIndex: 1, display: 'flex', gap: 20}}>
        {CH.map((ch, i) => {
          const t = at[i] ?? at[0];
          const p = outBack(P(f, t, 10), 2.4);
          const hot = ch === 'U';
          return (
            <div key={ch} style={{width: 148, height: 194, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', borderRadius: 4,
              background: hot ? '#C4382B' : '#E9E2D2', color: hot ? '#F4F1EA' : '#141118',
              boxShadow: '0 18px 40px rgba(0,0,0,0.75)',
              transform: `translateY(${(1 - p) * -34}px) rotate(${(1 - p) * -10 + (i - 2.5) * 0.6}deg) scale(${0.88 + 0.12 * p})`,
              opacity: 0.2 + 0.8 * clamp01(p)}}>
              <div style={{fontFamily: F.mono, fontSize: 102, fontWeight: 700, lineHeight: 1}}>{ch}</div>
              <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.1em', opacity: 0.6}}>{MUL[i]}</div>
            </div>);
        })}
      </div>
    </AbsoluteFill>
  );
};

/** The logbook page. The red circle is drawn around the string itself, because
 *  an annotation that misses its target is the fastest way to look fake. */
const BookCard: React.FC<{at: number; out: number}> = ({at, out}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 10) return null;
  const draw = easeInOutCubic(P(f, at + 22, 30));
  const rise = outBack(P(f, at, 14), 1.5);
  const ink = outBack(P(f, at + 46, 10), 2.4);
  const o = 1 - P(f, out, 8);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: o}}>
      <Scrim strength={0.95} />
      <div style={{position: 'relative', padding: '34px 44px 30px', background: '#E9E2D2',
        boxShadow: '0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,0,0,0.35)',
        transform: `rotate(${-1.2 + 0.5 * P(f, at, out - at)}deg) translateY(${(1 - rise) * 44}px) scale(${(0.94 + 0.06 * rise) * (1 + 0.03 * P(f, at, out - at))})`}}>
        <div style={{fontFamily: F.mono, fontSize: 12, letterSpacing: '0.34em', color: '#7A6A4C'}}>
          OHIO STATE · BIG EAR · 15 AUG 1977 · CH 2
        </div>
        <div style={{position: 'relative', display: 'inline-block', marginTop: 12, marginBottom: 18,
          padding: '10px 30px 12px'}}>
          <div style={{fontFamily: F.mono, fontSize: 84, fontWeight: 700, letterSpacing: '0.06em',
            color: '#141118', lineHeight: 1}}>6EQUJ5</div>
          <svg width="100%" height="100%"
            style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}}>
            <ellipse cx="50%" cy="50%" rx="49%" ry="47%" fill="none" stroke="#B5342A"
              strokeWidth="2.8" vectorEffect="non-scaling-stroke" pathLength={1}
              strokeDasharray="1" strokeDashoffset={1 - draw}
              transform="rotate(-2 50 50)" />
          </svg>
        </div>
        <div style={{fontFamily: F.type, fontSize: 118, color: '#B5342A', lineHeight: 1,
          opacity: 0.92 * clamp01(ink), transform: `rotate(-7deg) scale(${0.72 + 0.28 * ink})`,
          transformOrigin: 'bottom left', marginTop: 22, marginLeft: 8}}>Wow!</div>
        <div style={{fontFamily: F.mono, fontSize: 12, letterSpacing: '0.26em', color: '#7A6A4C',
          marginTop: 14}}>J. D. EHMAN · THE MARGIN</div>
      </div>
    </AbsoluteFill>
  );
};

/** Fifty years, as a scrub bar with a playhead that accelerates — the point is
 *  the emptiness after the playhead, so it gets its own panel and its own air. */
const Decades: React.FC<{at: number; out: number}> = ({at, out}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 8) return null;
  const p = outQuint(P(f, at, 44));
  const o = 1 - P(f, out, 8);
  const panel = outCubic(P(f, at, 12));
  const years = ['1977', '1987', '1997', '2007', '2017', '2027'];
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center',
      paddingBottom: 286, opacity: o}}>
      <Scrim strength={0.55} />
      <div style={{position: 'relative', zIndex: 1, width: 1180, padding: '30px 40px 26px',
        background: 'rgba(5,7,11,0.88)', borderLeft: `4px solid ${C.amber}`,
        boxShadow: '0 24px 70px rgba(0,0,0,0.85)',
        opacity: panel, transform: `translateY(${(1 - panel) * 26}px)`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 22}}>
          <div style={{fontFamily: F.sans, fontSize: 26, fontWeight: 800, color: C.white,
            letterSpacing: '0.12em'}}>THE SEARCH</div>
          <div style={{fontFamily: F.mono, fontSize: 15, letterSpacing: '0.34em',
            color: C.amber}}>NO REPEAT</div>
        </div>
        <div style={{position: 'relative', height: 8, background: 'rgba(233,226,210,0.16)'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p * 100}%`,
            background: `linear-gradient(90deg, rgba(217,164,65,0.5) 0%, ${C.amber} 100%)`}} />
          <div style={{position: 'absolute', top: -9, left: `${p * 100}%`, width: 3, height: 26,
            background: C.white, transform: 'translateX(-50%)',
            boxShadow: '0 0 18px rgba(255,255,255,0.9)'}} />
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16}}>
          {years.map((y, i) => (
            <div key={y} style={{fontFamily: F.mono, fontSize: 17, letterSpacing: '0.14em',
              color: p * 5 >= i ? C.paper : 'rgba(233,226,210,0.34)'}}>{y}</div>))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Split screen for the "either / or" line: two plates, a wipe between them. */
const Split: React.FC<{a: string; b: string; at: number; out: number}> = ({a, b, at, out}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 8) return null;
  const w = outQuint(P(f, at, 16));
  const o = 1 - P(f, out, 8);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{width: '50%', overflow: 'hidden'}}>
        <Img src={staticFile(a)} style={{width: '1920px', height: '1080px', objectFit: 'cover',
          transform: `scale(${1 + 0.05 * P(f, at, out - at)})`,
          filter: 'brightness(0.62) saturate(0.7) contrast(1.1)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{left: '50%', overflow: 'hidden', opacity: w}}>
        <Img src={staticFile(b)} style={{width: '1920px', height: '1080px', objectFit: 'cover',
          marginLeft: '-960px', transform: `scale(${1 + 0.055 * P(f, at, out - at)})`,
          filter: 'brightness(0.72) saturate(0.7) contrast(1.1)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3,
        background: C.amber, opacity: w, transform: 'translateX(-50%)'}} />
      <div style={{position: 'absolute', left: '25%', bottom: 240, transform: 'translateX(-50%)',
        fontFamily: F.mono, fontSize: 20, letterSpacing: '0.3em', color: C.paper}}>NOT ALONE</div>
      <div style={{position: 'absolute', left: '75%', bottom: 240, transform: 'translateX(-50%)',
        fontFamily: F.mono, fontSize: 20, letterSpacing: '0.3em', color: C.paper, opacity: w}}>ALONE</div>
    </AbsoluteFill>
  );
};

/** End card. */
const EndCard: React.FC<{at: number; out: number}> = ({at, out}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const a = outBack(P(f, at, 16), 1.4);
  const b = outCubic(P(f, at + 34, 14));
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: 'rgba(5,7,11,0.9)'}}>
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(217,164,65,0.30) 0%, rgba(6,8,12,0) 54%)'}} />
      <div style={{fontFamily: F.mono, fontSize: 108, letterSpacing: '0.14em', color: C.white,
        opacity: clamp01(a), transform: `translateY(${(1 - a) * 20}px)`}}>6EQUJ5</div>
      <div style={{height: 2, width: 540, marginTop: 20, background: 'rgba(233,226,210,0.24)'}} />
      <div style={{fontFamily: F.sans, fontSize: 40, fontWeight: 800, letterSpacing: '0.2em',
        color: C.amber, marginTop: 24, opacity: clamp01(b)}}>UNEXPLAINED</div>
    </AbsoluteFill>
  );
};

/** Corner HUD slug. */
const Slug: React.FC<{text: string; at: number}> = ({text, at}) => {
  const f = useCurrentFrame();
  const o = outCubic(P(f, at, 9));
  if (o <= 0 || !text) return null;
  return (
    <div style={{position: 'absolute', left: 108, top: 112, display: 'flex',
      alignItems: 'center', gap: 10, opacity: o}}>
      <div style={{width: 6, height: 6, background: C.amber, borderRadius: 1}} />
      <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.4em',
        color: 'rgba(233,226,210,0.62)', textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>{text}</div>
    </div>
  );
};

/* ============================ assembly ============================ */

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
        'linear-gradient(to top, rgba(5,7,11,0.84) 0%, rgba(5,7,11,0.22) 30%, rgba(5,7,11,0) 58%)'}} />
      <Slug text={s.slug} at={s.from + 3} />
    </AbsoluteFill>
  );
};

const Graphics: React.FC = () => {
  const f = useCurrentFrame();
  const g: React.ReactNode[] = [];

  // -- hook: the number punches in on the spoken word
  if (f >= 44 && f <= 132) {
    g.push(<Kinetic key="72" text="72" sub="SECONDS" size={210} at={52} out={126} />);
  }
  // -- lower third on the location beat
  if (f >= SC.a.from && f <= SC.b.from + 20) {
    g.push(<LowerThird key="lt" title="BIG EAR" sub="OHIO STATE UNIVERSITY · DELAWARE, OHIO"
      at={SC.a.from + 8} out={SC.b.from + 6} />);
  }
  // -- callout on the dish
  if (f >= SC.c.from && f <= SC.c.from + SC.c.dur) {
    g.push(<Callout key="co" x={52} y={38} label="110 m · FIXED BEAM"
      at={SC.c.from + 10} out={SC.c.from + SC.c.dur - 8} />);
  }
  // -- the frequency
  g.push(<Frequency key="fr" at={CUES.number - 26} out={CUES.hydrogen - 10}
    lock={CUES.number + 10} />);
  // -- the six characters
  g.push(<Tiles key="ti" at={[CUES.six, CUES.six + 8, CUES.six + 16, CUES.six + 24,
    CUES.six + 32, CUES.six + 40]} out={CUES.six + 130} />);
  // -- the book
  g.push(<BookCard key="bk" at={CUES.wow - 40} out={CUES.fifty + 6} />);
  // -- fifty years
  g.push(<Decades key="dec" at={CUES.fifty + 34} out={CUES.candidate + 4} />);
  // -- either / or
  g.push(<Split key="sp" a="wow/img/d_05.png" b="wow/img/d_12.png"
    at={CUES.alone - 26} out={CUES.alone + 60} />);
  // -- end
  g.push(<EndCard key="end" at={CUES.silence - 4} out={TOTAL} />);
  return <>{g}</>;
};

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const cap = CAPS.find((c) => f >= c.f0 - 2 && f <= (c.f1 ?? c.f0) + 14);
  if (!cap) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 206}}>
      <div style={{display: 'flex', gap: '0.3em', fontFamily: F.sans, fontWeight: 800,
        fontSize: 47, background: 'rgba(4,6,10,0.6)', padding: '9px 20px 11px', borderRadius: 3,
        textShadow: '0 2px 16px rgba(0,0,0,0.95)'}}>
        {cap.w.map((w, k) => {
          const wf = (TL.words as Word[])[CAPS.filter((c) => c.f0 < cap.f0).reduce((n, c) => n + c.w.length, 0) + k];
          const on = !wf || f >= wf.f;
          return <span key={k} style={{color: C.white, opacity: on ? 1 : 0.42}}>
            {w.replace(/[.,;:]$/, '')}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Wow: React.FC = () => (
  <AbsoluteFill style={{background: '#05070A'}}>
    <Audio src={staticFile('wow_mix_v4_norm.mp3')} />
    <GateWeave>
      {Object.keys(SC).map((id) => <SceneLayer key={id} id={id} />)}
      <Leader />
      <Graphics />
      <Cuts />
      <LightPlay />
    </GateWeave>
    <Dust count={22} />
    <Vignette />
    <FilmGrain opacity={0.16} />
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 84, background: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 84, background: '#000'}} />
    </AbsoluteFill>
    <Captions />
  </AbsoluteFill>
);

export const WOW_TOTAL = TOTAL;
