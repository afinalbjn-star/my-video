import React from 'react';
import { GroupProps, ThreeEvent } from '@react-three/fiber';
import { Sphere, Cone } from '@react-three/drei';

interface ShuttlecockProps extends GroupProps {
  onPointerMissed?: (event: MouseEvent) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}

export const Shuttlecock: React.FC<ShuttlecockProps> = ({
  onPointerMissed,
  onPointerOver,
  onPointerOut,
  ...props
}) => {
  return (
    <group
      {...props}
      onPointerMissed={onPointerMissed}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Cork (head) of the shuttlecock */}
      <Sphere args={[0.05, 32, 32]} position={[0, -0.07, 0]}>
        <meshStandardMaterial color="#8B4513" /> {/* Brown color for cork */}
      </Sphere>

      {/* Feathers (skirt) of the shuttlecock */}
      <Cone args={[0.15, 0.4, 32]} rotation={[Math.PI, 0, 0]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} /> {/* White with some transparency for feathers */}
      </Cone>
    </group>
  );
};
