import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile } from 'remotion';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Shuttlecock } from './Shuttlecock';

export const ShuttlecockScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#222' }}>
      <Canvas style={{ width, height }}>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={75} />
        {/* OrbitControls allows interactive camera movement in Remotion Studio */}
        <OrbitControls />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[1, 1, 1]} intensity={1} />
        <directionalLight position={[-1, -1, -1]} intensity={0.7} />

        {/* Shuttlecock component */}
        <Shuttlecock scale={0.5} position={[0, 0, 0]} rotation={[frame * 0.01, frame * 0.02, 0]} />
      </Canvas>
    </AbsoluteFill>
  );
};
