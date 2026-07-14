from typing import Dict, Any
from .embeddings import MedicalKBIndex

class RAGChatbot:
    def __init__(self):
        self.model_name = "BioGPT-RAG-Chatbot"
        self.model_version = "v2.5.1"
        self.kb_index = MedicalKBIndex()

    def generate_response(self, user_query: str) -> Dict[str, Any]:
        """
        Retrieves top relevant medical guidelines from knowledge base index, builds context,
        and generates response output.
        """
        # 1. Retrieve context
        context = self.kb_index.retrieve_context(user_query, top_k=1)
        
        # 2. Build answer based on context matching (simulating prompt completions)
        query_l = user_query.lower()
        
        response = ""
        if "diabetes" in query_l or "sugar" in query_l:
            response = (
                "Based on clinical guidelines for Type 2 diabetes management, you should target fasting glucose "
                "levels of 80-130 mg/dL and maintain HbA1c below 7.0%. Low-glycemic diet and moderate exercise "
                "are recommended daily practices."
            )
        elif "blood pressure" in query_l or "hypertension" in query_l:
            response = (
                "According to cardiology standards, normal blood pressure targets are below 120/80 mmHg. "
                "Stages of hypertension are classified from 130-139 systolic. Reducing sodium intake, avoiding "
                "smoking, and regular cardiovascular exercise help reduce levels."
            )
        elif "cholesterol" in query_l or "lipid" in query_l:
            response = (
                "To maintain cardiac health, LDL cholesterol should ideally be kept below 100 mg/dL, HDL "
                "above 40-50 mg/dL, and Triglycerides under 150 mg/dL. Consider monitoring cardiovascular markers."
            )
        elif "cold" in query_l or "flu" in query_l or "fever" in query_l:
            response = (
                "For mild colds and influenza symptoms, rest, high fluid intake, and over-the-counter antipyretics "
                "like paracetamol are standard care. Antibiotics do not treat viral infections and should be avoided."
            )
        else:
            response = (
                "I've searched our medical knowledge base. For general health support, ensure balanced nutrition, "
                "proper sleep cycles, and daily hydration. For specific symptoms, please schedule an appointment "
                "with our doctors."
            )
            
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "retrieved_context": context,
            "response": response,
            "confidence": 0.90
        }
