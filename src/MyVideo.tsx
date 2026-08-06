import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Menggunakan fungsi noise yang sama dengan EmeraldWaveAnimation untuk konsistensi dan seamless loop
const hash = (n: number) => {
    let x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const noise2D = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(ix + iy * 57);
    const b = hash(ix + 1 + iy * 57);
    const c = hash(ix + (iy + 1) * 57);
    const d = hash(ix + 1 + (iy + 1) * 57);
    return (1 - sy) * ((1 - sx) * a + sx * b) + sy * ((1 - sx) * c + sx * d);
};

const seamlessNoise = (t: number, x: number, y: number, R: number) => {
    const angle = t * Math.PI * 2;
    const noiseX = x + Math.cos(angle) * R;
    const noiseY = y + Math.sin(angle) * R;
    return noise2D(noiseX, noiseY);
};

const MyVideo: React.FC = () => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const t = frame / durationInFrames;

    // Calculate the color based on the frame
    const waterColor = interpolateColors(frame, durationInFrames);

    // Calculate the wave animation
    const waveAnimation = (x: number, y: number) => {
        // Menggunakan seamlessNoise untuk memastikan loop yang mulus
        const noiseValue = seamlessNoise(t, x, y, 2);
        return (noiseValue + 1) / 2;
    };

    return (
        <AbsoluteFill style={{ backgroundColor: waterColor }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0',
                        transform: `translateY(${waveAnimation(frame, 0)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '10px 10px',
                        transform: `translateY(${waveAnimation(frame, 1)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '20px 20px',
                        transform: `translateY(${waveAnimation(frame, 2)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '30px 30px',
                        transform: `translateY(${waveAnimation(frame, 3)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '40px 40px',
                        transform: `translateY(${waveAnimation(frame, 4)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '50px 50px',
                        transform: `translateY(${waveAnimation(frame, 5)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '60px 60px',
                        transform: `translateY(${waveAnimation(frame, 6)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '70px 70px',
                        transform: `translateY(${waveAnimation(frame, 7)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '80px 80px',
                        transform: `translateY(${waveAnimation(frame, 8)}px)`
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
                               linear-gradient(180deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05))`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '90px 90px',
                        transform: `translateY(${waveAnimation(frame, 9)}px)`
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};

// Function to interpolate colors
const interpolateColors = (frame: number, durationInFrames: number) => {
    const t = frame / durationInFrames;
    const startColor = [135, 206, 250]; // Light Blue
    const midColor = [65, 105, 225]; // Royal Blue
    const endColor = [0, 128, 128]; // Teal

    if (t < 0.5) {
        const midT = t * 2;
        return `rgb(${interpolate(midT, [0, 1], [startColor[0], midColor[0]])},${interpolate(midT, [0, 1], [startColor[1], midColor[1]])},${interpolate(midT, [0, 1], [startColor[2], midColor[2]])})`;
    } else {
        const midT = (t - 0.5) * 2;
        return `rgb(${interpolate(midT, [0, 1], [midColor[0], endColor[0]])},${interpolate(midT, [0, 1], [midColor[1], endColor[1]])},${interpolate(midT, [0, 1], [midColor[2], endColor[2]])})`;
    }
};

export default MyVideo;
