import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill, Easing } from 'remotion';
import { interpolate } from 'remotion';

export const AbstractBackground01: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Progress from 0 to 1, looping
  const progress = (frame % durationInFrames) / durationInFrames;

  // 3 layers of particles at different speeds
  const rng = (seed: number) => {
    let t = seed;
    return () => {
      t = (t * 1664525 + 1013904223) % 4294967296;
      return t / 4294967296;
    };
  };

  const createParticles = (count: number, speed: number, color: string) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const x0 = rng(42 + i)(Math.random());
      const y0 = rng(42 + i + 1000)(Math.random());
      const size = Math.random() * 6 + 2;
      const delay = rng(42 + i + 2000)() * 15;
      const dx = (rng(42 + i + 3000)() - 0.5) * 600 * speed;
      const dy = (rng(42 + i + 3000 + 100)() - 0.5) * 300 * speed;
      particles.push({ x0, y0, size, delay, dx, dy });
    }
    return particles;
  };

  const slowParticles = createParticles(20, 3, 'rgba(124, 58, 237, 0.8)');
  const midParticles = createParticles(30, 1.5, 'rgba(6, 182, 212, 0.8)');
  const fastParticles = createParticles(50, 0.8, 'rgba(236, 72, 153, 0.8)');

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {slowParticles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(p.x0 * 100 + (frame % 1000) * p.dx / durationInFrames) % 100}%`,
              top: `${(p.y0 * 100 + (frame % 1000) * p.dy / durationInFrames) % 100}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: p.size > 4 ? 'rgba(124, 58, 237, 0.8)' : 'transparent',
              margin: '-2px 0 0 -2px',
              opacity: 0.8,
            }}
          />
        ))}
        {midParticles.map((p, i) => (
          <div
            key={i + 20}
            style={{
              position: 'absolute',
              left: `${(p.x0 * 100 + (frame % 1000) * p.dx / durationInFrames) % 100}%`,
              top: `${(p.y0 * 100 + (frame % 1000) * p.dy / durationInFrames) % 100}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.8)',
              margin: '-2px 0 0 -2px',
              opacity: 0.9,
            }}
          />
        ))}
        {fastParticles.map((p, i) => (
          <div
            key={i + 50}
            style={{
              position: 'absolute',
              left: `${(p.x0 * 100 + (frame % 1000) * p.dx / durationInFrames) % 100}%`,
              top: `${(p.y0 * 100 + (frame % 1000) * p.dy / durationInFrames) % 100}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: 'rgba(236, 72, 153, 0.8)',
              margin: '-2px 0 0 -2px',
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};