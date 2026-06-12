import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def seed_roles():
    print("Seeding User Roles...")
    async with AsyncSessionLocal() as session:
        users_to_seed = [
            {"phone": "whatsapp:+918341137073", "name": "Citizen One", "role": "citizen"},
            {"phone": "whatsapp:+919652809593", "name": "Officer Main", "role": "officer"},
            {"phone": "whatsapp:+916305219899", "name": "Citizen Two", "role": "citizen"},
        ]
        
        for u in users_to_seed:
            res = await session.execute(select(User).where(User.contact_id == u["phone"]))
            user = res.scalar_one_or_none()
            if not user:
                user = User(contact_id=u["phone"], name=u["name"], role=u["role"])
                session.add(user)
                print(f"Created {u['role']}: {u['phone']}")
            else:
                user.role = u["role"]
                print(f"Updated {u['phone']} to {u['role']}")
        
        await session.commit()
        print("Roles Synced Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_roles())
