# -*- coding: utf-8 -*-
"""Generate QR code gerbang.
- DESA-*.png            : isi QR = nama desa (dipakai app Android & pemindai web)
- ABSEN-WEB-IPHONE*.png : isi QR = URL halaman absen web (untuk iPhone/HP tanpa app)
- WEB-*.png             : isi QR = URL web + ?desa= (scan dari kamera langsung buka web & isi desa)
"""
import os
import qrcode
from urllib.parse import quote

DESAS = ["SELATAN", "TIMUR", "DAMPET", "BAURENO"]
DESA_BEBAS = "PENGAJIAN MUMI DAERAH"
BASE = "https://absensi-server-gnmp.onrender.com/absen"

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hasil")
os.makedirs(OUT, exist_ok=True)


def buat(isi, nama_file, ukuran=10):
    img = qrcode.make(isi, box_size=ukuran, border=4)
    path = os.path.join(OUT, nama_file)
    img.save(path)
    print(f"OK  {nama_file}  <-  {isi}")


for nama in DESAS:
    buat(nama, f"DESA-{nama}.png")

buat(DESA_BEBAS, "PENGAJIAN-MUMI-DAERAH.png")

buat(BASE, "ABSEN-WEB-IPHONE.png", ukuran=12)
buat(BASE, "ABSEN-WEB-IPHONE-BESAR.png", ukuran=20)

for nama in DESAS:
    buat(f"{BASE}?desa={quote(nama)}", f"WEB-{nama}.png")

buat(f"{BASE}?desa={quote(DESA_BEBAS)}", "WEB-PENGAJIAN-MUMI-DAERAH.png")

print("\nSelesai. Semua QR gerbang tersimpan di folder 'hasil'.")
