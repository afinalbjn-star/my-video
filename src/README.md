# Abstract Loop Background — Remotion + Three.js

Video background abstrak 3D (wave mesh bergelombang + spiral partikel geometris),
15 detik @ 60fps, resolusi 4K (3840x2160), **seamless loop**.

## Struktur Proyek

```
src/
├── index.ts                     # entry point, memanggil registerRoot
├── Root.tsx                     # daftar composition (durasi, fps, resolusi)
├── AbstractLoopBackground.tsx   # composition utama (ThreeCanvas + overlay 2D)
└── three/
    ├── colorUtils.ts            # palet warna & fungsi gradasi
    ├── WaveMesh.tsx              # mesh gelombang 3D + vertex displacement
    ├── SpiralParticles.tsx       # spiral partikel geometris (instanced)
    ├── CameraRig.tsx             # kamera yang mengorbit perlahan
    └── Scene.tsx                 # gabungan lighting + semua elemen 3D
```

## Instalasi

Jika belum punya project Remotion, buat dulu dengan:

```bash
npx create-video@latest
```

Lalu salin folder `src/` di atas ke project Anda, dan install dependency yang dibutuhkan:

```bash
npm install remotion @remotion/three @react-three/fiber three
npm install -D @types/three
```

## Menjalankan Preview

```bash
npx remotion studio src/index.ts
```

## Render ke MP4

```bash
npx remotion render src/index.ts AbstractLoopBackground out/video.mp4
```

## Bagian yang Paling Sering Ingin Diubah

| Yang ingin diubah              | File                     | Konstanta                                   |
| ------------------------------- | ------------------------ | -------------------------------------------- |
| Kecepatan rotasi wave mesh      | `three/WaveMesh.tsx`     | `ROTATION_LOOPS`                             |
| Intensitas/frekuensi gelombang  | `three/WaveMesh.tsx`     | `WAVE_AMPLITUDE_*`, `WAVE_FREQUENCY_*`       |
| Palet warna                     | `three/colorUtils.ts`    | `PALETTE`, `GRADIENT_STOPS`                  |
| Kecepatan spiral partikel       | `three/SpiralParticles.tsx` | `SPIRAL_ROTATION_LOOPS`                  |
| Kecepatan orbit kamera          | `three/CameraRig.tsx`    | `CAMERA_ORBIT_LOOPS`                         |
| Intensitas cahaya               | `three/Scene.tsx`        | `KEY_LIGHT_INTENSITY`, `FILL_LIGHT_INTENSITY`|
| Durasi, fps, resolusi video     | `Root.tsx`                | `FPS`, `DURATION_IN_SECONDS`, `VIDEO_WIDTH/HEIGHT` |

## Catatan Penting: Seamless Loop

Semua sudut/fase animasi dihitung sebagai:

```
angle = (frame / durationInFrames) * Math.PI * 2 * LOOPS
```

`LOOPS` **harus bilangan bulat (integer)** — boleh positif, negatif, atau berbeda-beda
antar elemen — supaya gerakan pada frame terakhir menyambung mulus ke frame pertama
saat video diputar berulang (loop).
