import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

const data = [
	{ label: 'Q1', value: 450, color: 'royalblue cyan' },
	{ label: 'Q2', value: 680, color: 'darkorchid hotpink' },
	{ label: 'Q3', value: 520, color: 'darkorange gold' },
	{ label: 'Q4', value: 910, color: 'seagreen mediumspringgreen' },
];

const maxValue = Math.max(...data.map((d) => d.value));

export const Nando: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, height, width } = useVideoConfig();

	return (
		<AbsoluteFill className="bg-slate-950 flex flex-col items-center justify-center p-20" style={{ fontSize: '1.5rem' }}>
			{/* Background Glow */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-900/20 blur-[120px] rounded-full" />
				<div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full" />
			</div>

			{/* Title Section */}
			<div className="z-10 mb-16 text-center">
				<h1
					className="text-7xl font-black text-white mb-6 tracking-tighter"
					style={{
						opacity: interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp' }),
						transform: `translateY(${interpolate(frame, [0, 40], [40, 0], { extrapolateRight: 'clamp' })}px)`,
						filter: `blur(${interpolate(frame, [0, 40], [10, 0], { extrapolateRight: 'clamp' })}px)`,
					}}
				>
					Business Growth <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">2026</span>
				</h1>
				<p
					className="text-slate-400 text-2xl font-medium tracking-wide"
					style={{
						opacity: interpolate(frame, [20, 60], [0, 1], { extrapolateRight: 'clamp' }),
						letterSpacing: `${interpolate(frame, [20, 60], [10, 2], { extrapolateRight: 'clamp' })}px`,
					}}
				>
					Quarterly Revenue Statistics Analysis
				</p>
			</div>

			{/* Chart Container */}
			<div className="z-10 w-full max-w-4xl h-[400px] flex items-end justify-between gap-8 px-10 relative">
				{/* Grid Lines */}
				{[0, 0.25, 0.5, 0.75, 1].map((p) => (
					<div
						key={p}
						className="absolute w-full border-t border-slate-800/50"
						style={{ bottom: `${p * 100}%`, left: 0 }}
					/>
				))}

				{data.map((item, i) => {
					const delay = i * 15;
					const progress = spring({
						frame: frame - 40 - delay,
						fps,
						config: {
							damping: 18,
							stiffness: 50,
							mass: 1.2,
						},
					});

					const barHeight = (item.value / maxValue) * 100 * progress;

					return (
						<div key={item.label} className="flex-1 flex flex-col items-center gap-6 h-full">
							{/* Bar Container */}
							<div className="relative w-full flex-1 flex items-end group bg-slate-900/40 rounded-xl p-1 shadow-inner border border-white/5">
								<div
									className="w-full rounded-t-xl shadow-2xl transition-all duration-300"
									style={{
										height: `${barHeight}%`,
										background: `linear-gradient(to top, ${item.color.split(' ')[0]}, ${item.color.split(' ')[1]})`,
										boxShadow: `0 0 40px -10px ${item.color.split(' ')[0]}88`
									}}
								>
									{/* Shine & Depth */}
									<div className="absolute inset-0 bg-white/5 opacity-30 rounded-t-xl" />
									<div className="absolute inset-x-0 top-0 h-1 bg-white/20 rounded-t-xl" />
								</div>

								{/* Value Label */}
								<div
									className="absolute -top-16 left-1/2 -translate-x-1/2 text-white font-black text-3xl whitespace-nowrap"
									style={{
										opacity: progress,
										transform: `translateX(-50%) translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
										textShadow: '0 4px 12px rgba(0,0,0,0.8)'
									}}
								>
									<span className="text-sm align-top mr-1 font-bold opacity-70">$</span>
									{item.value}
									<span className="text-sm font-bold opacity-70 ml-1">M</span>
								</div>
							</div>

							{/* Axis Label */}
							<div
								className="text-slate-300 font-bold text-xl tracking-widest"
								style={{
									opacity: interpolate(progress, [0.5, 1], [0, 1]),
									transform: `translateY(${interpolate(progress, [0, 1], [10, 0])}px)`
								}}
							>
								{item.label}
							</div>
						</div>
					);
				})}
			</div>

			{/* Legend / Footer */}
			<div
				className="z-10 mt-20 flex gap-8"
				style={{
					opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' }),
				}}
			>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-blue-500" />
					<span className="text-slate-400 text-sm">Revenue</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-emerald-500" />
					<span className="text-slate-400 text-sm">Profit Target Met</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
