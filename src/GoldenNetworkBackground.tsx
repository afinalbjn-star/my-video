import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';

const RING_COUNT = 9;
const NODES_PER_RING = 36;
const PARTICLE_COUNT = 3200;
const TRAIL_COUNT = 800;

const GoldenNetworkBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height, durationInFrames } = useVideoConfig();

	const { scene, camera, rings, nodes, lines, particles, trails } = useMemo(() => {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#050505');

		const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 400);
		camera.position.set(0, 22, 32);
		camera.lookAt(0, 0, 0);

		const ambient = new THREE.AmbientLight('#ffffff', 0.3);
		scene.add(ambient);

		const key = new THREE.PointLight('#FFD700', 3.2, 140, 1.2);
		key.position.set(14, 12, 14);
		scene.add(key);

		const fill = new THREE.PointLight('#FFF8DC', 2.2, 120, 1.2);
		fill.position.set(-14, 8, -12);
		scene.add(fill);

		const rim = new THREE.PointLight('#D4AF37', 1.8, 100, 1.2);
		rim.position.set(0, 18, -20);
		scene.add(rim);

		const rings: THREE.Mesh[] = [];
		const nodes: THREE.Mesh[] = [];
		const lines: THREE.Line[] = [];
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
			scene.add(mesh);
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
				nodeMesh.userData = { ringIndex: r, theta, radius };
				scene.add(nodeMesh);
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
				linewidth: 1,
			});
			const line = new THREE.LineSegments(geo, mat);
			line.userData = { ringA: r, ringB: r + 1, start, end };
			scene.add(line);
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
		scene.add(points);

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
		scene.add(trailPoints);

		return { scene, camera, rings, nodes, lines, particles: points, trails: trailPoints };
	}, [width, height]);

	const t = (frame / durationInFrames) * Math.PI * 2;
	const positions = particles.geometry.attributes.position.array as Float32Array;
	const trailPositions = trails.geometry.attributes.position.array as Float32Array;

	for (let i = 0; i < PARTICLE_COUNT; i++) {
		const x = positions[i * 3];
		const z = positions[i * 3 + 2];
		const baseY = positions[i * 3 + 1];
		positions[i * 3 + 1] = baseY + Math.sin(x * 0.7 + t) * Math.cos(z * 0.6 + t * 0.9) * 0.55;
	}
	particles.geometry.attributes.position.needsUpdate = true;

	for (let i = 0; i < TRAIL_COUNT; i++) {
		const x = trailPositions[i * 3];
		const z = trailPositions[i * 3 + 2];
		const baseY = trailPositions[i * 3 + 1];
		trailPositions[i * 3 + 1] = baseY + Math.sin(x * 0.5 + t * 1.3) * Math.cos(z * 0.4 + t * 1.1) * 0.7;
	}
	trails.geometry.attributes.position.needsUpdate = true;

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

	const cameraAngle = t * 0.07;
	const cameraRadius = 32;
	const cameraHeight = 22 + Math.sin(t * 0.32) * 3;
	const targetY = Math.sin(t * 0.28) * 1.5;
	camera.position.set(
		Math.cos(cameraAngle) * cameraRadius,
		cameraHeight,
		Math.sin(cameraAngle) * cameraRadius
	);
	camera.lookAt(0, targetY, 0);

	return (
		<AbsoluteFill style={{ backgroundColor: '#050505' }}>
			<ThreeCanvas width={width} height={height} scene={scene} camera={camera} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3, powerPreference: 'high-performance' }}>
				<EffectComposer>
					<Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} height={300} intensity={1.35} />
					<DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2.8} height={480} />
				</EffectComposer>
			</ThreeCanvas>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.1) 0%, rgba(5,5,5,0.95) 60%, rgba(5,5,5,1) 100%)',
					pointerEvents: 'none',
					mixBlendMode: 'screen',
				}}
			/>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)',
					pointerEvents: 'none',
				}}
			/>
		</AbsoluteFill>
	);
};

export default GoldenNetworkBackground;
