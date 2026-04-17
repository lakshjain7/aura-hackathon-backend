from fastapi import APIRouter, Form, Response
from twilio.twiml.messaging_response import MessagingResponse
from app.agent.graph import aura_graph
from app.api.routes.sarvam import transcribe_and_translate_audio, translate_text
import httpx
import os

router = APIRouter()


# 🔹 Download audio from Twilio
async def download_audio(url: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        file_path = "temp.ogg"
        with open(file_path, "wb") as f:
            f.write(response.content)
    return file_path


@router.post("/twilio")
async def twilio_webhook(
    From: str = Form(...),
    Body: str = Form(None),
    MediaUrl0: str = Form(None)
):
    print(f"Incoming message from {From}: {Body}")

    try:
        # 🔥 STEP 1: Convert ALL input → English
        if MediaUrl0 and MediaUrl0.strip():
            print("Audio detected → Sarvam STT + Translate")
            file_path = await download_audio(MediaUrl0)
            processed_text = await transcribe_and_translate_audio(file_path)

            # cleanup
            if os.path.exists(file_path):
                os.remove(file_path)

        else:
            print("Text detected → Sarvam Translate")
            processed_text = await translate_text(Body) if Body else "No text provided"

        print("Final English Text:", processed_text)

        # 🔹 STEP 2: Send to AI
        initial_state = {
            "original_text": processed_text,
            "image_url": MediaUrl0,
            "source": "whatsapp",
            "sender_id": From,
            "history": [],
            "is_safe": True
        }

        # 🔹 STEP 3: AI processing
        final_state = await aura_graph.ainvoke(initial_state)

        # 🔹 STEP 4: Respond to user
        resp = MessagingResponse()

        if not final_state.get("is_safe"):
            resp.message(
                f"🚨 Security Alert: {final_state.get('rejection_reason')}"
            )
        else:
            category = final_state.get("category", "Grievance")
            severity = final_state.get("severity", "Medium")
            status = final_state.get("status", "assigned")

            resp.message(
                f"✅ Complaint registered\n"
                f"Category: {category}\n"
                f"Severity: {severity}\n"
                f"Status: {status}"
            )

        return Response(content=str(resp), media_type="application/xml")

    except Exception as e:
        print(f"Error in Twilio webhook: {e}")

        resp = MessagingResponse()
        resp.message("⚠️ AURA is facing an issue. Please try again later.")

        return Response(content=str(resp), media_type="application/xml")