from fastapi import APIRouter, Form, Response
from twilio.twiml.messaging_response import MessagingResponse
from app.agent.graph import aura_graph

router = APIRouter()

@router.post("/twilio")
async def twilio_webhook(
    From: str = Form(...),
    Body: str = Form(None),
    MediaUrl0: str = Form(None)
):
    """
    Twilio Webhook for WhatsApp/SMS.
    Triggers the AURA LangGraph orchestrator.
    """
    print(f"Incoming message from {From}: {Body}")
    
    # 1. Prepare Initial State
    initial_state = {
        "original_text": Body if Body else "",
        "image_url": MediaUrl0, # Could be image or audio (.ogg)
        "source": "whatsapp",
        "sender_id": From,
        "history": [],
        "is_safe": True
    }
    
    # 2. Invoke Graph
    try:
        final_state = await aura_graph.ainvoke(initial_state)
        
        # 3. Formulate Response
        resp = MessagingResponse()
        if not final_state.get("is_safe"):
            resp.message(f"🚨 Security Alert: Your message was flagged. Reason: {final_state.get('rejection_reason')}")
        else:
            category = final_state.get("category", "Grievance")
            severity = final_state.get("severity", "Medium")
            resp.message(f"✅ AURA has logged your {category} complaint (Severity: {severity}). Status: {final_state.get('status', 'assigned')}")
            
        return Response(content=str(resp), media_type="application/xml")
        
    except Exception as e:
        print(f"Graph execution error: {e}")
        resp = MessagingResponse()
        resp.message("⚠️ Sorry, AURA is currently undergoing maintenance. Please try again in a few minutes.")
        return Response(content=str(resp), media_type="application/xml")
