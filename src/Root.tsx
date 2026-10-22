import React from 'react';
import {Composition} from 'remotion';
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadType} from '@remotion/google-fonts/SpecialElite';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {Nightingale} from './Nightingale';
import {Wow} from './wow/Wow';
import {T} from './theme';

loadMono('normal', {weights: ['400', '600', '700'], subsets: ['latin']});
loadType('normal', {weights: ['400'], subsets: ['latin']});
loadSans('normal', {weights: ['400', '500', '700', '800'], subsets: ['latin']});

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Nightingale"
    component={Nightingale}
    durationInFrames={T.total}
    fps={30}
    width={1920}
    height={1080}
  />
  <Composition
    id="Wow"
    component={Wow}
    durationInFrames={2888}
    fps={30}
    width={1920}
    height={1080}
  />
  </>
);
