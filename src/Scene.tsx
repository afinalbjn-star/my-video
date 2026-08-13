// =====================================================================================
// Scene.tsx
// -------------------------------------------------------------------------------------
// Menggabungkan seluruh elemen 3D: lighting, fog, wave mesh utama, wave mesh
// "reflection" semu, serta spiral particles — menjadi satu scene siap pakai.
// =====================================================================================

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraRig } from './CameraRig';
import { WaveMesh } from './WaveMesh';
import { SpiralParticles } from './SpiralParticles';
import { PALETTE } from './colorUtils';

// ---------------------------------------------------------------------------------
// 💡 PENGATURAN CAHAYA — ubah intensitas/warna di sini untuk mood yang berbeda
// ---------------------------------------------------------------------------------
const AMBIENT_INTENSITY = 0.22; // cahaya dasar redup, menjaga area gelap tetap gelap
const KEY_LIGHT_INTENSITY = 3.2; // lampu utama pink neon
const FILL_LIGHT_INTENSITY = 2.6; // lampu pengisi emas hangat
const RIM_LIGHT_INTENSITY = 1.4; // lampu dari belakang untuk siluet/kontur

// Kecepatan orbit dua lampu utama mengelilingi mesh (harus integer!)
const LIGHT_ORBIT_LOOPS = 1;

// Kepadatan kabut (fog). Semakin besar, semakin cepat elemen jauh memudar ke gelap.
const FOG_DENSITY = 0.028;

export const Scene: React.FC = () => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();
	const loopProgress = frame / durationInFrames;
	const angle = loopProgress * Math.PI * 2 * LIGHT_ORBIT_LOOPS;

	// Lampu pink & lampu emas saling mengorbit berlawanan arah, memberi kesan
	// pencahayaan yang terus "bernapas" secara halus di sepanjang durasi loop.
	const pinkLightX = Math.cos(angle) * 8;
	const pinkLightZ = Math.sin(angle) * 8;

	const goldLightX = Math.cos(angle + Math.PI) * 9;
	const goldLightZ = Math.sin(angle + Math.PI) * 9;

	return (
		<>
			<CameraRig />

			{/* Kabut tipis keunguan menambah kedalaman & membuat elemen jauh menyatu
			    lembut dengan warna background yang gelap. */}
			<fogExp2 attach="fog" args={[PALETTE.darkBase.getHex(), FOG_DENSITY]} />

			<ambientLight color={PALETTE.deepPurple} intensity={AMBIENT_INTENSITY} />

			<pointLight
				position={[pinkLightX, 4.5, pinkLightZ]}
				color={PALETTE.neonPink}
				intensity={KEY_LIGHT_INTENSITY}
				distance={30}
				decay={2}
			/>

			<pointLight
				position={[goldLightX, 3.5, goldLightZ]}
				color={PALETTE.warmGold}
				intensity={FILL_LIGHT_INTENSITY}
				distance={30}
				decay={2}
			/>

			<directionalLight
				position={[0, 8, -10]}
				color={PALETTE.neonViolet}
				intensity={RIM_LIGHT_INTENSITY}
			/>

			{/* Wave mesh utama */}
			<WaveMesh positionY={0} />

			{/* Wave mesh "reflection" semu — geometry yang sama tapi dibalik (flip
			    skala Y) & warnanya digelapkan, diposisikan sedikit di bawah mesh
			    utama untuk memberi kesan permukaan yang memantulkan cahaya. */}
			<group scale={[1, -1, 1]}>
				<WaveMesh positionY={-0.15} isReflection />
			</group>

			<SpiralParticles />
		</>
	);
};
