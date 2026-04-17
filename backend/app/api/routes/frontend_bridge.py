from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.complaint import Complaint
from app.models.user import User
from typing import List, Optional
import uuid

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
        role="citizen",
        language=data.get("language", "en")
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"status": "success", "user_id": str(new_user.id)}

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
    language: str = Form("en"),
    severity_hint: Optional[str] = Form("medium"),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
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
async def get_user_complaints(user_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Complaint).where(Complaint.citizen_id == str(user_id)))
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

# --- OFFICER ENDPOINTS ---

@router.get("/officer/{officer_id}/assignments")
async def get_assignments(officer_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Complaint).where(Complaint.officer_id == str(officer_id)))
    return res.scalars().all()
