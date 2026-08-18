# Data Desa & Kelompok

Data ini ditanamkan di **server**, **app HP**, dan **app laptop** (3 tempat sama).

| Desa | Kelompok |
|------|----------|
| **SELATAN** | KUNCI 1, KUNCI 2, PENGANTEN, BOMO 1, BOMO 2, GEGER, PACING 1, PACING 2, PACING 3 |
| **TIMUR** | TA BARAT, TA TENGAH, TA TIMUR, KALIPAN, TA 5, TA 6, TA 7, JATICILIK |
| **DAMPET** | DAMPET 1, DAMPET 2, DAMPET 3, BALONGREJO, NGUJUNG, KALICILIK |
| **BAURENO** | SUMBEREJO, BAURENO, SUGIHWARAS, SUMBERAGUNG, KRANGKONG, PEJOK |

## Di mana datanya tersimpan

| Lokasi | File |
|--------|------|
| Server | `server/desa.js` |
| App HP | `app/lib/models/desa.dart` |
| App laptop | membaca dari server via `/api/desa` |

> ⚠️ **Sinkron**: jika data desa/kelompok berubah, edit di **`server/desa.js`** DAN **`app/lib/models/desa.dart`** lalu build ulang APK. Aplikasi laptop otomatis mengikuti server.

## QR Code Desa

4 QR desa sudah dibuat di `qr-gerbang/hasil/`:
- `DESA-SELATAN.png`
- `DESA-TIMUR.png`
- `DESA-DAMPET.png`
- `DESA-BAURENO.png`

Isi QR = nama desa (SELATAN / TIMUR / DAMPET / BAURENO). Cetak & tempel di lokasi masuk tiap desa. Saat siswa memindai, app mengirim nama desa + data dirinya ke server, dan server memvalidasi bahwa kelompoknya memang terdaftar di desa tersebut.

Untuk membuat ulang: `python qr-gerbang/buat_qr.py`