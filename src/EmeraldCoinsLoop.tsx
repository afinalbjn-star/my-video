import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';

const COLUMNS = 12;
const DISCS_PER_COLUMN = 8;
const COLUMN_RADIUS = 18;
const COLUMN_HEIGHT = 24;
const DISC_MIN_RADIUS = 0.8;
const DISC_MAX_RADIUS = 1.6;
const DISC_THICKNESS = 0.15;
const GLOW_PARTICLES = 150;
const AMBIENT_PARTICLES = 80;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EMERALD_PALETTE = [
  new THREE.Color('#00ff88'),
  new THREE.Color('#00e676'),
  new THREE.Color('#69f0ae'),
  new THREE.Color('#a7ffcc'),
  new THREE.Color('#00d46e'),
];

const GLOW_COLORS = [
  'rgba(0, 255, 136, 0.9)',
  'rgba(0, 230, 118, 0.8)',
  'rgba(105, 240, 174, 0.7)',
  'rgba(167, 255, 204, 0.6)',
];

type DiscData = {
  columnIndex: number;
  discIndex: number;
  baseAngle: number;
  radius: number;
  thickness: number;
  y: number;
  color: THREE.Color;
  glowPhase: number;
  glowIntensity: number;
  spinSpeed: number;
  wobbleAmount: number;
  wobblePhase: number;
};

type GlowParticle = {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: string;
  size: number;
  phase: number;
  speed: number;
};

export const EmeraldCoinsLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const t = frame / durationInFrames;
  const angle = t * Math.PI * 2;

  const {
    scene,
    camera,
    discs,
    discMeshes,
    glowParticles,
    glowMesh,
    ambientParticles,
    discGroup,
  } = useMemo(() => {
    const rng = mulberry32(2024);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020503');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 0, 35);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight('#1a3a2a', 0.4));

    const keyLight = new THREE.PointLight('#00ff88', 2.5, 50, 2);
    keyLight.position.set(20, 15, 20);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight('#00e676', 1.8, 50, 2);
    fillLight.position.set(-18, -10, 15);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#a7ffcc', 1.2);
    rimLight.position.set(0, 10, -20);
    scene.add(rimLight);

    const discGroup = new THREE.Group();
    scene.add(discGroup);

    const discs: DiscData[] = [];
    const discMeshes: THREE.Mesh[] = [];

    for (let col = 0; col < COLUMNS; col++) {
      const colAngle = (col / COLUMNS) * Math.PI * 2;
      const colX = Math.cos(colAngle) * COLUMN_RADIUS;
      const colZ = Math.sin(colAngle) * COLUMN_RADIUS;

      for (let d = 0; d < DISCS_PER_COLUMN; d++) {
        const y = (d / (DISCS_PER_COLUMN - 1)) * COLUMN_HEIGHT - COLUMN_HEIGHT / 2;
        const radius = DISC_MIN_RADIUS + rng() * (DISC_MAX_RADIUS - DISC_MIN_RADIUS);
        const thickness = DISC_THICKNESS * (0.7 + rng() * 0.6);

        const colorT = (col * 0.61803398875 + d * 0.381966) % 1;
        const baseColor = EMERALD_PALETTE[Math.floor(colorT * EMERALD_PALETTE.length) % EMERALD_PALETTE.length]
          .clone()
          .multiplyScalar(0.7 + rng() * 0.5);

        const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 64, 1, true);
        const material = new THREE.MeshPhysicalMaterial({
          color: baseColor,
          metalness: 0.95,
          roughness: 0.08,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          reflectivity: 1.0,
          transmission: 0.1,
          thickness: 0.5,
          ior: 1.5,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(colX, y, colZ);
        mesh.rotation.x = Math.PI / 2;
        discGroup.add(mesh);

        const discData: DiscData = {
          columnIndex: col,
          discIndex: d,
          baseAngle: colAngle,
          radius,
          thickness,
          y,
          color: baseColor,
          glowPhase: rng() * Math.PI * 2,
          glowIntensity: 0.3 + rng() * 0.7,
          spinSpeed: 0.5 + rng() * 1.5,
          wobbleAmount: 0.02 + rng() * 0.05,
          wobblePhase: rng() * Math.PI * 2,
        };

        discs.push(discData);
        discMeshes.push(mesh);
      }
    }

    const glowPositions = new Float32Array(GLOW_PARTICLES * 3);
    const glowColors = new Float32Array(GLOW_PARTICLES * 3);
    const glowSizes = new Float32Array(GLOW_PARTICLES);
    const glowParticles: GlowParticle[] = [];

    for (let i = 0; i < GLOW_PARTICLES; i++) {
      const col = Math.floor(rng() * COLUMNS);
      const colAngle = (col / COLUMNS) * Math.PI * 2;
      const colX = Math.cos(colAngle) * COLUMN_RADIUS;
      const colZ = Math.sin(colAngle) * COLUMN_RADIUS;

      const baseX = colX + (rng() - 0.5) * 4;
      const baseY = (rng() * 2 - 1) * (COLUMN_HEIGHT / 2);
      const baseZ = colZ + (rng() - 0.5) * 4;

      glowPositions[i * 3] = baseX;
      glowPositions[i * 3 + 1] = baseY;
      glowPositions[i * 3 + 2] = baseZ;

      const color = GLOW_COLORS[Math.floor(rng() * GLOW_COLORS.length)];
      const c = new THREE.Color(color);
      const s = 0.5 + rng() * 1.2;
      glowColors[i * 3] = c.r * s;
      glowColors[i * 3 + 1] = c.g * s;
      glowColors[i * 3 + 2] = c.b * s;

      glowSizes[i] = 0.15 + rng() * 0.35;

      glowParticles.push({
        x: baseX,
        y: baseY,
        z: baseZ,
        baseX,
        baseY,
        baseZ,
        color,
        size: glowSizes[i],
        phase: rng() * Math.PI * 2,
        speed: 0.5 + rng() * 1.5,
      });
    }

    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
    glowGeo.setAttribute('size', new THREE.BufferAttribute(glowSizes, 1));

    const glowMat = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const glowMesh = new THREE.Points(glowGeo, glowMat);
    scene.add(glowMesh);

    const ambientPositions = new Float32Array(AMBIENT_PARTICLES * 3);
    const ambientColors = new Float32Array(AMBIENT_PARTICLES * 3);
    const ambientSizes = new Float32Array(AMBIENT_PARTICLES);

    for (let i = 0; i < AMBIENT_PARTICLES; i++) {
      ambientPositions[i * 3] = (rng() * 2 - 1) * 45;
      ambientPositions[i * 3 + 1] = (rng() * 2 - 1) * 25;
      ambientPositions[i * 3 + 2] = (rng() * 2 - 1) * 45 - 15;

      const c = EMERALD_PALETTE[Math.floor(rng() * EMERALD_PALETTE.length)].clone();
      const s = 0.2 + rng() * 0.4;
      ambientColors[i * 3] = c.r * s;
      ambientColors[i * 3 + 1] = c.g * s;
      ambientColors[i * 3 + 2] = c.b * s;

      ambientSizes[i] = 0.05 + rng() * 0.15;
    }

    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    ambientGeo.setAttribute('color', new THREE.BufferAttribute(ambientColors, 3));
    ambientGeo.setAttribute('size', new THREE.BufferAttribute(ambientSizes, 1));

    const ambientMat = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ambientMesh = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientMesh);

    return {
      scene,
      camera,
      discs,
      discMeshes,
      glowParticles,
      glowMesh,
      ambientParticles: { geometry: ambientGeo, material: ambientMat, mesh: ambientMesh },
      discGroup,
    };
  }, [width, height]);

  const glowPositions = glowMesh.geometry.attributes.position.array as Float32Array;
  const glowColors = glowMesh.geometry.attributes.color.array as Float32Array;

  for (let i = 0; i < glowParticles.length; i++) {
    const p = glowParticles[i];
    const spinAngle = angle * p.speed + p.phase;
    const wobbleX = Math.sin(spinAngle * 1.3) * 0.8;
    const wobbleY = Math.cos(spinAngle * 0.7) * 0.6;
    const wobbleZ = Math.sin(spinAngle * 1.1) * 0.7;

    glowPositions[i * 3] = p.baseX + wobbleX;
    glowPositions[i * 3 + 1] = p.baseY + wobbleY + Math.sin(angle * 2 + p.phase) * 0.5;
    glowPositions[i * 3 + 2] = p.baseZ + wobbleZ;

    const pulse = 0.7 + 0.3 * Math.sin(angle * 3 + p.phase * 2);
    const c = new THREE.Color(p.color);
    glowColors[i * 3] = c.r * p.size * pulse;
    glowColors[i * 3 + 1] = c.g * p.size * pulse;
    glowColors[i * 3 + 2] = c.b * p.size * pulse;
  }
  glowMesh.geometry.attributes.position.needsUpdate = true;
  glowMesh.geometry.attributes.color.needsUpdate = true;

  for (let i = 0; i < discs.length; i++) {
    const disc = discs[i];
    const mesh = discMeshes[i];

    const spinAngle = angle * disc.spinSpeed * Math.PI * 2 + disc.columnIndex * 0.5;
    mesh.rotation.z = spinAngle;

    const wobble = Math.sin(angle * 2 + disc.wobblePhase) * disc.wobbleAmount;
    mesh.rotation.y = wobble;
    mesh.rotation.x = Math.PI / 2 + Math.cos(angle * 1.5 + disc.wobblePhase) * disc.wobbleAmount * 0.5;

    const glowPulse = 0.85 + 0.15 * Math.sin(angle * 4 + disc.glowPhase);
    const emissiveIntensity = disc.glowIntensity * glowPulse;
    (mesh.material as THREE.MeshPhysicalMaterial).emissive = disc.color.clone().multiplyScalar(emissiveIntensity * 0.3);
    (mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = emissiveIntensity;

    const seqFlash = Math.sin(angle * 6 + disc.columnIndex * 0.8 + disc.discIndex * 0.3);
    if (seqFlash > 0.9) {
      const flashIntensity = (seqFlash - 0.9) * 10;
      (mesh.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color('#ffffff').multiplyScalar(flashIntensity * 0.8);
      (mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = flashIntensity;
    }
  }

  const ambientMesh = ambientParticles.mesh;
  const ambientPositions = ambientMesh.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < AMBIENT_PARTICLES; i++) {
    ambientPositions[i * 3 + 1] += Math.sin(angle * 0.5 + i * 0.1) * 0.01;
    ambientPositions[i * 3] += Math.cos(angle * 0.3 + i * 0.07) * 0.008;
  }
  ambientMesh.geometry.attributes.position.needsUpdate = true;

  const camRadius = 35;
  const camAngle = angle * 0.3;
  camera.position.set(
    Math.cos(camAngle) * camRadius,
    Math.sin(angle * 0.7) * 3,
    Math.sin(camAngle) * camRadius
  );
  camera.lookAt(0, Math.sin(angle * 0.5) * 2, 0);

  discGroup.rotation.y = angle * 0.15;

  return (
    <AbsoluteFill style={{ backgroundColor: '#020503' }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, #051a0d 0%, #020804 50%, #010301 100%)',
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
            toneMappingExposure: 1.3,
            powerPreference: 'high-performance',
          }}
        >
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.4}
              luminanceSmoothing={0.85}
              height={400}
              intensity={1.5}
            />
            <DepthOfField
              focusDistance={0.02}
              focalLength={0.04}
              bokehScale={4.0}
              height={480}
            />
          </EffectComposer>
        </ThreeCanvas>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.08) 0%, rgba(0, 100, 50, 0.04) 40%, rgba(0, 0, 0, 0.6) 100%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export default EmeraldCoinsLoop;