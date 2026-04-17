from fastapi import APIRouter
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

if not SARVAM_API_KEY:
    raise ValueError("SARVAM_API_KEY is not set")


# 🔹 Request model (for testing)
class TranslateRequest(BaseModel):
    file_path: str


# 🔹 AUDIO → TEXT → ENGLISH
async def transcribe_and_translate_audio(file_path: str):
    url = "https://api.sarvam.ai/v1/speech-to-text"

    headers = {
        "Authorization": f"Bearer {SARVAM_API_KEY}"
    }

    try:
        with open(file_path, "rb") as f:
            files = {"file": f}

            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, files=files)
                data = response.json()

        return data.get("text", "")

    except Exception as e:
        print("Sarvam audio error:", e)
        return ""


# 🔹 TEXT → ENGLISH TRANSLATION
async def translate_text(text: str):
    url = "https://api.sarvam.ai/v1/translate"

    headers = {
        "Authorization": f"Bearer {SARVAM_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "input": text,
        "source_language": "auto",
        "target_language": "en"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            data = response.json()

        return data.get("translated_text", text)

    except Exception as e:
        print("Sarvam text error:", e)
        return text


# 🔹 TEST ENDPOINT (optional)
@router.post("/translate-audio")
async def translate_audio(req: TranslateRequest):
    try:
        translated = await transcribe_and_translate_audio(req.file_path)
        return {"translated_text": translated}
    except Exception as e:
        return {"error": str(e)}