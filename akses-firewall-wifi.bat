@echo off
echo ============================================
echo  Buka akses port 5000 di Windows Firewall
echo  (untuk mengakses chatbot dari HP via WiFi)
echo ============================================
netsh advfirewall firewall add rule name="NANDO Agent 5000" dir=in action=allow protocol=TCP localport=5000 profile=private,domain
if %errorlevel%==0 (
  echo.
  echo [OK] Rule berhasil ditambahkan. Sekarang HP bisa akses:
  echo      http://192.168.100.30:5000  (WiFi)
  echo      http://192.168.0.212:5000   (Ethernet)
  echo.
  echo Catatan: HP harus di jaringan yang sama dengan PC ini.
) else (
  echo.
  echo [GAGAL] Tidak dapat menambah rule. Jalankan file ini sebagai Administrator.
)
echo.
pause