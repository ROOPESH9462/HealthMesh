from typing import Dict, Any

def apply_recommendations(prediction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format recommendations based on triage classification levels
    """
    triage = prediction.get("triage", "STANDARD")
    
    recommendations = []
    if triage == "CRITICAL":
        recommendations = [
            "IMMEDIATE ACTION REQUIRED: Seek emergency medical care immediately.",
            "Do not drive yourself. Call local emergency services (e.g. 112 / 911).",
            "Rest quiet and avoid physical exertion until responders arrive."
        ]
    elif triage == "URGENT":
        recommendations = [
            "Schedule an urgent consultation with our general clinic or specialist.",
            "Monitor body temperatures and hydration frequently.",
            "Isolate if experiencing viral infection symptoms (cough/fever)."
        ]
    elif triage == "STANDARD":
        recommendations = [
            "Rest and consult a physician at your earliest convenience.",
            "Keep logs of symptom occurrences and updates.",
            "OTC medications may alleviate symptoms temporarily."
        ]
    else: # NON_URGENT
        recommendations = [
            "Monitor symptoms. If they persist beyond 48 hours, schedule general clinic slot.",
            "Ensure regular sleep hygiene and hydration."
        ]
        
    prediction["recommendations"] = recommendations
    return prediction
