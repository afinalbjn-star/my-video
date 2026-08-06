import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

/* ============================================================================
 * AI BRAIN — SEAMLESS LOOPING TECHNOLOGY BACKGROUND
 * ----------------------------------------------------------------------------
 * Sebuah komposisi Remotion yang menghasilkan animasi latar belakang bertema
 * teknologi / AI berupa "otak digital" (neural wireframe) yang berputar,
 * berdenyut, dan dikelilingi oleh ring data, partikel orbit, starfield, dan
 * overlay HUD bergaya sci-fi.
 *
 * PRINSIP SEAMLESS LOOP:
 * Semua animasi diturunkan dari satu variabel sudut global `theta`, yang
 * bergerak dari 0 -> 2*PI tepat selama durasi komposisi. Karena fungsi
 * trigonometri (sin/cos) bersifat periodik dengan periode 2*PI, maka SETIAP
 * turunan animasi yang memakai kelipatan bulat dari theta (theta*1, theta*2,
 * theta*3, dst.) akan otomatis kembali ke nilai identik saat theta = 0 dan
 * theta = 2*PI. Alhasil frame terakhir video akan menyambung sempurna ke
 * frame pertama tanpa "patahan" (jump cut), menghasilkan loop yang mulus.
 *
 * LAYER (dari belakang ke depan) — untuk kesan kedalaman / 3D:
 *  1. Background gradient nebula
 *  2. Starfield (bintang jauh, paralaks lambat)
 *  3. Outer data rings (cincin data berputar, elips untuk kesan 3D)
 *  4. Core glow (cahaya inti otak, berdenyut)
 *  5. Brain wireframe (edges lalu nodes, diberi shading berdasar kedalaman Z)
 *  6. Orbiting data particles (partikel data yang mengorbit otak)
 *  7. Scanline / HUD grid overlay (kesan interface teknologi)
 *  8. Vignette (penggelapan tepi agar fokus ke tengah)
 * ==========================================================================*/

// ---------------------------------------------------------------------------
// KONFIGURASI KOMPOSISI
// ---------------------------------------------------------------------------

export const COMPOSITION_FPS = 60;
export const COMPOSITION_DURATION_SECONDS = 10;
export const COMPOSITION_WIDTH = 3840; // 4K UHD
export const COMPOSITION_HEIGHT = 2160; // 4K UHD
export const COMPOSITION_DURATION_IN_FRAMES =
  COMPOSITION_FPS * COMPOSITION_DURATION_SECONDS;

// ---------------------------------------------------------------------------
// PALET WARNA TEMA TEKNOLOGI / AI
// ---------------------------------------------------------------------------

const PALETTE = {
  bgDeep: '#020302',
  bgMid: '#0b0e0b',
  bgTop: '#20251f',
  cyan: '#d9ff3f',
  cyanSoft: '#f6ffe8',
  blue: '#a9b1a5',
  violet: '#72ff52',
  magenta: '#ffd84a',
  white: '#f7f8f0',
  graphite: '#2c302b',
  smoke: '#6f766d',
  black: '#000000',
};

// ---------------------------------------------------------------------------
// UTILITAS MATEMATIKA DASAR
// ---------------------------------------------------------------------------

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, clamp(t, 0, 1));
};

/**
 * Generator angka acak deterministik (mulberry32).
 * Dipakai supaya posisi node / bintang tetap konsisten setiap render,
 * tapi tetap terlihat organik / acak.
 */
function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// TIPE DATA 3D
// ---------------------------------------------------------------------------

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface BrainNode {
  id: number;
  base: Point3D;
  phase: number; // offset fase untuk denyut individual (tetap periodik)
  layer: 'core' | 'cortex' | 'stem';
  size: number;
}

interface BrainEdge {
  a: number;
  b: number;
  seedOffset: number;
}

interface Projected {
  x: number;
  y: number;
  scale: number;
  depth: number; // -1 (paling belakang) .. 1 (paling depan)
}

// ---------------------------------------------------------------------------
// ROTASI & PROYEKSI 3D -> 2D (untuk memberi kesan kedalaman / 3D)
// ---------------------------------------------------------------------------

function rotatePoint(p: Point3D, rotX: number, rotY: number): Point3D {
  // Rotasi mengelilingi sumbu Y (kiri-kanan)
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = p.x * cosY + p.z * sinY;
  const z1 = -p.x * sinY + p.z * cosY;

  // Rotasi mengelilingi sumbu X (atas-bawah), untuk wobble halus
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y1 = p.y * cosX - z1 * sinX;
  const z2 = p.y * sinX + z1 * cosX;

  return { x: x1, y: y1, z: z2 };
}

function project3D(
  p: Point3D,
  centerX: number,
  centerY: number,
  focalLength: number,
  globalScale: number
): Projected {
  const perspective = focalLength / (focalLength + p.z);
  const x = centerX + p.x * perspective * globalScale;
  const y = centerY + p.y * perspective * globalScale;
  const depth = clamp(p.z / 900, -1, 1);
  return { x, y, scale: perspective, depth };
}

// ---------------------------------------------------------------------------
// GENERATOR STRUKTUR OTAK (NEURAL WIREFRAME)
// ---------------------------------------------------------------------------

/**
 * Menghasilkan titik-titik menyerupai otak menggunakan distribusi
 * Fibonacci-sphere pada dua "lobus" (kiri & kanan) yang sedikit
 * dipisahkan dan diberi lekukan tengah, ditambah inti kecil di dalam
 * dan "batang otak" di bawah — supaya siluetnya terasa organik,
 * bukan sekadar bola sempurna.
 */
function fibonacciSphere(count: number, radius: number): Point3D[] {
  const points: Point3D[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // dari 1 ke -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    points.push({ x: x * radius, y: y * radius, z: z * radius });
  }
  return points;
}

function deformIntoBrainShape(p: Point3D): Point3D {
  // Pisahkan dua hemisfer dengan celah tengah (fisura longitudinal)
  const hemisphereSign = p.x >= 0 ? 1 : -1;
  const gapPush = hemisphereSign * 26;

  // Lekukan / girus semu memakai gabungan gelombang sinus multi-frekuensi
  const wrinkle =
    Math.sin(p.y * 0.045 + p.z * 0.05) * 18 +
    Math.sin(p.x * 0.08 + p.y * 0.03) * 12 +
    Math.sin(p.z * 0.06 - p.x * 0.02) * 10;

  // Pipihkan sedikit bagian bawah agar menyerupai dasar otak
  const bottomFlatten = p.y > 60 ? (p.y - 60) * 0.35 : 0;

  return {
    x: p.x + gapPush + wrinkle * 0.4,
    y: p.y - bottomFlatten + wrinkle * 0.3,
    z: p.z + wrinkle * 0.6,
  };
}

interface BrainStructure {
  nodes: BrainNode[];
  edges: BrainEdge[];
}

function generateBrainStructure(seed: number): BrainStructure {
  const random = createSeededRandom(seed);
  const nodes: BrainNode[] = [];
  let idCounter = 0;

  // --- 1. Lapisan korteks luar (permukaan otak, paling banyak titik) ---
  const cortexPoints = fibonacciSphere(150, 260);
  for (const raw of cortexPoints) {
    const deformed = deformIntoBrainShape(raw);
    nodes.push({
      id: idCounter++,
      base: deformed,
      phase: random() * Math.PI * 2,
      layer: 'cortex',
      size: lerp(2.2, 4.2, random()),
    });
  }

  // --- 2. Lapisan inti dalam (core, lebih sedikit & lebih kecil) ---
  const corePoints = fibonacciSphere(48, 120);
  for (const raw of corePoints) {
    nodes.push({
      id: idCounter++,
      base: raw,
      phase: random() * Math.PI * 2,
      layer: 'core',
      size: lerp(1.6, 3, random()),
    });
  }

  // --- 3. Batang otak (stem) — kolom vertikal kecil di bawah ---
  const stemCount = 14;
  for (let i = 0; i < stemCount; i++) {
    const t = i / (stemCount - 1);
    nodes.push({
      id: idCounter++,
      base: {
        x: Math.sin(t * 6) * 10,
        y: 190 + t * 130,
        z: Math.cos(t * 6) * 10,
      },
      phase: random() * Math.PI * 2,
      layer: 'stem',
      size: lerp(1.8, 2.6, random()),
    });
  }

  // --- Bangun koneksi antar node terdekat (k-nearest, dibatasi jarak) ---
  const edges: BrainEdge[] = [];
  const maxDistance = 62;
  const maxEdgesPerNode = 4;

  for (let i = 0; i < nodes.length; i++) {
    const distances: { j: number; d: number }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].base.x - nodes[j].base.x;
      const dy = nodes[i].base.y - nodes[j].base.y;
      const dz = nodes[i].base.z - nodes[j].base.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < maxDistance) distances.push({ j, d });
    }
    distances.sort((a, b) => a.d - b.d);
    const picked = distances.slice(0, maxEdgesPerNode);
    for (const { j } of picked) {
      const already = edges.some(
        (e) => (e.a === i && e.b === j) || (e.a === j && e.b === i)
      );
      if (!already) {
        edges.push({ a: i, b: j, seedOffset: random() * Math.PI * 2 });
      }
    }
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// GENERATOR STARFIELD (bintang latar belakang jauh)
// ---------------------------------------------------------------------------

interface Star {
  x: number;
  y: number;
  r: number;
  baseOpacity: number;
  phase: number;
  speedMultiplier: number; // harus bilangan bulat agar tetap seamless loop
}

function generateStars(count: number, seed: number, width: number, height: number): Star[] {
  const random = createSeededRandom(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: random() * width,
      y: random() * height,
      r: lerp(0.6, 2.6, random()),
      baseOpacity: lerp(0.25, 0.9, random()),
      phase: random() * Math.PI * 2,
      speedMultiplier: Math.floor(lerp(1, 4, random())),
    });
  }
  return stars;
}

// ---------------------------------------------------------------------------
// GENERATOR PARTIKEL DATA YANG MENGORBIT OTAK
// ---------------------------------------------------------------------------

interface OrbitParticle {
  radiusX: number;
  radiusY: number;
  tilt: number;
  phase: number;
  orbitCount: number; // jumlah putaran penuh selama 1 loop (bilangan bulat)
  size: number;
  colorIndex: number;
}

interface GrowthFilament {
  originAngle: number;
  radiusStart: number;
  radiusEnd: number;
  phase: number;
  turns: number;
  segments: number;
  width: number;
  colorIndex: number;
  squash: number;
  drift: number;
}

function generateOrbitParticles(count: number, seed: number): OrbitParticle[] {
  const random = createSeededRandom(seed);
  const particles: OrbitParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      radiusX: lerp(320, 620, random()),
      radiusY: lerp(120, 260, random()),
      tilt: random() * Math.PI,
      phase: random() * Math.PI * 2,
      orbitCount: Math.floor(lerp(1, 3, random())) || 1,
      size: lerp(2, 5, random()),
      colorIndex: Math.floor(random() * 3),
    });
  }
  return particles;
}

function generateGrowthFilaments(count: number, seed: number): GrowthFilament[] {
  const random = createSeededRandom(seed);
  const filaments: GrowthFilament[] = [];
  for (let i = 0; i < count; i++) {
    filaments.push({
      originAngle: random() * Math.PI * 2,
      radiusStart: lerp(150, 280, random()),
      radiusEnd: lerp(520, 920, random()),
      phase: random() * Math.PI * 2,
      turns: lerp(0.35, 1.35, random()) * (random() > 0.5 ? 1 : -1),
      segments: 16 + Math.floor(random() * 12),
      width: lerp(0.8, 2.2, random()),
      colorIndex: Math.floor(random() * 4),
      squash: lerp(0.34, 0.68, random()),
      drift: lerp(-0.24, 0.24, random()),
    });
  }
  return filaments;
}

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 1 — BACKGROUND GRADIENT NEBULA
// ---------------------------------------------------------------------------

const BackgroundLayer: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => (
  <rect x={0} y={0} width={width} height={height} fill="url(#bgGradient)" />
);

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 2 — STARFIELD
// ---------------------------------------------------------------------------

const StarfieldLayer: React.FC<{
  stars: Star[];
  theta: number;
  centerX: number;
  centerY: number;
}> = ({ stars, theta, centerX, centerY }) => {
  // Rotasi lambat & sedikit "napas" opasitas per bintang, tetap periodik
  const rotationDeg = (theta / (Math.PI * 2)) * 8 * 360;
  return (
    <g
      transform={`rotate(${rotationDeg} ${centerX} ${centerY})`}
      opacity={0.85}
    >
      {stars.map((star, i) => {
        const twinkle =
          0.5 + 0.5 * Math.sin(theta * star.speedMultiplier + star.phase);
        const opacity = star.baseOpacity * mapRange(twinkle, 0, 1, 0.35, 1);
        return (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={PALETTE.white}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 3 — OUTER DATA RINGS
// ---------------------------------------------------------------------------

const OuterRingsLayer: React.FC<{
  theta: number;
  centerX: number;
  centerY: number;
}> = ({ theta, centerX, centerY }) => {
  const rings = [
    { radius: 560, thickness: 2, speed: 1, dash: '2 14', color: PALETTE.cyan },
    { radius: 660, thickness: 1.4, speed: -1, dash: '10 6', color: PALETTE.violet },
    { radius: 760, thickness: 1, speed: 2, dash: '1 8', color: PALETTE.magenta },
    { radius: 860, thickness: 1.2, speed: -2, dash: '18 10', color: PALETTE.blue },
  ];

  return (
    <g>
      {rings.map((ring, i) => {
        // Elips (bukan lingkaran sempurna) untuk memberi kesan cincin 3D miring
        const squash = 0.32 + 0.05 * Math.sin(theta + i);
        const rotationDeg = ((theta * ring.speed) / (Math.PI * 2)) * 360;
        const dashOffset =
          ((theta * ring.speed) / (Math.PI * 2)) * ring.radius * 2;
        return (
          <g
            key={i}
            transform={`translate(${centerX} ${centerY}) rotate(${rotationDeg})`}
          >
            <ellipse
              cx={0}
              cy={0}
              rx={ring.radius}
              ry={ring.radius * squash}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.thickness}
              strokeDasharray={ring.dash}
              strokeDashoffset={dashOffset}
              opacity={0.55}
            />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 4 — CORE GLOW (cahaya inti otak yang berdenyut)
// ---------------------------------------------------------------------------

const CoreGlowLayer: React.FC<{
  theta: number;
  centerX: number;
  centerY: number;
}> = ({ theta, centerX, centerY }) => {
  const pulse = 1 + 0.12 * Math.sin(theta * 2);
  const radius = 260 * pulse;
  return (
    <circle
      cx={centerX}
      cy={centerY}
      r={radius}
      fill="url(#coreGlowGradient)"
      opacity={0.75}
    />
  );
};

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 5 — BRAIN WIREFRAME (edges + nodes, dengan shading kedalaman)
// ---------------------------------------------------------------------------

const BrainWireframeLayer: React.FC<{
  structure: BrainStructure;
  theta: number;
  centerX: number;
  centerY: number;
  focalLength: number;
  globalScale: number;
}> = ({ structure, theta, centerX, centerY, focalLength, globalScale }) => {
  const rotY = theta; // satu putaran penuh selama durasi -> seamless
  const rotX = Math.sin(theta) * 0.18; // wobble halus, tetap periodik
  const breathing = 1 + 0.035 * Math.sin(theta * 2);

  const projectedNodes = useMemo(() => {
    return structure.nodes.map((node) => {
      const scaled: Point3D = {
        x: node.base.x * breathing,
        y: node.base.y * breathing,
        z: node.base.z * breathing,
      };
      const rotated = rotatePoint(scaled, rotX, rotY);
      const projected = project3D(
        rotated,
        centerX,
        centerY,
        focalLength,
        globalScale
      );
      return { node, projected };
    });
  }, [
    breathing,
    centerX,
    centerY,
    focalLength,
    globalScale,
    rotX,
    rotY,
    structure,
  ]);

  const colorForLayer = (layer: BrainNode['layer']): string => {
    if (layer === 'core') return PALETTE.magenta;
    if (layer === 'stem') return PALETTE.blue;
    return PALETTE.cyan;
  };

  return (
    <g>
      {/* --- EDGES (garis koneksi neural) --- */}
      <g>
        {structure.edges.map((edge, i) => {
          const pa = projectedNodes[edge.a];
          const pb = projectedNodes[edge.b];
          if (!pa || !pb) return null;
          const avgDepth = (pa.projected.depth + pb.projected.depth) / 2;
          const baseOpacity = mapRange(avgDepth, -1, 1, 0.06, 0.5);
          const pulse =
            0.5 + 0.5 * Math.sin(theta * 3 + edge.seedOffset);
          const opacity = baseOpacity * mapRange(pulse, 0, 1, 0.5, 1);
          return (
            <line
              key={i}
              x1={pa.projected.x}
              y1={pa.projected.y}
              x2={pb.projected.x}
              y2={pb.projected.y}
              stroke={PALETTE.cyanSoft}
              strokeWidth={mapRange(avgDepth, -1, 1, 0.5, 1.6)}
              opacity={opacity}
            />
          );
        })}
      </g>

      {/* --- NODES (simpul neuron) --- */}
      <g>
        {projectedNodes
          // Urutkan dari belakang ke depan supaya overlap terlihat benar (kesan 3D)
          .slice()
          .sort((a, b) => a.projected.depth - b.projected.depth)
          .map(({ node, projected }) => {
            const pulse = 0.5 + 0.5 * Math.sin(theta * 3 + node.phase);
            const sizeMultiplier = mapRange(pulse, 0, 1, 0.75, 1.4);
            const depthScale = mapRange(projected.depth, -1, 1, 0.55, 1.3);
            const finalRadius = node.size * sizeMultiplier * depthScale;
            const opacity = mapRange(projected.depth, -1, 1, 0.35, 1);
            const color = colorForLayer(node.layer);
            return (
              <circle
                key={node.id}
                cx={projected.x}
                cy={projected.y}
                r={finalRadius}
                fill={color}
                opacity={opacity}
                style={{ filter: 'url(#nodeGlow)' }}
              />
            );
          })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 6 — ORBITING DATA PARTICLES
// ---------------------------------------------------------------------------

const EvolvingSynapseLayer: React.FC<{
  filaments: GrowthFilament[];
  theta: number;
  centerX: number;
  centerY: number;
}> = ({ filaments, theta, centerX, centerY }) => {
  const colors = [PALETTE.magenta, PALETTE.violet, PALETTE.cyan, PALETTE.white];
  const thetaUnit = theta / (Math.PI * 2);

  return (
    <g style={{ filter: 'url(#filamentGlow)' }}>
      {filaments.map((filament, index) => {
        const points: string[] = [];
        const localSpin = theta * (0.12 + filament.drift);

        for (let segment = 0; segment <= filament.segments; segment++) {
          const t = segment / filament.segments;
          const bend =
            Math.sin(theta * 2 + filament.phase + t * Math.PI * 3) * 0.08;
          const angle =
            filament.originAngle +
            localSpin +
            filament.turns * t * Math.PI * 2 +
            bend;
          const radius =
            lerp(filament.radiusStart, filament.radiusEnd, t) +
            Math.sin(theta * 3 + filament.phase + t * 8) * 18;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius * filament.squash;
          points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        }

        const growthWave =
          0.5 + 0.5 * Math.sin(theta * 2 + filament.phase + index * 0.11);
        const opacity = mapRange(growthWave, 0, 1, 0.16, 0.62);
        const dashLength = 120 + filament.segments * 10;
        const dashGap = 34 + filament.colorIndex * 12;
        const dashOffset =
          -(thetaUnit * dashLength * (1 + filament.colorIndex * 0.3));

        return (
          <polyline
            key={index}
            points={points.join(' ')}
            fill="none"
            stroke={colors[filament.colorIndex]}
            strokeWidth={filament.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${dashLength} ${dashGap}`}
            strokeDashoffset={dashOffset}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
};

const OrbitingParticlesLayer: React.FC<{
  particles: OrbitParticle[];
  theta: number;
  centerX: number;
  centerY: number;
}> = ({ particles, theta, centerX, centerY }) => {
  const colors = [PALETTE.cyan, PALETTE.violet, PALETTE.magenta];

  return (
    <g>
      {particles.map((particle, i) => {
        const angle = theta * particle.orbitCount + particle.phase;
        const localX = Math.cos(angle) * particle.radiusX;
        const localY = Math.sin(angle) * particle.radiusY;

        // Miringkan orbit (tilt) agar tampak seperti lintasan elips 3D
        const cosT = Math.cos(particle.tilt);
        const sinT = Math.sin(particle.tilt);
        const x = centerX + localX * cosT - localY * sinT * 0.3;
        const y = centerY + localX * sinT * 0.5 + localY * cosT;

        // Kedalaman semu berdasarkan posisi sudut untuk efek melintas di
        // depan / belakang otak
        const depthFactor = Math.sin(angle);
        const scale = mapRange(depthFactor, -1, 1, 0.6, 1.3);
        const opacity = mapRange(depthFactor, -1, 1, 0.35, 1);

        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={particle.size * scale}
              fill={colors[particle.colorIndex]}
              opacity={opacity}
              style={{ filter: 'url(#particleGlow)' }}
            />
            {/* Ekor / trail halus */}
            <circle
              cx={x - Math.cos(angle) * 6}
              cy={y - Math.sin(angle) * 6}
              r={particle.size * scale * 0.5}
              fill={colors[particle.colorIndex]}
              opacity={opacity * 0.35}
            />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 7 — SCANLINE / HUD GRID OVERLAY
// ---------------------------------------------------------------------------

const ScanlineGridOverlay: React.FC<{
  theta: number;
  width: number;
  height: number;
}> = ({ theta, width, height }) => {
  const gridSpacing = 90;
  const columns = Math.ceil(width / gridSpacing);
  const rows = Math.ceil(height / gridSpacing);

  // Posisi garis scan vertikal yang bergerak dari atas ke bawah lalu
  // kembali ke 0 tepat saat theta menyelesaikan satu putaran -> seamless
  const scanY = (theta / (Math.PI * 2)) * height;
  const scanBeamPositions = [scanY - height, scanY, scanY + height];

  return (
    <g opacity={0.16}>
      {Array.from({ length: columns }).map((_, i) => (
        <line
          key={`col-${i}`}
          x1={i * gridSpacing}
          y1={0}
          x2={i * gridSpacing}
          y2={height}
          stroke={PALETTE.cyan}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: rows }).map((_, i) => (
        <line
          key={`row-${i}`}
          x1={0}
          y1={i * gridSpacing}
          x2={width}
          y2={i * gridSpacing}
          stroke={PALETTE.cyan}
          strokeWidth={1}
        />
      ))}
      {scanBeamPositions.map((beamY) => (
        <rect
          key={beamY}
          x={0}
          y={beamY - 60}
          width={width}
          height={120}
          fill="url(#scanBeamGradient)"
          opacity={0.5}
        />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// KOMPONEN LAYER 8 — VIGNETTE
// ---------------------------------------------------------------------------

const VignetteOverlay: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => (
  <rect x={0} y={0} width={width} height={height} fill="url(#vignetteGradient)" />
);

// ---------------------------------------------------------------------------
// DEFINISI GRADIENT & FILTER SVG
// ---------------------------------------------------------------------------

const SvgDefs: React.FC = () => (
  <defs>
    <radialGradient id="bgGradient" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stopColor={PALETTE.graphite} />
      <stop offset="38%" stopColor={PALETTE.bgTop} />
      <stop offset="68%" stopColor={PALETTE.bgMid} />
      <stop offset="100%" stopColor={PALETTE.bgDeep} />
    </radialGradient>

    <radialGradient id="coreGlowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={PALETTE.cyanSoft} stopOpacity={0.9} />
      <stop offset="35%" stopColor={PALETTE.blue} stopOpacity={0.45} />
      <stop offset="100%" stopColor={PALETTE.blue} stopOpacity={0} />
    </radialGradient>

    <linearGradient id="scanBeamGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={PALETTE.cyan} stopOpacity={0} />
      <stop offset="50%" stopColor={PALETTE.cyan} stopOpacity={0.9} />
      <stop offset="100%" stopColor={PALETTE.cyan} stopOpacity={0} />
    </linearGradient>

    <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#000000" stopOpacity={0.85} />
    </radialGradient>

    <filter id="nodeGlow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="particleGlow" x="-300%" y="-300%" width="700%" height="700%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="filamentGlow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="2.4" result="softFilament" />
      <feColorMatrix
        in="softFilament"
        type="matrix"
        values="1.2 0 0 0 0  0 1.4 0 0 0  0 0 0.55 0 0  0 0 0 0.85 0"
        result="coloredFilament"
      />
      <feMerge>
        <feMergeNode in="coloredFilament" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA: AIBrainBackground
// ---------------------------------------------------------------------------

export const AIBrainBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Sudut global theta: 0 -> 2*PI selama seluruh durasi video.
  // Inilah "jam utama" yang membuat semua animasi seamless-loop.
  const theta = (frame / durationInFrames) * Math.PI * 2;

  const centerX = width / 2;
  const centerY = height / 2 - height * 0.02;
  const focalLength = width * 0.55;
  const globalScale = width / 1600;

  // Data generatif dibuat sekali saja (deterministik via seed) agar
  // stabil di setiap frame dan tidak dihitung ulang tiap render.
  const brainStructure = useMemo(() => generateBrainStructure(1337), []);
  const stars = useMemo(
    () => generateStars(320, 42, width, height),
    [width, height]
  );
  const orbitParticles = useMemo(() => generateOrbitParticles(46, 7), []);
  const growthFilaments = useMemo(() => generateGrowthFilaments(58, 2026), []);

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.bgDeep }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block' }}
      >
        <SvgDefs />

        <BackgroundLayer width={width} height={height} />

        <StarfieldLayer
          stars={stars}
          theta={theta}
          centerX={centerX}
          centerY={centerY}
        />

        <OuterRingsLayer theta={theta} centerX={centerX} centerY={centerY} />

        <CoreGlowLayer theta={theta} centerX={centerX} centerY={centerY} />

        <BrainWireframeLayer
          structure={brainStructure}
          theta={theta}
          centerX={centerX}
          centerY={centerY}
          focalLength={focalLength}
          globalScale={globalScale}
        />

        <EvolvingSynapseLayer
          filaments={growthFilaments}
          theta={theta}
          centerX={centerX}
          centerY={centerY}
        />

        <OrbitingParticlesLayer
          particles={orbitParticles}
          theta={theta}
          centerX={centerX}
          centerY={centerY}
        />

        <ScanlineGridOverlay theta={theta} width={width} height={height} />

        <VignetteOverlay width={width} height={height} />
      </svg>
    </AbsoluteFill>
  );
};

export default AIBrainBackground;
