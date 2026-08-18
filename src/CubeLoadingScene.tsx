import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const CubeLoadingScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Durasi 10 detik = 600 frame
	// Animasi loop mulus dengan interpolate
	const progress = (frame % durationInFrames) / durationInFrames;

	return (
		<AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 50 }}>
			{[0, 1, 2].map((i) => {
				const rotation = interpolate(progress, [0, 1], [0, 360]);
				const scale = interpolate(
					Math.sin(progress * Math.PI * 2 + i * 0.5),
					[-1, 1],
					[0.8, 1.5]
				);

				return (
					<div
						key={i}
						style={{
							width: 200,
							height: 200,
							backgroundColor: `hsl(${i * 60 + 200}, 70%, 60%)`,
							transform: `rotate(${rotation}deg) scale(${scale})`,
							borderRadius: 20,
							boxShadow: '0 0 50px rgba(0,0,0,0.5)',
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};
