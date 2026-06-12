import uuid
from datetime import datetime, timedelta
from sqlalchemy import select

from app.agent.state import AgentState
from app.core.database import AsyncSessionLocal
from app.models.complaint import Complaint
from app.models.user import User
from app.core.config import settings

def map_department(category: str) -> str:
    mapping = {
        "Roads": "Public Works Dept (PWD)",
        "Water": "Water Supply Board",
        "Sanitation": "Municipal Solid Waste Management",
        "Electricity": "State Electricity Board",
        "Safety": "Local Police Department",
        "Noise": "Local Police Department"
    }
    return mapping.get(category, "General Administration")

def calculate_sla(severity: str) -> datetime:
    hours_map = {
        "Low": 72,
        "Medium": 48,
        "High": 24,
        "Critical": 4
    }
    hours = hours_map.get(severity, 48)
    return datetime.utcnow() + timedelta(hours=hours)

async def geo_routing(state: AgentState) -> AgentState:
    """
    SLA & Routing Node.
    Assigns department, worker (officer), creates the DB record, 
    and initializes the Domino's tracker flow.
    """
    node_name = "geo_routing"
    print(f"--- Entering Node: {node_name} ---")
    
    category = state.get("category", "Other")
    severity = state.get("severity", "Low")
    
    # 1. Deterministic Routing
    assigned_dept = map_department(category)
    sla_deadline = calculate_sla(severity)
    
    # 2. Assign a worker (We simulate this by picking a mock officer from the DB)
    from app.core.users import get_or_create_user
    officer_user = await get_or_create_user(contact_id="AURA_OFFICER_01", role="officer")
    assigned_officer_id = officer_user.id
    
    # 3. Get or Create Citizen
    citizen_user = await get_or_create_user(contact_id=state.get("sender_id", "web_user"))
    
    # 4. Create/Update DB Record
    complaint_id = str(uuid.uuid4())
    is_duplicate = state.get("is_duplicate", False)
    missing_info = state.get("missing_info", False)

    if missing_info:
        print("Routing Skipped: Missing critical info.")
        return {**state, "complaint_id": "MISSING_INFO", "status": "info_required"}

    if is_duplicate:
        print(f"Routing Skipped: Duplicate report for cluster {state.get('cluster_id')}")
        return {**state, "complaint_id": f"DUP_{state.get('cluster_id')[:8]}", "status": "duplicate_linked"}

    try:
        async with AsyncSessionLocal() as session:

            new_complaint = Complaint(
                id=complaint_id,
                raw_text=state.get("original_text", ""),
                anonymised_text=state.get("translated_text", ""),
                category=category,
                severity=severity,
                confidence=state.get("confidence_score", 1.0),
                department=assigned_dept,
                status="assigned", 
                officer_id=assigned_officer_id,
                citizen_id=citizen_user.id,
                source=state.get("source"),
                lat=state.get("lat"),
                lng=state.get("lng"),
                pincode=state.get("pincode"),
                image_url=state.get("image_url"),
                audio_url=state.get("audio_url")
            )

            session.add(new_complaint)
            await session.commit()
            print(f"Complaint {complaint_id} saved to DB. Citizen: {citizen_user.name}, Officer: {officer_user.name}")

            # 5. GLOBAL NOTIFICATION: Discord
            try:
                from app.services.discord_bot import client
                for guild in client.guilds:
                    channel = next((c for c in guild.text_channels if c.name == "grievances"), guild.text_channels[0])
                    if channel:
                        await channel.send(
                            f"🚨 **NEW GRIEVANCE RECEIVED** ({state.get('source', 'Unknown')})\n"
                            f"📁 **Category:** {category}\n"
                            f"🔴 **Severity:** {severity}\n"
                            f"📝 **Issue:** {state.get('original_text')}\n"
                            f"🎫 **Ticket ID:** `{complaint_id}`\n"
                            f"---"
                        )
            except Exception as e:
                print(f"Global Discord Notification Error: {e}")

            # 6. OFFICER WHATSAPP ALERT
            try:
                from app.services.twilio_service import send_whatsapp_update
                officer_msg = (
                    f"👮 *AURA OFFICER ALERT*\n\n"
                    f"New Ticket: *{complaint_id[:8]}*\n"
                    f"Category: {category}\n"
                    f"Severity: {severity}\n"
                    f"Issue: {state.get('original_text')[:100]}...\n\n"
                    f"Reply with `!accept {complaint_id}` to take charge."
                )
                print(f"DEBUG: Sending Officer Alert to {settings.ADMIN_PHONE}")
                send_whatsapp_update(settings.ADMIN_PHONE, officer_msg)
            except Exception as e:
                print(f"Officer WhatsApp Notification Error: {e}")



    except Exception as e:
        print(f"Database Routing Error: {e}")

    # 4. Update State
    return {
        **state,
        "department": assigned_dept,
        "sla_deadline": sla_deadline.isoformat(),
        "complaint_id": complaint_id,
        "current_node": node_name,
        "history": state.get("history", []) + [f"Routed to {assigned_dept}. Officer Assigned: {assigned_officer_id}."]
    }
