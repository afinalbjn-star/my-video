import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LingoFox, type LingoMood } from './LingoFox';

const FloatingLetter: React.FC<{
  letter: string;
  x: number;
  y: number;
  size: number;
  frame: number;
  fps: number;
  color: string;
}> = ({ letter, x, y, size, frame, fps, color }) => {
  const floatY = Math.sin((frame / fps) * Math.PI * 2 + x) * 30;
  const floatX = Math.cos((frame / fps) * Math.PI * 1.5 + y) * 20;
  const rot = Math.sin((frame / fps) * 1.2 + x * 0.01) * 14;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        fontSize: size,
        fontWeight: 900,
        color,
        opacity: 0.55,
        transform: `translate(${floatX}px, ${floatY}px) rotate(${rot}deg)`,
        textShadow: '0 8px 30px rgba(0,0,0,0.25)',
        userSelect: 'none',
      }}
    >
      {letter}
    </div>
  );
};

export const LingoMascotScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Mood progression across 15s
  const mood: LingoMood =
    t < 3 ? 'idle' : t < 6 ? 'happy' : t < 9 ? 'talking' : 'excited';

  // Background gradient shifts over time
  const hue = 20 + Math.sin(t * 0.2) * 15;

  // Title entrance
  const titleIn = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 90 },
  });
  const titleScale = interpolate(titleIn, [0, 1], [0.8, 1]);

  // Subtitle entrance
  const subIn = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 70 },
  });

  // Tag line fade
  const tagOpacity = interpolate(frame, [fps * 2, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const letters = ['A', 'B', 'C', 'D', 'E', 'K', 'O', 'S', 'M', 'R'];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Arial, Helvetica, sans-serif',
        background: `radial-gradient(120% 120% at 50% 35%, hsl(${hue} 90% 82%) 0%, hsl(${hue} 85% 68%) 45%, hsl(${hue} 80% 55%) 100%)`,
      }}
    >
      {/* Floating letters */}
      {letters.map((l, i) => (
        <FloatingLetter
          key={i}
          letter={l}
          x={[8, 16, 26, 74, 84, 92, 5, 50, 95, 12][i]}
          y={[12, 30, 8, 12, 8, 30, 82, 86, 82, 65][i]}
          size={[90, 130, 70, 120, 80, 100, 110, 90, 130, 70][i]}
          frame={frame}
          fps={fps}
          color="rgba(255,255,255,0.9)"
        />
      ))}

      {/* Soft blobs */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          left: '-200px',
          top: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)',
          transform: `translateY(${Math.sin(t * 0.8) * 60}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          borderRadius: '50%',
          right: '-250px',
          bottom: '-200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)',
          transform: `translateY(${Math.cos(t * 0.6) * 70}px)`,
        }}
      />

      {/* Mascot */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '58%',
          width: '44%',
          transform: 'translate(-50%, -58%)',
          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.25))',
        }}
      >
        <LingoFox mood={mood} />
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '8%',
          transform: `translateX(-50%) scale(${titleScale})`,
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 900,
            color: '#FFFFFF',
            textShadow: '0 12px 40px rgba(0,0,0,0.25)',
            letterSpacing: 2,
          }}
        >
          Belajar Bahasa
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            color: '#1D4ED8',
            textShadow: '0 8px 30px rgba(0,0,0,0.2)',
            marginTop: -20,
          }}
        >
          Bareng Lingo 🦊
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '88%',
          transform: `translateX(-50%) translateY(${interpolate(subIn, [0, 1], [40, 0])}px)`,
          opacity: subIn,
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#FFFFFF',
            textShadow: '0 6px 24px rgba(0,0,0,0.25)',
          }}
        >
          Tutor AI yang selalu siap ngobrol 24/7 — mulai dari nol sampai lancar!
        </div>
      </div>

      {/* Tag line */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '94%',
          transform: 'translateX(-50%)',
          opacity: tagOpacity,
          fontSize: 56,
          fontWeight: 700,
          color: '#FFEDD5',
          textShadow: '0 4px 18px rgba(0,0,0,0.2)',
        }}
      >
        Speak • Play • Level Up
      </div>
    </div>
  );
};