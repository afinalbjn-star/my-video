# multi_agent_system.py
"""
Multi-Agent System untuk AI Agent dengan kemampuan:
- Self-improvement
- File system access untuk coding mandiri
- Web search untuk data mandiri
"""

import os
import json
import subprocess
import requests
from typing import List, Dict, Any
from pathlib import Path
import asyncio
import aiofiles

class MultiAgentSystem:
    def __init__(self, openrouter_api_key: str):
        self.api_key = openrouter_api_key
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.agents = {
            'coder': CodeAgent(self.api_key, self.base_url),
            'searcher': SearchAgent(self.api_key, self.base_url),
            'analyzer': AnalyzerAgent(self.api_key, self.base_url),
            'improver': SelfImprovementAgent(self.api_key, self.base_url),
            'coordinator': CoordinatorAgent(self.api_key, self.base_url),
            'remotion': RemotionAgent(self.api_key, self.base_url),
            'github': GitHubAgent(self.api_key, self.base_url),
            'planner': PlannerAgent(self.api_key, self.base_url)
        }
        self.working_directory = r"C:\Users\afina\my-video"
        
    async def process_request(self, user_message: str, history: List[Dict[str, str]] = None) -> str:
        """Route request ke agent yang sesuai"""
        if history is None:
            history = []
            
        # Gunakan coordinator untuk menentukan agent yang tepat
        coordinator = self.agents['coordinator']
        agent_plan = await coordinator.determine_agent(user_message, history)
        
        selected_agent = agent_plan.get('agent', 'general')
        
        if selected_agent == 'coder':
            return await self.agents['coder'].execute(user_message, self.working_directory, history)
        elif selected_agent == 'searcher':
            return await self.agents['searcher'].execute(user_message, history)
        elif selected_agent == 'analyzer':
            return await self.agents['analyzer'].execute(user_message, self.working_directory, history)
        elif selected_agent == 'improver':
            return await self.agents['improver'].execute(user_message, self.working_directory, history)
        elif selected_agent == 'remotion':
            return await self.agents['remotion'].execute(user_message, self.working_directory, history)
        elif selected_agent == 'github':
            return await self.agents['github'].execute(user_message, self.working_directory, history)
        elif selected_agent == 'planner':
            return await self.agents['planner'].execute(user_message, self.working_directory, history)
        else:
            # Default response
            messages = history + [{"role": "user", "content": user_message}]
            return await self.call_openai(messages)
    
    async def call_openai(self, messages: List[Dict[str, str]]) -> str:
        """Call OpenRouter API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openrouter/free",
            "messages": messages,
            "temperature": 0.7
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error: {str(e)}"

class BaseAgent:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        
    async def call_openai(self, messages: List[Dict[str, str]]) -> str:
        """Call OpenRouter API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openrouter/free",
            "messages": messages,
            "temperature": 0.7
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error: {str(e)}"

class CodeAgent(BaseAgent):
    """Agent untuk coding mandiri dengan akses file system"""
    
    async def execute(self, task: str, working_dir: str, history: List[Dict[str, str]] = None) -> str:
        """Execute coding task dengan akses file system"""
        
        # Step 1: Analisa task dan baca file yang relevan
        analysis = await self.analyze_task(task, working_dir)
        
        # Step 2: Generate code
        code = await self.generate_code(task, analysis)
        
        # Step 3: Execute/modify file
        result = await self.execute_code_task(code, working_dir)
        
        return result
    
    async def analyze_task(self, task: str, working_dir: str) -> Dict[str, Any]:
        """Analisa task dan baca file yang relevan"""
        messages = [
            {
                "role": "system",
                "content": f"Anda adalah code analyzer. Analisa task ini dan tentukan file yang perlu dibaca/dimodifikasi. Working directory: {working_dir}"
            },
            {
                "role": "user",
                "content": f"Task: {task}\n\nAnalisa dan berikan:\n1. File yang perlu dibaca\n2. File yang perlu dimodifikasi\n3. Perubahan yang diperlukan"
            }
        ]
        
        response = await self.call_openai(messages)
        
        # Parse response untuk mendapatkan file list
        files_to_read = self.extract_files_from_response(response)
        
        # Baca file yang relevan
        file_contents = {}
        for file_path in files_to_read:
            full_path = os.path.join(working_dir, file_path)
            if os.path.exists(full_path):
                try:
                    async with aiofiles.open(full_path, 'r') as f:
                        content = await f.read()
                        file_contents[file_path] = content
                except Exception as e:
                    file_contents[file_path] = f"Error reading file: {str(e)}"
        
        return {
            "analysis": response,
            "files": file_contents
        }
    
    async def generate_code(self, task: str, analysis: Dict[str, Any]) -> str:
        """Generate code berdasarkan analisa"""
        messages = [
            {
                "role": "system",
                "content": "Anda adalah expert programmer. Generate code yang working dan sesuai dengan task."
            },
            {
                "role": "user",
                "content": f"Task: {task}\n\nAnalisa: {analysis['analysis']}\n\nFile contents: {json.dumps(analysis['files'], indent=2)}\n\nGenerate code yang lengkap dan working."
            }
        ]
        
        return await self.call_openai(messages)
    
    async def execute_code_task(self, code: str, working_dir: str) -> str:
        """Execute coding task (create/modify file)"""
        messages = [
            {
                "role": "system",
                "content": f"Anda adalah code executor. Parse code yang di-generate dan berikan instruksi spesifik. WAJIB HANYA merespon dalam format JSON seperti ini:\n{{\n  \"files\": [\n    {{\n      \"path\": \"path/ke/file.py\",\n      \"action\": \"create\",\n      \"content\": \"isi kode disini\"\n    }}\n  ]\n}}\nAction bisa 'create', 'modify', atau 'delete'. Working directory: {working_dir}"
            },
            {
                "role": "user",
                "content": f"Code:\n{code}\n\nParse dan berikan instruksi HANYA dalam format JSON."
            }
        ]
        
        response = await self.call_openai(messages)
        
        # Parse dan execute instructions
        try:
            # Strip markdown json blocks if present
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.startswith('```'):
                clean_response = clean_response[3:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
                
            instructions = json.loads(clean_response.strip())
            execution_results = []
            
            for instruction in instructions.get('files', []):
                file_path = instruction.get('path')
                content = instruction.get('content')
                action = instruction.get('action', 'create')
                
                full_path = os.path.join(working_dir, file_path)
                
                try:
                    if action == 'create' or action == 'modify':
                        # Create directory if not exists
                        os.makedirs(os.path.dirname(full_path), exist_ok=True)
                        
                        async with aiofiles.open(full_path, 'w') as f:
                            await f.write(content)
                        
                        execution_results.append(f"✓ {action}: {file_path}")
                    elif action == 'delete':
                        if os.path.exists(full_path):
                            os.remove(full_path)
                            execution_results.append(f"✓ deleted: {file_path}")
                except Exception as e:
                    execution_results.append(f"✗ Error with {file_path}: {str(e)}")
            
            return f"Task executed successfully:\n" + "\n".join(execution_results)
            
        except json.JSONDecodeError:
            return f"Generated code:\n{code}\n\n(Please implement manually)"
    
    def extract_files_from_response(self, response: str) -> List[str]:
        """Extract file paths dari response AI"""
        files = []
        for line in response.split('\n'):
            if line.strip().endswith('.py') or line.strip().endswith('.html') or line.strip().endswith('.js') or line.strip().endswith('.css'):
                files.append(line.strip())
        return files

class SearchAgent(BaseAgent):
    """Agent untuk web search mandiri"""
    
    async def execute(self, query: str, history: List[Dict[str, str]] = None) -> str:
        """Execute web search task"""
        
        # Step 1: Search web
        search_results = await self.search_web(query)
        
        # Step 2: Analyze results
        analysis = await self.analyze_search_results(query, search_results)
        
        return analysis
    
    async def search_web(self, query: str) -> List[Dict[str, str]]:
        """Search web menggunakan berbagai metode"""
        results = []
        
        # Method 1: DuckDuckGo (gratis, no API key needed)
        try:
            ddg_results = await self.search_duckduckgo(query)
            results.extend(ddg_results)
        except Exception as e:
            results.append({"error": f"DuckDuckGo search failed: {str(e)}"})
        
        # Method 2: Wikipedia (gratis)
        try:
            wiki_results = await self.search_wikipedia(query)
            results.extend(wiki_results)
        except Exception as e:
            results.append({"error": f"Wikipedia search failed: {str(e)}"})
        
        return results[:5]  # Return top 5 results
    
    async def search_duckduckgo(self, query: str) -> List[Dict[str, str]]:
        """Search menggunakan DuckDuckGo"""
        try:
            # Menggunakan DuckDuckGo Instant Answer API
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": 1,
                "skip_disambig": 0
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            results = []
            
            # Abstract
            if data.get('Abstract'):
                results.append({
                    "source": "DuckDuckGo Abstract",
                    "content": data['Abstract']
                })
            
            # Related topics
            for topic in data.get('RelatedTopics', [])[:3]:
                if isinstance(topic, dict) and 'Text' in topic:
                    results.append({
                        "source": "DuckDuckGo Related",
                        "content": topic['Text']
                    })
            
            return results
            
        except Exception as e:
            return [{"error": str(e)}]
    
    async def search_wikipedia(self, query: str) -> List[Dict[str, str]]:
        """Search menggunakan Wikipedia API"""
        try:
            # Search Wikipedia
            search_url = "https://en.wikipedia.org/w/api.php"
            search_params = {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "format": "json",
                "utf8": 1,
                "srlimit": 3
            }
            
            response = requests.get(search_url, params=search_params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            results = []
            
            for item in data.get('query', {}).get('search', []):
                title = item['title']
                snippet = item.get('snippet', '')
                
                # Get full content
                content_params = {
                    "action": "query",
                    "prop": "extracts",
                    "exintro": 1,
                    "explaintext": 1,
                    "titles": title,
                    "format": "json"
                }
                
                content_response = requests.get(search_url, params=content_params, timeout=10)
                content_data = content_response.json()
                
                extract = content_data.get('query', {}).get('pages', {}).popitem()[1].get('extract', '')
                
                results.append({
                    "source": f"Wikipedia: {title}",
                    "content": extract[:500] + "..." if len(extract) > 500 else extract
                })
            
            return results
            
        except Exception as e:
            return [{"error": str(e)}]
    
    async def analyze_search_results(self, query: str, results: List[Dict[str, str]]) -> str:
        """Analisa search results dan berikan jawaban"""
        messages = [
            {
                "role": "system",
                "content": "Anda adalah information analyst. Analisa search results dan berikan jawaban komprehensif untuk query user."
            },
            {
                "role": "user",
                "content": f"Query: {query}\n\nSearch Results:\n{json.dumps(results, indent=2)}\n\nAnalisa dan berikan jawaban yang informatif."
            }
        ]
        
        return await self.call_openai(messages)

class AnalyzerAgent(BaseAgent):
    """Agent untuk analisa directory dan project structure"""
    
    async def execute(self, task: str, working_dir: str, history: List[Dict[str, str]] = None) -> str:
        """Analisa directory structure"""
        
        # Get directory structure
        structure = await self.get_directory_structure(working_dir)
        
        # Analyze based on task
        analysis = await self.analyze_structure(task, structure)
        
        return analysis
    
    async def get_directory_structure(self, working_dir: str) -> Dict[str, Any]:
        """Get directory structure"""
        structure = {
            "root": working_dir,
            "directories": [],
            "files": []
        }
        
        try:
            for item in os.listdir(working_dir):
                item_path = os.path.join(working_dir, item)
                
                if os.path.isdir(item_path):
                    structure["directories"].append({
                        "name": item,
                        "path": item_path
                    })
                elif os.path.isfile(item_path):
                    structure["files"].append({
                        "name": item,
                        "path": item_path,
                        "size": os.path.getsize(item_path)
                    })
        except Exception as e:
            structure["error"] = str(e)
        
        return structure
    
    async def analyze_structure(self, task: str, structure: Dict[str, Any]) -> str:
        """Analisa structure berdasarkan task"""
        messages = [
            {
                "role": "system",
                "content": "Anda adalah project analyzer. Analisa directory structure dan berikan insight sesuai task."
            },
            {
                "role": "user",
                "content": f"Task: {task}\n\nDirectory Structure:\n{json.dumps(structure, indent=2)}\n\nAnalisa dan berikan insight."
            }
        ]
        
        return await self.call_openai(messages)

class SelfImprovementAgent(BaseAgent):
    """Agent untuk self-improvement"""
    
    async def execute(self, task: str, working_dir: str, history: List[Dict[str, str]] = None) -> str:
        """Execute self-improvement task"""
        
        # Step 1: Analyze current system
        current_analysis = await self.analyze_current_system(working_dir)
        
        # Step 2: Identify improvements
        improvements = await self.identify_improvements(task, current_analysis)
        
        # Step 3: Implement improvements
        implementation = await self.implement_improvements(improvements, working_dir)
        
        return implementation
    
    async def analyze_current_system(self, working_dir: str) -> Dict[str, Any]:
        """Analisa sistem saat ini"""
        analysis = {
            "files": [],
            "code_quality": [],
            "potential_issues": []
        }
        
        try:
            # List Python files
            for root, dirs, files in os.walk(working_dir):
                for file in files:
                    if file.endswith('.py'):
                        file_path = os.path.join(root, file)
                        analysis["files"].append(file_path)
                        
                        # Simple code quality check
                        try:
                            async with aiofiles.open(file_path, 'r') as f:
                                content = await f.read()
                                
                                # Check for common issues
                                if "TODO" in content or "FIXME" in content:
                                    analysis["potential_issues"].append(f"{file_path}: Contains TODO/FIXME")
                                if len(content) > 10000:  # Large file
                                    analysis["code_quality"].append(f"{file_path}: Large file, consider refactoring")
                        except Exception as e:
                            analysis["potential_issues"].append(f"{file_path}: Error reading - {str(e)}")
                            
        except Exception as e:
            analysis["error"] = str(e)
        
        return analysis
    
    async def identify_improvements(self, task: str, analysis: Dict[str, Any]) -> str:
        """Identifikasi improvements yang diperlukan"""
        messages = [
            {
                "role": "system",
                "content": "Anda adalah code improvement specialist. Identifikasi improvements yang diperlukan berdasarkan task dan analisa sistem."
            },
            {
                "role": "user",
                "content": f"Task: {task}\n\nSystem Analysis:\n{json.dumps(analysis, indent=2)}\n\nIdentifikasi improvements yang diperlukan dan berikan rekomendasi spesifik."
            }
        ]
        
        return await self.call_openai(messages)
    
    async def implement_improvements(self, improvements: str, working_dir: str) -> str:
        """Implement improvements"""
        messages = [
            {
                "role": "system",
                "content": f"Anda adalah code implementer. Parse improvements dan berikan instruksi spesifik. WAJIB HANYA merespon dalam format JSON seperti ini:\n{{\n  \"files\": [\n    {{\n      \"path\": \"path/ke/file.py\",\n      \"action\": \"create\",\n      \"content\": \"isi kode disini\"\n    }}\n  ]\n}}\nAction bisa 'create', 'modify', atau 'delete'. Working directory: {working_dir}"
            },
            {
                "role": "user",
                "content": f"Improvements:\n{improvements}\n\nParse dan berikan instruksi HANYA dalam format JSON."
            }
        ]
        
        response = await self.call_openai(messages)
        
        # Implement similar to CodeAgent
        try:
            # Strip markdown json blocks if present
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.startswith('```'):
                clean_response = clean_response[3:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
                
            instructions = json.loads(clean_response.strip())
            implementation_results = []
            
            for instruction in instructions.get('files', []):
                file_path = instruction.get('path')
                content = instruction.get('content')
                action = instruction.get('action', 'create')
                
                full_path = os.path.join(working_dir, file_path)
                
                try:
                    if action == 'create' or action == 'modify':
                        os.makedirs(os.path.dirname(full_path), exist_ok=True)
                        
                        async with aiofiles.open(full_path, 'w') as f:
                            await f.write(content)
                        
                        implementation_results.append(f"✓ {action}: {file_path}")
                    elif action == 'delete':
                        if os.path.exists(full_path):
                            os.remove(full_path)
                            implementation_results.append(f"✓ deleted: {file_path}")
                except Exception as e:
                    implementation_results.append(f"✗ Error with {file_path}: {str(e)}")
            
            return f"Improvements implemented:\n" + "\n".join(implementation_results)
            
        except json.JSONDecodeError:
            return f"Improvements identified:\n{improvements}\n\n(Please implement manually)"

class CoordinatorAgent(BaseAgent):
    """Agent untuk mengkoordinasi task ke agent yang tepat"""
    
    async def determine_agent(self, user_message: str, history: List[Dict[str, str]] = None) -> Dict[str, str]:
        """Tentukan agent yang tepat untuk task"""
        messages = [
            {
                "role": "system",
                "content": "Anda adalah task coordinator. Tentukan agent yang paling sesuai untuk task user. Pilihan: 'coder', 'searcher', 'analyzer', 'improver', 'remotion', 'github', 'planner', atau 'general'. WAJIB Response HANYA dalam format JSON: {\"agent\": \"agent_name\", \"reasoning\": \"reasoning\"}"
            },
            {
                "role": "user",
                "content": f"User message: {user_message}\n\nTentukan agent yang paling sesuai."
            }
        ]
        
        response = await self.call_openai(messages)
        
        try:
            # Strip markdown json blocks if present
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.startswith('```'):
                clean_response = clean_response[3:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
                
            result = json.loads(clean_response.strip())
            
            # Additional safety: force remotion if user clearly asks for it
            msg_lower = user_message.lower()
            if 'remotion' in msg_lower or 'buat video' in msg_lower or 'render' in msg_lower:
                return {"agent": "remotion", "reasoning": "Forced Remotion override based on keywords"}
                
            return result
        except json.JSONDecodeError:
            # Fallback based on keywords
            msg_lower = user_message.lower()
            if any(keyword in msg_lower for keyword in ['remotion', 'video', 'render', 'buat video']):
                return {"agent": "remotion", "reasoning": "Remotion video task detected"}
            elif any(keyword in msg_lower for keyword in ['github', 'push', 'commit']):
                return {"agent": "github", "reasoning": "GitHub task detected"}
            elif any(keyword in msg_lower for keyword in ['code', 'program', 'create file', 'modify', 'coding', 'implement', 'kode', 'koding']):
                return {"agent": "coder", "reasoning": "Coding task detected"}
            elif any(keyword in msg_lower for keyword in ['search', 'find', 'information', 'data', 'lookup', 'cari']):
                return {"agent": "searcher", "reasoning": "Search task detected"}
            elif any(keyword in msg_lower for keyword in ['analyze', 'structure', 'directory', 'files', 'analisa']):
                return {"agent": "analyzer", "reasoning": "Analysis task detected"}
            elif any(keyword in msg_lower for keyword in ['improve', 'fix', 'optimize', 'better', 'perbaiki']):
                return {"agent": "improver", "reasoning": "Improvement task detected"}
            elif any(keyword in msg_lower for keyword in ['plan', 'rencanakan', 'langkah', 'arsitektur']):
                return {"agent": "planner", "reasoning": "Planning task detected"}
            else:
                return {"agent": "general", "reasoning": "General task"}
class RemotionAgent(BaseAgent):
    """Agent untuk membuat video Remotion"""
    async def execute(self, task: str, working_dir: str, history: List[Dict[str, str]] = None) -> str:
        messages = (history or []) + [
            {"role": "system", "content": "Ekstrak prompt video dari permintaan pengguna. Hanya kembalikan teks prompt video tanpa tambahan kata-kata apapun."},
            {"role": "user", "content": task}
        ]
        video_prompt = await self.call_openai(messages)
        video_prompt = video_prompt.replace('"', '\"').strip()
        
        try:
            video_prompt = video_prompt.replace('"', '\\"').replace('\n', ' ').replace('\r', '')
            command = f'npx tsx run-ai-agent.ts "{video_prompt}"'
            
            loop = asyncio.get_event_loop()
            process = await loop.run_in_executor(
                None,
                lambda: subprocess.run(
                    command,
                    cwd=working_dir,
                    shell=True,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace'
                )
            )
            
            if process.returncode == 0:
                return f"✅ Berhasil membuat video Remotion!\n\nLog Output:\n{process.stdout}"
            else:
                return f"❌ Gagal membuat video Remotion.\n\nError:\n{process.stderr}\n\nLog:\n{process.stdout}"
        except Exception as e:
            import traceback
            err_details = traceback.format_exc()
            return f"❌ Error saat menjalankan skrip Remotion: {str(e)}\n\nDetails:\n{err_details}"

class GitHubAgent(BaseAgent):
    """Agent untuk push ke GitHub dan memicu rendering"""
    async def execute(self, task: str, working_dir: str, history: List[Dict[str, str]] = None) -> str:
        try:
            command = 'npx tsx push-to-github.ts'
            
            loop = asyncio.get_event_loop()
            process = await loop.run_in_executor(
                None,
                lambda: subprocess.run(
                    command,
                    cwd=working_dir,
                    shell=True,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace'
                )
            )
            
            if process.returncode == 0:
                return f"✅ Berhasil push ke GitHub! Proses rendering (GitHub Actions) seharusnya sudah berjalan.\n\nLog:\n{process.stdout}"
            else:
                return f"❌ Gagal push ke GitHub.\n\nError:\n{process.stderr}\n\nLog:\n{process.stdout}"
        except Exception as e:
            import traceback
            err_details = traceback.format_exc()
            return f"❌ Error saat menjalankan skrip GitHub: {str(e)}\n\nDetails:\n{err_details}"

class PlannerAgent(BaseAgent):
    """Agent untuk merencanakan tugas kompleks"""
    async def execute(self, task: str, working_dir: str, history: List[Dict[str, str]] = None) -> str:
        messages = (history or []) + [
            {"role": "system", "content": "Anda adalah Planner Agent. Tugas Anda adalah memecah permintaan kompleks dari pengguna menjadi langkah-langkah konkret (sub-tasks) untuk agen-agen lain (Coder, Remotion, GitHub, Searcher). Berikan rencana terstruktur."},
            {"role": "user", "content": task}
        ]
        return await self.call_openai(messages)
