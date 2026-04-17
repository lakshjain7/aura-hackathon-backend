import discord
from fastapi import APIRouter
from app.agent.graph import aura_graph
from app.core.config import settings

router = APIRouter()

# For a hackathon, we can initialize the bot globally in the router 
# or start it in main.py. Let's provide a function to handle messages.

async def process_discord_message(message: discord.Message):
    """
    Called by the Discord Bot Client when an officer or citizen pings it.
    """
    if message.author.bot:
        return

    # 1. Prepare State
    initial_state = {
        "original_text": message.content,
        "image_url": message.attachments[0].url if message.attachments else None,
        "source": "discord",
        "sender_id": str(message.author.id),
        "history": [],
        "is_safe": True
    }
    
    # 2. Invoke Graph
    try:
        final_state = await aura_graph.ainvoke(initial_state)
        
        # 3. Respond
        if not final_state.get("is_safe"):
            await message.channel.send(f"🚨 Blocked: {final_state.get('rejection_reason')}")
        else:
            category = final_state.get("category")
            severity = final_state.get("severity")
            await message.channel.send(f"📦 AURA Logged: {category} | Severity: {severity} | Status: {final_state.get('status', 'assigned')}")
            
    except Exception as e:
        print(f"Discord Graph Error: {e}")
        await message.channel.send("⚠️ AURA error processing your request.")

# Placeholder for bot initialization (should be in main.py startup)
@router.get("/status")
async def bot_status():
    return {"status": "AURA Discord Bot initialized and listening."}
