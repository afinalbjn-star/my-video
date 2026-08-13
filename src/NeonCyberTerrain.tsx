import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

const COLS = 90;
const ROWS = 50;
const SPACING = 0.45;
const COUNT = COLS * ROWS;

const NeonCyberTerrain: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height, durationInFrames } = useVideoConfig();

	const { scene, camera, points } = useMemo(() => {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#000008');
		scene.fog = new THREE.FogExp2('#000008', 0.028);

		const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
		camera.position.set(0, 7, 16);
		camera.lookAt(0, 0, -10);

		const ambient = new THREE.AmbientLight('#ffffff', 0.5);
		scene.add(ambient);

		const light1 = new THREE.PointLight('#ff00ff', 1.2, 100);
		light1.position.set(10, 10, 10);
		scene.add(light1);

		const light2 = new THREE.PointLight('#00ffff', 1.2, 100);
		light2.position.set(-10, 5, -10);
		scene.add(light2);

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

		const points = new THREE.Points(geo, mat);
		scene.add(points);

		return { scene, camera, points };
	}, [width, height]);

	const positions = points.geometry.attributes.position.array as Float32Array;
	const colors = points.geometry.attributes.color.array as Float32Array;
	const t = (frame / durationInFrames) * Math.PI * 2;

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

	const cameraAngle = t * 0.15;
	const cameraRadius = 16;
	const cameraHeight = 7 + Math.sin(t * 0.4) * 2;
	camera.position.set(
		Math.cos(cameraAngle) * cameraRadius,
		cameraHeight,
		Math.sin(cameraAngle) * cameraRadius
	);
	camera.lookAt(0, 0, -10);

	return (
		<AbsoluteFill style={{ backgroundColor: '#000008' }}>
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
				<></>
			</ThreeCanvas>

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

export default NeonCyberTerrain;
