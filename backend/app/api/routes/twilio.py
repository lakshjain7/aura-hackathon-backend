from fastapi import APIRouter, Form, Response
from twilio.twiml.messaging_response import MessagingResponse
from app.agent.graph import aura_graph
from sqlalchemy import text

router = APIRouter()

@router.post("/twilio")
async def twilio_webhook(
    From: str = Form(...),
    Body: str = Form(None),
    MediaUrl0: str = Form(None),
    MediaContentType0: str = Form(None)
):
    """
    Twilio Webhook for WhatsApp/SMS.
    Triggers the AURA LangGraph orchestrator with support for Audio and Images.
    """
    print(f"Incoming message from {From}: {Body} (Media: {MediaContentType0})")
    
    clean_body = Body.strip().lower() if Body else ""
    
    from app.core.database import AsyncSessionLocal
    from app.models.complaint import Complaint
    from app.models.user import User
    from sqlalchemy import select, or_, text
    from datetime import datetime
    from app.core.config import settings

    import os
    import httpx
    from app.services.twilio_service import send_whatsapp_update
    from app.agent.graph import aura_graph
    from app.integrations.sarvam_client import transcribe_and_translate_audio

    # 1. Capture Media & Context
    media_url = MediaUrl0
    media_type = MediaContentType0 if MediaContentType0 else ""
    
    # NEW: Internal Audio Transcription for ALL flows (Proxy/Command/Graph)
    audio_url = None
    if media_url and ("audio" in media_type or any(ext in media_url.lower() for ext in [".ogg", ".mp3", ".wav"])):
        audio_url = media_url
        print(f"🎤 Detected voice message. Transcribing internally...")
        try:
            temp_dir = os.path.join(os.getcwd(), "temp")
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, f"audio_{int(datetime.now().timestamp())}.ogg")
            
            async with httpx.AsyncClient() as client:
                # Twilio Media URLs require Basic Auth (SID:Token)
                auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                resp_audio = await client.get(audio_url, auth=auth, follow_redirects=True)

                if resp_audio.status_code == 200:
                    with open(temp_path, "wb") as f:
                        f.write(resp_audio.content)
                    transcript = await transcribe_and_translate_audio(temp_path)
                    if transcript:
                        Body = transcript
                        print(f"📝 Transcription: {Body}")
                else:
                    print(f"❌ Failed to download audio: {resp_audio.status_code}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            print(f"❌ Internal transcription error: {e}")

    # RE-CALCULATE clean_body after potential transcription
    clean_body = Body.strip().lower() if Body else ""

    # 1. IDENTITY & COMMAND/PROXY CHECK (Short-lived Session)

    user_role = "citizen"
    user_name = "User"
    user_id = None
    
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.contact_id == From))
        user = res.scalar_one_or_none()
        if user:
            user_role = user.role
            user_name = user.name
            user_id = user.id

            
            # A. Check for Commands (Officers Only)
            if clean_body.startswith(("!", "accept", "resolved")):
                if user_role != "officer":
                    resp = MessagingResponse()
                    resp.message("⚠️ *Access Denied:* Only registered AURA Officers can use commands. If you are reporting an issue, please send your message normally without the '!' prefix.")
                    return Response(content=str(resp), media_type="application/xml")
                
                # Process Officer Command
                if clean_body.startswith(("accept", "!accept", "resolved")):
                    parts = clean_body.split()
                    if len(parts) >= 2:
                        ticket_id = parts[-1] 
                        complaint = await session.get(Complaint, ticket_id)
                        if complaint:
                            if "accept" in clean_body:
                                complaint.status = "in_progress"
                                complaint.officer_id = user_id
                                msg = f"👷 **Accepted!** You are now connected to the citizen. Type anything to chat."
                                status_msg = f"🌟 **Great News!** Officer {user_name} has accepted your grievance."
                            else: # Resolved
                                complaint.status = "resolved"
                                complaint.resolved_at = datetime.utcnow()
                                user.points += 50
                                msg = f"✅ **Resolved!** 50 Points added!"
                                status_msg = f"✨ **Issue Resolved!** Thank you for your patience."
                            
                            await session.commit()
                            await session.refresh(complaint, ["citizen"])
                            if complaint.citizen and complaint.citizen.contact_id != From:
                                send_whatsapp_update(complaint.citizen.contact_id, status_msg)
                            
                            resp = MessagingResponse()
                            resp.message(msg)
                            return Response(content=str(resp), media_type="application/xml")
                        else:
                            resp = MessagingResponse()
                            resp.message("❌ Please provide a Ticket ID: `!accept <id>`")
                            return Response(content=str(resp), media_type="application/xml")

            # A2. Citizen Command: !done (To resolve their own ticket)
            if clean_body == "!done" or clean_body == "!resolved":
                active_res = await session.execute(
                    select(Complaint).where(
                        Complaint.citizen_id == user_id,
                        Complaint.status == "in_progress"
                    )
                )
                active_ticket = active_res.scalars().first()
                if active_ticket:
                    active_ticket.status = "resolved"
                    active_ticket.resolved_at = datetime.utcnow()
                    user.points += 20
                    await session.commit()
                    
                    resp = MessagingResponse()
                    resp.message("✅ **Ticket Closed!** You've earned 20 AURA Points. You can now report a new issue.")
                    return Response(content=str(resp), media_type="application/xml")

            # B. Check for Proxy Chat (Active Ticket)
            # Only enter proxy chat if it's NOT a new report (heuristic: doesn't contain a 6-digit pincode)
            import re
            has_pincode = re.search(r'\b\d{6}\b', Body) if Body else False
            
            active_res = await session.execute(
                select(Complaint).where(
                    or_(Complaint.citizen_id == user_id, Complaint.officer_id == user_id),
                    Complaint.status == "in_progress"
                ).order_by(Complaint.created_at.desc())
            )
            active_ticket = active_res.scalars().first()
            if active_ticket and not has_pincode:
                await session.refresh(active_ticket, ["citizen", "officer"])
                other_user = active_ticket.officer if user_role == "citizen" else active_ticket.citizen
                if other_user and other_user.contact_id and other_user.contact_id != From:
                    prefix = "👤 *Citizen:*" if user_role == "citizen" else "👷 *Officer:*"
                    send_whatsapp_update(other_user.contact_id, f"{prefix} {Body}")
                    resp = MessagingResponse()
                    resp.message("✅ *Delivered*")
                    return Response(content=str(resp), media_type="application/xml")


    # 2. CITIZEN FLOW (Graph Invocations - NO SESSION OPEN)
    # Detect Media Type
    image_url = MediaUrl0 if MediaContentType0 and "image" in MediaContentType0 else None
    audio_url = MediaUrl0 if MediaContentType0 and "audio" in MediaContentType0 else None
    
    # Handle case where extension might be in URL but MediaContentType0 is missing
    if MediaUrl0 and not MediaContentType0:
        if any(ext in MediaUrl0.lower() for ext in [".png", ".jpg", ".jpeg"]):
            image_url = MediaUrl0
        elif any(ext in MediaUrl0.lower() for ext in [".ogg", ".mp3", ".wav"]):
            audio_url = MediaUrl0

    initial_state = {
        "original_text": Body if Body else "",
        "image_url": image_url,
        "audio_url": audio_url,
        "source": "whatsapp",
        "sender_id": From,
        "history": [],
        "is_safe": True
    }
    
    try:
        print(f"AURA starting graph for {From}...")
        final_state = await aura_graph.ainvoke(initial_state)
        
        resp = MessagingResponse()
        if not final_state.get("is_safe"):
            resp.message(f"🚨 **Security Alert:** Your message was flagged as potentially unsafe.\nReason: {final_state.get('rejection_reason')}")
            return Response(content=str(resp), media_type="application/xml")
        else:
            category = final_state.get("category", "General")
            severity = final_state.get("severity", "Low")
            ticket_id = final_state.get("complaint_id", "N/A")
            pincode = final_state.get("pincode", "Unknown")
            is_duplicate = final_state.get("is_duplicate", False)
            missing_info = final_state.get("missing_info", False)

            if missing_info:
                missing_items = []
                if not pincode or pincode == "Unknown": missing_items.append("📍 **Your Pincode**")
                if not image_url: missing_items.append("📸 **An Image** for verification")
                
                msg = (
                    "👋 **AURA is ready to help!**\n\n"
                    "To log this grievance properly, I still need:\n" + 
                    "\n".join(missing_items) + 
                    "\n\nPlease reply with these details! 🛰️"
                )

            elif is_duplicate:
                msg = (
                    f"🤝 **AURA Community Note:** Other neighbors in `{pincode}` have already reported this {category} issue!\n\n"
                    f"🎫 **Your report has been linked to Ticket:** {ticket_id}\n"
                    f"📈 **Impact Escalated:** We've increased the priority of this case due to multiple reports. "
                    "Our team is already on it! 👷🦾"
                )
            else:
                # Personalized Success Message
                msg = (
                    f"✅ **AURA has logged your {category} complaint.**\n"
                    f"🎫 **Ticket ID:** {ticket_id}\n"
                    f"🔴 **Severity:** {severity}\n\n"
                    f"Our AI has routed this to the {final_state.get('department', 'General Administration')}. "
                    f"You will receive an update as soon as an officer accepts the case."
                )
            
            # Community Group Link
            PINCODE_GROUPS = {
                "500033": "https://chat.whatsapp.com/I0vSfFlj2luDBPLMbcvEe3",
                "500001": "https://chat.whatsapp.com/EpT93gyXWYB0vBSEQRV8vr",
                "500012": "https://chat.whatsapp.com/I0vSfFlj2luDBPLMbcvEe3", # Added Nampally
                "560001": "https://chat.whatsapp.com/Jy5KyRO3igjEL7W54UUjVT"
            }
            if str(pincode) in PINCODE_GROUPS and not missing_info:
                msg += f"\n\n👥 **Join your Local Community Group ({pincode}):**\n{PINCODE_GROUPS[str(pincode)]}"
            
            # Add media confirmation if present
            if image_url and not missing_info:
                msg += "\n\n📸 *Image proof attached to ticket.*"
            if audio_url and not missing_info:
                msg += "\n\n🎤 *Voice note transcribed and added.*"

            # Final Console Logging
            print(f"✅ SUCCESS: Processed {category} for {From} (Ticket: {ticket_id})")



            resp.message(msg)
            return Response(content=str(resp), media_type="application/xml")
            
    except Exception as e:
        print(f"AURA Webhook Error: {e}")
        resp = MessagingResponse()
        resp.message("⚠️ Sorry, AURA is experiencing high traffic. We've logged your issue, but confirmation might be delayed.")
        return Response(content=str(resp), media_type="application/xml")

