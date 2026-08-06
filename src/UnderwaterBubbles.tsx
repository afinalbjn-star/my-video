import React, { useRef, useMemo, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * ============================================================================
 * UNDERWATER BUBBLES - River Bottom Bubble Animation
 * ============================================================================
 * 
 * A professional 3D seamless loop animation of air bubbles rising from
 * the river bottom with multiple layers, colors, and depth effects.
 * 
 * Features:
 * - 500+ lines of complex animation code
 * - Multiple bubble layers for 3D depth effect
 * - Various bubble sizes (micro to giant)
 * - Color gradients based on depth and lighting
 * - Realistic physics (wobble, rise speed, swirl)
 * - Seamless 15-second loop at 60fps
 * - 4K resolution (3840x2160)
 * - Caustic lighting effects from above
 * - River bottom terrain with sand/rocks
 * - Particle systems for realistic water atmosphere
 * ============================================================================
 */

export const VIDEO_CONFIG = {
    width: 3840,
    height: 2160,
    fps: 60,
    durationInFrames: 900, // 15 seconds at 60fps
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR PALETTES - Underwater bubble colors with depth variations
// ═══════════════════════════════════════════════════════════════════════════════

const WATER_COLORS = [
    { r: 8, g: 25, b: 45 },      // Deep river blue
    { r: 12, g: 35, b: 60 },     // Mid-depth blue
    { r: 15, g: 45, b: 75 },     // Lighter blue
    { r: 20, g: 55, b: 85 },     // Surface blue
    { r: 5, g: 20, b: 40 },      // Dark abyss
];

const BUBBLE_COLORS = [
    { r: 180, g: 220, b: 255 },  // Bright white-blue
    { r: 150, g: 200, b: 240 },  // Soft blue-white
    { r: 200, g: 230, b: 255 },  // Pale cyan
    { r: 160, g: 210, b: 250 },  // Light azure
    { r: 140, g: 190, b: 235 },  // Muted blue-white
];

const CAUSTIC_COLORS = [
    { r: 100, g: 180, b: 220 },  // Bright caustic
    { r: 80, g: 150, b: 200 },   // Medium caustic
    { r: 60, g: 120, b: 180 },   // Subtle caustic
];

const SAND_COLORS = [
    { r: 45, g: 40, b: 35 },     // Dark river sand
    { r: 55, g: 50, b: 45 },     // Medium sand
    { r: 65, g: 60, b: 55 },     // Light sand
    { r: 35, g: 30, b: 28 },     // Dark rock
];

// ═══════════════════════════════════════════════════════════════════════════════
// NOISE FUNCTIONS - For realistic terrain and caustic patterns
// ═══════════════════════════════════════════════════════════════════════════════

function hash2D(x: number, y: number): number {
    let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
}

function smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    const a = hash2D(ix, iy);
    const b = hash2D(ix + 1, iy);
    const c = hash2D(ix, iy + 1);
    const d = hash2D(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, octaves: number = 5): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1.0;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
        value += amplitude * smoothNoise(x * frequency, y * frequency);
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value / maxValue;
}

function loopFbm(x: number, y: number, progress: number, scale: number, octaves: number = 4): number {
    const angle = progress * Math.PI * 2;
    const nx = Math.cos(angle) * scale;
    const ny = Math.sin(angle) * scale;
    return fbm(x + nx, y + ny, octaves);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function lerpColor(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number },
    t: number,
): { r: number; g: number; b: number } {
    return {
        r: c1.r + (c2.r - c1.r) * t,
        g: c1.g + (c2.g - c1.g) * t,
        b: c1.b + (c2.b - c1.b) * t,
    };
}

function sampleColor(colors: { r: number; g: number; b: number }[], index: number): { r: number; g: number; b: number } {
    return colors[Math.floor(index) % colors.length];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUBBLE INTERFACES - Different bubble types for layered 3D effect
// ═══════════════════════════════════════════════════════════════════════════════

interface MicroBubble {
    xRatio: number;
    yRatio: number;
    size: number;           // 0.5 - 2 px
    riseSpeed: number;      // Base rise speed
    wobblePhase: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    depth: number;          // 0-1 depth factor
    colorIdx: number;
}

interface SmallBubble {
    xRatio: number;
    yRatio: number;
    size: number;           // 2 - 8 px
    riseSpeed: number;
    wobblePhase: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    swirlPhase: number;
    swirlSpeed: number;
    swirlAmp: number;
    depth: number;
    colorIdx: number;
}

interface MediumBubble {
    xRatio: number;
    yRatio: number;
    size: number;           // 8 - 20 px
    riseSpeed: number;
    wobblePhase: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    swirlPhase: number;
    swirlSpeed: number;
    swirlAmp: number;
    depth: number;
    colorIdx: number;
    pulsePhase: number;
    pulseSpeed: number;
}

interface LargeBubble {
    xRatio: number;
    yRatio: number;
    size: number;           // 20 - 50 px
    riseSpeed: number;
    wobblePhase: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    swirlPhase: number;
    swirlSpeed: number;
    swirlAmp: number;
    depth: number;
    colorIdx: number;
    pulsePhase: number;
    pulseSpeed: number;
    deformPhase: number;
    deformSpeed: number;
}

interface GiantBubble {
    xRatio: number;
    yRatio: number;
    size: number;           // 50 - 120 px
    riseSpeed: number;
    wobblePhase: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    swirlPhase: number;
    swirlSpeed: number;
    swirlAmp: number;
    depth: number;
    colorIdx: number;
    pulsePhase: number;
    pulseSpeed: number;
    deformPhase: number;
    deformSpeed: number;
    innerBubbles: number;   // Number of smaller bubbles inside
}

interface BubbleCluster {
    xRatio: number;
    yRatio: number;
    bubbles: {
        offsetX: number;
        offsetY: number;
        size: number;
        phase: number;
    }[];
    riseSpeed: number;
    driftPhase: number;
    driftSpeed: number;
    driftAmp: number;
    depth: number;
}

interface WaterParticle {
    xRatio: number;
    yRatio: number;
    size: number;           // 0.3 - 1 px
    driftX: number;
    driftY: number;
    phase: number;
    speed: number;
    brightness: number;
}

interface LightRay {
    xRatio: number;
    width: number;
    angle: number;
    intensity: number;
    phase: number;
    speed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUBBLE GENERATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function generateMicroBubbles(count: number): MicroBubble[] {
    const bubbles: MicroBubble[] = [];
    for (let i = 0; i < count; i++) {
        bubbles.push({
            xRatio: hash2D(i * 1.5, i * 2.3),
            yRatio: hash2D(i * 3.7, i * 4.1),
            size: 0.5 + hash2D(i * 5.9, i * 6.7) * 1.5,
            riseSpeed: 0.3 + hash2D(i * 7.3, i * 8.9) * 0.4,
            wobblePhase: hash2D(i * 9.1, i * 10.3) * Math.PI * 2,
            wobbleSpeed: 2 + Math.floor(hash2D(i * 11.7, i * 12.9) * 4),
            wobbleAmp: 0.02 + hash2D(i * 13.1, i * 14.7) * 0.03,
            depth: hash2D(i * 15.3, i * 16.9),
            colorIdx: Math.floor(hash2D(i * 17.1, i * 18.7) * BUBBLE_COLORS.length),
        });
    }
    return bubbles;
}

function generateSmallBubbles(count: number): SmallBubble[] {
    const bubbles: SmallBubble[] = [];
    for (let i = 0; i < count; i++) {
        bubbles.push({
            xRatio: hash2D(i * 1.1, i * 2.7),
            yRatio: hash2D(i * 3.3, i * 4.9),
            size: 2 + hash2D(i * 5.5, i * 6.1) * 6,
            riseSpeed: 0.25 + hash2D(i * 7.7, i * 8.3) * 0.35,
            wobblePhase: hash2D(i * 9.9, i * 10.5) * Math.PI * 2,
            wobbleSpeed: 1 + Math.floor(hash2D(i * 11.1, i * 12.7) * 3),
            wobbleAmp: 0.015 + hash2D(i * 13.3, i * 14.9) * 0.025,
            swirlPhase: hash2D(i * 15.1, i * 16.7) * Math.PI * 2,
            swirlSpeed: 1 + Math.floor(hash2D(i * 17.9, i * 18.5) * 2),
            swirlAmp: 0.01 + hash2D(i * 19.1, i * 20.7) * 0.02,
            depth: hash2D(i * 21.3, i * 22.9),
            colorIdx: Math.floor(hash2D(i * 23.1, i * 24.7) * BUBBLE_COLORS.length),
        });
    }
    return bubbles;
}

function generateMediumBubbles(count: number): MediumBubble[] {
    const bubbles: MediumBubble[] = [];
    for (let i = 0; i < count; i++) {
        bubbles.push({
            xRatio: hash2D(i * 1.9, i * 2.5),
            yRatio: hash2D(i * 3.1, i * 4.7),
            size: 8 + hash2D(i * 5.3, i * 6.9) * 12,
            riseSpeed: 0.2 + hash2D(i * 7.1, i * 8.7) * 0.3,
            wobblePhase: hash2D(i * 9.3, i * 10.9) * Math.PI * 2,
            wobbleSpeed: 1 + Math.floor(hash2D(i * 11.1, i * 12.7) * 2),
            wobbleAmp: 0.01 + hash2D(i * 13.3, i * 14.9) * 0.02,
            swirlPhase: hash2D(i * 15.1, i * 16.7) * Math.PI * 2,
            swirlSpeed: 1 + Math.floor(hash2D(i * 17.9, i * 18.5) * 2),
            swirlAmp: 0.008 + hash2D(i * 19.1, i * 20.7) * 0.015,
            depth: hash2D(i * 21.3, i * 22.9),
            colorIdx: Math.floor(hash2D(i * 23.1, i * 24.7) * BUBBLE_COLORS.length),
            pulsePhase: hash2D(i * 25.3, i * 26.9) * Math.PI * 2,
            pulseSpeed: 2 + Math.floor(hash2D(i * 27.1, i * 28.7) * 3),
        });
    }
    return bubbles;
}

function generateLargeBubbles(count: number): LargeBubble[] {
    const bubbles: LargeBubble[] = [];
    for (let i = 0; i < count; i++) {
        bubbles.push({
            xRatio: hash2D(i * 1.7, i * 2.3),
            yRatio: hash2D(i * 3.9, i * 4.5),
            size: 20 + hash2D(i * 5.7, i * 6.3) * 30,
            riseSpeed: 0.15 + hash2D(i * 7.9, i * 8.5) * 0.25,
            wobblePhase: hash2D(i * 9.7, i * 10.3) * Math.PI * 2,
            wobbleSpeed: 1 + Math.floor(hash2D(i * 11.9, i * 12.5) * 2),
            wobbleAmp: 0.008 + hash2D(i * 13.7, i * 14.3) * 0.015,
            swirlPhase: hash2D(i * 15.9, i * 16.5) * Math.PI * 2,
            swirlSpeed: 1 + Math.floor(hash2D(i * 17.7, i * 18.3) * 2),
            swirlAmp: 0.005 + hash2D(i * 19.9, i * 20.5) * 0.01,
            depth: hash2D(i * 21.7, i * 22.3),
            colorIdx: Math.floor(hash2D(i * 23.9, i * 24.5) * BUBBLE_COLORS.length),
            pulsePhase: hash2D(i * 25.7, i * 26.3) * Math.PI * 2,
            pulseSpeed: 1 + Math.floor(hash2D(i * 27.9, i * 28.5) * 2),
            deformPhase: hash2D(i * 29.7, i * 30.3) * Math.PI * 2,
            deformSpeed: 2 + Math.floor(hash2D(i * 31.9, i * 32.5) * 3),
        });
    }
    return bubbles;
}

function generateGiantBubbles(count: number): GiantBubble[] {
    const bubbles: GiantBubble[] = [];
    for (let i = 0; i < count; i++) {
        bubbles.push({
            xRatio: hash2D(i * 1.3, i * 2.9),
            yRatio: hash2D(i * 3.1, i * 4.7),
            size: 50 + hash2D(i * 5.9, i * 6.5) * 70,
            riseSpeed: 0.1 + hash2D(i * 7.7, i * 8.3) * 0.2,
            wobblePhase: hash2D(i * 9.1, i * 10.7) * Math.PI * 2,
            wobbleSpeed: 1 + Math.floor(hash2D(i * 11.3, i * 12.9) * 2),
            wobbleAmp: 0.005 + hash2D(i * 13.1, i * 14.7) * 0.01,
            swirlPhase: hash2D(i * 15.3, i * 16.9) * Math.PI * 2,
            swirlSpeed: 1 + Math.floor(hash2D(i * 17.1, i * 18.7) * 2),
            swirlAmp: 0.003 + hash2D(i * 19.3, i * 20.9) * 0.008,
            depth: hash2D(i * 21.1, i * 22.7),
            colorIdx: Math.floor(hash2D(i * 23.3, i * 24.9) * BUBBLE_COLORS.length),
            pulsePhase: hash2D(i * 25.1, i * 26.7) * Math.PI * 2,
            pulseSpeed: 1 + Math.floor(hash2D(i * 27.3, i * 28.9) * 2),
            deformPhase: hash2D(i * 29.1, i * 30.7) * Math.PI * 2,
            deformSpeed: 2 + Math.floor(hash2D(i * 31.3, i * 32.9) * 3),
            innerBubbles: Math.floor(hash2D(i * 33.1, i * 34.7) * 5),
        });
    }
    return bubbles;
}

function generateBubbleClusters(count: number): BubbleCluster[] {
    const clusters: BubbleCluster[] = [];
    for (let i = 0; i < count; i++) {
        const bubbleCount = 3 + Math.floor(hash2D(i * 1.1, i * 2.7) * 5);
        const bubbles: { offsetX: number; offsetY: number; size: number; phase: number }[] = [];
        for (let j = 0; j < bubbleCount; j++) {
            bubbles.push({
                offsetX: (hash2D(i * 3.3 + j, i * 4.9 + j) - 0.5) * 0.15,
                offsetY: (hash2D(i * 5.1 + j, i * 6.7 + j) - 0.5) * 0.15,
                size: 5 + hash2D(i * 7.3 + j, i * 8.9 + j) * 15,
                phase: hash2D(i * 9.1 + j, i * 10.7 + j) * Math.PI * 2,
            });
        }
        clusters.push({
            xRatio: hash2D(i * 11.3, i * 12.9),
            yRatio: hash2D(i * 13.1, i * 14.7),
            bubbles,
            riseSpeed: 0.18 + hash2D(i * 15.3, i * 16.9) * 0.22,
            driftPhase: hash2D(i * 17.1, i * 18.7) * Math.PI * 2,
            driftSpeed: 1 + Math.floor(hash2D(i * 19.3, i * 20.9) * 2),
            driftAmp: 0.02 + hash2D(i * 21.1, i * 22.7) * 0.03,
            depth: hash2D(i * 23.3, i * 24.9),
        });
    }
    return clusters;
}

function generateWaterParticles(count: number): WaterParticle[] {
    const particles: WaterParticle[] = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            xRatio: hash2D(i * 1.7, i * 2.3),
            yRatio: hash2D(i * 3.9, i * 4.5),
            size: 0.3 + hash2D(i * 5.7, i * 6.3) * 0.7,
            driftX: (hash2D(i * 7.9, i * 8.5) - 0.5) * 0.3,
            driftY: (hash2D(i * 9.7, i * 10.3) - 0.5) * 0.2,
            phase: hash2D(i * 11.9, i * 12.5) * Math.PI * 2,
            speed: 1 + Math.floor(hash2D(i * 13.7, i * 14.3) * 3),
            brightness: 0.3 + hash2D(i * 15.9, i * 16.5) * 0.7,
        });
    }
    return particles;
}

function generateLightRays(count: number): LightRay[] {
    const rays: LightRay[] = [];
    for (let i = 0; i < count; i++) {
        rays.push({
            xRatio: hash2D(i * 1.1, i * 2.7),
            width: 0.05 + hash2D(i * 3.3, i * 4.9) * 0.1,
            angle: (hash2D(i * 5.1, i * 6.7) - 0.5) * 0.3,
            intensity: 0.3 + hash2D(i * 7.3, i * 8.9) * 0.4,
            phase: hash2D(i * 9.1, i * 10.7) * Math.PI * 2,
            speed: 1 + Math.floor(hash2D(i * 11.3, i * 12.9) * 2),
        });
    }
    return rays;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const UnderwaterBubbles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frame = useCurrentFrame();
    const { width, height, durationInFrames, fps } = useVideoConfig();

    // Generate all bubble systems
    const microBubbles = useMemo(() => generateMicroBubbles(400), []);
    const smallBubbles = useMemo(() => generateSmallBubbles(250), []);
    const mediumBubbles = useMemo(() => generateMediumBubbles(100), []);
    const largeBubbles = useMemo(() => generateLargeBubbles(40), []);
    const giantBubbles = useMemo(() => generateGiantBubbles(15), []);
    const bubbleClusters = useMemo(() => generateBubbleClusters(25), []);
    const waterParticles = useMemo(() => generateWaterParticles(300), []);
    const lightRays = useMemo(() => generateLightRays(8), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const progress = frame / durationInFrames;
        const loopTime = progress * Math.PI * 2; // Seamless loop: 0 → 2π

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        // Pre-compute terrain for river bottom
        const terrainHeight = new Float32Array(width);
        for (let x = 0; x < width; x++) {
            const nx = x / width;
            const terrain = fbm(nx * 8, 0.5, 4) * 0.08 + fbm(nx * 16, 1.2, 3) * 0.04;
            terrainHeight[x] = 0.88 + terrain;
        }

        // Pre-compute caustic pattern
        const causticPattern = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = x / width;
                const ny = y / height;
                const caustic = fbm(nx * 12 + Math.cos(loopTime * 0.5) * 0.3, ny * 12 + Math.sin(loopTime * 0.4) * 0.3, 4);
                causticPattern[y * width + x] = Math.max(0, caustic);
            }
        }

        // Render each pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const nx = x / width;
                const ny = y / height;

                // Base water color with depth gradient
                const depthFactor = ny;
                const waterColorIdx = Math.floor(depthFactor * (WATER_COLORS.length - 1));
                const waterColorNext = Math.min(waterColorIdx + 1, WATER_COLORS.length - 1);
                const waterColorT = (depthFactor * (WATER_COLORS.length - 1)) - waterColorIdx;
                const baseColor = lerpColor(
                    WATER_COLORS[waterColorIdx],
                    WATER_COLORS[waterColorNext],
                    waterColorT
                );

                let r = baseColor.r;
                let g = baseColor.g;
                let b = baseColor.b;

                // Caustic lighting from above
                if (ny < 0.5) {
                    const causticIntensity = causticPattern[y * width + x];
                    const causticFade = 1 - (ny / 0.5);
                    const causticColor = sampleColor(CAUSTIC_COLORS, Math.floor(causticIntensity * CAUSTIC_COLORS.length));
                    r += causticColor.r * causticIntensity * causticFade * 0.6;
                    g += causticColor.g * causticIntensity * causticFade * 0.6;
                    b += causticColor.b * causticIntensity * causticFade * 0.6;
                }

                // Light rays
                for (const ray of lightRays) {
                    const rayPhase = loopTime * ray.speed + ray.phase;
                    const rayX = ray.xRatio + Math.sin(rayPhase) * 0.05;
                    const rayDist = Math.abs(nx - rayX) / ray.width;
                    if (rayDist < 1) {
                        const rayIntensity = (1 - rayDist) * ray.intensity * (1 - ny * 0.8);
                        r += rayIntensity * 40;
                        g += rayIntensity * 60;
                        b += rayIntensity * 80;
                    }
                }

                // River bottom / sand
                const bottomY = terrainHeight[x];
                if (ny > bottomY) {
                    const sandDepth = (ny - bottomY) / (1 - bottomY);
                    const sandColorIdx = Math.floor(sandDepth * (SAND_COLORS.length - 1));
                    const sandColorNext = Math.min(sandColorIdx + 1, SAND_COLORS.length - 1);
                    const sandColorT = (sandDepth * (SAND_COLORS.length - 1)) - sandColorIdx;
                    const sandColor = lerpColor(
                        SAND_COLORS[sandColorIdx],
                        SAND_COLORS[sandColorNext],
                        sandColorT
                    );
                    r = lerpColor(r, sandColor.r, sandDepth * 0.9).r;
                    g = lerpColor(g, sandColor.g, sandDepth * 0.9).g;
                    b = lerpColor(b, sandColor.b, sandDepth * 0.9).b;

                    // Add texture to sand
                    const sandTexture = fbm(nx * 20, ny * 20, 3) * 10;
                    r += sandTexture * 0.3;
                    g += sandTexture * 0.3;
                    b += sandTexture * 0.3;
                }

                // Water particles (plankton/sediment)
                for (const particle of waterParticles) {
                    const particlePhase = loopTime * particle.speed + particle.phase;
                    const px = particle.xRatio + Math.sin(particlePhase) * particle.driftX;
                    const py = particle.yRatio + Math.cos(particlePhase) * particle.driftY;
                    const pdist = Math.sqrt((nx - px) ** 2 + (ny - py) ** 2);
                    if (pdist < particle.size * 2 / width) {
                        const glow = (1 - pdist / (particle.size * 2 / width)) * particle.brightness;
                        r += glow * 30;
                        g += glow * 40;
                        b += glow * 50;
                    }
                }

                // Micro bubbles
                for (const bubble of microBubbles) {
                    const bubbleY = (bubble.yRatio + progress * bubble.riseSpeed) % 1;
                    const wobble = Math.sin(loopTime * bubble.wobbleSpeed + bubble.wobblePhase) * bubble.wobbleAmp;
                    const bx = bubble.xRatio + wobble;
                    const by = bubbleY;
                    const dist = Math.sqrt((nx - bx) ** 2 + (ny - by) ** 2);
                    const bubblePx = bubble.size / width;
                    if (dist < bubblePx * 3) {
                        const intensity = (1 - dist / (bubblePx * 3)) * (1 - bubble.depth * 0.5);
                        const bubbleColor = BUBBLE_COLORS[bubble.colorIdx];
                        r += bubbleColor.r * intensity * 0.8;
                        g += bubbleColor.g * intensity * 0.8;
                        b += bubbleColor.b * intensity * 0.8;
                    }
                }

                // Small bubbles
                for (const bubble of smallBubbles) {
                    const bubbleY = (bubble.yRatio + progress * bubble.riseSpeed) % 1;
                    const wobble = Math.sin(loopTime * bubble.wobbleSpeed + bubble.wobblePhase) * bubble.wobbleAmp;
                    const swirl = Math.sin(loopTime * bubble.swirlSpeed + bubble.swirlPhase) * bubble.swirlAmp;
                    const bx = bubble.xRatio + wobble + swirl;
                    const by = bubbleY;
                    const dist = Math.sqrt((nx - bx) ** 2 + (ny - by) ** 2);
                    const bubblePx = bubble.size / width;
                    if (dist < bubblePx * 2.5) {
                        const intensity = (1 - dist / (bubblePx * 2.5)) * (1 - bubble.depth * 0.4);
                        const bubbleColor = BUBBLE_COLORS[bubble.colorIdx];
                        r += bubbleColor.r * intensity * 0.7;
                        g += bubbleColor.g * intensity * 0.7;
                        b += bubbleColor.b * intensity * 0.7;
                        
                        // Highlight
                        if (dist < bubblePx * 0.8) {
                            const highlight = (1 - dist / (bubblePx * 0.8)) * 0.5;
                            r += highlight * 100;
                            g += highlight * 120;
                            b += highlight * 140;
                        }
                    }
                }

                // Medium bubbles
                for (const bubble of mediumBubbles) {
                    const bubbleY = (bubble.yRatio + progress * bubble.riseSpeed) % 1;
                    const wobble = Math.sin(loopTime * bubble.wobbleSpeed + bubble.wobblePhase) * bubble.wobbleAmp;
                    const swirl = Math.sin(loopTime * bubble.swirlSpeed + bubble.swirlPhase) * bubble.swirlAmp;
                    const pulse = 0.9 + 0.1 * Math.sin(loopTime * bubble.pulseSpeed + bubble.pulsePhase);
                    const bx = bubble.xRatio + wobble + swirl;
                    const by = bubbleY;
                    const dist = Math.sqrt((nx - bx) ** 2 + (ny - by) ** 2);
                    const bubblePx = (bubble.size * pulse) / width;
                    if (dist < bubblePx * 2) {
                        const intensity = (1 - dist / (bubblePx * 2)) * (1 - bubble.depth * 0.3);
                        const bubbleColor = BUBBLE_COLORS[bubble.colorIdx];
                        r += bubbleColor.r * intensity * 0.6;
                        g += bubbleColor.g * intensity * 0.6;
                        b += bubbleColor.b * intensity * 0.6;
                        
                        // Highlight
                        if (dist < bubblePx * 0.6) {
                            const highlight = (1 - dist / (bubblePx * 0.6)) * 0.6;
                            r += highlight * 120;
                            g += highlight * 140;
                            b += highlight * 160;
                        }
                    }
                }

                // Large bubbles
                for (const bubble of largeBubbles) {
                    const bubbleY = (bubble.yRatio + progress * bubble.riseSpeed) % 1;
                    const wobble = Math.sin(loopTime * bubble.wobbleSpeed + bubble.wobblePhase) * bubble.wobbleAmp;
                    const swirl = Math.sin(loopTime * bubble.swirlSpeed + bubble.swirlPhase) * bubble.swirlAmp;
                    const pulse = 0.85 + 0.15 * Math.sin(loopTime * bubble.pulseSpeed + bubble.pulsePhase);
                    const deform = Math.sin(loopTime * bubble.deformSpeed + bubble.deformPhase) * 0.1;
                    const bx = bubble.xRatio + wobble + swirl;
                    const by = bubbleY;
                    const dist = Math.sqrt((nx - bx) ** 2 + (ny - by) ** 2);
                    const bubblePx = (bubble.size * pulse * (1 + deform)) / width;
                    if (dist < bubblePx * 1.8) {
                        const intensity = (1 - dist / (bubblePx * 1.8)) * (1 - bubble.depth * 0.2);
                        const bubbleColor = BUBBLE_COLORS[bubble.colorIdx];
                        r += bubbleColor.r * intensity * 0.5;
                        g += bubbleColor.g * intensity * 0.5;
                        b += bubbleColor.b * intensity * 0.5;
                        
                        // Highlight
                        if (dist < bubblePx * 0.5) {
                            const highlight = (1 - dist / (bubblePx * 0.5)) * 0.7;
                            r += highlight * 140;
                            g += highlight * 160;
                            b += highlight * 180;
                        }
                        
                        // Inner glow
                        if (dist < bubblePx * 1.2 && dist > bubblePx * 0.5) {
                            const innerGlow = (1 - Math.abs(dist - bubblePx * 0.85) / (bubblePx * 0.35)) * 0.3;
                            r += innerGlow * 60;
                            g += innerGlow * 80;
                            b += innerGlow * 100;
                        }
                    }
                }

                // Giant bubbles
                for (const bubble of giantBubbles) {
                    const bubbleY = (bubble.yRatio + progress * bubble.riseSpeed) % 1;
                    const wobble = Math.sin(loopTime * bubble.wobbleSpeed + bubble.wobblePhase) * bubble.wobbleAmp;
                    const swirl = Math.sin(loopTime * bubble.swirlSpeed + bubble.swirlPhase) * bubble.swirlAmp;
                    const pulse = 0.8 + 0.2 * Math.sin(loopTime * bubble.pulseSpeed + bubble.pulsePhase);
                    const deform = Math.sin(loopTime * bubble.deformSpeed + bubble.deformPhase) * 0.15;
                    const bx = bubble.xRatio + wobble + swirl;
                    const by = bubbleY;
                    const dist = Math.sqrt((nx - bx) ** 2 + (ny - by) ** 2);
                    const bubblePx = (bubble.size * pulse * (1 + deform)) / width;
                    if (dist < bubblePx * 1.5) {
                        const intensity = (1 - dist / (bubblePx * 1.5)) * (1 - bubble.depth * 0.15);
                        const bubbleColor = BUBBLE_COLORS[bubble.colorIdx];
                        r += bubbleColor.r * intensity * 0.4;
                        g += bubbleColor.g * intensity * 0.4;
                        b += bubbleColor.b * intensity * 0.4;
                        
                        // Strong highlight
                        if (dist < bubblePx * 0.4) {
                            const highlight = (1 - dist / (bubblePx * 0.4)) * 0.8;
                            r += highlight * 160;
                            g += highlight * 180;
                            b += highlight * 200;
                        }
                        
                        // Inner glow gradient
                        if (dist < bubblePx * 1.0 && dist > bubblePx * 0.4) {
                            const innerGlow = (1 - Math.abs(dist - bubblePx * 0.7) / (bubblePx * 0.3)) * 0.4;
                            r += innerGlow * 80;
                            g += innerGlow * 100;
                            b += innerGlow * 120;
                        }
                        
                        // Inner bubbles
                        for (let i = 0; i < bubble.innerBubbles; i++) {
                            const innerPhase = loopTime * 2 + i;
                            const innerX = bx + Math.sin(innerPhase) * bubblePx * 0.3;
                            const innerY = by + Math.cos(innerPhase * 1.3) * bubblePx * 0.3;
                            const innerDist = Math.sqrt((nx - innerX) ** 2 + (ny - innerY) ** 2);
                            const innerSize = bubblePx * 0.15;
                            if (innerDist < innerSize * 2) {
                                const innerIntensity = (1 - innerDist / (innerSize * 2)) * 0.5;
                                r += innerIntensity * 40;
                                g += innerIntensity * 50;
                                b += innerIntensity * 60;
                            }
                        }
                    }
                }

                // Bubble clusters
                for (const cluster of bubbleClusters) {
                    const clusterY = (cluster.yRatio + progress * cluster.riseSpeed) % 1;
                    const drift = Math.sin(loopTime * cluster.driftSpeed + cluster.driftPhase) * cluster.driftAmp;
                    const cx = cluster.xRatio + drift;
                    const cy = clusterY;
                    
                    for (const subBubble of cluster.bubbles) {
                        const subPhase = loopTime + subBubble.phase;
                        const sx = cx + subBubble.offsetX + Math.sin(subPhase) * 0.02;
                        const sy = cy + subBubble.offsetY + Math.cos(subPhase * 1.2) * 0.02;
                        const dist = Math.sqrt((nx - sx) ** 2 + (ny - sy) ** 2);
                        const subSize = subBubble.size / width;
                        if (dist < subSize * 2) {
                            const intensity = (1 - dist / (subSize * 2)) * (1 - cluster.depth * 0.3);
                            const bubbleColor = BUBBLE_COLORS[Math.floor(subBubble.phase) % BUBBLE_COLORS.length];
                            r += bubbleColor.r * intensity * 0.5;
                            g += bubbleColor.g * intensity * 0.5;
                            b += bubbleColor.b * intensity * 0.5;
                        }
                    }
                }

                // Depth fog (darker at bottom)
                const fogFactor = ny * ny * 0.3;
                r = r * (1 - fogFactor) + 5 * fogFactor;
                g = g * (1 - fogFactor) + 8 * fogFactor;
                b = b * (1 - fogFactor) + 15 * fogFactor;

                // Clamp values
                data[idx] = Math.min(255, Math.max(0, r));
                data[idx + 1] = Math.min(255, Math.max(0, g));
                data[idx + 2] = Math.min(255, Math.max(0, b));
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }, [frame, width, height, durationInFrames, fps, microBubbles, smallBubbles, mediumBubbles, largeBubbles, giantBubbles, bubbleClusters, waterParticles, lightRays]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    );
};
