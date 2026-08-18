import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const AbstractBackground02: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame % durationInFrames) / durationInFrames;

  // Mesh gradient effect - 36 cells moving & color cycling
  const cellCount = 36;
  const gridSize = Math.ceil(Math.sqrt(cellCount));

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: 0,
        }}
      >
        {[...Array(cellCount)].map((_, i) => {
          const col = i % gridSize;
          const row = Math.floor(i / gridSize);
          const baseX = (col / gridSize) * 100;
          const baseY = (row / gridSize) * 100;

          const offsetX = interpolate(
            (progress * 10 + col) % 12 / 12,
            [0, 1],
            [-20, 20],
            { easing: Easing.easeInOut }
          );
          const offsetY = interpolate(
            (progress * 5 + row) % 8 / 8,
            [0, 1],
            [-20, 20],
            { easing: Easing.easeInOut }
          );

          const colorIdx = (Math.floor(progress * 5) + i) % 4;
          const colors = [
            'rgba(124, 58, 237, 0.5)',
            'rgba(6, 182, 212, 0.5)',
            'rgba(236, 72, 153, 0.5)',
            'rgba(251, 187, 56, 0.3)',
          ];

          return (
            <div
              key={i}
              style={{
                width: `calc(100% / ${gridSize})`,
                height: `calc(100% / ${gridSize})`,
                position: 'absolute',
                left: `${baseX + offsetX}%`,
                top: `${baseY + offsetY}%`,
                background: colors[colorIdx],
                borderRadius: `${Math.random() * 20}px`,
                opacity: 0.6 + Math.random() * 0.2,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};