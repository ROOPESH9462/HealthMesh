import re
from typing import List, Dict, Any

# Simple mock medicine matching database
MEDICINE_CATALOG = [
    "Paracetamol", "Amoxicillin", "Cetirizine", "Ibuprofen", 
    "Metformin", "Atorvastatin", "Amlodipine", "Omeprazole", 
    "Albuterol", "Lisinopril"
]

def parse_prescription_text(text: str) -> Dict[str, Any]:
    """
    Parse scanned text, matching drugs list, dosages, frequencies, and durations
    """
    medicines = []
    
    # Split text into lines to process line-by-line
    lines = text.split('\n')
    
    for line in lines:
        matched_drug = None
        # Check if line contains a catalog medicine
        for drug in MEDICINE_CATALOG:
            if re.search(r'\b' + re.escape(drug) + r'\b', line, re.IGNORECASE):
                matched_drug = drug
                break
                
        if matched_drug:
            # Extract strength/dosage e.g. "500mg"
            dosage_match = re.search(r'\b\d+\s*(?:mg|mcg|ml|g)\b', line, re.IGNORECASE)
            dosage = dosage_match.group(0) if dosage_match else "500mg"
            
            # Extract frequency e.g. "Twice a day", "Once a day", "3 times daily", "Thrice a day"
            frequency = "Once daily"
            if re.search(r'(?:twice|two times|2\s*x|bid)\b', line, re.IGNORECASE):
                frequency = "Twice a day"
            elif re.search(r'(?:thrice|three times|3\s*x|tid)\b', line, re.IGNORECASE):
                frequency = "Thrice a day"
            elif re.search(r'(?:four times|4\s*x|qid)\b', line, re.IGNORECASE):
                frequency = "4 times daily"
                
            # Extract duration e.g. "5 days", "1 week"
            duration_match = re.search(r'\b\d+\s*(?:days|weeks|months|day|week)\b', line, re.IGNORECASE)
            duration = duration_match.group(0) if duration_match else "5 days"
            
            medicines.append({
                "medicineName": matched_drug,
                "dosage": dosage,
                "frequency": frequency,
                "duration": duration
            })
            
    # Extract advice instructions
    instructions = "Keep hydrated and take complete rest"
    advice_match = re.search(r'(?:advice|note|instruction):\s*(.*)', text, re.IGNORECASE)
    if advice_match:
        instructions = advice_match.group(1).strip()
        
    return {
        "medicines": medicines,
        "instructions": instructions
    }
