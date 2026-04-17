import os
from openai import AsyncOpenAI
from app.core.config import settings

# Initialize client
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio file using OpenAI Whisper API.
    Supports formats like: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found at {file_path}")

    try:
        with open(file_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                response_format="text" # We just want the raw text for now
            )
        return transcript.strip()
    except Exception as e:
        print(f"Whisper API error: {e}")
        return f"[Transcription Failed]: {str(e)}"
