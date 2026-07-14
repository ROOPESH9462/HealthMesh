import uvicorn
import os
from dotenv import load_dotenv

# Load workspace environment variables
load_dotenv(dotenv_path="../../.env")

if __name__ == "__main__":
    host = os.getenv("AI_HOST", "0.0.0.0")
    port = int(os.getenv("AI_PORT", "8000"))
    env = os.getenv("AI_ENV", "development")
    
    print(f"Starting AI service on {host}:{port} in {env} mode...")
    uvicorn.run("app.main:app", host=host, port=port, reload=(env == "development"))
