import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const AbstractBackground05: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame % durationInFrames) / durationInFrames;

  // Fluid morphing shapes - 6 blobs moving & merging
  const numShapes = 6;
  const shapes: any[] = [];

  for (let i = 0; i < numShapes; i++) {
    const w = 200 + Math.random() * 400;
    const h = 150 + Math.random() * 300;
    const speed = 0.3 + Math.random() * 0.4;
    const dx = (Math.random() - 0.5) * 50;
    const dy = (Math.random() - 0.5) * 50;
    const delay = i * 0.1;
    const colorIdx = i;
    const colors = [
      'rgba(124, 58, 237, 0.5)',
      'rgba(6, 182, 212, 0.5)',
      'rgba(236, 72, 153, 0.5)',
      'rgba(251, 187, 56, 0.4)',
      'rgba(34, 197, 94, 0.4)',
      'rgba(168, 85, 247, 0.4)',
    ];
    shapes.push({ w, h, speed, dx, dy, delay, color: colors[colorIdx] });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {[...Array(numShapes)].map((_, i) => {
          const s = shapes[i];
          const t = ((frame + s.delay * 30) % durationInFrames) / durationInFrames;
          const x = (s.dx * Math.sin(t * Math.PI * 2 * s.speed) + 50) % 100;
          const y = (s.dy * Math.cos(t * Math.PI * 2 * s.speed) + 50) % 100;
          const w = s.w * (0.8 + Math.sin(t * Math.PI * 2 * s.speed * 0.5) * 0.4);
          const h = s.h * (0.8 + Math.cos(t * Math.PI * 2 * s.speed * 0.5) * 0.4);
          const opacity = 0.4 + Math.random() * 0.3;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${w}px`,
                height: `${h}px`,
                borderRadius: '60% 40% 30% 50%',
                background: s.color,
                opacity: opacity,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};