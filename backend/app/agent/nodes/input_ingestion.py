import os
import httpx
from datetime import datetime
from app.agent.state import AgentState
from app.security.pii_stripper import strip_pii
from app.integrations.sarvam_client import transcribe_and_translate_audio

async def input_ingestion(state: AgentState) -> AgentState:
    """
    First node in the LangGraph.
    Handles multimodal extraction, PII stripping, and basic sanitization.
    """
    node_name = "input_ingestion"
    print(f"--- Entering Node: {node_name} ---")
    
    raw_text = state.get("original_text", "")
    image_url = state.get("image_url")
    source = state.get("source", "unknown")
    
    # 1. Handle Audio Ingestion (Multimodal)
    # Check if this message is suspected to be a voice note
    # For WhatsApp via Twilio, voice notes have a .ogg URL in the MediaUrl0 field
    is_audio = False
    if image_url and any(ext in image_url.lower() for ext in [".ogg", ".mp3", ".wav", ".m4a"]):
        is_audio = True

    if is_audio:
        print(f"Detected audio input from {source}. Transcribing...")
        # Download audio to temp
        temp_dir = os.path.join(os.getcwd(), "temp")
        os.makedirs(temp_dir, exist_ok=True)
        filename = f"audio_{int(datetime.now().timestamp())}.ogg"
        temp_path = os.path.join(temp_dir, filename)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                if response.status_code == 200:
                    with open(temp_path, "wb") as f:
                        f.write(response.content)
                    
                    # Transcribe and Translate using Sarvam API
                    transcribed_text = await transcribe_and_translate_audio(temp_path)
                    raw_text = transcribed_text
                    print(f"Transcription successful: {raw_text[:50]}...")
                else:
                    print(f"Failed to download audio: {response.status_code}")
        except Exception as e:
            print(f"Error processing audio ingestion: {e}")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    # 2. PII Stripping (DPDP Act Compliance)
    # Always strip PII from the text before any LLM sees it
    anonymised_text, entities = strip_pii(raw_text)
    
    # 3. Update State
    return {
        **state,
        "translated_text": anonymised_text, # Initialize translated_text with anonymized English (or current lang)
        "current_node": node_name,
        "history": state.get("history", []) + [f"Input ingested from {source}. Multimodal: {is_audio}. PII Stripped."]
    }
