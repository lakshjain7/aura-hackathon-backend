from sqlalchemy import select
from app.models.user import User
from app.core.database import AsyncSessionLocal

async def get_or_create_user(contact_id: str, name: str = None, role: str = "citizen"):
    """
    Checks if a user exists by contact_id, else creates one.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.contact_id == contact_id))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                contact_id=contact_id,
                name=name if name else f"User {contact_id[-4:]}",
                role=role
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"New User Created: {user.name} ({user.role})")
            
        return user
