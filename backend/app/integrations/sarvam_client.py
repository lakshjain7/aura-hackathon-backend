import os
import httpx
from app.core.config import settings

SARVAM_URL = "https://api.sarvam.ai/v1/speech-to-text"

async def transcribe_and_translate_audio(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found at {file_path}")

    headers = {
        "Authorization": f"Bearer {settings.SARVAM_API_KEY}"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(file_path, "rb") as audio_file:
                files = {
                    "file": (
                        os.path.basename(file_path),
                        audio_file,
                        "audio/ogg"
                    )
                }

                response = await client.post(
                    SARVAM_URL,
                    headers=headers,
                    files=files
                )

        if response.status_code == 200:
            result = response.json()

            return (
                result.get("transcript") or
                result.get("text") or
                result.get("data", {}).get("text") or
                str(result)
            )
        else:
            print(f"Sarvam API error {response.status_code}: {response.text}")
            return ""

    except Exception as e:
        print(f"Error calling Sarvam API: {e}")
        return ""