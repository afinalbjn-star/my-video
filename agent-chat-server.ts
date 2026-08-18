import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as os from 'os';
import { WebSocketServer } from 'ws';
import * as pty from '@homebridge/node-pty-prebuilt-multiarch';
import 'dotenv/config';

const PORT = 5000;
const WORKSPACE = process.cwd();
const API_KEY = process.env.GEMINI_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const BLUESMIND_API_KEY = process.env.BLUESMIND_API_KEY || '';
const BLUESMIND_API_BASE_URL = (process.env.BLUESMIND_API_BASE_URL || 'https://api.bluesminds.com/v1').replace(/\/+$/, '');
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'; // default ke model yang lebih hemat kuota
const MEDIA_DIR = path.join(WORKSPACE, 'public', 'media');
const MAX_UPLOAD = 200 * 1024 * 1024;

type Provider = 'gemini' | 'openrouter' | 'groq' | 'cerebras' | 'bluesmind';

interface ModelDef {
  id: string;
  label: string;
  desc: string;
  provider: Provider;
}

// ── Model gratis Gemini (via generativelanguage.googleapis.com) ──
const GEMINI_MODELS: ModelDef[] = [
  { id: 'gemini-3-flash-preview', label: '⚡ Gemini 3 Flash', desc: 'Cepat & gratis, bagus untuk coding + search', provider: 'gemini' },
  { id: 'gemini-flash-latest', label: '⚡ Gemini Flash (latest)', desc: 'Alias flash terbaru yang stabil', provider: 'gemini' },
  { id: 'gemini-2.5-flash-lite', label: '🪶 Gemini 2.5 Flash Lite', desc: 'Paling ringan & hemat kuota', provider: 'gemini' },
  { id: 'gemini-3.1-flash-lite', label: '🪶 Gemini 3.1 Flash Lite', desc: 'Flash lite generasi baru', provider: 'gemini' },
  { id: 'gemini-3.6-flash', label: '🚀 Gemini 3.6 Flash', desc: 'Flash terbaru (jika tersedia untuk akun Anda)', provider: 'gemini' },
  { id: 'gemini-3.7-flash', label: '🚀 Gemini 3.7 Flash', desc: 'Flash terbaru (jika tersedia untuk akun Anda)', provider: 'gemini' },
];

// ── Model gratis OpenRouter (non-Gemini, free tier) ──
// Diverifikasi langsung via https://openrouter.ai/api/v1/models (Aug 2026)
const OPENROUTER_MODELS: ModelDef[] = [
  { id: 'openrouter/free', label: '🌀 Auto (OpenRouter free)', desc: 'Router otomatis: pilih model gratis yang tersedia', provider: 'openrouter' },
  { id: 'openai/gpt-oss-20b:free', label: '🟢 GPT-OSS 20B', desc: 'OpenAI: cepat, tugas coding ringan', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: '💎 Nemotron 3 Ultra', desc: 'NVIDIA: 1M context', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: '💎 Nemotron 3 Super', desc: 'NVIDIA: 1M context', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', label: '💎 Nemotron 3 Nano', desc: 'NVIDIA: cepat, umum', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: '💎 Nemotron Nano Omni', desc: 'NVIDIA: multimodal + reasoning', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3.5-lightning:free', label: '⚡ Nemotron 3.5 Lightning', desc: 'NVIDIA: cepat', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3.5-content-safety:free', label: '🛡️ Nemotron Content Safety', desc: 'NVIDIA: keamanan konten', provider: 'openrouter' },
  { id: 'nvidia/nemotron-nano-9b-v2:free', label: '💎 Nemotron Nano 9B V2', desc: 'NVIDIA: ringan', provider: 'openrouter' },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free', label: '💎 Nemotron Nano 12B VL', desc: 'NVIDIA: vision + language', provider: 'openrouter' },
  { id: 'google/gemma-4-31b-it:free', label: '🪷 Gemma 4 31B', desc: 'Google: multimodal + teks', provider: 'openrouter' },
  { id: 'google/gemma-4-26b-a4b-it:free', label: '🪷 Gemma 4 26B', desc: 'Google: multimodal ringan', provider: 'openrouter' },
  { id: 'cohere/north-mini-code:free', label: '🌿 North Mini Code', desc: 'Cohere: coding', provider: 'openrouter' },
  { id: 'poolside/laguna-s-2.1:free', label: '🏖️ Laguna S 2.1', desc: 'Poolside: coding', provider: 'openrouter' },
  { id: 'poolside/laguna-xs-2.1:free', label: '🏖️ Laguna XS 2.1', desc: 'Poolside: coding ringan', provider: 'openrouter' },
  { id: 'liquid/lfm-2.5-2.6b:free', label: '💧 LFM2.5 2.6B', desc: 'Liquid: sangat ringan', provider: 'openrouter' },
  { id: 'dots-studio/dots-3-note-preview:free', label: '✍️ Dots 3 Note', desc: 'Dots Studio: catatan/reasoning', provider: 'openrouter' },
];

// ── Model gratis Groq (OpenAI-compatible, kuota besar) ──
// Diverifikasi via https://console.groq.com/docs/models (Aug 2026)
const GROQ_MODELS: ModelDef[] = [
  { id: 'llama-3.3-70b-versatile', label: '🦙 Llama 3.3 70B', desc: 'Groq: kuat, 1000 req/hari gratis', provider: 'groq' },
  { id: 'llama-3.1-8b-instant', label: '⚡ Llama 3.1 8B', desc: 'Groq: super cepat, 14.4K req/hari', provider: 'groq' },
  { id: 'openai/gpt-oss-120b', label: '🟢 GPT-OSS 120B', desc: 'Groq: coding + reasoning', provider: 'groq' },
  { id: 'openai/gpt-oss-20b', label: '🟢 GPT-OSS 20B', desc: 'Groq: cepat, ringan', provider: 'groq' },
  { id: 'qwen/qwen3.6-27b', label: '💠 Qwen3.6 27B', desc: 'Groq: 60 RPM', provider: 'groq' },
  { id: 'groq/compound', label: '🧩 Groq Compound', desc: 'Groq: agentic (search + code exec)', provider: 'groq' },
  { id: 'groq/compound-mini', label: '🧩 Groq Compound Mini', desc: 'Groq: agentic ringan', provider: 'groq' },
  { id: 'allam-2-7b', label: '🌙 Allam 2 7B', desc: 'Groq: sangat cepat', provider: 'groq' },
];

// ── Model gratis Cerebras (OpenAI-compatible, sangat cepat) ──
// Diverifikasi via https://inference-docs.cerebras.ai (Aug 2026)
const CEREBRAS_MODELS: ModelDef[] = [
  { id: 'gpt-oss-120b', label: '🟢 GPT-OSS 120B', desc: 'Cerebras: ~3000 tok/s', provider: 'cerebras' },
  { id: 'gemma-4-31b', label: '🪷 Gemma 4 31B', desc: 'Cerebras: preview, cepat', provider: 'cerebras' },
  { id: 'zai-glm-4.7', label: '🌀 Z.ai GLM 4.7', desc: 'Cerebras: preview, kuat', provider: 'cerebras' },
];

// ── Model Bluesmind (OpenAI-compatible, API key + URL dari .env) ──
// HANYA model yang terverifikasi berfungsi (HTTP 200) pada akun ini.
// Base URL bisa diset via BLUESMIND_API_BASE_URL (default https://api.bluesminds.com/v1)
const BLUESMIND_MODELS: ModelDef[] = [
  { id: 'openai/gpt-oss-120b', label: '🟢 Bluesmind GPT-OSS 120B', desc: 'Bluesmind: coding + reasoning', provider: 'bluesmind' },
  { id: 'gpt-5-mini', label: '🟢 Bluesmind GPT-5 Mini', desc: 'Bluesmind: cepat, hemat', provider: 'bluesmind' },
  { id: 'meta/llama-3.3-70b-instruct', label: '🦙 Bluesmind Llama 3.3 70B', desc: 'Bluesmind: kuat, reasoning', provider: 'bluesmind' },
  { id: 'meta/llama-3.1-8b-instruct', label: '⚡ Bluesmind Llama 3.1 8B', desc: 'Bluesmind: cepat & hemat', provider: 'bluesmind' },
];

const ALL_MODELS: ModelDef[] = [...GEMINI_MODELS, ...OPENROUTER_MODELS, ...GROQ_MODELS, ...CEREBRAS_MODELS, ...BLUESMIND_MODELS];

const geminiApiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!API_KEY && !OPENROUTER_API_KEY) {
  console.error('GEMINI_API_KEY atau OPENROUTER_API_KEY belum diset di .env');
  process.exit(1);
}

// ────────────────────────── SYSTEM PROMPT ──────────────────────────
const SYSTEM_PROMPT = `Kamu adalah "NANDO AGENT AI", AI coding agent di proyek Remotion (React/TS) di ${WORKSPACE}, seperti Claude Code: membuat/mengubah/menghapus file dan menjalankan perintah shell untuk membangun video.

PROYEK:
- Remotion 4.0.503. Entry src/index.tsx memanggil registerRoot(RemotionRoot) dari src/Root.tsx.
- Setiap komponen video baru WAJIB didaftarkan di src/Root.tsx sebagai <Composition>.
- Resolusi umum 3840x2160, fps 60, durasi dalam frame.
- Script: npm run build, npm run lint, npx remotion render <CompositionId> out/<nama>.mp4.
- src/=scene/komponen, public/=aset, out/=hasil render.

PANDUAN:
1. "Buat video X": buat komponen di src/, daftarkan di Root.tsx, lalu render.
2. Baca/list dulu sebelum mengubah file.
3. Jalankan npm run lint (tsc) setelah mengubah TS.
4. Jawab dalam bahasa Indonesia, ringkas, sebutkan file yang dibuat/diubah.

API REMOTION (pakai API resmi, jangan menebak):
- useCurrentFrame() -> frame berjalan (mulai 0). useVideoConfig() -> {width,height,fps,durationInFrames}.
- interpolate(inputRange, outputRange, {extrapolateLeft,extrapolateRight}) untuk memetakan nilai antar rentang.
- spring({frame, fps, config}) untuk animasi organik; delay lewat Sequence atau perhitungan frame.
- AbsoluteFill untuk latar penuh; Sequence <Sequence from={f} durationInFrames={n}> untuk bagian terpisah.
- staticFile("media/<nama>") untuk aset dari public/. Untuk audio/video pakai <Audio src=.../> dan <Video src=.../>.
- <Img src=... /> untuk gambar. Rotasi/posisi via style transform.
- Untuk efek generatif (partikel, gelombang, node, sinar) gunakan <AbsoluteFill> + style transform/keyframes JS + useCurrentFrame. Pratinjau pola yang sudah ada: AbstractLoopBackground, NeonCyberTerrain, GoldenNetworkBackground, ProfessionalOceanWaves, FirefliesBackground.

REFERENSI POLA YANG SUDAH ADA (reuse/sesuaikan, bukan buat dari nol):
- Background generatif: src/AbstractLoopBackground.tsx, src/GoldenNetworkBackground.tsx, src/NeonCyberTerrain.tsx.
- Particle/ember/fire: src/FirefliesBackground.tsx, src/SpiralParticles.tsx, src/FireScene.tsx.
- Scene tematik: CityscapeScene, TunnelScene, RubikCubeScene, ShuttlecockScene, ProfessionalOceanWaves.
- Sebelum "render <id>", PASTIKAN id terdaftar di src/Root.tsx via tool list_compositions; jangan tebak id.

TOOL: list_directory, read_file, write_file, delete_file, run_command, search_code, list_compositions, generate_svg, generate_image, open_browser, web_search, fetch_url, list_media.

MEDIA: file user diupload ke public/media/, akses via staticFile("media/<nama>"). Pakai list_media untuk melihat. Gunakan media relevan saat membuat video (Img/Video/Audio/font).

INTERNET: web_search untuk cari data terbaru, fetch_url untuk baca halaman. Rangkum jelas.

MODE AGENTIC: jika mode "Agentik", disiplin kerja: (1) rencana singkat, (2) eksekusi dengan tool, (3) verifikasi hasil (lint/tsc/baca file) lalu lapor.`;

// ────────────────────────── TOOL DECLARATIONS ──────────────────────────
const TOOL_SPECS = [
  {
    name: 'list_directory',
    description: 'Daftar isi direktori relatif ke root proyek.',
    properties: { path: { type: 'STRING', description: 'Path relatif, mis. "src" atau "."' } },
    required: ['path'],
  },
  {
    name: 'read_file',
    description: 'Baca isi file teks relatif ke root proyek.',
    properties: { path: { type: 'STRING', description: 'Path relatif, mis. "src/Root.tsx"' } },
    required: ['path'],
  },
  {
    name: 'write_file',
    description: 'Buat/timpa sebuah file (folder otomatis dibuat).',
    properties: {
      path: { type: 'STRING', description: 'Path relatif, mis. "src/MyVideo.tsx"' },
      content: { type: 'STRING', description: 'Isi file (teks)' },
    },
    required: ['path', 'content'],
  },
  {
    name: 'delete_file',
    description: 'Hapus file atau direktori relatif ke root proyek.',
    properties: { path: { type: 'STRING', description: 'Path relatif, mis. "src/MyVideo.tsx"' } },
    required: ['path'],
  },
  {
    name: 'run_command',
    description: 'Jalankan perintah shell (npm, npx, git, dll) di root proyek.',
    properties: { command: { type: 'STRING', description: 'Perintah shell lengkap' } },
    required: ['command'],
  },
  {
    name: 'web_search',
    description: 'Cari info/berita/data terbaru di internet.',
    properties: { query: { type: 'STRING', description: 'Kata kunci pencarian' } },
    required: ['query'],
  },
  {
    name: 'fetch_url',
    description: 'Ambil dan baca konten teks sebuah halaman web (URL).',
    properties: { url: { type: 'STRING', description: 'URL lengkap halaman web' } },
    required: ['url'],
  },
  {
    name: 'list_media',
    description: 'Daftar media yang diupload user di public/media/ (path relatif "media/logo.png", akses via staticFile()).',
    properties: {},
    required: [],
  },
  {
    name: 'list_compositions',
    description: 'Baca src/Root.tsx dan daftar semua <Composition> beserta id, durasi, resolusi, fps, dan komponennya. Gunakan SEBELUM render agar id yang dipakai pasti benar.',
    properties: {},
    required: [],
  },
  {
    name: 'search_code',
    description: 'Cari teks/pola di seluruh kode proyek (regex). Berguna untuk menemukan pemakaian fungsi, nama file, atau lokasi bug tanpa baca file satu-satu.',
    properties: { pattern: { type: 'STRING', description: 'Pola regex atau teks yang dicari' }, include: { type: 'STRING', description: 'Filter nama file, mis. "*.tsx" atau "*.ts" (opsional)' }, path: { type: 'STRING', description: 'Direktori awal pencarian, default "." (opsional)' } },
    required: ['pattern'],
  },
  {
    name: 'generate_svg',
    description: 'Buat gambar vektor SVG dari deskripsi. Terima kode SVG lengkap (tanpa tag <svg> pembungkus opsional) lalu simpan ke public/media/ dan kembalikan path untuk preview & dipakai di video. Cocok untuk: logo, ikon, ilustrasi vektor, background pattern, diagram, shape. Pastikan SVG valid, ukuran viewBox konsisten (mis. 800x600), dan tanpa <script> atau referensi eksternal.',
    properties: { svg: { type: 'STRING', description: 'Kode SVG lengkap (element <svg> ... </svg>)' }, name: { type: 'STRING', description: 'Nama file tanpa ekstensi, mis. "logo_nando". Default: auto (opsional)' } },
    required: ['svg'],
  },
  {
    name: 'open_browser',
    description: 'Buka URL di browser default pengguna (Windows). Gunakan untuk membuka hasil preview, halaman ImageFX, dokumentasi, atau URL lain. Kembalikan konfirmasi.',
    properties: { url: { type: 'STRING', description: 'URL lengkap (http/https) atau path lokal yang akan dibuka' } },
    required: ['url'],
  },
  {
    name: 'generate_image',
    description: 'Hasilkan gambar (foto/ilustrasi) memakai Gemini Imagen. Hanya berfungsi jika GEMINI_API_KEY aktif dengan billing. Berikan prompt deskriptif bahasa Inggris untuk hasil terbaik.',
    properties: { prompt: { type: 'STRING', description: 'Prompt gambar (deskripsi detail, gaya, warna, komposisi)' }, name: { type: 'STRING', description: 'Nama file tanpa ekstensi, mis. "hero_bg". Default: auto (opsional)' } },
    required: ['prompt'],
  },
];

// Gemini: tools = functionDeclarations
const GEMINI_TOOLS = {
  functionDeclarations: TOOL_SPECS.map((s) => ({
    name: s.name,
    description: s.description,
    parameters: { type: 'OBJECT', properties: s.properties, required: s.required },
  })),
};

// OpenAI/OpenRouter: tools = [{type:'function', function:{...}}] dengan tipe lowercase
function toOpenAITools() {
  const mapType = (t: string) => (t === 'STRING' ? 'string' : 'object');
  return TOOL_SPECS.map((s) => ({
    type: 'function',
    function: {
      name: s.name,
      description: s.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(s.properties).map(([k, v]) => [k, { type: mapType((v as any).type), description: (v as any).description }])
        ),
        required: s.required,
      },
    },
  }));
}

// ────────────────────────── TOOL HANDLERS ──────────────────────────
function resolveSafe(rel: string): string {
  const full = path.resolve(WORKSPACE, rel);
  if (!full.startsWith(WORKSPACE + path.sep) && full !== WORKSPACE) {
    throw new Error('Path di luar workspace ditolak');
  }
  return full;
}

const TOOL_HANDLERS: Record<string, (args: any) => any> = {
  list_directory: ({ path: p = '.' }) => {
    const full = resolveSafe(p);
    if (!fs.existsSync(full)) return { error: `Direktori tidak ada: ${p}` };
    const entries = fs.readdirSync(full, { withFileTypes: true }).map((e) => ({
      name: e.name,
      type: e.isDirectory() ? 'dir' : 'file',
    }));
    return { entries };
  },
  read_file: ({ path: p }) => {
    const full = resolveSafe(p);
    if (!fs.existsSync(full)) return { error: `File tidak ada: ${p}` };
    const content = fs.readFileSync(full, 'utf-8');
    const max = MAX_TOOL_RESULT;
    return {
      content: content.length > max ? content.slice(0, max) + `\n... (terpotong, total ${content.length} karakter)` : content,
      length: content.length,
    };
  },
  write_file: ({ path: p, content }) => {
    const full = resolveSafe(p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, String(content), 'utf-8');
    return { success: true, path: p };
  },
  delete_file: ({ path: p }) => {
    const full = resolveSafe(p);
    if (!fs.existsSync(full)) return { error: `Tidak ada: ${p}` };
    fs.rmSync(full, { recursive: true, force: true });
    return { success: true, deleted: p };
  },
  run_command: ({ command }) => {
    const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh';
    try {
      const result = cp.execSync(command, {
        cwd: WORKSPACE,
        encoding: 'utf-8',
        timeout: 120000,
        shell,
        maxBuffer: 20 * 1024 * 1024,
      });
      let output = result || '(tidak ada output)';
      if (output.length > MAX_TOOL_RESULT) output = output.slice(0, MAX_TOOL_RESULT) + `\n... (output dipotong, total ${result.length} karakter)`;
      return { exitCode: 0, output };
    } catch (err: any) {
      let output = (err.stdout || '') + (err.stderr || '') + (err.message || '');
      if (output.length > MAX_TOOL_RESULT) output = output.slice(0, MAX_TOOL_RESULT) + '\n... (output dipotong)';
      return {
        exitCode: err.status ?? -1,
        output,
        error: String(err.message || ''),
      };
    }
  },
  web_search: async ({ query }) => {
    if (!query) return { error: 'Query wajib diisi' };
    const engines = [
      async () => {
        const url = 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&num=8&hl=id';
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9',
          },
          signal: AbortSignal.timeout(20000),
        });
        const html = await res.text();
        return parseGoogleResults(html);
      },
      async () => {
        const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query) + '&kl=id-id';
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9',
          },
          signal: AbortSignal.timeout(20000),
        });
        const html = await res.text();
        return parseDuckDuckGoResults(html);
      },
    ];

    for (const engine of engines) {
      try {
        const results = await engine();
        if (results && results.length) return { results };
      } catch (err) {
        // coba engine berikutnya
      }
    }
    return { error: 'Tidak ada hasil pencarian. Coba ubah kata kunci.' };
  },
  fetch_url: async ({ url }) => {
    if (!url) return { error: 'URL wajib diisi' };
    if (!/^https?:\/\//i.test(url)) return { error: 'URL harus http/https' };
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(25000),
      });
      const html = await res.text();
      const text = stripHtml(html);
      return { url, status: res.status, text: text.slice(0, MAX_TOOL_RESULT) };
    } catch (err: any) {
      return { error: 'Gagal mengambil halaman: ' + err.message };
    }
  },
  list_media: () => {
    if (!fs.existsSync(MEDIA_DIR)) return { files: [] };
    const files = fs.readdirSync(MEDIA_DIR)
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const stat = fs.statSync(path.join(MEDIA_DIR, f));
        return {
          name: f,
          size: stat.size,
          path: 'media/' + f,
          url: '/media/' + encodeURIComponent(f),
          ext: path.extname(f).toLowerCase().slice(1),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return { files };
  },
  list_compositions: () => {
    const rootPath = path.join(WORKSPACE, 'src', 'Root.tsx');
    if (!fs.existsSync(rootPath)) return { error: 'src/Root.tsx tidak ditemukan' };
    const src = fs.readFileSync(rootPath, 'utf-8');
    // Ambil blok <Composition ... /> dan ekstrak atribut id, width, height, fps, durationInFrames, component
    const comps: any[] = [];
    const re = /<Composition\b([^>]*?)\/?>/gi;
    let m: RegExpExecArray | null;
    const attrRe = (s: string, name: string) => {
      const am = new RegExp(name + '\\s*=\\s*["\\\']([^"\\\']*)["\\\']', 'i').exec(s);
      return am ? am[1] : '';
    };
    while ((m = re.exec(src)) !== null) {
      const block = m[1];
      const id = attrRe(block, 'id');
      if (!id) continue;
      comps.push({
        id,
        width: attrRe(block, 'width') || undefined,
        height: attrRe(block, 'height') || undefined,
        fps: attrRe(block, 'fps') || undefined,
        durationInFrames: attrRe(block, 'durationInFrames') || undefined,
        component: attrRe(block, 'component') || undefined,
      });
    }
    return { count: comps.length, compositions: comps, note: 'Sebelum render, pastikan id ada di daftar ini.' };
  },
  search_code: ({ pattern, include, path: dir = '.' }) => {
    if (!pattern) return { error: 'pattern wajib diisi' };
    let rx: RegExp;
    try { rx = new RegExp(pattern); } catch { rx = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
    const base = resolveSafe(dir);
    if (!fs.existsSync(base)) return { error: `Direktori tidak ada: ${dir}` };
    const results: any[] = [];
    const ignore = /node_modules|\.git|build|out|dist|\.cache|venv/i;
    const fileRe = include ? new RegExp('^' + include.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$') : null;
    const walk = (cur: string) => {
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (ignore.test(e.name)) continue;
        const full = path.join(cur, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.isFile()) {
          if (fileRe && !fileRe.test(e.name)) continue;
          let text: string;
          try {
            text = fs.readFileSync(full, 'utf-8');
          } catch { continue; }
          const lines = text.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            if (rx.test(lines[i])) {
              results.push({ file: path.relative(WORKSPACE, full), line: i + 1, match: lines[i].slice(0, 200) });
              if (results.length >= 80) return; // batasi hasil
            }
          }
        }
      }
    };
    walk(base);
    return { count: results.length, results: results.slice(0, 40) };
  },
  generate_svg: ({ svg, name }) => {
    let code = String(svg || '').trim();
    if (!code) return { error: 'svg wajib diisi' };
    // Keamanan: larang script & referensi eksternal
    if (/<script/i.test(code)) return { error: 'SVG tidak boleh mengandung <script>' };
    if (/href=["'](https?:)?\/\//i.test(code)) return { error: 'Referensi eksternal tidak diizinkan' };
    // Pastikan ada tag svg
    if (!/<svg/i.test(code)) code = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">${code}</svg>`;
    const ext = '.svg';
    const fileName = (name ? String(name).replace(/[^a-zA-Z0-9_\-]+/g, '_') : 'svg_' + Date.now().toString(36)) + ext;
    if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
    const full = path.join(MEDIA_DIR, fileName);
    fs.writeFileSync(full, code, 'utf-8');
    return {
      success: true,
      path: 'media/' + fileName,
      url: '/media/' + encodeURIComponent(fileName),
      name: fileName,
      preview: '/media/' + encodeURIComponent(fileName),
      note: 'SVG tersimpan. Akses di video via staticFile("media/' + fileName + '") atau <Img src="media/' + fileName + '" />.',
    };
  },
  open_browser: ({ url }) => {
    const target = String(url || '').trim();
    if (!target) return { error: 'url wajib diisi' };
    // Path lokal yang valid → buka file; selain itu harus http/https
    const isLocal = fs.existsSync(path.resolve(target));
    if (!isLocal && !/^https?:\/\//i.test(target)) {
      return { error: 'URL harus http/https atau path file lokal' };
    }
    try {
      if (os.platform() === 'win32') {
        cp.execSync(`start "" "${target}"`, { cwd: WORKSPACE });
      } else if (os.platform() === 'darwin') {
        cp.execSync(`open "${target}"`);
      } else {
        cp.execSync(`xdg-open "${target}"`);
      }
      return { success: true, opened: target };
    } catch (err: any) {
      return { error: 'Gagal membuka browser: ' + err.message };
    }
  },
  generate_image: async ({ prompt, name }) => {
    const p = String(prompt || '').trim();
    if (!p) return { error: 'prompt wajib diisi' };
    if (!API_KEY) return { error: 'GEMINI_API_KEY belum diset. Gambar AI butuh Gemini API dengan billing aktif.' };
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: p }] }] }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || ('HTTP ' + res.status);
        return { error: 'Gagal generate gambar: ' + msg, note: msg.includes('billing') || msg.includes('quota') || msg.includes('not enabled') ? 'Aktifkan billing di Google AI Studio (ai.google.dev/aistudio) untuk Gemini API.' : undefined };
      }
      // Ambil data inline base64 dari response
      const candidates = data?.candidates || [];
      let b64 = '';
      for (const c of candidates) {
        const parts = c?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) { b64 = part.inlineData.data; break; }
        }
        if (b64) break;
      }
      if (!b64) return { error: 'Tidak ada data gambar di respons. Coba lagi atau periksa model.' };
      const buf = Buffer.from(b64, 'base64');
      const fileName = (name ? String(name).replace(/[^a-zA-Z0-9_\-]+/g, '_') : 'img_' + Date.now().toString(36)) + '.png';
      if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
      fs.writeFileSync(path.join(MEDIA_DIR, fileName), buf);
      return {
        success: true,
        path: 'media/' + fileName,
        url: '/media/' + encodeURIComponent(fileName),
        name: fileName,
        preview: '/media/' + encodeURIComponent(fileName),
        note: 'Gambar tersimpan. Akses di video via staticFile("media/' + fileName + '") atau <Img src="media/' + fileName + '" />.',
      };
    } catch (err: any) {
      return { error: 'Gagal generate gambar: ' + err.message };
    }
  },
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGoogleResults(html: string): Array<{ title: string; link: string; snippet: string }> {
  const results: Array<{ title: string; link: string; snippet: string }> = [];
  const re = /<a href="\/url\?q=([^&"]+)[^"]*"[^>]*>(.*?)<\/a>/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(html))) {
    const link = decodeURIComponent(m[1]);
    const title = stripHtml(m[2]);
    if (seen.has(link)) continue;
    seen.add(link);
    results.push({ title: title.slice(0, 120), link, snippet: '' });
    if (results.length >= 8) break;
  }
  return results;
}

function parseDuckDuckGoResults(html: string): Array<{ title: string; link: string; snippet: string }> {
  const results: Array<{ title: string; link: string; snippet: string }> = [];
  const blockRe = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = blockRe.exec(html))) {
    const link = m[1].replace(/&amp;/g, '&');
    const title = stripHtml(m[2]);
    const snippet = stripHtml(m[3]);
    if (seen.has(link)) continue;
    seen.add(link);
    results.push({ title: title.slice(0, 120), link, snippet: snippet.slice(0, 200) });
    if (results.length >= 8) break;
  }
  if (!results.length) {
    const re = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>/g;
    while ((m = re.exec(html))) {
      const link = m[1].replace(/&amp;/g, '&');
      const title = stripHtml(m[2]);
      if (seen.has(link)) continue;
      seen.add(link);
      results.push({ title: title.slice(0, 120), link, snippet: '' });
      if (results.length >= 8) break;
    }
  }
  return results;
}

// ────────────────────────── CONVERSATION / STREAMING ──────────────────────────
interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<Record<string, any>>;
}

interface StreamOpts {
  search?: boolean;
  noTools?: boolean;
  rotateBy?: number;
  signal?: AbortSignal;
}

let callIdCounter = 1000;

const MAX_HISTORY = 6;            // jumlah pesan riwayat maksimum yang dikirim ke model (dikurangi untuk hemat token)
const MAX_AGENTIC_ITERATIONS = 6; // putaran tool-call per pesan: cukup untuk menyelesaikan tugas multi-langkah
const MAX_TOOL_RESULT = 6000;     // batas teks hasil tool yang dikirim kembali ke model (dikurangi untuk hemat token)

// Pangkas history agar request tidak membengkak (menghemat token/kuota).
function trimHistory(contents: GeminiContent[]): GeminiContent[] {
  if (contents.length <= MAX_HISTORY) return contents;
  return contents.slice(-MAX_HISTORY);
}

function buildGeminiRequest(contents: GeminiContent[], opts: StreamOpts = {}): any {
  const req: any = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: trimHistory(contents),
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  };
  if (!opts.noTools) req.tools = [GEMINI_TOOLS];
  return req;
}

// Konversi percakapan format Gemini -> OpenAI messages untuk OpenRouter
function geminiToOpenAIMessages(contents: GeminiContent[]): Array<any> {
  const msgs: Array<any> = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const c of contents) {
    if (c.role === 'user') {
      const texts = c.parts.filter((p) => p.text !== undefined).map((p) => p.text);
      const fnResps = c.parts.filter((p) => p.functionResponse);
      for (const fr of fnResps) {
        const fn = fr.functionResponse;
        msgs.push({
          role: 'tool',
          tool_call_id: fn.id || fn.name,
          content: JSON.stringify(fn.response || {}),
        });
      }
      if (texts.length) msgs.push({ role: 'user', content: texts.join('\n') });
    } else if (c.role === 'model') {
      const texts = c.parts.filter((p) => p.text !== undefined).map((p) => p.text);
      const calls = c.parts.filter((p) => p.functionCall);
      if (calls.length) {
        const toolCalls = calls.map((p, i) => {
          const fc = p.functionCall;
          return {
            id: fc.id || `call_${++callIdCounter}`,
            type: 'function',
            function: { name: fc.name, arguments: JSON.stringify(fc.args || {}) },
          };
        });
        msgs.push({ role: 'assistant', content: texts.join('') || null, tool_calls: toolCalls });
      } else if (texts.length) {
        msgs.push({ role: 'assistant', content: texts.join('') });
      }
    }
  }
  return msgs;
}

function buildOpenRouterRequest(model: string, contents: GeminiContent[], opts: StreamOpts = {}): any {
  const req: any = {
    model,
    messages: geminiToOpenAIMessages(trimHistory(contents)),
    temperature: 0.7,
    max_tokens: 8192,
    stream: true,
  };
  if (!opts.noTools) {
    const tools = toOpenAITools();
    if (tools.length) req.tools = tools;
  }
  return req;
}

// ────────────────────────── PROVIDER STREAMS ──────────────────────────
interface StreamChunk {
  text?: string;
  reasoning?: string;
  functionCall?: { name: string; args: any; id?: string };
}

// Error model dengan kategori untuk failover
class ModelError extends Error {
  kind: 'limit' | 'auth' | 'http' | 'network';
  retryAfter?: number;
  constructor(kind: ModelError['kind'], msg: string, retryAfter?: number) {
    super(msg);
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

// --- Gemini stream (SSE) ---
async function* streamGemini(model: string, contents: GeminiContent[], opts: StreamOpts = {}): AsyncGenerator<StreamChunk> {
  let res: Response;
  try {
    res = await fetch(geminiApiUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGeminiRequest(contents, opts)),
      signal: opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(180000)]) : AbortSignal.timeout(180000),
    });
  } catch (err: any) {
    throw new ModelError('network', `Gemini network error: ${err.message}`);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
    if (res.status === 429) throw new ModelError('limit', `Gemini ${model} limit (${res.status})`, retryAfter);
    if (res.status === 402 || res.status === 401 || res.status === 403) throw new ModelError('auth', `Gemini ${model} auth (${res.status})`);
    throw new ModelError('http', `Gemini ${model} HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  if (!res.body) throw new ModelError('http', 'Gemini: no response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, '\n');
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const json = trimmed.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      let chunk: any;
      try { chunk = JSON.parse(json); } catch { continue; }

      const candidate = chunk?.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part.thought) {
          if (part.text !== undefined) yield { reasoning: part.text };
        } else if (part.text !== undefined) {
          yield { text: part.text };
        } else if (part.functionCall) {
          const fc = part.functionCall;
          const args = typeof fc.args === 'string' ? JSON.parse(fc.args || '{}') : (fc.args || {});
          yield {
            functionCall: {
              name: fc.name,
              args,
              id: fc.id || `call_${++callIdCounter}`,
            },
          };
        }
      }
    }
  }

  buffer = buffer.replace(/\r\n/g, '\n').trim();
  if (buffer.startsWith('data:')) {
    const json = buffer.slice(5).trim();
    if (json && json !== '[DONE]') {
      try {
        const chunk = JSON.parse(json);
        const parts = chunk?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.thought) {
            if (part.text !== undefined) yield { reasoning: part.text };
          } else if (part.text !== undefined) yield { text: part.text };
          else if (part.functionCall) {
            const fc = part.functionCall;
            const args = typeof fc.args === 'string' ? JSON.parse(fc.args || '{}') : (fc.args || {});
            yield {
              functionCall: {
                name: fc.name,
                args,
                id: fc.id || `call_${++callIdCounter}`,
              },
            };
          }
        }
      } catch {}
    }
  }
}

// --- Stream OpenAI-compatible (OpenRouter / Groq / Cerebras) ---
interface OpenAICompatConfig {
  url: string;
  apiKey: string;
  name: string;
}

async function* streamOpenAICompat(
  model: string,
  contents: GeminiContent[],
  opts: StreamOpts,
  cfg: OpenAICompatConfig
): AsyncGenerator<StreamChunk> {
  let res: Response;
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'NANDO AGENT AI',
      },
      body: JSON.stringify(buildOpenRouterRequest(model, contents, opts)),
      signal: opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(180000)]) : AbortSignal.timeout(180000),
    });
  } catch (err: any) {
    throw new ModelError('network', `${cfg.name} network error: ${err.message}`);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
    if (res.status === 429) throw new ModelError('limit', `${cfg.name} ${model} limit (${res.status})`, retryAfter);
    // 402 = butuh bayar/kredit (Cerebras free trial belum aktif) → jangan dihitung sebagai limit, skip provider saja
    if (res.status === 402 || res.status === 401 || res.status === 403) throw new ModelError('auth', `${cfg.name} ${model} auth (${res.status})`);
    throw new ModelError('http', `${cfg.name} ${model} HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  if (!res.body) throw new ModelError('http', `${cfg.name}: no response body`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  // akumulasi tool_calls (OpenAI mengirim arguments secara terpisah)
  const toolAccum = new Map<number, { id: string; name: string; args: string }>();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, '\n');
    // separator "\n" per event
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const json = trimmed.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      let chunk: any;
      try { chunk = JSON.parse(json); } catch { continue; }

      const choice = chunk?.choices?.[0];
      if (!choice) continue;
      const delta = choice.delta || {};

      if (delta.reasoning_content) yield { reasoning: delta.reasoning_content };
      else if (delta.reasoning) yield { reasoning: delta.reasoning };

      if (delta.content) yield { text: delta.content };

      if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          let cur = toolAccum.get(idx) || { id: '', name: '', args: '' };
          if (tc.id) cur.id = tc.id;
          if (tc.function?.name) cur.name = tc.function.name;
          if (tc.function?.arguments) cur.args += tc.function.arguments;
          toolAccum.set(idx, cur);
        }
      }

      if (choice.finish_reason === 'tool_calls') {
        for (const tc of Array.from(toolAccum.values())) {
          let args: any = {};
          try { args = JSON.parse(tc.args || '{}'); } catch {}
          yield { functionCall: { name: tc.name, args, id: tc.id || `call_${++callIdCounter}` } };
        }
        toolAccum.clear();
      }
    }
  }

  // Proses sisa buffer yang tidak diakhiri newline
  const tail = buffer.trim();
  if (tail.startsWith('data:')) {
    const json = tail.slice(5).trim();
    if (json && json !== '[DONE]') {
      try {
        const chunk = JSON.parse(json);
        const choice = chunk?.choices?.[0];
        const delta = choice?.delta || {};
        if (delta.content) yield { text: delta.content };
        if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            let cur = toolAccum.get(idx) || { id: '', name: '', args: '' };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.name = tc.function.name;
            if (tc.function?.arguments) cur.args += tc.function.arguments;
            toolAccum.set(idx, cur);
          }
        }
      } catch {}
    }
  }

  // Flush tool call yang terkumpul namun tidak memicu finish_reason 'tool_calls'.
  // Beberapa provider (mis. Bluesmind) tidak selalu mengirim finish_reason tsb,
  // sehingga tanpa ini tool call hilang dan agent berhenti kosong di tengah perintah.
  for (const tc of Array.from(toolAccum.values())) {
    if (!tc.name) continue;
    let args: any = {};
    try { args = JSON.parse(tc.args || '{}'); } catch {}
    yield { functionCall: { name: tc.name, args, id: tc.id || `call_${++callIdCounter}` } };
  }
}

function streamOpenRouter(model: string, contents: GeminiContent[], opts: StreamOpts = {}): AsyncGenerator<StreamChunk> {
  return streamOpenAICompat(model, contents, opts, { url: OPENROUTER_URL, apiKey: OPENROUTER_API_KEY, name: 'OpenRouter' });
}

function streamGroq(model: string, contents: GeminiContent[], opts: StreamOpts = {}): AsyncGenerator<StreamChunk> {
  return streamOpenAICompat(model, contents, opts, { url: 'https://api.groq.com/openai/v1/chat/completions', apiKey: GROQ_API_KEY, name: 'Groq' });
}

function streamCerebras(model: string, contents: GeminiContent[], opts: StreamOpts = {}): AsyncGenerator<StreamChunk> {
  return streamOpenAICompat(model, contents, opts, { url: 'https://api.cerebras.ai/v1/chat/completions', apiKey: CEREBRAS_API_KEY, name: 'Cerebras' });
}

function streamBluesmind(model: string, contents: GeminiContent[], opts: StreamOpts = {}): AsyncGenerator<StreamChunk> {
  return streamOpenAICompat(model, contents, opts, { url: BLUESMIND_API_BASE_URL + '/chat/completions', apiKey: BLUESMIND_API_KEY, name: 'Bluesmind' });
}

// Cooldown PER-MODEL: kegagalan satu model tidak membekukan model lain di
// provider yang sama. (Provider-wide cooldown dihapus agar tidak membekukan
// semua model sekaligus ketika satu model kena limit.)
const cooldownUntil = new Map<string, number>();
const failCount = new Map<string, number>();
const MAX_ATTEMPTS = 8;

// Parse header Retry-After (detik atau tanggal HTTP). Fallback undefined.
function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const secs = parseInt(header, 10);
  if (!isNaN(secs) && secs >= 0) return Math.min(secs, 300);
  const t = Date.parse(header);
  if (!isNaN(t)) return Math.min(Math.max(0, Math.ceil((t - Date.now()) / 1000)), 300);
  return undefined;
}

function markOk(modelId: string) {
  cooldownUntil.delete(modelId);
  failCount.delete(modelId);
}

function markFail(modelId: string, kind: string, retryAfter?: number) {
  const n = (failCount.get(modelId) || 0) + 1;
  failCount.set(modelId, n);
  let cd: number;
  // Backoff lebih pendek & cap rendah agar model cepat kembali aktif.
  if (kind === 'limit' && retryAfter) cd = retryAfter * 1000;
  else if (kind === 'limit') cd = Math.min(30000, 5000 * Math.pow(2, n - 1));
  else if (kind === 'auth') cd = 120000; // 2 menit: jangan spam provider tanpa key/kredit
  else cd = Math.min(60000, 10000 * Math.pow(2, n - 1));
  cooldownUntil.set(modelId, Date.now() + cd);
}

function isCooldown(modelId: string): boolean {
  return (cooldownUntil.get(modelId) || 0) > Date.now();
}

// Rate limiter PER-MODEL (+ provider): jeda antar panggilan model yang sama.
// Panggilan ke model berbeda tidak saling mengganggu.
const lastCallAt = new Map<string, number>();
const MIN_INTERVAL_MS: Record<Provider, number> = {
  gemini: 1200,     // cukup untuk jaga RPM tanpa bikin lambat
  openrouter: 1000, // 
  groq: 1200,       // 
  cerebras: 1000,   // 
  bluesmind: 2500,  // beri jeda lebih agar tidak kena rate-limit di tengah stream
};

function providerThrottled(modelId: string, provider: string): boolean {
  const key = modelId + '::' + provider;
  const last = lastCallAt.get(key) || 0;
  const min = MIN_INTERVAL_MS[provider as Provider] || 1500;
  return (Date.now() - last) < min;
}

function markCall(modelId: string, provider: string) {
  lastCallAt.set(modelId + '::' + provider, Date.now());
}

// Mode failover: TRUE = auto-pindah model saat limit (default); FALSE = hanya pakai model pilihan user.
// Set FALSE bila ingin Anda yang memegang kendali penuh pemilihan model (hapus failover).
const ENABLE_FAILOVER = true;

function buildModelOrder(preferred?: string, rotateBy = 0): ModelDef[] {
  const order: ModelDef[] = [];
  const add = (id: string) => {
    const def = ALL_MODELS.find((m) => m.id === id);
    if (def && !order.includes(def)) order.push(def);
  };

  // Tanpa failover: HANYA model pilihan user. Tidak ada default fallback.
  if (!ENABLE_FAILOVER) {
    add(preferred || '');
    return order;
  }

  add(preferred || '');
  add(DEFAULT_MODEL);
  add('openrouter/free');

  // Prioritaskan model yang lebih hemat kuota (gemini-2.5-flash-lite)
  const liteModels = ALL_MODELS.filter(m => m.id.includes('lite') || m.id.includes('nano'));
  for (const lm of liteModels) {
    if (!order.includes(lm)) order.push(lm);
  }

  // Interleave antar provider agar tidak menguras satu provider dulu,
  // lalu bergantian Gemini → Groq → OpenRouter → Cerebras.
  // rotateBy menggeser provider awal setiap turn (mode agentic).
  const providers: Provider[] = ['gemini', 'groq', 'openrouter', 'cerebras', 'bluesmind'];
  let guard = 0;
  while (order.length < ALL_MODELS.length && guard++ < ALL_MODELS.length * 2) {
    for (let pi = 0; pi < providers.length; pi++) {
      const p = providers[(pi + (rotateBy % providers.length)) % providers.length];
      for (const m of ALL_MODELS) {
        if (m.provider === p && !order.includes(m)) {
          order.push(m);
          break;
        }
      }
    }
  }
  return order;
}

function providerReady(def: ModelDef): boolean {
  if (DISABLED_MODEL_IDS.has(def.id)) return false;
  switch (def.provider) {
    case 'gemini': return !!API_KEY;
    case 'openrouter': return !!OPENROUTER_API_KEY;
    case 'groq': return !!GROQ_API_KEY;
    case 'cerebras': return !!CEREBRAS_API_KEY;
    case 'bluesmind': return !!BLUESMIND_API_KEY;
    default: return false;
  }
}

// Model yang terbukti tidak valid/not found untuk akun → dinonaktifkan agar
// tidak dipilih user & tidak mengisi cooldown akibat percobaan sia-sia.
const DISABLED_MODEL_IDS = new Set<string>();

// Validasi model Gemini dengan meminta daftar model ke API. Model yang tidak
// ada di respons akan dinonaktifkan. Dipanggil sekali saat startup.
async function validateGeminiModels(): Promise<void> {
  if (!API_KEY) return;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`, {
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await res.json();
    const available = new Set<string>((data?.models || []).map((m: any) => m.name?.replace(/^models\//, '')));
    for (const def of GEMINI_MODELS) {
      if (!available.has(def.id)) {
        DISABLED_MODEL_IDS.add(def.id);
        console.warn(`⚠️  Model tidak tersedia untuk akun Anda, dinonaktifkan: ${def.id}`);
      }
    }
  } catch (err: any) {
    console.warn('⚠️  Gagal memvalidasi model Gemini: ' + err.message);
  }
}

// Stream dengan failover: coba preferred -> default -> model lain.
// Saat satu model kena limit/error, otomatis pindah ke model berikutnya.
async function* streamWithFailover(
  contents: GeminiContent[],
  opts: StreamOpts & { model?: string },
  state: { usedModel: string }
): AsyncGenerator<StreamChunk> {
  const order = buildModelOrder(opts.model, opts.rotateBy || 0);
  const authFailedProviders = new Set<Provider>();
  const errors: string[] = [];
  let attempts = 0;

  for (const def of order) {
    if (attempts >= MAX_ATTEMPTS) break;
    if (isCooldown(def.id)) continue;
    if (authFailedProviders.has(def.provider)) continue;
    if (!providerReady(def)) continue;
    // Throttle: WAIT sebentar agar memakai model yang SAMA untuk meneruskan
    // percakapan (kontinuitas tool-call), jangan ganti model di tengah tugas.
    if (providerThrottled(def.id, def.provider)) {
      const key = def.id + '::' + def.provider;
      const last = lastCallAt.get(key) || 0;
      const min = MIN_INTERVAL_MS[def.provider as Provider] || 1500;
      const wait = min - (Date.now() - last);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
    attempts++;

    try {
      state.usedModel = def.id;
      markCall(def.id, def.provider);
      let gen: AsyncGenerator<StreamChunk>;
      switch (def.provider) {
        case 'gemini': gen = streamGemini(def.id, contents, opts); break;
        case 'groq': gen = streamGroq(def.id, contents, opts); break;
        case 'cerebras': gen = streamCerebras(def.id, contents, opts); break;
        case 'bluesmind': gen = streamBluesmind(def.id, contents, opts); break;
        default: gen = streamOpenRouter(def.id, contents, opts); break;
      }
      for await (const chunk of gen) {
        yield chunk;
      }
      markOk(def.id);
      return;
    } catch (err: any) {
      if (opts.signal?.aborted) throw err; // Stop ditekan → jangan failover, hentikan total
      const kind = err instanceof ModelError ? err.kind : 'http';
      const retryAfter = err instanceof ModelError ? err.retryAfter : undefined;
      markFail(def.id, kind, retryAfter);
      errors.push(`${def.id} (${kind})`);
      if (kind === 'auth') authFailedProviders.add(def.provider);
      // Jeda kecil sebelum coba model lain agar tidak membabi buta
      if (kind === 'limit') await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Semua model sempat diblokir cooldown/throttle → tunggu yang paling
  // cepat pulih (maks 30s) lalu coba sekali lagi, daripada langsung menyerah.
  // Tanpa failover: langsung gagal agar user cepat tahu & bisa ganti model.
  if (ENABLE_FAILOVER && errors.length === 0) {
    const now = Date.now();
    let earliest = Infinity;
    for (const def of ALL_MODELS) {
      if (!providerReady(def)) continue;
      const until = cooldownUntil.get(def.id) || 0;
      if (until < earliest) earliest = until;
    }
    const wait = Math.min(30000, Math.max(2000, earliest - now));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    for (const def of order) {
      if (attempts >= MAX_ATTEMPTS) break;
      if (isCooldown(def.id)) continue;
      if (authFailedProviders.has(def.provider)) continue;
      if (!providerReady(def)) continue;
      attempts++;
      try {
        state.usedModel = def.id;
        markCall(def.id, def.provider);
        let gen: AsyncGenerator<StreamChunk>;
        switch (def.provider) {
          case 'gemini': gen = streamGemini(def.id, contents, opts); break;
          case 'groq': gen = streamGroq(def.id, contents, opts); break;
          case 'cerebras': gen = streamCerebras(def.id, contents, opts); break;
          default: gen = streamOpenRouter(def.id, contents, opts); break;
        }
        for await (const chunk of gen) {
          yield chunk;
        }
        markOk(def.id);
        return;
      } catch (err: any) {
        if (opts.signal?.aborted) throw err; // Stop ditekan → hentikan total
        const kind = err instanceof ModelError ? err.kind : 'http';
        markFail(def.id, kind, err instanceof ModelError ? err.retryAfter : undefined);
        errors.push(`${def.id} (${kind})`);
      }
    }
  }

  const nowMs = Date.now();
  const readyAlts = ALL_MODELS
    .filter((m) => !DISABLED_MODEL_IDS.has(m.id) && providerReady(m) && ((cooldownUntil.get(m.id) || 0) <= nowMs))
    .map((m) => m.id)
    .slice(0, 4);
  throw new Error(
    'Model gagal: ' + (errors.length ? errors.join(' | ') : 'sedang dalam cooldown') +
    (readyAlts.length ? `. Model yang tersedia sekarang: ${readyAlts.join(', ')}. Pilih salah satu atau coba lagi dalam beberapa detik.` : '. Coba lagi beberapa saat atau pilih model lain.')
  );
}

// ────────────────────────── HTTP SERVER ──────────────────────────
function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
  });
}

// ────────────────────────── RIWAYAT CHAT (MEMORI) ──────────────────────────
const HISTORY_DIR = path.join(WORKSPACE, 'chat-history');
if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function genSessionId(): string {
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sessionFile(id: string): string {
  return path.join(HISTORY_DIR, `${id.replace(/[^a-zA-Z0-9_-]/g, '')}.json`);
}

function listSessions(): Array<{ id: string; title: string; createdAt: number; updatedAt: number; count: number }> {
  const out: Array<{ id: string; title: string; createdAt: number; updatedAt: number; count: number }> = [];
  for (const f of fs.readdirSync(HISTORY_DIR)) {
    if (!f.endsWith('.json')) continue;
    try {
      const s = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), 'utf-8'));
      out.push({ id: s.id, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt, count: (s.messages || []).length });
    } catch {}
  }
  out.sort((a, b) => b.updatedAt - a.updatedAt);
  return out;
}

function loadSession(id: string): ChatSession | null {
  const f = sessionFile(id);
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return null; }
}

function saveSession(s: ChatSession) {
  const f = sessionFile(s.id);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(s, null, 2), 'utf-8');
}

function deleteSessionFile(id: string) {
  const f = sessionFile(id);
  if (fs.existsSync(f)) fs.rmSync(f);
}

function serveFile(res: http.ServerResponse, filePath: string, mime: string) {
  res.writeHead(200, { 'Content-Type': mime });
  res.end(fs.readFileSync(filePath));
}

// ────────────────────────── MEDIA UPLOAD ──────────────────────────
const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.lottie': 'application/json',
};

const ALLOWED_UPLOAD_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif', '.ico',
  '.mp4', '.webm', '.mov', '.mkv', '.avi',
  '.mp3', '.wav', '.ogg', '.oga', '.m4a', '.flac', '.aac',
  '.ttf', '.otf', '.woff', '.woff2',
  '.json', '.lottie',
]);

function safeFileName(name: string): string {
  const base = path.basename(String(name || 'file')).replace(/[^\w.\- ]+/g, '_');
  return base.slice(0, 120);
}

function uploadFileBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > MAX_UPLOAD) { req.destroy(); reject(new Error('File terlalu besar (maks 200MB)')); }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (e) => reject(e));
  });
}

function serveMedia(res: http.ServerResponse, rel: string) {
  const full = path.normalize(path.join(MEDIA_DIR, rel));
  if (!full.startsWith(MEDIA_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  const mime = MIME_BY_EXT[path.extname(full).toLowerCase()] || 'application/octet-stream';
  const read = fs.createReadStream(full);
  res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' });
  read.pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    return serveFile(res, path.join(process.cwd(), 'agent-chat.html'), 'text/html; charset=utf-8');
  }

  // ── GET /vendor/* — file xterm.js (tanpa CDN) ──
  if (req.method === 'GET' && url.startsWith('/vendor/')) {
    const rel = url.slice('/vendor/'.length);
    const base = path.join(process.cwd(), 'node_modules');
    const safe = rel.replace(/\.\./g, '');
    const vendorMap: Record<string, string> = {
      'xterm.js': path.join(base, '@xterm', 'xterm', 'lib', 'xterm.js'),
      'xterm.css': path.join(base, '@xterm', 'xterm', 'css', 'xterm.css'),
      'addon-fit.js': path.join(base, '@xterm', 'addon-fit', 'lib', 'addon-fit.js'),
    };
    if (vendorMap[safe]) {
      const mime = safe.endsWith('.css') ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8';
      return serveFile(res, vendorMap[safe], mime);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('vendor not found');
  }

  if (req.method === 'GET' && url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      model: '',
      workspace: WORKSPACE,
      providers: { gemini: !!API_KEY, openrouter: !!OPENROUTER_API_KEY, groq: !!GROQ_API_KEY, cerebras: !!CEREBRAS_API_KEY, bluesmind: !!BLUESMIND_API_KEY },
      models: ALL_MODELS.map((m) => m.id),
    }));
  }

  // ── GET /api/models — daftar model gratis + status cooldown ──
  if (req.method === 'GET' && url === '/api/models') {
    const now = Date.now();
    const models = ALL_MODELS.map((m) => ({
      id: m.id,
      label: m.label,
      desc: m.desc,
      provider: m.provider,
      ready: providerReady(m),
      disabled: DISABLED_MODEL_IDS.has(m.id),
      cooldown: Math.max(0, Math.round(((cooldownUntil.get(m.id) || 0) - now) / 1000)),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ default: '', auto_failover: ENABLE_FAILOVER, models }));
  }

  // ── MEDIA UPLOAD ──
  // GET /media/<nama> — sajikan file media statis (untuk preview di chat)
  if (req.method === 'GET' && url.startsWith('/media/')) {
    return serveMedia(res, url.slice('/media/'.length));
  }

  // POST /api/upload — upload file media (raw binary, nama via header X-File-Name)
  if (req.method === 'POST' && url === '/api/upload') {
    try {
      const buf = await uploadFileBody(req);
      let rawName = '';
      try { rawName = decodeURIComponent(req.headers['x-file-name'] as string || ''); } catch { rawName = ''; }
      const name = safeFileName(rawName || 'file');
      const ext = path.extname(name).toLowerCase();
      if (!ALLOWED_UPLOAD_EXT.has(ext)) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: `Ekstensi ${ext || '(tanpa ekstensi)'} tidak diizinkan` }));
      }
      if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
      const finalName = Date.now().toString(36) + '-' + name;
      fs.writeFileSync(path.join(MEDIA_DIR, finalName), buf);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({
        name: finalName,
        originalName: name,
        path: 'media/' + finalName,
        url: '/media/' + encodeURIComponent(finalName),
        size: buf.length,
        ext: ext.slice(1),
      }));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: err.message || 'Upload gagal' }));
    }
  }

  // ── RIWAYAT CHAT ──
  // GET /api/history — daftar semua sesi
  if (req.method === 'GET' && url === '/api/history') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ sessions: listSessions() }));
  }

  // DELETE /api/history — hapus semua riwayat
  if (req.method === 'DELETE' && url === '/api/history') {
    for (const f of fs.readdirSync(HISTORY_DIR)) {
      if (f.endsWith('.json')) { try { fs.rmSync(path.join(HISTORY_DIR, f)); } catch {} }
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ ok: true }));
  }

  // POST /api/history — buat sesi baru
  if (req.method === 'POST' && url === '/api/history') {
    const body = await readBody(req);
    const title = String(body.title || 'Percakapan baru').slice(0, 80);
    const id = genSessionId();
    const sess: ChatSession = { id, title, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    saveSession(sess);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ id, title }));
  }

  // /api/history/:id — ambil / hapus satu sesi
  const hMatch = url.match(/^\/api\/history\/([^/]+)$/);
  if (hMatch) {
    const hid = hMatch[1];
    if (req.method === 'GET') {
      const s = loadSession(hid);
      if (!s) {
        res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'Sesi tidak ditemukan' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(s));
    }
    if (req.method === 'DELETE') {
      deleteSessionFile(hid);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ ok: true }));
    }
  }

  // ── POST /api/chat — SSE streaming ──
  if (req.method === 'POST' && url === '/api/chat') {
    const body: any = await readBody(req);
    const userMessage = String(body.message || '').trim();
    if (!userMessage) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Message is required' }));
    }
    const mode = String(body.mode || 'chat'); // default ke 'chat' (non-agentik) untuk mengurangi limit
    const requestedModel = String(body.model || '').trim();
    if (!requestedModel) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Silakan pilih model AI terlebih dahulu di dropdown.' }));
    }
    if (!ALL_MODELS.some((m) => m.id === requestedModel)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `Model tidak dikenal: ${requestedModel}. Pilih dari daftar.` }));
    }
    const model = requestedModel;
    const sessionId = String(body.sessionId || '');

    // Riwayat dari klien: [{role:'user'|'assistant', content}] -> GeminiContent
    const rawHistory: any[] = Array.isArray(body.history) ? body.history : [];
    const history: GeminiContent[] = rawHistory
      .filter((h: any) => h && typeof h.content === 'string')
      .map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));
    const contents: GeminiContent[] = [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    const send = (obj: any) => {
      if (res.writableEnded || res.destroyed) return false;
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); return true; } catch { return false; }
    };

    // Timeout keseluruhan: jamin respons SSE selalu berakhir (tidak macet selamanya).
    let chatEnded = false;
    const CHAT_TIMEOUT_MS = 240000; // 4 menit maksimal per perintah
    const chatTimer = setTimeout(() => {
      if (chatEnded) return;
      chatEnded = true;
      try { send({ type: 'error', error: 'Waktu proses habis. Coba perintah yang lebih ringkas atau pilih model lain.' }); } catch {}
      try { res.end(); } catch {}
    }, CHAT_TIMEOUT_MS);

    // Pembatalan: ketika klien memutus koneksi (klik Stop), server ikut berhenti
    // memproses (menghentikan stream model & loop tool) agar tidak boros kuota.
    const chatAbort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded && !chatAbort.signal.aborted) {
        chatAbort.abort();
      }
    });

    const searchOn = mode !== 'code';

    try {
      let iterations = 0;
      let assistantText = '';
      const state = { usedModel: model };

      // ── EKSEKUSI + REASONING ──
      const execContents: GeminiContent[] = contents;

      let reasoningBuffer = '';
      const flushReasoning = () => {
        if (reasoningBuffer.trim()) {
          send({ type: 'reasoning_delta', text: reasoningBuffer });
          reasoningBuffer = '';
        }
      };

      while (iterations < MAX_AGENTIC_ITERATIONS) {
        iterations++;
        const turnParts: Array<Record<string, any>> = [];
        let toolCalls: Array<{ name: string; args: any; id?: string }> = [];
        send({ type: 'start', model, mode });

        for await (const chunk of streamWithFailover(execContents, { search: searchOn, model, rotateBy: iterations, signal: chatAbort.signal }, state)) {
          if (chatAbort.signal.aborted) { toolCalls = []; break; }
          if (chunk.reasoning) {
            // stream live agar user melihat progress, bukan terasa macet
            send({ type: 'reasoning_delta', text: chunk.reasoning });
            continue;
          }
          flushReasoning();
          if (chunk.text) {
            assistantText += chunk.text;
            turnParts.push({ text: chunk.text });
            send({ type: 'delta', text: chunk.text });
          } else if (chunk.functionCall) {
            toolCalls.push(chunk.functionCall);
            const fc: any = { name: chunk.functionCall.name, args: chunk.functionCall.args };
            if (chunk.functionCall.id) fc.id = chunk.functionCall.id;
            const partObj: any = { functionCall: fc };
            turnParts.push(partObj);
          }
        }
        flushReasoning();

        // Tambahkan turn model ke history
        if (turnParts.length) {
          execContents.push({ role: 'model', parts: turnParts });
        }

        // Jika ada tool calls, eksekusi dan lanjutkan loop
        if (toolCalls.length > 0) {
          const fnResponses: Array<Record<string, any>> = [];
          for (const call of toolCalls) {
            if (chatAbort.signal.aborted) break;
            send({ type: 'tool', name: call.name, args: call.args });
            let result: any;
            try {
              const handler = TOOL_HANDLERS[call.name];
              result = handler ? await handler(call.args) : { error: `Tool tidak dikenal: ${call.name}` };
            } catch (err: any) {
              result = { error: err.message };
            }
            send({ type: 'tool_result', name: call.name, result });
            const fr: any = {
              functionResponse: {
                name: call.name,
                response: { name: call.name, content: result },
              },
            };
            if (call.id) (fr.functionResponse as any).id = call.id;
            fnResponses.push(fr);
          }
          execContents.push({ role: 'user', parts: fnResponses });
          continue; // teruskan agar model memproses hasil tool
        }

        // Tidak ada tool call → selesai eksekusi
        break;
      }

      send({ type: 'done', text: assistantText, usedModel: state.usedModel });

      // Simpan percakapan ke sesi (memori)
      if (sessionId) {
        let sess = loadSession(sessionId);
        if (!sess) {
          sess = { id: sessionId, title: userMessage.slice(0, 80), createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
        }
        sess.messages.push({ role: 'user', content: userMessage });
        sess.messages.push({ role: 'assistant', content: assistantText || '(tanpa balasan)' });
        if (!sess.title || sess.title === 'Percakapan baru') {
          sess.title = userMessage.slice(0, 80);
        }
        sess.updatedAt = Date.now();
        if (sess.messages.length > 200) sess.messages = sess.messages.slice(-200);
        saveSession(sess);
      }
    } catch (err: any) {
      send({ type: 'error', error: err.message });
    }
    clearTimeout(chatTimer);
    chatEnded = true;
    return res.end();
  }

  // ── POST /api/terminal — jalankan opencode run (streaming output) ──
  if (req.method === 'POST' && url === '/api/terminal') {
    const body: any = await readBody(req);
    const command = String(body.command || '').trim();
    if (!command) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Perintah kosong' }));
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    const send = (obj: any) => {
      if (res.writableEnded || res.destroyed) return false;
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); return true; } catch { return false; }
    };

    const stripAnsi = (s: string) =>
      s.replace(/\u001b\[[0-9;]*m/g, '').replace(/\u001b\][^\u0007]*\u0007/g, '');

    // Path ke opencode.exe (hindari shim .cmd & shell untuk menghindari sub-proses nyangkut)
    const exeCandidates = [
      'C:\\Users\\afina\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe',
      process.env.OPENCODE_BIN || '',
      path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', 'opencode-ai', 'bin', 'opencode.exe'),
    ].filter(Boolean);
    const exePath = exeCandidates.find((c) => fs.existsSync(c));
    const child = cp.spawn(exePath || 'opencode', ['run', command], {
      cwd: WORKSPACE,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    let buf = '';
    const feed = (chunk: string) => {
      buf += chunk;
      // kirim per baris agar streaming lebih halus
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) send({ type: 'terminal_delta', text: stripAnsi(line) + '\n' });
      }
    };
    child.stdout.on('data', (d) => feed(String(d)));
    child.stderr.on('data', (d) => feed(String(d)));

    let killed = false;
    req.on('close', () => { if (!killed) { killed = true; child.kill(); } });
    const timer = setTimeout(() => { if (!killed) { killed = true; child.kill(); send({ type: 'terminal_error', error: 'Timeout (300 detik)' }); res.end(); } }, 300000);

    child.on('error', (err: any) => {
      clearTimeout(timer);
      if (!killed) { killed = true; send({ type: 'terminal_error', error: 'Gagal menjalankan opencode: ' + err.message }); res.end(); }
    });
    // gunakan 'exit' bukan 'close': opencode mewariskan handle stdout ke sub-proses,
    // sehingga 'close' tidak pernah fire sampai semua pipe tertutup.
    child.on('exit', (code) => {
      clearTimeout(timer);
      setTimeout(() => {
        if (buf.trim()) send({ type: 'terminal_delta', text: stripAnsi(buf) });
        send({ type: 'terminal_done', exitCode: code ?? 0 });
        res.end();
      }, 300);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

// ── WebSocket PTY — terminal interaktif opencode (xterm.js + node-pty) ──
const wss = new WebSocketServer({ server, path: '/ws/pty' });

function findOpenCodeExe(): string {
  const exeCandidates = [
    'C:\\Users\\afina\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe',
    process.env.OPENCODE_BIN || '',
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', 'opencode-ai', 'bin', 'opencode.exe'),
  ].filter(Boolean);
  return exeCandidates.find((c) => fs.existsSync(c)) || 'opencode';
}

const activePty: Map<string, { proc: any; ws: any }> = new Map();

wss.on('connection', (ws, req) => {
  const id = (req as any).socket?.remoteAddress + ':' + Date.now().toString(36);
  const exePath = findOpenCodeExe();
  let proc: any;
  try {
    proc = pty.spawn(exePath, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 32,
      cwd: WORKSPACE,
      env: { ...process.env, NO_COLOR: '0' },
    });
  } catch (err: any) {
    ws.send(JSON.stringify({ type: 'error', message: 'Gagal spawn opencode: ' + err.message }));
    ws.close();
    return;
  }

  activePty.set(id, { proc, ws });

  proc.onData((data: string) => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'data', text: data }));
  });

  proc.onExit((e: { exitCode: number }) => {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'exit', exitCode: e.exitCode }));
    ws.close();
    activePty.delete(id);
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      if (msg.type === 'input' && proc) proc.write(String(msg.data ?? ''));
      else if (msg.type === 'resize' && proc) proc.resize(Number(msg.cols) || 120, Number(msg.rows) || 32);
    } catch {}
  });

  ws.on('close', () => {
    try { proc.kill(); } catch {}
    activePty.delete(id);
  });

  ws.on('error', () => {
    try { proc.kill(); } catch {}
    activePty.delete(id);
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(55));
  console.log('🤖 NANDO AGENT AI AKTIF!');
  console.log(`📡 Buka browser: http://localhost:${PORT}`);
  console.log(`🔀 ${ALL_MODELS.length} model gratis (${GEMINI_MODELS.length} Gemini, ${OPENROUTER_MODELS.length} OpenRouter, ${GROQ_MODELS.length} Groq, ${CEREBRAS_MODELS.length} Cerebras, ${BLUESMIND_MODELS.length} Bluesmind)`);
  console.log(`🔄 Auto-failover: ${ENABLE_FAILOVER ? 'ON (auto-pindah model saat limit)' : 'OFF (model dipakai sesuai pilihan Anda)'}`);
  console.log(`🖥️ Terminal interaktif: ON (ws://localhost:${PORT}/ws/pty)`);
  console.log(`📁 Workspace: ${WORKSPACE}`);
  console.log(`🔑 Gemini: ${API_KEY ? 'OK' : 'TIDAK ADA'} · OpenRouter: ${OPENROUTER_API_KEY ? 'OK' : 'TIDAK ADA'} · Groq: ${GROQ_API_KEY ? 'OK' : 'TIDAK ADA'} · Cerebras: ${CEREBRAS_API_KEY ? 'OK' : 'TIDAK ADA'} · Bluesmind: ${BLUESMIND_API_KEY ? 'OK' : 'TIDAK ADA'}`);
  console.log('='.repeat(55));
  validateGeminiModels();
});