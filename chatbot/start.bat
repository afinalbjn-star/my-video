@echo off
echo ====================================
echo MEMULAI CHATBOT AI
echo ====================================
echo.
echo Mengaktifkan virtual environment...
call venv\Scripts\activate
echo.
echo Menjalankan server Flask...
echo Server akan berjalan di: http://127.0.0.1:5000
echo.
echo Tekan CTRL+C untuk menghentikan server
echo ====================================
python app.py
pause