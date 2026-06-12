import asyncio
from app.core.database import AsyncSessionLocal
from app.models.community import Community

from sqlalchemy import delete

async def seed_communities():
    print("Seeding AURA Communities...")
    
    async with AsyncSessionLocal() as session:
        # Clear existing to avoid duplicates
        await session.execute(delete(Community))
        
        communities = [
        { 
            "name": "Madhapur Ward 14 Residents", 
            "link": "https://chat.whatsapp.com/I0vSfFlj2luDBPLMbcvEe3", 
            "topic": "Sanitation & Roads", 
            "suburb": "Madhapur",
            "members_count": 342
        },
        { 
            "name": "HITEC City Civic Action", 
            "link": "https://chat.whatsapp.com/EpT93gyXWYB0vBSEQRV8vr", 
            "topic": "All Issues", 
            "suburb": "HITEC City",
            "members_count": 567
        },
        { 
            "name": "Sanitation Watch Group", 
            "link": "https://chat.whatsapp.com/Jy5KyRO3igjEL7W54UUjVT", 
            "topic": "Immediate Alerts", 
            "suburb": "Madhapur",
            "members_count": 128
        }
    ]
    
    async with AsyncSessionLocal() as session:
        for comm_data in communities:
            new_comm = Community(**comm_data)
            session.add(new_comm)
        
        await session.commit()
    
    print("Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_communities())
