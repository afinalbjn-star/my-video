// path: src/HexagonWaveRipple.tsx
// 4K 60fps Seamless Loop - Hexagon Wave Ripple Animation
// Inspired by dark hexagon grid with neon blue glow

import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ─── Helpers ───────────────────────────────────────────────────────────────
const TAU = Math.PI * 2;

/** Smooth sine with phase offset, always seamless */
const seam = (frame: number, total: number, freq = 1, phase = 0): number => {
  return Math.sin(TAU * freq * (frame / total) + phase);
};

/** Hexagon center positions in axial offset coordinates */
const buildHexGrid = (
  canvasW: number,
  canvasH: number,
  hexSize: number,
  padding = 2
) => {
  const hexes: { cx: number; cy: number; col: number; row: number; id: number }[] = [];
  const hexW = hexSize * 2;
  const hexH = Math.sqrt(3) * hexSize;
  const horizSpacing = hexW * 0.75;
  const vertSpacing = hexH;

  const cols = Math.ceil(canvasW / horizSpacing) + padding * 2;
  const rows = Math.ceil(canvasH / vertSpacing) + padding * 2;

  let id = 0;
  for (let row = -padding; row < rows; row++) {
    for (let col = -padding; col < cols; col++) {
      const cx = col * horizSpacing + canvasW / 2 - ((cols / 2) * horizSpacing);
      const cy =
        row * vertSpacing +
        (col % 2 === 0 ? 0 : hexH / 2) +
        canvasH / 2 - ((rows / 2) * vertSpacing);
      hexes.push({ cx, cy, col, row, id: id++ });
    }
  }
  return hexes;
};

/** Flat-top hexagon path */
const hexPath = (cx: number, cy: number, r: number): string => {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (TAU / 6) * i;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  });
  return `M${points.join('L')}Z`;
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface Ripple {
  originX: number;
  originY: number;
  startFraction: number; // 0..1 loop fraction
  speed: number;
  maxRadius: number;
  color: [number, number, number];
  intensity: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const HEX_SIZE = 52;          // px at 4K
const GLOW_RADIUS = HEX_SIZE * 0.85;

// Pre-defined ripple wave origins (normalized 0..1 of canvas)
const RIPPLE_ORIGINS: Ripple[] = [
  { originX: 0.5,  originY: 0.5,  startFraction: 0.0,  speed: 0.6, maxRadius: 2400, color: [0, 180, 255],  intensity: 1.0 },
  { originX: 0.15, originY: 0.2,  startFraction: 0.25, speed: 0.5, maxRadius: 2000, color: [0, 100, 255],  intensity: 0.85 },
  { originX: 0.85, originY: 0.8,  startFraction: 0.5,  speed: 0.55,maxRadius: 2200, color: [0, 220, 180],  intensity: 0.9 },
  { originX: 0.3,  originY: 0.85, startFraction: 0.15, speed: 0.45,maxRadius: 1800, color: [30, 60, 255],  intensity: 0.75 },
  { originX: 0.75, originY: 0.1,  startFraction: 0.65, speed: 0.6, maxRadius: 2100, color: [0, 160, 255],  intensity: 0.8 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const NeonParticles: React.FC<{
  frame: number;
  total: number;
  width: number;
  height: number;
}> = ({ frame, total, width, height }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      const seed1 = (i * 137.508 + 13) % 1;
      const seed2 = (i * 84.721 + 47) % 1;
      const seed3 = (i * 241.33 + 89) % 1;
      const seed4 = (i * 193.17 + 31) % 1;
      return {
        id: i,
        baseX: seed1 * width,
        baseY: seed2 * height,
        size: 1.5 + seed3 * 4,
        phase: seed4 * TAU,
        speed: 0.4 + seed1 * 0.8,
        drift: (seed2 - 0.5) * 60,
        color: i % 3 === 0
          ? `rgba(0,220,255,`
          : i % 3 === 1
          ? `rgba(30,100,255,`
          : `rgba(0,180,220,`,
      };
    });
  }, [width, height]);

  return (
    <g>
      {particles.map((p) => {
        const t = (frame / total + p.phase / TAU) % 1;
        const floatY = Math.sin(TAU * p.speed * t + p.phase) * 80;
        const floatX = Math.cos(TAU * p.speed * 0.7 * t + p.phase) * 40 + p.drift * t;
        const opacity = Math.sin(TAU * t + p.phase) * 0.3 + 0.4;
        const scale = 0.5 + Math.abs(Math.sin(TAU * p.speed * t + p.phase)) * 0.8;
        const x = (p.baseX + floatX) % width;
        const y = (p.baseY + floatY + height) % height;
        return (
          <circle
            key={p.id}
            cx={x}
            cy={y}
            r={p.size * scale}
            fill={`${p.color}${opacity.toFixed(3)})`}
            style={{ filter: `blur(${p.size * 0.5}px)` }}
          />
        );
      })}
    </g>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const HexagonWaveRipple: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames: total } = useVideoConfig();

  // Seamless fraction
  const frac = frame / total;

  // Build hex grid once
  const hexes = useMemo(() => buildHexGrid(width, height, HEX_SIZE, 3), [width, height]);

  // ── Ripple computation ────────────────────────────────────────────────────
  // Each hex gets a glow value 0..1 from all active ripples
  const hexGlowData = useMemo(() => {
    return hexes.map((hex) => {
      let totalGlow = 0;
      let glowR = 0, glowG = 0, glowB = 0;
      let dominantIntensity = 0;

      RIPPLE_ORIGINS.forEach((ripple) => {
        const ox = ripple.originX * width;
        const oy = ripple.originY * height;
        const dx = hex.cx - ox;
        const dy = hex.cy - oy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Current ripple radius (seamless loop)
        const localFrac = (frac - ripple.startFraction + 1) % 1;
        const rippleRadius = localFrac * ripple.maxRadius;
        const rippleWidth = 300 + ripple.maxRadius * 0.12;

        // Wave ring: gaussian bell centered on rippleRadius
        const delta = Math.abs(dist - rippleRadius);
        const wave = Math.exp(-((delta * delta) / (2 * rippleWidth * rippleWidth)));

        // Secondary trailing rings
        const trailDelta = Math.abs(dist - rippleRadius + rippleWidth * 2.5);
        const trail = Math.exp(-((trailDelta * trailDelta) / (2 * rippleWidth * rippleWidth * 0.25))) * 0.35;

        const combined = (wave + trail) * ripple.intensity;
        totalGlow = Math.min(1, totalGlow + combined);

        if (combined > dominantIntensity) {
          dominantIntensity = combined;
          glowR = ripple.color[0];
          glowG = ripple.color[1];
          glowB = ripple.color[2];
        }
      });

      // Ambient base glow - subtle breathing based on distance from center
      const cx = width / 2;
      const cy = height / 2;
      const distFromCenter = Math.sqrt((hex.cx - cx) ** 2 + (hex.cy - cy) ** 2);
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const ambientWave = seam(frame, total, 1.0, (distFromCenter / maxDist) * TAU * 2);
      const ambient = (ambientWave + 1) / 2 * 0.2;

      return {
        glow: Math.min(1, totalGlow + ambient),
        r: glowR || 0,
        g: glowG || 180,
        b: glowB || 255,
      };
    });
  }, [frame, frac, hexes, width, height, total]);

  // ── Slow pan (seamless) ───────────────────────────────────────────────────
  const panX = seam(frame, total, 0.5, 0) * 60;
  const panY = seam(frame, total, 0.3, Math.PI * 0.5) * 40;

  // ── Global pulse ──────────────────────────────────────────────────────────
  const globalPulse = (seam(frame, total, 2, 0) + 1) / 2;

  // ── Vignette opacity ──────────────────────────────────────────────────────
  const vigOpacity = 0.7 + globalPulse * 0.1;

  // ── Scan line speed ───────────────────────────────────────────────────────
  const scanY = (frac * height * 1.5) % height;

  // ─── SVG filter IDs ────────────────────────────────────────────────────────
  const filterId = 'hexGlow';
  const blurId = 'hexBlur';

  return (
    <AbsoluteFill style={{ backgroundColor: '#060c16', overflow: 'hidden' }}>

      {/* ── Layer 1: Deep background gradient ───────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 50%,
              rgba(0, 30, 80, 0.8) 0%,
              rgba(2, 8, 20, 0.95) 60%,
              rgba(0, 0, 0, 1) 100%
            )
          `,
        }}
      />

      {/* ── Layer 2: Animated color sweep ─────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 120% 120% at ${50 + panX / 30}% ${50 + panY / 30}%,
              rgba(0, 60, 180, ${0.12 + globalPulse * 0.06}) 0%,
              rgba(0, 20, 80, 0.08) 40%,
              transparent 70%
            )
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Layer 3: Main SVG hexagon grid ──────────────────────────────────── */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          {/* Neon glow filter */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft blur for bloom layer */}
          <filter id={blurId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="25" />
          </filter>

          {/* Gradient for hex face */}
          <radialGradient id="hexFaceGrad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#1a2030" />
            <stop offset="100%" stopColor="#0a0f1a" />
          </radialGradient>

          {/* Chromatic aberration filter */}
          <filter id="chromAb" x="-5%" y="-5%" width="110%" height="110%">
            <feColorMatrix type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red" />
            <feOffset dx="3" dy="0" in="red" result="redShift" />
            <feColorMatrix type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              in="SourceGraphic" result="green" />
            <feColorMatrix type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              in="SourceGraphic" result="blue" />
            <feOffset dx="-3" dy="0" in="blue" result="blueShift" />
            <feBlend in="redShift" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blueShift" mode="screen" />
          </filter>
        </defs>

        {/* ── Bloom layer (blurred glow hexes) ─────────────────────────── */}
        <g filter={`url(#${blurId})`} opacity="0.6">
          {hexes.map((hex, i) => {
            const gd = hexGlowData[i];
            if (gd.glow < 0.05) return null;
            const opacity = gd.glow * 0.8;
            return (
              <path
                key={`bloom-${hex.id}`}
                d={hexPath(
                  hex.cx + panX * 0.15,
                  hex.cy + panY * 0.15,
                  GLOW_RADIUS
                )}
                fill={`rgba(${gd.r},${gd.g},${gd.b},${opacity})`}
              />
            );
          })}
        </g>

        {/* ── Hex face bodies ───────────────────────────────────────────── */}
        <g>
          {hexes.map((hex, i) => {
            const gd = hexGlowData[i];
            const cx = hex.cx + panX * 0.15;
            const cy = hex.cy + panY * 0.15;

            // 3D depth bump: hexes slightly lift when glowing
            const lift = gd.glow * 4;

            return (
              <path
                key={`face-${hex.id}`}
                d={hexPath(cx, cy - lift, HEX_SIZE * 0.88)}
                fill={`rgba(${12 + gd.glow * 20},${16 + gd.glow * 30},${26 + gd.glow * 35},1)`}
              />
            );
          })}
        </g>

        {/* ── Neon border strokes ───────────────────────────────────────── */}
        <g filter={`url(#${filterId})`}>
          {hexes.map((hex, i) => {
            const gd = hexGlowData[i];
            const cx = hex.cx + panX * 0.15;
            const cy = hex.cy + panY * 0.15;
            const lift = gd.glow * 4;
            const strokeW = 2 + gd.glow * 6;
            const strokeOpacity = 0.25 + gd.glow * 0.75;

            return (
              <path
                key={`border-${hex.id}`}
                d={hexPath(cx, cy - lift, HEX_SIZE * 0.88)}
                fill="none"
                stroke={`rgba(${gd.r},${gd.g},${gd.b},${strokeOpacity})`}
                strokeWidth={strokeW}
              />
            );
          })}
        </g>

        {/* ── Bright core highlight on high-glow hexes ─────────────────── */}
        <g>
          {hexes.map((hex, i) => {
            const gd = hexGlowData[i];
            if (gd.glow < 0.5) return null;
            const cx = hex.cx + panX * 0.15;
            const cy = hex.cy + panY * 0.15;
            const lift = gd.glow * 4;
            const coreOpacity = (gd.glow - 0.5) * 2 * 0.3;

            return (
              <path
                key={`core-${hex.id}`}
                d={hexPath(cx, cy - lift, HEX_SIZE * 0.4)}
                fill={`rgba(${gd.r},${gd.g},${gd.b},${coreOpacity})`}
              />
            );
          })}
        </g>

        {/* ── Floating particles ─────────────────────────────────────────── */}
        <NeonParticles frame={frame} total={total} width={width} height={height} />

        {/* ── Scan line sweep ────────────────────────────────────────────── */}
        <line
          x1={0}
          y1={scanY}
          x2={width}
          y2={scanY}
          stroke="rgba(0,180,255,0.04)"
          strokeWidth={80}
          style={{ filter: 'blur(20px)' }}
        />
        <line
          x1={0}
          y1={scanY}
          x2={width}
          y2={scanY}
          stroke="rgba(0,200,255,0.015)"
          strokeWidth={3}
        />

        {/* ── Horizontal scan lines texture ─────────────────────────────── */}
        {Array.from({ length: 40 }).map((_, i) => {
          const lineY = (i / 40) * height;
          return (
            <line
              key={`scan-${i}`}
              x1={0}
              y1={lineY}
              x2={width}
              y2={lineY}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={1}
            />
          );
        })}

        {/* ── Cross-grid energy lines ───────────────────────────────────── */}
        {[0, 1, 2].map((i) => {
          const lineProgress = (frac * 1.5 + i * 0.33) % 1;
          const lineX = lineProgress * width * 1.5 - width * 0.25;
          const lineOpacity = Math.sin(lineProgress * Math.PI) * 0.15;
          return (
            <line
              key={`energyLine-${i}`}
              x1={lineX - 200}
              y1={0}
              x2={lineX + 200}
              y2={height}
              stroke={`rgba(0,180,255,${lineOpacity})`}
              strokeWidth={60}
              style={{ filter: 'blur(30px)' }}
            />
          );
        })}
      </svg>

      {/* ── Layer 4: Depth vignette ──────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 90% 80% at 50% 50%,
              transparent 30%,
              rgba(0,0,0,${vigOpacity * 0.5}) 70%,
              rgba(0,0,0,${vigOpacity * 0.9}) 100%
            )
          `,
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 5: Top blue light bloom ───────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 60% 30% at 50% 0%,
              rgba(0,100,255,${0.08 + globalPulse * 0.04}) 0%,
              transparent 60%
            )
          `,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 6: Bottom accent glow ──────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 50% 25% at 50% 100%,
              rgba(0,60,200,${0.06 + globalPulse * 0.03}) 0%,
              transparent 60%
            )
          `,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 7: Film grain overlay (subtle) ────────────────────────── */}
      <AbsoluteFill
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: `${200 + (frame % 60)}px ${200 + (frame % 47)}px`,
          pointerEvents: 'none',
        }}
      />

    </AbsoluteFill>
  );
};

export const VIDEO_CONFIG = {
  width: 3840,
  height: 2160,
  fps: 60,
  durationInFrames: 600, // 10 seconds
};

export default HexagonWaveRipple;
