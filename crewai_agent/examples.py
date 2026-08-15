# Contoh Cara Menggunakan AI Agent
# File ini berbagai contoh cara memerintahkan agent untuk berbagai task

import os
from openai import OpenAI

# --- PENyiapan ---
OPENROUTER_API_KEY = "sk-or-v1-PLACEHOLDER" 
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
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": task_description}
                ],
                temperature=0.7
            )
            content = response.choices[0].message.content
            try:
                return content
            except UnicodeEncodeError:
                return content.encode('ascii', 'ignore').decode('ascii')
        except Exception as e:
            return f"Error: {e}"

# --- CONTOH PENGGUNAAN ---

def example_1_research():
    """Contoh 1: Riset tentang topik tertentu"""
    print("=== CONTOH 1: RISET ===")
    
    researcher = SimpleAgent(
        role='Analis Riset Senior',
        goal='Menemukan perkembangan mutakhir dalam teknologi',
        backstory='Anda adalah analis riset di lembaga pemikir teknologi.'
    )
    
    task = "Riset tentang tren teknologi blockchain di tahun 2024"
    result = researcher.execute_task(task)
    
    print(f"Task: {task}")
    print(f"Hasil:\n{result}\n")

def example_2_writing():
    """Contoh 2: Menulis konten"""
    print("=== CONTOH 2: MENULIS KONTEN ===")
    
    writer = SimpleAgent(
        role='Penulis Konten Profesional',
        goal='Membuat konten berkualitas tinggi',
        backstory='Anda adalah penulis profesional dengan 10 tahun pengalaman.'
    )
    
    task = "Buat artikel blog tentang manfaat AI untuk bisnis kecil"
    result = writer.execute_task(task)
    
    print(f"Task: {task}")
    print(f"Hasil:\n{result}\n")

def example_3_coding():
    """Contoh 3: Bantuan coding"""
    print("=== CONTOH 3: BANTUAN CODING ===")
    
    coder = SimpleAgent(
        role='Developer Software Senior',
        goal='Membantu dalam pengembangan software',
        backstory='Anda adalah developer senior dengan keahlian di berbagai bahasa.'
    )
    
    task = "Jelaskan cara membuat API sederhana dengan Python dan Flask"
    result = coder.execute_task(task)
    
    print(f"Task: {task}")
    print(f"Hasil:\n{result}\n")

def example_4_analysis():
    """Contoh 4: Analisis bisnis"""
    print("=== CONTOH 4: ANALISIS BISNIS ===")
    
    analyst = SimpleAgent(
        role='Analisis Bisnis',
        goal='Menganalisis data dan memberikan insight bisnis',
        backstory='Anda adalah analisis bisnis yang berpengalaman.'
    )
    
    task = "Analisis strategi pemasaran untuk startup teknologi baru"
    result = analyst.execute_task(task)
    
    print(f"Task: {task}")
    print(f"Hasil:\n{result}\n")

def example_5_custom_agent():
    """Contoh 5: Membuat agent custom"""
    print("=== CONTOH 5: AGENT CUSTOM ===")
    
    # Buat agent sesuai kebutuhan Anda
    custom_agent = SimpleAgent(
        role='Konsultan Digital Marketing',
        goal='Memberikan strategi marketing digital yang efektif',
        backstory='Anda adalah konsultan marketing dengan spesialisasi di digital marketing.'
    )
    
    task = "Buat strategi Instagram marketing untuk bisnis fashion"
    result = custom_agent.execute_task(task)
    
    print(f"Task: {task}")
    print(f"Hasil:\n{result}\n")

def example_6_qa():
    """Contoh 6: Question & Answer"""
    print("=== CONTOH 6: QUESTION & ANSWER ===")
    
    general_agent = SimpleAgent(
        role='Asisten Umum',
        goal='Membantu menjawab berbagai pertanyaan',
        backstory='Anda adalah asisten yang membantu dan informatif.'
    )
    
    task = "Apa perbedaan antara AI dan Machine Learning?"
    result = general_agent.execute_task(task)
    
    print(f"Task: {task}")
    print(f"Hasil:\n{result}\n")

# --- MENU PILIHAN ---

def main():
    print("========================================")
    print("CONTOH PENGGUNAAN AI AGENT")
    print("========================================")
    print("\nPilih contoh yang ingin dijalankan:")
    print("1. Riset tentang teknologi")
    print("2. Menulis konten")
    print("3. Bantuan coding")
    print("4. Analisis bisnis")
    print("5. Agent custom")
    print("6. Question & Answer")
    print("7. Jalankan semua contoh")
    print("0. Keluar")
    
    choice = input("\nMasukkan pilihan (0-7): ").strip()
    
    if choice == "1":
        example_1_research()
    elif choice == "2":
        example_2_writing()
    elif choice == "3":
        example_3_coding()
    elif choice == "4":
        example_4_analysis()
    elif choice == "5":
        example_5_custom_agent()
    elif choice == "6":
        example_6_qa()
    elif choice == "7":
        example_1_research()
        example_2_writing()
        example_3_coding()
        example_4_analysis()
        example_5_custom_agent()
        example_6_qa()
    elif choice == "0":
        print("Sampai jumpa!")
    else:
        print("Pilihan tidak valid")

if __name__ == "__main__":
    main()