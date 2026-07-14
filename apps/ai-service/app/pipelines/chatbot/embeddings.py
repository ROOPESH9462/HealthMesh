import numpy as np
from typing import List, Dict, Any

# Mock medical database context blocks
MEDICAL_KNOWLEDGE_BASE = [
    {
        "topic": "Diabetes Management",
        "content": "For Type 2 diabetes management, fasting plasma glucose levels should target 80-130 mg/dL. HbA1c levels should typically remain below 7.0%. Exercise and a low-glycemic diet are primary recommendations."
    },
    {
        "topic": "Hypertension / Blood Pressure",
        "content": "Normal blood pressure targets are systolic below 120 mmHg and diastolic below 80 mmHg. Hypertension stage 1 is classified as 130-139 systolic or 80-89 diastolic. Lowering sodium and moderate exercise help reduce levels."
    },
    {
        "topic": "Cholesterol / Lipid limits",
        "content": "Optimal LDL cholesterol is below 100 mg/dL. HDL should ideally remain above 40 mg/dL for men and 50 mg/dL for women. Triglycerides should be kept below 150 mg/dL to maintain cardiac health."
    },
    {
        "topic": "Common cold and viral care",
        "content": "General care for viral influenza or colds includes adequate rest, high fluid intake, and over-the-counter antipyretics like paracetamol. Avoid prescribing antibiotics unless secondary bacterial infection is verified."
    }
]

class MedicalKBIndex:
    def __init__(self):
        # We can implement sentence-transformers loading here, but for sandboxed speeds and robust deployment
        # we configure keyword intersection matching to act as the embeddings retriever.
        pass

    def retrieve_context(self, query: str, top_k: int = 1) -> str:
        """
        Calculates simple jaccard intersection matches against document chunks.
        """
        words = set(query.lower().split())
        scored_docs = []
        
        for doc in MEDICAL_KNOWLEDGE_BASE:
            doc_words = set(doc["content"].lower().split())
            intersection = words.intersection(doc_words)
            score = len(intersection) / (len(words) + len(doc_words) - len(intersection) + 1e-5)
            scored_docs.append((score, doc["content"]))
            
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        # Concat top-k documents
        retrieved = [doc[1] for doc in scored_docs[:top_k] if doc[0] > 0.01]
        
        if not retrieved:
            # Return a default general warning context
            return "General medical guidance: Always consult a registered physician for direct diagnostic signs and critical prescription dosages."
            
        return " | ".join(retrieved)
