import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const AbstractBackground04: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame % durationInFrames) / durationInFrames;

  // Radial glows - pulsing orbs
  const numOrbs = 6;
  const orbs: any[] = [];

  for (let i = 0; i < numOrbs; i++) {
    const baseSize = 300 + Math.random() * 400;
    const startX = 50 + Math.random() * 300;
    const startY = 50 + Math.random() * 300;
    const pulseSpeed = 0.5 + Math.random() * 0.5;
    const colorWeight = Math.random();
    orbs.push({
      baseSize,
      startX,
      startY,
      pulseSpeed,
      colorWeight,
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {[...Array(numOrbs)].map((_, i) => {
          const o = orbs[i];
          const t = (frame % durationInFrames) / durationInFrames;
          const scale = 1 + Math.sin(t * Math.PI * 2 * o.pulseSpeed) * 0.3;
          const size = o.baseSize * scale;
          const opacity = 0.3 + Math.sin(t * Math.PI * 2 * o.pulseSpeed * 0.7) * 0.2;
          const x = o.startX - size / 2;
          const y = o.startY - size / 2;
          const hue = i * 60;
          const color = `hsla(${hue}, 70%, 60%, ${opacity})`;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                borderRadius: '50%',
                background: color,
                filter: 'blur(80px)',
                opacity: 0.5 + Math.random() * 0.3,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};