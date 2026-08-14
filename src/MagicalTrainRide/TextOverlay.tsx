import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface TextOverlayProps {
    text: string;
    color?: string;
    emoji?: string;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ text, color = '#FFD700', emoji = '✨' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scaleIn = spring({
        frame,
        fps,
        config: { damping: 10, mass: 0.5, stiffness: 120 },
    });

    const opacity = interpolate(frame, [0, 15, 90, 120], [0, 1, 1, 0], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
    });

    const bounce = Math.sin(frame * 0.15) * 15;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}>
            <div
                style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)',
                    padding: '50px 120px',
                    borderRadius: 80,
                    border: `8px solid ${color}`,
                    transform: `scale(${scaleIn}) translateY(${bounce}px)`,
                    opacity,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 40,
                    boxShadow: `0 0 60px ${color}40`,
                }}
            >
                <span style={{ fontSize: 150 }}>{emoji}</span>
                <h1
                    style={{
                        fontSize: 140,
                        fontFamily: 'Comic Sans MS, Arial Rounded MT Bold, Arial, sans-serif',
                        color: 'white',
                        fontWeight: '900',
                        textShadow: `4px 4px 0px ${color}, -4px -4px 0px ${color}, 4px -4px 0px ${color}, -4px 4px 0px ${color}`,
                        margin: 0,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {text}
                </h1>
                <span style={{ fontSize: 150 }}>{emoji}</span>
            </div>
        </AbsoluteFill>
    );
};
