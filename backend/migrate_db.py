import asyncio
from app.core.database import engine
from sqlalchemy import text

async def migrate():
    print("Starting Database Migration...")
    async with engine.connect() as conn:
        try:
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS summary VARCHAR"))
            print("Added 'summary' column")
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS suburb VARCHAR"))
            print("Added 'suburb' column")
            await conn.commit()
            print("Database Sync Complete!")
        except Exception as e:
            print(f"Migration Error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
