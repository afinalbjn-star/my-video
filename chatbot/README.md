# 🤖 Chatbot AI - Asisten Pintar

Website chatbot AI yang modern dan responsif dibangun dengan Flask (backend) dan HTML/CSS/JavaScript (frontend). Chatbot ini menggunakan OpenRouter API dengan model gratis.

## 📁 Struktur Proyek

```
chatbot/
├── app.py              # Flask backend
├── index.html          # Halaman chat UI
├── requirements.txt    # Dependensi Python
├── README.md          # Dokumentasi ini
└── static/
    ├── style.css      # Styling CSS
    └── script.js      # Logika frontend JavaScript
```

## 🚀 Cara Instalasi

### 1. Buat Virtual Environment
```bash
cd chatbot
python -m venv venv
```

### 2. Aktifkan Virtual Environment
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

### 3. Install Dependensi
```bash
pip install -r requirements.txt
```

## 🎯 Cara Menjalankan

### 1. Jalankan Backend
```bash
python app.py
```

### 2. Buka Browser
Buka URL: `http://127.0.0.1:5000`

## ✨ Fitur

- **💬 Real-time Chat** - Mengirim dan menerima pesan secara real-time
- **🎨 Modern UI** - Desain yang bersih dan profesional
- **📱 Responsif** - Berfungsi di desktop, tablet, dan mobile
- **⌨️ Status Typing** - Indikator saat AI sedang mengetik
- **🔄 Auto-scroll** - Otomatis scroll ke pesan terbaru
- **💾 Session History** - Menyimpan riwayat percakapan per sesi
- **🆓 Model Gratis** - Menggunakan model gratis dari OpenRouter

## 🎨 Kustomisasi

### Mengganti Model AI
Edit file `app.py` dan ubah baris ini:
```python
payload = {
    'model': 'openrouter/free',  # Ganti dengan model lain
    'messages': session['conversation'],
    'temperature': 0.7
}
```

### Mengganti API Key
Edit file `app.py` dan ubah baris ini:
```python
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', 'YOUR_API_KEY_HERE')
```

Atau set sebagai environment variable:
```bash
set OPENROUTER_API_KEY=your_api_key_here
```

### Mengubah Warna/Style
Edit file `static/style.css` dan ubah variabel CSS di bagian `:root`:
```css
:root {
    --primary: #2563eb;        /* Warna utama */
    --bg: #f0f2f5;             /* Background */
    --chat-bg: #ffffff;        /* Background chat */
    /* ... lainnya */
}
```

## 🔧 Troubleshooting

### Port 5000 sudah digunakan
Jika port 5000 sudah digunakan, ubah port di `app.py`:
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Ganti port
```

### Error API
Pastikan API key OpenRouter Anda valid dan memiliki kredit untuk model yang digunakan.

### Error Import
Pastikan semua dependensi sudah terinstal:
```bash
pip install -r requirements.txt
```

## 📝 API Endpoints

### `POST /chat`
Mengirim pesan ke chatbot.

**Request:**
```json
{
  "message": "Halo, apa kabar?"
}
```

**Response:**
```json
{
  "response": "Halo! Saya baik, terima kasih sudah bertanya!",
  "conversation": [...]
}
```

### `POST /reset`
Mereset percakapan.

**Response:**
```json
{
  "status": "Conversation reset"
}
```

## 🌐 Deployment

### Deploy ke Heroku
1. Buat file `Procfile`:
```
web: python app.py
```

2. Deploy menggunakan Heroku CLI:
```bash
heroku create your-app-name
git push heroku main
```

### Deploy ke VPS
1. Install dependencies di server
2. Gunakan Gunicorn sebagai WSGI server:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📄 License

Proyek ini open source dan dapat digunakan secara bebas.

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan fork proyek dan buat pull request.

## 📞 Support

Jika mengalami masalah atau pertanyaan, silakan buat issue di repository.

---

**Dibuat dengan ❤️ menggunakan AI Agent**
