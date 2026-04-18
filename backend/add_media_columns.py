import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DATABASE_URL = "postgresql+asyncpg://postgres:pPcQSvYciGFiWcqARoxzbuYxjqVhCSzb@centerbeam.proxy.rlwy.net:30644/railway"

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Migrating Database: Adding media columns to 'complaints' table...")
        
        # 1. Add image_url
        try:
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN image_url VARCHAR;"))
            print("Added column: image_url")
        except Exception as e:
            err_str = str(e).lower()
            if "already exists" in err_str:
                print("Column 'image_url' already exists. Skipping.")
            else:
                print(f"Error adding 'image_url': {e}")

        # 2. Add audio_url
        try:
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN audio_url VARCHAR;"))
            print("Added column: audio_url")
        except Exception as e:
            err_str = str(e).lower()
            if "already exists" in err_str:
                print("Column 'audio_url' already exists. Skipping.")
            else:
                print(f"Error adding 'audio_url': {e}")
                
        print("\nMigration Complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
