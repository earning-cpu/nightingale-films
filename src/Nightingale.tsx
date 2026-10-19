import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  AlarmPulse, BeamGlow, BlurWords, Camera, CaptionTrack, Clock, Dust, ExposureFlicker, FilmEdges,
  FreqReadout, GateWeave, Glitch, GradeBottom, Grain, Halation, InsertShot, KenBurns, Letterbox,
  LightLeak, RadarSweep, RedactedBar, Scanlines, Seg, Slug, Stamp, Typewriter, Vignette, Waveform,
} from './lib';
import {C, F, T, clamp01, easeOutCubic, easeOutExpo, win} from './theme';

/* ------------------------------- TITLE ------------------------------- */
export const Title: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Seg from={T.title.from} dur={T.title.dur}>
      <Camera src="img/s10_file.jpg" from={T.title.from} dur={T.title.dur} focusFrom={[46, 44]} focusTo={[41, 56]} scaleFrom={1.06} scaleTo={1.15} ease="inOut" handheld={0.2} rotate={-0.12} brightness={0.42} sepia={0.25} narrSeg="title" flicker />
      <GradeBottom strength={0.9} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 60}}>
        <div style={{opacity: win(f, 8, 16), fontFamily: F.mono, color: C.paperDim, letterSpacing: '0.5em', fontSize: 20, marginBottom: 26}}>
          DECLASSIFIED — FOIA RELEASE 2004-01-12
        </div>
        <BlurWords words={['PROJECT', 'NIGHTINGALE']} start={22} stagger={9} dur={16} rise={34}
          style={{fontFamily: F.sans, fontSize: 118, fontWeight: 800, letterSpacing: '0.04em'}} />
        <div style={{
          marginTop: 22, fontFamily: F.type, fontSize: 34, color: C.amber,
          letterSpacing: '0.34em', opacity: easeOutCubic(win(f, 56, 16)),
        }}>
          THE GROOM LAKE INCIDENT
        </div>
        <div style={{
          marginTop: 18, fontFamily: F.mono, fontSize: 21, color: C.paperDim,
          letterSpacing: '0.30em', opacity: easeOutCubic(win(f, 74, 14)),
        }}>
          14 JUL 1979 // NEVADA TEST &amp; TRAINING RANGE
        </div>
      </AbsoluteFill>
      <Stamp text="RESTRICTED / EYES ONLY" start={98} x={1180} y={170} rot={-7} size={30} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 1 ------------------------------- */
export const S1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Seg from={T.s1.from} dur={T.s1.dur}>
      <Camera src="img/s1_approach.jpg" from={T.s1.from} dur={T.s1.dur} focusFrom={[20, 56]} focusTo={[76, 44]} scaleFrom={1.12} scaleTo={1.12} ease="linear" handheld={0.35} rotate={0} brightness={0.92} sepia={0} narrSeg="s1" />
      <GradeBottom />
      <Slug scene="SCENE 1" time="22:14 HRS" place="NEVADA HWY 375" start={T.s1.from + 6} />
      <Clock start={T.s1.from} baseSec={22 * 3600 + 14 * 60} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['NO', 'RADIO', 'COMMS.']} start={T.s1.from + 22} stagger={6} dur={13}
          accentIndex={2} accentColor={C.warnGlow}
          style={{fontFamily: F.sans, fontSize: 92, fontWeight: 800, letterSpacing: '-0.01em'}} />
        <BlurWords words={['Three', 'vehicles.', 'One', 'cargo.', 'A', 'fragment', 'from', 'Papoose', 'Lake,',
          'inbound', 'to', 'Groom', 'Lake.']}
          start={T.s1.from + 58} stagger={2.5} dur={10} rise={12}
          color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, fontWeight: 400, marginTop: 22, maxWidth: 1100, lineHeight: 1.45}} />
      </AbsoluteFill>
      <div style={{
        position: 'absolute', right: 72, top: 120, fontFamily: F.mono, fontSize: 19,
        color: C.hud, letterSpacing: '0.18em', border: `1px solid ${C.hudDim}`,
        padding: '8px 16px', opacity: win(f, T.s1.from + 30, 12),
      }}>
        LAT 37.24°N — LON 115.81°W
      </div>
      <div style={{
        position: 'absolute', right: 72, top: 178, fontFamily: F.mono, fontSize: 19,
        color: C.warnGlow, letterSpacing: '0.18em', opacity: win(f, T.s1.from + 44, 12),
      }}>
        ▲ COMMS SILENT
      </div>
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 2 ------------------------------- */
export const S2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Seg from={T.s2.from} dur={T.s2.dur}>
      <Camera src="img/s2_checkpoint.jpg" from={T.s2.from} dur={T.s2.dur} focusFrom={[25, 19]} focusTo={[39, 31]} scaleFrom={1.04} scaleTo={1.21} ease="out" handheld={0.18} rotate={0.12} brightness={0.95} sepia={0} narrSeg="s2" />
      <GradeBottom />
      <AlarmPulse from={T.s2.from} dur={T.s2.dur} />
      <Slug scene="SCENE 2" time="22:31 HRS" place="CHECKPOINT ZULU" start={T.s2.from + 6} accent={C.warnGlow} />
      <Clock start={T.s2.from} baseSec={22 * 3600 + 31 * 60} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['SECURITY', 'LEVEL', '4.']} start={T.s2.from + 18} stagger={6} dur={13}
          accentIndex={2} accentColor={C.warnGlow}
          style={{fontFamily: F.sans, fontSize: 92, fontWeight: 800}} />
        <BlurWords
          words={['Convoy', 'halted.', 'All', 'personnel', 'out.', 'The', 'base', 'is', 'already',
            'on', 'silent', 'alert.']}
          start={T.s2.from + 52} stagger={2.5} dur={10} rise={12} color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, marginTop: 22, maxWidth: 1050, lineHeight: 1.45}} />
      </AbsoluteFill>
      <Stamp text="USE OF DEADLY FORCE" start={T.s2.from + 74} x={980} y={480} rot={-4} size={26} color={C.warnGlow} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 3 ------------------------------- */
export const S3: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s3.from;
  const flash = win(f, t + 118, 6); // cut to 1977 archive
  return (
    <Seg from={t} dur={T.s3.dur}>
      <Camera src="img/s3_hangar.jpg" from={t} dur={T.s3.dur} focusFrom={[34, 54]} focusTo={[55, 29]} scaleFrom={1.17} scaleTo={1.05} ease="inOut" handheld={0.12} rotate={-0.1} brightness={0.9} sepia={0} narrSeg="s3" />
      {/* 1977 archival insert */}
      <AbsoluteFill style={{opacity: flash}}>
        <Camera src="img/extra_1977_recovery.jpg" from={t + 118} dur={T.s3.dur - 118} focusFrom={[58, 50]} focusTo={[57, 54]} scaleFrom={1.1} scaleTo={1.22} ease="inOut" handheld={0.55} rotate={-0.3} brightness={0.85} sepia={0.45} narrSeg="s3" flicker />
        <Scanlines opacity={0.2} />
      </AbsoluteFill>
      <GradeBottom />
      <Slug scene="SCENE 3" time="23:05 HRS" place="HANGAR 6" start={t + 6} />
      <Clock start={t} baseSec={23 * 3600 + 5 * 60} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['IT’S', 'NOT', 'THE', 'FRAGMENT.']} start={t + 18} stagger={5} dur={13}
          accentIndex={3} accentColor={C.plasma}
          style={{fontFamily: F.sans, fontSize: 88, fontWeight: 800}} />
        <BlurWords
          words={['Under', 'the', 'tarp:', 'a', 'complete', 'craft.', 'Recovered', '1977.', 'Dormant',
            '—', 'until', 'tonight.']}
          start={t + 54} stagger={2.5} dur={10} rise={12} color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, marginTop: 22, maxWidth: 1080, lineHeight: 1.45}} />
      </AbsoluteFill>
      <div style={{
        position: 'absolute', right: 72, top: 120, textAlign: 'right',
        fontFamily: F.type, fontSize: 26, color: flash > 0.5 ? C.amber : C.paperDim,
        letterSpacing: '0.12em', lineHeight: 1.8, opacity: win(f, t + 96, 12),
      }}>
        ARCHIVE // RECOVERY 1977<br />
        <span style={{fontSize: 19, color: C.paperDim}}>PAPOOSE LAKE BED — SITE 4</span>
      </div>
      <Stamp text="PROTOTYPE — TEST UNIT #12" start={t + 150} x={760} y={420} rot={-3} size={28} color={C.plasma} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 4 ------------------------------- */
export const S4: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s4.from;
  return (
    <Seg from={t} dur={T.s4.dur}>
      <Camera src="img/s4_control.jpg" from={t} dur={T.s4.dur} focusFrom={[50, 47]} focusTo={[49, 41]} scaleFrom={1.03} scaleTo={1.13} ease="inOut" handheld={0.1} rotate={0} brightness={0.88} sepia={0} narrSeg="s4" />
      <GradeBottom />
      <Slug scene="SCENE 4" time="23:18 HRS" place="CONTROL — SECTOR 4" start={t + 6} accent={C.phosphor} />
      <Clock start={t} baseSec={23 * 3600 + 18 * 60} />
      <div style={{position: 'absolute', right: 90, top: 210}}>
        <RadarSweep start={t + 10} size={300} />
      </div>
      <div style={{position: 'absolute', left: 72, top: 330}}>
        <FreqReadout start={t + 26} />
        <Waveform start={t + 40} w={360} h={56} />
      </div>
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['1.7', 'GHz', '—', 'REPEATING']} start={t + 16} stagger={5} dur={13}
          accentIndex={1} accentColor={C.phosphor}
          style={{fontFamily: F.sans, fontSize: 92, fontWeight: 800}} />
        <BlurWords
          words={['The', 'craft', 'is', 'drawing', 'power', 'from', 'the', 'base', 'grid.', 'On', 'its', 'own.']}
          start={t + 52} stagger={2.5} dur={10} rise={12} color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, marginTop: 22, maxWidth: 1000, lineHeight: 1.45}} />
      </AbsoluteFill>
      <Glitch from={t + 84} dur={12} strength={0.7} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 5 ------------------------------- */
export const S5: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s5.from;
  return (
    <Seg from={t} dur={T.s5.dur}>
      <Camera src="img/s5_lab.jpg" from={t} dur={T.s5.dur} focusFrom={[50, 33]} focusTo={[50, 65]} scaleFrom={1.05} scaleTo={1.18} ease="inOut" handheld={0.12} rotate={0} brightness={0.95} sepia={0} narrSeg="s5" />
      {/* macro insert of fragment */}
      <AbsoluteFill style={{opacity: win(f, t + 112, 8) * (1 - win(f, t + 156, 8))}}>
        <Camera src="img/extra_fragment_macro.jpg" from={t + 112} dur={60} focusFrom={[52, 51]} focusTo={[52, 54]} scaleFrom={1.06} scaleTo={1.24} ease="inOut" handheld={0.25} rotate={0.5} brightness={1.0} sepia={0.32} narrSeg="s5" flicker />
      </AbsoluteFill>
      <GradeBottom />
      <Slug scene="SCENE 5" time="23:42 HRS" place="MATERIALS ANALYSIS LAB" start={t + 6} accent={C.plasma} />
      <Clock start={t} baseSec={23 * 3600 + 42 * 60} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['NO', 'WELDS.', 'NO', 'SEAMS.']} start={t + 16} stagger={5} dur={13}
          accentIndex={3} accentColor={C.plasma}
          style={{fontFamily: F.sans, fontSize: 92, fontWeight: 800}} />
        <BlurWords
          words={['Prismatic', 'metal.', 'Warmer', 'than', 'ambient.', 'And', 'it', 'starts', 'vibrating',
            'near', 'the', 'craft.']}
          start={t + 50} stagger={2.5} dur={10} rise={12} color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, marginTop: 22, maxWidth: 1040, lineHeight: 1.45}} />
      </AbsoluteFill>
      {/* temperature readout */}
      <div style={{
        position: 'absolute', right: 72, top: 120, fontFamily: F.mono, fontSize: 20,
        color: C.hud, letterSpacing: '0.16em', textAlign: 'right', lineHeight: 2,
        opacity: win(f, t + 30, 12),
      }}>
        SAMPLE A-51-F<br />
        <span style={{color: C.plasma, fontSize: 30}}>
          +{(4.2 + win(f, t + 30, 120) * 3.8).toFixed(1)}°C ABOVE AMBIENT
        </span><br />
        <span style={{color: C.warnGlow}}>RESONANCE DETECTED ▲</span>
      </div>
      <Stamp text="DOE / AREA 51 — 5Q-OPS" start={t + 92} x={1050} y={520} rot={4} size={22} color={C.paperDim} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 6 ------------------------------- */
export const S6: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s6.from;
  return (
    <Seg from={t} dur={T.s6.dur}>
      <Camera src="img/s6_breach.jpg" from={t} dur={T.s6.dur} focusFrom={[63, 47]} focusTo={[62, 44]} scaleFrom={1.05} scaleTo={1.27} ease="out" handheld={0.9} rotate={0.15} brightness={0.9} sepia={0} narrSeg="s6" />
      <GradeBottom />
      <AlarmPulse from={t} dur={T.s6.dur} />
      <Slug scene="SCENE 6" time="00:03 HRS" place="CONTAINMENT BREACH" start={t + 6} accent={C.warnGlow} />
      <Clock start={t} baseSec={24 * 3600 + 3 * 60} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['IT', 'PUTS', 'ITSELF', 'BACK', 'TOGETHER.']} start={t + 16} stagger={5} dur={13}
          accentIndex={4} accentColor={C.plasma}
          style={{fontFamily: F.sans, fontSize: 80, fontWeight: 800}} />
        <BlurWords
          words={['No', 'propulsion.', 'No', 'sound.', 'It', 'lifts', 'one', 'meter', 'and', 'hovers.']}
          start={t + 52} stagger={2.5} dur={10} rise={12} color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, marginTop: 22, maxWidth: 980, lineHeight: 1.45}} />
      </AbsoluteFill>
      <Stamp text="CONTAINMENT BREACH" start={t + 22} x={880} y={190} rot={-6} size={36} color={C.warnGlow} />
      <div style={{
        position: 'absolute', right: 72, top: 130, fontFamily: F.mono, fontSize: 22,
        color: C.warnGlow, letterSpacing: '0.2em', opacity: win(f, t + 30, 8),
        textAlign: 'right',
      }}>
        ▲ ALARM — EVACUATE — POWER FAILURE
      </div>
      <Glitch from={t + 96} dur={16} strength={1} />
      <Glitch from={t + 140} dur={10} strength={0.6} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 7 ------------------------------- */
export const S7: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s7.from;
  return (
    <Seg from={t} dur={T.s7.dur}>
      <Camera src="img/s7_beam.jpg" from={t} dur={T.s7.dur} focusFrom={[47, 29]} focusTo={[49, 54]} scaleFrom={1.24} scaleTo={1.03} ease="out" handheld={0.08} rotate={0} brightness={0.75} sepia={0.15} narrSeg="s7" />
      <BeamGlow start={t + 8} />
      <GradeBottom strength={0.75} />
      <Slug scene="SCENE 7" time="00:07 HRS" place="THE SIGNAL" start={t + 6} accent={C.plasma} />
      <Clock start={t} baseSec={24 * 3600 + 7 * 60} />
      {/* blackout flash */}
      <AbsoluteFill style={{background: '#000', opacity: (1 - win(f, t + 2, 4)) * win(f, t - 8, 8)}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['11', 'SECONDS', 'OF', 'BLACKOUT.']} start={t + 16} stagger={5} dur={13}
          accentIndex={0} accentColor={C.plasma}
          style={{fontFamily: F.sans, fontSize: 92, fontWeight: 800}} />
        <BlurWords
          words={['Blue-white', 'light.', 'Visible', '40', 'miles.', 'Satellites', 'log', 'an',
            '“ionospheric', 'event.”']}
          start={t + 52} stagger={2.5} dur={10} rise={12} color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, marginTop: 22, maxWidth: 1060, lineHeight: 1.45}} />
      </AbsoluteFill>
      <div style={{
        position: 'absolute', right: 72, top: 130, fontFamily: F.mono, fontSize: 20,
        color: C.plasma, letterSpacing: '0.18em', textAlign: 'right', lineHeight: 2,
        opacity: win(f, t + 40, 12),
      }}>
        SAT LOG // IONOSPHERIC EVENT<br />
        <span style={{color: C.paperDim}}>DURATION 11.0 s — CLASS: ANOMALY</span>
      </div>
      <Glitch from={t + 2} dur={14} strength={1.2} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 8 ------------------------------- */
export const S8: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s8.from;
  return (
    <Seg from={t} dur={T.s8.dur}>
      <Camera src="img/s8_evac.jpg" from={t} dur={T.s8.dur} focusFrom={[60, 34]} focusTo={[44, 56]} scaleFrom={1.06} scaleTo={1.17} ease="inOut" handheld={0.75} rotate={-0.18} brightness={0.92} sepia={0} narrSeg="s8" />
      <GradeBottom />
      <Slug scene="SCENE 8" time="00:12 HRS" place="EVACUATION" start={t + 6} accent={C.warnGlow} />
      <Clock start={t} baseSec={24 * 3600 + 12 * 60} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['8', 'MINUTES', 'MISSING.']} start={t + 16} stagger={6} dur={13}
          accentIndex={0} accentColor={C.warnGlow}
          style={{fontFamily: F.sans, fontSize: 96, fontWeight: 800}} />
        <BlurWords
          words={['Low-frequency', 'hum.', 'Watches', 'stopped.', 'Personnel', 'report', 'lost', 'time.',
            'Then', 'the', 'craft', 'goes', 'inert.']}
          start={t + 54} stagger={2.5} dur={10} rise={12} color={C.paper}
          style={{fontFamily: F.sans, fontSize: 34, marginTop: 22, maxWidth: 1060, lineHeight: 1.45}} />
      </AbsoluteFill>
      {/* lost-time watch glitch */}
      <div style={{
        position: 'absolute', right: 72, top: 130, fontFamily: F.mono, fontSize: 42,
        color: C.warnGlow, letterSpacing: '0.12em', opacity: win(f, t + 30, 10),
      }}>
        00:07 → 00:15
        <div style={{fontSize: 18, color: C.paperDim, letterSpacing: '0.24em', marginTop: 8}}>
          WATCH LOG DISCREPANCY
        </div>
      </div>
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 9 ------------------------------- */
export const S9: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s9.from;
  return (
    <Seg from={t} dur={T.s9.dur}>
      <Camera src="img/s9_morning.jpg" from={t} dur={T.s9.dur} focusFrom={[51, 55]} focusTo={[51, 56]} scaleFrom={1.035} scaleTo={1.045} ease="linear" handheld={0.04} rotate={0} brightness={1.0} sepia={0.32} />
      <GradeBottom />
      <Slug scene="SCENE 9" time="06:30 HRS" place="MORNING AFTER" start={t + 6} />
      <Clock start={t} baseSec={6 * 3600 + 30 * 60} />
      {/* official typed log card */}
      <div style={{
        position: 'absolute', left: 72, top: 190, width: 720, padding: '34px 38px',
        background: 'rgba(233,226,210,0.94)', color: '#1A1710',
        fontFamily: F.type, fontSize: 27, lineHeight: 1.7, borderRadius: 4,
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)', transform: `rotate(-0.6deg)`,
        opacity: win(f, t + 10, 14),
      }}>
        <Typewriter
          text={'OFFICIAL LOG — 14 JUL 1979 06:30\n"Electrical failure in Hangar 6.\nNo injuries.\nTest Unit #12 secured."'}
          start={t + 22} speed={0.8}
        />
      </div>
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <div style={{
          fontFamily: F.sans, fontSize: 30, color: C.paper, marginTop: 10,
          opacity: win(f, t + 92, 12), display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3em',
        }}>
          Personnel debriefed and <RedactedBar w={170} start={t + 108} retract />
          <span style={{fontSize: 72, fontWeight: 800, color: C.warnGlow, width: '100%', letterSpacing: '-0.01em', marginTop: 12}}>
            REASSIGNED.
          </span>
        </div>
      </AbsoluteFill>
      <Stamp text="APPROVED FOR PUBLIC RELEASE" start={t + 128} x={880} y={520} rot={-3} size={24} color={C.paperDim} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- SCENE 10 ------------------------------- */
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.s10.from;
  return (
    <Seg from={t} dur={T.s10.dur}>
      <Camera src="img/s10_file.jpg" from={t} dur={T.s10.dur} focusFrom={[45, 49]} focusTo={[40, 65]} scaleFrom={1.02} scaleTo={1.19} ease="inOut" handheld={0.1} rotate={0} brightness={0.82} sepia={0.12} narrSeg="s10" />
      <GradeBottom />
      <Slug scene="SCENE 10" time="2004" place="FOIA RELEASE" start={t + 6} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 130px'}}>
        <BlurWords words={['PROJECT', 'NIGHTINGALE', '—', 'CLOSED']} start={t + 16} stagger={5} dur={13}
          accentIndex={3} accentColor={C.warnGlow}
          style={{fontFamily: F.sans, fontSize: 84, fontWeight: 800}} />
        <div style={{
          marginTop: 26, fontFamily: F.sans, fontSize: 34, color: C.paper, lineHeight: 1.6,
          opacity: win(f, t + 58, 14),
        }}>
          The craft remains listed as:{' '}
          <span style={{fontFamily: F.type, color: C.amber, fontSize: 38}}>“Prototype — Test Unit.”</span>
        </div>
        {/* redaction strip */}
        <div style={{
          marginTop: 24, display: 'flex', gap: 12, alignItems: 'center',
          fontFamily: F.mono, fontSize: 22, color: C.paperDim, letterSpacing: '0.14em',
          opacity: win(f, t + 88, 12),
        }}>
          <RedactedBar w={130} start={t + 92} />
          <RedactedBar w={210} start={t + 98} />
          <RedactedBar w={90} start={t + 104} />
          <span>REDACTED — (b)(1) NATIONAL SECURITY</span>
        </div>
      </AbsoluteFill>
      <Stamp text="DECLASSIFIED 2004-01-12" start={t + 130} x={1020} y={190} rot={-7} size={32} />
      <Letterbox />
    </Seg>
  );
};

/* ------------------------------- END ------------------------------- */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.end.from;
  return (
    <Seg from={t} dur={T.end.dur}>
      <AbsoluteFill style={{background: C.black, justifyContent: 'center', alignItems: 'center'}}>
        <BlurWords words={['THE', 'FILE', 'WAS', 'RELEASED.']} start={t + 8} stagger={5} dur={13} rise={20}
          style={{fontFamily: F.sans, fontSize: 64, fontWeight: 700, letterSpacing: '0.02em'}} />
        <BlurWords words={['THE', 'REDACTIONS', 'REMAIN.']} start={t + 32} stagger={5} dur={13} rise={20}
          accentIndex={1} accentColor={C.warnGlow}
          style={{fontFamily: F.sans, fontSize: 64, fontWeight: 700, letterSpacing: '0.02em', marginTop: 10}} />
        <div style={{
          marginTop: 44, fontFamily: F.mono, fontSize: 20, color: C.paperDim,
          letterSpacing: '0.34em', opacity: easeOutCubic(win(f, t + 62, 14)),
        }}>
          PROJECT NIGHTINGALE · GROOM LAKE · 1979—
        </div>
      </AbsoluteFill>
    </Seg>
  );
};

/* --------------------------- MAIN COMPOSITION --------------------------- */
export const Nightingale: React.FC = () => (
  <AbsoluteFill style={{background: C.black}}>
    <GateWeave>
      <Title />
      <S1 />
      <S2 />
      <S3 />
      <S4 />
      <S5 />
      <S6 />
      <S7 />
      <S8 />
      <S9 />
      <S10 />
      <End />
      {/* prop cutaways — keep the eye moving between the big shots */}
      <InsertShot src="img/insert_notes.jpg" from={T.s3.from + 60} dur={40}
        label="CASE NOTE 77-B" focusFrom={[40, 62]} focusTo={[46, 50]} scaleFrom={1.06} scaleTo={1.18} rot={-1.2} />
      <InsertShot src="img/insert_radio.jpg" from={T.s4.from + 28} dur={42}
        label="SIGNAL INTERCEPT — 1.7 GHz" focusFrom={[52, 58]} focusTo={[46, 46]} scaleFrom={1.10} scaleTo={1.02} rot={0.8} />
      <InsertShot src="img/insert_thermal.jpg" from={T.s5.from + 44} dur={42}
        label="THERMAL SCAN — SAMPLE A-51-F" focusFrom={[50, 50]} focusTo={[52, 54]} scaleFrom={1.04} scaleTo={1.16} rot={0} />
      <InsertShot src="img/insert_watch.jpg" from={T.s8.from + 60} dur={44}
        label="EXHIBIT 12 — STOPPED 00:11" focusFrom={[54, 46]} focusTo={[46, 52]} scaleFrom={1.08} scaleTo={1.20} rot={1.4} />
      <InsertShot src="img/insert_newspaper.jpg" from={T.s10.from + 66} dur={44}
        label="PRESS CLIPPING — MAY 1979" focusFrom={[44, 60]} focusTo={[52, 46]} scaleFrom={1.05} scaleTo={1.17} rot={-0.9} />
      <LightLeak from={T.s3.from + 10} dur={40} />
      <LightLeak from={T.s9.from + 30} dur={60} />
      <FilmEdges />
    </GateWeave>
    <CaptionTrack />
    <Dust />
    <Halation />
    <ExposureFlicker />
    <Vignette />
    <Grain opacity={0.19} />
  </AbsoluteFill>
);
