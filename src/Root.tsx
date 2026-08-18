import React from 'react';
import { Composition } from 'remotion';
import { AbstractLoopBackground } from './AbstractLoopBackground';
import AdobeStockTechBackground from './AdobeStockTechBackground';
import NeonCyberTerrain from './NeonCyberTerrain';
import GoldenNetworkBackground from './GoldenNetworkBackground';
import ProfessionalAbstractVideo from './ProfessionalAbstractVideo';
import ProfessionalOceanWaves from './ProfessionalOceanWaves';
import { MagicalTrainRide } from './MagicalTrainRide/MagicalTrainRide';
import { ShuttlecockScene } from './ShuttlecockScene';
import { KidsVideoMain } from './KidsVideo/KidsVideoMain';

const FPS = 60;
const DURATION_IN_SECONDS = 30;
const VIDEO_WIDTH = 3840;
const VIDEO_HEIGHT = 2160;

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="AbstractLoopBackground"
				component={AbstractLoopBackground}
				durationInFrames={FPS * 15}
				fps={FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				defaultProps={{}}
			/>
			<Composition
				id="AdobeStockTechBackground"
				component={AdobeStockTechBackground}
				durationInFrames={FPS * 10}
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
				durationInFrames={FPS * 15}
				fps={FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				defaultProps={{}}
			/>
			<Composition
				id="ProfessionalAbstractVideo"
				component={ProfessionalAbstractVideo}
				durationInFrames={FPS * DURATION_IN_SECONDS}
				fps={FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
				defaultProps={{}}
			/>
			<Composition
				id="ProfessionalOceanWaves"
				component={ProfessionalOceanWaves}
				durationInFrames={600}
				fps={60}
				width={3840}
				height={2160}
			/>
			<Composition
				id="KidsEducationalVideo"
				component={KidsVideoMain}
				durationInFrames={2100}
				fps={30}
				width={3840}
				height={2160}
			/>
			<Composition
				id="MagicalTrainRide"
				component={MagicalTrainRide}
				durationInFrames={2700}
				fps={30}
				width={3840}
				height={2160}
			/>
			<Composition
				id="ShuttlecockScene"
				component={ShuttlecockScene}
				durationInFrames={FPS * 10}
				fps={FPS}
				width={VIDEO_WIDTH}
				height={VIDEO_HEIGHT}
			/>
		</>
	);
};

