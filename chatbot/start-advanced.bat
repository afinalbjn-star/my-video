@echo off
echo ====================================
echo MEMULAI CHATBOT AI ADVANCED
echo ====================================
echo.
echo Mengaktifkan virtual environment...
call venv\Scripts\activate
echo.
echo Menjalankan server FastAPI...
echo Server akan berjalan di: http://127.0.0.1:8000
echo.
echo Membuka browser otomatis...
start http://127.0.0.1:8000
echo.
echo Tekan CTRL+C untuk menghentikan server
echo ====================================
uvicorn fastapi_app_multi:app --reload --host 0.0.0.0 --port 8000
pause