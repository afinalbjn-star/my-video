import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const AdobeSeamlessLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Progress 0 to 1
  const progress = (frame % durationInFrames) / durationInFrames;

  // Gerakan kamera abstrak (zoom in/out dan rotasi perlahan)
  const scale = interpolate(progress, [0, 0.5, 1], [1, 1.1, 1], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const rotation = interpolate(progress, [0, 1], [0, 360]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
      {/* Background Gradient Emas & Pastel */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, #fdfcf0 0%, #d4af37 40%, #8c7b75 70%, #1a1a1a 100%)`,
          transform: `scale(${scale}) rotate(${rotation / 10}deg)`,
          filter: 'blur(60px)',
          opacity: 0.6,
        }}
      />

      {/* Elemen Partikel Pastel */}
      <AbsoluteFill>
        {[...Array(10)].map((_, i) => {
          const delay = i * (durationInFrames / 10);
          const p = ((frame + delay) % durationInFrames) / durationInFrames;
          const x = interpolate(p, [0, 1], [0, 100]);
          const y = interpolate(p, [0, 1], [0, 100]);
          const size = interpolate(p, [0, 0.5, 1], [100, 400, 100]);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: i % 2 === 0 ? '#ffb7b2' : '#b2e2f2', // Pastel Pink & Blue
                filter: 'blur(80px)',
                opacity: interpolate(p, [0, 0.5, 1], [0, 0.4, 0]),
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
