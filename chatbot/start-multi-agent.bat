@echo off
echo ====================================
echo MEMULAI CHATBOT AI MULTI-AGENT
echo ====================================
echo.
echo Mengaktifkan virtual environment...
call venv\Scripts\activate
echo.
echo Menjalankan server FastAPI dengan Multi-Agent System...
echo Server akan berjalan di: http://127.0.0.1:8000
echo.
echo Membuka browser otomatis...
start http://127.0.0.1:8000
echo.
echo Multi-Agent Features:
echo - Coder Agent: Coding mandiri dengan akses file system
echo - Searcher Agent: Web search mandiri untuk data
echo - Analyzer Agent: Analisa directory dan project structure
echo - Improver Agent: Self-improvement untuk sistem
echo - Coordinator Agent: Automatic task routing
echo - Coding Mode: Interface khusus untuk coding tasks (tombol 💻)
echo.
echo Tekan CTRL+C untuk menghentikan server
echo ====================================
uvicorn fastapi_app_multi:app --reload --host 0.0.0.0 --port 8000
pause