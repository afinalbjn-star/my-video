// =====================================================================================
// CameraRig.tsx
// -------------------------------------------------------------------------------------
// Menggerakkan kamera secara perlahan mengorbit di sekitar wave mesh, memberi kesan
// "hidup" pada background tanpa membuat penonton pusing (gerakan halus & lambat).
// =====================================================================================

import React, { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';

// ---------------------------------------------------------------------------------
// ⚙️ KECEPATAN ORBIT KAMERA — harus integer!
// ---------------------------------------------------------------------------------
const CAMERA_ORBIT_LOOPS = 1; // satu putaran penuh mengelilingi objek selama 15 detik
const CAMERA_DISTANCE = 13; // jarak kamera dari pusat (0,0,0)
const CAMERA_BASE_HEIGHT = 5.5; // ketinggian dasar kamera
const CAMERA_HEIGHT_BOB_AMPLITUDE = 0.6; // naik-turun halus kamera
const CAMERA_FOV = 42; // field of view (semakin kecil = semakin "zoom")

export const CameraRig: React.FC = () => {
	const { camera } = useThree();
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	const loopProgress = frame / durationInFrames;
	const angle = loopProgress * Math.PI * 2 * CAMERA_ORBIT_LOOPS;

	useLayoutEffect(() => {
		const x = Math.sin(angle) * CAMERA_DISTANCE;
		const z = Math.cos(angle) * CAMERA_DISTANCE;
		// Sudut yang sama (angle) dipakai lagi untuk bobbing tinggi kamera — tetap
		// aman untuk loop karena kelipatannya (1x) dari sudut dasar yang sudah integer.
		const y = CAMERA_BASE_HEIGHT + Math.sin(angle) * CAMERA_HEIGHT_BOB_AMPLITUDE;

		camera.position.set(x, y, z);
		camera.lookAt(0, 0.5, 0);

		if (camera instanceof THREE.PerspectiveCamera) {
			camera.fov = CAMERA_FOV;
			camera.updateProjectionMatrix();
		}
	}, [angle, camera]);

	return null;
};
