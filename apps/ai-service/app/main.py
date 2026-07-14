from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.ai import router as ai_router
import os

app = FastAPI(
    title="AI Healthcare Management Platform - AI Service",
    description="Microservice providing symptom checking, prescription OCR, medical document summarization, RAG chatbot, and Chest X-Ray classification.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to backend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ai_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "AI Microservice",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "symptom_checker": "ready",
            "prescription_ocr": "ready",
            "medical_chatbot": "ready",
            "xray_classifier": "ready",
            "report_summarizer": "ready"
        }
    }
