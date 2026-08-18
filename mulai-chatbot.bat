@echo off
title NANDO AGENT AI - Start
cd /d "%~dp0"

echo ============================================
echo   NANDO AGENT AI - memulai chatbot...
echo ============================================

rem Hentikan proses server lama (agent-chat-server.ts) bila masih berjalan
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*agent-chat-server.ts*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

rem Mulai server di background (jendela tersembunyi)
start "" /min cmd /c "npx tsx agent-chat-server.ts > agent-server.log 2>&1"

rem Tunggu sampai server siap (maks 60 detik)
set /a n=0
:wait
set /a n+=1
if %n% gtr 60 (
  echo [GAGAL] Server tidak merespon. Cek agent-server.log
  pause
  exit /b 1
)
>nul 2>&1 curl -s http://localhost:5000/health
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto wait
)

echo [OK] Server aktif di http://localhost:5000
echo [OK] Membuka browser...
start "" http://localhost:5000

exit