# Mode Interaktif untuk AI Agent
# File ini memungkinkan Anda memberikan perintah langsung kepada agent

import os
from openai import OpenAI

# --- PENyiapan ---
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "ganti_dengan_kunci_api_openrouter_anda") 
MODEL_NAME = "openrouter/free"

# Inisialisasi client
try:
    client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )
    print("[OK] Client OpenRouter berhasil diinisialisasi")
except Exception as e:
    print(f"[ERROR] Error initializing client: {e}")
    exit()

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
            print(f"[PROCESSING] Bekerja pada task: {task_description[:50]}...")
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
            error_msg = str(e)
            if "402" in error_msg:
                return "[ERROR] Kredit tidak mencukupi"
            elif "404" in error_msg:
                return f"[ERROR] Model tidak ditemukan"
            else:
                return f"[ERROR] {error_msg}"

# --- AGEN YANG TERSEDIA ---

# Daftar agen yang bisa dipilih
AGENTS = {
    "researcher": SimpleAgent(
        role='Analis Riset Senior',
        goal='Menemukan perkembangan mutakhir dalam AI dan ilmu data',
        backstory="""Anda adalah seorang Analis Riset Senior di sebuah lembaga pemikir teknologi terkemuka.
        Keahlian Anda terletak pada identifikasi tren dan teknologi yang sedang berkembang.
        Anda memiliki bakat untuk membedah data kompleks dan menyajikan wawasan yang dapat ditindaklanjuti."""
    ),
    "writer": SimpleAgent(
        role='Penulis Konten Profesional',
        goal='Membuat konten berkualitas tinggi yang menarik dan informatif',
        backstory="""Anda adalah seorang penulis konten profesional dengan pengalaman 10 tahun.
        Ahli dalam membuat artikel, blog post, dan konten marketing yang engaging.
        Gaya penulisan Anda jelas, padat, dan mudah dipahami."""
    ),
    "coder": SimpleAgent(
        role='Developer Software Senior',
        goal='Membantu dalam pengembangan software dan pemecahan masalah teknis',
        backstory="""Anda adalah developer software senior dengan keahlian di berbagai bahasa pemrograman.
        Spesialis dalam clean code, debugging, dan arsitektur software.
        Mampu menjelaskan konsep teknis dengan cara yang mudah dipahami."""
    ),
    "analyst": SimpleAgent(
        role='Analisis Bisnis',
        goal='Menganalisis data dan memberikan insight bisnis yang action-oriented',
        backstory="""Anda adalah analisis bisnis yang berpengalaman dalam mengubah data menjadi strategi.
        Ahli dalam analisis pasar, forecasting, dan pengambilan keputusan berbasis data.
        Fokus pada insight yang dapat langsung diimplementasikan."""
    )
}

# --- MODE INTERAKTIF ---

def interactive_mode():
    print("========================================")
    print("MODE INTERAKTIF AI AGENT")
    print("========================================")
    print("\nAgen yang tersedia:")
    for key, agent in AGENTS.items():
        print(f"  - {key}: {agent.role}")
    
    print("\nPerintah yang tersedia:")
    print("  - 'list': Tampilkan semua agen")
    print("  - 'help': Tampilkan bantuan")
    print("  - 'exit': Keluar dari program")
    print("  - Ketik perintah Anda langsung untuk agent yang dipilih")
    
    current_agent = AGENTS["researcher"]  # Default agent
    print(f"\n[INFO] Agent aktif saat ini: {current_agent.role}")
    print("[INFO] Ketik 'switch <nama_agent>' untuk mengganti agent")
    
    while True:
        print("\n" + "="*50)
        user_input = input("Masukkan perintah Anda: ").strip()
        
        if not user_input:
            continue
            
        if user_input.lower() == 'exit':
            print("[INFO] Sampai jumpa!")
            break
            
        elif user_input.lower() == 'list':
            print("\nAgen yang tersedia:")
            for key, agent in AGENTS.items():
                print(f"  - {key}: {agent.role}")
                
        elif user_input.lower() == 'help':
            print("\nCara penggunaan:")
            print("1. Ketik perintah Anda langsung untuk task")
            print("2. Gunakan 'switch <nama_agent>' untuk ganti agent")
            print("3. Gunakan 'list' untuk lihat semua agent")
            print("4. Gunakan 'exit' untuk keluar")
            
        elif user_input.lower().startswith('switch '):
            agent_name = user_input[7:].strip().lower()
            if agent_name in AGENTS:
                current_agent = AGENTS[agent_name]
                print(f"[OK] Agent diganti ke: {current_agent.role}")
            else:
                print(f"[ERROR] Agent '{agent_name}' tidak ditemukan")
                print(f"[INFO] Gunakan 'list' untuk melihat agent yang tersedia")
                
        else:
            # Eksekusi task dengan agent yang aktif
            print(f"\n[INFO] Agent: {current_agent.role}")
            result = current_agent.execute_task(user_input)
            
            print("\n" + "="*50)
            print("HASIL:")
            print("="*50)
            print(result)

if __name__ == "__main__":
    try:
        interactive_mode()
    except KeyboardInterrupt:
        print("\n\n[INFO] Program dihentikan oleh user")
    except Exception as e:
        print(f"\n[ERROR] Terjadi error: {e}")