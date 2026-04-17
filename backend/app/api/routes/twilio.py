from fastapi import APIRouter, Request, Form
from typing import Optional

router = APIRouter()

@router.post("/twilio")
async def twilio_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    MediaUrl0: Optional[str] = Form(None)
):
    """
    Twilio Webhook for incoming WhatsApp/SMS messages.
    """
    # 1. Parse incoming payload
    sender = From
    text = Body
    image_url = MediaUrl0
    
    # 2. Trigger LangGraph Orchestrator here
    # Placeholder for graph invocation
    print(f"Received from {sender}: {text} | Image: {image_url}")
    
    # Need to return TwiML or a simple response
    return {"status": "received", "message": "Grievance ingested successfully."}
