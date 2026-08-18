import { useVideoConfig, AbsoluteFill, useCurrentFrame } from 'remotion';

export const SeamlessLoop = () => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'black',
      }}
    >
      {/* Tambahkan konten di sini */}
    </AbsoluteFill>
  );
};
