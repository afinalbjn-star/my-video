import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface KenBurnsImageProps {
    src: string;
    scaleStart?: number;
    scaleEnd?: number;
    translateXStart?: number;
    translateXEnd?: number;
    translateYStart?: number;
    translateYEnd?: number;
}

export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
    src,
    scaleStart = 1,
    scaleEnd = 1.2,
    translateXStart = 0,
    translateXEnd = -100,
    translateYStart = 0,
    translateYEnd = 0,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const scale = interpolate(frame, [0, durationInFrames], [scaleStart, scaleEnd], {
        extrapolateRight: 'clamp',
    });

    const translateX = interpolate(frame, [0, durationInFrames], [translateXStart, translateXEnd], {
        extrapolateRight: 'clamp',
    });

    const translateY = interpolate(frame, [0, durationInFrames], [translateYStart, translateYEnd], {
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                }}
            />
        </AbsoluteFill>
    );
};
