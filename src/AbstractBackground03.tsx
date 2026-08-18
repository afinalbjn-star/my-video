import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const AbstractBackground03: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame % durationInFrames) / durationInFrames;

  // Light traces - particles moving in sinusoidal patterns
  const numParticles = 80;
  const particles: any[] = [];

  for (let i = 0; i < numParticles; i++) {
    const x0 = (Math.random() * 1920) / 3840; // normalized 0-0.5 for 4K
    const y0 = (Math.random() * 1080) / 2160;
    const vx = (Math.random() - 0.5) * 0.3;
    const vy = (Math.random() - 0.5) * 0.3;
    const radius = Math.random() * 2 + 0.5;
    const hueBase = 260 + Math.random() * 40; // purple-cyan range
    particles.push({ x0, y0, vx, vy, radius, hueBase });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {[...Array(numParticles)].map((_, i) => {
          const p = particles[i];
          const t = (frame + i * 10) % durationInFrames / durationInFrames;
          const x = ((p.x0 * 3840 + p.vx * frame) % 3840 + 3840) % 3840;
          const y = ((p.y0 * 2160 + p.vy * frame) % 2160 + 2160) % 2160;
          const hue = p.hueBase + t * 20;
          const opacity = 0.3 + Math.random() * 0.3;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${p.radius * 2}px`,
                height: `${p.radius * 2}px`,
                borderRadius: '50%',
                background: `rgba(${Math.round(255 * Math.sin(hue * Math.PI / 180))}, ${Math.round(255 * Math.cos(hue * Math.PI / 180))}, 255, ${opacity})`,
                boxShadow: `0 0 10px rgba(6, 182, 212, ${opacity * 0.5})`,
                opacity: 0.5 + Math.random() * 0.3,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};