import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { KenBurnsImage } from './KenBurnsImage';
import { VFXOverlay } from './VFXOverlay';
import { TextOverlay } from './TextOverlay';
import { FlashTransition } from './FlashTransition';

// Total duration: ~90 seconds at 30fps = 2700 frames
// 6 main scenes + transitions between them
export const MagicalTrainRide: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            <Audio src={staticFile('kids-music.mp3')} volume={0.5} loop />

            {/* ============= SCENE 1: Intro - Wide Forest Shot ============= */}
            <Sequence from={0} durationInFrames={420}>
                <KenBurnsImage
                    src={staticFile('train_scene_wide.jpg')}
                    scaleStart={1}
                    scaleEnd={1.15}
                    translateXStart={100}
                    translateXEnd={-100}
                />
                <VFXOverlay variant="day" />
                <Sequence from={30} durationInFrames={150}>
                    <TextOverlay text="Ayo Naik Kereta!" emoji="🚂" color="#FF6B35" />
                </Sequence>
            </Sequence>

            {/* Transition 1 */}
            <Sequence from={400} durationInFrames={40}>
                <FlashTransition />
            </Sequence>

            {/* ============= SCENE 2: Close-up Bear & Rabbit ============= */}
            <Sequence from={420} durationInFrames={420}>
                <KenBurnsImage
                    src={staticFile('train_scene_close.jpg')}
                    scaleStart={1.05}
                    scaleEnd={1.2}
                    translateXStart={-60}
                    translateXEnd={60}
                    translateYStart={-20}
                    translateYEnd={20}
                />
                <VFXOverlay variant="day" />
                <Sequence from={30} durationInFrames={150}>
                    <TextOverlay text="Hai Beruang & Kelinci!" emoji="🐻" color="#8B4513" />
                </Sequence>
            </Sequence>

            {/* Transition 2 */}
            <Sequence from={820} durationInFrames={40}>
                <FlashTransition />
            </Sequence>

            {/* ============= SCENE 3: Rainbow Tunnel ============= */}
            <Sequence from={840} durationInFrames={420}>
                <KenBurnsImage
                    src={staticFile('train_tunnel.jpg')}
                    scaleStart={1.1}
                    scaleEnd={1.3}
                    translateXStart={0}
                    translateXEnd={0}
                    translateYStart={0}
                    translateYEnd={-50}
                />
                <VFXOverlay variant="day" />
                <Sequence from={30} durationInFrames={150}>
                    <TextOverlay text="Terowongan Pelangi!" emoji="🌈" color="#9B59B6" />
                </Sequence>
            </Sequence>

            {/* Transition 3 */}
            <Sequence from={1240} durationInFrames={40}>
                <FlashTransition />
            </Sequence>

            {/* ============= SCENE 4: Bridge over River ============= */}
            <Sequence from={1260} durationInFrames={420}>
                <KenBurnsImage
                    src={staticFile('train_bridge.jpg')}
                    scaleStart={1}
                    scaleEnd={1.15}
                    translateXStart={-80}
                    translateXEnd={80}
                />
                <VFXOverlay variant="day" />
                <Sequence from={30} durationInFrames={150}>
                    <TextOverlay text="Jembatan Sungai!" emoji="🌊" color="#1E90FF" />
                </Sequence>
            </Sequence>

            {/* Transition 4 */}
            <Sequence from={1660} durationInFrames={40}>
                <FlashTransition />
            </Sequence>

            {/* ============= SCENE 5: Flower Meadow ============= */}
            <Sequence from={1680} durationInFrames={420}>
                <KenBurnsImage
                    src={staticFile('train_meadow.jpg')}
                    scaleStart={1.05}
                    scaleEnd={1.2}
                    translateXStart={80}
                    translateXEnd={-80}
                    translateYStart={20}
                    translateYEnd={-20}
                />
                <VFXOverlay variant="day" />
                <Sequence from={30} durationInFrames={150}>
                    <TextOverlay text="Padang Bunga!" emoji="🌻" color="#F39C12" />
                </Sequence>
            </Sequence>

            {/* Transition 5 */}
            <Sequence from={2080} durationInFrames={40}>
                <FlashTransition />
            </Sequence>

            {/* ============= SCENE 6: Magical Night Forest ============= */}
            <Sequence from={2100} durationInFrames={420}>
                <KenBurnsImage
                    src={staticFile('train_night.jpg')}
                    scaleStart={1}
                    scaleEnd={1.15}
                    translateXStart={-50}
                    translateXEnd={50}
                />
                <VFXOverlay variant="night" />
                <Sequence from={30} durationInFrames={150}>
                    <TextOverlay text="Hutan Ajaib Malam!" emoji="🌙" color="#7B68EE" />
                </Sequence>
            </Sequence>

            {/* ============= SCENE 7: Outro - Back to Wide Shot ============= */}
            <Sequence from={2520} durationInFrames={180}>
                <KenBurnsImage
                    src={staticFile('train_scene_wide.jpg')}
                    scaleStart={1.15}
                    scaleEnd={1}
                    translateXStart={-100}
                    translateXEnd={0}
                />
                <VFXOverlay variant="day" />
                <Sequence from={15} durationInFrames={150}>
                    <TextOverlay text="Sampai Jumpa!" emoji="👋" color="#E74C3C" />
                </Sequence>
            </Sequence>
        </AbsoluteFill>
    );
};
