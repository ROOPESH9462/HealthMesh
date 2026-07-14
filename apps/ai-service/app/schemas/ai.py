from pydantic import BaseModel
from typing import List, Dict, Any

class SymptomCheckRequest(BaseModel):
    symptoms: str

class DiseasePrediction(BaseModel):
    disease: str
    confidence: float
    department: str
    triage: str

class SymptomCheckResponse(BaseModel):
    model_name: str
    model_version: str
    primary_suspect: str
    confidence: float
    triage: str
    department: str
    predictions: List[DiseasePrediction]
    recommendations: List[str]

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    model_name: str
    model_version: str
    retrieved_context: str
    response: str
    confidence: float

class SummarizeRequest(BaseModel):
    document_text: str

class SummarizeResponse(BaseModel):
    model_name: str
    model_version: str
    summary: str
    abnormalitiesHighlighted: List[str]
    confidence: float
