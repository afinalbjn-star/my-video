import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const FlashTransition: React.FC = () => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const opacity = interpolate(
        frame,
        [0, durationInFrames * 0.4, durationInFrames * 0.6, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );

    const scale = interpolate(
        frame,
        [0, durationInFrames * 0.5, durationInFrames],
        [0.5, 1.2, 0.5],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: 'white',
                opacity,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 100,
            }}
        >
            {/* Sparkle burst */}
            {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const dist = 200 * scale;
                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                            top: `calc(50% + ${Math.sin(angle) * dist}px)`,
                            width: 40,
                            height: 40,
                            backgroundColor: '#FFD700',
                            borderRadius: '50%',
                            opacity: opacity * 0.8,
                            boxShadow: '0 0 30px #FFD700',
                            transform: `scale(${scale})`,
                        }}
                    />
                );
            })}
        </AbsoluteFill>
    );
};
