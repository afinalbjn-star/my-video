import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

export const Vidku: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;
  const frequency = 2; // 2 cycles in 8 seconds

  const bars = [
    { heightBase: 800, phase: 0 },
    { heightBase: 1000, phase: 0.5 },
    { heightBase: 700, phase: 1.0 },
    { heightBase: 1300, phase: 1.5 },
    { heightBase: 900, phase: 2.0 },
  ];

  // Calculate current height of the last bar
  const lastBarOscillation = Math.sin((progress * Math.PI * 2 * frequency) + bars[4].phase);
  const lastBarHeight = interpolate(lastBarOscillation, [-1, 1], [bars[4].heightBase * 0.4, bars[4].heightBase]);

  // Center of chart container is at 600 (since height is 1200)
  // Arrow is at lastBarHeight.
  // To keep arrow at center of screen, container must move DOWN by (lastBarHeight - 600).
  const cameraTranslateY = lastBarHeight - 600;
  // A slight zooming effect synced with the movement
  const cameraScale = interpolate(Math.cos(progress * Math.PI * 2 * frequency), [-1, 1], [0.95, 1.05]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", overflow: "hidden", fontFamily: "sans-serif" }}>
      {/* Background Grid that moves slightly with camera to give depth */}
      <div style={{ 
        position: "absolute", 
        width: "400%", 
        height: "400%", 
        backgroundImage: "linear-gradient(#1e293b 4px, transparent 4px), linear-gradient(90deg, #1e293b 4px, transparent 4px)", 
        backgroundSize: "150px 150px", 
        opacity: 0.4, 
        transform: `translate(-50%, -50%) translateY(${cameraTranslateY * 0.3}px)`, 
        left: "50%", top: "50%" 
      }} />

      {/* World Container */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          transform: `scale(${cameraScale}) translateY(${cameraTranslateY}px)`,
        }}
      >
        {/* Chart Container */}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: "120px", height: "1200px", borderBottom: "8px solid #334155", padding: "0 200px" }}>
          
          {/* Bars */}
          {bars.map((bar, index) => {
            const barOscillation = Math.sin((progress * Math.PI * 2 * frequency) + bar.phase);
            const currentHeight = index === 4 
              ? lastBarHeight 
              : interpolate(barOscillation, [-1, 1], [bar.heightBase * 0.4, bar.heightBase]);
            
            return (
              <div
                key={index}
                style={{
                  width: "180px",
                  height: `${currentHeight}px`,
                  background: "linear-gradient(to top, #3b82f6, #60a5fa)",
                  borderRadius: "24px 24px 0 0",
                  boxShadow: "0 0 40px rgba(59, 130, 246, 0.5)",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center"
                }}
              >
                {/* Data value label on top of bar */}
                <div style={{
                  position: "absolute",
                  top: "-80px",
                  color: "#94a3b8",
                  fontSize: "48px",
                  fontWeight: "bold"
                }}>
                  {Math.round(currentHeight)}
                </div>
              </div>
            );
          })}

          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              right: "40px",
              bottom: `${lastBarHeight}px`,
              transform: "translateY(50%)", // Adjust so center of arrow aligns with top of bar
              display: "flex",
              alignItems: "center",
              gap: "30px",
            }}
          >
            {/* Arrow Graphic */}
            <div style={{ display: "flex", alignItems: "center", filter: "drop-shadow(0 0 30px rgba(239, 68, 68, 0.8))" }}>
              <div style={{
                width: 0,
                height: 0,
                borderTop: "40px solid transparent",
                borderBottom: "40px solid transparent",
                borderRight: "60px solid #ef4444",
              }} />
              <div style={{
                width: "150px",
                height: "40px",
                backgroundColor: "#ef4444",
                borderRadius: "0 20px 20px 0",
                marginLeft: "-30px",
              }} />
            </div>
            
            {/* Value indicator */}
            <div style={{
              color: "white",
              fontSize: "96px",
              fontWeight: "bold",
              textShadow: "0 8px 30px rgba(0,0,0,0.5)"
            }}>
              {Math.round(lastBarHeight)}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
