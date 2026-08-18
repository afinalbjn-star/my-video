import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const AbstractBackground06: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame % durationInFrames) / durationInFrames;

  // Data constellation - connecting nodes
  const numNodes = 80;
  const nodes: any[] = [];
  const connections: any[] = [];

  // Create nodes
  for (let i = 0; i < numNodes; i++) {
    const x = Math.random() * 3840;
    const y = Math.random() * 2160;
    const hue = 260 + Math.random() * 40;
    const size = Math.random() * 3 + 1;
    const opacity = 0.4 + Math.random() * 0.3;
    nodes.push({ x, y, hue, size, opacity });
  }

  // Create some connections
  const connectionCount = Math.floor(numNodes * 0.1);
  for (let i = 0; i < connectionCount; i++) {
    const a = Math.floor(Math.random() * numNodes);
    const b = Math.floor(Math.random() * numNodes);
    if (a !== b) {
      const na = nodes[a];
      const nb = nodes[b];
      const dist = Math.hypot(na.x - nb.x, na.y - nb.y);
      if (dist < 200) {
        connections.push({ a, b, na, nb });
      }
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {/* Connections first */}
        {[...Array(connections.length)].map((_, i) => {
          const c = connections[i];
          const na = c.na;
          const nb = c.nb;
          const t = (frame % durationInFrames) / durationInFrames;
          const opacity = 0.2 + Math.random() * 0.1;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(na.x + nb.x) / 2}px`,
                top: `${(na.y + nb.y) / 2}px`,
                width: `${Math.hypot(nb.x - na.x, nb.y - na.y)}px`,
                borderLeft: `1px solid rgba(6, 182, 212, ${opacity})`,
                height: '1px',
                transform: `rotate(${Math.atan2(nb.y - na.y, nb.x - na.x)}rad)`,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Nodes on top */}
        {[...Array(numNodes)].map((_, i) => {
          const n = nodes[i];
          const t = (frame + i * 5) % durationInFrames / durationInFrames;
          const x = ((n.x % 3840) + 3840) % 3840;
          const y = ((n.y % 2160) + 2160) % 2160;
          const hue = n.hue + t * 10;
          const size = n.size;
          const opacity = n.opacity;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: `rgba(124, 58, 237, ${opacity})`,
                boxShadow: `0 0 8px rgba(6, 182, 212, ${opacity * 0.5})`,
                opacity: 0.5 + Math.random() * 0.3,
              }}
            />
          );
        })}

        {/* Occasional moving node */}
        {[...Array(3)].map((_, i) => {
          const base = nodes[i * 25]; // take every 25th node
          if (!base) return null;
          const t = (frame + i * 100) % durationInFrames / durationInFrames;
          const x = ((base.x + 50 * Math.sin(t * Math.PI * 2)) % 3840 + 3840) % 3840;
          const y = ((base.y + 50 * Math.cos(t * Math.PI * 2 * 0.7)) % 2160 + 2160) % 2160;
          const size = base.size * (0.5 + Math.random() * 0.5);

          return (
            <div
              key={i + numNodes}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: 'rgba(251, 187, 56, 0.8)',
                boxShadow: '0 0 15px rgba(251, 187, 56, 0.5)',
                opacity: 0.6 + Math.random() * 0.2,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};