import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const IntroScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const titleScale = spring({
        frame: frame - 15,
        fps,
        config: { damping: 10, mass: 0.5, stiffness: 100 },
    });

    const sunRotation = interpolate(frame, [0, 300], [0, 360]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#87CEEB', justifyContent: 'center', alignItems: 'center' }}>
            {/* Sun */}
            <div
                style={{
                    position: 'absolute',
                    top: 200,
                    right: 300,
                    width: 400,
                    height: 400,
                    backgroundColor: '#FFD700',
                    borderRadius: '50%',
                    transform: `rotate(${sunRotation}deg)`,
                    boxShadow: '0 0 100px #FFD700',
                }}
            >
                {/* Sun Rays */}
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: -50,
                            left: 175,
                            width: 50,
                            height: 500,
                            backgroundColor: '#FFD700',
                            borderRadius: 25,
                            transform: `rotate(${i * 45}deg)`,
                        }}
                    />
                ))}
            </div>

            {/* Clouds */}
            <div style={{ position: 'absolute', top: 300, left: (frame * 5) % 4000 - 500 }}>
                <Cloud />
            </div>
            <div style={{ position: 'absolute', top: 600, left: ((frame * 3) + 2000) % 4000 - 500, transform: 'scale(1.5)' }}>
                <Cloud />
            </div>

            {/* Title */}
            <h1
                style={{
                    fontSize: 250,
                    fontFamily: 'Comic Sans MS, Arial, sans-serif',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    textShadow: '10px 10px 0px #FF4500, 20px 20px 0px #32CD32, 30px 30px 0px #1E90FF',
                    transform: `scale(${titleScale})`,
                    textAlign: 'center',
                    zIndex: 10,
                }}
            >
                Mari Belajar<br />Bersama!
            </h1>
        </AbsoluteFill>
    );
};

const Cloud: React.FC = () => (
    <div style={{ width: 400, height: 120, backgroundColor: 'white', borderRadius: 100, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -80, left: 50, width: 150, height: 150, backgroundColor: 'white', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: -120, left: 150, width: 200, height: 200, backgroundColor: 'white', borderRadius: '50%' }} />
    </div>
);
