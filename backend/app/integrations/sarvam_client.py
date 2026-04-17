import os
import httpx
from app.core.config import settings

SARVAM_URL = "https://api.sarvam.ai/speech-to-text-translate"

async def transcribe_and_translate_audio(file_path: str) -> str:
    """
    Transcribes and translates an Indic audio file into English using Sarvam AI.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found at {file_path}")

    # Sarvam expects a POST request with the file
    headers = {
        "api-subscription-key": settings.SARVAM_API_KEY
    }
    
    # You can specify a prompt if needed, but we'll stick to the default payload
    data = {
        "model": "saaras:v1" 
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(file_path, "rb") as audio_file:
                files = {
                    "file": (os.path.basename(file_path), audio_file, "audio/mpeg")
                }
                response = await client.post(
                    SARVAM_URL, 
                    headers=headers, 
                    data=data, 
                    files=files
                )
                
            if response.status_code == 200:
                result = response.json()
                # The response structure usually contains a 'transcript' or similar key
                return result.get("transcript", result.get("text", str(result)))
            else:
                print(f"Sarvam API error {response.status_code}: {response.text}")
                return f"[Transcription Failed]: {response.text}"
                
    except Exception as e:
        print(f"Error calling Sarvam API: {e}")
        return f"[Transcription Failed]: {str(e)}"
