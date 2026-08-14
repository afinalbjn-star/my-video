import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const OutroScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const textScale = spring({
        frame: frame - 10,
        fps,
        config: { damping: 10, mass: 0.5, stiffness: 100 },
    });

    return (
        <AbsoluteFill style={{ backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* Confetti */}
            {[...Array(50)].map((_, i) => {
                const colors = ['#FFF', '#FFD700', '#00CED1', '#32CD32'];
                const fall = (frame * (i % 5 + 5)) % 2500;
                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: -100 + fall,
                            left: (i * 100) % 3840,
                            width: 30,
                            height: 60,
                            backgroundColor: colors[i % colors.length],
                            transform: `rotate(${frame * (i % 3 + 1)}deg)`,
                            borderRadius: 10,
                        }}
                    />
                );
            })}

            <div
                style={{
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: '100px 200px',
                    borderRadius: 100,
                    boxShadow: '0 50px 100px rgba(0,0,0,0.2)',
                    transform: `scale(${textScale})`,
                    textAlign: 'center',
                }}
            >
                <h1
                    style={{
                        fontSize: 200,
                        fontFamily: 'Comic Sans MS, Arial, sans-serif',
                        color: '#FF1493',
                        fontWeight: 'bold',
                        margin: 0,
                        textShadow: '5px 5px 0px #FFB6C1',
                    }}
                >
                    Terima Kasih!
                </h1>
                <h2
                    style={{
                        fontSize: 120,
                        fontFamily: 'Comic Sans MS, Arial, sans-serif',
                        color: '#1E90FF',
                        fontWeight: 'bold',
                        marginTop: 50,
                        textShadow: '5px 5px 0px #87CEFA',
                    }}
                >
                    Jangan lupa Subscribe!
                </h2>
            </div>
        </AbsoluteFill>
    );
};
