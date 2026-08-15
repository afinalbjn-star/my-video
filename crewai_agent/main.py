# Bahasa Indonesia:
# 1. Pastikan Anda sudah mengatur environment variable OPENROUTER_API_KEY.
#    Anda bisa mendapatkan kunci API dari https://openrouter.ai/keys
# 2. Ganti "ganti_dengan_kunci_api_openrouter_anda" di bawah ini dengan kunci asli Anda.
# 3. Ganti model jika Anda ingin menggunakan model lain dari OpenRouter.
# 4. Jalankan file ini dengan: python crewai_agent/main.py

import os
from openai import OpenAI

# --- PENyiapan ---
# Ganti dengan kunci API OpenRouter Anda
OPENROUTER_API_KEY = "sk-or-v1-PLACEHOLDER" 

# Pilih model yang ingin Anda gunakan dari OpenRouter
# Daftar model: https://openrouter.ai/models
# Catatan: Beberapa model yang umum tersedia:
# - "openai/gpt-3.5-turbo" (membutuhkan kredit)
# - "openai/gpt-4" (membutuhkan kredit)
# - "anthropic/claude-3-haiku" (membutuhkan kredit)
# - "openrouter/free" (GRATIS - router otomatis memilih model gratis yang tersedia)
# Model gratis yang akan digunakan:
MODEL_NAME = "openrouter/free"

# Inisialisasi OpenAI client dengan konfigurasi OpenRouter
try:
    client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )
    print("[OK] Client OpenRouter berhasil diinisialisasi")
except Exception as e:
    print(f"[ERROR] Error initializing client: {e}")
    print("Pastikan Anda sudah mengganti 'ganti_dengan_kunci_api_openrouter_anda' dengan kunci API Anda yang valid.")
    exit()

# --- DEFINISI SISTEM AGEN SEDERHANA ---

class SimpleAgent:
    def __init__(self, role, goal, backstory):
        self.role = role
        self.goal = goal
        self.backstory = backstory
    
    def execute_task(self, task_description):
        # Buat system prompt dari role, goal, dan backstory
        system_prompt = f"""Anda adalah {self.role}.
        
Tujuan Anda: {self.goal}

Latar belakang: {self.backstory}

Silakan menjawab pertanyaan atau tugas dengan gaya profesional dan sesuai dengan peran Anda."""
        
        try:
            print(f"[PROCESSING] Mengirim permintaan ke model: {MODEL_NAME}...")
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": task_description}
                ],
                temperature=0.7
            )
            print("[OK] Respon diterima")
            content = response.choices[0].message.content
            # Handle encoding issues
            try:
                return content
            except UnicodeEncodeError:
                return content.encode('ascii', 'ignore').decode('ascii')
        except Exception as e:
            error_msg = str(e)
            if "402" in error_msg:
                return """[ERROR] Kredit tidak mencukupi di akun OpenRouter Anda.

SOLUSI:
1. Tambahkan kredit di: https://openrouter.ai/settings/credits
2. Atau coba model gratis yang tersedia di OpenRouter
3. Atau gunakan API key dari provider lain (OpenAI, Anthropic, dll)

Untuk demo tanpa API key, jalankan: python demo.py"""
            elif "404" in error_msg:
                return f"""[ERROR] Model '{MODEL_NAME}' tidak ditemukan.

SOLUSI:
1. Cek model yang tersedia di: https://openrouter.ai/models
2. Ganti MODEL_NAME di file ini dengan model yang valid
3. Pastikan model yang dipilih sesuai dengan kredit yang Anda miliki"""
            else:
                return f"[ERROR] {error_msg}"

# --- EKSEKUSI ---

# Buat agen peneliti (researcher)
researcher = SimpleAgent(
    role='Analis Riset Senior',
    goal='Menemukan perkembangan mutakhir dalam AI dan ilmu data',
    backstory="""Anda adalah seorang Analis Riset Senior di sebuah lembaga pemikir teknologi terkemuka.
    Keahlian Anda terletak pada identifikasi tren dan teknologi yang sedang berkembang.
    Anda memiliki bakat untuk membedah data kompleks dan menyajikan wawasan yang dapat ditindaklanjuti."""
)

# Tugas untuk agen
task_description = """Lakukan analisis komprehensif tentang kemajuan terbaru dalam AI pada tahun 2024.
Identifikasi tren utama, teknologi terobosan, dan potensi dampaknya pada industri.
Jawaban akhir Anda harus berupa laporan analisis lengkap."""

# Mulai eksekusi tugas
print("========================================")
print("Memulai eksekusi AI Agent...")
print("Agen: Peneliti")
print("Tugas: Menganalisis kemajuan AI 2024")
print("========================================")

try:
    result = researcher.execute_task(task_description)

    print("\n\n######################")
    print("## Hasil Akhir dari AI Agent:")
    print("######################\n")
    # Handle encoding issues for Windows console
    try:
        print(result)
    except UnicodeEncodeError:
        # Fallback: encode problematic characters
        print(result.encode('ascii', 'ignore').decode('ascii'))

except Exception as e:
    print(f"\n[ERROR] Terjadi error saat eksekusi agent: {e}")
    print("Hal ini bisa terjadi karena kunci API tidak valid atau ada masalah koneksi ke OpenRouter.")
