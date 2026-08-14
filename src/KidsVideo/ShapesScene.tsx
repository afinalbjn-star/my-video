import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const shapes = [
    { name: 'LINGKARAN', color: '#FF4500', style: { borderRadius: '50%' } },
    { name: 'PERSEGI', color: '#1E90FF', style: { borderRadius: 40 } },
    { name: 'SEGITIGA', color: '#32CD32', style: { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', borderRadius: 40 } }, // Slightly rounded triangle is hard with clipPath, but this is a sharp triangle
];

export const ShapesScene: React.FC = () => {
    const { fps } = useVideoConfig();
    const durationPerShape = 120; // 4 seconds per shape

    return (
        <AbsoluteFill style={{ backgroundColor: '#FFFACD' }}>
            {shapes.map((shape, index) => (
                <Sequence key={shape.name} from={index * durationPerShape} durationInFrames={durationPerShape}>
                    <ShapeDisplay shape={shape} fps={fps} />
                </Sequence>
            ))}
        </AbsoluteFill>
    );
};

const ShapeDisplay: React.FC<{ shape: { name: string; color: string; style: React.CSSProperties }; fps: number }> = ({ shape, fps }) => {
    const frame = useCurrentFrame();

    const shapeScale = spring({
        frame: frame - 20,
        fps,
        config: { damping: 10, mass: 0.8, stiffness: 120 },
    });

    const textScale = spring({
        frame: frame - 60,
        fps,
        config: { damping: 12, mass: 0.5, stiffness: 150 },
    });
    
    // Jump animation
    const jump = Math.abs(Math.sin(frame / 10)) * 100;
    const rotate = shape.name === 'LINGKARAN' ? frame * 2 : Math.sin(frame / 15) * 20; // Circle rolls, others wobble

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            
            {/* Liveliness: Floating mini shapes */}
            {[...Array(15)].map((_, i) => (
                <div
                    key={`bg-shape-${i}`}
                    style={{
                        position: 'absolute',
                        top: (Math.cos(i) * 600 + 1000 + frame * (i % 4)) % 2160,
                        left: (Math.sin(i) * 1200 + 1920) % 3840,
                        width: 60,
                        height: 60,
                        backgroundColor: shape.color,
                        ...shape.style,
                        opacity: 0.2,
                        transform: `rotate(${frame * (i % 3 + 2)}deg)`,
                    }}
                />
            ))}

            <div
                style={{
                    width: 800,
                    height: 800,
                    backgroundColor: shape.color,
                    ...shape.style,
                    transform: `scale(${shapeScale}) translateY(-${jump}px) rotate(${rotate}deg)`,
                    boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
                    border: shape.name === 'SEGITIGA' ? 'none' : '40px solid white', // Borders break clipPath
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {/* Smiley Face */}
                {shape.name !== 'SEGITIGA' && (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <div style={{ position: 'absolute', top: 250, left: 200, width: 80, height: 120, backgroundColor: 'white', borderRadius: 40 }} />
                        <div style={{ position: 'absolute', top: 250, right: 200, width: 80, height: 120, backgroundColor: 'white', borderRadius: 40 }} />
                        <div style={{ position: 'absolute', bottom: 200, left: 250, width: 300, height: 150, borderBottom: '40px solid white', borderRadius: '50%' }} />
                    </div>
                )}
            </div>

            <h1
                style={{
                    fontSize: 250,
                    fontFamily: 'Comic Sans MS, Arial, sans-serif',
                    color: shape.color,
                    fontWeight: '900',
                    textShadow: '10px 10px 0px white, -10px -10px 0px white, 10px -10px 0px white, -10px 10px 0px white, 20px 20px 30px rgba(0,0,0,0.2)',
                    transform: `scale(${textScale})`,
                    marginTop: 150,
                    zIndex: 10,
                }}
            >
                {shape.name}
            </h1>
        </AbsoluteFill>
    );
};
