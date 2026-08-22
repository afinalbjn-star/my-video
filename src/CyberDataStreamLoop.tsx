import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';

const STREAM_COUNT = 90;
const PARTICLES_PER_STREAM = 40;
const STREAM_HEIGHT = 46;
const GRID_EXTENT = 44;
const GRID_DEPTH = 70;
const GRID_HEIGHT_WALL = 26;
const GRID_SEGMENTS = 17;
const GLOW_COUNT = 360;
const CORE_BOKEH_COUNT = 9;
const BG_ORB_COUNT = 14;
const FG_ORB_COUNT = 9;

function mulberry32(a: number) {
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const PALETTE = [
  new THREE.Color('#4aa8ff'),
  new THREE.Color('#6ee7ff'),
  new THREE.Color('#b26bff'),
  new THREE.Color('#e879f9'),
];

const ORB_COLORS = [
  'rgba(90, 160, 255, 0.85)',
  'rgba(148, 197, 255, 0.8)',
  'rgba(178, 107, 255, 0.8)',
  'rgba(232, 121, 249, 0.6)',
  'rgba(110, 231, 255, 0.75)',
];

type OrbCfg = {
  baseX: number;
  baseY: number;
  dx: number;
  dy: number;
  px: number;
  py: number;
  sx: number;
  sy: number;
  sop: number;
  pop: number;
  size: number;
  ratio: number;
  blur: number;
  color: string;
  o: number;
  oa: number;
};

const makeOrb = (fg: boolean, rng: () => number): OrbCfg => {
  const size = fg
    ? 220 + rng() * 420
    : 90 + rng() * 180;
  return {
    baseX: 6 + rng() * 88,
    baseY: 6 + rng() * 88,
    dx: 4 + rng() * 9,
    dy: 3 + rng() * 7,
    px: rng() * Math.PI * 2,
    py: rng() * Math.PI * 2,
    sx: 1 + Math.floor(rng() * 3),
    sy: 1 + Math.floor(rng() * 3),
    sop: 1 + Math.floor(rng() * 2),
    pop: rng() * Math.PI * 2,
    size,
    ratio: 1.6 + rng() * 0.5,
    blur: fg ? 26 + rng() * 40 : 8 + rng() * 18,
    color: ORB_COLORS[Math.floor(rng() * ORB_COLORS.length)],
    o: fg ? 0.28 + rng() * 0.3 : 0.18 + rng() * 0.24,
    oa: 0.08 + rng() * 0.1,
  };
};

export const CyberDataStreamLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const t = frame / durationInFrames;
  const angle = t * Math.PI * 2;

  const {
    scene,
    camera,
    streamPositions,
    streamBaseY,
    streamPositionAttr,
    gridMaterial,
    glows,
    coreBokeh,
    bgOrbs,
    fgOrbs,
  } = useMemo(() => {
    const rng = mulberry32(2024);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050114');

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 400);
    camera.position.set(0, 12, 38);
    camera.lookAt(0, 1, -18);

    scene.add(new THREE.AmbientLight('#8899cc', 0.5));

    const gridLinePositions: number[] = [];
    const gridStepX = (2 * GRID_EXTENT) / GRID_SEGMENTS;
    const gridStepZ = GRID_DEPTH / GRID_SEGMENTS;
    const gridStepY = GRID_HEIGHT_WALL / GRID_SEGMENTS;

    for (let i = 0; i <= GRID_SEGMENTS; i++) {
      const z = -i * gridStepZ;
      gridLinePositions.push(-GRID_EXTENT, 0, z, GRID_EXTENT, 0, z);
      const x = -GRID_EXTENT + i * gridStepX;
      gridLinePositions.push(x, 0, 0, x, 0, -GRID_DEPTH);
    }
    for (let i = 0; i <= GRID_SEGMENTS; i++) {
      const x = -GRID_EXTENT + i * gridStepX;
      gridLinePositions.push(x, 0, -GRID_DEPTH, x, GRID_HEIGHT_WALL, -GRID_DEPTH);
    }
    for (let i = 0; i <= GRID_SEGMENTS; i++) {
      const y = i * gridStepY;
      gridLinePositions.push(-GRID_EXTENT, y, -GRID_DEPTH, GRID_EXTENT, y, -GRID_DEPTH);
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(gridLinePositions), 3),
    );
    const gridMaterial = new THREE.LineBasicMaterial({
      color: '#2f6fbf',
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.LineSegments(gridGeo, gridMaterial));

    const streamPositions = new Float32Array(STREAM_COUNT * PARTICLES_PER_STREAM * 3);
    const streamColors = new Float32Array(STREAM_COUNT * PARTICLES_PER_STREAM * 3);
    const streamBaseY = new Float32Array(STREAM_COUNT * PARTICLES_PER_STREAM);

    for (let s = 0; s < STREAM_COUNT; s++) {
      const sx = (rng() * 2 - 1) * 32;
      const sz = (rng() * 2 - 1) * 26 - 30;
      const colorT = (s * 0.61803398875) % 1;
      const col = PALETTE[Math.floor(colorT * PALETTE.length) % PALETTE.length]
        .clone()
        .multiplyScalar(0.75 + rng() * 0.5);
      const phaseOffset = s * 0.137;
      for (let k = 0; k < PARTICLES_PER_STREAM; k++) {
        const idx = s * PARTICLES_PER_STREAM + k;
        const phi = (k / PARTICLES_PER_STREAM + phaseOffset) % 1;
        const y = phi * STREAM_HEIGHT - STREAM_HEIGHT / 2;
        streamPositions[idx * 3] = sx + (rng() - 0.5) * 0.7;
        streamPositions[idx * 3 + 1] = y;
        streamPositions[idx * 3 + 2] = sz + (rng() - 0.5) * 0.7;
        streamBaseY[idx] = y;
        const c = col.clone().multiplyScalar(0.7 + rng() * 0.6);
        streamColors[idx * 3] = c.r;
        streamColors[idx * 3 + 1] = c.g;
        streamColors[idx * 3 + 2] = c.b;
      }
    }

    const streamGeo = new THREE.BufferGeometry();
    const streamPositionAttr = new THREE.BufferAttribute(streamPositions, 3);
    streamGeo.setAttribute('position', streamPositionAttr);
    streamGeo.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));
    const streamMat = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(streamGeo, streamMat));

    const glowPositions = new Float32Array(GLOW_COUNT * 3);
    const glowColors = new Float32Array(GLOW_COUNT * 3);
    for (let i = 0; i < GLOW_COUNT; i++) {
      glowPositions[i * 3] = (rng() * 2 - 1) * 38;
      glowPositions[i * 3 + 1] = (rng() * 2 - 1) * 16;
      glowPositions[i * 3 + 2] = -rng() * 62 + 4;
      const mix = rng();
      const c = mix < 0.5
        ? new THREE.Color('#4aa8ff')
        : mix < 0.8
          ? new THREE.Color('#b26bff')
          : new THREE.Color('#dce8ff');
      const s = 0.4 + rng() * 0.9;
      glowColors[i * 3] = c.r * s;
      glowColors[i * 3 + 1] = c.g * s;
      glowColors[i * 3 + 2] = c.b * s;
    }
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
    const glowMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glows = new THREE.Points(glowGeo, glowMat);
    scene.add(glows);

    const corePositions = new Float32Array(CORE_BOKEH_COUNT * 3);
    const coreColors = new Float32Array(CORE_BOKEH_COUNT * 3);
    const coreSizes = new Float32Array(CORE_BOKEH_COUNT);
    for (let i = 0; i < CORE_BOKEH_COUNT; i++) {
      corePositions[i * 3] = (rng() * 2 - 1) * 20;
      corePositions[i * 3 + 1] = (rng() * 2 - 1) * 8;
      corePositions[i * 3 + 2] = -48 + rng() * 46;
      const c = i % 2 === 0 ? new THREE.Color('#6ee7ff') : new THREE.Color('#b26bff');
      const s = 1.4 + rng() * 0.8;
      coreColors[i * 3] = c.r * s;
      coreColors[i * 3 + 1] = c.g * s;
      coreColors[i * 3 + 2] = c.b * s;
      coreSizes[i] = 0.9 + rng() * 1.1;
    }
    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    coreGeo.setAttribute('color', new THREE.BufferAttribute(coreColors, 3));
    const coreMat = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreBokeh = new THREE.Points(coreGeo, coreMat);
    scene.add(coreBokeh);

    return {
      scene,
      camera,
      streamPositions,
      streamBaseY,
      streamPositionAttr,
      gridMaterial,
      glows,
      coreBokeh,
      bgOrbs: Array.from({ length: BG_ORB_COUNT }, () => makeOrb(false, rng)),
      fgOrbs: Array.from({ length: FG_ORB_COUNT }, () => makeOrb(true, rng)),
    };
  }, [width, height]);

  const flowShift = (t * STREAM_HEIGHT) % STREAM_HEIGHT;
  for (let i = 0; i < STREAM_COUNT * PARTICLES_PER_STREAM; i++) {
    const y =
      ((streamBaseY[i] + STREAM_HEIGHT / 2 + flowShift) % STREAM_HEIGHT) -
      STREAM_HEIGHT / 2;
    streamPositions[i * 3 + 1] = y;
  }
  streamPositionAttr.needsUpdate = true;

  const glowPos = glows.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < GLOW_COUNT; i++) {
    const baseX = glowPos[i * 3];
    const baseY = glowPos[i * 3 + 1];
    const baseZ = glowPos[i * 3 + 2];
    const phase = (i % 7) * 0.9;
    glowPos[i * 3] = baseX + Math.sin(angle * 1 + phase) * 0.9;
    glowPos[i * 3 + 1] = baseY + Math.sin(angle * 2 + phase) * 1.3;
    glowPos[i * 3 + 2] = baseZ + Math.cos(angle * 1 + phase) * 1.1;
  }
  glows.geometry.attributes.position.needsUpdate = true;

  const corePos = coreBokeh.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < CORE_BOKEH_COUNT; i++) {
    const phase = i * 1.7;
    corePos[i * 3] += Math.sin(angle * 1 + phase) * 0.004;
    corePos[i * 3 + 1] += Math.cos(angle * 1 + phase) * 0.003;
  }
  coreBokeh.geometry.attributes.position.needsUpdate = true;

  gridMaterial.opacity = 0.3 + Math.sin(angle) * 0.09;

  const camAngle = angle;
  camera.position.set(
    Math.cos(camAngle) * 36,
    12 + Math.sin(angle * 2) * 1.4,
    Math.sin(camAngle) * 36,
  );
  camera.lookAt(0, 1, -18);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050114' }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, #10123a 0%, #07081c 48%, #02020c 100%)',
        }}
      />
      <AbsoluteFill>
        <ThreeCanvas
          width={width}
          height={height}
          scene={scene}
          camera={camera}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            powerPreference: 'high-performance',
          }}
        >
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.55}
              luminanceSmoothing={0.9}
              height={300}
              intensity={1.25}
            />
            <DepthOfField
              focusDistance={0.03}
              focalLength={0.045}
              bokehScale={3.4}
              height={480}
            />
          </EffectComposer>
        </ThreeCanvas>
      </AbsoluteFill>

      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {bgOrbs.map((orb, i) => {
          const cx = orb.baseX + Math.sin(angle * orb.sx + orb.px) * orb.dx;
          const cy = orb.baseY + Math.cos(angle * orb.sy + orb.py) * orb.dy;
          return (
            <div
              key={`bg-${i}`}
              style={{
                position: 'absolute',
                left: `${cx}%`,
                top: `${cy}%`,
                width: orb.size,
                height: orb.size * orb.ratio,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(ellipse at center, ${orb.color} 0%, transparent 70%)`,
                filter: `blur(${orb.blur}px)`,
                opacity: Math.max(0, orb.o + orb.oa * Math.sin(angle * orb.sop + orb.pop)),
                mixBlendMode: 'screen',
              }}
            />
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(84,104,255,0.16) 0%, rgba(147,51,234,0.1) 46%, rgba(2,2,10,0.92) 100%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.82) 100%)',
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {fgOrbs.map((orb, i) => {
          const cx = orb.baseX + Math.sin(angle * orb.sx + orb.px) * orb.dx;
          const cy = orb.baseY + Math.cos(angle * orb.sy + orb.py) * orb.dy;
          return (
            <div
              key={`fg-${i}`}
              style={{
                position: 'absolute',
                left: `${cx}%`,
                top: `${cy}%`,
                width: orb.size,
                height: orb.size * orb.ratio,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(ellipse at center, ${orb.color} 0%, transparent 72%)`,
                filter: `blur(${orb.blur}px)`,
                opacity: Math.max(0, orb.o + orb.oa * Math.sin(angle * orb.sop + orb.pop)),
                mixBlendMode: 'screen',
              }}
            />
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: `${62 + Math.sin(angle) * 3}%`,
            top: '16%',
            width: '55%',
            height: 6,
            transform: 'rotate(-10deg)',
            transformOrigin: 'left center',
            background:
              'linear-gradient(90deg, rgba(4,60,120,0) 0%, rgba(64,140,255,0.35) 22%, rgba(150,200,255,0.75) 50%, rgba(150,120,255,0.5) 72%, rgba(4,60,120,0) 100%)',
            filter: 'blur(3px)',
            opacity: 0.5 + 0.2 * Math.sin(angle * 2 + 1),
            mixBlendMode: 'screen',
          }}
        />
        {[0, 1, 2].map((g) => (
          <div
            key={`ghost-${g}`}
            style={{
              position: 'absolute',
              left: `${74 + g * 7 + Math.sin(angle + g) * 1.5}%`,
              top: `${17 + g * 1.4 + Math.cos(angle * 2 + g) * 1}%`,
              width: 22 + g * 16,
              height: (22 + g * 16) * 0.5,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              background:
                g === 1
                  ? 'radial-gradient(ellipse at center, rgba(178,107,255,0.55) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at center, rgba(110,231,255,0.5) 0%, transparent 70%)',
              filter: 'blur(4px)',
              opacity: 0.28 + 0.12 * Math.sin(angle * 3 + g * 2),
              mixBlendMode: 'screen',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: '22%',
            top: '72%',
            width: '38%',
            height: 4,
            transform: 'rotate(7deg)',
            transformOrigin: 'right center',
            background:
              'linear-gradient(90deg, rgba(4,60,120,0) 0%, rgba(90,150,255,0.28) 55%, rgba(4,60,120,0) 100%)',
            filter: 'blur(3px)',
            opacity: 0.4 + 0.15 * Math.sin(angle * 1 + 2),
            mixBlendMode: 'screen',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default CyberDataStreamLoop;
