```typescript
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AbsoluteFill, Easing } from 'remotion';

const FogEffect: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const fogOpacity = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0, 0.5, 0.5, 0],
    {
      easing: Easing.easeInOutSine,
    }
  );

  const fogColor = interpolate(
    frame,
    [0, durationInFrames],
    ['#000000', '#202020'],
    {
      easing: Easing.easeInOutSine,
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: fogColor,
        opacity: fogOpacity,
        filter: 'blur(2px)',
      }}
    />
  );
};

export default FogEffect;
```