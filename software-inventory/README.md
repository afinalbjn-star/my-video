# NANDO INVENTORY AI

Aplikasi inventaris perangkat lunak (software inventory) dengan **asisten AI** (Ollama), **export Excel/PDF**, dan **mode ganda desktop + web**.

## Fitur
- Kelola daftar software (tambah/edit/hapus/cari)
- Manajemen lisensi (jenis, jumlah, harga, tanggal kedaluwarsa, status otomatis)
- Dashboard analitik + total anggaran
- Export laporan ke Excel & PDF
- **AI Assistant** chat untuk membantu mengelola inventaris (gratis, lokal via Ollama)
- Bisa dijalankan sebagai aplikasi desktop (Electron) **atau** dibuka lewat browser

## Cara Menjalankan

### Mode Web (lewat browser)
```bash
npm run serve
```
Lalu buka di browser: `http://localhost:3456`

### Mode Desktop (Electron)
```bash
npm start
```

## AI Assistant (Ollama)

Asisten AI memakai [Ollama](https://ollama.com) yang berjalan **lokal** (100% gratis, offline, tanpa API key).

### Cara install Ollama
1. Unduh & install dari https://ollama.com/download
2. Jalankan dan buka terminal, lalu unduh model (contoh, ukuran kecil & ringan):
   ```bash
   ollama pull llama3.2
   ```
3. Ollama otomatis berjalan di `http://localhost:11434`.
4. Buka aplikasi — status akan berubah menjadi **"Ollama terhubung"** dan kamu bisa memilih model di dropdown.

> Jika Ollama belum aktif, aplikasi tetap berfungsi penuh; hanya fitur AI yang menampilkan pesan bahwa Ollama belum terhubung.

### Model yang disarankan (ringan)
- `llama3.2` (3B) — cepat, cukup untuk inventaris
- `qwen2.5:3b` — bagus untuk Bahasa Indonesia
- `gemma3:4b`

## Menjalankan dengan Ollama di komputer lain
Jika Ollama berjalan di komputer lain di jaringan:
```powershell
$env:OLLAMA_URL="http://<ip-komputer>:11434"
npm run serve
```

## Build Installer (Windows .exe)
```bash
npm run dist
```
Hasil installer ada di folder `dist/`.

## Struktur Proyek
- `server.js` — server web (static + API data + export + proxy AI)
- `main.js` — entry Electron (mode desktop)
- `renderer/` — antarmuka (HTML/CSS/JS)
- `generate-icon.js` — membuat ikon aplikasi
- `data.json` — data tersimpan lokal (dibuat otomatis)