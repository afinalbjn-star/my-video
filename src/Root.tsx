// path: src\Root.tsx

import React from 'react';
import { Composition } from 'remotion';
import { DataMesh } from './DataMesh';
import { WinterSkyScene, VIDEO_CONFIG as WinterSkyConfig } from './WinterScene';
import RiverFlow, { VIDEO_CONFIG as RiverFlowConfig } from './RiverFlow';
import RainbowLake, { VIDEO_CONFIG as RainbowLakeConfig } from './RainbowLake';
import SineWaveSilk from './SineWaveSilk';
import { TechBackground } from './TechBackground';
import { TechBackgroundComplex } from './TechBackgroundComplex';
import TechNexus from './TechNexus';
import MyVideo from './MyVideo'; // Impor komponen MyVideo
import DarkWaves from './DarkWaves';
import LakeSurface from './LakeSurface';
import BioluminescentDeep, { VIDEO_CONFIG as BioluminescentDeepConfig } from './BioluminescentDeep';
import { CinematicWave } from './CinematicWave';
import InkBillow from './InkBillow';
import SilkWave from './SilkWave';
import { LiquidMetal } from './LiquidMetal';
import { AuroraBorealis } from './AuroraBorealis';
import { CosmicNebula } from './CosmicNebula';
import { CrystalRain } from './CrystalRain';
import { PlasmaWave } from './PlasmaWave';
import { DeepOcean } from './DeepOcean';
import { StarField } from './StarField';
import { MysticForest } from './MysticForest';
import { VolcanicGlass } from './VolcanicGlass';
import { NebulaVortex } from './NebulaVortex';
import { QuantumField } from './QuantumField';
import { FractalDreams } from './FractalDreams';
import { HyperDimensional } from './HyperDimensional';
import { ChromaticFluid } from './ChromaticFluid';
import { MandelbrotPulse } from './MandelbrotPulse';
import { FlowField3D } from './FlowField3D';
import { GeometricSacred } from './GeometricSacred';
import { QuantumEntanglement } from './QuantumEntanglement';
import { CelestialMechanic } from './CelestialMechanic';
import { ParticleWave } from './ParticleWave';
import { EmeraldWaveAnimation } from './EmeraldWaveAnimation';
import { HolographicFoil } from './HolographicFoil';
import HexagonWaveRipple, { VIDEO_CONFIG as HexagonWaveRippleConfig } from './HexagonWaveRipple';
import AIBrainBackground, {
    COMPOSITION_DURATION_IN_FRAMES as AIBrainDurationInFrames,
    COMPOSITION_FPS as AIBrainFps,
    COMPOSITION_HEIGHT as AIBrainHeight,
    COMPOSITION_WIDTH as AIBrainWidth,
} from './AIBrainBackground';
import {
    LowPolyLoop,
    VIDEO_DURATION_IN_FRAMES as LowPolyLoopDurationInFrames,
    VIDEO_FPS as LowPolyLoopFps,
    VIDEO_HEIGHT as LowPolyLoopHeight,
    VIDEO_WIDTH as LowPolyLoopWidth,
} from './LowPolyLoop';
import { VIDEO_CONFIG } from './index'; // VIDEO_CONFIG dari index untuk komposisi lain

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="DataMesh"
                component={DataMesh}
                durationInFrames={450} // 15 detik pada 30fps
                fps={30}
                width={1920}
                height={1080}
            />
            <Composition
                id="WinterSky"
                component={WinterSkyScene}
                durationInFrames={WinterSkyConfig.durationInFrames}
                fps={WinterSkyConfig.fps}
                width={WinterSkyConfig.width}
                height={WinterSkyConfig.height}
            />
            <Composition
                id="RiverFlow"
                component={RiverFlow}
                durationInFrames={RiverFlowConfig.durationInFrames}
                fps={RiverFlowConfig.fps}
                width={RiverFlowConfig.width}
                height={RiverFlowConfig.height}
            />
            <Composition
                id="RainbowLake"
                component={RainbowLake}
                durationInFrames={RainbowLakeConfig.durationInFrames}
                fps={RainbowLakeConfig.fps}
                width={RainbowLakeConfig.width}
                height={RainbowLakeConfig.height}
            />
            <Composition
                id="SineWaveSilk"
                component={SineWaveSilk}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="TechBackground"
                component={TechBackground}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="TechBackgroundComplex"
                component={TechBackgroundComplex}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="TechNexus"
                component={TechNexus}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="MyVideo"
                component={MyVideo}
                durationInFrames={VIDEO_CONFIG.durationInFrames} // 10 detik pada 60fps
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="DarkWaves"
                component={DarkWaves}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="LakeSurface"
                component={LakeSurface}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="BioluminescentDeep"
                component={BioluminescentDeep}
                durationInFrames={BioluminescentDeepConfig.durationInFrames}
                fps={BioluminescentDeepConfig.fps}
                width={BioluminescentDeepConfig.width}
                height={BioluminescentDeepConfig.height}
            />
            <Composition
                id="CinematicWave"
                component={CinematicWave}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="InkBillow"
                component={InkBillow}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="SilkWave"
                component={SilkWave}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="LiquidMetal"
                component={LiquidMetal}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="AuroraBorealis"
                component={AuroraBorealis}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="CosmicNebula"
                component={CosmicNebula}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="CrystalRain"
                component={CrystalRain}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="PlasmaWave"
                component={PlasmaWave}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="DeepOcean"
                component={DeepOcean}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="StarField"
                component={StarField}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="MysticForest"
                component={MysticForest}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="VolcanicGlass"
                component={VolcanicGlass}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="NebulaVortex"
                component={NebulaVortex}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="QuantumField"
                component={QuantumField}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="FractalDreams"
                component={FractalDreams}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="HyperDimensional"
                component={HyperDimensional}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="ChromaticFluid"
                component={ChromaticFluid}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            {/* ─── NEW: 5 Super Complex Seamless Loop Animations ─── */}
            <Composition
                id="MandelbrotPulse"
                component={MandelbrotPulse}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="FlowField3D"
                component={FlowField3D}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="GeometricSacred"
                component={GeometricSacred}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="QuantumEntanglement"
                component={QuantumEntanglement}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="CelestialMechanic"
                component={CelestialMechanic}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="ParticleWave"
                component={ParticleWave}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
            />
            <Composition
                id="EmeraldWaveAnimation"
                component={EmeraldWaveAnimation}
                durationInFrames={VIDEO_CONFIG.durationInFrames}
                fps={VIDEO_CONFIG.fps}
                width={VIDEO_CONFIG.width}
                height={VIDEO_CONFIG.height}
                defaultProps={{
                    theme: 'customPink', // Anda bisa menggunakan ini untuk variasi tema
                    customLayers: undefined,
                    particleSettings: undefined,
                }}
            />
            <Composition
                id="HolographicFoil"
                component={HolographicFoil}
                durationInFrames={600} // 10 detik pada 60fps
                fps={60}
                width={3840}
                height={2160}
            />
            {/* ─── HexagonWaveRipple: 4K 60fps Seamless Loop ─── */}
            <Composition
                id="HexagonWaveRipple"
                component={HexagonWaveRipple}
                durationInFrames={HexagonWaveRippleConfig.durationInFrames}
                fps={HexagonWaveRippleConfig.fps}
                width={HexagonWaveRippleConfig.width}
                height={HexagonWaveRippleConfig.height}
            />
            <Composition
                id="AIBrainBackground"
                component={AIBrainBackground}
                durationInFrames={AIBrainDurationInFrames}
                fps={AIBrainFps}
                width={AIBrainWidth}
                height={AIBrainHeight}
            />
            {/* ─── LowPolyLoop: 4K 60fps Seamless Crystal Mesh Loop ─── */}
            <Composition
                id="LowPolyLoop"
                component={LowPolyLoop}
                durationInFrames={LowPolyLoopDurationInFrames}
                fps={LowPolyLoopFps}
                width={LowPolyLoopWidth}
                height={LowPolyLoopHeight}
            />
        </>
    );
};
