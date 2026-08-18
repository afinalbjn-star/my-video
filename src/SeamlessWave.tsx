import { Composition, Video } from 'remotion';

export const SeamlessWave: React.FC = () => {
  return (
    <div>
      <!-- Komponen gelombang -->
      <Video
        src="https://example.com/gelombang.mp4"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
