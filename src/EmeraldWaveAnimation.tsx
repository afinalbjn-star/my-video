import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

// === HELPERS ===
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Deterministic hash → [0,1]
const hash = (n: number) => {
    let x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
};

// 2D value noise (non-periodic by nature, but we'll sample it circularly for looping)
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

// Multi-octave noise
const fbm = (x: number, y: number, octaves: number = 5) => {
    let value = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < octaves; i++) {
        value += amp * noise2D(x * freq, y * freq);
        amp *= 0.5;
        freq *= 2;
    }
    return value;
};

// SEAMLESS noise: sample on a circle so t=0 and t=1 give same value
// Maps t ∈ [0,1] → (cx + R*cos(2πt), cy + R*sin(2πt)) in noise space
const seamlessNoise2D = (angle: number, cx: number, cy: number, R: number, octaves: number = 4) => {
    return fbm(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R, octaves);
};

export const EmeraldWaveAnimation: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height, durationInFrames } = useVideoConfig();

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // === Seamless loop time: t ∈ [0,1) with sin/cos → perfect loop ===
        const t = frame / durationInFrames;
        const T = t * Math.PI * 2; // 0 → 2π (all sin/cos(T) are periodic → seamless)
        const angle = t * Math.PI * 2; // Angle for seamlessNoise2D

        // === BACKGROUND: Deep dark pink gradient ===
        const bgGrad = ctx.createRadialGradient(
            width * 0.5 + Math.sin(T * 0.3) * 200,
            height * 0.5 + Math.cos(T * 0.4) * 150,
            0,
            width * 0.5, height * 0.5, width * 0.8
        );
        bgGrad.addColorStop(0, '#4d0a30'); // Lighter pink in the center
        bgGrad.addColorStop(0.4, '#330620'); // Medium dark pink
        bgGrad.addColorStop(1, '#1a0210'); // Deepest pink at the edges
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // === LAYER 0: Flowing noise field (SEAMLESS via circular sampling) ===
        for (let ny = 0; ny < height; ny += 14) {
            for (let nx = 0; nx < width; nx += 14) {
                const n = seamlessNoise2D(angle, nx * 0.002, ny * 0.002, 2, 4);
                const brightness = Math.floor(n * 25);
                ctx.fillStyle = `rgba(0, ${80 + brightness * 3}, ${40 + brightness * 2}, ${0.03 + n * 0.04})`;
                ctx.fillRect(nx, ny, 14, 14);
            }
        }

        // === LAYER 1: Major fluid wave surfaces (6 layers) ===
        // All waves use sin/cos(T * speed) → periodic → SEAMLESS
        const waveConfigs = [
            { amp: 180, f1: 4, f2: 7, f3: 11, f4: 17, spd: 1, yOff: 0.42, op: 0.85, r: 0, g: 220, b: 130 },
            { amp: 140, f1: 5, f2: 9, f3: 13, f4: 20, spd: 1.4, yOff: 0.38, op: 0.6, r: 0, g: 255, b: 160 },
            { amp: 100, f1: 6, f2: 11, f3: 16, f4: 23, spd: 1.8, yOff: 0.52, op: 0.5, r: 0, g: 180, b: 100 },
            { amp: 200, f1: 3, f2: 5, f3: 8, f4: 13, spd: 0.7, yOff: 0.58, op: 0.7, r: 10, g: 240, b: 140 },
            { amp: 90, f1: 8, f2: 13, f3: 21, f4: 34, spd: 2.2, yOff: 0.48, op: 0.35, r: 0, g: 200, b: 120 },
            { amp: 160, f1: 2, f2: 4, f3: 7, f4: 11, spd: 0.5, yOff: 0.65, op: 0.55, r: 5, g: 160, b: 90 },
        ];

        for (let wi = 0; wi < waveConfigs.length; wi++) {
            const w = waveConfigs[wi];
            ctx.save();
            ctx.globalCompositeOperation = wi < 2 ? 'lighter' : 'source-over';
            ctx.beginPath();
            ctx.moveTo(0, height);

            for (let x = 0; x <= width; x += 2) {
                const nx = x / width;
                // 4-octave wave → all sin/cos with T → SEAMLESS
                const waveBase =
                    Math.sin(nx * Math.PI * w.f1 + T * w.spd) * w.amp * 0.4 +
                    Math.sin(nx * Math.PI * w.f2 - T * w.spd * 0.7) * w.amp * 0.25 +
                    Math.cos(nx * Math.PI * w.f3 + T * w.spd * 1.3) * w.amp * 0.2 +
                    Math.sin(nx * Math.PI * w.f4 - T * w.spd * 0.4) * w.amp * 0.15;

                // SEAMLESS noise modulation via circular sampling
                const noiseMod = seamlessNoise2D(angle, nx * 3, w.yOff * 10 + wi * 7, 2, 3) * w.amp * 0.3;

                const y = height * w.yOff + waveBase + noiseMod;
                ctx.lineTo(x, y);
            }

            ctx.lineTo(width, height);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, height * (w.yOff - 0.2), 0, height);
            grad.addColorStop(0, `rgba(${w.r}, ${w.g}, ${w.b}, ${w.op})`);
            grad.addColorStop(0.3, `rgba(${w.r}, ${Math.floor(w.g * 0.8)}, ${Math.floor(w.b * 0.85)}, ${w.op * 0.7})`);
            grad.addColorStop(0.6, `rgba(${w.r}, ${Math.floor(w.g * 0.5)}, ${Math.floor(w.b * 0.6)}, ${w.op * 0.3})`);
            grad.addColorStop(1, `rgba(${w.r}, ${Math.floor(w.g * 0.2)}, ${Math.floor(w.b * 0.3)}, 0)`);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }

        // === LAYER 2: Wave crest highlights (SEAMLESS via sin/cos) ===
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let layer = 0; layer < 4; layer++) {
            ctx.beginPath();
            const crestOp = 0.15 + layer * 0.05;
            for (let x = 0; x <= width; x += 2) {
                const nx = x / width;
                const waveCrest =
                    Math.sin(nx * Math.PI * (4 + layer * 2) + T * (1 + layer * 0.3)) * (100 - layer * 15) +
                    Math.cos(nx * Math.PI * (7 + layer * 3) - T * (0.8 + layer * 0.2)) * (60 - layer * 10);
                const y = height * (0.4 + layer * 0.06) + waveCrest;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(100, 255, 200, ${crestOp})`;
            ctx.lineWidth = 2 + layer;
            ctx.shadowColor = 'rgba(0, 255, 160, 0.5)';
            ctx.shadowBlur = 15;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // === LAYER 3: Particle system — 3 tiers ===
        // All particles use sin/cos(T + seed) → SEAMLESS

        // Tier 1: Background dust (400 particles)
        for (let i = 0; i < 400; i++) {
            const seed = i * 137.508;
            const baseX = (hash(seed) * width * 1.2) - width * 0.1;
            const baseY = (hash(seed + 1) * height * 1.2) - height * 0.1;

            const driftX = Math.sin(T + hash(seed + 2) * Math.PI * 2) * (30 + hash(seed + 3) * 50);
            const driftY = Math.cos(T * 0.7 + hash(seed + 4) * Math.PI * 2) * (20 + hash(seed + 5) * 40);

            const px = baseX + driftX;
            const py = baseY + driftY;
            const size = 0.5 + hash(seed + 6) * 1.5;
            const opacity = 0.1 + hash(seed + 7) * 0.2 + Math.sin(T * 2 + seed) * 0.1;

            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.floor(hash(seed + 8) * 30)}, ${Math.floor(180 + hash(seed + 9) * 75)}, ${Math.floor(100 + hash(seed + 10) * 80)}, ${clamp(opacity, 0, 0.5)})`;
            ctx.fill();
        }

        // Tier 2: Mid-ground sparks (120 particles with orbit)
        for (let i = 0; i < 120; i++) {
            const seed = i * 237.7 + 1000;
            const baseX = hash(seed) * width;
            const baseY = hash(seed + 1) * height;

            const orbit = 50 + hash(seed + 2) * 100;
            const angle = T * (0.5 + hash(seed + 3)) + hash(seed + 4) * Math.PI * 2;
            const px = baseX + Math.cos(angle) * orbit;
            const py = baseY + Math.sin(angle) * orbit * 0.6;

            const size = 1.5 + Math.sin(T * 3 + seed) * 1;
            const opacity = 0.3 + Math.sin(T * 2 + hash(seed + 5) * Math.PI * 2) * 0.3;

            const sparkGrad = ctx.createRadialGradient(px, py, 0, px, py, size * 4);
            sparkGrad.addColorStop(0, `rgba(150, 255, 210, ${clamp(opacity, 0, 1)})`);
            sparkGrad.addColorStop(0.3, `rgba(0, 255, 160, ${clamp(opacity * 0.5, 0, 1)})`);
            sparkGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.arc(px, py, size * 4, 0, Math.PI * 2);
            ctx.fillStyle = sparkGrad;
            ctx.fill();
        }

        // Tier 3: Foreground orbs (25 glowing orbs)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 25; i++) {
            const seed = i * 311.3 + 5000;
            const baseX = hash(seed) * width;
            const baseY = hash(seed + 1) * height;

            const driftRadius = 80 + hash(seed + 2) * 200;
            const driftSpeed = 0.3 + hash(seed + 3) * 0.5;
            const driftAngle = T * driftSpeed + hash(seed + 4) * Math.PI * 2;

            const px = baseX + Math.cos(driftAngle) * driftRadius;
            const py = baseY + Math.sin(driftAngle * 0.7) * driftRadius * 0.5;

            const orbSize = 4 + hash(seed + 5) * 12;
            const pulse = 1 + Math.sin(T * 3 + seed) * 0.3;
            const finalSize = orbSize * pulse;
            const opacity = 0.15 + Math.sin(T + hash(seed + 6) * Math.PI * 2) * 0.15;

            const orbGrad = ctx.createRadialGradient(px, py, 0, px, py, finalSize * 3);
            orbGrad.addColorStop(0, `rgba(200, 255, 230, ${clamp(opacity * 1.5, 0, 1)})`);
            orbGrad.addColorStop(0.2, `rgba(0, 255, 180, ${clamp(opacity, 0, 1)})`);
            orbGrad.addColorStop(0.5, `rgba(0, 180, 100, ${clamp(opacity * 0.4, 0, 1)})`);
            orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.arc(px, py, finalSize * 3, 0, Math.PI * 2);
            ctx.fillStyle = orbGrad;
            ctx.fill();
        }
        ctx.restore();

        // === LAYER 4: Flowing energy ribbons (SEAMLESS noise) ===
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let r = 0; r < 8; r++) {
            ctx.beginPath();
            const ribbonY = height * (0.2 + r * 0.08);
            const ribbonAmp = 40 + r * 15;
            const ribbonFreq = 3 + r * 1.5;
            const ribbonSpeed = 0.8 + r * 0.15;
            const ribbonOp = 0.06 + (7 - r) * 0.015;

            for (let x = 0; x <= width; x += 3) {
                const nx = x / width;
                // SEAMLESS: circular noise sampling
                const noiseY = seamlessNoise2D(angle, nx * 4 + r * 3, r * 5, 2, 3) * ribbonAmp * 0.5;
                const waveY = Math.sin(nx * Math.PI * ribbonFreq + T * ribbonSpeed) * ribbonAmp + noiseY;
                const y = ribbonY + waveY;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.strokeStyle = `rgba(0, 255, 170, ${ribbonOp})`;
            ctx.lineWidth = 1.5 + r * 0.5;
            ctx.shadowColor = `rgba(0, 255, 160, ${ribbonOp * 2})`;
            ctx.shadowBlur = 20 + r * 5;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // === LAYER 5: Volumetric light rays (SEAMLESS via sin(T)) ===
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rayCount = 12;
        for (let i = 0; i < rayCount; i++) {
            const rayAngle = (i / rayCount) * Math.PI * 0.6 - Math.PI * 0.3;
            const sway = Math.sin(T * 0.3 + i * 0.7) * 0.05;
            const finalAngle = rayAngle + sway;

            const rayLength = height * 0.8;
            const startX = width * (0.3 + i * 0.04) + Math.sin(T * 0.2 + i) * 100;
            const startY = -50;
            const endX = startX + Math.sin(finalAngle) * rayLength;
            const endY = startY + Math.cos(finalAngle) * rayLength;

            const rayGrad = ctx.createLinearGradient(startX, startY, endX, endY);
            const rayOp = 0.02 + Math.sin(T + i * 0.5) * 0.015;
            rayGrad.addColorStop(0, `rgba(0, 255, 180, ${clamp(rayOp * 2, 0, 0.1)})`);
            rayGrad.addColorStop(0.3, `rgba(0, 200, 140, ${clamp(rayOp, 0, 0.05)})`);
            rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.moveTo(startX - 20, startY);
            ctx.lineTo(endX - 5, endY);
            ctx.lineTo(endX + 5, endY);
            ctx.lineTo(startX + 20, startY);
            ctx.closePath();
            ctx.fillStyle = rayGrad;
            ctx.fill();
        }
        ctx.restore();

        // === LAYER 6: Caustic light patterns (SEAMLESS via sin/cos) ===
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 60; i++) {
            const seed = i * 157.3 + 8000;
            const cx = hash(seed) * width * 1.4 - width * 0.2 + Math.sin(T * 0.5 + hash(seed + 1) * 10) * 100;
            const cy = hash(seed + 2) * height * 0.6 + height * 0.3 + Math.cos(T * 0.4 + hash(seed + 3) * 10) * 80;
            const cSize = 30 + hash(seed + 4) * 80 + Math.sin(T * 2 + seed) * 20;
            const cOp = 0.03 + Math.sin(T + hash(seed + 5) * Math.PI * 2) * 0.02;

            const causticGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cSize);
            causticGrad.addColorStop(0, `rgba(100, 255, 200, ${clamp(cOp, 0, 0.08)})`);
            causticGrad.addColorStop(0.5, `rgba(0, 200, 140, ${clamp(cOp * 0.5, 0, 0.04)})`);
            causticGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.arc(cx, cy, cSize, 0, Math.PI * 2);
            ctx.fillStyle = causticGrad;
            ctx.fill();
        }
        ctx.restore();

        // === LAYER 7: Scan lines (static → trivially seamless) ===
        ctx.save();
        ctx.globalAlpha = 0.03;
        for (let y = 0; y < height; y += 4) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, y, width, 1);
        }
        ctx.restore();

        // === LAYER 8: Central radial pulse (SEAMLESS via sin(T)) ===
        const pulsePhase = Math.sin(T * 2) * 0.5 + 0.5;
        const pulseX = width * 0.5 + Math.sin(T * 0.3) * 200;
        const pulseY = height * 0.45 + Math.cos(T * 0.4) * 100;
        const pulseR = width * (0.25 + pulsePhase * 0.15);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const pulseGrad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, pulseR);
        pulseGrad.addColorStop(0, `rgba(0, 255, 180, ${0.04 + pulsePhase * 0.04})`);
        pulseGrad.addColorStop(0.3, `rgba(0, 200, 140, ${0.02 + pulsePhase * 0.02})`);
        pulseGrad.addColorStop(0.7, `rgba(0, 100, 60, ${0.01 + pulsePhase * 0.01})`);
        pulseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = pulseGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // === LAYER 9: Fractal tendrils (SEAMLESS via circular noise) ===
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const tendrilCount = 6;
        for (let ti = 0; ti < tendrilCount; ti++) {
            const baseAngle = (ti / tendrilCount) * Math.PI * 2;
            const startX = width * 0.5 + Math.cos(baseAngle + T * 0.1) * width * 0.1;
            const startY = height * 0.5 + Math.sin(baseAngle + T * 0.1) * height * 0.1;

            ctx.beginPath();
            ctx.moveTo(startX, startY);

            let curX = startX;
            let curY = startY;
            const segments = 40;
            const segLen = 25;

            for (let s = 0; s < segments; s++) {
                // SEAMLESS: use circular noise for direction
                const noiseDir = seamlessNoise2D(angle, curX * 0.003 + s * 0.1, curY * 0.003 + ti * 10, 2, 3) * Math.PI * 2;
                const dir = baseAngle + noiseDir * 0.5 + Math.sin(T + s * 0.3) * 0.3;
                curX += Math.cos(dir) * segLen;
                curY += Math.sin(dir) * segLen;
                ctx.lineTo(curX, curY);
            }

            const tendrilOp = 0.04 + Math.sin(T + ti) * 0.02;
            ctx.strokeStyle = `rgba(0, 255, 170, ${clamp(tendrilOp, 0, 0.1)})`;
            ctx.lineWidth = 3 - ti * 0.3;
            ctx.shadowColor = 'rgba(0, 255, 160, 0.3)';
            ctx.shadowBlur = 10;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // === LAYER 10: Edge vignette (static → trivially seamless) ===
        const vigGrad = ctx.createRadialGradient(
            width * 0.5, height * 0.5, width * 0.25,
            width * 0.5, height * 0.5, width * 0.75
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, width, height);

    }, [frame, width, height, durationInFrames]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ width: '100%', height: '100%' }}
        />
    );
};
