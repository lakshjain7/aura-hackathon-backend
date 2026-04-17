import redis.asyncio as redis
from app.core.config import settings

REDIS_URL = settings.REDIS_URL

# Create a connection pool instead of single connection for async efficiency
redis_pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)

async def get_redis():
    """
    Dependency injection for Redis. Yields a client.
    """
    client = redis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.aclose()
