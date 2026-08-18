import { AbsoluteFill, Video, staticFile } from 'remotion';

export const FirefliesBackground: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      <Video
        src={staticFile('media/fireflies.mp4')}
        muted
        loop
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </AbsoluteFill>
  );
};
