# AI Agent dengan OpenRouter

Proyek ini adalah implementasi AI Agent sederhana menggunakan OpenRouter API. Karena CrewAI memiliki masalah kompatibilitas dengan Python 3.14, kita menggunakan implementasi custom yang lebih sederhana.

## Status Instalasi

✅ Virtual environment berhasil dibuat (`venv_new`)
✅ Dependencies berhasil diinstal (openai, python-dotenv)
✅ Implementasi AI Agent sederhana berfungsi
✅ **Model gratis `openrouter/free` berhasil diuji dan berfungsi**

## Instalasi

1. Buat virtual environment:
```bash
python -m venv venv_new
```

2. Aktifkan virtual environment:
```bash
.\venv_new\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Menjalankan

### Mode Gratis (Tanpa Kredit) - RECOMMENDED
File `main.py` sudah dikonfigurasi dengan model gratis `openrouter/free`:
```bash
python main.py
```

Model `openrouter/free` secara otomatis memilih model gratis yang tersedia dari OpenRouter.

### Mode Paling Mudah - NEW!
Gunakan mode sederhana untuk cara tercepat memerintahkan agent:
```bash
python simple_usage.py
```

Ini menunjukkan 4 cara berbeda untuk menggunakan agent, dan Anda bisa mengganti perintah langsung di file.

### Mode Interaktif
Gunakan mode interaktif untuk memberikan perintah langsung kepada agent:
```bash
python interactive.py
```

Di mode interaktif, Anda bisa:
- Memilih agent yang berbeda (researcher, writer, coder, analyst)
- Memberikan perintah langsung
- Mendapatkan respon real-time

### Mode Demo (Tanpa API Key)
Untuk melihat cara kerja sistem tanpa memerlukan koneksi API:
```bash
python demo.py
```

### Mode Contoh
Lihat berbagai contoh cara menggunakan agent:
```bash
python examples.py
```

### Mode Berbayar (Dengan Kredit)
1. Edit file `main.py` dan ganti:
   - `OPENROUTER_API_KEY` dengan kunci API OpenRouter Anda
   - `MODEL_NAME` dengan model berbayar yang ingin Anda gunakan

2. Jalankan:
```bash
python main.py
```

## Model yang Tersedia

### Model Gratis (Recommended)
- `openrouter/free` - Router otomatis yang memilih model gratis yang tersedia
- Tidak memerlukan kredit
- Cocok untuk eksperimen dan penggunaan ringan

### Model Berbayar
- `openai/gpt-3.5-turbo` (membutuhkan kredit)
- `openai/gpt-4` (membutuhkan kredit)
- `anthropic/claude-3-haiku` (membutuhkan kredit)
- Cek model lain di https://openrouter.ai/models

## Catatan Penting

1. **Model gratis sudah berfungsi** - Gunakan `openrouter/free` untuk penggunaan tanpa biaya
2. Model gratis mungkin memiliki rate limit yang lebih rendah daripada model berbayar
3. Untuk penggunaan produksi dengan beban tinggi, pertimbangkan model berbayar
4. Jika ingin menggunakan model berbayar, tambahkan kredit di https://openrouter.ai/settings/credits

## Struktur Kode

Kode menggunakan class `SimpleAgent` yang menyediakan:
- Role definition (peran agen)
- Goal definition (tujuan agen)
- Backstory definition (latar belakang agen)
- Task execution (eksekusi tugas)

Ini adalah implementasi sederhana yang menggantikan CrewAI untuk menghindari masalah dependensi.

## Cara Memerintahkan Agent

### 🚀 Cara Paling Cepat (Recommended)
```bash
python simple_usage.py
```

Edit file `simple_usage.py` dan ganti perintah di bagian `cara_4_ganti_perintah()`:
```python
perintah_anda = "MASUKKAN PERINTAH ANDA DI SINI"
```

### 💬 Mode Interaktif (Chat Langsung)
```bash
python interactive.py
```

Di mode ini, Anda bisa:
- Pilih agent yang berbeda (researcher, writer, coder, analyst)
- Ketik perintah langsung seperti chatting
- Mendapatkan respon real-time

**Contoh perintah:**
```
Jelaskan tentang teknologi quantum computing
Buat ringkasan tentang climate change
Bagaimana cara membuat website dengan HTML?
Analisis peluang bisnis di bidang AI
```

### 📝 Mode Programatik
Edit file `main.py` dan ubah bagian task_description:

```python
# Ganti task sesuai kebutuhan Anda
task_description = """[PERINTAH ANDA DI SINI]"""
```

**Contoh task:**
```python
task_description = "Buat proposal bisnis untuk startup edukasi"
task_description = "Jelaskan konsep microservices architecture"
task_description = "Analisis tren social media marketing 2024"
```

### 🎯 Membuat Agent Custom
Anda bisa membuat agent dengan peran khusus:

```python
custom_agent = SimpleAgent(
    role='Konsultan Keuangan',
    goal='Memberikan saran keuangan yang tepat',
    backstory='Anda adalah konsultan keuangan bersertifikat.'
)

result = custom_agent.execute_task("Buat rencana investasi untuk pemula")
```

### 📚 Berbagai Contoh Penggunaan
Jalankan `python examples.py` untuk melihat berbagai contoh:
- Riset teknologi
- Menulis konten
- Bantuan coding
- Analisis bisnis
- Agent custom
- Question & Answer

## Masalah yang Dihadapi dan Solusi

**Masalah:** CrewAI tidak dapat diinstal pada Python 3.14 karena dependensi yang memerlukan kompilasi (regex, tiktoken) yang gagal di Windows.

**Solusi:** Membuat implementasi AI Agent sederhana menggunakan OpenAI API langsung tanpa CrewAI, yang berfungsi dengan Python 3.14 dan hanya memerlukan dependensi dasar.

**Solusi Tambahan:** Menggunakan model gratis `openrouter/free` dari OpenRouter untuk penggunaan tanpa biaya.

## Hasil Pengujian

✅ Model `openrouter/free` berhasil menghasilkan laporan analisis AI yang komprehensif dalam bahasa Indonesia
✅ Sistem menangani encoding Unicode untuk Windows console
✅ Tidak memerlukan kredit untuk penggunaan dasar

## Langkah Selanjutnya

1. **Gunakan model gratis** untuk eksperimen dan pengembangan
2. Kembangkan lebih banyak agen dengan peran berbeda
3. Tambahkan fitur multi-agent collaboration
4. Integrasikan dengan tools lain untuk meningkatkan kemampuan agen
