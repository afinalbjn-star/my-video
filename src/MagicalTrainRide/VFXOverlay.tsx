import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface NightVFXOverlayProps {
    variant?: 'day' | 'night';
}

export const VFXOverlay: React.FC<NightVFXOverlayProps> = ({ variant = 'day' }) => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    const isNight = variant === 'night';
    const glowColor = isNight ? '#8888FF' : '#FFD700';
    const particleColor1 = isNight ? '#AADDFF' : '#FFD700';
    const particleColor2 = isNight ? '#FFFF88' : '#FFFFFF';

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* God Rays / Moon Glow */}
            <div
                style={{
                    position: 'absolute',
                    top: -500,
                    right: isNight ? undefined : -500,
                    left: isNight ? -200 : undefined,
                    width: 2000,
                    height: 2000,
                    background: `radial-gradient(circle, ${isNight ? 'rgba(180,180,255,0.3)' : 'rgba(255,255,200,0.4)'} 0%, rgba(255,255,255,0) 70%)`,
                    transform: `rotate(${frame * 0.1}deg)`,
                    mixBlendMode: 'screen',
                }}
            />

            {/* Magical Pollen / Fireflies */}
            {[...Array(60)].map((_, i) => {
                const startX = (i * 137) % width;
                const startY = (i * 89) % height;
                const speed = 0.5 + (i % 4) * 0.5;
                const size = 6 + (i % 12);

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: startX + Math.sin(frame * 0.03 + i * 0.7) * 150,
                            top: (startY - frame * speed + height * 3) % height,
                            width: size,
                            height: size,
                            backgroundColor: i % 2 === 0 ? particleColor1 : particleColor2,
                            borderRadius: '50%',
                            opacity: 0.2 + Math.sin(frame * 0.08 + i * 1.3) * 0.4,
                            boxShadow: `0 0 ${size * 2}px ${glowColor}`,
                        }}
                    />
                );
            })}

            {/* Butterflies / Stars (small SVG-like shapes) */}
            {[...Array(8)].map((_, i) => {
                const x = (i * 500 + frame * (3 + i % 2)) % (width + 400) - 200;
                const y = 300 + Math.sin(frame * 0.04 + i * 2) * 300 + i * 150;
                const wingFlap = Math.sin(frame * 0.5 + i) * 30;

                if (isNight) {
                    // Twinkling stars for night
                    const starOpacity = 0.5 + Math.sin(frame * 0.2 + i * 3) * 0.5;
                    return (
                        <div
                            key={`star-${i}`}
                            style={{
                                position: 'absolute',
                                left: (i * 470) % width,
                                top: (i * 230) % (height * 0.5),
                                width: 30,
                                height: 30,
                                opacity: starOpacity,
                                fontSize: 50,
                            }}
                        >
                            ⭐
                        </div>
                    );
                }

                // Butterfly for day
                return (
                    <div
                        key={`butterfly-${i}`}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            fontSize: 60,
                            transform: `scaleX(${Math.cos(frame * 0.3 + i)})`,
                            opacity: 0.8,
                        }}
                    >
                        🦋
                    </div>
                );
            })}

            {/* Fast foreground leaves (speed/parallax effect) */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={`leaf-${i}`}
                    style={{
                        position: 'absolute',
                        bottom: -100 + i * 30,
                        left: ((frame * (15 + i * 4)) + i * 700) % (width + 1200) - 600,
                        width: 250 + i * 30,
                        height: 160 + i * 20,
                        backgroundColor: isNight ? '#0a3d0a' : '#228B22',
                        borderRadius: '150px 0 150px 0',
                        opacity: isNight ? 0.6 : 0.7,
                        transform: `rotate(${Math.sin(frame * 0.08 + i) * 25}deg)`,
                        filter: 'blur(12px)',
                        zIndex: 10,
                    }}
                />
            ))}

            {/* Top foliage overhang for depth */}
            {[...Array(4)].map((_, i) => (
                <div
                    key={`top-leaf-${i}`}
                    style={{
                        position: 'absolute',
                        top: -80 + i * 20,
                        left: ((frame * (8 + i * 3)) + i * 900) % (width + 800) - 400,
                        width: 400,
                        height: 200,
                        backgroundColor: isNight ? '#0a3d0a' : '#2E8B57',
                        borderRadius: '0 200px 0 200px',
                        opacity: isNight ? 0.5 : 0.6,
                        transform: `rotate(${Math.sin(frame * 0.06 + i * 2) * 10}deg)`,
                        filter: 'blur(10px)',
                        zIndex: 10,
                    }}
                />
            ))}
        </AbsoluteFill>
    );
};
