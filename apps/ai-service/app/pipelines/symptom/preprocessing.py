import re
from typing import List

def clean_symptoms(symptoms_text: str) -> List[str]:
    """
    Sanitize, lowercase, and tokenize symptoms list
    """
    if not symptoms_text:
        return []
    
    # Lowercase and split by punctuation/spaces
    text = symptoms_text.lower().strip()
    words = re.split(r'[\s,;.!?]+', text)
    
    # Filter empty items and common stop words
    stop_words = {'i', 'have', 'feel', 'with', 'a', 'the', 'and', 'my', 'is', 'in', 'of'}
    tokens = [w for w in words if w and w not in stop_words]
    
    return tokens
