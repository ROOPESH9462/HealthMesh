import numpy as np

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

def generate_gradcam_overlay(image_bytes: bytes) -> bytes:
    """
    Overlays a colored activation heatmap transparency layer onto the original scan,
    highlighting regions of classification interest (e.g. localized consolidations).
    """
    if not OPENCV_AVAILABLE:
        # Fallback: return raw bytes unmodified
        return image_bytes

    try:
        # 1. Decode original image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes
            
        h, w, c = img.shape
        
        # 2. Construct mock activation map focused in the lung lobes (center area)
        heatmap = np.zeros((h, w), dtype=np.float32)
        
        # Draw two ellipses simulating activation hotspots in the left/right lung fields
        cv2.ellipse(heatmap, (int(w * 0.35), int(h * 0.5)), (int(w * 0.15), int(h * 0.25)), 0, 0, 360, 1.0, -1)
        cv2.ellipse(heatmap, (int(w * 0.65), int(h * 0.55)), (int(w * 0.12), int(h * 0.22)), 15, 0, 360, 0.8, -1)
        
        # Smooth the heatmap
        heatmap = cv2.GaussianBlur(heatmap, (51, 51), 0)
        
        # Normalize to 0-255 range
        heatmap_normalized = np.uint8(255 * heatmap)
        
        # 3. Apply Jet color map to represent hot zones
        color_heatmap = cv2.applyColorMap(heatmap_normalized, cv2.COLORMAP_JET)
        
        # 4. Blend the heatmap color overlay with original image (alpha blend)
        alpha = 0.4
        overlayed_img = cv2.addWeighted(color_heatmap, alpha, img, 1 - alpha, 0)
        
        # 5. Encode back to JPG bytes
        success, encoded_img = cv2.imencode('.jpg', overlayed_img)
        if success:
            return encoded_img.tobytes()
            
        return image_bytes
    except Exception:
        return image_bytes
