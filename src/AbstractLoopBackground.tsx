// =====================================================================================
// AbstractLoopBackground.tsx
// -------------------------------------------------------------------------------------
// Komponen Composition utama Remotion. Menggabungkan <ThreeCanvas> (scene 3D) dengan
// overlay gradasi CSS 2D di atasnya untuk memperkuat nuansa gelap-dinamis yang diminta.
//
// Spesifikasi video: 15 detik @ 60fps, 4K landscape (3840x2160), SEAMLESS LOOP.
// Lihat Root.tsx untuk pendaftaran durasi & resolusi composition.
// =====================================================================================

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { Scene } from './Scene';

// ---------------------------------------------------------------------------------
// 🎨 KECEPATAN & WARNA OVERLAY GRADIENT 2D DI ATAS CANVAS 3D
// ---------------------------------------------------------------------------------
const OVERLAY_FLOW_LOOPS = 1; // harus integer! siklus penuh perubahan warna overlay
const OVERLAY_HUE_A = 265; // ungu
const OVERLAY_HUE_B = 320; // pink-magenta
const OVERLAY_MAX_OPACITY = 0.35; // seberapa kuat overlay menutupi canvas 3D di bawahnya

export const AbstractLoopBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height, durationInFrames } = useVideoConfig();

	const loopProgress = frame / durationInFrames;
	const angle = loopProgress * Math.PI * 2 * OVERLAY_FLOW_LOOPS;

	// Hue overlay berosilasi mulus antara dua warna. Looping sempurna karena memakai
	// sin(angle) dengan angle yang sudah "loop-safe" (kelipatan integer 2π).
	const hueT = (Math.sin(angle) + 1) / 2;
	const hue = OVERLAY_HUE_A + (OVERLAY_HUE_B - OVERLAY_HUE_A) * hueT;

	// Opacity overlay juga berosilasi (memakai angle * 2, tetap kelipatan integer,
	// jadi tetap aman untuk loop) supaya terasa seperti gradasi yang "berdenyut".
	const overlayOpacity = OVERLAY_MAX_OPACITY * (0.5 + 0.5 * Math.sin(angle * 2));

	const overlayGradient = `radial-gradient(circle at 50% 45%, hsla(${hue}, 90%, 55%, ${overlayOpacity}) 0%, hsla(${OVERLAY_HUE_A}, 60%, 8%, 0.85) 55%, rgba(2,0,8,1) 100%)`;

	return (
		<AbsoluteFill style={{ backgroundColor: '#02000a' }}>
			<ThreeCanvas
				width={width}
				height={height}
				gl={{
					antialias: true,
					// ACES tone mapping membuat highlight neon/emas terlihat lebih
					// "cinematic" dan mencegah bagian terang meledak jadi putih polos.
					toneMapping: THREE.ACESFilmicToneMapping,
					toneMappingExposure: 1.15,
					powerPreference: 'high-performance',
				}}
			>
				<Scene />
			</ThreeCanvas>

			{/* Overlay gradasi 2D — memperkuat efek "gradasi warna gelap yang dinamis"
			    tanpa membebani render 3D. mixBlendMode 'screen' membuat overlay
			    menyatu secara natural dengan cahaya neon dari scene 3D di bawahnya. */}
			<AbsoluteFill
				style={{
					background: overlayGradient,
					mixBlendMode: 'screen',
					pointerEvents: 'none',
				}}
			/>

			{/* Vignette gelap di tepi layar supaya fokus tetap ke tengah frame */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)',
					pointerEvents: 'none',
				}}
			/>
		</AbsoluteFill>
	);
};
