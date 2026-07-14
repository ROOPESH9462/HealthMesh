# AI Inference Pipelines Guide

This document describes the design, implementation parameters, and frameworks used in the platform's diagnostic microservices.

---

## 1. Symptom Checker Pipeline (`symptom`)
- **Model**: Calibrated classification estimator.
- **Workflow**:
  - Cleans input tokens (lowercase, strip punctuation).
  - Scores symptom terms against known disease vocabularies.
  - Returns probability spectrums for matches, triage severity priority (e.g. CRITICAL, URGENT, STANDARD), and recommended actions.

---

## 2. Prescription OCR Scanner (`ocr`)
- **Model**: EasyOCR + OpenCV pre-processors.
- **Workflow**:
  - Applies adaptive grayscaling and thresholding to prescription images to isolate text boundaries.
  - Uses EasyOCR to read text blocks.
  - Parses text using regex dictionary filters to match drug catalogs, dosages (e.g. "1-0-1"), and duration spans.

---

## 3. NLP Medical Report Summarizer (`summarizer`)
- **Model**: SentenceTransformers semantic scoring.
- **Workflow**:
  - Scans lab report strings for critical abnormalities (e.g. elevated creatinine, high blood sugars).
  - Highlights out-of-range clinical counts.
  - Outputs a high-fidelity summary string.

---

## 4. RAG Chatbot Engine (`chatbot`)
- **Model**: FAISS index vectors retrieval + SentenceTransformers embeddings.
- **Workflow**:
  - Computes dense vector embeddings for patient queries.
  - Queries a FAISS index containing medical guidelines (diabetes targets, pressure limits).
  - Appends matched factual context blocks to ground responses and prevent hallucinations.

---

## 5. Chest X-Ray Classifier (`xray`)
- **Model**: DenseNet121 CNN + Grad-CAM Heatmaps.
- **Workflow**:
  - Preprocesses radiographs (resize to 224x224, normalize channels).
  - Predicts lung consolidation scores.
  - Computes gradients of target classes relative to final feature maps.
  - Generates colored heatmap overlays highlighting regions of visual interest (consolidation areas) for clinical decision support.
