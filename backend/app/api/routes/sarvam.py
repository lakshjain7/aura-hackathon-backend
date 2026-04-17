from fastapi import APIRouter
from pydantic import BaseModel
from app.integrations.sarvam_client import transcribe_and_translate_audio

router = APIRouter()

class TranslateRequest(BaseModel):
    file_path: str
    
@router.post("/translate-audio")
async def translate_text(req: TranslateRequest):
    """
    Test endpoint for Sarvam AI audio translation.
    """
    try:
        translated = await transcribe_and_translate_audio(req.file_path)
        return {"translated_text": translated}
    except Exception as e:
        return {"error": str(e)}
