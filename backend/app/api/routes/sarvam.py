from fastapi import APIRouter, UploadFile, File, HTTPException
from app.integrations.sarvam_client import sarvam_client

router = APIRouter()

@router.post("/translate-audio")
async def translate_audio(audio: UploadFile = File(...)):
    """
    Receives an audio file from the frontend and transcribes it into English using Sarvam AI.
    """
    try:
        translated_text = await sarvam_client.transcribe_and_translate_audio(audio)
        if not translated_text:
            raise HTTPException(status_code=500, detail="Transcription failed")
            
        return {
            "text": translated_text,
            "transcription": translated_text,
            "translated_text": translated_text
        }

    except Exception as e:
        print(f"Route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
