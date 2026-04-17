import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# Support falling back to sqlite if postgres is not available during dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./aura.db")

# For asyncpg, the URL should typically look like: postgresql+asyncpg://user:pass@host/db
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
