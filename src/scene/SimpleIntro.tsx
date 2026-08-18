import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, useCurrentFrame } from 'remotion';

export const SimpleIntro: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, {
    inputRange: [0, 30, durationInFrames - 30, durationInFrames],
    outputRange: [0, 1, 1, 0],
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '120px', fontWeight: 'bold' }}>
        Selamat Datang!
      </div>
    </AbsoluteFill>
  );
};
