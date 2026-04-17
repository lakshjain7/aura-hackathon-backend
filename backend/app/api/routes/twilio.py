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
    
    # 1. WORKER COMMAND & PROXY CHAT CHECK
    clean_body = Body.strip().lower() if Body else ""
    from app.core.database import AsyncSessionLocal
    from app.models.complaint import Complaint
    from app.models.user import User
    from sqlalchemy import select, or_
    from datetime import datetime
    from app.services.twilio_service import send_whatsapp_update
    
    async with AsyncSessionLocal() as session:
        # Check sender identity
        res = await session.execute(select(User).where(User.contact_id == From))
        user = res.scalar_one_or_none()
        
        if user:
            # A. If it's a Worker Command
            if clean_body.startswith(("accept", "resolved")) and user.role == "officer":
                parts = clean_body.split()
                if len(parts) >= 2:
                    # Get the last part, assuming it's the UUID (e.g., 'accept ticket <uuid>')
                    ticket_id = parts[-1] 
                    complaint = await session.get(Complaint, ticket_id)

                    if complaint:
                        if clean_body.startswith("accept"):
                            complaint.status = "in_progress"
                            msg = f"👷 **Accepted!** You are now connected to the citizen. Any message you type here will be sent to them."
                            status_msg = f"🌟 **Great News!** Officer {user.name} has accepted your grievance.\n\n👷 They are now on their way! You can chat with them directly by typing here."
                        else:
                            complaint.status = "resolved"
                            complaint.resolved_at = datetime.utcnow()
                            user.points += 50 # Reward for solving!
                            msg = f"✅ **Resolved!** 50 AURA Points added to your profile. Great work!"
                            status_msg = f"✨ **Issue Resolved!**\n\nYour grievance (ID: {ticket_id[:8]}) has been successfully closed by Officer {user.name}. Thank you for helping improve our city!"
                        
                        await session.commit()
                        await session.refresh(complaint, ["citizen"])
                        if complaint.citizen:
                            send_whatsapp_update(complaint.citizen.contact_id, status_msg)
                        
                        resp = MessagingResponse()
                        resp.message(msg)
                        return Response(content=str(resp), media_type="application/xml")

            # B. PROXY CHAT: If there is an active in_progress ticket
            active_res = await session.execute(
                select(Complaint).where(
                    or_(Complaint.citizen_id == user.id, Complaint.officer_id == user.id),
                    Complaint.status == "in_progress"
                )
            )
            active_ticket = active_res.scalar_one_or_none()
            
            if active_ticket and not clean_body.startswith(("accept", "resolved", "status")):
                # Determine who the "other party" is
                await session.refresh(active_ticket, ["citizen", "officer"])
                other_user = active_ticket.officer if user.role == "citizen" else active_ticket.citizen
                
                if other_user and other_user.contact_id:
                    prefix = "👨‍💼 **Citizen:**" if user.role == "citizen" else "👷 **Officer:**"
                    send_whatsapp_update(other_user.contact_id, f"{prefix} {Body}")
                    
                    # We don't return here because we might want the LLM to still see it, 
                    # but for the demo, we'll just stop here to avoid confusing the Citizen with dual replies.
                    resp = MessagingResponse()
                    resp.message("📤 *Message forwarded.*")
                    return Response(content=str(resp), media_type="application/xml")

    # 2. CITIZEN FLOW (Normal Graph Processing)
    # Give the citizen points for opening a ticket!
    initial_state = {
        "original_text": Body if Body else "",
        "image_url": MediaUrl0,
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
            category = final_state.get("category", "General")
            severity = final_state.get("severity", "Low")
            ticket_id = final_state.get("complaint_id", "N/A")
            cluster_id = final_state.get("cluster_id")
            # GEO-GROUP MAPPING (Simulation for Hackathon)

            PINCODE_GROUPS = {
                "500033": "https://chat.whatsapp.com/I0vSfFlj2luDBPLMbcvEe3",
                "500001": "https://chat.whatsapp.com/EpT93gyXWYB0vBSEQRV8vr",
                "560001": "https://chat.whatsapp.com/Jy5KyRO3igjEL7W54UUjVT"
            }

            group_link = PINCODE_GROUPS.get(str(final_state.get("pincode", "")), "https://chat.whatsapp.com/AURA_General_Community")
            
            msg = f"✅ **AURA has logged your {category} complaint.**\n🎫 **Ticket ID:** {ticket_id}\n🔴 **Severity:** {severity}\n"
            if cluster_id:
                msg += "🤝 **Community Note:** Other neighbors have reported this! We've escalated the priority.\n"
            
            msg += f"\n👥 **Join your Local Community Group:**\n{group_link}"
            
            resp = MessagingResponse()
            resp.message(msg)
            return Response(content=str(resp), media_type="application/xml")


        
    except Exception as e:
        print(f"Graph execution error: {e}")
        resp = MessagingResponse()
        resp.message("⚠️ Sorry, AURA is currently undergoing maintenance. Please try again in a few minutes.")
        return Response(content=str(resp), media_type="application/xml")
