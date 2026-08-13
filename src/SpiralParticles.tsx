// =====================================================================================
// SpiralParticles.tsx
// -------------------------------------------------------------------------------------
// Elemen dekoratif tambahan berbentuk SPIRAL GEOMETRIS yang berputar perlahan
// mengelilingi wave mesh utama — memperkuat kesan "abstract energy field".
// Dibangun dengan InstancedMesh supaya tetap ringan meski jumlah partikel banyak.
// =====================================================================================

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE, oscillateMix } from './colorUtils';

export type SpiralParticlesProps = {
	count?: number;
	positionY?: number;
};

// ---------------------------------------------------------------------------------
// ⚙️ KECEPATAN ROTASI SPIRAL — harus integer! (lihat penjelasan di WaveMesh.tsx)
// ---------------------------------------------------------------------------------
const SPIRAL_ROTATION_LOOPS = -1; // berputar berlawanan arah dari wave mesh utama
const SPIRAL_ARMS = 3; // jumlah "lengan" spiral
const SPIRAL_MIN_RADIUS = 3.2;
const SPIRAL_MAX_RADIUS = 9.5;
const SPIRAL_TURNS = 2.4; // seberapa banyak lilitan spiral dari pusat ke tepi

// ---------------------------------------------------------------------------------
// 🌊 INTENSITAS GERAKAN VERTIKAL (naik-turun tiap partikel di sepanjang spiral)
// ---------------------------------------------------------------------------------
const BOB_AMPLITUDE = 0.85;
const BOB_FREQUENCY = 2.2;
const BOB_LOOPS = 4; // integer

// Pulsasi ukuran partikel (skala membesar-mengecil secara halus)
const SCALE_BASE = 0.16;
const SCALE_PULSE_AMPLITUDE = 0.06;
const SCALE_PULSE_LOOPS = 6; // integer

// Object3D sementara yang dipakai berulang-ulang untuk menghitung matrix tiap instance
// (best practice standar Three.js InstancedMesh, menghindari alokasi baru tiap frame).
const dummy = new THREE.Object3D();

export const SpiralParticles: React.FC<SpiralParticlesProps> = ({
	count = 220,
	positionY = 0.4,
}) => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();
	const loopProgress = frame / durationInFrames;
	const baseAngle = loopProgress * Math.PI * 2;

	const meshRef = useRef<THREE.InstancedMesh>(null);

	// Data dasar tiap partikel (sudut & radius di sepanjang lengan spiral) dihitung
	// SEKALI saja, karena bentuk spiral itu sendiri statis — yang bergerak hanyalah
	// rotasi keseluruhan & bobbing tiap partikel (dihitung ulang tiap frame di bawah).
	const baseData = useMemo(() => {
		const arr: { theta: number; radius: number; armOffset: number }[] = [];
		for (let i = 0; i < count; i++) {
			const t = i / count; // 0..1 sepanjang panjang spiral
			const arm = i % SPIRAL_ARMS;
			const armOffset = (arm / SPIRAL_ARMS) * Math.PI * 2;
			const theta = t * Math.PI * 2 * SPIRAL_TURNS + armOffset;
			const radius =
				SPIRAL_MIN_RADIUS + t * (SPIRAL_MAX_RADIUS - SPIRAL_MIN_RADIUS);
			arr.push({ theta, radius, armOffset });
		}
		return arr;
	}, [count]);

	// Geometry kecil untuk tiap instance — bentuk oktahedron memberi kesan "kristal
	// energi" yang sesuai tema abstrak/geometris dari spesifikasi.
	const geometry = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
	const material = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				metalness: 0.6,
				roughness: 0.25,
				clearcoat: 0.7,
				clearcoatRoughness: 0.2,
			}),
		[],
	);

	useLayoutEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const globalRotation = baseAngle * SPIRAL_ROTATION_LOOPS;
		const bobPhase = baseAngle * BOB_LOOPS;
		const scalePhase = baseAngle * SCALE_PULSE_LOOPS;

		for (let i = 0; i < count; i++) {
			const { theta, radius, armOffset } = baseData[i];
			const angle = theta + globalRotation;

			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;
			const y =
				positionY +
				Math.sin(theta * BOB_FREQUENCY + bobPhase + armOffset) * BOB_AMPLITUDE;

			dummy.position.set(x, y, z);

			// Setiap partikel juga berputar di tempat (self-rotation), memberi kilau
			// dinamis saat terkena cahaya point light di dalam Scene.tsx.
			dummy.rotation.set(angle * 0.6, angle, angle * 0.3);

			const scale =
				SCALE_BASE + Math.sin(theta * 8 + scalePhase) * SCALE_PULSE_AMPLITUDE;
			dummy.scale.setScalar(Math.max(scale, 0.02));

			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);

			// Warna: campuran pink neon & emas hangat berdasarkan posisi radial (t)
			const t = radius / SPIRAL_MAX_RADIUS;
			const mixed = oscillateMix(
				PALETTE.neonPink,
				PALETTE.warmGold,
				t * Math.PI + bobPhase * 0.15,
			);
			mesh.setColorAt(i, mixed);
		}

		mesh.instanceMatrix.needsUpdate = true;
		if (mesh.instanceColor) {
			mesh.instanceColor.needsUpdate = true;
		}
	}, [baseAngle, baseData, count, positionY]);

	return (
		<instancedMesh
			ref={meshRef}
			args={[geometry, material, count]}
			frustumCulled={false}
		/>
	);
};
