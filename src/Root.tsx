import React from 'react';
import { Composition } from 'remotion';
import { AbstractLoopBackground } from './AbstractLoopBackground';
import NeonCyberTerrain from './NeonCyberTerrain';
import GoldenNetworkBackground from './GoldenNetworkBackground';

const FPS = 60;
const DURATION_IN_SECONDS = 15;
const VIDEO_WIDTH = 3840;
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
			<Composition
				id="NeonCyberTerrain"
				component={NeonCyberTerrain}
				durationInFrames={600}
				fps={60}
				width={3840}
				height={2160}
			/>
			<Composition
				id="GoldenNetworkBackground"
				component={GoldenNetworkBackground}
				durationInFrames={FPS * DURATION_IN_SECONDS}
				fps={FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
			/>
		</>
	);
};
