import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

export const VIDEO_CONFIG = {
  width: 3840,
  height: 2160,
  fps: 60,
  durationInFrames: 600, // 10 detik
};

const RiverFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Menghitung offset untuk seamless loop
  // Menggeser noise secara horizontal dan vertikal untuk membuat aliran air
  const progress = frame / durationInFrames;
  const offsetX = progress * 1000; // Geser horizontal
  const offsetY = progress * 500; // Geser vertikal

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
      }}
    >
      <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 3840 2160">
        <defs>
          {/* Filter untuk membuat texture air bergerak */}
          <filter id="river-filter">
            {/* Membuat noise/pergerakan air dasar */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.002 0.01" // Frekuensi horizontal lebih rapat dari vertikal untuk kesan mengalir
              numOctaves="3"
              seed="42" // Seed tetap agar konsisten
              stitchTiles="stitch"
              result="noise"
            />
            
            {/* Menggeser noise untuk membuat animasi seamless */}
            <feOffset in="noise" dx={offsetX} dy={offsetY} result="offsetNoise" />

            {/* Memberikan warna gradasi menggunakan feFlood dan masking */}
            <feFlood floodColor="#00CED1" result="cyan" />
            <feFlood floodColor="#20B2AA" result="lightsea" />
            <feFlood floodColor="#48D1CC" result="mediumturquoise" />
            
            {/* Menggabungkan warna dengan noise */}
            <feColorMatrix
              type="matrix"
              in="offsetNoise"
              values="0 0 0 0 0.1
                      0 0 0 0 0.7
                      0 0 0 0 0.8
                      0 0 0 1 0"
              result="blueNoise"
            />

            {/* Efek distorsi untuk mengubah grid biasa menjadi aliran air */}
            <feDisplacementMap
              in="blueNoise"
              in2="offsetNoise"
              scale="60" // Kekuatan distorsi (semakin tinggi semakin berombak)
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Gradient untuk nuansa warna-warni */}
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#4facfe", stopOpacity: 1 }} />
            <stop offset="25%" style={{ stopColor: "#00f2fe", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "#43e97b", stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: "#38f9d7", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#4facfe", stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Layer Air dengan Filter */}
        <rect
          width="100%"
          height="100%"
          filter="url(#river-filter)"
          fill="url(#riverGradient)"
          style={{ opacity: 0.8 }}
        />

        {/* Layer Cahaya Refleksi di Atas Air */}
        <rect
          width="100%"
          height="100%"
          filter="url(#river-filter)"
          style={{
            mixBlendMode: "overlay",
            opacity: 0.5
          }}
          fill="white"
        />
      </svg>
    </AbsoluteFill>
  );
};

export default RiverFlow;
