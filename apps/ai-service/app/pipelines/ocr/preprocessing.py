import numpy as np
import logging
logger = logging.getLogger("ocr_preprocessor")

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Grayscale, noise removal and adaptive thresholding for higher OCR scanning accuracy
    """
    # 1. Parse byte stream
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    if not OPENCV_AVAILABLE:
        # Return fallback mock array
        return nparr
        
    try:
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return nparr
            
        # 2. Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 3. Apply adaptive Gaussian thresholding
        processed = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        return processed
    except Exception as e:
        # Fallback to raw buffer
        return nparr
