from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.core.database import get_db
from app.models.complaint import Complaint
from app.models.user import User
from app.models.community import Community
from app.agent.graph import aura_graph
from typing import List, Optional
import uuid
import asyncio

router = APIRouter()

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

# --- AUTH ALIASES ---

@router.post("/auth/register")
async def register_citizen(data: dict, db: AsyncSession = Depends(get_db)):
    contact_id = f"whatsapp:+{data.get('phone')}"
    res = await db.execute(select(User).where(User.contact_id == contact_id))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already registered")
        
    new_user = User(
        name=data.get("name"),
        contact_id=contact_id,
        role=data.get("role", "citizen"),
        language=data.get("language", "en")
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"status": "success", "user_id": str(new_user.id), "role": new_user.role}

@router.post("/auth/login")
async def login_citizen(data: dict, db: AsyncSession = Depends(get_db)):
    contact_id = f"whatsapp:+{data.get('phone')}"
    res = await db.execute(select(User).where(User.contact_id == contact_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": {"id": str(user.id), "name": user.name, "role": user.role}}

# --- COMPLAINT ENDPOINTS ---

@router.post("/complaint")
async def submit_complaint(
    raw_text: str = Form(...),
    pincode: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    language: str = Form("en"),
    severity_hint: Optional[str] = Form("medium"),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    # Trigger the AURA Graph in the background
    initial_state = {
        "original_text": raw_text,
        "source": "web",
        "sender_id": "web_user",
        "pincode": pincode,
        "lat": lat,
        "lng": lng,
        "is_safe": True,
        "history": []
    }


    # Run graph and return result
    try:
        final_state = await aura_graph.ainvoke(initial_state)
        return {
            "status": "success", 
            "complaint_id": final_state.get("complaint_id"),
            "category": final_state.get("category"),
            "severity": final_state.get("severity")
        }
    except Exception as e:
        print(f"Graph execution error: {e}")
        # Fallback to simple creation if graph fails
        new_complaint = Complaint(
            raw_text=raw_text,
            pincode=pincode,
            severity=severity_hint,
            status="pending",
            source="web"
        )
        db.add(new_complaint)
        await db.commit()
        await db.refresh(new_complaint)
        return {"status": "success", "complaint_id": str(new_complaint.id)}

@router.get("/complaints")
async def get_user_complaints(user_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Complaint)
    if user_id:
        stmt = stmt.where(Complaint.citizen_id == str(user_id))
    stmt = stmt.order_by(Complaint.created_at.desc())
    res = await db.execute(stmt)
    complaints = res.scalars().all()
    return complaints

@router.get("/complaint/{complaint_id}")
async def get_complaint_detail(complaint_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Complaint).where(Complaint.id == str(complaint_id)))
    return res.scalar_one_or_none()

# --- AUTH & OTP (Demo Mode) ---

@router.post("/auth/request-otp")
async def request_otp(data: dict):
    return {"status": "success", "message": "OTP sent to " + data.get("phone")}

@router.post("/auth/verify-otp")
async def verify_otp(data: dict, db: AsyncSession = Depends(get_db)):
    if data.get("otp") == "123456" or data.get("phone"):
        contact_id = f"whatsapp:{data.get('phone')}"
        res = await db.execute(select(User).where(User.contact_id == contact_id))
        user = res.scalar_one_or_none()
        
        token = f"demo_token_{uuid.uuid4().hex}"
        return {
            "status": "success", 
            "token": token,
            "user": {"id": str(user.id) if user else None, "role": "citizen"}
        }
    raise HTTPException(status_code=400, detail="Invalid OTP")

@router.get("/user/profile")
async def get_profile(db: AsyncSession = Depends(get_db)):
    return {"name": "Demo User", "points": 150}

# --- ADMIN & CLUSTERS ---

@router.get("/admin/stats")
async def get_admin_stats():
    return {
        "total_complaints": 1240,
        "resolved": 890,
        "active_officers": 42,
        "critical_zones": 5
    }

@router.get("/activity")
async def get_activity(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10"))
    logs = res.mappings().all()
    return logs

@router.get("/clusters")
async def get_clusters_list(db: AsyncSession = Depends(get_db)):
    from app.models.cluster import Cluster
    res = await db.execute(select(Cluster))
    return res.scalars().all()

@router.get("/audit-logs")
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    from app.models.audit_log import AuditLog
    res = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50))
    return res.scalars().all()

# --- COMMUNITY ENDPOINTS ---

@router.get("/communities")
async def get_communities(suburb: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Community)
    if suburb:
        stmt = stmt.where(Community.suburb == suburb)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/communities")
async def create_community(data: dict, db: AsyncSession = Depends(get_db)):
    new_comm = Community(
        name=data.get("name"),
        link=data.get("link"),
        topic=data.get("topic") or "General",
        suburb=data.get("suburb") or "General",
        pincode=data.get("pincode"),
        members_count=1
    )
    db.add(new_comm)
    await db.commit()
    await db.refresh(new_comm)
    
    # Trigger Twilio "Agent Provisioned" message with Setup Instructions
    from app.services.twilio_service import send_whatsapp_update
    creator_phone = data.get("phone", "8341137073")

    provision_msg = (
        f"🛡️ *AURA Agent Provisioned*\n\n"
        f"I am ready to monitor *{new_comm.name}*! To activate me in the group, follow these 3 steps:\n\n"
        f"1️⃣ *Add Contact:* Add +14155238886 to your phone as 'AURA Bot'.\n"
        f"2️⃣ *Add to Group:* Invite 'AURA Bot' to your WhatsApp group.\n"
        f"3️⃣ *Activate:* Tell members to send 'join <your-keyword>' to me to start receiving alerts.\n\n"
        f"I'm standing by! 🚀"
    )
    send_whatsapp_update(f"+91{creator_phone}" if not creator_phone.startswith('+') else creator_phone, provision_msg)

    
    return new_comm

@router.post("/communities/{community_id}/join")
async def join_community(community_id: str, phone: str, db: AsyncSession = Depends(get_db)):
    # 1. Increment member count
    res = await db.execute(select(Community).where(Community.id == community_id))
    comm = res.scalar_one_or_none()
    if comm:
        comm.members_count += 1
        
        # Fetch active issues in this suburb
        issue_stmt = select(Complaint).where(Complaint.suburb == comm.suburb).limit(3)
        issues_res = await db.execute(issue_stmt)
        active_issues = issues_res.scalars().all()
        
        await db.commit()
        
        # 2. Trigger Twilio "Welcome to Community" message with briefing
        from app.services.twilio_service import send_whatsapp_update

        
        briefing = ""
        if active_issues:
            briefing = "\n\n📍 *Active Neighborhood Issues:*\n" + "\n".join([f"• {i.category}: {i.summary[:50]}..." for i in active_issues])
        
        welcome_msg = f"🌟 *AURA Community Alert*\n\nWelcome to the *{comm.name}*! I am your AI Ward Assistant.{briefing}\n\nI'll keep you posted on local issues here. To file a report, just send me a voice note!"
        send_whatsapp_update(phone if phone.startswith('+') else f"+91{phone}", welcome_msg)

        
    return {"status": "success"}

# --- OFFICER ENDPOINTS ---

@router.get("/officer/{officer_id}/assignments")
async def get_assignments(officer_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Complaint).where(Complaint.officer_id == str(officer_id)))
    return res.scalars().all()
