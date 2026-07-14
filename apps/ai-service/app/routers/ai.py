import json
from fastapi import APIRouter, UploadFile, File, Response, HTTPException
from fastapi.responses import StreamingResponse
import io

from ..schemas.ai import (
    SymptomCheckRequest, SymptomCheckResponse,
    ChatRequest, ChatResponse,
    SummarizeRequest, SummarizeResponse
)
from ..pipelines.symptom import SymptomPredictor, apply_recommendations
from ..pipelines.ocr import OCRExtractor, parse_prescription_text
from ..pipelines.summarizer import ReportSummarizer
from ..pipelines.chatbot import RAGChatbot
from ..pipelines.xray import XRayClassifier

router = APIRouter(prefix="/ai", tags=["AI Operations"])

# Initialize pipelines
symptom_predictor = SymptomPredictor()
ocr_extractor = OCRExtractor()
report_summarizer = ReportSummarizer()
chatbot = RAGChatbot()
xray_classifier = XRayClassifier()

@router.post("/symptom-check", response_model=SymptomCheckResponse)
async def check_symptoms(payload: SymptomCheckRequest):
    try:
        raw_pred = symptom_predictor.predict(payload.symptoms)
        final_pred = apply_recommendations(raw_pred)
        return final_pred
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat_bot(payload: ChatRequest):
    try:
        res = chatbot.generate_response(payload.query)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_report(payload: SummarizeRequest):
    try:
        res = report_summarizer.summarize(payload.document_text)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ocr")
async def scan_prescription(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_text = ocr_extractor.extract_text(content)
        parsed_data = parse_prescription_text(extracted_text)
        
        return {
            "model_name": ocr_extractor.model_name,
            "model_version": ocr_extractor.model_version,
            "extracted_text": extracted_text,
            "parsed": parsed_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/xray")
async def classify_xray(file: UploadFile = File(...)):
    try:
        content = await file.read()
        metadata, overlayed_bytes = xray_classifier.classify(content)
        
        # We return the overlayed image bytes and embed the metadata as a response header
        headers = {
            "X-Model-Prediction": json.dumps(metadata),
            "Access-Control-Expose-Headers": "X-Model-Prediction"
        }
        
        return Response(content=overlayed_bytes, media_type="image/jpeg", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
