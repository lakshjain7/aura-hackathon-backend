from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer
from app.core.database import Base
from app.models.complaint import generate_uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=True)
    contact_id = Column(String, nullable=False, unique=True) # The actual phone or discord ID
    role = Column(String, default="citizen") # citizen, officer, admin, councillor
    pincode = Column(String, nullable=True) # For routing officers
    points = Column(Integer, default=0) # For reward system
    created_at = Column(DateTime, default=datetime.utcnow)


