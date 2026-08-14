
import React, { useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing';

const noise = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
`;


const ProfessionalOceanWaves: React.FC = () => {
    const { width, height } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: '#000000' }}>
            <ThreeCanvas
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                camera={{
                    position: [0, 5, 20],
                    fov: 55,
                    near: 0.1,
                    far: 1000,
                }}
            >
                <color attach="background" args={['#000308']} />
                <fog attach="fog" args={['#000308', 20, 60]} />
                
                <ambientLight intensity={0.2} />
                <directionalLight
                    position={[10, 20, 5]}
                    intensity={2.5}
                    color="#FFDDBB"
                />

                <WaveMesh />

                <EffectComposer>
                    <DepthOfField
                        focusDistance={0.02}
                        focalLength={0.15}
                        bokehScale={4}
                        height={720}
                    />
                    <Bloom
                        intensity={0.3}
                        luminanceThreshold={0.4}
                        luminanceSmoothing={0.9}
                        height={1080}
                    />
                </EffectComposer>

                <CameraAnimation />
            </ThreeCanvas>
        </AbsoluteFill>
    );
};

const WaveMesh = () => {
    const { durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();
    const progress = (frame % durationInFrames) / durationInFrames;
    const time = progress * 10.0; // 10 second loop

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0.0 },
                u_sun_direction: { value: new THREE.Vector3(10, 20, 5).normalize() },
                u_sun_color: { value: new THREE.Color('#FFDDBB') },
                u_water_color_deep: { value: new THREE.Color('#001529') },
                u_water_color_shallow: { value: new THREE.Color('#00BFFF') },
                u_foam_color: { value: new THREE.Color('#FFFFFF') },
            },
            vertexShader: `
                uniform float u_time;
                varying vec3 v_world_position;
                varying float v_height;
                ${noise}

                vec3 gerstnerWave(vec2 pos, float steepness, float wavelength, vec2 direction) {
                    float k = 2.0 * 3.14159 / wavelength;
                    float c = sqrt(9.8 / k);
                    float f = k * (dot(direction, pos) - c * u_time);
                    float a = steepness / k;

                    return vec3(
                        direction.x * (a * cos(f)),
                        a * sin(f),
                        direction.y * (a * cos(f))
                    );
                }

                void main() {
                    vec3 p = position;
                    v_world_position = p;

                    // Layer 1: Big, slow waves
                    p += gerstnerWave(position.xz, 0.15, 20.0, vec2(0.8, 0.6));
                    // Layer 2: Medium, faster waves
                    p += gerstnerWave(position.xz, 0.08, 8.0, vec2(1.0, 0.0));
                    // Layer 3: Small ripples
                    p += gerstnerWave(position.xz, 0.04, 3.0, vec2(0.5, -0.5));
                    // Layer 4: More noise
                    p.y += cnoise(vec3(position.x * 0.1, position.z * 0.1, u_time * 0.2)) * 0.3;
                    
                    v_height = p.y;
                    v_world_position = p;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 u_sun_direction;
                uniform vec3 u_sun_color;
                uniform vec3 u_water_color_deep;
                uniform vec3 u_water_color_shallow;
                uniform vec3 u_foam_color;
                uniform float u_time;

                varying vec3 v_world_position;
                varying float v_height;
                ${noise}

                vec3 calculateNormal(vec3 pos) {
                    vec2 e = vec2(0.01, 0.0);
                    // Simplified wave function from vertex shader for normal calculation
                    float h_x = v_height - (sin((pos.x + e.x) * 0.5 + u_time) + cnoise(vec3(pos.x + e.x, pos.z, u_time * 0.2)));
                    float h_z = v_height - (sin((pos.z + e.y) * 0.5 + u_time) + cnoise(vec3(pos.x, pos.z + e.y, u_time * 0.2)));
                    return normalize(vec3(-h_x, 1.0, -h_z));
                }

                void main() {
                    vec3 normal = calculateNormal(v_world_position);
                    vec3 view_dir = normalize(cameraPosition - v_world_position);

                    // Diffuse
                    float diffuse = max(0.0, dot(normal, u_sun_direction)) * 0.5 + 0.5;

                    // Specular (Blinn-Phong)
                    vec3 halfway_dir = normalize(u_sun_direction + view_dir);
                    float spec = pow(max(0.0, dot(normal, halfway_dir)), 64.0);
                    vec3 specular = u_sun_color * spec * 2.0;

                    // Foam
                    float foam_threshold = 0.8;
                    float foam_factor = smoothstep(foam_threshold - 0.1, foam_threshold + 0.1, v_height);
                    foam_factor *= 1.0 - smoothstep(foam_threshold, foam_threshold + 0.3, v_height); // fade out foam
                    foam_factor *= (cnoise(v_world_position.xz * 5.0 + u_time * 0.5) * 0.5 + 0.5); // foam texture
                    vec3 foam_color = u_foam_color * foam_factor;

                    // Water Color
                    vec3 water_color = mix(u_water_color_deep, u_water_color_shallow, smoothstep(-2.0, 2.0, v_height));
                    
                    // Final Color
                    vec3 color = water_color * diffuse + specular + foam_color;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });
    }, []);

    material.uniforms.u_time.value = time;
    
    return (
        <mesh
            geometry={useMemo(() => new THREE.PlaneGeometry(100, 100, 512, 512), [])}
            material={material}
            rotation={[-Math.PI / 2, 0, 0]}
        />
    );
};

const CameraAnimation = () => {
    const { camera } = useThree();
    const { durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();
    const progress = frame / durationInFrames;

    useThree(() => {
        const angle = progress * Math.PI * 0.1;
        const radius = 20 + Math.sin(progress * Math.PI * 2) * 3;
        
        camera.position.set(
            Math.cos(angle) * radius,
            5 + Math.sin(progress * Math.PI) * 2.0,
            Math.sin(angle) * radius
        );
        camera.lookAt(0, 0, 0);
    });

    return null;
}

export default ProfessionalOceanWaves;
