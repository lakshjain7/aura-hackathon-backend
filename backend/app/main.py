from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import twilio, sarvam, discord, stream, tracking, users, frontend_bridge
from app.core.database import engine, Base
from app.models import complaint, user, cluster, audit_log, correction, checkpoint
from app.services.discord_bot import start_discord_bot
import asyncio

app = FastAPI(
    title="AURA - Agentic Unified Resolution Architecture",
    description="FastAPI Backend for Public Grievances Platform",
    version="0.1.0",
)

@app.on_event("startup")
async def startup():
    # 1. Create DB Tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Seed Demo Users
    from app.core.users import get_or_create_user
    # Worker Phone
    await get_or_create_user(contact_id="whatsapp:+919652809593", name="Officer Laksh", role="officer")
    # Citizen Phones
    await get_or_create_user(contact_id="whatsapp:+918341137073", name="Citizen User 1", role="citizen")
    await get_or_create_user(contact_id="whatsapp:+916305219899", name="Citizen User 2", role="citizen")



    
    # 3. Start Discord Bot in background
    asyncio.create_task(start_discord_bot())





# Set up CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(twilio.router, prefix="/webhook", tags=["webhooks"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(sarvam.router, prefix="/api/sarvam", tags=["ai"])
app.include_router(discord.router, prefix="/api/discord", tags=["integrations"])
app.include_router(stream.router, prefix="/api/stream", tags=["streaming"])
app.include_router(tracking.router, prefix="/api/tracking", tags=["tracking"])
app.include_router(frontend_bridge.router, prefix="/api", tags=["frontend"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "AURA is operating normally."}
