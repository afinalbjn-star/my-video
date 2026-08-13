// =====================================================================================
// index.ts
// -------------------------------------------------------------------------------------
// Titik masuk (entry point) proyek Remotion. File ini yang dipanggil oleh Remotion
// Studio/CLI untuk memuat seluruh composition yang didaftarkan di Root.tsx.
// =====================================================================================

import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
