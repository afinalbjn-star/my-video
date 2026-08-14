import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig, interpolateColors } from 'remotion';

const colors = [
    { name: 'MERAH', hex: '#FF0000', bgColor: '#FFE4E1' },
    { name: 'BIRU', hex: '#0000FF', bgColor: '#E0FFFF' },
    { name: 'KUNING', hex: '#FFD700', bgColor: '#FFFACD' },
    { name: 'HIJAU', hex: '#32CD32', bgColor: '#F0FFF0' },
];

export const ColorsScene: React.FC = () => {
    const { fps } = useVideoConfig();
    const durationPerColor = 120; // 4 seconds per color (120 frames)

    return (
        <AbsoluteFill>
            {colors.map((color, index) => (
                <Sequence key={color.name} from={index * durationPerColor} durationInFrames={durationPerColor}>
                    <ColorDisplay color={color} fps={fps} duration={durationPerColor} />
                </Sequence>
            ))}
        </AbsoluteFill>
    );
};

const ColorDisplay: React.FC<{ color: { name: string; hex: string; bgColor: string }; fps: number; duration: number }> = ({ color, fps, duration }) => {
    const frame = useCurrentFrame();

    const bgScale = spring({
        frame,
        fps,
        config: { damping: 200, mass: 1, stiffness: 100 },
    });

    const textScale = spring({
        frame: frame - 30,
        fps,
        config: { damping: 12, mass: 0.5, stiffness: 150 },
    });

    const circleScale = spring({
        frame: frame - 60,
        fps,
        config: { damping: 10, mass: 0.8, stiffness: 120 },
    });
    
    const bounce = Math.sin(frame / 10) * 50;

    return (
        <AbsoluteFill style={{ backgroundColor: color.bgColor, justifyContent: 'center', alignItems: 'center' }}>
            {/* Liveliness: Floating Confetti/Stars in Background */}
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: (Math.sin(i) * 500 + 1000 + frame * (i % 5)) % 2160,
                        left: (Math.cos(i) * 1000 + 1920) % 3840,
                        width: 40,
                        height: 40,
                        backgroundColor: color.hex,
                        opacity: 0.3,
                        borderRadius: i % 2 === 0 ? '50%' : 10,
                        transform: `rotate(${frame * 5}deg)`,
                    }}
                />
            ))}

            <div
                style={{
                    position: 'absolute',
                    width: 3000,
                    height: 3000,
                    borderRadius: '50%',
                    backgroundColor: color.hex,
                    opacity: 0.1,
                    transform: `scale(${bgScale})`,
                }}
            />
            
            <div
                style={{
                    width: 800,
                    height: 800,
                    backgroundColor: color.hex,
                    borderRadius: '50%',
                    transform: `scale(${circleScale}) translateY(${bounce}px)`,
                    boxShadow: `0 30px 60px rgba(0,0,0,0.3)`,
                    border: '40px solid white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {/* Smiley Face */}
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div style={{ position: 'absolute', top: 250, left: 200, width: 80, height: 120, backgroundColor: 'white', borderRadius: 40 }} />
                    <div style={{ position: 'absolute', top: 250, right: 200, width: 80, height: 120, backgroundColor: 'white', borderRadius: 40 }} />
                    <div style={{ position: 'absolute', bottom: 200, left: 250, width: 300, height: 150, borderBottom: '40px solid white', borderRadius: '50%' }} />
                </div>
            </div>

            <h1
                style={{
                    fontSize: 350,
                    fontFamily: 'Comic Sans MS, Arial, sans-serif',
                    color: color.hex,
                    fontWeight: '900',
                    textShadow: '10px 10px 0px white, -10px -10px 0px white, 10px -10px 0px white, -10px 10px 0px white, 20px 20px 30px rgba(0,0,0,0.2)',
                    transform: `scale(${textScale})`,
                    marginTop: 100,
                    zIndex: 10,
                }}
            >
                {color.name}
            </h1>
        </AbsoluteFill>
    );
};
