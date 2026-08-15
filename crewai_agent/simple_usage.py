# Cara Sederhana Menggunakan AI Agent
# File ini menunjukkan cara mudah memberikan perintah kepada agent

import os
from openai import OpenAI

# --- PENyiapan ---
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "ganti_dengan_kunci_api_openrouter_anda") 
MODEL_NAME = "openrouter/free"

# Inisialisasi client
client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

# --- DEFINISI SISTEM AGEN ---

class SimpleAgent:
    def __init__(self, role, goal, backstory):
        self.role = role
        self.goal = goal
        self.backstory = backstory
    
    def execute_task(self, task_description):
        system_prompt = f"""Anda adalah {self.role}.
        
Tujuan Anda: {self.goal}

Latar belakang: {self.backstory}

Silakan menjawab pertanyaan atau tugas dengan gaya profesional dan sesuai dengan peran Anda."""
        
        try:
            print(f"[PROCESSING] Agent {self.role} sedang bekerja...")
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": task_description}
                ],
                temperature=0.7
            )
            print("[OK] Task selesai")
            content = response.choices[0].message.content
            try:
                return content
            except UnicodeEncodeError:
                return content.encode('ascii', 'ignore').decode('ascii')
        except Exception as e:
            return f"Error: {e}"

# --- CARA PENGGUNAAN ---

def cara_1_agent_default():
    """Cara 1: Gunakan agent default dan berikan perintah langsung"""
    print("=== CARA 1: AGENT DEFAULT ===")
    
    # Buat agent general
    agent = SimpleAgent(
        role='Asisten AI',
        goal='Membantu menjawab pertanyaan dan menyelesaikan tugas',
        backstory='Anda adalah asisten AI yang helpful dan informatif.'
    )
    
    # Berikan perintah
    perintah = "Jelaskan apa itu artificial intelligence dalam bahasa yang mudah dipahami"
    hasil = agent.execute_task(perintah)
    
    print(f"Perintah: {perintah}")
    print("Hasil:")
    try:
        print(hasil)
    except UnicodeEncodeError:
        print(hasil.encode('ascii', 'ignore').decode('ascii'))
    print()

def cara_2_custom_agent():
    """Cara 2: Buat agent custom sesuai kebutuhan"""
    print("=== CARA 2: AGENT CUSTOM ===")
    
    # Buat agent dengan peran khusus
    agent = SimpleAgent(
        role='Guru Matematika',
        goal='Mengajarkan matematika dengan cara yang mudah dipahami',
        backstory='Anda adalah guru matematika yang sabar dan menggunakan contoh konkret.'
    )
    
    # Berikan perintah sesuai peran agent
    perintah = "Jelaskan konsep derivatif dalam kalkulus dengan contoh sederhana"
    hasil = agent.execute_task(perintah)
    
    print(f"Perintah: {perintah}")
    print("Hasil:")
    try:
        print(hasil)
    except UnicodeEncodeError:
        print(hasil.encode('ascii', 'ignore').decode('ascii'))
    print()

def cara_3_berbagai_agent():
    """Cara 3: Gunakan berbagai agent untuk task berbeda"""
    print("=== CARA 3: BERBAGAI AGENT ===")
    
    # Agent 1: Untuk riset
    researcher = SimpleAgent(
        role='Analis Riset',
        goal='Melakukan riset dan analisis mendalam',
        backstory='Anda adalah analis riset yang teliti dan komprehensif.'
    )
    
    # Agent 2: Untuk penulisan
    writer = SimpleAgent(
        role='Penulis Profesional',
        goal='Membuat konten berkualitas tinggi',
        backstory='Anda adalah penulis dengan gaya yang engaging dan profesional.'
    )
    
    # Gunakan agent yang sesuai
    task1 = "Riset tentang dampak AI pada pendidikan"
    hasil1 = researcher.execute_task(task1)
    
    print(f"Task Riset: {task1}")
    print("Hasil Riset:")
    try:
        print(hasil1)
    except UnicodeEncodeError:
        print(hasil1.encode('ascii', 'ignore').decode('ascii'))
    print()
    
    task2 = "Buat artikel blog berdasarkan riset di atas"
    hasil2 = writer.execute_task(task2)
    
    print(f"Task Penulisan: {task2}")
    print("Hasil Penulisan:")
    try:
        print(hasil2)
    except UnicodeEncodeError:
        print(hasil2.encode('ascii', 'ignore').decode('ascii'))
    print()

def cara_4_ganti_perintah():
    """Cara 4: Ganti perintah di file ini langsung"""
    print("=== CARA 4: GANTI PERINTAH LANGSUNG ===")
    
    agent = SimpleAgent(
        role='Asisten Umum',
        goal='Membantu berbagai task',
        backstory='Anda adalah asisten yang serbaguna.'
    )
    
    # Ganti perintah di sini sesuai kebutuhan Anda
    perintah_anda = "Buat strategi belajar pemrograman untuk pemula dalam 3 bulan"
    
    hasil = agent.execute_task(perintah_anda)
    
    print(f"Perintah Anda: {perintah_anda}")
    print("Hasil:")
    try:
        print(hasil)
    except UnicodeEncodeError:
        print(hasil.encode('ascii', 'ignore').decode('ascii'))
    print()

def cara_5_buat_chatbot():
    """Cara 5: Minta agent membuat website chatbot"""
    print("=== CARA 5: MEMBUAT WEBSITE CHATBOT ===")
    
    # Gunakan agent developer untuk membuat website
    developer = SimpleAgent(
        role='Full Stack Developer',
        goal='Membuat website dan aplikasi web yang fungsional',
        backstory='Anda adalah developer full stack dengan keahlian HTML, CSS, JavaScript, dan Python. Ahli dalam membuat UI/UX yang user-friendly.'
    )
    
    perintah_chatbot = """Buat website chatbot sederhana dengan spesifikasi berikut:

1. Frontend (HTML/CSS/JavaScript):
   - Tampilan chat modern dan clean
   - Input box untuk mengetik pesan
   - Area untuk menampilkan percakapan
   - Tombol kirim
   - Desain responsif untuk mobile dan desktop

2. Backend (Python Flask):
   - API endpoint untuk menerima pesan
   - Integrasi dengan OpenRouter API
   - Return respon dari AI
   - Handle error dengan baik

3. Fitur:
   - Real-time chat
   - Tampilkan status "typing..."
   - History percakapan
   - Auto-scroll ke pesan terbaru

4. Styling:
   - Modern dan professional
   - Warna yang nyaman di mata
   - Animasi yang smooth
   - Font yang readable

Berikan code lengkap untuk frontend dan backend beserta instruksi cara menjalankannya."""
    
    hasil = developer.execute_task(perintah_chatbot)
    
    print(f"Perintah: Buat website chatbot")
    print("Hasil:")
    try:
        print(hasil)
    except UnicodeEncodeError:
        print(hasil.encode('ascii', 'ignore').decode('ascii'))
    print()

def cara_6_rombak_chatbot_advanced():
    """Cara 6: Perintahkan agent untuk merombak chatbot menjadi advanced"""
    print("=== CARA 6: MEROMBAK CHATBOT MENJADI ADVANCED ===")
    
    # Gunakan agent architect untuk perombakan besar
    architect = SimpleAgent(
        role='AI System Architect',
        goal='Merancang dan merencanakan sistem AI yang kompleks dan scalable',
        backstory='Anda adalah architect sistem AI dengan pengalaman dalam merancang aplikasi AI enterprise-grade. Ahli dalam RAG, multi-agent systems, dan modern UI/UX.'
    )
    
    perintah_rombak = """Saya memiliki chatbot AI sederhana yang berjalan di http://127.0.0.1:5000 dengan Flask backend dan HTML/CSS/JS frontend. Saya ingin merombaknya menjadi aplikasi AI modern yang advanced.

Berikan rencana implementasi detail untuk merombak chatbot ini dengan spesifikasi berikut:

## 1. FUNGSIONALITAS MULTITASK

### A. Integrasi Retrieval-Augmented Generation (RAG)
- Hubungkan AI dengan dokumen lokal (PDF, Word, TXT)
- Buat fitur upload dokumen
- AI bisa membaca, merangkum, dan menjawab berdasarkan dokumen
- Berikan rencana teknis untuk implementasi RAG

### B. Eksekusi Kode & Kalkulator Interaktif
- Sediakan lingkungan aman (sandbox) untuk eksekusi Python
- AI bisa memproses data dan menghasilkan grafik
- Kalkulator untuk perhitungan matematika rumit
- Berikan rencana keamanan untuk sandbox

### C. Web Search Real-Time
- Integrasi web search untuk informasi terbaru
- AI bisa mencari berita dan data terkini
- Berikan rekomendasi API untuk web search

### D. Sistem Multi-Agent
- Pecah tugas menjadi agen spesifik:
  * Agent penulis (writer)
  * Agent programmer (coder)
  * Agent perencana (planner)
  * Agent analis (analyst)
- Berikan arsitektur untuk multi-agent system

## 2. UI/UX PROFESIONAL

### A. Layout Modern
- Sidebar dengan chat history
- Tombol "New Chat"
- Pengaturan profil pengguna
- Area percakapan utama dengan layout standar industri

### B. Desain Visual
- Palet warna modern dengan Dark/Light mode
- Font profesional (Inter, Roboto, Plus Jakarta Sans)
- Avatar untuk user dan AI
- Animasi smooth

### C. Elemen Interaktif
- Markdown support (tables, bullet points, bold/italic)
- Syntax highlighting untuk code
- Tombol Copy untuk code blocks
- Typing indicator dengan animasi
- Input yang auto-resize
- Tombol attachment file

## 3. TEKNOLOGI RECOMMENDED

### Frontend:
- Tailwind CSS untuk styling
- React.js/Next.js untuk komponen
- Atau Vue.js sebagai alternatif

### Backend:
- Flask (existing) atau FastAPI untuk async
- Streaming response untuk real-time effect

Berikan:
1. Roadmap implementasi bertahap
2. Prioritas fitur mana dulu
3. Code example untuk fitur kunci
4. Rekomendasi library dan tools
5. Estimasi complexity untuk setiap fitur
6. Cara migrasi dari existing code"""

    hasil = architect.execute_task(perintah_rombak)
    
    print(f"Perintah: Merombak chatbot menjadi advanced")
    print("Hasil:")
    try:
        print(hasil)
    except UnicodeEncodeError:
        print(hasil.encode('ascii', 'ignore').decode('ascii'))
    print()

def cara_7_implementasi_sekarang():
    """Cara 7: Perintahkan agent untuk langsung implementasi sekarang"""
    print("=== CARA 7: IMPLEMENTASI LANGSUNG SEKARANG ===")
    
    # Gunakan agent developer untuk implementasi praktis
    developer = SimpleAgent(
        role='Senior Full Stack Developer',
        goal='Mengimplementasikan fitur software secara praktis dan fungsional',
        backstory='Anda adalah developer senior dengan spesialisasi implementasi cepat dan efisien. Fokus pada code yang working dan可直接 digunakan.'
    )
    
    perintah_implementasi = r"""Saya ingin Anda LANGSUNG mengimplementasikan upgrade untuk chatbot saya yang ada di C:\Users\afina\my-video\chatbot.

Chatbot saat ini menggunakan:
- Flask backend (app.py)
- HTML/CSS/JS frontend
- OpenRouter API dengan model gratis

FILE YANG SUDAH ADA:
- app.py (Flask backend)
- index.html (frontend)
- static/style.css (styling)
- static/script.js (frontend logic)

MULAI IMPLEMENTASI SEKARANG dengan prioritas sebagai berikut:

## PRIORITAS 1: Upgrade Backend Flask ke FastAPI
1. Buat file baru: fastapi_app.py
2. Migrasi semua endpoint dari Flask ke FastAPI
3. Tambahkan async support
4. Pastikan semua fitur existing tetap berfungsi
5. Berikan code lengkap yang bisa langsung dijalankan

## PRIORITAS 2: Tambahkan Markdown Support
1. Update frontend untuk support markdown
2. Tambahkan library markdown JavaScript
3. Implementasi syntax highlighting untuk code
4. Tambahkan tombol copy untuk code blocks
5. Update index.html dan script.js

## PRIORITAS 3: Tambahkan Fitur Upload Dokumen
1. Buat endpoint untuk upload file di FastAPI
2. Support PDF, TXT, DOCX
3. Simpan file di folder uploads/
4. Update frontend dengan tombol upload
5. Tampilkan nama file yang diupload

## PRIORITAS 4: Perbaiki UI/UX
1. Tambahkan sidebar untuk chat history
2. Implementasi dark/light mode toggle
3. Perbaiki styling dengan lebih modern
4. Tambahkan avatar untuk user dan AI
5. Perbaiki input area untuk auto-resize

BERIKAN:
1. Code lengkap untuk setiap file yang diubah
2. Instruksi instalasi library tambahan jika diperlukan
3. Cara testing setiap fitur
4. Pastikan code compatible dengan Python 3.14 dan Windows
5. Langkah demi langkah cara menjalankan upgrade ini

JANGAN hanya berikan rencana - SAYA INGIN CODE YANG LANGSUNG BISA DIPAKAI!"""

    hasil = developer.execute_task(perintah_implementasi)
    
    print(f"Perintah: Implementasi langsung sekarang")
    print("Hasil:")
    try:
        print(hasil)
    except UnicodeEncodeError:
        print(hasil.encode('ascii', 'ignore').decode('ascii'))
    print()

# --- MAIN ---

if __name__ == "__main__":
    print("========================================")
    print("CARA MENGGUNAKAN AI AGENT")
    print("========================================\n")
    
    # Pilih cara yang ingin dicoba:
    # cara_1_agent_default()
    # cara_5_buat_chatbot()  # Chatbot sederhana
    # cara_6_rombak_chatbot_advanced()  # Rencana implementasi
    cara_7_implementasi_sekarang()  # <=== KITA GUNAKAN INI UNTUK IMPLEMENTASI LANGSUNG
    
    # Uncomment untuk mencoba cara lain:
    # cara_2_custom_agent()
    # cara_3_berbagai_agent()
    # cara_4_ganti_perintah()
    
    print("========================================")
    print("CARA GANTI PERINTAH:")
    print("1. Edit file ini")
    print("2. Cari bagian 'perintah_anda' di cara_4_ganti_perintah()")
    print("3. Ganti teks perintah dengan yang Anda inginkan")
    print("4. Jalankan ulang: python simple_usage.py")
    print("========================================")