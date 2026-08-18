# Deploy Cloud (Absensi via Internet)

Sekarang absensi bisa dipakai **dari mana saja via internet** (tidak harus satu Wi-Fi).
Arsitektur baru:

```
HP Android (app Flutter)  -->  Server Cloud (Render + Postgres)  -->  Aplikasi Laptop (desktop) --> Excel
        (scan QR gerbang)        (menerima & menyimpan data)          (lihat + export .xlsx)
```

## Yang sudah saya siapkan

| Bagian | Lokasi | Status |
|--------|--------|--------|
| Server cloud-ready (Postgres + bind 0.0.0.0 + endpoint `/api/export`) | `server/` | âœ… |
| File deploy Render | `server/render.yaml` | âœ… |
| Aplikasi desktop Windows + export Excel | `desktop/` | âœ… |
| Installer desktop siap unduh | `desktop/dist/Absensi MM BJN Timur Setup 1.0.0.exe` (78 MB) | âœ… |
| App Flutter sudah diarahkan ke URL cloud | `app/lib/services/absen_api.dart` | âœ… |
| APK cloud siap pasang | `app/build/app/outputs/flutter-apk/app-release.apk` | âœ… |

---

## 1. Buat database Postgres gratis (Neon)

1. Buka https://neon.tech â†’ daftar gratis.
2. Buat project baru â†’ catat **Connection string** (mulai `postgresql://...`).
3. Simpan string itu; akan dipakai sebagai `DATABASE_URL`.

## 2. Deploy server ke Render

1. Buka https://render.com â†’ daftar gratis.
2. **New â†’ Web Service â†’ Connect repository** (repo yang berisi folder `server`, atau upload `server/`).
3. Runtime **Node**. Build: `npm install`. Start: `npm start`.
4. Tambahkan **Environment Variables**:
   - `DATABASE_URL` = connection string Neon tadi
   - `KODE_SEKOLAH` = rahasia (mis. `SMAN1`) â€” harus sama dengan app HP
5. Deploy. Setelah selesai, Render memberi URL `https://absensi-server-gnmp.onrender.com`.
   - **Dashboard web:** buka `https://absensi-server-gnmp.onrender.com/`
   - **Uji API:** `https://absensi-server-gnmp.onrender.com/api/health`

> URL Anda mungkin berbeda dari contoh. Sesuaikan di 2 tempat:
> - `app/lib/services/absen_api.dart` â†’ `baseUrl`
> - `desktop/renderer.js` â†’ `DEFAULTS.baseUrl`

## 3. Aplikasi laptop (lihat data + export Excel)

Installer: **`desktop/dist/Absensi MM BJN Timur Setup 1.0.0.exe`**

Cara pakai:
1. Install (ikuti wizard, boleh pilih lokasi).
2. Buka aplikasi. Di kolom **Alamat Server** masukkan URL Render (mis. `https://absensi-server-gnmp.onrender.com`).
3. Pilih rentang tanggal **Dari â€“ Sampai**.
4. Klik **Muat Data** untuk menampilkan rekapan.
5. Klik **Export ke Excel** â†’ simpan file `.xlsx` â†’ buka di Microsoft Excel.

> Koneksi internet diperlukan agar aplikasi bisa mengambil data dari cloud.
> URL server tersimpan otomatis, jadi hanya perlu diisi sekali.

## 4. App HP (APK cloud)

- APK: **`app/build/app/outputs/flutter-apk/app-release.apk`** (62.5 MB)
- Pasang di HP siswa. Saat scan QR gerbang, data langsung terkirim ke server cloud.
- Tidak perlu lagi satu Wi-Fi dengan laptop â€” cukup HP punya internet.

---

## Membangun ulang (bila perlu)

**Aplikasi desktop (bila ubah kode):**
```bash
cd absensi/desktop
npm install
npm run dist     # hasil di dist/
```

**App Flutter (bila ubah baseUrl):**
```bash
cd absensi/app
flutter build apk --release
```

## Catatan keamanan
- `KODE_SEKOLAH` di server & `kodeSekolah` di app harus **sama**, agar orang tak dikenal tidak bisa mengisi absen.
- Jangan gunakan kode sekolah yang mudah ditebak.
