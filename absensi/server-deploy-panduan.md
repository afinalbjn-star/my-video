# Deploy Server ke Render (Panduan Langkah demi Langkah)

> Koneksi Postgres Neon sudah **teruji berhasil** dari PC ini.
> `server-deploy.zip` sudah berisi semua kode server + `render.yaml`.

## Langkah 1 — Buat repo di GitHub

1. Buka https://github.com/new
2. **Repository name**: `absensi-server`
3. Pilih **Public** (opsional Private, tapi lebih rumit untuk Render Blueprint gratis)
4. Klik **Create repository**
5. Di halaman yang muncul ada kotak **"…or create a new repository on the command line"** — abaikan, kita pakai cara browser:
   - Klik **uploading an existing file**
   - Drag-and-drop isi `server-deploy.zip` **setelah di-extract** (file: server.js, db.js, desa.js, package.json, package-lock.json, render.yaml, dashboard.html, .gitignore)
   - Klik **Commit changes**

> Atau lebih mudah: extract zip → drag folder isinya → upload semua file.

## Langkah 2 — Hubungkan ke Render (Blueprint)

1. Buka https://render.com → login
2. Klik **New +** → **Blueprint**
3. Pilih repo `absensi-server` dari GitHub
4. Render membaca `render.yaml` otomatis → muncul service **absensi-server**
5. Sebelum klik **Apply**, buka bagian **Environment Variables**:
   - `DATABASE_URL` → paste connection string Neon Anda (postgresql://...)
   - `KODE_SEKOLAH` → `SMAN1`
6. Klik **Apply** → Render membangun & men-deploy (~3-5 menit)

## Langkah 3 — Dapatkan URL publik

Setelah deploy selesai, Render memberi URL seperti:
```
https://absensi-server.onrender.com
```

**Uji**: buka `https://absensi-server.onrender.com/api/health` → harus muncul `{"ok":true,"db":"postgres"}`

## Langkah 4 — Pakai URL itu di aplikasi

**App HP** (`app/lib/services/absen_api.dart`):
```dart
static const String baseUrl = 'https://absensi-server.onrender.com';
```

**App laptop** (`desktop/renderer.js`):
```js
baseUrl: "https://absensi-server.onrender.com",
```

Lalu build ulang APK & installer (lihat README).

---

## Membersihkan data uji

Saat uji koneksi, 1 baris absen tersimpan ("Siswa Uji" / "Siswa Uji"). Hapus dari Neon:
1. Buka https://console.neon.tech → project Anda → **SQL Editor**
2. Jalankan:
   ```sql
   DELETE FROM absensi;
   DELETE FROM siswa;
   ```

## Jika deploy gagal
- Cek **Logs** di dashboard Render (tab server → Logs).
- Pastikan `DATABASE_URL` diisi tanpa spasi.
- Untuk plan gratis, server "tidur" setelah 15 menit tanpa akses dan bangun otomatis saat diakses (mungkin perlu tunggu ~30 detik pertama).