import React from 'react';
import { Text, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

const NandoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Fade in over first 30 frames (0.5s at 60fps)
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 200,
          color: '#fff',
          opacity,
          lineHeight: 1,
        }}
      >
        NANDO AGENT AI
      </Text>
    </div>
  );
};

export default NandoIntro;
