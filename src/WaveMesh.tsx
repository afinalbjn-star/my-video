// =====================================================================================
// WaveMesh.tsx
// -------------------------------------------------------------------------------------
// Komponen utama: permukaan 3D berbentuk gelombang (curved wave mesh) yang berputar
// perlahan, dengan vertex displacement berbasis fungsi sin/cos, material mengkilap
// (shininess) dan bergradasi warna dinamis (dark -> ungu/pink neon -> emas hangat).
//
// PENTING soal SEAMLESS LOOP:
// Semua sudut/fase animasi di bawah ini dihitung dari:
//     angle = loopProgress * Math.PI * 2 * LOOPS
// dengan loopProgress = frame / durationInFrames, dan LOOPS berupa BILANGAN BULAT
// (integer). Ini menjamin gerakan pada frame terakhir menyambung mulus ke frame
// pertama saat video di-loop, karena delta sudut antar-frame selalu konstan.
// JANGAN mengubah LOOPS menjadi angka pecahan (non-integer) kecuali video memang
// tidak akan diputar secara loop.
// =====================================================================================

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE, sampleGradientWithShift } from './colorUtils';

export type WaveMeshProps = {
	/** Lebar plane gelombang dalam unit Three.js */
	planeWidth?: number;
	/** Kedalaman/panjang plane gelombang dalam unit Three.js */
	planeHeight?: number;
	/** Jumlah segmen horizontal — makin besar makin halus, tapi makin berat dirender */
	widthSegments?: number;
	/** Jumlah segmen kedalaman */
	heightSegments?: number;
	/** Posisi Y dasar mesh (dipakai untuk menaikkan/menurunkan mesh reflection) */
	positionY?: number;
	/** Jika true, mesh ini dipakai sebagai "reflection" semu (warna digelapkan) */
	isReflection?: boolean;
};

// ---------------------------------------------------------------------------------
// ⚙️ KECEPATAN ROTASI — ubah nilai di bawah untuk mempercepat/memperlambat putaran
// ---------------------------------------------------------------------------------
// Jumlah putaran penuh (360°) yang dilakukan mesh gelombang selama SATU DURASI PENUH
// video (15 detik). HARUS bilangan bulat (integer) agar loop tetap mulus sempurna.
const ROTATION_LOOPS = 1;
// Kemiringan sudut pandang permukaan (radian). -PI/2 = benar-benar rata/horizontal.
const TILT_X = -1.15;
// Sedikit kemiringan tambahan di sumbu Z supaya komposisi terlihat lebih sinematik.
const TILT_Z = 0.06;

// ---------------------------------------------------------------------------------
// 🌊 INTENSITAS GELOMBANG (VERTEX DISPLACEMENT) — ubah nilai di bawah untuk eksperimen
// ---------------------------------------------------------------------------------
// Gelombang final = kombinasi 3 gelombang sinus/cosinus yang saling tumpang tindih
// (mirip "octaves" pada noise), supaya hasilnya terlihat organik, bukan monoton.
const WAVE_AMPLITUDE_1 = 0.62; // seberapa tinggi gelombang utama (besar & lambat)
const WAVE_FREQUENCY_1 = 0.32; // seberapa rapat gelombang utama
const WAVE_LOOPS_1 = 3; // jumlah siklus penuh gelombang 1 selama durasi video (integer!)

const WAVE_AMPLITUDE_2 = 0.34; // gelombang sekunder (lebih kecil & lebih rapat)
const WAVE_FREQUENCY_2 = 0.55;
const WAVE_LOOPS_2 = -2; // arah berlawanan (nilai negatif) — tetap harus integer

const WAVE_AMPLITUDE_3 = 0.22; // gelombang detail / riak halus
const WAVE_FREQUENCY_3 = 0.85;
const WAVE_LOOPS_3 = 5;

// Seberapa jauh warna "mengalir" berputar mengelilingi palet selama satu durasi video.
// Integer juga, supaya warna kembali persis ke titik awal saat video di-loop.
const COLOR_FLOW_LOOPS = 2;

export const WaveMesh: React.FC<WaveMeshProps> = ({
	planeWidth = 20,
	planeHeight = 14,
	widthSegments = 180,
	heightSegments = 110,
	positionY = 0,
	isReflection = false,
}) => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	// loopProgress selalu berada di rentang [0, 1). Inilah kunci dari seamless loop:
	// delta sudut per frame konstan, sehingga frame terakhir -> frame pertama mulus.
	const loopProgress = frame / durationInFrames;
	const baseAngle = loopProgress * Math.PI * 2;

	const meshRef = useRef<THREE.Mesh>(null);

	// Geometry & posisi vertex ASLI (masih datar/flat) dibuat SEKALI saja dan disimpan
	// sebagai referensi. Setiap frame, displacement dihitung ULANG dari posisi asli ini
	// (bukan menumpuk dari frame sebelumnya) supaya tidak terjadi drift/akumulasi error.
	const { geometry, basePositions } = useMemo(() => {
		const geo = new THREE.PlaneGeometry(
			planeWidth,
			planeHeight,
			widthSegments,
			heightSegments,
		);
		const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
		const base = Float32Array.from(posAttr.array as Float32Array);

		// Siapkan attribute warna per-vertex (akan diisi ulang setiap frame)
		const colorArray = new Float32Array(posAttr.count * 3);
		geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

		return { geometry: geo, basePositions: base };
	}, [planeWidth, planeHeight, widthSegments, heightSegments]);

	// Update posisi (displacement) & warna vertex setiap kali frame berganti.
	// useLayoutEffect dipakai (bukan useEffect) supaya perubahan geometry selesai
	// SEBELUM Remotion mengambil screenshot frame tersebut, sehingga hasil akhir
	// tidak patah-patah / tidak ada kedipan satu frame telat.
	useLayoutEffect(() => {
		const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
		const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;

		// Fase untuk masing-masing lapisan gelombang (semua kelipatan integer baseAngle)
		const phase1 = baseAngle * WAVE_LOOPS_1;
		const phase2 = baseAngle * WAVE_LOOPS_2;
		const phase3 = baseAngle * WAVE_LOOPS_3;
		const colorPhase = baseAngle * COLOR_FLOW_LOOPS;
		// colorShift dinormalisasi ke 0..1 agar bisa dipakai oleh sampleGradientWithShift
		const colorShift = (Math.sin(colorPhase) + 1) / 2;

		let minZ = Infinity;
		let maxZ = -Infinity;
		const displacedZ = new Float32Array(posAttr.count);

		for (let i = 0; i < posAttr.count; i++) {
			const x = basePositions[i * 3];
			const y = basePositions[i * 3 + 1];

			// === Rumus utama vertex displacement (bebas dieksplorasi/diubah) ===
			const wave1 = Math.sin(x * WAVE_FREQUENCY_1 + phase1) * WAVE_AMPLITUDE_1;
			const wave2 = Math.cos(y * WAVE_FREQUENCY_2 + phase2) * WAVE_AMPLITUDE_2;
			const wave3 =
				Math.sin((x + y) * WAVE_FREQUENCY_3 - phase3) * WAVE_AMPLITUDE_3;

			// Sedikit "radial falloff" supaya tepi plane sedikit lebih tenang/rendah
			// dari tengah — memberi kesan permukaan energi yang memusat ke tengah.
			const radial = Math.sqrt(x * x + y * y);
			const falloff = 1 / (1 + radial * 0.015);

			const z = (wave1 + wave2 + wave3) * falloff;

			displacedZ[i] = z;
			if (z < minZ) minZ = z;
			if (z > maxZ) maxZ = z;

			// Sebelum mesh dirotasi, sumbu Z pada geometry adalah sumbu "ketinggian".
			posAttr.setXYZ(i, x, y, z);
		}

		// Warnai tiap vertex berdasarkan ketinggian (dinormalisasi 0..1), lalu geser
		// dengan colorShift supaya gradasi warna terlihat "mengalir" seiring waktu.
		const range = Math.max(maxZ - minZ, 0.0001);
		for (let i = 0; i < posAttr.count; i++) {
			const heightT = (displacedZ[i] - minZ) / range;
			const color = sampleGradientWithShift(heightT, colorShift);

			// Untuk mesh reflection, warna digelapkan supaya terasa seperti pantulan
			// yang redup, bukan duplikat identik dari mesh utama.
			if (isReflection) {
				color.multiplyScalar(0.55);
			}

			colorAttr.setXYZ(i, color.r, color.g, color.b);
		}

		posAttr.needsUpdate = true;
		colorAttr.needsUpdate = true;
		geometry.computeVertexNormals();
	}, [geometry, basePositions, baseAngle, isReflection]);

	// Rotasi keseluruhan mesh (berputar perlahan mengelilingi sumbu Y setelah tilt).
	const rotationY = baseAngle * ROTATION_LOOPS;

	return (
		<mesh
			ref={meshRef}
			geometry={geometry}
			position={[0, positionY, 0]}
			rotation={[TILT_X, rotationY, TILT_Z]}
		>
			{/*
			 * meshPhysicalMaterial dipakai (bukan meshStandardMaterial biasa) karena
			 * mendukung `clearcoat`, yaitu lapisan kilau tambahan di atas permukaan —
			 * mirip cat mobil / logam dipoles — cocok untuk look "neon + gold shiny".
			 */}
			<meshPhysicalMaterial
				vertexColors
				side={THREE.DoubleSide}
				// 🔆 SHININESS / KILAU — mainkan 3 nilai ini untuk look metalik vs matte
				metalness={isReflection ? 0.35 : 0.72}
				roughness={isReflection ? 0.5 : 0.22}
				clearcoat={isReflection ? 0.2 : 0.85}
				clearcoatRoughness={0.18}
				reflectivity={0.9}
				envMapIntensity={1.4}
				// Sedikit emissive gelap-keunguan supaya lembah gelombang tidak mati total
				emissive={PALETTE.darkSecondary}
				emissiveIntensity={isReflection ? 0.05 : 0.12}
				transparent={isReflection}
				opacity={isReflection ? 0.35 : 1}
				flatShading={false}
			/>
		</mesh>
	);
};
