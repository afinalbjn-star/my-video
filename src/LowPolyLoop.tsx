/**
 * ============================================================================
 *  LOW-POLY CRYSTAL LOOP — Background video generatif untuk Remotion
 * ============================================================================
 *
 *  Apa ini?
 *  --------
 *  Komposisi Remotion yang me-render mesh segitiga "low-poly" bergaya kristal
 *  (terinspirasi gradasi merah/oranye di kiri, biru navy gelap di tengah, dan
 *  cyan/biru muda di kanan) yang bergerak halus dan LOOP SEMPURNA — frame
 *  terakhir menyambung mulus ke frame pertama tanpa jeda/lompatan.
 *
 *  Tidak ada aset eksternal sama sekali: semua bentuk, warna, gradasi, noise,
 *  dan partikel dibangun murni dari kode (SVG + CSS) menggunakan generator
 *  acak berbasis seed (deterministik) supaya hasil render selalu konsisten
 *  di setiap frame walau Remotion me-render tiap frame secara independen.
 *
 *  Kenapa loop-nya bisa mulus?
 *  ----------------------------
 *  SEMUA gerakan di file ini adalah fungsi periodik terhadap `loopT`
 *  (progres 0..1 dari total durasi), dan SETIAP frekuensi yang dipakai dalam
 *  argumen sin()/cos() adalah bilangan BULAT (integer harmonic). Karena
 *  sin(2π · n · 1 + fase) === sin(2π · n · 0 + fase) untuk n bulat berapa pun,
 *  maka nilai animasi di ujung durasi otomatis sama persis dengan nilai di
 *  awal durasi → tidak ada "patahan" saat video diputar berulang (looping).
 *
 *  Lapisan animasi yang digabung (6 sistem gerak independen):
 *   1. Getaran/jitter tiap titik mesh (organik, seperti kristal "bernapas")
 *   2. Kilau individual tiap segitiga (facet berkedip pelan, beda fase)
 *   3. Sapuan cahaya diagonal yang melintas satu kali penuh per loop (glint)
 *   4. Napas kamera: zoom & rotasi mikro pada seluruh mesh
 *   5. Cahaya orbit lembut (soft highlight) yang mengorbit dalam pola angka-8
 *   6. Partikel bintang kecil yang berkedip (twinkle) + sapuan sheen conic
 *
 *  Spesifikasi video:
 *   - Resolusi : 3840 x 2160 (4K UHD)
 *   - Frame rate: 60 fps
 *   - Durasi   : 10 detik (600 frame) — seamless loop
 *
 *  Cara pakai:
 *   1. `npm install`
 *   2. `npx remotion studio src/index.ts`  → preview & scrub timeline
 *   3. `npx remotion render src/index.ts LowPolyLoop out/video.mp4` → render
 *
 *  Semua konstanta yang bisa dikustomisasi dikumpulkan di bagian
 *  "PANDUAN KUSTOMISASI" di bawah — ubah nilainya lalu preview ulang.
 * ============================================================================
 */

import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

// ============================================================================
// 1. KONFIGURASI VIDEO (dipakai juga oleh Root.tsx untuk <Composition />)
// ============================================================================

export const VIDEO_WIDTH = 3840;
export const VIDEO_HEIGHT = 2160;
export const VIDEO_FPS = 60;
export const VIDEO_DURATION_IN_SECONDS = 10;
export const VIDEO_DURATION_IN_FRAMES = VIDEO_FPS * VIDEO_DURATION_IN_SECONDS;

// ============================================================================
// 2. PANDUAN KUSTOMISASI — ubah angka-angka ini untuk mengubah tampilan
// ============================================================================

/** Seed acak untuk mesh segitiga. Ganti angka ini → pola facet berubah total. */
const MESH_SEED = 1337;

/** Seed acak untuk partikel bintang/kerlip. */
const PARTICLE_SEED = 4242;

/** Jumlah kolom & baris grid dasar sebelum di-jitter jadi segitiga acak.
 *  Makin besar → segitiga makin kecil/rapat (mesh makin "halus"). */
const GRID_COLS = 17;
const GRID_ROWS = 11;

/** Seberapa acak posisi tiap titik grid digeser (0 = grid kaku, 1 = sangat kacau). */
const JITTER_STRENGTH = 0.34;

/** Margin ekstra di luar bingkai video (rasio dari lebar/tinggi) supaya saat
 *  mesh "bernapas" tidak pernah menyingkap tepi kosong. Jangan diset terlalu kecil. */
const MARGIN_RATIO = 0.09;

/** Amplitudo getaran tiap vertex (dalam px pada kanvas 4K). */
const VERTEX_AMP_MIN = 5;
const VERTEX_AMP_MAX = 18;

/** Jumlah partikel bintang/kerlip yang tersebar di layar. */
const PARTICLE_COUNT = 150;

/** Berapa kali sapuan cahaya (glint) melintasi mesh selama satu loop.
 *  HARUS bilangan bulat agar loop tetap mulus. */
const SWEEP_WAVES = 1;

/** Intensitas puncak sapuan cahaya. */
const SWEEP_INTENSITY = 0.22;

/** Seberapa sempit pita sapuan cahaya. Makin besar → makin tipis & tajam
 *  garis kilaunya (bukan mencerahkan area luas sekaligus). */
const SWEEP_SHARPNESS = 42;

/** Intensitas napas kamera (zoom mikro) & rotasi mikro. */
const CAMERA_ZOOM_AMOUNT = 0.014;
const CAMERA_ROTATE_DEGREES = 0.4;

// ============================================================================
// 3. GENERATOR ACAK DETERMINISTIK (seeded PRNG — mulberry32)
// ============================================================================
// Dipakai supaya mesh & partikel yang "acak" selalu identik setiap kali file
// ini dijalankan (penting karena Remotion merender tiap frame di proses
// terpisah, jadi Math.random() biasa akan membuat mesh berubah tiap frame).

function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return function random(): number {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

class SeededRandom {
	private readonly next32: () => number;

	constructor(seed: number) {
		this.next32 = mulberry32(seed);
	}

	/** Angka acak 0..1 */
	next(): number {
		return this.next32();
	}

	/** Angka acak di rentang [min, max) */
	range(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	/** Pilih salah satu elemen array secara acak (berguna untuk harmonik integer) */
	pick<T>(options: T[]): T {
		const index = Math.floor(this.next() * options.length);
		return options[Math.min(index, options.length - 1)];
	}
}

// ============================================================================
// 4. UTILITAS MATEMATIKA & WARNA
// ============================================================================

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Kurva transisi halus (ease-in-out) untuk interpolasi berbasis jarak. */
const smoothstep = (edge0: number, edge1: number, x: number): number => {
	const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (3 - 2 * t);
};

interface RGB {
	r: number;
	g: number;
	b: number;
}

function hexToRgb(hex: string): RGB {
	const clean = hex.replace('#', '');
	const value = parseInt(clean, 16);
	return {
		r: (value >> 16) & 255,
		g: (value >> 8) & 255,
		b: value & 255,
	};
}

function rgbToCss(color: RGB, alpha = 1): string {
	const r = Math.round(clamp(color.r, 0, 255));
	const g = Math.round(clamp(color.g, 0, 255));
	const b = Math.round(clamp(color.b, 0, 255));
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
	const tt = clamp(t, 0, 1);
	return {
		r: lerp(a.r, b.r, tt),
		g: lerp(a.g, b.g, tt),
		b: lerp(a.b, b.b, tt),
	};
}

/** Membuat warna lebih terang (amount > 0) atau lebih gelap (amount < 0). */
function shadeRgb(color: RGB, amount: number): RGB {
	if (amount >= 0) {
		return mixRgb(color, {r: 255, g: 255, b: 255}, amount);
	}
	return mixRgb(color, {r: 0, g: 0, b: 0}, -amount);
}

// ============================================================================
// 5. PALET WARNA — meniru gradasi pada gambar referensi
// ============================================================================

const PALETTE = {
	navyDeep: hexToRgb('#0a1526'),
	navyBase: hexToRgb('#122842'),
	navyMid: hexToRgb('#1d3c60'),
	maroon: hexToRgb('#551621'),
	emberRed: hexToRgb('#d13a2f'),
	emberOrange: hexToRgb('#ff8a4c'),
	cyan: hexToRgb('#5cc9dd'),
	cyanLight: hexToRgb('#c3eef4'),
	peach: hexToRgb('#ffe3c4'),
} as const;

/** Sumber cahaya semu yang dicampur secara aditif untuk membentuk gradasi
 *  dasar mesh — posisi dalam koordinat ternormalisasi (0..1, 0..1). */
interface LightSource {
	x: number;
	y: number;
	radius: number;
	color: RGB;
	intensity: number;
}

const LIGHT_SOURCES: LightSource[] = [
	{x: 0.04, y: 0.92, radius: 0.46, color: PALETTE.emberOrange, intensity: 1.0},
	{x: 0.0, y: 0.6, radius: 0.42, color: PALETTE.emberRed, intensity: 0.7},
	{x: 0.03, y: 0.04, radius: 0.32, color: PALETTE.maroon, intensity: 0.5},
	{x: 0.97, y: 0.0, radius: 0.2, color: PALETTE.peach, intensity: 0.5},
	{x: 1.0, y: 0.16, radius: 0.36, color: PALETTE.cyanLight, intensity: 0.75},
	{x: 0.86, y: 0.55, radius: 0.38, color: PALETTE.cyan, intensity: 0.55},
];

/** Mengambil sampel warna dasar pada posisi ternormalisasi (xNorm, yNorm)
 *  dengan mencampur beberapa sumber cahaya secara berurutan. Radius tiap
 *  sumber sengaja dibuat cukup kecil & falloff kuadratik agar hotspot tetap
 *  terkontrol — mencegah gradasi jadi pucat/abu-abu karena kebanyakan cahaya
 *  yang saling tumpang tindih terlalu jauh dari pusatnya. */
function sampleBaseColor(xNorm: number, yNorm: number): RGB {
	const verticalMix = smoothstep(0, 1, yNorm) * 0.22;
	let result = mixRgb(PALETTE.navyDeep, PALETTE.navyBase, verticalMix);

	for (const source of LIGHT_SOURCES) {
		const dx = xNorm - source.x;
		const dy = yNorm - source.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const falloff = clamp(1 - distance / source.radius, 0, 1);
		const weight = clamp(falloff * falloff * falloff * source.intensity, 0, 0.85);
		result = mixRgb(result, source.color, weight);
	}

	return result;
}

// ============================================================================
// 6. STRUKTUR MESH — titik (vertex) & segitiga (triangle)
// ============================================================================

interface Vertex {
	/** Posisi dasar (statis, sebelum animasi) dalam koordinat piksel kanvas. */
	baseX: number;
	baseY: number;
	/** Amplitudo getaran per-sumbu (px). */
	ampX: number;
	ampY: number;
	/** Fase awal getaran (radian), acak per titik agar tidak serempak. */
	phaseX: number;
	phaseY: number;
	/** Frekuensi harmonik — HARUS bilangan bulat agar loop tetap mulus. */
	freqX: number;
	freqY: number;
}

interface Triangle {
	a: number;
	b: number;
	c: number;
	colorBase: RGB;
	/** Variasi terang/gelap statis per-facet (kesan kristal berfaset). */
	shade: number;
	/** Fase & frekuensi kedipan individual facet. */
	shimmerPhase: number;
	shimmerFreq: number;
	shimmerAmount: number;
	/** Posisi centroid ternormalisasi — dipakai untuk sapuan cahaya diagonal. */
	centroidXNorm: number;
	centroidYNorm: number;
}

interface MeshData {
	vertices: Vertex[];
	triangles: Triangle[];
}

/** Frekuensi harmonik integer yang "aman loop" — dipilih secara acak dari
 *  daftar ini supaya variasi gerak terasa organik tapi tetap periodik rapi. */
const SAFE_INTEGER_FREQS = [1, 1, 1, 2];
const SAFE_SHIMMER_FREQS = [1, 1, 2, 3];

function buildMesh(width: number, height: number, seed: number): MeshData {
	const rng = new SeededRandom(seed);

	const marginX = width * MARGIN_RATIO;
	const marginY = height * MARGIN_RATIO;
	const spanX = width + marginX * 2;
	const spanY = height + marginY * 2;
	const cellW = spanX / (GRID_COLS - 1);
	const cellH = spanY / (GRID_ROWS - 1);

	const vertices: Vertex[] = [];

	for (let row = 0; row < GRID_ROWS; row++) {
		for (let col = 0; col < GRID_COLS; col++) {
			const gridX = -marginX + col * cellW;
			const gridY = -marginY + row * cellH;

			// Titik di tepi grid diberi jitter lebih kecil agar siluet luar mesh
			// tetap rapi menutupi seluruh kanvas walau bergoyang.
			const isEdge =
				row === 0 || row === GRID_ROWS - 1 || col === 0 || col === GRID_COLS - 1;
			const edgeDamp = isEdge ? 0.35 : 1;

			const jitterX = rng.range(-JITTER_STRENGTH, JITTER_STRENGTH) * cellW * edgeDamp;
			const jitterY = rng.range(-JITTER_STRENGTH, JITTER_STRENGTH) * cellH * edgeDamp;

			vertices.push({
				baseX: gridX + jitterX,
				baseY: gridY + jitterY,
				ampX: rng.range(VERTEX_AMP_MIN, VERTEX_AMP_MAX),
				ampY: rng.range(VERTEX_AMP_MIN, VERTEX_AMP_MAX),
				phaseX: rng.range(0, Math.PI * 2),
				phaseY: rng.range(0, Math.PI * 2),
				freqX: rng.pick(SAFE_INTEGER_FREQS),
				freqY: rng.pick(SAFE_INTEGER_FREQS),
			});
		}
	}

	const vertexIndex = (row: number, col: number): number => row * GRID_COLS + col;

	const triangles: Triangle[] = [];

	for (let row = 0; row < GRID_ROWS - 1; row++) {
		for (let col = 0; col < GRID_COLS - 1; col++) {
			const topLeft = vertexIndex(row, col);
			const topRight = vertexIndex(row, col + 1);
			const bottomLeft = vertexIndex(row + 1, col);
			const bottomRight = vertexIndex(row + 1, col + 1);

			const centroidXNorm = clamp((col + 0.5) / (GRID_COLS - 1), 0, 1);
			const centroidYNorm = clamp((row + 0.5) / (GRID_ROWS - 1), 0, 1);
			const cellColor = sampleBaseColor(centroidXNorm, centroidYNorm);

			// Arah diagonal pemecah quad-menjadi-2-segitiga diacak per sel agar
			// pola facet terlihat organik, bukan grid seragam yang monoton.
			const flipDiagonal = rng.next() > 0.5;

			const makeTriangle = (a: number, b: number, c: number): Triangle => ({
				a,
				b,
				c,
				colorBase: cellColor,
				shade: rng.range(-0.16, 0.16),
				shimmerPhase: rng.range(0, Math.PI * 2),
				shimmerFreq: rng.pick(SAFE_SHIMMER_FREQS),
				shimmerAmount: rng.range(0.03, 0.1),
				centroidXNorm,
				centroidYNorm,
			});

			if (flipDiagonal) {
				triangles.push(makeTriangle(topLeft, topRight, bottomLeft));
				triangles.push(makeTriangle(topRight, bottomRight, bottomLeft));
			} else {
				triangles.push(makeTriangle(topLeft, topRight, bottomRight));
				triangles.push(makeTriangle(topLeft, bottomRight, bottomLeft));
			}
		}
	}

	return {vertices, triangles};
}

// ============================================================================
// 7. PARTIKEL BINTANG / KERLIP
// ============================================================================

interface Particle {
	x: number;
	y: number;
	size: number;
	phase: number;
	freq: number;
	baseOpacity: number;
	isCross: boolean;
}

function buildParticles(width: number, height: number, count: number, seed: number): Particle[] {
	const rng = new SeededRandom(seed);
	const particles: Particle[] = [];

	for (let i = 0; i < count; i++) {
		particles.push({
			x: rng.range(0, width),
			y: rng.range(0, height),
			size: rng.range(2.5, 7.5),
			phase: rng.range(0, Math.PI * 2),
			freq: rng.pick([1, 1, 2, 2, 3]),
			baseOpacity: rng.range(0.35, 0.9),
			isCross: rng.next() > 0.72,
		});
	}

	return particles;
}

/** Merender satu partikel sebagai lingkaran kecil bercahaya, atau sebagai
 *  sparkle berbentuk "+" untuk variasi bentuk bintang. */
function renderParticle(particle: Particle, index: number, loopT: number): React.ReactElement {
	const twinkle = 0.5 + 0.5 * Math.sin(2 * Math.PI * particle.freq * loopT + particle.phase);
	const opacity = particle.baseOpacity * (0.25 + 0.75 * twinkle);
	const scale = 0.7 + 0.3 * twinkle;
	const size = particle.size * scale;

	if (particle.isCross) {
		const arm = size * 2.4;
		return (
			<g key={`particle-${index}`} opacity={opacity} filter="url(#sparkleGlow)">
				<rect
					x={particle.x - arm / 2}
					y={particle.y - size * 0.16}
					width={arm}
					height={size * 0.32}
					rx={size * 0.16}
					fill="#ffffff"
				/>
				<rect
					x={particle.x - size * 0.16}
					y={particle.y - arm / 2}
					width={size * 0.32}
					height={arm}
					rx={size * 0.16}
					fill="#ffffff"
				/>
			</g>
		);
	}

	return (
		<circle
			key={`particle-${index}`}
			cx={particle.x}
			cy={particle.y}
			r={size}
			fill="#ffffff"
			opacity={opacity}
			filter="url(#sparkleGlow)"
		/>
	);
}

// ============================================================================
// 8. DEFINISI SVG (gradient, filter) — dipisah agar komponen utama ringkas
// ============================================================================

const SvgDefinitions: React.FC<{width: number}> = ({width}) => {
	const orbBlurStd = width * 0.045;

	return (
		<defs>
			{/* Gradasi untuk cahaya lembut yang mengorbit di atas mesh */}
			<radialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
				<stop offset="45%" stopColor="rgba(200,235,255,0.32)" />
				<stop offset="100%" stopColor="rgba(200,235,255,0)" />
			</radialGradient>

			{/* Vignette lembut di tepi kanvas agar fokus tertarik ke tengah */}
			<radialGradient id="vignetteGradient" cx="50%" cy="50%" r="75%">
				<stop offset="52%" stopColor="rgba(3,7,15,0)" />
				<stop offset="100%" stopColor="rgba(2,5,11,0.8)" />
			</radialGradient>

			<filter id="orbBlur" x="-60%" y="-60%" width="220%" height="220%">
				<feGaussianBlur stdDeviation={orbBlurStd} />
			</filter>

			{/* Glow tipis untuk tiap partikel bintang */}
			<filter id="sparkleGlow" x="-250%" y="-250%" width="600%" height="600%">
				<feGaussianBlur stdDeviation="2.6" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>

			{/* Butiran noise halus (film grain) — statis, memberi tekstur premium */}
			<filter id="grainFilter" x="0" y="0" width="100%" height="100%">
				<feTurbulence
					type="fractalNoise"
					baseFrequency="0.85"
					numOctaves={2}
					seed={7}
					stitchTiles="stitch"
					result="noise"
				/>
				<feColorMatrix
					in="noise"
					type="matrix"
					values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.45 0"
				/>
			</filter>
		</defs>
	);
};

// ============================================================================
// 9. KOMPONEN UTAMA — LowPolyLoop
// ============================================================================

export const LowPolyLoop: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height, durationInFrames} = useVideoConfig();

	// Mesh & partikel dibangun sekali saja (tidak bergantung pada frame),
	// sehingga struktur segitiga selalu identik di setiap frame render.
	const {vertices, triangles} = React.useMemo(
		() => buildMesh(width, height, MESH_SEED),
		[width, height],
	);
	const particles = React.useMemo(
		() => buildParticles(width, height, PARTICLE_COUNT, PARTICLE_SEED),
		[width, height],
	);

	// Progres loop 0..1. Karena semua frekuensi di bawah adalah bilangan
	// bulat, nilai animasi di frame (durationInFrames - 1) akan nyaris identik
	// dengan nilai di frame 0 → transisi mulus saat video diputar berulang.
	const loopT = frame / durationInFrames;

	// --- 9.1 Posisi vertex teranimasi (dihitung sekali, dipakai berulang) ---
	const animatedPoints: Array<[number, number]> = vertices.map((v) => {
		const x = v.baseX + v.ampX * Math.sin(2 * Math.PI * v.freqX * loopT + v.phaseX);
		const y = v.baseY + v.ampY * Math.cos(2 * Math.PI * v.freqY * loopT + v.phaseY);
		return [x, y];
	});

	// --- 9.2 Napas kamera: zoom & rotasi mikro pada seluruh mesh ---
	const cameraScale = 1 + CAMERA_ZOOM_AMOUNT * Math.sin(2 * Math.PI * loopT);
	const cameraRotate =
		CAMERA_ROTATE_DEGREES * Math.sin(2 * Math.PI * loopT + Math.PI / 4);
	const cameraTransform = [
		`translate(${width / 2} ${height / 2})`,
		`rotate(${cameraRotate.toFixed(4)})`,
		`scale(${cameraScale.toFixed(5)})`,
		`translate(${-width / 2} ${-height / 2})`,
	].join(' ');

	// --- 9.3 Cahaya orbit lembut, lintasan menyerupai angka-8 (Lissajous) ---
	const orbitAngle = 2 * Math.PI * loopT; // frekuensi 1 (bulat) → aman loop
	const orbitRadiusX = width * 0.3;
	const orbitRadiusY = height * 0.26;
	const orbitCx = width * 0.55 + Math.cos(orbitAngle) * orbitRadiusX;
	const orbitCy =
		height * 0.42 + Math.sin(2 * orbitAngle + Math.PI / 2) * orbitRadiusY; // frekuensi 2
	const orbitRadius = Math.min(width, height) * 0.22;

	// --- 9.4 Sapuan cahaya conic (sheen) yang berputar satu putaran penuh ---
	const sheenAngle = loopT * 360; // satu rotasi penuh per loop → aman loop
	const sheenStyle: React.CSSProperties = {
		position: 'absolute',
		inset: 0,
		background: `conic-gradient(from ${sheenAngle.toFixed(
			2,
		)}deg at 22% 18%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.16) 10deg, rgba(255,255,255,0) 55deg, rgba(255,255,255,0) 360deg)`,
		mixBlendMode: 'overlay',
		pointerEvents: 'none',
	};

	// --- 9.5 Render tiap segitiga dengan shading gabungan ---
	const renderedTriangles = triangles.map((tri, index) => {
		const [x1, y1] = animatedPoints[tri.a];
		const [x2, y2] = animatedPoints[tri.b];
		const [x3, y3] = animatedPoints[tri.c];

		// Kedipan individual tiap facet (fase & frekuensi berbeda-beda).
		const individualShimmer =
			tri.shimmerAmount * Math.sin(2 * Math.PI * tri.shimmerFreq * loopT + tri.shimmerPhase);

		// Sapuan cahaya diagonal yang melintasi seluruh mesh (glint kristal).
		// Fase spasial (posisi facet) digabung dengan fase waktu (loopT). Dipakai
		// puncak eksponensial yang sempit (bukan sin dipangkatkan) supaya hanya
		// segelintir facet di sekitar "garis kilau" yang menyala pada satu waktu
		// — efeknya seperti seberkas cahaya tipis yang melintas, bukan area luas
		// yang tiba-tiba terang.
		const spatialPhase = tri.centroidXNorm * 0.7 + tri.centroidYNorm * 0.3;
		const sweepRaw = Math.sin(2 * Math.PI * (SWEEP_WAVES * loopT + spatialPhase));
		const sweepGlow = Math.exp(-SWEEP_SHARPNESS * (1 - sweepRaw)) * SWEEP_INTENSITY;

		const totalShade = clamp(tri.shade + individualShimmer + sweepGlow, -0.4, 0.26);
		const fillColor = rgbToCss(shadeRgb(tri.colorBase, totalShade));

		const points = `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(
			1,
		)} ${x3.toFixed(1)},${y3.toFixed(1)}`;

		return (
			<polygon
				key={`tri-${index}`}
				points={points}
				fill={fillColor}
				// Stroke memakai warna fill yang sama: trik standar untuk menutup
				// celah antialiasing sub-piksel antar segitiga yang bersebelahan.
				stroke={fillColor}
				strokeWidth={2.2}
				strokeLinejoin="round"
			/>
		);
	});

	// --- 9.6 Render seluruh partikel ---
	const renderedParticles = particles.map((p, index) => renderParticle(p, index, loopT));

	return (
		<AbsoluteFill style={{backgroundColor: rgbToCss(PALETTE.navyDeep)}}>
			<svg
				width={width}
				height={height}
				viewBox={`0 0 ${width} ${height}`}
				style={{display: 'block'}}
			>
				<SvgDefinitions width={width} />

				{/* Lapisan dasar — jaring pengaman warna di belakang mesh */}
				<rect x={0} y={0} width={width} height={height} fill={rgbToCss(PALETTE.navyBase)} />

				{/* Mesh kristal utama, dibungkus grup dengan napas kamera */}
				<g transform={cameraTransform}>{renderedTriangles}</g>

				{/* Cahaya orbit lembut di atas mesh (blend screen = menyala) */}
				<ellipse
					cx={orbitCx}
					cy={orbitCy}
					rx={orbitRadius}
					ry={orbitRadius * 0.85}
					fill="url(#orbGradient)"
					opacity={0.55}
					filter="url(#orbBlur)"
					style={{mixBlendMode: 'screen'}}
				/>

				{/* Partikel bintang / kerlip */}
				<g>{renderedParticles}</g>

				{/* Vignette lembut di tepi */}
				<rect
					x={0}
					y={0}
					width={width}
					height={height}
					fill="url(#vignetteGradient)"
					style={{mixBlendMode: 'multiply'}}
				/>

				{/* Butiran noise halus untuk tekstur sinematik */}
				<rect
					x={0}
					y={0}
					width={width}
					height={height}
					filter="url(#grainFilter)"
					opacity={0.05}
					style={{mixBlendMode: 'overlay'}}
				/>
			</svg>

			{/* Sapuan cahaya conic yang berotasi penuh satu putaran per loop */}
			<div style={sheenStyle} />
		</AbsoluteFill>
	);
};

export default LowPolyLoop;
