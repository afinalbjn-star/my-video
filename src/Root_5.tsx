// =====================================================================================
// Root.tsx
// -------------------------------------------------------------------------------------
// Entry point komposisi Remotion. Mendaftarkan komposisi "AbstractLoopBackground"
// dengan spesifikasi: 15 detik @ 60fps, resolusi 4K (3840x2160), landscape.
// =====================================================================================

import React from 'react';
import { Composition } from 'remotion';
import { AbstractLoopBackground } from './AbstractLoopBackground';

// ---------------------------------------------------------------------------------
// ⚙️ PENGATURAN DURASI & RESOLUSI VIDEO — ubah di sini jika perlu
// ---------------------------------------------------------------------------------
const FPS = 60;
const DURATION_IN_SECONDS = 15;
const VIDEO_WIDTH = 3840; // 4K landscape (UHD)
const VIDEO_HEIGHT = 2160;

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="AbstractLoopBackground"
				component={AbstractLoopBackground}
				durationInFrames={FPS * DURATION_IN_SECONDS}
				fps={FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				defaultProps={{}}
			/>
		</>
	);
};
