@echo off
echo ============================================
echo  NANDO AGENT AI - Tunnel Internet (Cloudflare)
echo  Setelah proses jalan, cari baris berisi:
echo  https://....trycloudflare.com  <- buka ini di HP
echo ============================================
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5000
echo.
echo [TUNNEL BERHENTI] Tekan tombol apa saja untuk menutup.
pause