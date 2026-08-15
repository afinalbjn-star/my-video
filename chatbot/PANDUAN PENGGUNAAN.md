# 🎯 PANDUAN PENGGUNAAN CHATBOT AI

## 🚀 Cara Menjalankan Chatbot

### Cara Paling Mudah (Windows)
1. Double-click file `start.bat`
2. Tunggu sampai server berjalan
3. Buka browser dan akses: `http://127.0.0.1:5000`

### Cara Manual
#### Langkah 1: Buka Terminal
Buka terminal atau command prompt dan navigasi ke folder chatbot:
```bash
cd C:\Users\afina\my-video\chatbot
```

#### Langkah 2: Aktifkan Virtual Environment
```bash
venv\Scripts\activate
```

#### Langkah 3: Jalankan Aplikasi
```bash
python app.py
```

#### Langkah 4: Buka Browser
Buka browser dan akses: `http://127.0.0.1:5000`

## 🔧 Jika Mengalami "Not Found"

### Solusi 1: Pastikan Server Berjalan
1. Cek apakah ada pesan "Running on http://127.0.0.1:5000" di terminal
2. Jika tidak, jalankan ulang `python app.py`

### Solusi 2: Clear Browser Cache
1. Tekan `Ctrl + F5` untuk refresh browser
2. Atau clear cache browser secara manual

### Solusi 3: Cek URL yang Benar
Pastikan mengakses: `http://127.0.0.1:5000`
- ❌ Bukan: `http://localhost:5000/index.html`
- ❌ Bukan: `http://127.0.0.1:5000/index.html`
- ✅ Benar: `http://127.0.0.1:5000`

### Solusi 4: Gunakan Endpoint Test
Coba akses: `http://127.0.0.1:5000/test`
Jika muncul "Flask server is running correctly!" berarti server berjalan dengan baik.

### Solusi 5: Restart Server
1. Tekan `Ctrl + C` di terminal untuk menghentikan server
2. Jalankan ulang: `python app.py`
3. Refresh browser

## 💬 Cara Menggunakan Chatbot

### Mengirim Pesan
1. Ketik pesan Anda di input box
2. Tekan Enter atau klik tombol kirim (ikon panah)
3. Tunggu respon dari AI

### Fitur yang Tersedia
- **Real-time Chat**: Kirim dan terima pesan secara langsung
- **Status Typing**: Indikator saat AI sedang berpikir
- **Auto-scroll**: Otomatis scroll ke pesan terbaru
- **Responsive**: Berfungsi di desktop dan mobile

## 🎨 Kustomisasi

### Mengubah Gaya Chat
Edit file `static/style.css` untuk mengubah:
- Warna
- Font
- Ukuran
- Layout

### Mengubah Pesan Sapaan
Edit file `index.html` dan cari bagian:
```html
<div class="message assistant">
    <div class="bubble">
        Halo! Saya adalah asisten AI Anda. Ada yang bisa saya bantu hari ini?
    </div>
</div>
```

Ganti teks sesuai keinginan Anda.

### Mengubah Model AI
Edit file `app.py` dan ubah:
```python
payload = {
    'model': 'openrouter/free',  # Ganti dengan model lain
    'messages': session['conversation'],
    'temperature': 0.7
}
```

### Mengubah API Key
Edit file `app.py` dan ubah:
```python
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', 'YOUR_API_KEY_HERE')
```

## 💡 Contoh Perintah yang Bisa Diberikan

### Untuk Riset dan Informasi
- "Jelaskan tentang teknologi blockchain"
- "Apa tren terbaru di bidang AI?"
- "Riset tentang climate change"

### Untuk Penulisan dan Kreatif
- "Buat artikel tentang manfaat olahraga"
- "Tulis caption Instagram untuk produk fashion"
- "Buat cerita pendek tentang petualangan"

### Untuk Coding dan Teknis
- "Jelaskan cara membuat REST API dengan Python"
- "Buat contoh code untuk sorting algorithm"
- "Bagaimana cara deploy website?"

### Untuk Bisnis dan Analisis
- "Analisis strategi marketing untuk startup"
- "Buat proposal bisnis untuk aplikasi mobile"
- "Berikan saran untuk meningkatkan produktivitas tim"

### Untuk Belajar dan Edukasi
- "Jelaskan konsep machine learning dengan bahasa sederhana"
- "Buat rencana belajar pemrograman untuk 3 bulan"
- "Apa perbedaan antara frontend dan backend?"

## 🔧 Troubleshooting

### Chatbot tidak merespon
1. Pastikan server Flask berjalan
2. Cek console browser untuk error
3. Pastikan API key valid

### Error "Connection refused"
1. Pastikan server Flask berjalan di port 5000
2. Cek apakah port 5000 sudah digunakan aplikasi lain

### Error API
1. Pastikan API key OpenRouter valid
2. Cek koneksi internet
3. Pastikan model yang digunakan tersedia

## 🌐 Cara Menjalankan di Background

### Windows (PowerShell)
```powershell
Start-Process python -ArgumentList "app.py" -WindowStyle Hidden
```

### Windows (CMD)
```cmd
start /B python app.py
```

## 📱 Cara Akses dari Perangkat Lain

### 1. Cari IP Address Komputer
```bash
ipconfig
```

### 2. Akses dari Perangkat Lain
Buka browser di perangkat lain dan akses:
```
http://IP_ADDRESS_KOMPUTER:5000
```

Contoh: `http://192.168.100.30:5000`

## 🔄 Cara Reset Percakapan

Untuk mereset percakapan, Anda bisa:
1. Refresh halaman browser
2. Atau tambahkan endpoint reset (perlu modifikasi code)

## 📊 Cara Memantau Penggunaan

### Cek Log
Server Flask akan menampilkan log setiap request:
```
127.0.0.1 - - [15/Aug/2026 07:30:00] "POST /chat HTTP/1.1" 200 -
```

### Analisis Percakapan
Untuk analisis lebih lanjut, Anda bisa:
- Simpan percakapan ke database
- Tambahkan analytics
- Export conversation history

## 🚀 Cara Deploy ke Production

### Deploy ke Heroku
1. Buat akun Heroku
2. Install Heroku CLI
3. Buat file `Procfile`:
```
web: gunicorn app:app
```
4. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

### Deploy ke VPS
1. Install dependencies di server
2. Gunakan Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 💾 Cara Backup Percakapan

Untuk menyimpan percakapan, Anda bisa:
1. Tambahkan database (SQLite/PostgreSQL)
2. Simpan ke file JSON
3. Export conversation history

## 🎯 Tips Penggunaan Optimal

1. **Berikan Konteks Jelas**: Semakin spesifik perintah, semakin baik respon
2. **Gunakan Bahasa Natural**: Chatbot merespons lebih baik dengan bahasa natural
3. **Berikan Feedback**: Jika respon tidak sesuai, klarifikasi perintah
4. **Manfaatkan Session**: Chatbot mengingat konteks percakapan dalam sesi yang sama

## 📞 Bantuan Tambahan

Jika mengalami masalah:
1. Cek file README.md untuk dokumentasi teknis
2. Cek log server untuk error details
3. Pastikan semua dependensi terinstal dengan benar

---

**Selamat menggunakan Chatbot AI! 🎉**