import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const volleyballPatterns = [
    { top: 20, left: 0, width: 60, height: 40, backgroundColor: '#FFFFFF' },
    { top: 20, right: 0, width: 60, height: 40, backgroundColor: '#FFFFFF' },
    { bottom: 0, left: 0, width: 160, height: 40, backgroundColor: '#FFFFFF' },
    { bottom: 0, right: 0, width: 60, height: 40, backgroundColor: '#FFFFFF' },
    { top: 0, left: 0, width: 160, height: 40, backgroundColor: '#FFFFFF' },
    { top: 0, right: 0, width: 60, height: 40, backgroundColor: '#FFFFFF' },
    { top: 50, left: 40, width: 80, height: 40, backgroundColor: '#FFFFFF' },
];

export const VolleyballScene: React.FC = () => {
    const { fps } = useVideoConfig();
    const duration = 300;

    return (
        <AbsoluteFill style={{ backgroundColor: '#87CEEB' }}>
            <Sequence from={0} durationInFrames={duration}>
                <VolleyballDisplay fps={fps} />
            </Sequence>
        </AbsoluteFill>
    );
};

const VolleyballDisplay: React.FC<{ fps: number }> = ({ fps }) => {
    const frame = useCurrentFrame();

    const scale = spring({
        frame: frame - 30,
        fps,
        config: { damping: 10, mass: 0.8, stiffness: 120 },
    });

    const rotate = frame * 2;
    const bounce = Math.abs(Math.sin(frame / 15)) * 20;

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div
                style={{
                    position: 'relative',
                    width: 300,
                    height: 280,
                    backgroundColor: '#FF6B35',
                    borderRadius: '55% 45% 45% 55%',
                    transform: `scale(${scale}) translateY(-${bounce}px) rotate(${rotate}deg)`,
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {volleyballPatterns.map((pattern, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: pattern.top,
                            left: pattern.left,
                            width: pattern.width,
                            height: pattern.height,
                            backgroundColor: pattern.backgroundColor,
                            opacity: 0.8,
                            borderRadius: '50%',
                            transform: `rotate(${(rotate + i * 30) % 360}deg)`,
                        }}
                    />
                ))}
            </div>

            <h1
                style={{
                    fontSize: 150,
                    fontFamily: 'Comic Sans MS, Arial, sans-serif',
                    color: '#FFF',
                    fontWeight: '900',
                    textShadow: '5px 5px 0px #000000',
                    marginTop: 150,
                }}
            >
                BOLA VOLI!
            </h1>
        </AbsoluteFill>
    );
};