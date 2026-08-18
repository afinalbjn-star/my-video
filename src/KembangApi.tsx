import { Frame, useCurrentFrame, useVideoConfig } from 'remotion';
import { useMemo } from 'react';

const COLORS = ['#ff0000', '#ff4500', '#ff8c00', '#ffa500', '#ffd700', '#ffff00'];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  rotation: number;
  scale: number;
}

const PARTICLE_COUNT = 200;

export const KembangApi: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const particles = useMemo(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        id: i,
        x: Math.random(),
        y: Math.random(),
        size: 2 + Math.random() * 3,
        speed: 0.5 + Math.random() * 1.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      });
    }
    return particles;
  }, []);

  return (
    <Frame
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a1a',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: rotate(frame * 0.5),
        }}
      >
        {particles.map((p) => {
          const time = frame / fps + p.id * 0.1;
          const posX = p.x * width + Math.sin(time + p.id) * 50;
          const posY = p.y * height + Math.cos(time * 0.7 + p.id) * 50;
          const alpha = 0.3 + 0.7 * Math.sin(time * 2 + p.id);
          const glow = 1 + 0.5 * Math.sin(time + p.id);
          
          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: posX,
                top: posY,
                width: p.size * 4,
                height: p.size * 6,
                backgroundColor: p.color,
                opacity: alpha,
                transform: `rotate(${p.rotation}deg) scale(${p.scale * glow})`,
                filter: `blur(${p.size * 0.5}px) drop-shadow(0 0 ${p.size * 2}px ${p.color})`,
                borderRadius: '50% 50% 0 0',
              }}
            />
          );
        })}
      </div>
    </Frame>
  );
};