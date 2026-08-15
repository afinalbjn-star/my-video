# fastapi_app.py
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

# Templates
templates = Jinja2Templates(directory="templates")

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Data models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# Helper function to call OpenRouter API
async def call_openrouter(messages: list) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "openrouter/free",
        "messages": messages,
        "temperature": 0.7
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"

# Routes
@app.get("/", response_class=HTMLResponse)
async def read_root():
    return templates.TemplateResponse("index.html", {"request": {}})

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    messages = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": request.message}
    ]
    
    reply = await call_openrouter(messages)
    return ChatResponse(reply=reply)

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