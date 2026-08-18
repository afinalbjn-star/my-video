import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

// Skema warna standar Rubik's Cube
const CubeFace = ({ color, transform }: { color: string; transform: string }) => (
    <div
        style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: color,
            border: '10px solid #000',
            boxSizing: 'border-box',
            transform,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
        }}
    >
        {[...Array(9)].map((_, i) => (
            <div key={i} style={{ border: '4px solid #000', background: color }} />
        ))}
    </div>
);

export const RubikCubeScene: React.FC = () => {
    const frame = useCurrentFrame();

    // Animasi putaran "bermain"
    const rotationY = interpolate(frame, [0, 120, 240, 360], [0, 90, 90, 180]);
    const rotationX = interpolate(frame, [0, 360, 480], [0, 0, 90]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
            <div
                style={{
                    width: 600,
                    height: 600,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(-20deg) rotateY(${rotationY}deg) rotateX(${rotationX}deg)`,
                }}
            >
                <CubeFace color="white" transform="translateZ(300px)" />
                <CubeFace color="yellow" transform="rotateY(180deg) translateZ(300px)" />
                <CubeFace color="red" transform="rotateY(90deg) translateZ(300px)" />
                <CubeFace color="orange" transform="rotateY(-90deg) translateZ(300px)" />
                <CubeFace color="green" transform="rotateX(90deg) translateZ(300px)" />
                <CubeFace color="blue" transform="rotateX(-90deg) translateZ(300px)" />
            </div>
        </AbsoluteFill>
    );
};
