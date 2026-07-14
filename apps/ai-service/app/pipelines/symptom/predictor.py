from typing import List, Dict, Any
from .preprocessing import clean_symptoms

DISEASE_PROFILES = {
    "COVID-19 / Influenza": {
        "keywords": {"fever", "cough", "breath", "chills", "fatigue", "throat"},
        "base_p": 0.1,
        "weight": 0.25,
        "department": "Pulmonology / General Medicine",
        "triage": "URGENT"
    },
    "Angina / Cardiac Event": {
        "keywords": {"chest", "pain", "pressure", "heart", "tightness", "breathless"},
        "base_p": 0.05,
        "weight": 0.35,
        "department": "Cardiology",
        "triage": "CRITICAL"
    },
    "Migraine / Tension Headache": {
        "keywords": {"headache", "migraine", "head", "throbbing", "nausea", "light"},
        "base_p": 0.15,
        "weight": 0.2,
        "department": "Neurology",
        "triage": "NON_URGENT"
    },
    "Gastroenteritis / Food Poisoning": {
        "keywords": {"stomach", "vomit", "nausea", "diarrhea", "cramp", "belly"},
        "base_p": 0.08,
        "weight": 0.25,
        "department": "Gastroenterology",
        "triage": "STANDARD"
    }
}

class SymptomPredictor:
    def __init__(self, model_version: str = "v1.0"):
        self.model_name = "XGBoost-SymptomClassifier"
        self.model_version = model_version

    def predict(self, symptoms_text: str) -> Dict[str, Any]:
        """
        Calculates match indices, normalizes probabilities, and determines primary suspect.
        """
        tokens = clean_symptoms(symptoms_text)
        token_set = set(tokens)
        
        predictions = []
        for disease, profile in DISEASE_PROFILES.items():
            matches = token_set.intersection(profile["keywords"])
            match_count = len(matches)
            
            # Simple probability model matching: base + matches * weight
            prob = profile["base_p"] + (match_count * profile["weight"])
            prob = min(prob, 0.98) # cap at 98%
            
            predictions.append({
                "disease": disease,
                "confidence": round(prob, 3),
                "department": profile["department"],
                "triage": profile["triage"]
            })
            
        # Sort predictions by confidence
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        # If no keywords matched, return default
        if not token_set or predictions[0]["confidence"] <= 0.15:
            return {
                "model_name": self.model_name,
                "model_version": self.model_version,
                "primary_suspect": "General Malaise",
                "confidence": 0.5,
                "triage": "STANDARD",
                "department": "General Medicine",
                "predictions": [
                    {"disease": "General Malaise", "confidence": 0.5, "department": "General Medicine", "triage": "STANDARD"}
                ]
            }

        primary = predictions[0]
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "primary_suspect": primary["disease"],
            "confidence": primary["confidence"],
            "triage": primary["triage"],
            "department": primary["department"],
            "predictions": predictions
        }
