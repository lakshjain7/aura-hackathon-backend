import asyncio
from sqlalchemy import text
from app.core.database import engine

async def reset_database():
    print("Connecting to Railway to wipe tables...")
    try:
        async with engine.begin() as conn:
            # We use CASCADE to ensure we drop tables even if they have relationships
            await conn.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE;"))
            await conn.execute(text("DROP TABLE IF EXISTS corrections CASCADE;"))
            await conn.execute(text("DROP TABLE IF EXISTS complaints CASCADE;"))
            await conn.execute(text("DROP TABLE IF EXISTS clusters CASCADE;"))
            await conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
            await conn.execute(text("DROP TABLE IF EXISTS checkpoints CASCADE;"))
            print("All tables dropped successfully!")
    except Exception as e:
        print(f"Error dropping tables: {e}")

if __name__ == "__main__":

    asyncio.run(reset_database())
