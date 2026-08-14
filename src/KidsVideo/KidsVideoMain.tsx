import React from 'react';
import { Sequence, AbsoluteFill, Audio, staticFile } from 'remotion';
import { IntroScene } from './IntroScene';
import { ColorsScene } from './ColorsScene';
import { NumbersScene } from './NumbersScene';
import { ShapesScene } from './ShapesScene';
import { OutroScene } from './OutroScene';

// Total 70 seconds at 30fps = 2100 frames
export const KidsVideoMain: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: 'white' }}>
            <Audio src={staticFile('kids-music.mp3')} volume={0.5} loop />

            <Sequence from={0} durationInFrames={150}>
                <IntroScene />
            </Sequence>
            <Sequence from={150} durationInFrames={480}>
                <ColorsScene />
            </Sequence>
            <Sequence from={630} durationInFrames={900}>
                <NumbersScene />
            </Sequence>
<Sequence from={1530} durationInFrames={360}>
    <ShapesScene />
</Sequence>
<Sequence from={1890} durationInFrames={360}>
    <VolleyballScene />
</Sequence>
<Sequence from={2250} durationInFrames={210}>
    <OutroScene />
</Sequence>
        </AbsoluteFill>
    );
};
