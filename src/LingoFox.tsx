import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export type LingoMood = 'idle' | 'happy' | 'talking' | 'excited';

const ORANGE = '#F97316';
const ORANGE_DARK = '#EA580C';
const ORANGE_DEEP = '#C2410C';
const CREAM = '#FFF7ED';
const DARK = '#1F2937';
const BLUE = '#2563EB';
const BLUE_DARK = '#1D4ED8';
const GOLD = '#FBBF24';
const BLUSH = '#FDBA74';

const Star: React.FC<{ x: number; y: number; phase: number; frame: number; fps: number }> = ({
  x,
  y,
  phase,
  frame,
  fps,
}) => {
  const pop = 0.4 + 0.6 * Math.abs(Math.sin(((frame / fps) * 2 + phase) * Math.PI));
  const rot = (frame / fps) * 40 + phase * 90;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${pop})`}
      opacity={pop}
    >
      <path
        d="M 0 -34 L 9 -9 L 34 0 L 9 9 L 0 34 L -9 9 L -34 0 L -9 -9 Z"
        fill={GOLD}
      />
    </g>
  );
};

export const LingoFox: React.FC<{
  mood?: LingoMood;
  scale?: number;
  frame?: number;
}> = ({ mood = 'idle', scale = 1, frame }) => {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame ?? currentFrame;

  // ---- Blink (every 2.4s) ----
  const cycle = t % Math.round(fps * 2.4);
  const blinkScale =
    cycle < 3
      ? 1 - (cycle / 3) * 0.9
      : cycle < 5
        ? 0.1
        : cycle < 8
          ? 0.1 + ((cycle - 5) / 3) * 0.9
          : 1;

  // ---- Breathing ----
  const breathe = 1 + Math.sin((t / fps) * Math.PI * 2 * 0.8) * 0.015;

  // ---- Bounce ----
  const bounce =
    mood === 'excited'
      ? Math.abs(Math.sin((t / fps) * Math.PI * 3)) * 40
      : Math.abs(Math.sin((t / fps) * Math.PI * 2)) * 8;

  // ---- Tail wag ----
  const wag = Math.sin((t / fps) * Math.PI * 2 * (mood === 'talking' ? 3 : 2)) * 14;

  // ---- Ear wiggle ----
  const earWiggle = mood === 'happy' ? Math.sin((t / fps) * Math.PI * 2 * 4) * 7 : 0;

  // ---- Mouth when talking ----
  const talkOpen = mood === 'talking' ? 0.5 + 0.5 * Math.abs(Math.sin((t / fps) * Math.PI * 6)) : 0;

  // ---- Arm wave when excited ----
  const wave = mood === 'excited' ? Math.sin((t / fps) * Math.PI * 2 * 3) * 25 : 0;

  // ---- Speech bubble ----
  const bubbleVisible = mood === 'happy' || mood === 'talking' || mood === 'excited';
  const bubblePop = mood === 'excited' ? 1 + 0.08 * Math.sin((t / fps) * Math.PI * 4) : 1;
  const dotPhases = [0, 0.33, 0.66];

  // ---- Tassel sway ----
  const tassel = Math.sin((t / fps) * Math.PI * 2 * 2) * 10;

  return (
    <svg viewBox="0 0 1000 1000" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <g transform={`translate(0 ${-bounce}) scale(${scale * breathe} ${scale * breathe} 500 500)`}>
        {/* ---------- Tail ---------- */}
        <g transform={`rotate(${wag} 250 760)`}>
          <path
            d="M 250 760 Q 90 730 110 560 Q 120 470 220 520 Q 300 565 280 700 Z"
            fill={ORANGE_DARK}
            stroke={ORANGE}
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path
            d="M 132 590 Q 122 530 190 528 Q 235 533 225 568 Q 170 555 132 590 Z"
            fill={CREAM}
          />
        </g>

        {/* ---------- Feet ---------- */}
        <ellipse cx="410" cy="920" rx="70" ry="40" fill={ORANGE_DEEP} />
        <ellipse cx="590" cy="920" rx="70" ry="40" fill={ORANGE_DEEP} />

        {/* ---------- Body ---------- */}
        <ellipse cx="500" cy="770" rx="205" ry="165" fill={ORANGE} />
        <ellipse cx="500" cy="795" rx="135" ry="105" fill={CREAM} />

        {/* ---------- Arms ---------- */}
        <g transform={`rotate(${mood === 'excited' ? -wave : 6} 330 740)`}>
          <ellipse cx="330" cy="740" rx="45" ry="80" fill={ORANGE_DARK} />
        </g>
        <g transform={`rotate(${mood === 'excited' ? wave : -6} 670 740)`}>
          <ellipse cx="670" cy="740" rx="45" ry="80" fill={ORANGE_DARK} />
        </g>

        {/* ---------- Head ---------- */}
        <g>
          {/* Ears */}
          <g transform={`rotate(${-earWiggle} 330 210)`}>
            <path
              d="M 350 240 L 270 70 L 420 150 Z"
              fill={ORANGE}
              stroke={ORANGE_DARK}
              strokeWidth="8"
              strokeLinejoin="round"
            />
            <path d="M 335 205 L 295 110 L 385 160 Z" fill={DARK} />
          </g>
          <g transform={`rotate(${earWiggle} 670 210)`}>
            <path
              d="M 650 240 L 730 70 L 580 150 Z"
              fill={ORANGE}
              stroke={ORANGE_DARK}
              strokeWidth="8"
              strokeLinejoin="round"
            />
            <path d="M 665 205 L 705 110 L 615 160 Z" fill={DARK} />
          </g>

          {/* Face */}
          <path
            d="M 500 170 C 650 180 760 270 760 420 C 760 560 640 620 500 620 C 360 620 240 560 240 420 C 240 270 350 180 500 170 Z"
            fill={ORANGE}
            stroke={ORANGE_DARK}
            strokeWidth="10"
            strokeLinejoin="round"
          />

          {/* White lower face */}
          <ellipse cx="500" cy="535" rx="185" ry="120" fill={CREAM} />

          {/* Eyes (blink) */}
          <g transform={`scale(1 ${blinkScale} 420 400)`}>
            <circle cx="410" cy="400" r="30" fill={DARK} />
            <circle cx="420" cy="390" r="10" fill="#FFFFFF" />
          </g>
          <g transform={`scale(1 ${blinkScale} 590 400)`}>
            <circle cx="590" cy="400" r="30" fill={DARK} />
            <circle cx="600" cy="390" r="10" fill="#FFFFFF" />
          </g>

          {/* Blush when happy/excited */}
          {(mood === 'happy' || mood === 'excited') && (
            <>
              <ellipse cx="330" cy="470" rx="34" ry="18" fill={BLUSH} opacity="0.8" />
              <ellipse cx="670" cy="470" rx="34" ry="18" fill={BLUSH} opacity="0.8" />
            </>
          )}

          {/* Nose */}
          <path
            d="M 478 505 Q 500 542 522 505 Q 500 482 478 505 Z"
            fill={DARK}
          />

          {/* Mouth */}
          {talkOpen > 0 ? (
            <ellipse cx="500" cy="560" rx="20" ry={6 + talkOpen * 24} fill={ORANGE_DEEP} />
          ) : (
            <path
              d="M 458 545 Q 500 580 542 545"
              fill="none"
              stroke={DARK}
              strokeWidth="9"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* ---------- Graduation cap ---------- */}
        <g transform={`translate(0 ${Math.sin((t / fps) * Math.PI * 2) * 4})`}>
          <path d="M 500 120 L 640 165 L 500 210 L 360 165 Z" fill={BLUE} />
          <path d="M 360 165 L 500 210 L 500 230 L 360 185 Z" fill={BLUE_DARK} />
          <path d="M 640 165 L 500 210 L 500 230 L 640 185 Z" fill={BLUE_DARK} />
          <circle cx="500" cy="120" r="18" fill={BLUE_DARK} />
          <g transform={`rotate(${tassel} 640 165)`} style={{ transformOrigin: '640px 165px' }}>
            <path
              d="M 640 165 Q 700 175 700 205"
              fill="none"
              stroke={GOLD}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="700" cy="208" r="9" fill={GOLD} />
          </g>
        </g>

        {/* ---------- Speech bubble ---------- */}
        {bubbleVisible && (
          <g
            transform={`translate(700 100) scale(${bubblePop} ${bubblePop})`}
            style={{ transformOrigin: '820px 170px' }}
          >
            <path
              d="M 20 10 H 220 Q 260 10 260 50 V 110 Q 260 150 220 150 H 150 L 115 190 L 105 150 H 20 Q -20 150 -20 110 V 50 Q -20 10 20 10 Z"
              fill="#FFFFFF"
              stroke={ORANGE}
              strokeWidth="10"
            />
            {dotPhases.map((p, i) => {
              const d = Math.abs(Math.sin(((t / fps) * 2 + p) * Math.PI * 2));
              return (
                <circle
                  key={i}
                  cx={20 + i * 55}
                  cy={85 + d * 18}
                  r="17"
                  fill={ORANGE}
                />
              );
            })}
          </g>
        )}

        {/* ---------- Sparkles when excited ---------- */}
        {mood === 'excited' && (
          <>
            <Star x={170} y={240} phase={0} frame={t} fps={fps} />
            <Star x={840} y={260} phase={0.5} frame={t} fps={fps} />
            <Star x={150} y={520} phase={1} frame={t} fps={fps} />
            <Star x={860} y={500} phase={1.5} frame={t} fps={fps} />
          </>
        )}
      </g>
    </svg>
  );
};