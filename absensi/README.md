# Aplikasi Absensi Siswa (QR Gate)

Sistem absensi siswa di gerbang sekolah:
- **App Android (Flutter)** di HP siswa → berisi data diri (nama, desa, kelompok, jenis kelamin) & pemindai QR.
- **Server (Node.js + Express)** → menerima data. Bisa di **cloud (internet)** atau lokal.
- **Aplikasi Windows desktop** → melihat data & **export ke Excel (.xlsx)** untuk laporan.

Alur: Siswa buka app → lengkapi profil (pilih **desa** & **kelompok**) → di lokasi masuk arahkan kamera ke **QR code desa** → otomatis tercatat **jam masuk** → data tampil di aplikasi laptop / dashboard → export Excel.

> **🗺️ Data desa & kelompok** (SELATAN, TIMUR, DAMPET, BAURENO + daftar kelompoknya) ada di `DATA-DESA.md`.

> **🔒 Akses via internet?** Baca `DEPLOY-CLOUD.md` — server dipindah ke Render (gratis) + database Postgres (Neon), HP & laptop cukup punya koneksi internet.

---

## 1. Struktur Folder

```
absensi/
├── server/            # Server Node.js + dashboard (SQLite lokal / Postgres cloud)
│   ├── server.js
│   ├── db.js
│   ├── dashboard.html
│   ├── render.yaml    # konfigurasi deploy ke Render
│   └── package.json
├── desktop/           # Aplikasi Windows: lihat data + export Excel
│   ├── main.js        # logic export .xlsx (exceljs)
│   ├── renderer.js    # tampilan & koneksi ke server
│   └── dist/          # installer siap unduh (.exe)
├── app/               # App Flutter Android
│   ├── lib/           # source Dart (main, screens, services, models)
│   └── build/app/outputs/flutter-apk/app-release.apk   # APK siap pasang (62.5 MB)
└── qr-gerbang/        # QR code gerbang masuk (sudah dibuat)
    ├── buat_qr.py
    └── hasil/         # 4 file PNG gerbang
```

---

## 2. Server (laptop Windows)

```bash
cd absensi/server
npm install
set KODE_SEKOLAH=SMAN1
npm start
```

- Dashboard: `http://localhost:3000`
- Akses HP ke server harus memakai **IP LAN laptop** (lihat langkah 4).

### API
| Method | URL | Fungsi |
|--------|-----|--------|
| POST | `/api/absen` | Mencatat kehadiran dari app HP |
| GET | `/api/absensi?tanggal=YYYY-MM-DD` | Riwayat harian |
| GET | `/api/statistik?tanggal=YYYY-MM-DD` | Total & per kelompok |
| GET | `/api/desa` | Daftar desa + kelompok (dipakai app laptop) |
| GET | `/api/export?dari=&sampai=` | Data rentang tanggal (untuk export Excel) |

---

## 3. App Flutter (HP Android)

**Status: SDK Flutter, Java 17, Android SDK, dan NDK sudah terpasang di PC ini.**
APK release sudah berhasil dibuild: `absensi/app/build/app/outputs/flutter-apk/app-release.apk` (62.5 MB).

Langkah bila perlu mengubah alamat server lalu build ulang:

1. Sesuaikan alamat server di `lib/services/absen_api.dart`:
   ```dart
   static const String baseUrl = 'http://<IP-LAPTOP>:3000';
   static const String kodeSekolah = 'SMAN1';   // samakan dengan server
   ```
2. Build ulang APK:
   ```bash
   cd absensi/app
   flutter build apk --release
   ```
3. APK jadi di `build/app/outputs/flutter-apk/app-release.apk`.

> Jalankan `flutter` di terminal baru setelah PATH diset (setiap terminal baru).

---

## 4. Menghubungkan HP ↔ Laptop (harus satu jaringan Wi-Fi)

1. Di laptop, cari IP: buka `cmd` → ketik `ipconfig` → cari **IPv4 Address** (mis. `192.168.1.10`).
2. Pakai IP itu di `baseUrl` app Flutter (langkah 3.3).
3. Pastikan firewall Windows mengizinkan port `3000`:
   - Run sebagai admin `Windows PowerShell`:
     ```powershell
     netsh advfirewall firewall add rule name="Absensi" dir=in action=allow protocol=TCP localport=3000
     ```
4. HP harus terhubung ke **Wi-Fi yang sama** dengan laptop.
5. Dashboard laptop otomatis menerima data real-time.

> Ganti `SMAN1` pada `kode_sekolah` app & `set KODE_SEKOLAH=` server agar sama. Ini kunci rahasia agar tidak sembarang orang bisa absen.

---

## 5. QR Code Desa

Isi QR = **nama desa** (SELATAN / TIMUR / DAMPET / BAURENO). QR sudah dibuat di `qr-gerbang/hasil/` (4 file).
  ```
Lalu tempel QR itu di lokasi masuk tiap desa. Saat siswa memindainya, app mengirim `desa=SELATAN` (dll.) beserta data dirinya ke server, dan server memvalidasi kelompoknya cocok dengan desa tersebut.

---

## Catatan
- Data tersimpan di `absensi/server/data/absensi.db` (SQLite) untuk mode lokal, atau Postgres (cloud).
- Absen ganda di menit yang sama akan ditolak server.
- Kelompok tidak valid untuk suatu desa akan ditolak server.
