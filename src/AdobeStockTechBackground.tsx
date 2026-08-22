import React, { useEffect } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Adobe Stock Tech Background - Animated loopable background
 * 4K 60fps seamless loop untuk stock marketplace
 */
export const AdobeStockTechBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Seamless loop calculation
  const loopFrame = frame % durationInFrames;
  const progress = loopFrame / durationInFrames;

  // Technology animation parameters
  const opacity = 0.3 + Math.sin(progress * Math.PI * 2) * 0.2;
  const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
  const rotation = progress * 360;
  const hue = (progress * 360 + 30) % 360;

  // Grid pattern for technology theme
  const gridSize = 60;
  const gridOffset = (loopFrame * 3) % gridSize;

  // Inject keyframes on mount
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes bgRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes gridMove {
        0% { transform: translate(0, 0); }
        100% { transform: translate(60px, 60px); }
      }
      @keyframes float {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a1a',
      }}
    >
      {/* Gradient background loop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `conic-gradient(from ${hue}deg, #1a1a3e, #16213e, #0f3460, #533d7e, #1a1a3e)`,
          animation: `bgRotate 10s linear infinite`,
        }}
      />
      
      {/* Animated grid lines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          animation: `gridMove ${10 / fps}s linear infinite`,
        }}
      />
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 6 + Math.sin(progress * Math.PI * 2 + i) * 2,
            height: 6 + Math.cos(progress * Math.PI * 2 + i) * 2,
            backgroundColor: `hsl(${hue + i * 20 % 360}, 70%, 60%)`,
            borderRadius: '50%',
            left: `${50 + Math.sin(progress * Math.PI * 1.5 + i) * 30}%`,
            top: `${50 + Math.cos(progress * Math.PI * 1.5 + i) * 30}%`,
            opacity: 0.5 + Math.sin(progress * Math.PI * 3 + i) * 0.3,
            animation: `float ${8 / fps}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Main light flare */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(${hue}, 70%, 50%, 0.3) 0%, transparent 70%)`,
          left: `50%`,
          top: `50%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          opacity: 0.4,
        }}
      />

      {/* Center accent */}
      <div
        style={{
          position: 'absolute',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `hsl(${hue}, 80%, 60%)`,
          left: `50%`,
          top: `50%`,
          transform: `translate(-50%, -50%)`,
          boxShadow: `0 0 30px hsl(${hue}, 80%, 60%)`,
        }}
      />
    </div>
  );
};

export default AdobeStockTechBackground;