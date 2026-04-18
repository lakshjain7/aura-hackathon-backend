import asyncio
from app.core.database import engine
from sqlalchemy import text

async def upgrade():
    print("Creating Community Activity Log...")
    async with engine.connect() as conn:
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id SERIAL PRIMARY KEY,
                    community_id VARCHAR,
                    user_name VARCHAR,
                    message TEXT,
                    type VARCHAR,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            await conn.commit()
            print("Activity Log Table Created!")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(upgrade())
