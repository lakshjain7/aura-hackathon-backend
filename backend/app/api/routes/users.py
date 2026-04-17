from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.users import get_or_create_user

router = APIRouter()

class RegisterRequest(BaseModel):
    phone: str # format: +919652809593
    name: str
    role: str # "citizen" or "officer"
    pincode: str = None

@router.post("/register")
async def register_user(req: RegisterRequest):
    """
    Streamlined registration for the Frontend.
    Converts raw phone numbers to WhatsApp format and saves to DB.
    """
    # Standardize to WhatsApp format
    contact_id = f"whatsapp:{req.phone}" if not req.phone.startswith("whatsapp:") else req.phone
    
    try:
        user = await get_or_create_user(
            contact_id=contact_id,
            name=req.name,
            role=req.role
        )
        # Update pincode if provided
        if req.pincode:
            from app.core.database import AsyncSessionLocal
            from app.models.user import User
            from sqlalchemy import select
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(User).where(User.contact_id == contact_id))
                u = res.scalar_one()
                u.pincode = req.pincode
                await session.commit()
                
        return {"status": "success", "message": f"User {req.name} registered as {req.role}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
