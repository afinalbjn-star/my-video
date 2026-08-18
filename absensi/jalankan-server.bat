@echo off
title Absensi Server
echo ============================================
echo   SERVER ABSENSI SISWA
echo ============================================
echo.
echo   Dashboard : http://localhost:3000
echo   (di HP : http://<IP-LAPTOP>:3000)
echo.

cd /d "%~dp0server"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js belum terinstal. Install dari https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalasi dependensi pertama kali...
  call npm install
)

if "%KODE_SEKOLAH%"=="" set KODE_SEKOLAH=SMAN1
echo KODE_SEKOLAH = %KODE_SEKOLAH%
echo.

call npm start
pause
