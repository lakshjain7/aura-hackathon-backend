from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.post("/event")
async def discord_event_webhook():
    """
    Placeholder endpoint if utilizing Discord's HTTP endpoint for interactions.
    Normally for Discord, a persistent websocket connection via discord.py
    is run as a background task. 
    """
    return {"status": "discord listener placeholder active"}
