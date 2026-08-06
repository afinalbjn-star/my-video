import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

// ─── Helpers ───────────────────────────────────────────────────────────
const TAU = Math.PI * 2;
const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

// Seamless loop helper: oscillate between 0→1→0 over duration
const loop01 = (frame: number, total: number) => {
    const t = (frame % total) / total; // 0 → 1
    return (Math.sin(t * TAU - Math.PI / 2) + 1) / 2; // smooth 0→1→0
};

// ─── Sub-components ────────────────────────────────────────────────────

/** Animated hexagonal grid with pulsing edges */
const HexGrid: React.FC<{
    width: number;
    height: number;
    frame: number;
    total: number;
}> = ({ width, height, frame, total }) => {
    const hexR = 52;
    const hexW = hexR * 2;
    const hexH = Math.sqrt(3) * hexR;
    const cols = Math.ceil(width / (hexW * 0.75)) + 2;
    const rows = Math.ceil(height / hexH) + 2;
    const t = loop01(frame, total);

    const hexPath = (cx: number, cy: number) => {
        const pts = Array.from({ length: 6 })
            .map((_, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                return `${cx + hexR * Math.cos(angle)},${cy + hexR * Math.sin(angle)}`;
            })
            .join(' ');
        return pts;
    };

    const hexagons: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = c * hexW * 0.75;
            const cy = r * hexH + (c % 2 === 1 ? hexH / 2 : 0);
            const dist = Math.sqrt(
                Math.pow(cx - width / 2, 2) + Math.pow(cy - height / 2, 2)
            );
            const maxDist = Math.sqrt(width * width + height * height) / 2;
            const normDist = dist / maxDist;

            // Phase offset based on distance for wave effect
            const phase = normDist * 4;
            const wave = (Math.sin(t * TAU * 2 + phase) + 1) / 2;
            const opacity = 0.04 + wave * 0.18;

            // Color shifts based on position
            const hue = (normDist * 180 + frame * 0.5) % 360;
            const sat = 70 + wave * 30;
            const light = 50 + wave * 20;

            hexagons.push(
                <polygon
                    key={`hex-${r}-${c}`}
                    points={hexPath(cx, cy)}
                    fill="none"
                    stroke={`hsla(${hue}, ${sat}%, ${light}%, ${opacity})`}
                    strokeWidth={1 + wave * 1.5}
                />
            );
        }
    }

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            {hexagons}
        </svg>
    );
};

/** Flowing data streams — vertical lines of "code" */
const DataStreams: React.FC<{
    width: number;
    height: number;
    frame: number;
    total: number;
}> = ({ width, height, frame, total }) => {
    const streamCount = 18;
    const t = loop01(frame, total);

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            <defs>
                {Array.from({ length: streamCount }).map((_, i) => {
                    const hue = (i * 25 + 160) % 360;
                    return (
                        <linearGradient
                            key={`sg-${i}`}
                            id={`streamGrad-${i}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor={`hsla(${hue}, 90%, 60%, 0)`}
                            />
                            <stop
                                offset="30%"
                                stopColor={`hsla(${hue}, 90%, 60%, 0.6)`}
                            />
                            <stop
                                offset="70%"
                                stopColor={`hsla(${hue}, 90%, 70%, 0.6)`}
                            />
                            <stop
                                offset="100%"
                                stopColor={`hsla(${hue}, 90%, 70%, 0)`}
                            />
                        </linearGradient>
                    );
                })}
            </defs>
            {Array.from({ length: streamCount }).map((_, i) => {
                const x = seededRandom(i * 7.3) * width;
                const speed = 1.5 + seededRandom(i * 3.1) * 3;
                const yOffset = ((frame * speed + seededRandom(i * 11) * height) % (height + 400)) - 200;
                const streamH = 150 + seededRandom(i * 5.7) * 250;
                const opacity = 0.3 + t * 0.4;
                return (
                    <rect
                        key={`stream-${i}`}
                        x={x}
                        y={yOffset}
                        width={2}
                        height={streamH}
                        fill={`url(#streamGrad-${i})`}
                        opacity={opacity}
                        rx={1}
                    />
                );
            })}
        </svg>
    );
};

/** Orbiting particles with trails */
const OrbitParticles: React.FC<{
    width: number;
    height: number;
    frame: number;
    total: number;
}> = ({ width, height, frame, total }) => {
    const cx = width / 2;
    const cy = height / 2;
    const particleCount = 40;
    const t = loop01(frame, total);

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            <defs>
                <filter id="particleGlow">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {Array.from({ length: particleCount }).map((_, i) => {
                const orbitR = 200 + seededRandom(i * 2.3) * 600;
                const speed = 0.3 + seededRandom(i * 4.1) * 0.8;
                const angle = (frame * speed * TAU) / total + seededRandom(i * 9.7) * TAU;
                const px = cx + Math.cos(angle) * orbitR;
                const py = cy + Math.sin(angle) * orbitR * 0.6; // elliptical
                const size = 2 + seededRandom(i * 6.3) * 4;
                const hue = (i * 9 + frame * 0.3) % 360;
                const opacity = 0.4 + t * 0.5;

                // Trail (3 previous positions)
                const trails: React.ReactNode[] = [];
                for (let t2 = 1; t2 <= 3; t2++) {
                    const prevAngle = angle - (t2 * 0.05 * TAU * speed);
                    const tx = cx + Math.cos(prevAngle) * orbitR;
                    const ty = cy + Math.sin(prevAngle) * orbitR * 0.6;
                    trails.push(
                        <circle
                            key={`trail-${i}-${t2}`}
                            cx={tx}
                            cy={ty}
                            r={size * (1 - t2 * 0.2)}
                            fill={`hsla(${hue}, 80%, 60%, ${0.15 / t2})`}
                        />
                    );
                }

                return (
                    <g key={`particle-${i}`} filter="url(#particleGlow)">
                        {trails}
                        <circle
                            cx={px}
                            cy={py}
                            r={size}
                            fill={`hsla(${hue}, 85%, 65%, ${opacity})`}
                        />
                    </g>
                );
            })}
        </svg>
    );
};

/** Pulsing concentric rings */
const ConcentricRings: React.FC<{
    width: number;
    height: number;
    frame: number;
    total: number;
}> = ({ width, height, frame, total }) => {
    const cx = width / 2;
    const cy = height / 2;
    const ringCount = 8;
    const t = loop01(frame, total);

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            {Array.from({ length: ringCount }).map((_, i) => {
                const baseR = 100 + i * 120;
                const pulseR = baseR + Math.sin(t * TAU + i * 0.5) * 30;
                const hue = (i * 40 + 180) % 360;
                const opacity = 0.08 + (Math.sin(t * TAU + i * 0.8) + 1) * 0.06;
                const dashLen = 20 + i * 5;
                const dashOffset = frame * (0.5 + i * 0.1);

                return (
                    <circle
                        key={`ring-${i}`}
                        cx={cx}
                        cy={cy}
                        r={pulseR}
                        fill="none"
                        stroke={`hsla(${hue}, 80%, 60%, ${opacity})`}
                        strokeWidth={1.5}
                        strokeDasharray={`${dashLen} ${dashLen * 1.5}`}
                        strokeDashoffset={dashOffset}
                    />
                );
            })}
        </svg>
    );
};

/** Floating circuit-board traces */
const CircuitTraces: React.FC<{
    width: number;
    height: number;
    frame: number;
    total: number;
}> = ({ width, height, frame, total }) => {
    const traceCount = 12;
    const t = loop01(frame, total);

    const traces: React.ReactNode[] = [];
    for (let i = 0; i < traceCount; i++) {
        const startX = seededRandom(i * 13.7) * width;
        const startY = seededRandom(i * 17.3) * height;
        const segments = 4 + Math.floor(seededRandom(i * 23.1) * 4);
        let d = `M ${startX} ${startY}`;
        let x = startX;
        let y = startY;

        for (let s = 0; s < segments; s++) {
            const isHoriz = s % 2 === 0;
            const len = 40 + seededRandom(i * 31 + s * 7) * 120;
            const dir = seededRandom(i * 41 + s * 11) > 0.5 ? 1 : -1;
            if (isHoriz) {
                x += len * dir;
            } else {
                y += len * dir;
            }
            d += ` L ${x} ${y}`;
        }

        const hue = (i * 30 + 120) % 360;
        const pathLen = 800;
        const drawProgress = (t + seededRandom(i * 19)) % 1;
        const dashOffset = pathLen * (1 - drawProgress);

        traces.push(
            <path
                key={`trace-${i}`}
                d={d}
                fill="none"
                stroke={`hsla(${hue}, 70%, 55%, ${0.12 + t * 0.1})`}
                strokeWidth={1}
                strokeDasharray={pathLen}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
            />
        );

        // Node at end of trace
        traces.push(
            <circle
                key={`traceNode-${i}`}
                cx={x}
                cy={y}
                r={3 + Math.sin(t * TAU + i) * 2}
                fill={`hsla(${hue}, 80%, 60%, ${0.3 + t * 0.3})`}
            />
        );
    }

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            {traces}
        </svg>
    );
};

/** Central holographic core */
const HoloCore: React.FC<{
    width: number;
    height: number;
    frame: number;
    total: number;
}> = ({ width, height, frame, total }) => {
    const cx = width / 2;
    const cy = height / 2;
    const t = loop01(frame, total);
    const coreR = 60 + t * 20;
    const hue = (frame * 0.8) % 360;

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop
                        offset="0%"
                        stopColor={`hsla(${hue}, 90%, 70%, ${0.4 + t * 0.3})`}
                    />
                    <stop
                        offset="50%"
                        stopColor={`hsla(${(hue + 60) % 360}, 80%, 50%, ${0.15 + t * 0.1})`}
                    />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="coreBlur">
                    <feGaussianBlur stdDeviation="20" />
                </filter>
            </defs>
            {/* Outer glow */}
            <circle
                cx={cx}
                cy={cy}
                r={coreR * 3}
                fill="url(#coreGlow)"
                filter="url(#coreBlur)"
            />
            {/* Inner diamond */}
            <polygon
                points={`${cx},${cy - coreR} ${cx + coreR * 0.7},${cy} ${cx},${cy + coreR} ${cx - coreR * 0.7},${cy}`}
                fill={`hsla(${hue}, 85%, 60%, ${0.15 + t * 0.15})`}
                stroke={`hsla(${hue}, 90%, 70%, ${0.5 + t * 0.3})`}
                strokeWidth={1.5}
            />
            {/* Rotating inner ring */}
            <circle
                cx={cx}
                cy={cy}
                r={coreR * 0.5}
                fill="none"
                stroke={`hsla(${(hue + 120) % 360}, 80%, 65%, ${0.3 + t * 0.2})`}
                strokeWidth={1}
                strokeDasharray="8 12"
                strokeDashoffset={frame * 2}
            />
        </svg>
    );
};

// ─── Main Composition ──────────────────────────────────────────────────
export const TechNexus: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height, durationInFrames } = useVideoConfig();

    // Global color cycle
    const globalHue = (frame * 0.3) % 360;

    return (
        <AbsoluteFill
            style={{
                background: `radial-gradient(ellipse at 50% 50%, 
                    hsl(${globalHue}, 30%, 8%) 0%, 
                    hsl(${(globalHue + 40) % 360}, 40%, 4%) 60%, 
                    #020208 100%)`,
            }}
        >
            {/* Layer 1: Hex grid */}
            <HexGrid
                width={width}
                height={height}
                frame={frame}
                total={durationInFrames}
            />

            {/* Layer 2: Circuit traces */}
            <CircuitTraces
                width={width}
                height={height}
                frame={frame}
                total={durationInFrames}
            />

            {/* Layer 3: Data streams */}
            <DataStreams
                width={width}
                height={height}
                frame={frame}
                total={durationInFrames}
            />

            {/* Layer 4: Concentric rings */}
            <ConcentricRings
                width={width}
                height={height}
                frame={frame}
                total={durationInFrames}
            />

            {/* Layer 5: Orbit particles */}
            <OrbitParticles
                width={width}
                height={height}
                frame={frame}
                total={durationInFrames}
            />

            {/* Layer 6: Central holographic core */}
            <HoloCore
                width={width}
                height={height}
                frame={frame}
                total={durationInFrames}
            />

            {/* Ambient color wash overlay */}
            <AbsoluteFill
                style={{
                    background: `linear-gradient(
                        ${frame * 0.5}deg,
                        hsla(${globalHue}, 60%, 40%, 0.04),
                        hsla(${(globalHue + 120) % 360}, 60%, 40%, 0.04),
                        hsla(${(globalHue + 240) % 360}, 60%, 40%, 0.04)
                    )`,
                    mixBlendMode: 'screen',
                }}
            />

            {/* Vignette */}
            <AbsoluteFill
                style={{
                    background:
                        'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
                    pointerEvents: 'none',
                }}
            />
        </AbsoluteFill>
    );
};

export default TechNexus;
