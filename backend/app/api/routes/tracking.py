from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI

from app.core.redis_client import get_redis
from app.core.database import AsyncSessionLocal
from app.models.checkpoint import Checkpoint
from app.models.complaint import Complaint
from app.core.config import settings

router = APIRouter()

# --- Live Location Tracking (Redis) ---

class LocationUpdate(BaseModel):
    officer_id: str
    complaint_id: str
    lat: float
    lng: float

@router.post("/ping")
async def ping_location(data: LocationUpdate, redis_client = Depends(get_redis)):
    """
    Called by the worker's device every 5-10 seconds while en route.
    Stores coordinate in Redis with a 15-minute TTL.
    """
    key = f"tracking:{data.complaint_id}"
    payload = f"{data.lat},{data.lng},{data.officer_id}"
    
    # Fire and forget into Redis, expires in 900 seconds (15 mins)
    await redis_client.setex(key, 900, payload)
    return {"status": "ok"}

@router.get("/live/{complaint_id}")
async def get_live_location(complaint_id: str, redis_client = Depends(get_redis)):
    """
    Polled by the frontend to move the dot on the map.
    """
    key = f"tracking:{complaint_id}"
    payload = await redis_client.get(key)
    
    if not payload:
        return {"active": False}
        
    lat, lng, officer_id = payload.split(",")
    return {
        "active": True,
        "lat": float(lat),
        "lng": float(lng),
        "officer_id": officer_id
    }


# --- Domino's Daily Checkpoint & AI Summarizer ---

class CheckpointSubmission(BaseModel):
    complaint_id: str
    officer_id: str
    stage: str # "arrived", "in_progress", "resolved"
    raw_notes: Optional[str] = "No notes provided."
    image_url: Optional[str] = None # Expecting a URL for the hackathon MVP

llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.OPENAI_API_KEY, temperature=0.7)

@router.post("/checkpoint")
async def create_checkpoint(data: CheckpointSubmission):
    """
    Worker uploads proof of work. Agentic brain summarizes it for the community.
    """
    
    # 1. AI Summarizer
    system_prompt = """
    You are AURA's community liaison. 
    A civic worker has just added progress notes to a public grievance. 
    Rewrite their raw, potentially technical/terse notes into a single, polite, 
    and encouraging sentence for the citizen tracker (like a Domino's pizza tracker).
    """
    
    citizen_summary = data.raw_notes
    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Worker Notes: {data.raw_notes} \n Stage: {data.stage}")
        ])
        citizen_summary = response.content.strip()
    except Exception as e:
        print(f"Summarizer failed: {e}")

    # 2. Persist to Postgres
    async with AsyncSessionLocal() as session:
        # Load complaint
        checkpoint = Checkpoint(
            complaint_id=data.complaint_id,
            stage=data.stage,
            image_url=data.image_url,
            raw_notes=data.raw_notes,
            citizen_summary=citizen_summary
        )
        session.add(checkpoint)
        
        # Update parent complaint status to match
        complaint = await session.get(Complaint, data.complaint_id)
        if complaint:
            complaint.status = data.stage
            
        await session.commit()
    
    return {
        "checkpoint_saved": True,
        "community_update": citizen_summary
    }
