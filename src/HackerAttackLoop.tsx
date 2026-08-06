import React, {useEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

export const HACKER_ATTACK_WIDTH = 3840;
export const HACKER_ATTACK_HEIGHT = 2160;
export const HACKER_ATTACK_FPS = 60;
export const HACKER_ATTACK_DURATION_SECONDS = 20;
export const HACKER_ATTACK_DURATION_IN_FRAMES =
	HACKER_ATTACK_FPS * HACKER_ATTACK_DURATION_SECONDS;

type Lane = {
	baseY: number;
	height: number;
	speed: number;
	phase: number;
	amplitude: number;
	frequency: number;
};

type GlitchBlock = {
	laneIndex: number;
	baseX: number;
	width: number;
	height: number;
	phase: number;
	twinkleFreq: number;
	brightness: number;
	streak: boolean;
};

type BurstBand = {
	baseY: number;
	height: number;
	speed: number;
	phase: number;
	frequency: number;
	intensity: number;
};

class SeededRandom {
	private state: number;

	constructor(seed: number) {
		this.state = seed >>> 0;
	}

	next(): number {
		this.state = (1664525 * this.state + 1013904223) >>> 0;
		return this.state / 4294967296;
	}

	range(min: number, max: number): number {
		return min + (max - min) * this.next();
	}

	pick<T>(items: T[]): T {
		return items[Math.floor(this.next() * items.length)] as T;
	}
}

const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

const wrap = (value: number, max: number) => {
	const result = value % max;
	return result < 0 ? result + max : result;
};

const seam = (t: number, freq: number, phase = 0) =>
	Math.sin(Math.PI * 2 * freq * t + phase);

const palette = ['#7cf9ff', '#26d9ff', '#23ffa6', '#4b8cff', '#9ce3ff', '#3effcf', '#ff4fd8', '#7cff6a'] as const;

const hexToRgba = (hex: string, alpha: number) => {
	const clean = hex.replace('#', '');
	const value = parseInt(clean, 16);
	const r = (value >> 16) & 255;
	const g = (value >> 8) & 255;
	const b = value & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildLanes = (height: number): Lane[] => {
	const rng = new SeededRandom(8102);
	const laneCount = 34;
	const lanes: Lane[] = [];
	const gap = height / laneCount;

	for (let i = 0; i < laneCount; i++) {
		lanes.push({
			baseY: i * gap + rng.range(-18, 18),
			height: rng.range(36, 110),
			speed: rng.range(0.12, 0.38),
			phase: rng.range(0, Math.PI * 2),
			amplitude: rng.range(28, 110),
			frequency: rng.pick([1, 1, 2, 2, 3, 4]),
		});
	}

	return lanes;
};

const buildBlocks = (width: number, lanes: Lane[]): GlitchBlock[] => {
	const rng = new SeededRandom(22017);
	const blocks: GlitchBlock[] = [];

	for (let i = 0; i < lanes.length; i++) {
		const count = Math.floor(rng.range(24, 44));
		const lane = lanes[i] as Lane;
		for (let j = 0; j < count; j++) {
			blocks.push({
				laneIndex: i,
				baseX: rng.range(0, width),
				width: rng.range(width * 0.012, width * 0.13),
				height: clamp(lane.height * rng.range(0.35, 1.1), 16, 130),
				phase: rng.range(0, Math.PI * 2),
				twinkleFreq: rng.pick([1, 2, 2, 3, 4, 5]),
				brightness: rng.range(0.4, 1),
				streak: rng.next() > 0.72,
			});
		}
	}

	return blocks;
};

const buildBursts = (height: number): BurstBand[] => {
	const rng = new SeededRandom(99173);
	const bursts: BurstBand[] = [];

	for (let i = 0; i < 18; i++) {
		bursts.push({
			baseY: rng.range(0, height),
			height: rng.range(18, 90),
			speed: rng.range(0.18, 0.55),
			phase: rng.range(0, Math.PI * 2),
			frequency: rng.pick([1, 1, 2, 2, 3]),
			intensity: rng.range(0.35, 1),
		});
	}

	return bursts;
};

const drawScene = (
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	t: number,
	lanes: Lane[],
	blocks: GlitchBlock[],
	bursts: BurstBand[],
) => {
	const tau = Math.PI * 2;
	const depthShift = seam(t, 1) * width * 0.045;
	const globalPulse = 0.5 + 0.5 * seam(t, 2);
	const attackSurge = Math.pow(Math.max(0, seam(t, 3)), 6);

	ctx.clearRect(0, 0, width, height);

	const bg = ctx.createRadialGradient(
		width * 0.5,
		height * 0.48,
		width * 0.05,
		width * 0.5,
		height * 0.5,
		width * 0.72,
	);
	bg.addColorStop(0, '#123a7a');
	bg.addColorStop(0.42, '#081636');
	bg.addColorStop(0.72, '#060d26');
	bg.addColorStop(1, '#04081a');
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, width, height);

	for (const lane of lanes) {
		const yWave = seam(t, lane.frequency, lane.phase) * lane.amplitude + depthShift * 0.28;
		const y = lane.baseY + yWave;
		const laneOpacity = 0.1 + 0.16 * (0.5 + 0.5 * seam(t, 2, lane.phase)) + attackSurge * 0.08;

		ctx.fillStyle = `rgba(43, 210, 255, ${laneOpacity})`;
		ctx.fillRect(-width * 0.15, y, width * 1.35, lane.height);
	}

	for (const burst of bursts) {
		const sweep = wrap(burst.baseY + burst.speed * t * height, height + burst.height);
		const flash = Math.pow(Math.max(0, seam(t, burst.frequency, burst.phase)), 5) * burst.intensity;
		const y = sweep + seam(t, 2, burst.phase) * 24;

		ctx.fillStyle = `rgba(120, 255, 255, ${0.08 + flash * 0.42})`;
		ctx.fillRect(0, y, width, burst.height);

		ctx.fillStyle = `rgba(255, 80, 220, ${flash * 0.18})`;
		ctx.fillRect(0, y + burst.height * 0.2, width, Math.max(6, burst.height * 0.35));
	}

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i] as GlitchBlock;
		const lane = lanes[block.laneIndex] as Lane;
		const laneDrift = lane.speed * t * width * 1.35;
		const oscillation = seam(t, 2, block.phase) * (width * 0.035);
		const jitterX = seam(t, 4, block.phase) * 18 * (0.4 + attackSurge);
		const x =
			wrap(block.baseX + laneDrift + oscillation + depthShift + jitterX, width + block.width) -
			block.width;
		const y =
			lane.baseY +
			seam(t, lane.frequency, lane.phase) * lane.amplitude +
			seam(t, 3, block.phase) * 16;

		const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * seam(t, block.twinkleFreq, block.phase));
		const alpha = clamp(block.brightness * twinkle + attackSurge * 0.2, 0.2, 1);
		const color = palette[i % palette.length] as string;

		if (block.streak) {
			ctx.fillStyle = `rgba(191, 255, 255, ${alpha * 0.35})`;
			ctx.fillRect(x - block.width * 0.4, y + block.height * 0.35, block.width * 1.8, block.height * 0.3);
		}

		ctx.fillStyle = hexToRgba(color, alpha * 0.78);
		ctx.fillRect(x, y, block.width, block.height);

		ctx.fillStyle = `rgba(191, 255, 255, ${alpha * 0.32})`;
		ctx.fillRect(x + 5, y + block.height * 0.12, block.width * 0.92, Math.max(6, block.height * 0.55));
	}

	const scanOffset = wrap(t * height * 2, height);
	ctx.globalAlpha = 0.22 + globalPulse * 0.1;
	for (let y = -4; y < height + 4; y += 5) {
		const sy = wrap(y + scanOffset, height);
		const lineAlpha = 0.08 + 0.12 * (0.5 + 0.5 * seam(t, 1, y * 0.02));
		ctx.fillStyle = `rgba(120, 255, 255, ${lineAlpha})`;
		ctx.fillRect(0, sy, width, 2);
	}
	ctx.globalAlpha = 1;

	const vignette = ctx.createRadialGradient(
		width * 0.5,
		height * 0.5,
		width * 0.2,
		width * 0.5,
		height * 0.5,
		width * 0.78,
	);
	vignette.addColorStop(0, 'rgba(0,0,0,0)');
	vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, width, height);
};

export const HackerAttackLoop: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height, durationInFrames} = useVideoConfig();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const canvasGreenRef = useRef<HTMLCanvasElement>(null);
	const canvasBlueRef = useRef<HTMLCanvasElement>(null);
	const t = frame / durationInFrames;

	const lanes = useMemo(() => buildLanes(height), [height]);
	const blocks = useMemo(() => buildBlocks(width, lanes), [width, lanes]);
	const bursts = useMemo(() => buildBursts(height), [height]);

	const rgbShift = seam(t, 2) * 14 + seam(t, 4, 1.2) * 6;
	const rgbSkew = seam(t, 1, 0.8) * 0.35;
	const flashOpacity = 0.04 + Math.pow(Math.max(0, seam(t, 5)), 8) * 0.22;
	const scanSweep = wrap(t * height * 3, height);

	useEffect(() => {
		const targets = [canvasRef.current, canvasGreenRef.current, canvasBlueRef.current];
		for (const canvas of targets) {
			if (!canvas) continue;
			const ctx = canvas.getContext('2d');
			if (!ctx) continue;
			drawScene(ctx, width, height, t, lanes, blocks, bursts);
		}
	}, [width, height, t, lanes, blocks, bursts]);

	return (
		<AbsoluteFill style={{backgroundColor: '#04081a', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `skewX(${rgbSkew}deg)`,
				}}
			>
				<canvas
					ref={canvasRef}
					width={width}
					height={height}
					style={{
						position: 'absolute',
						inset: 0,
						display: 'block',
						filter: 'saturate(1.35) contrast(1.12)',
						transform: `translateX(${rgbShift}px)`,
						mixBlendMode: 'screen',
					}}
				/>
				<canvas
					ref={canvasGreenRef}
					width={width}
					height={height}
					style={{
						position: 'absolute',
						inset: 0,
						display: 'block',
						filter: 'hue-rotate(90deg) saturate(2.2)',
						transform: `translateX(${-rgbShift * 0.85}px)`,
						mixBlendMode: 'screen',
						opacity: 0.55,
						pointerEvents: 'none',
					}}
				/>
				<canvas
					ref={canvasBlueRef}
					width={width}
					height={height}
					style={{
						position: 'absolute',
						inset: 0,
						display: 'block',
						filter: 'hue-rotate(-70deg) saturate(2)',
						transform: `translateX(${rgbShift * 1.15}px)`,
						mixBlendMode: 'screen',
						opacity: 0.45,
						pointerEvents: 'none',
					}}
				/>
			</div>

			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage:
						'repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 6px)',
					backgroundPosition: `0 ${scanSweep}px`,
					opacity: 0.55,
					mixBlendMode: 'multiply',
					pointerEvents: 'none',
				}}
			/>

			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: `linear-gradient(180deg, transparent ${scanSweep}px, rgba(120,255,255,0.18) ${scanSweep + 2}px, transparent ${scanSweep + 80}px)`,
					mixBlendMode: 'screen',
					pointerEvents: 'none',
				}}
			/>

			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'rgba(180,255,255,0.9)',
					opacity: flashOpacity,
					mixBlendMode: 'screen',
					pointerEvents: 'none',
				}}
			/>
		</AbsoluteFill>
	);
};

export default HackerAttackLoop;
