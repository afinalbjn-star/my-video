# fastapi_app_multi.py
# FastAPI backend dengan Multi-Agent System
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import os
import shutil
import aiofiles
from docx import Document
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import requests
from typing import Optional
from multi_agent_system import MultiAgentSystem
from model_router import get_router, ALL_MODELS

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "ganti_dengan_kunci_api_openrouter_anda")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Router model gratis dengan auto-failover
router = get_router(OPENROUTER_API_KEY)

# Initialize Multi-Agent System
multi_agent_system = MultiAgentSystem(OPENROUTER_API_KEY)

# Templates
templates = Jinja2Templates(directory="templates")

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Data models
class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = []
    model: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    model_used: Optional[str] = None

# Helper function to call OpenRouter API (dengan auto-failover)
async def call_openrouter(messages: list) -> str:
    result = router.call(messages)
    return result["content"]

# Routes
@app.get("/", response_class=HTMLResponse)
async def read_root():
    return templates.TemplateResponse("index.html", {"request": {}})

@app.get("/api/models")
async def list_models():
    """Daftar model gratis + status cooldown/limit tiap model."""
    return {
        "default": multi_agent_system.preferred_model or "openrouter/free",
        "models": router.list_models(),
        "auto_failover": True,
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Set model pilihan user (opsional); router akan auto-failover ke model lain
    # jika model pilihan kena limit kuota.
    preferred = request.model or None
    if preferred and not any(m["id"] == preferred for m in ALL_MODELS):
        preferred = None
    try:
        reply = await multi_agent_system.process_request(request.message, request.history, preferred)
        return ChatResponse(reply=reply, model_used=multi_agent_system.last_model_used)
    except Exception as e:
        # Fallback ke simple chat jika multi-agent gagal
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": request.message}
        ]
        
        reply = await call_openrouter(messages)
        return ChatResponse(reply=reply, model_used=multi_agent_system.last_model_used)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate file type
    allowed_extensions = {".pdf", ".txt", ".docx"}
    file_suffix = os.path.splitext(file.filename)[1].lower()
    
    if file_suffix not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, TXT, and DOCX are allowed.")
    
    # Save file
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        async with aiofiles.open(file_location, "wb") as buffer:
            content = await file.read()
            await buffer.write(content)
        
        # Extract text from document
        extracted_text = ""
        if file_suffix == ".pdf":
            extracted_text = extract_text_from_pdf(file_location)
        elif file_suffix == ".docx":
            extracted_text = extract_text_from_docx(file_location)
        elif file_suffix == ".txt":
            async with aiofiles.open(file_location, "r") as f:
                extracted_text = await f.read()
        
        return {
            "filename": file.filename,
            "message": "File uploaded successfully",
            "extracted_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_location = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_location):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_location)

@app.get("/uploads")
async def list_uploads():
    files = os.listdir(UPLOAD_DIR)
    return {"files": files}

# Agent-specific endpoints
@app.post("/agent/coder")
async def coder_agent(request: ChatRequest):
    """Direct access to Coder Agent with enhanced file operations"""
    multi_agent_system.agents['coder'].preferred_model = request.model or None
    try:
        result = await multi_agent_system.agents['coder'].execute(
            request.message, 
            multi_agent_system.working_directory
        )
        return {"reply": result}
    except Exception as e:
        # Fallback: manual code generation
        try:
            messages = [
                {
                    "role": "system",
                    "content": f"You are an expert programmer. Generate working code based on the user's request. Working directory: {multi_agent_system.working_directory}"
                },
                {
                    "role": "user", 
                    "content": request.message
                }
            ]
            
            code = await call_openrouter(messages)
            
            return {
                "reply": f"Generated code:\n\n{code}\n\n(Note: File operations require proper file path specification. Please specify the full file path for execution.)"
            }
        except Exception as fallback_error:
            raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/agent/searcher")
async def searcher_agent(request: ChatRequest):
    """Direct access to Searcher Agent"""
    multi_agent_system.agents['searcher'].preferred_model = request.model or None
    try:
        result = await multi_agent_system.agents['searcher'].execute(request.message)
        return {"reply": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/analyzer")
async def analyzer_agent(request: ChatRequest):
    """Direct access to Analyzer Agent"""
    multi_agent_system.agents['analyzer'].preferred_model = request.model or None
    try:
        result = await multi_agent_system.agents['analyzer'].execute(
            request.message,
            multi_agent_system.working_directory
        )
        return {"reply": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/improver")
async def improver_agent(request: ChatRequest):
    """Direct access to Self-Improvement Agent"""
    multi_agent_system.agents['improver'].preferred_model = request.model or None
    try:
        result = await multi_agent_system.agents['improver'].execute(
            request.message,
            multi_agent_system.working_directory
        )
        return {"reply": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def extract_text_from_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"

def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        return f"Error extracting text from DOCX: {str(e)}"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)