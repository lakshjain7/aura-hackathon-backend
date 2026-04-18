import requests
import openai
from app.core.config import settings

class SarvamClient:
    def __init__(self, api_key: str, openai_key: str):
        self.api_key = api_key
        self.openai_client = openai.OpenAI(api_key=openai_key)
        self.base_url = "https://api.sarvam.ai"

    async def transcribe_and_translate_audio(self, audio_path: str):
        """
        Sends audio to Sarvam AI with a fallback to OpenAI Whisper.
        Accepts a local file path.
        """
        import os
        filename = os.path.basename(audio_path)
        
        print("\n" + "="*50)
        print(f"🎙️  VOICE PROCESSING START: {filename}")
        print("="*50)

        # Try Sarvam AI first (Great for Indian Languages)
        url = f"{self.base_url}/speech-to-text"
        headers = {"api-subscription-key": self.api_key}
        
        try:
            print(f"📡 Requesting Sarvam AI (saaras:v3)...")
            with open(audio_path, 'rb') as f:
                files = {'file': (filename, f, 'audio/ogg')}
                data = {'model': 'saaras:v3', 'language_code': 'unknown'}
                response = requests.post(url, headers=headers, files=files, data=data, timeout=12)
            
            if response.status_code == 200:
                transcript = response.json().get("transcript", "")
                print(f"✅ SARVAM SUCCESS: \"{transcript}\"")
                print("="*50 + "\n")
                return transcript
            else:
                print(f"❌ SARVAM FAILED: Status {response.status_code} - {response.text}")
        except Exception as e:
            print(f"⚠️ SARVAM CONNECTION ERROR: {e}")

        # --- FALLBACK: OpenAI Whisper ---
        try:
            print("🔄 FALLING BACK: Requesting OpenAI Whisper...")
            with open(audio_path, 'rb') as f:
                transcript = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=(filename, f)
                )
            print(f"✅ WHISPER SUCCESS: \"{transcript.text}\"")
            print("="*50 + "\n")
            return transcript.text
        except Exception as whisper_err:
            print(f"🚨 ALL TRANSCRIPTION METHODS FAILED: {whisper_err}")
            print("="*50 + "\n")
            return f"[Audio Message: Transcription Failed - {whisper_err}]"

# Singleton
sarvam_client = SarvamClient(
    api_key=settings.SARVAM_API_KEY,
    openai_key=settings.OPENAI_API_KEY
)

async def transcribe_and_translate_audio(audio_path: str):
    return await sarvam_client.transcribe_and_translate_audio(audio_path)

