// =====================================================================================
// colorUtils.ts
// -------------------------------------------------------------------------------------
// Kumpulan utilitas warna untuk palet "abstract loop background".
// Palet ini sengaja dibuat GELAP (dark) dengan aksen ungu/pink neon dan emas hangat,
// sesuai spesifikasi: kombinasi warna dark + purple/pink neon + gold/yellow hangat.
//
// Semua fungsi di sini bersifat PURE (tidak bergantung pada waktu nyata / Date.now()),
// sehingga aman digunakan di dalam Remotion yang mengharuskan animasi deterministik
// berdasarkan frame (bukan requestAnimationFrame).
// =====================================================================================

import * as THREE from 'three';

// -------------------------------------------------------------------------------------
// 🎨 PALET WARNA UTAMA — UBAH DI SINI UNTUK MENGGANTI TEMA WARNA VIDEO
// -------------------------------------------------------------------------------------
export const PALETTE = {
	// Warna dasar sangat gelap, dipakai untuk area "lembah" gelombang & background
	darkBase: new THREE.Color('#04000d'),
	// Warna gelap kedua (sedikit lebih terang), untuk transisi gradasi
	darkSecondary: new THREE.Color('#140726'),
	// Ungu tua, warna "tubuh" utama gelombang
	deepPurple: new THREE.Color('#3c0f70'),
	// Ungu neon terang, aksen tambahan di antara pink & emas
	neonViolet: new THREE.Color('#8b2bff'),
	// Pink/magenta neon, dipakai di area "puncak" gelombang yang terkena cahaya
	neonPink: new THREE.Color('#ff2ec4'),
	// Emas hangat, dipakai di puncak tertinggi / highlight
	warmGold: new THREE.Color('#ffb347'),
	// Emas terang / kuning hangat untuk kesan kilau (specular highlight look)
	brightGold: new THREE.Color('#ffe19c'),
};

// Urutan "stop" gradasi dari titik terendah gelombang (0) ke titik tertinggi (1).
// Silakan tukar urutan / tambah warna baru dari PALETTE di atas untuk bereksperimen.
const GRADIENT_STOPS: THREE.Color[] = [
	PALETTE.darkBase,
	PALETTE.darkSecondary,
	PALETTE.deepPurple,
	PALETTE.neonViolet,
	PALETTE.neonPink,
	PALETTE.warmGold,
	PALETTE.brightGold,
];

/**
 * Interpolasi multi-stop: t = 0 -> warna paling gelap, t = 1 -> warna paling terang.
 * Dipakai untuk mewarnai setiap vertex gelombang berdasarkan ketinggian (displacement).
 */
export function sampleGradient(t: number): THREE.Color {
	const clamped = THREE.MathUtils.clamp(t, 0, 1);
	const segmentCount = GRADIENT_STOPS.length - 1;
	const scaled = clamped * segmentCount;
	const index = Math.min(Math.floor(scaled), segmentCount - 1);
	const localT = scaled - index;

	const colorA = GRADIENT_STOPS[index];
	const colorB = GRADIENT_STOPS[index + 1];

	return colorA.clone().lerp(colorB, localT);
}

/**
 * Menggeser "fase warna" secara siklik (dipakai supaya gradasi warna terlihat mengalir
 * dan berubah dinamis dari waktu ke waktu, tapi tetap looping sempurna karena `shift`
 * juga dihitung dari loopProgress * 2π * N, dengan N = bilangan bulat/integer).
 */
export function sampleGradientWithShift(t: number, shift: number): THREE.Color {
	// shift diharapkan bernilai 0..1 (contoh: hasil dari (sin(angle) + 1) / 2)
	const shifted = (t + shift) % 1;
	return sampleGradient(shifted < 0 ? shifted + 1 : shifted);
}

/**
 * Helper untuk mencampur dua warna berdasarkan gelombang sinus yang looping sempurna
 * (selama `angle` dihitung dari kelipatan integer loopProgress * 2π).
 */
export function oscillateMix(
	colorA: THREE.Color,
	colorB: THREE.Color,
	angle: number,
): THREE.Color {
	const t = (Math.sin(angle) + 1) / 2; // hasil selalu berada di rentang 0..1
	return colorA.clone().lerp(colorB, t);
}
