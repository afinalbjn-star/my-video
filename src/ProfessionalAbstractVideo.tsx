// =====================================================================================
// ProfessionalAbstractVideo.tsx
// -------------------------------------------------------------------------------------
// Komposisi video abstrak profesional 4K — 30 detik, multi-scene, multi-layer.
// Menggabungkan Three.js 3D scenes dengan overlay CSS/Canvas/SVG untuk hasil
// video abstract berkualitas produksi tinggi.
//
// SEAMLESS LOOP STRATEGY:
//   Durasi 30s (1800 frames) adalah kelipatan dari semua background loop durations:
//   - WaveScene: 15s loop → 30s = 2× loops
//   - NeonCyberTerrain: 10s loop → 30s = 3× loops
//   - GoldenNetwork: 15s loop → 30s = 2× loops
//   Di loop point (frame 1799 → 0), semua backgrounds kembali ke state awal.
//   Flash effect di akhir Scene 4 menutupi transition.
// =====================================================================================

import React, { useMemo, useRef, useLayoutEffect } from 'react';
import {
	AbsoluteFill,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Scene } from './Scene';
import { WaveMesh } from './WaveMesh';
import { SpiralParticles } from './SpiralParticles';
import { PALETTE } from './colorUtils';

// =====================================================================================
// KONFIGURASI GLOBAL
// =====================================================================================
const FPS = 60;
const DURATION_IN_SECONDS = 30;
const VIDEO_WIDTH = 3840;
const VIDEO_HEIGHT = 2160;

const SCENE_1_START = 0;
const SCENE_1_END = 7;
const SCENE_2_START = 7;
const SCENE_2_END = 14;
const SCENE_3_START = 14;
const SCENE_3_END = 21;
const SCENE_4_START = 21;
const SCENE_4_END = 30;

// =====================================================================================
// UTILS: SEEDED PRNG & INTERPOLATION HELPERS
// =====================================================================================
function mulberry32(a: number) {
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

// =====================================================================================
// KOMPONEN: FOREGROUND PARTICLE CANVAS (Canvas 2D procedural)
// =====================================================================================
const ForegroundParticles: React.FC<{
	startFrame: number;
	endFrame: number;
	particleCount?: number;
	color: string;
	opacity?: number;
	speed?: number;
}> = ({ startFrame, endFrame, particleCount = 120, color = '#ffffff', opacity = 0.6, speed = 1 }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	const particles = useMemo(() => {
		const rng = mulberry32(42);
		const arr: { baseX: number; baseY: number; size: number; phase: number; freq: number }[] = [];
		for (let i = 0; i < particleCount; i++) {
			arr.push({
				baseX: rng() * width,
				baseY: rng() * height,
				size: rng() * 2.5 + 0.5,
				phase: rng() * Math.PI * 2,
				freq: 0.01 + rng() * 0.03,
			});
		}
		return arr;
	}, [particleCount, width, height]);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const localFrame = frame - startFrame;
		const sceneDuration = endFrame - startFrame;
		if (localFrame < 0 || localFrame > sceneDuration) return;

		ctx.clearRect(0, 0, width, height);

		const fadeIn = interpolate(localFrame, [0, 40], [0, opacity]);
		const fadeOut = interpolate(localFrame, [sceneDuration - 40, sceneDuration], [opacity, 0]);
		const globalOpacity = clamp(Math.min(fadeIn, fadeOut), 0, 1);

		particles.forEach((p) => {
			const driftX = Math.sin(localFrame * p.freq * speed + p.phase) * 60;
			const driftY = Math.cos(localFrame * p.freq * 0.7 * speed + p.phase) * 40;
			const px = p.baseX + driftX;
			const py = p.baseY + driftY;
			const alpha = globalOpacity * (0.2 + 0.8 * Math.abs(Math.sin(localFrame * 0.04 * speed + p.phase)));

			ctx.beginPath();
			ctx.arc(px, py, p.size, 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.globalAlpha = clamp(alpha, 0, 1);
			ctx.fill();
		});

		ctx.globalAlpha = 1;
	}, [frame, startFrame, endFrame, particles, width, height, color, opacity, speed]);

	return (
		<canvas
			ref={canvasRef}
			width={width}
			height={height}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: 30,
			}}
		/>
	);
};

// =====================================================================================
// KOMPONEN: SCANLINES OVERLAY
// =====================================================================================
const Scanlines: React.FC<{ intensity?: number }> = ({ intensity = 0.04 }) => {
	const pattern = useMemo(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 4;
		canvas.height = 4;
		const ctx = canvas.getContext('2d')!;
		ctx.clearRect(0, 0, 4, 4);
		ctx.fillStyle = `rgba(0,0,0,${intensity})`;
		ctx.fillRect(0, 2, 4, 1);
		return canvas.toDataURL();
	}, [intensity]);

	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${pattern})`,
				backgroundRepeat: 'repeat',
				opacity: 0.7,
				pointerEvents: 'none',
				zIndex: 50,
				mixBlendMode: 'multiply',
			}}
		/>
	);
};

// =====================================================================================
// KOMPONEN: COLOR GRADE + VIGNETTE OVERLAY
// =====================================================================================
const ColorGradeOverlay: React.FC<{
	sceneIndex: number;
	startFrame: number;
	endFrame: number;
}> = ({ sceneIndex, startFrame, endFrame }) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;
	const sceneDuration = endFrame - startFrame;

	if (localFrame < -20 || localFrame > sceneDuration + 20) return null;

	const grades = [
		{
			vignette: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 50%, rgba(4,0,13,0.85) 100%)',
			tint: 'rgba(60, 15, 112, 0.08)',
		},
		{
			vignette: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,8,8,0.9) 100%)',
			tint: 'rgba(0, 40, 40, 0.1)',
		},
		{
			vignette: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 55%, rgba(5,3,0,0.88) 100%)',
			tint: 'rgba(80, 60, 10, 0.1)',
		},
		{
			vignette: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(2,0,8,0.9) 100%)',
			tint: 'rgba(40, 0, 80, 0.12)',
		},
	];

	const grade = grades[sceneIndex % grades.length];
	const fadeIn = interpolate(localFrame, [-10, 30], [0, 1]);
	const fadeOut = interpolate(localFrame, [sceneDuration - 30, sceneDuration + 10], [1, 0]);
	const visibility = clamp(Math.min(fadeIn, fadeOut), 0, 1);

	return (
		<>
			<AbsoluteFill
				style={{
					background: grade.vignette,
					pointerEvents: 'none',
					zIndex: 40,
					opacity: visibility,
				}}
			/>
			<AbsoluteFill
				style={{
					background: grade.tint,
					pointerEvents: 'none',
					zIndex: 39,
					opacity: visibility,
					mixBlendMode: 'overlay',
				}}
			/>
		</>
	);
};

// =====================================================================================
// KOMPONEN: GEOMETRIC WIREFRAME SVG OVERLAY
// =====================================================================================
const GeometricWireframe: React.FC<{
	startFrame: number;
	endFrame: number;
	seed?: number;
	color1?: string;
	color2?: string;
}> = ({ startFrame, endFrame, seed = 7, color1 = '#ff2ec4', color2 = '#ffb347' }) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;
	const sceneDuration = endFrame - startFrame;

	if (localFrame < 0 || localFrame > sceneDuration) return null;

	const drawProgress = interpolate(localFrame, [0, sceneDuration * 0.8], [0, 1]);

	const paths = useMemo(() => {
		const rng = mulberry32(seed);
		const arr: { d: string; stroke: string; width: number; delay: number }[] = [];
		for (let i = 0; i < 10; i++) {
			const x1 = rng() * 1920;
			const y1 = rng() * 1080;
			const x2 = rng() * 1920;
			const y2 = rng() * 1080;
			const cx1 = rng() * 1920;
			const cy1 = rng() * 1080;
			const cx2 = rng() * 1920;
			const cy2 = rng() * 1080;
			arr.push({
				d: `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`,
				stroke: i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : '#ffffff',
				width: rng() * 3 + 0.5,
				delay: rng() * 0.5,
			});
		}
		return arr;
	}, [seed, color1, color2]);

	const fadeIn = interpolate(localFrame, [0, 30], [0, 0.6]);
	const fadeOut = interpolate(localFrame, [sceneDuration - 30, sceneDuration], [0.6, 0]);
	const visibility = clamp(Math.min(fadeIn, fadeOut), 0, 1);

	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				zIndex: 35,
				opacity: visibility,
			}}
		>
			<svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
				{paths.map((p, i) => {
					const lineProgress = clamp((drawProgress - p.delay) / 0.5, 0, 1);
					const dashArray = 2000;
					const dashOffset = dashArray * (1 - lineProgress);
					return (
						<path
							key={i}
							d={p.d}
							stroke={p.stroke}
							strokeWidth={p.width}
							fill="none"
							strokeDasharray={dashArray}
							strokeDashoffset={dashOffset}
							strokeLinecap="round"
							style={{ opacity: lineProgress > 0 ? 0.7 : 0 }}
						/>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

// =====================================================================================
// KOMPONEN: TYPOGRAPHY OVERLAY
// =====================================================================================
const TypographyOverlay: React.FC<{
	sceneIndex: number;
	startFrame: number;
	endFrame: number;
	title: string;
	subtitle?: string;
	metadata?: { label: string; value: string }[];
}> = ({ sceneIndex, startFrame, endFrame, title, subtitle, metadata }) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;
	const sceneDuration = endFrame - startFrame;

	if (localFrame < 0 || localFrame > sceneDuration) return null;

	const titles = ['ETHEREAL', 'NEON HORIZON', 'GOLDEN NEXUS', 'SYNTHESIS'];
	const titleText = title || titles[sceneIndex % titles.length];
	const colors = ['#ff2ec4', '#00ffff', '#ffd700', '#ffffff'];
	const titleColor = colors[sceneIndex % colors.length];

	const titleOpacity = interpolate(localFrame, [10, 70], [0, 1]);
	const titleY = interpolate(localFrame, [10, 70], [50, 0]);

	const subtitleOpacity = interpolate(localFrame, [60, 100], [0, 1]);
	const subtitleY = interpolate(localFrame, [60, 100], [30, 0]);

	const metaOpacity = interpolate(localFrame, [90, 130], [0, 1]);
	const progress = clamp((localFrame / sceneDuration) * 100, 0, 100);

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				padding: '80px 120px',
				pointerEvents: 'none',
				zIndex: 45,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 16,
					opacity: titleOpacity,
					transform: `translateY(${titleY}px)`,
				}}
			>
				<div
					style={{
						fontFamily: 'monospace',
						fontSize: 24,
						color: titleColor,
						letterSpacing: '0.3em',
						opacity: 0.8,
						borderLeft: `3px solid ${titleColor}`,
						paddingLeft: 16,
					}}
				>
					0{sceneIndex + 1} / 04
				</div>
				<div
					style={{
						fontFamily: 'sans-serif',
						fontSize: 96,
						fontWeight: 900,
						color: '#ffffff',
						letterSpacing: '-0.02em',
						lineHeight: 1,
						textShadow: `0 0 60px ${titleColor}44, 0 4px 20px rgba(0,0,0,0.5)`,
					}}
				>
					{titleText}
				</div>
				{subtitle && (
					<div
						style={{
							fontFamily: 'sans-serif',
							fontSize: 36,
							color: 'rgba(255,255,255,0.7)',
							letterSpacing: '0.05em',
							opacity: subtitleOpacity,
							transform: `translateY(${subtitleY}px)`,
						}}
					>
						{subtitle}
					</div>
				)}
			</div>

			{metadata && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 12,
						alignItems: 'flex-end',
						opacity: metaOpacity,
					}}
				>
					{metadata.map((m, i) => (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								fontFamily: 'monospace',
								fontSize: 20,
								color: 'rgba(255,255,255,0.6)',
							}}
						>
							<span style={{ opacity: 0.6 }}>{m.label}</span>
							<span style={{ color: titleColor, fontWeight: 700, fontSize: 24 }}>{m.value}</span>
						</div>
					))}
				</div>
			)}

			<div
				style={{
					position: 'absolute',
					bottom: 60,
					left: 120,
					right: 120,
					height: 2,
					background: 'rgba(255,255,255,0.1)',
					borderRadius: 1,
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${progress}%`,
						background: `linear-gradient(90deg, ${titleColor}88, ${titleColor})`,
						borderRadius: 1,
						boxShadow: `0 0 12px ${titleColor}66`,
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// =====================================================================================
// KOMPONEN: DATA METRICS OVERLAY
// =====================================================================================
const DataMetricsOverlay: React.FC<{
	startFrame: number;
	endFrame: number;
	sceneIndex: number;
}> = ({ startFrame, endFrame, sceneIndex }) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;
	const sceneDuration = endFrame - startFrame;

	if (localFrame < 0 || localFrame > sceneDuration) return null;

	const metrics =
		sceneIndex === 1
			? [
					{ label: 'VERTICES', value: '19800', unit: '' },
					{ label: 'FREQUENCY', value: '2.4', unit: 'GHz' },
					{ label: 'AMPLITUDE', value: '0.62', unit: 'm' },
					{ label: 'RENDER', value: '60', unit: 'FPS' },
				]
			: [
					{ label: 'NODES', value: '324', unit: '' },
					{ label: 'RINGS', value: '9', unit: '' },
					{ label: 'LINKS', value: '1152', unit: '' },
					{ label: 'LATENCY', value: '12', unit: 'ms' },
				];

	const color = sceneIndex === 1 ? '#00ffff' : '#ffd700';
	const entrance = interpolate(localFrame, [60, 120], [0, 1]);

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'flex-end',
				alignItems: 'flex-end',
				padding: '100px 140px',
				pointerEvents: 'none',
				zIndex: 46,
			}}
		>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(2, 1fr)',
					gap: 24,
					opacity: entrance,
					transform: `translateY(${interpolate(localFrame, [60, 120], [30, 0])}px)`,
				}}
			>
				{metrics.map((m, i) => {
					const stagger = interpolate(localFrame, [60 + i * 15, 90 + i * 15], [0, 1]);
					return (
						<div
							key={i}
							style={{
								background: 'rgba(0,0,0,0.5)',
								backdropFilter: 'blur(24px)',
								border: `1px solid ${color}33`,
								borderRadius: 16,
								padding: '28px 36px',
								opacity: stagger,
								transform: `translateY(${interpolate(localFrame, [60 + i * 15, 90 + i * 15], [20, 0])}px)`,
							}}
						>
							<div
								style={{
									fontFamily: 'monospace',
									fontSize: 16,
									color: 'rgba(255,255,255,0.5)',
									letterSpacing: '0.2em',
									marginBottom: 10,
								}}
							>
								{m.label}
							</div>
							<div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
								<span
									style={{
										fontFamily: 'monospace',
										fontSize: 52,
										fontWeight: 700,
										color: '#ffffff',
										fontVariantNumeric: 'tabular-nums',
									}}
								>
									{m.value}
								</span>
								<span style={{ fontFamily: 'monospace', fontSize: 22, color: color, opacity: 0.9 }}>
									{m.unit}
								</span>
							</div>
							<div
								style={{
									marginTop: 14,
									height: 4,
									background: 'rgba(255,255,255,0.08)',
									borderRadius: 2,
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										height: '100%',
										width: `${65 + (i * 11) % 35}%`,
										background: `linear-gradient(90deg, ${color}88, ${color})`,
										borderRadius: 2,
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// =====================================================================================
// KOMPONEN: BOKEH LIGHT LEAK OVERLAY
// =====================================================================================
const BokehOverlay: React.FC<{
	startFrame: number;
	endFrame: number;
	color?: string;
	intensity?: number;
}> = ({ startFrame, endFrame, color = '#ff2ec4', intensity = 1 }) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;
	const sceneDuration = endFrame - startFrame;

	if (localFrame < 0 || localFrame > sceneDuration) return null;

	const circles = useMemo(() => {
		const rng = mulberry32(99);
		return Array.from({ length: 15 }, (_, i) => ({
			x: rng() * 100,
			y: rng() * 100,
			size: rng() * 350 + 80,
			opacity: (rng() * 0.12 + 0.04) * intensity,
			speed: rng() * 0.4 + 0.15,
			phase: rng() * Math.PI * 2,
		}));
	}, [color, intensity]);

	const globalFade = interpolate(localFrame, [0, 40, sceneDuration - 40, sceneDuration], [0, 1, 1, 0]);

	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				zIndex: 25,
				opacity: globalFade,
				mixBlendMode: 'screen',
			}}
		>
			{circles.map((c, i) => {
				const drift = Math.sin(localFrame * 0.012 * c.speed + c.phase) * 6;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: `${c.x + drift}%`,
							top: `${c.y + drift * 0.6}%`,
							width: c.size,
							height: c.size,
							borderRadius: '50%',
							background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
							opacity: c.opacity,
							filter: `blur(${c.size * 0.12}px)`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// =====================================================================================
// KOMPONEN: ABSTRACT TEXTURE CANVAS (procedural grain)
// =====================================================================================
const AbstractTexture: React.FC<{
	startFrame: number;
	endFrame: number;
	intensity?: number;
}> = ({ startFrame, endFrame, intensity = 0.03 }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const localFrame = frame - startFrame;
		if (localFrame < 0 || localFrame > endFrame - startFrame) return;

		const imageData = ctx.createImageData(width, height);
		const data = imageData.data;
		const rng = mulberry32(12345 + Math.floor(localFrame / 60));

		for (let i = 0; i < data.length; i += 4) {
			const n = rng();
			const v = n * 255 * intensity;
			data[i] = v;
			data[i + 1] = v;
			data[i + 2] = v;
			data[i + 3] = 255;
		}

		ctx.putImageData(imageData, 0, 0);
	}, [frame, startFrame, endFrame, width, height, intensity]);

	return (
		<canvas
			ref={canvasRef}
			width={width}
			height={height}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: 55,
				opacity: 0.35,
				mixBlendMode: 'overlay',
			}}
		/>
	);
};

// =====================================================================================
// KOMPONEN: SCENE WRAPPER — handles fade + z-index layering
// =====================================================================================
const SceneWrapper: React.FC<{
	children: React.ReactNode;
	startFrame: number;
	endFrame: number;
	sceneIndex: number;
}> = ({ children, startFrame, endFrame, sceneIndex }) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;
	const sceneDuration = endFrame - startFrame;

	if (localFrame < -30 || localFrame > sceneDuration + 30) return null;

	const fadeIn = interpolate(localFrame, [0, 40], [0, 1]);
	const fadeOut = interpolate(localFrame, [sceneDuration - 40, sceneDuration], [1, 0]);
	const visibility = clamp(Math.min(fadeIn, fadeOut), 0, 1);

	return (
		<AbsoluteFill
			style={{
				opacity: visibility,
				zIndex: 10 + sceneIndex,
				transition: 'none',
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

// =====================================================================================
// WRAPPER: NeonCyberTerrain as R3F primitive
// =====================================================================================
const NeonCyberTerrainInner: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height, durationInFrames } = useVideoConfig();

	const points = useMemo(() => {
		const COLS = 90;
		const ROWS = 50;
		const SPACING = 0.45;
		const COUNT = COLS * ROWS;

		const geo = new THREE.BufferGeometry();
		const positions = new Float32Array(COUNT * 3);
		const colors = new Float32Array(COUNT * 3);

		let idx = 0;
		for (let z = 0; z < ROWS; z++) {
			for (let x = 0; x < COLS; x++) {
				const px = (x - COLS / 2) * SPACING;
				const pz = (z - ROWS / 2) * SPACING;
				positions[idx * 3] = px;
				positions[idx * 3 + 1] = 0;
				positions[idx * 3 + 2] = pz;
				colors[idx * 3] = 0;
				colors[idx * 3 + 1] = 1;
				colors[idx * 3 + 2] = 1;
				idx++;
			}
		}

		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		const mat = new THREE.PointsMaterial({
			size: 0.13,
			vertexColors: true,
			sizeAttenuation: true,
		});

		return new THREE.Points(geo, mat);
	}, [width, height]);

	const positions = points.geometry.attributes.position.array as Float32Array;
	const colors = points.geometry.attributes.color.array as Float32Array;
	const t = (frame / durationInFrames) * Math.PI * 2;

	const COLS = 90;
	const ROWS = 50;
	const COUNT = COLS * ROWS;

	for (let i = 0; i < COUNT; i++) {
		const x = positions[i * 3];
		const z = positions[i * 3 + 2];
		const y =
			Math.sin(x * 0.8 + t) * Math.cos(z * 0.6 + t * 0.8) * 1.2 +
			Math.sin(x * 0.3 + t * 1.5) * 0.5;
		positions[i * 3 + 1] = y;

		const normalizedY = THREE.MathUtils.clamp((y + 2) / 4, 0, 1);
		const hue = 0.5 + normalizedY * 0.4;
		const color = new THREE.Color().setHSL(hue, 1, 0.55);
		colors[i * 3] = color.r;
		colors[i * 3 + 1] = color.g;
		colors[i * 3 + 2] = color.b;
	}

	points.geometry.attributes.position.needsUpdate = true;
	points.geometry.attributes.color.needsUpdate = true;

	return <primitive object={points} />;
};

// =====================================================================================
// WRAPPER: GoldenNetwork as R3F group
// =====================================================================================
const GoldenNetworkInner: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height, durationInFrames } = useVideoConfig();

	const { group, rings, nodes, lines, particles, trails } = useMemo(() => {
		const group = new THREE.Group();
		const rings: THREE.Mesh[] = [];
		const nodes: THREE.Mesh[] = [];
		const lines: THREE.Line[] = [];
		const RING_COUNT = 9;
		const NODES_PER_RING = 36;
		const PARTICLE_COUNT = 3200;
		const TRAIL_COUNT = 800;
		const maxRadius = 10.5;
		const minRadius = 2.6;

		for (let r = 0; r < RING_COUNT; r++) {
			const radius = minRadius + (maxRadius - minRadius) * (r / (RING_COUNT - 1));
			const tubeRadius = 0.022 + r * 0.005;
			const geo = new THREE.TorusGeometry(radius, tubeRadius, 40, 260);
			const mat = new THREE.MeshStandardMaterial({
				color: '#D4AF37',
				emissive: '#7a5c10',
				emissiveIntensity: 1.1,
				metalness: 0.95,
				roughness: 0.22,
			});
			const mesh = new THREE.Mesh(geo, mat);
			mesh.rotation.x = Math.PI / 2 + (r % 2 === 0 ? 0.12 : -0.1);
			mesh.rotation.z = (r % 3) * 0.08;
			mesh.userData = { baseRadius: radius, ringIndex: r, baseRotX: mesh.rotation.x, baseRotZ: mesh.rotation.z };
			group.add(mesh);
			rings.push(mesh);

			for (let n = 0; n < NODES_PER_RING; n++) {
				const theta = (n / NODES_PER_RING) * Math.PI * 2;
				const x = Math.cos(theta) * radius;
				const z = Math.sin(theta) * radius;
				const nodeGeo = new THREE.SphereGeometry(0.1 + r * 0.014, 20, 20);
				const nodeMat = new THREE.MeshStandardMaterial({
					color: '#FFF8DC',
					emissive: '#FFD700',
					emissiveIntensity: 2.2,
					metalness: 0.35,
					roughness: 0.18,
				});
				const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
				nodeMesh.position.set(x, 0, z);
				nodeMesh.userData = { ringIndex: r, theta, radius, angle: theta };
				group.add(nodeMesh);
				nodes.push(nodeMesh);
			}
		}

		for (let r = 0; r < RING_COUNT - 1; r++) {
			const start = r * NODES_PER_RING;
			const end = start + NODES_PER_RING;
			const positions = new Float32Array((end - start) * 6);
			const geo = new THREE.BufferGeometry();
			geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			const mat = new THREE.LineBasicMaterial({
				color: '#D4AF37',
				transparent: true,
				opacity: 0.22,
			});
			const line = new THREE.LineSegments(geo, mat);
			line.userData = { ringA: r, ringB: r + 1, start, end };
			group.add(line);
			lines.push(line);
		}

		const pGeo = new THREE.BufferGeometry();
		const pPositions = new Float32Array(PARTICLE_COUNT * 3);
		const pColors = new Float32Array(PARTICLE_COUNT * 3);
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const ringIdx = Math.floor(Math.random() * RING_COUNT);
			const radius = minRadius + (maxRadius - minRadius) * (ringIdx / (RING_COUNT - 1));
			const theta = Math.random() * Math.PI * 2;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;
			const y = (Math.random() - 0.5) * 2.2;
			pPositions[i * 3] = x;
			pPositions[i * 3 + 1] = y;
			pPositions[i * 3 + 2] = z;

			const gold = new THREE.Color('#FFD700');
			const white = new THREE.Color('#FFF8DC');
			const mix = Math.random();
			const col = gold.clone().lerp(white, mix);
			pColors[i * 3] = col.r;
			pColors[i * 3 + 1] = col.g;
			pColors[i * 3 + 2] = col.b;
		}
		pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
		pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
		const pMat = new THREE.PointsMaterial({
			size: 0.055,
			vertexColors: true,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.9,
		});
		const points = new THREE.Points(pGeo, pMat);
		group.add(points);

		const tGeo = new THREE.BufferGeometry();
		const tPositions = new Float32Array(TRAIL_COUNT * 3);
		const tColors = new Float32Array(TRAIL_COUNT * 3);
		for (let i = 0; i < TRAIL_COUNT; i++) {
			const ringIdx = Math.floor(Math.random() * RING_COUNT);
			const radius = minRadius + (maxRadius - minRadius) * (ringIdx / (RING_COUNT - 1));
			const theta = Math.random() * Math.PI * 2;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;
			const y = (Math.random() - 0.5) * 1.4;
			tPositions[i * 3] = x;
			tPositions[i * 3 + 1] = y;
			tPositions[i * 3 + 2] = z;

			const col = new THREE.Color('#FFE5B4');
			tColors[i * 3] = col.r;
			tColors[i * 3 + 1] = col.g;
			tColors[i * 3 + 2] = col.b;
		}
		tGeo.setAttribute('position', new THREE.BufferAttribute(tPositions, 3));
		tGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
		const tMat = new THREE.PointsMaterial({
			size: 0.09,
			vertexColors: true,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.65,
		});
		const trailPoints = new THREE.Points(tGeo, tMat);
		group.add(trailPoints);

		return { group, rings, nodes, lines, particles: points, trails: trailPoints };
	}, [width, height]);

	const t = (frame / durationInFrames) * Math.PI * 2;

	for (let r = 0; r < rings.length; r++) {
		const speed = 0.06 + r * 0.035;
		const tiltShift = (r % 2 === 0 ? 1 : -1) * 0.22;
		const ud = rings[r].userData as any;
		rings[r].rotation.z = t * speed + tiltShift + ud.baseRotZ;
		rings[r].rotation.y = t * speed * 0.55;
		rings[r].rotation.x = ud.baseRotX + Math.sin(t * 0.4 + r) * 0.08;
	}

	for (let i = 0; i < nodes.length; i++) {
		const ud = nodes[i].userData as any;
		const localAngle = ud.angle + t * (0.1 + ud.ringIndex * 0.04);
		const r = ud.radius;
		const x = Math.cos(localAngle) * r;
		const z = Math.sin(localAngle) * r;
		nodes[i].position.set(x, 0, z);
		const pulse = 1 + Math.sin(t * 3.5 + ud.angle) * 0.4;
		nodes[i].scale.setScalar(pulse);
	}

	for (let l = 0; l < lines.length; l++) {
		const line = lines[l];
		const ud = line.userData as any;
		const posArr = line.geometry.attributes.position.array as Float32Array;
		const startIdx = ud.start;
		const endIdx = ud.end;
		const count = endIdx - startIdx;
		for (let i = 0; i < count; i++) {
			const a = nodes[startIdx + i];
			const b = nodes[startIdx + ((i + 1) % count)];
			posArr[i * 6] = a.position.x;
			posArr[i * 6 + 1] = a.position.y;
			posArr[i * 6 + 2] = a.position.z;
			posArr[i * 6 + 3] = b.position.x;
			posArr[i * 6 + 4] = b.position.y;
			posArr[i * 6 + 5] = b.position.z;
		}
		line.geometry.attributes.position.needsUpdate = true;
	}

	const pPositions = particles.geometry.attributes.position.array as Float32Array;
	const tPositions = trails.geometry.attributes.position.array as Float32Array;
	const PARTICLE_COUNT = 3200;
	const TRAIL_COUNT = 800;

	for (let i = 0; i < PARTICLE_COUNT; i++) {
		const x = pPositions[i * 3];
		const z = pPositions[i * 3 + 2];
		const baseY = pPositions[i * 3 + 1];
		pPositions[i * 3 + 1] = baseY + Math.sin(x * 0.7 + t) * Math.cos(z * 0.6 + t * 0.9) * 0.55;
	}
	particles.geometry.attributes.position.needsUpdate = true;

	for (let i = 0; i < TRAIL_COUNT; i++) {
		const x = tPositions[i * 3];
		const z = tPositions[i * 3 + 2];
		const baseY = tPositions[i * 3 + 1];
		tPositions[i * 3 + 1] = baseY + Math.sin(x * 0.5 + t * 1.3) * Math.cos(z * 0.4 + t * 1.1) * 0.7;
	}
	trails.geometry.attributes.position.needsUpdate = true;

	return <primitive object={group} />;
};

// =====================================================================================
// SCENE 1: ETHEREAL FLOW (0-7s)
// =====================================================================================
const Scene1_EtherealFlow: React.FC = () => {
	const startFrame = SCENE_1_START * FPS;
	const endFrame = SCENE_1_END * FPS;

	return (
		<SceneWrapper startFrame={startFrame} endFrame={endFrame} sceneIndex={1}>
			<ThreeCanvas
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				gl={{
					antialias: true,
					toneMapping: THREE.ACESFilmicToneMapping,
					toneMappingExposure: 1.2,
					powerPreference: 'high-performance',
				}}
			>
				<Scene />
				<EffectComposer>
					<Bloom luminanceThreshold={0.5} luminanceSmoothing={0.85} height={360} intensity={1.2} />
					<DepthOfField focusDistance={0.015} focalLength={0.04} bokehScale={3.5} height={480} />
				</EffectComposer>
			</ThreeCanvas>

			<ColorGradeOverlay sceneIndex={0} startFrame={startFrame} endFrame={endFrame} />
			<BokehOverlay startFrame={startFrame} endFrame={endFrame} color="#ff2ec4" />
			<GeometricWireframe startFrame={startFrame} endFrame={endFrame} seed={7} color1="#ff2ec4" color2="#8b2bff" />
			<ForegroundParticles
				startFrame={startFrame}
				endFrame={endFrame}
				particleCount={100}
				color="#ffffff"
				opacity={0.5}
				speed={0.8}
			/>
			<TypographyOverlay
				sceneIndex={0}
				startFrame={startFrame}
				endFrame={endFrame}
				title="ETHEREAL"
				subtitle="Abstract Wave Synthesis"
				metadata={[
					{ label: 'DURATION', value: 'LOOP', unit: '' },
					{ label: 'VERTICES', value: '19.8K', unit: '' },
				]}
			/>
			<AbstractTexture startFrame={startFrame} endFrame={endFrame} intensity={0.025} />
			<Scanlines intensity={0.03} />
		</SceneWrapper>
	);
};

// =====================================================================================
// SCENE 2: NEON HORIZON (7-14s)
// =====================================================================================
const Scene2_NeonHorizon: React.FC = () => {
	const startFrame = SCENE_2_START * FPS;
	const endFrame = SCENE_2_END * FPS;

	return (
		<SceneWrapper startFrame={startFrame} endFrame={endFrame} sceneIndex={2}>
			<ThreeCanvas
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				gl={{
					antialias: true,
					toneMapping: THREE.ACESFilmicToneMapping,
					toneMappingExposure: 1.25,
					powerPreference: 'high-performance',
				}}
			>
				<NeonCyberTerrainInner />
				<EffectComposer>
					<Bloom luminanceThreshold={0.55} luminanceSmoothing={0.92} height={320} intensity={1.4} />
					<DepthOfField focusDistance={0.018} focalLength={0.045} bokehScale={3.2} height={520} />
				</EffectComposer>
			</ThreeCanvas>

			<ColorGradeOverlay sceneIndex={1} startFrame={startFrame} endFrame={endFrame} />
			<BokehOverlay startFrame={startFrame} endFrame={endFrame} color="#00ffff" />
			<GeometricWireframe startFrame={startFrame} endFrame={endFrame} seed={42} color1="#00ffff" color2="#ff00ff" />
			<DataMetricsOverlay startFrame={startFrame} endFrame={endFrame} sceneIndex={1} />
			<ForegroundParticles
				startFrame={startFrame}
				endFrame={endFrame}
				particleCount={150}
				color="#00ffff"
				opacity={0.5}
				speed={1.2}
			/>
			<TypographyOverlay
				sceneIndex={1}
				startFrame={startFrame}
				endFrame={endFrame}
				title="NEON HORIZON"
				subtitle="Cybernetic Terrain Analysis"
				metadata={[
					{ label: 'GRID', value: '90x50', unit: 'CELLS' },
					{ label: 'WAVE', value: '2.4', unit: 'GHz' },
				]}
			/>
			<AbstractTexture startFrame={startFrame} endFrame={endFrame} intensity={0.02} />
			<Scanlines intensity={0.05} />
		</SceneWrapper>
	);
};

// =====================================================================================
// SCENE 3: GOLDEN NEXUS (14-21s)
// =====================================================================================
const Scene3_GoldenNexus: React.FC = () => {
	const startFrame = SCENE_3_START * FPS;
	const endFrame = SCENE_3_END * FPS;

	return (
		<SceneWrapper startFrame={startFrame} endFrame={endFrame} sceneIndex={3}>
			<ThreeCanvas
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				gl={{
					antialias: true,
					toneMapping: THREE.ACESFilmicToneMapping,
					toneMappingExposure: 1.15,
					powerPreference: 'high-performance',
				}}
			>
				<GoldenNetworkInner />
				<EffectComposer>
					<Bloom luminanceThreshold={0.45} luminanceSmoothing={0.88} height={340} intensity={1.5} />
					<DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={3.8} height={500} />
				</EffectComposer>
			</ThreeCanvas>

			<ColorGradeOverlay sceneIndex={2} startFrame={startFrame} endFrame={endFrame} />
			<BokehOverlay startFrame={startFrame} endFrame={endFrame} color="#ffd700" />
			<GeometricWireframe startFrame={startFrame} endFrame={endFrame} seed={123} color1="#ffd700" color2="#ff8c00" />
			<DataMetricsOverlay startFrame={startFrame} endFrame={endFrame} sceneIndex={2} />
			<ForegroundParticles
				startFrame={startFrame}
				endFrame={endFrame}
				particleCount={120}
				color="#ffd700"
				opacity={0.5}
				speed={0.6}
			/>
			<TypographyOverlay
				sceneIndex={2}
				startFrame={startFrame}
				endFrame={endFrame}
				title="GOLDEN NEXUS"
				subtitle="Neural Network Topology"
				metadata={[
					{ label: 'RINGS', value: '9', unit: 'LAYERS' },
					{ label: 'NODES', value: '324', unit: 'ACTIVE' },
				]}
			/>
			<AbstractTexture startFrame={startFrame} endFrame={endFrame} intensity={0.02} />
			<Scanlines intensity={0.03} />
		</SceneWrapper>
	);
};

// =====================================================================================
// SCENE 4: SYNTHESIS (21-30s)
// Combined finale with convergence + loop re-entry flash
// =====================================================================================
const Scene4_Synthesis: React.FC = () => {
	const startFrame = SCENE_4_START * FPS;
	const endFrame = SCENE_4_END * FPS;
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;
	const sceneDuration = endFrame - startFrame;

	if (localFrame < -30 || localFrame > sceneDuration + 30) return null;

	// Convergence: scale up + blur in final 5 seconds
	const convergenceStart = sceneDuration - 300;
	const convergenceProgress = localFrame > convergenceStart
		? (localFrame - convergenceStart) / 300
		: 0;

	// Loop re-entry flash: peaks at the VERY LAST frame to mask loop seam
	const flashPeak = sceneDuration - 1;
	const flashStart = flashPeak - 60;
	const flashProgress = localFrame >= flashStart ? (localFrame - flashStart) / (flashPeak - flashStart) : 0;
	const flashOpacity = flashProgress > 0 ? Math.sin(flashProgress * Math.PI * 0.5) * 0.7 : 0;

	const fadeIn = interpolate(localFrame, [0, 40], [0, 1]);
	const fadeOut = interpolate(localFrame, [sceneDuration - 40, sceneDuration], [1, 0]);
	const visibility = clamp(Math.min(fadeIn, fadeOut), 0, 1);

	const scale = 1 + convergenceProgress * 0.12;
	const blur = convergenceProgress * 6;

	return (
		<AbsoluteFill
			style={{
				opacity: visibility,
				zIndex: 14,
				transform: `scale(${scale})`,
				filter: `blur(${blur}px)`,
				transition: 'none',
			}}
		>
			<ThreeCanvas
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				gl={{
					antialias: true,
					toneMapping: THREE.ACESFilmicToneMapping,
					toneMappingExposure: 1.3,
					powerPreference: 'high-performance',
				}}
			>
				<Scene />
				<NeonCyberTerrainInner />
				<GoldenNetworkInner />
				<EffectComposer>
					<Bloom luminanceThreshold={0.4} luminanceSmoothing={0.9} height={400} intensity={1.8} />
					<DepthOfField focusDistance={0.012} focalLength={0.035} bokehScale={4.5} height={600} />
				</EffectComposer>
			</ThreeCanvas>

			<ColorGradeOverlay sceneIndex={3} startFrame={startFrame} endFrame={endFrame} />
			<BokehOverlay startFrame={startFrame} endFrame={endFrame} color="#ffffff" intensity={1.5} />
			<GeometricWireframe
				startFrame={startFrame}
				endFrame={endFrame}
				seed={999}
				color1="#ffffff"
				color2="#ff2ec4"
			/>
			<ForegroundParticles
				startFrame={startFrame}
				endFrame={endFrame}
				particleCount={200}
				color="#ffffff"
				opacity={0.7}
				speed={1.5}
			/>
			<TypographyOverlay
				sceneIndex={3}
				startFrame={startFrame}
				endFrame={endFrame}
				title="SYNTHESIS"
				subtitle="Convergence Complete"
				metadata={[
					{ label: 'STATUS', value: 'LOOP', unit: 'READY' },
					{ label: 'ENERGY', value: '∞', unit: 'Hz' },
				]}
			/>
			<AbstractTexture startFrame={startFrame} endFrame={endFrame} intensity={0.035} />
			<Scanlines intensity={0.04} />

			{/* Loop re-entry flash — peaks at last frame to mask seam */}
			<AbsoluteFill
				style={{
					background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)',
					pointerEvents: 'none',
					zIndex: 60,
					opacity: flashOpacity,
					mixBlendMode: 'screen',
				}}
			/>
		</AbsoluteFill>
	);
};

// =====================================================================================
// SCENE TRANSITIONS
// =====================================================================================
const SceneTransition: React.FC<{
	startFrame: number;
	duration: number;
	type: 'blur' | 'whip' | 'zoom';
}> = ({ startFrame, duration, type }) => {
	const frame = useCurrentFrame();
	const localFrame = frame - startFrame;

	if (localFrame < 0 || localFrame > duration) return null;

	const progress = localFrame / duration;

	if (type === 'blur') {
		const blurAmount = interpolate(progress, [0, 0.5, 1], [0, 35, 0]);
		return (
			<AbsoluteFill
				style={{
					backdropFilter: `blur(${blurAmount}px)`,
					pointerEvents: 'none',
					zIndex: 100,
				}}
			/>
		);
	}

	if (type === 'whip') {
		const x = interpolate(progress, [0, 0.5, 1], [0, -120, 0]);
		const blur = interpolate(progress, [0, 0.3, 0.7, 1], [0, 25, 25, 0]);
		const scale = interpolate(progress, [0, 0.5, 1], [1, 1.06, 1]);
		return (
			<AbsoluteFill
				style={{
					transform: `translateX(${x}px) scale(${scale})`,
					filter: `blur(${blur}px)`,
					pointerEvents: 'none',
					zIndex: 100,
				}}
			/>
		);
	}

	if (type === 'zoom') {
		const scale = interpolate(progress, [0, 0.5, 1], [1, 1.25, 1]);
		const blur = interpolate(progress, [0, 0.5, 1], [0, 30, 0]);
		return (
			<AbsoluteFill
				style={{
					transform: `scale(${scale})`,
					filter: `blur(${blur}px)`,
					pointerEvents: 'none',
					zIndex: 100,
				}}
			/>
		);
	}

	return null;
};

// =====================================================================================
// MAIN COMPOSITION
// =====================================================================================
const ProfessionalAbstractVideo: React.FC = () => {
	const frame = useCurrentFrame();

	// Transition timings (in frames)
	const trans1_2_start = (SCENE_1_END - 1) * FPS;
	const trans2_3_start = (SCENE_2_END - 1) * FPS;
	const trans3_4_start = (SCENE_3_END - 1) * FPS;
	const transitionDuration = 30;

	return (
		<AbsoluteFill
			style={{
				width: VIDEO_WIDTH,
				height: VIDEO_HEIGHT,
				backgroundColor: '#000000',
				overflow: 'hidden',
			}}
		>
			{/* Render all scenes — visibility controlled by SceneWrapper opacity */}
			<Scene1_EtherealFlow />
			<Scene2_NeonHorizon />
			<Scene3_GoldenNexus />
			<Scene4_Synthesis />

			{/* Scene transitions */}
			<SceneTransition startFrame={trans1_2_start} duration={transitionDuration} type="blur" />
			<SceneTransition startFrame={trans2_3_start} duration={transitionDuration} type="whip" />
			<SceneTransition startFrame={trans3_4_start} duration={transitionDuration} type="zoom" />

			{/* Cinematic letterbox */}
			<AbsoluteFill
				style={{
					pointerEvents: 'none',
					zIndex: 200,
					boxShadow: 'inset 0 90px 0 0 #000, inset 0 -90px 0 0 #000',
				}}
			/>
		</AbsoluteFill>
	);
};

export default ProfessionalAbstractVideo;
