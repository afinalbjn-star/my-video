import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig, MathUtils } from 'remotion';

export const NumbersScene: React.FC = () => {
    const { fps } = useVideoConfig();
    const durationPerNumber = 90; // 3 seconds per number

    return (
        <AbsoluteFill style={{ backgroundColor: '#FFF0F5' }}>
            {[...Array(10)].map((_, i) => (
                <Sequence key={i} from={i * durationPerNumber} durationInFrames={durationPerNumber}>
                    <NumberDisplay num={i + 1} fps={fps} />
                </Sequence>
            ))}
        </AbsoluteFill>
    );
};

const NumberDisplay: React.FC<{ num: number; fps: number }> = ({ num, fps }) => {
    const frame = useCurrentFrame();

    const textScale = spring({
        frame: frame - 15,
        fps,
        config: { damping: 12, mass: 0.5, stiffness: 150 },
    });

    const colors = ['#FF69B4', '#FFA500', '#32CD32', '#1E90FF', '#9370DB', '#FF4500', '#00CED1', '#FF1493', '#7FFF00', '#4169E1'];
    const color = colors[num - 1];

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
            
            {/* Liveliness: Fast moving background lines */}
            {[...Array(10)].map((_, i) => (
                <div
                    key={`bg-${i}`}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: ((frame * 20) + i * 400) % 3840 - 200,
                        width: 50,
                        height: '100%',
                        backgroundColor: color,
                        opacity: 0.1,
                        transform: 'skewX(-20deg)',
                    }}
                />
            ))}

            {/* Number on the left */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h1
                    style={{
                        fontSize: 800,
                        fontFamily: 'Comic Sans MS, Arial, sans-serif',
                        color: 'white',
                        fontWeight: '900',
                        textShadow: `20px 20px 0px ${color}, 40px 40px 0px rgba(0,0,0,0.1)`,
                        transform: `scale(${textScale}) rotate(${Math.sin(frame/15) * 5}deg)`,
                        zIndex: 10,
                    }}
                >
                    {num}
                </h1>
            </div>

            {/* Objects on the right */}
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 50, padding: 100 }}>
                {[...Array(num)].map((_, i) => {
                    const objScale = spring({
                        frame: frame - (40 + i * 15), // Staggered entrance
                        fps,
                        config: { damping: 10, mass: 0.8, stiffness: 120 },
                    });

                    return (
                        <div
                            key={i}
                            style={{
                                width: 200,
                                height: 200,
                                backgroundColor: color,
                                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', // Star shape
                                transform: `scale(${objScale}) rotate(${frame}deg)`,
                                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                            }}
                        />
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};
